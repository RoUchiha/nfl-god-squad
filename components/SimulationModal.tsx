'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlayerSeasonStatLine, PlayoffBracket, PlayoffGame, PlayoffSeed, SeasonResults } from '@/lib/types';
import { SPORT_CONFIG, getEraName } from '@/lib/constants';
import { getNflTeamById } from '@/lib/sports/nfl-teams';

interface Props {
  results: SeasonResults;
  onClose: () => void;
  onNewGame: () => void;
  onResimulate: () => void;
  canResimulate: boolean;
  isResimulating: boolean;
}

export default function SimulationModal({
  results,
  onClose,
  onNewGame,
  onResimulate,
  canResimulate,
  isResimulating,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cfg = SPORT_CONFIG[results.sport];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`
          relative w-full max-w-4xl rounded-2xl overflow-hidden
          bg-[#111] border
          ${results.isUndefeated ? 'border-red-500 celebrate' : 'border-white/10'}
          animate-bounce-in
        `}
      >
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${cfg.primaryColor}, ${cfg.accentColor})` }} />

        <div className="p-6 max-h-[88vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 text-lg">✕</button>

          {/* Achievement headline */}
          <div className="text-center mb-6">
            <div className={`text-2xl font-black mb-1 ${results.isUndefeated ? 'text-red-400' : 'text-white'}`}>
              {results.achievement}
            </div>
            <div className="text-gray-400 text-sm">{results.achievementSubtext}</div>
          </div>

          {/* Record + GSPR */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-5xl font-black text-white tabular-nums">{results.recordLabel}</div>
              <div className="text-xs text-gray-600 mt-1 uppercase tracking-wider">Season Record</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black tabular-nums" style={{
                color: results.teamPower.gspr >= 950 ? '#ff4444'
                  : results.teamPower.gspr >= 850 ? '#ffd700'
                  : results.teamPower.gspr >= 700 ? '#a855f7'
                  : '#6b7280'
              }}>
                {results.teamPower.gspr}
              </div>
              <div className="text-xs text-gray-600 mt-1 uppercase tracking-wider">GSPR</div>
            </div>
          </div>

          <SeasonBar games={results.games} />

          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatBox label="Win %" value={`${(results.wins / results.totalGames * 100).toFixed(1)}%`} />
            <StatBox label="Streak" value={`W${results.longestWinStreak}`} />
            <StatBox label="Games" value={String(results.totalGames)} />
          </div>

          {(results.compositionAnalysis?.pros.length || results.compositionAnalysis?.cons.length) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <InsightBox label="Why It Worked" lines={results.compositionAnalysis?.pros ?? []} />
              <InsightBox label="Pressure Points" lines={results.compositionAnalysis?.cons ?? []} />
            </div>
          ) : null}

          <div className="mt-4 p-3 bg-black/30 rounded-lg">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Team Breakdown</div>
            <div className="grid grid-cols-2 gap-1">
              {results.teamPower.breakdown.map((line, i) => (
                <div key={i} className="text-xs text-gray-400">{line}</div>
              ))}
            </div>
          </div>

          {results.playoffs && (
            <PlayoffPicture
              playoffs={results.playoffs}
              customSeed={results.customSeed}
              baselineLabel={results.baselineLabel}
              accent={cfg.accentColor}
            />
          )}

          {results.rosterStats && results.rosterStats.length > 0 && (
            <RosterProductionSheet rosterStats={results.rosterStats} />
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 mt-5">
            <button onClick={onNewGame} className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors">
              New Game
            </button>
            <button
              onClick={onResimulate}
              disabled={!canResimulate}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${
                canResimulate
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  : 'bg-black/20 text-gray-600 border-white/5 cursor-not-allowed'
              }`}
            >
              {isResimulating ? 'Re-Simulating...' : 'Re-Simulate'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.accentColor})` }}
            >
              Back to Roster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Roster production stat sheet ─────────────────────────────────────────────

const POS_ACCENT: Record<string, string> = {
  QB: '#f59e0b', RB: '#22c55e', WR: '#38bdf8', TE: '#a855f7', OL: '#9ca3af', DEF: '#ef4444', K: '#2dd4bf',
};

function fmtNum(n: number | undefined): string {
  if (n === undefined) return '—';
  return n >= 1000 ? n.toLocaleString('en-US') : String(n);
}

function statCells(p: PlayerSeasonStatLine): { value: string; label: string }[] {
  switch (p.position) {
    case 'QB':
      return [
        { value: fmtNum(p.passingYards), label: 'Pass Yds' },
        { value: fmtNum(p.passingTDs), label: 'Pass TD' },
      ];
    case 'RB':
      return [
        { value: fmtNum(p.rushingYards), label: 'Rush Yds' },
        { value: fmtNum(p.rushingTDs), label: 'Rush TD' },
        { value: fmtNum(p.receptions), label: 'Rec' },
      ];
    case 'WR':
    case 'TE':
      return [
        { value: fmtNum(p.receptions), label: 'Rec' },
        { value: fmtNum(p.receivingYards), label: 'Rec Yds' },
        { value: fmtNum(p.receivingTDs), label: 'Rec TD' },
      ];
    case 'OL':
      return [{ value: fmtNum(p.sacksAllowed), label: 'Sacks Allowed' }];
    case 'DEF':
      return [
        { value: fmtNum(p.pointsAllowed), label: 'Pts Allowed' },
        { value: fmtNum(p.sacks), label: 'Sacks' },
        { value: fmtNum(p.takeaways), label: 'Takeaways' },
      ];
    case 'K':
      return [
        { value: p.fieldGoalPct != null ? `${Math.round(p.fieldGoalPct * 100)}%` : '—', label: 'FG%' },
        { value: fmtNum(p.fieldGoalsMade), label: 'FG' },
      ];
    default:
      return [{ value: String(Math.round(p.playerScore)), label: 'Rating' }];
  }
}

function ratingColor(score: number): string {
  if (score >= 90) return '#ffd700';
  if (score >= 80) return '#a855f7';
  if (score >= 70) return '#3b82f6';
  return '#9ca3af';
}

function StatRow({ p }: { p: PlayerSeasonStatLine }) {
  const accent = POS_ACCENT[p.position] ?? '#9ca3af';
  const team = getNflTeamById(p.teamId);
  const era = getEraName(p.eraId);
  const cells = statCells(p);
  return (
    <div
      className="flex items-center gap-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors pl-2 pr-3 py-2 border-l-2"
      style={{ borderLeftColor: accent }}
    >
      <span
        className="text-[10px] font-black uppercase tracking-wider w-9 text-center flex-shrink-0"
        style={{ color: accent }}
      >
        {p.position}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">{p.name}</span>
          <span
            className="text-[11px] font-black tabular-nums flex-shrink-0"
            style={{ color: ratingColor(p.playerScore) }}
          >
            {Math.round(p.playerScore)}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 truncate">
          {team ? `${team.city} ${team.name}` : p.slotLabel}
          {era && <span className="text-gray-600"> · {era}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {cells.map(c => (
          <div key={c.label} className="text-right min-w-[44px]">
            <div className="text-sm font-bold text-white tabular-nums leading-none">{c.value}</div>
            <div className="text-[9px] text-gray-600 uppercase tracking-wide mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RosterProductionSheet({ rosterStats }: { rosterStats: PlayerSeasonStatLine[] }) {
  const skill = rosterStats.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position));
  const units = rosterStats.filter(p => ['OL', 'DEF', 'K'].includes(p.position));
  return (
    <div className="mt-4 rounded-xl bg-black/30 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <div className="text-xs text-gray-300 font-bold uppercase tracking-wider">Roster Production</div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wider">Projected Season</div>
      </div>
      <div className="p-2 space-y-2.5">
        {skill.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-1">Skill Players</div>
            <div className="space-y-1">{skill.map(p => <StatRow key={p.playerId} p={p} />)}</div>
          </div>
        )}
        {units.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-1">Trenches &amp; Defense</div>
            <div className="space-y-1">{units.map(p => <StatRow key={p.playerId} p={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Playoff picture ──────────────────────────────────────────────────────────

function SeedRow({ seed }: { seed: PlayoffSeed }) {
  const custom = seed.isCustomTeam;
  return (
    <div
      className={`grid grid-cols-[20px_1fr_auto] items-center gap-2 rounded px-2 py-1 text-xs ${
        custom ? 'bg-yellow-500/15 text-yellow-300 font-bold ring-1 ring-yellow-500/40' : 'text-gray-300'
      }`}
    >
      <span className="tabular-nums text-gray-500 text-center">{seed.seed}</span>
      <span className="truncate">{custom ? '★ God Squad' : `${seed.city} ${seed.name}`}</span>
      <span className="tabular-nums text-gray-500">{seed.wins}-{seed.losses}</span>
    </div>
  );
}

function customClass(g: PlayoffGame): string {
  const isCustom = g.home.isCustomTeam || g.away.isCustomTeam;
  return isCustom ? 'ring-1 ring-yellow-500/40 bg-yellow-500/[0.06]' : 'bg-white/[0.02]';
}

function GameRow({ g }: { g: PlayoffGame }) {
  const homeWon = g.winnerId === g.home.teamId;
  const label = (s: PlayoffSeed) => s.isCustomTeam ? 'GOD' : s.abbreviation;
  return (
    <div className={`flex items-center justify-between rounded px-2 py-1 text-xs ${customClass(g)}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`tabular-nums ${homeWon ? 'text-gray-500' : 'text-white font-bold'}`}>
          ({g.away.seed}) {label(g.away)} {g.awayScore}
        </span>
        <span className="text-gray-600">@</span>
        <span className={`tabular-nums ${homeWon ? 'text-white font-bold' : 'text-gray-500'}`}>
          ({g.home.seed}) {label(g.home)} {g.homeScore}
        </span>
      </div>
    </div>
  );
}

function PlayoffPicture({
  playoffs, customSeed, baselineLabel, accent,
}: { playoffs: PlayoffBracket; customSeed?: number; baselineLabel?: string; accent: string }) {
  const wonIt = playoffs.champion.isCustomTeam;
  return (
    <div className="mt-4 rounded-xl bg-black/30 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <div className="text-xs text-gray-300 font-bold uppercase tracking-wider">Playoff Picture</div>
        {baselineLabel && <div className="text-[10px] text-gray-600">{baselineLabel}</div>}
      </div>

      {/* God Squad result banner */}
      <div className="px-3 pt-3">
        <div
          className={`rounded-lg px-3 py-2.5 text-sm font-bold flex items-center justify-between ${
            wonIt ? 'bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/40' : 'bg-white/[0.03] text-gray-200'
          }`}
        >
          <span>{playoffs.customMadePlayoffs && customSeed ? `#${customSeed} seed` : 'On the outside'}</span>
          <span>{playoffs.customResult}</span>
        </div>
      </div>

      {/* Conference seeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
        <div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 px-2">AFC Seeds</div>
          <div className="space-y-0.5">{playoffs.afcSeeds.map(s => <SeedRow key={s.teamId} seed={s} />)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 px-2">NFC Seeds</div>
          <div className="space-y-0.5">{playoffs.nfcSeeds.map(s => <SeedRow key={s.teamId} seed={s} />)}</div>
        </div>
      </div>

      {/* Bracket */}
      <div className="px-3 pb-3 space-y-2">
        {playoffs.rounds.map(round => (
          <div key={round.name}>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 px-1">{round.name}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {round.games.map((g, i) => <GameRow key={i} g={g} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Champion */}
      <div
        className="mx-3 mb-3 rounded-lg px-3 py-2.5 text-center"
        style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }}
      >
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Super Bowl Champion</div>
        <div className={`text-lg font-black ${playoffs.champion.isCustomTeam ? 'text-yellow-300' : 'text-white'}`}>
          🏆 {playoffs.champion.isCustomTeam ? 'God Squad' : `${playoffs.champion.city} ${playoffs.champion.name}`}
        </div>
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function SeasonBar({ games }: { games: SeasonResults['games'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const small = games.length > 100;
  const n = games.length;
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1.5">
        Season results <span className="text-gray-700">· hover a game for the final score</span>
      </div>
      <div className="flex gap-[2px] flex-wrap">
        {games.map((g, i) => {
          const isHovered = hovered === g.gameNumber;
          // Anchor the tooltip so the first/last bars don't clip off the edge.
          const anchor = i <= 1 ? 'left-0' : i >= n - 2 ? 'right-0' : 'left-1/2 -translate-x-1/2';
          return (
            <div
              key={g.gameNumber}
              className="relative rounded-[2px] cursor-help transition-transform"
              style={{
                width: small ? '4px' : '6px',
                height: small ? '10px' : '14px',
                backgroundColor: g.win ? '#22c55e' : '#ef4444',
                opacity: isHovered ? 1 : 0.85,
                transform: isHovered ? 'scaleY(1.3)' : undefined,
                outline: isHovered ? '1px solid rgba(255,255,255,0.6)' : undefined,
              }}
              onMouseEnter={() => setHovered(g.gameNumber)}
              onMouseLeave={() => setHovered(h => (h === g.gameNumber ? null : h))}
              aria-label={`Game ${g.gameNumber}: ${g.win ? 'Win' : 'Loss'} ${g.teamScore ?? 0}-${g.opponentScore ?? 0} ${g.isHome ? 'vs' : 'at'} ${g.opponentAbbreviation ?? g.opponentTier}`}
            >
              {isHovered && (
                <div className={`absolute bottom-full z-20 mb-1.5 ${anchor} whitespace-nowrap rounded-md border border-white/15 bg-black/95 px-2.5 py-1.5 text-center shadow-xl`}>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Game {g.gameNumber} · {g.isHome ? 'Home' : 'Away'}
                  </div>
                  <div className="text-sm font-black tabular-nums" style={{ color: g.win ? '#22c55e' : '#ef4444' }}>
                    {g.win ? 'W' : 'L'} {g.teamScore ?? 0}–{g.opponentScore ?? 0}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {g.isHome ? 'vs' : '@'} {g.opponentAbbreviation ?? g.opponentName ?? g.opponentTier} · {g.opponentTier}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 bg-black/30 rounded-lg">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function InsightBox({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="p-3 bg-black/30 rounded-lg">
      <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">{label}</div>
      {lines.length === 0 ? (
        <div className="text-xs text-gray-600">No major notes.</div>
      ) : (
        <div className="space-y-1">
          {lines.map(line => <div key={line} className="text-xs text-gray-400">{line}</div>)}
        </div>
      )}
    </div>
  );
}
