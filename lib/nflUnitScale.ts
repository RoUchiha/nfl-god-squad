import type { PlayerStats } from './types';

// ─── Era-relative unit scaling ────────────────────────────────────────────────
// The O-line and team Defense are scored relative to the AVERAGE unit of their
// era: an average unit lands on the 82 baseline, and a unit scales up or down
// from there by how far its box-score strength beats (or trails) the mean of all
// units in that 5-year era window.
//
// The per-era means below were precomputed offline from the app's generated unit
// dataset (NFLVERSE_GENERATED_UNITS, 31–32 teams per era) using the exact
// rawDefenseStrength / rawOlineStrength formulas in this file. Baking them as a
// constant keeps the heavy dataset out of the client bundle (this module is
// imported by the live GSPR meter) while preserving the "average == 82" property.

export const UNIT_BASELINE = 82;
const DEF_SENSITIVITY = 0.55;
const OL_SENSITIVITY = 0.5;

const DEF_ERA_MEAN: Record<number, number> = {
  1995: 50.64, 2000: 56.31, 2005: 45.91, 2010: 52.39, 2015: 52.88, 2020: 52.44,
};
const OL_ERA_MEAN: Record<number, number> = {
  1995: 6.43, 2000: 15.26, 2005: 17.06, 2010: 16.07, 2015: 16.03, 2020: 15.59,
};
// Eras before 1995 (and any without a generated sample) center on the all-era mean.
const DEF_GLOBAL_MEAN = 51.77;
const OL_GLOBAL_MEAN = 14.45;

// Higher = stronger. Box-score only (roster pedigree handled separately as buffs)
// so the era mean reflects scheme/production, not Hall-of-Fame headcount.
export function rawDefenseStrength(s: PlayerStats): number {
  const pa = s.pointsAllowed ?? 350;
  const ya = s.yardsAllowed ?? 6000;
  const sacks = s.sacks ?? 35;
  const tk = s.takeaways ?? 22;
  const tfl = s.defensiveTfl ?? 60;
  return (360 - pa) * 0.10 + (6200 - ya) * 0.0065 + sacks * 0.22 + tk * 0.28 + tfl * 0.06;
}

export function rawOlineStrength(s: PlayerStats): number {
  const sa = s.sacksAllowed ?? 40;
  const lr = s.lineRank ?? 16;
  const rr = s.runBlockRank ?? 16;
  const pr = s.passBlockRank ?? 16;
  return (45 - sa) * 0.45 + (17 - lr) * 0.9 + (17 - rr) * 0.5 + (17 - pr) * 0.5;
}

// Parse the era start year from an eraId like "nfl-12-2020" → 2020.
export function eraStartFromId(eraId: string | undefined): number | null {
  if (!eraId) return null;
  const start = Number(eraId.split('-').pop());
  return Number.isFinite(start) ? start : null;
}

function defenseEraMean(start: number | null): number {
  return (start != null ? DEF_ERA_MEAN[start] : undefined) ?? DEF_GLOBAL_MEAN;
}
function olineEraMean(start: number | null): number {
  return (start != null ? OL_ERA_MEAN[start] : undefined) ?? OL_GLOBAL_MEAN;
}

// Era-relative DEF score, centered on 82. Star/HOF pedigree is added on top so a
// loaded unit can rise above its era's box-score peers.
export function scaleDefenseScore(stats: PlayerStats, start: number | null): number {
  const raw = rawDefenseStrength(stats);
  const starBuff = (stats.defensiveStarCount ?? 0) * 1.0 + (stats.defensiveHofCount ?? 0) * 1.6;
  return UNIT_BASELINE + (raw - defenseEraMean(start)) * DEF_SENSITIVITY + starBuff;
}

export function scaleOlineScore(stats: PlayerStats, start: number | null): number {
  const raw = rawOlineStrength(stats);
  return UNIT_BASELINE + (raw - olineEraMean(start)) * OL_SENSITIVITY;
}

// ─── Kicker scaling ───────────────────────────────────────────────────────────
// Kickers are scored the same era-relative way: the average kicker of an era
// lands on an 80 baseline and scales by how far its FG% beats that era's league
// average. Field-goal accuracy climbed steeply across NFL history (~60% in the
// 1970s to ~87% today), so the baseline is era-specific.
const KICKER_BASELINE = 80;
const KICKER_SENSITIVITY = 130;
const KICKER_ERA_FG: Record<number, number> = {
  1970: 0.595, 1975: 0.62, 1980: 0.655, 1985: 0.70, 1990: 0.735,
  1995: 0.78, 2000: 0.805, 2005: 0.82, 2010: 0.835, 2015: 0.85, 2020: 0.865,
};
const KICKER_GLOBAL_FG = 0.80;

export function kickerEraBaselineFg(start: number | null): number {
  return (start != null ? KICKER_ERA_FG[start] : undefined) ?? KICKER_GLOBAL_FG;
}

export function scaleKickerScore(stats: PlayerStats, start: number | null): number {
  const fg = stats.fieldGoalPct ?? kickerEraBaselineFg(start);
  return KICKER_BASELINE + (fg - kickerEraBaselineFg(start)) * KICKER_SENSITIVITY;
}
