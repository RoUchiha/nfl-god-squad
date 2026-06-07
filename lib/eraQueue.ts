/**
 * Client-side era queue — the ONLY source of truth for which team+era to show next.
 *
 * Builds a shuffled list of EVERY valid team+era combo for a given sport.
 * Popping from this list guarantees:
 *   - Every franchise appears before any franchise repeats
 *   - Every era appears at most once per game
 *   - Truly equal distribution across all teams
 *
 * This replaces server-side random selection which suffered from the birthday
 * paradox: with 30 teams and random picks, ~84% chance of a repeat in 10 picks.
 */

import type { Sport, Era, HistoricalTeam } from './types';
import { generateTeamEras } from './constants';
import { NBA_TEAMS } from './sports/nba';
import { NFL_TEAMS } from './sports/nfl';
import { MLB_TEAMS } from './sports/mlb';
import { NHL_TEAMS } from './sports/nhl';
import { EPL_TEAMS, WCUP_TEAMS } from './sports/soccer';

export type EraQueueItem = { team: HistoricalTeam; era: Era };

const TEAMS_BY_SPORT: Record<Sport, HistoricalTeam[]> = {
  nba: NBA_TEAMS,
  nfl: NFL_TEAMS,
  mlb: MLB_TEAMS,
  nhl: NHL_TEAMS,
  epl: EPL_TEAMS,
  wcup: WCUP_TEAMS,
};

/** Fisher-Yates shuffle — unbiased O(n) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns a shuffled array of ALL team+era combos for a sport.
 * NBA:  30 teams × ~11 eras = ~330 combos
 * NFL:  32 teams × ~11 eras = ~352 combos
 * MLB:  30 teams × ~21 eras = ~630 combos  (starts 1920)
 * NHL:  32 teams × ~11 eras = ~352 combos
 */
export function buildEraQueue(sport: Sport): EraQueueItem[] {
  const teams = TEAMS_BY_SPORT[sport];
  const combos: EraQueueItem[] = teams.flatMap(team =>
    generateTeamEras(team).map(era => ({ team, era }))
  );
  return shuffle(combos);
}

/**
 * For rerolls: find the next item in the remaining queue where the team
 * differs from `excludeTeamId`. Splices it to the front of the remaining
 * queue and returns it, or returns null if nothing is available.
 */
export function rerollTeam(
  queue: EraQueueItem[],
  excludeTeamId: string,
): { item: EraQueueItem; newQueue: EraQueueItem[] } | null {
  const idx = queue.findIndex(item => item.team.id !== excludeTeamId);
  if (idx === -1) return null;
  const newQueue = [...queue];
  const [item] = newQueue.splice(idx, 1);
  return { item, newQueue };
}

/**
 * For era rerolls: find next item with a different era (but same team is OK).
 * Splices it to the front and returns it.
 */
export function rerollEra(
  queue: EraQueueItem[],
  excludeEraId: string,
): { item: EraQueueItem; newQueue: EraQueueItem[] } | null {
  const idx = queue.findIndex(item => item.era.id !== excludeEraId);
  if (idx === -1) return null;
  const newQueue = [...queue];
  const [item] = newQueue.splice(idx, 1);
  return { item, newQueue };
}
