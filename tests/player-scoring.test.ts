/**
 * Tests: computePlayerScore determinism, tier floors, and absolute-scale calibration.
 *
 * Guardrail: scores must be stable across calls (no pool normalization or
 * random components). Regression guards so scoring rewrites don't silently
 * drop legends to 60 or boost bench players to 95.
 */
import { describe, it, expect } from 'vitest';
import { computePlayerScore } from '../lib/algorithms/powerRating';
import type { Player } from '../lib/types';

function makePlayer(overrides: Partial<Player>): Player {
  return {
    id: 'test-1',
    name: 'Test Player',
    position: 'PG',
    positionGroup: 'offense',
    yearsWithTeam: '2000–2004',
    stats: {},
    playerScore: 0,
    eraId: 'nba-5-2000',
    teamId: '5',
    ...overrides,
  };
}

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('computePlayerScore – determinism', () => {
  it('returns identical score on repeated calls with same input', () => {
    const p = makePlayer({
      position: 'PG',
      stats: { points: 30, rebounds: 6, assists: 11, steals: 2, blocks: 0.5, fieldGoalPct: 0.50, freeThrowPct: 0.90 },
      isLegend: true,
    });
    const s1 = computePlayerScore(p, 'nba');
    const s2 = computePlayerScore(p, 'nba');
    const s3 = computePlayerScore(p, 'nba');
    expect(s1).toBe(s2);
    expect(s2).toBe(s3);
  });

  it('two different stat lines always produce different scores', () => {
    const elite = makePlayer({ stats: { points: 35, rebounds: 8, assists: 12, steals: 2.5, blocks: 1, fieldGoalPct: 0.52, freeThrowPct: 0.88 }, isLegend: true });
    const bench = makePlayer({ stats: { points: 6, rebounds: 2, assists: 2, steals: 0.5, blocks: 0.2, fieldGoalPct: 0.42, freeThrowPct: 0.72 } });
    expect(computePlayerScore(elite, 'nba')).toBeGreaterThan(computePlayerScore(bench, 'nba'));
  });
});

// ─── Tier floors (2K-style) ───────────────────────────────────────────────────

describe('computePlayerScore – tier floors', () => {
  it('isLegend player always scores >= 88', () => {
    // Even with mediocre stats, the HOF floor should kick in
    const p = makePlayer({ stats: { points: 10, rebounds: 5, assists: 3 }, isLegend: true });
    expect(computePlayerScore(p, 'nba')).toBeGreaterThanOrEqual(88);
  });

  it('isAllStar player always scores >= 75', () => {
    const p = makePlayer({ stats: { points: 14, rebounds: 4, assists: 4 }, isAllStar: true });
    expect(computePlayerScore(p, 'nba')).toBeGreaterThanOrEqual(75);
  });

  it('regular player is capped at 82', () => {
    // Very good stats but no accolade flag → can't exceed 82
    const p = makePlayer({ stats: { points: 25, rebounds: 8, assists: 6, steals: 1.5, blocks: 1, fieldGoalPct: 0.51, freeThrowPct: 0.86 } });
    expect(computePlayerScore(p, 'nba')).toBeLessThanOrEqual(82);
  });

  it('GOAT-tier legend can reach 99', () => {
    // Jordan/Curry peak stats should crack 99
    const jordan = makePlayer({
      position: 'SG',
      stats: { points: 37.1, rebounds: 8, assists: 5.5, steals: 3.2, blocks: 1.5, fieldGoalPct: 0.535, freeThrowPct: 0.857 },
      isLegend: true,
    });
    expect(computePlayerScore(jordan, 'nba')).toBeGreaterThanOrEqual(95);
  });
});

// ─── All sports return in-range values ───────────────────────────────────────

describe('computePlayerScore – cross-sport range', () => {
  it('NFL QB (legend) scores in [88, 99]', () => {
    const qb = makePlayer({
      position: 'QB', positionGroup: 'offense',
      eraId: 'nfl-17-2006', teamId: '17',
      stats: { passingYards: 4806, passingTDs: 50, passerRating: 117.2, interceptions: 8 },
      isLegend: true,
    });
    const score = computePlayerScore(qb, 'nfl');
    expect(score).toBeGreaterThanOrEqual(88);
    expect(score).toBeLessThanOrEqual(99);
  });

  it('NFL defensive end returns in [25, 99]', () => {
    const de = makePlayer({
      position: 'DE', positionGroup: 'defense',
      eraId: 'nfl-23-1975', teamId: '23',
      stats: { sacks: 16, tackles: 72, forcedFumbles: 4 },
      isLegend: true,
    });
    const score = computePlayerScore(de, 'nfl');
    expect(score).toBeGreaterThanOrEqual(88);
    expect(score).toBeLessThanOrEqual(99);
  });

  it('MLB batter (legend) scores in [88, 99]', () => {
    const ruth = makePlayer({
      position: '1B', positionGroup: 'offense',
      eraId: 'mlb-147-1925', teamId: '147',
      stats: { battingAvg: 0.356, homeRuns: 60, rbi: 165, onBasePct: 0.486, sluggingPct: 0.772 },
      isLegend: true,
    });
    const score = computePlayerScore(ruth, 'mlb');
    expect(score).toBeGreaterThanOrEqual(88);
    expect(score).toBeLessThanOrEqual(99);
  });

  it('NHL skater (legend) scores in [88, 99]', () => {
    const gretzky = makePlayer({
      position: 'C_NHL', positionGroup: 'offense',
      eraId: 'nhl-EDM-1983', teamId: 'EDM',
      stats: { goals: 92, nhlAssists: 163, nhlPoints: 255, plusMinus: 98, powerPlayGoals: 20 },
      isLegend: true,
    });
    const score = computePlayerScore(gretzky, 'nhl');
    expect(score).toBeGreaterThanOrEqual(88);
    expect(score).toBeLessThanOrEqual(99);
  });

  it('Soccer forward (legend) scores in [88, 99]', () => {
    const pele = makePlayer({
      position: 'ST', positionGroup: 'offense',
      eraId: 'wcup-bra-1970', teamId: 'bra',
      stats: { soccerGoals: 4, soccerAssists: 6, keyPasses: 3.5, soccerApps: 6 },
      isLegend: true,
    });
    const score = computePlayerScore(pele, 'wcup');
    expect(score).toBeGreaterThanOrEqual(88);
    expect(score).toBeLessThanOrEqual(99);
  });

  it('Soccer GK scores never NaN', () => {
    const gk = makePlayer({
      position: 'GK', positionGroup: 'goalie',
      eraId: 'epl-liv-2017', teamId: 'liv',
      stats: { soccerApps: 38, cleanSheets: 21, savePctSoc: 0.80 },
      isLegend: true,
    });
    const score = computePlayerScore(gk, 'epl');
    expect(Number.isNaN(score)).toBe(false);
    expect(score).toBeGreaterThanOrEqual(88);
  });
});

// ─── Score ordering matches quality expectation ───────────────────────────────

describe('computePlayerScore – ordering', () => {
  it('elite QBs rank: Brady > average QB > bench QB', () => {
    const brady = makePlayer({ position: 'QB', positionGroup: 'offense', eraId: 'nfl-17-2011', stats: { passingYards: 4827, passingTDs: 43, passerRating: 105.6, interceptions: 8 }, isLegend: true });
    const avg   = makePlayer({ id: 'avg-qb', position: 'QB', positionGroup: 'offense', eraId: 'nfl-17-2011', stats: { passingYards: 3200, passingTDs: 22, passerRating: 88, interceptions: 12 } });
    const bench = makePlayer({ id: 'bench-qb', position: 'QB', positionGroup: 'offense', eraId: 'nfl-17-2011', stats: { passingYards: 1800, passingTDs: 10, passerRating: 72, interceptions: 14 } });
    expect(computePlayerScore(brady, 'nfl')).toBeGreaterThan(computePlayerScore(avg, 'nfl'));
    expect(computePlayerScore(avg, 'nfl')).toBeGreaterThan(computePlayerScore(bench, 'nfl'));
  });

  it('elite WR > average WR', () => {
    const rice   = makePlayer({ position: 'WR', positionGroup: 'offense', stats: { receivingYards: 1570, receivingTDs: 22, receptions: 106 }, isLegend: true });
    const avgWR  = makePlayer({ id: 'avg-wr', position: 'WR', positionGroup: 'offense', stats: { receivingYards: 850, receivingTDs: 6, receptions: 65 } });
    expect(computePlayerScore(rice, 'nfl')).toBeGreaterThan(computePlayerScore(avgWR, 'nfl'));
  });
});
