/**
 * ESPN NBA integration — live roster fetching for the current era.
 *
 * Maps our internal team IDs (1-30, matching BallDontLie) to ESPN team IDs.
 * Used by fetchNBAPlayers when era.startYear >= LIVE_ERA_THRESHOLD so that
 * trade news is reflected automatically without any code deploys.
 *
 * Cache strategy: Next.js ISR with revalidate=21600 (6 hrs).
 * A Vercel cron job at /api/cron/nba-refresh pre-warms the cache every 6 hrs.
 */

import type { Player, HistoricalTeam, Era } from '../types';
import { computePlayerScore } from '../algorithms/powerRating';

/** Internal team id → ESPN team id */
export const ESPN_TEAM_ID: Record<string, number> = {
  '1':  1,   // ATL Hawks
  '2':  2,   // BOS Celtics
  '3':  17,  // BKN Nets
  '4':  30,  // CHA Hornets
  '5':  4,   // CHI Bulls
  '6':  5,   // CLE Cavaliers
  '7':  6,   // DAL Mavericks
  '8':  7,   // DEN Nuggets
  '9':  8,   // DET Pistons
  '10': 9,   // GSW Warriors
  '11': 10,  // HOU Rockets
  '12': 11,  // IND Pacers
  '13': 12,  // LAC Clippers
  '14': 13,  // LAL Lakers
  '15': 29,  // MEM Grizzlies
  '16': 14,  // MIA Heat
  '17': 15,  // MIL Bucks
  '18': 16,  // MIN Timberwolves
  '19': 3,   // NOP Pelicans
  '20': 18,  // NYK Knicks
  '21': 25,  // OKC Thunder
  '22': 19,  // ORL Magic
  '23': 20,  // PHI 76ers
  '24': 21,  // PHX Suns
  '25': 22,  // POR Trail Blazers
  '26': 23,  // SAC Kings
  '27': 24,  // SAS Spurs
  '28': 28,  // TOR Raptors
  '29': 26,  // UTA Jazz
  '30': 27,  // WAS Wizards
};

/** Eras from this start year onward are fetched live from ESPN. */
export const LIVE_ERA_THRESHOLD = 2020;

type ESPNAthlete = {
  id: string;
  fullName: string;
  position?: { abbreviation: string };
  statistics?: { splits?: { categories?: Array<{ labels: string[]; stats: number[] }> } };
};

type ESPNRosterResponse = {
  athletes?: ESPNAthlete[];
};

/** Map ESPN position abbreviations to our position types */
function normalizePosition(espnPos: string): Player['position'] {
  const p = espnPos.toUpperCase();
  if (p === 'PG' || p === 'G') return 'PG';
  if (p === 'SG' || p === 'G-F') return 'SG';
  if (p === 'SF' || p === 'F-G' || p === 'F') return 'SF';
  if (p === 'PF' || p === 'F-C') return 'PF';
  if (p === 'C') return 'C';
  return 'SF'; // default
}

/**
 * Generate realistic per-game stats for a current player by position.
 * Stats are seeded by player ID so they're stable across renders.
 * These are used when we have real names but no live stat feed.
 */
function generateCurrentStats(playerId: string, position: Player['position'], rank: number): Player['stats'] {
  const seed = playerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const tier = rank < 3 ? 1.0 : rank < 7 ? 0.75 : 0.5; // stars get better stats

  const base = {
    PG: { pts: 18, reb: 4,  ast: 7,  stl: 1.3, blk: 0.3, fg: 0.455, tp: 0.368, ft: 0.830 },
    SG: { pts: 20, reb: 4,  ast: 4,  stl: 1.2, blk: 0.4, fg: 0.465, tp: 0.375, ft: 0.855 },
    SF: { pts: 19, reb: 6,  ast: 3,  stl: 1.0, blk: 0.6, fg: 0.470, tp: 0.360, ft: 0.800 },
    PF: { pts: 17, reb: 8,  ast: 2,  stl: 0.8, blk: 1.0, fg: 0.520, tp: 0.320, ft: 0.770 },
    C:  { pts: 14, reb: 10, ast: 2,  stl: 0.7, blk: 1.8, fg: 0.550, tp: 0.150, ft: 0.720 },
  };

  const b = base[position as keyof typeof base] ?? base['SF'];
  const variance = (seed % 100) / 100; // 0–1 deterministic variation

  return {
    points:       parseFloat((b.pts * tier + variance * 8).toFixed(1)),
    rebounds:     parseFloat((b.reb + variance * 3).toFixed(1)),
    assists:      parseFloat((b.ast + variance * 2).toFixed(1)),
    steals:       parseFloat((b.stl + variance * 0.5).toFixed(1)),
    blocks:       parseFloat((b.blk + variance * 0.8).toFixed(1)),
    fieldGoalPct: parseFloat((b.fg  + (seed % 7) / 100).toFixed(3)),
    threePointPct:parseFloat((b.tp  + (seed % 5) / 100).toFixed(3)),
    freeThrowPct: parseFloat((b.ft  + (seed % 9) / 100).toFixed(3)),
  };
}

/**
 * Fetch the current live roster for a team from ESPN.
 * Returns null on any network / parse failure so caller can fall back.
 */
export async function fetchESPNCurrentRoster(
  team: HistoricalTeam,
  era: Era,
): Promise<Player[] | null> {
  const espnId = ESPN_TEAM_ID[team.id];
  if (!espnId) return null;

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnId}/roster`;
    const res = await fetch(url, {
      next: { revalidate: 21600 }, // Next.js ISR — revalidate every 6 hours
      headers: { 'User-Agent': 'GodSquadGame/1.0' },
    });

    if (!res.ok) return null;

    const data: ESPNRosterResponse = await res.json();
    const athletes = data.athletes ?? [];

    if (athletes.length === 0) return null;

    // Deduplicate by name, normalize positions, assign realistic stats
    const seen = new Set<string>();
    const players: Player[] = [];

    athletes.forEach((athlete, rank) => {
      const name = athlete.fullName?.trim();
      if (!name || seen.has(name)) return;
      seen.add(name);

      const pos = normalizePosition(athlete.position?.abbreviation ?? 'F');
      const stats = generateCurrentStats(athlete.id, pos, rank);

      const p: Player = {
        id: `nba-espn-${team.id}-${athlete.id}`,
        name,
        position: pos,
        positionGroup: 'offense',
        eraId: era.id,
        teamId: team.id,
        yearsWithTeam: `${era.startYear}–${era.endYear}`,
        stats,
        playerScore: 0,
      };
      p.playerScore = computePlayerScore(p, 'nba');
      players.push(p);
    });

    return players.sort((a, b) => b.playerScore - a.playerScore);
  } catch {
    return null;
  }
}
