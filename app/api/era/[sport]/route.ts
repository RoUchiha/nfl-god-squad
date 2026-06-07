import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Sport, EraResponse, HistoricalTeam, Era } from '@/lib/types';
import { generateTeamEras } from '@/lib/constants';
import { MLB_TEAMS } from '@/lib/sports/mlb';
import { NHL_TEAMS } from '@/lib/sports/nhl';
import { NBA_TEAMS } from '@/lib/sports/nba';
import { NFL_TEAMS } from '@/lib/sports/nfl';
import { EPL_TEAMS, WCUP_TEAMS, SOCCER_CURATED_ERA_KEYS } from '@/lib/sports/soccer';

const TEAMS_BY_SPORT: Record<Sport, HistoricalTeam[]> = {
  mlb: MLB_TEAMS,
  nhl: NHL_TEAMS,
  nba: NBA_TEAMS,
  nfl: NFL_TEAMS,
  epl: EPL_TEAMS,
  wcup: WCUP_TEAMS,
};

const ParamsSchema = z.object({
  sport: z.enum(['nba', 'nfl', 'mlb', 'nhl', 'epl', 'wcup']),
});

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fisher-Yates shuffle — unbiased, covers all teams in one pass (no birthday-paradox repeats)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseSoccerCuratedKey(key: string): { teamId: string; eraId: string } | null {
  // key format: "mu-epl-mu-1997"  →  teamId="mu", eraId="epl-mu-1997"
  const dashIdx = key.indexOf('-');
  if (dashIdx === -1) return null;
  return { teamId: key.slice(0, dashIdx), eraId: key.slice(dashIdx + 1) };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sport: string } }
) {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid sport. Must be one of: nba, nfl, mlb, nhl, epl, wcup' },
      { status: 400 }
    );
  }

  const sport = parsed.data.sport as Sport;
  const teams = TEAMS_BY_SPORT[sport];

  const { searchParams } = new URL(req.url);

  // Comma-separated era IDs already used this game — never repeat exact era
  const excludeErasRaw = searchParams.get('exclude') ?? '';
  const excludeEraSet = new Set(excludeErasRaw.split(',').map(s => s.trim()).filter(Boolean));

  // Comma-separated team IDs already used — prefer fresh teams first
  const excludeTeamsRaw = searchParams.get('excludeTeams') ?? '';
  const excludeTeamSet = new Set(excludeTeamsRaw.split(',').map(s => s.trim()).filter(Boolean));

  if (sport === 'epl' || sport === 'wcup') {
    // Prefer unused teams first, then unused eras from used teams, then anything
    const prioritized = shuffle(SOCCER_CURATED_ERA_KEYS).sort((a, b) => {
      const pa = parseSoccerCuratedKey(a);
      const pb = parseSoccerCuratedKey(b);
      const aTeamUsed = pa ? excludeTeamSet.has(pa.teamId) : true;
      const bTeamUsed = pb ? excludeTeamSet.has(pb.teamId) : true;
      if (aTeamUsed !== bTeamUsed) return aTeamUsed ? 1 : -1;
      return 0;
    });

    for (const key of prioritized) {
      const p = parseSoccerCuratedKey(key);
      if (!p) continue;
      if (excludeEraSet.has(p.eraId)) continue;
      const team = teams.find(t => t.id === p.teamId);
      if (!team) continue;
      const eras = generateTeamEras(team);
      const era = eras.find(e => e.id === p.eraId);
      if (era) {
        return NextResponse.json({ era, team } as EraResponse, { headers: { 'Cache-Control': 'no-store' } });
      }
    }
    // Fallback: any unused era
    for (const key of shuffle(SOCCER_CURATED_ERA_KEYS)) {
      const p = parseSoccerCuratedKey(key);
      if (!p || excludeEraSet.has(p.eraId)) continue;
      const team = teams.find(t => t.id === p.teamId);
      if (!team) continue;
      const eras = generateTeamEras(team);
      const era = eras.find(e => e.id === p.eraId);
      if (era) return NextResponse.json({ era, team } as EraResponse, { headers: { 'Cache-Control': 'no-store' } });
    }
    const team = pickRandom(teams);
    const eras = generateTeamEras(team);
    return NextResponse.json({ era: pickRandom(eras), team } as EraResponse, { headers: { 'Cache-Control': 'no-store' } });
  }

  // ── Phase 1: teams not yet seen this game ────────────────────────────────
  const freshTeams = shuffle(teams).filter(t => !excludeTeamSet.has(t.id));
  for (const candidate of freshTeams) {
    const eras = generateTeamEras(candidate);
    const available = eras.filter(e => !excludeEraSet.has(e.id));
    if (available.length > 0) {
      return NextResponse.json(
        { era: pickRandom(available), team: candidate } as EraResponse,
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  // ── Phase 2: teams already seen, but unused era ──────────────────────────
  for (const candidate of shuffle(teams)) {
    const eras = generateTeamEras(candidate);
    const available = eras.filter(e => !excludeEraSet.has(e.id));
    if (available.length > 0) {
      return NextResponse.json(
        { era: pickRandom(available), team: candidate } as EraResponse,
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  // ── Phase 3: pool fully exhausted — pick anything ───────────────────────
  const team = pickRandom(teams);
  const eras = generateTeamEras(team);
  return NextResponse.json(
    { era: pickRandom(eras), team } as EraResponse,
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
