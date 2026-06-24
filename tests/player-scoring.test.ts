import { describe, expect, it } from 'vitest';
import { computePlayerScore } from '../lib/algorithms/powerRating';
import type { Player } from '../lib/types';

function makeNFLPlayer(overrides: Partial<Player>): Player {
  return {
    id: 'test-1',
    name: 'Test Player',
    position: 'QB',
    positionGroup: 'offense',
    yearsWithTeam: '2000-2004',
    stats: {},
    playerScore: 0,
    eraId: 'nfl-17-2000',
    teamId: '17',
    ...overrides,
  };
}

describe('NFL player scoring', () => {
  it('is deterministic for identical player input', () => {
    const player = makeNFLPlayer({
      stats: { passingYards: 4806, passingTDs: 50, passerRating: 117.2, interceptions: 8 },
      isLegend: true,
    });

    expect(computePlayerScore(player, 'nfl')).toBe(computePlayerScore(player, 'nfl'));
  });

  it('keeps elite legends in a superstar range', () => {
    const brady = makeNFLPlayer({
      stats: { passingYards: 4806, passingTDs: 50, passerRating: 117.2, interceptions: 8 },
      isLegend: true,
    });

    const score = computePlayerScore(brady, 'nfl');
    expect(score).toBeGreaterThanOrEqual(88);
    expect(score).toBeLessThanOrEqual(99);
  });

  it('orders elite quarterbacks above average and bench quarterbacks', () => {
    const elite = makeNFLPlayer({
      id: 'elite-qb',
      stats: { passingYards: 4827, passingTDs: 43, passerRating: 105.6, interceptions: 8 },
      isLegend: true,
    });
    const average = makeNFLPlayer({
      id: 'avg-qb',
      stats: { passingYards: 3200, passingTDs: 22, passerRating: 88, interceptions: 12 },
    });
    const bench = makeNFLPlayer({
      id: 'bench-qb',
      stats: { passingYards: 1800, passingTDs: 10, passerRating: 72, interceptions: 14 },
    });

    expect(computePlayerScore(elite, 'nfl')).toBeGreaterThan(computePlayerScore(average, 'nfl'));
    expect(computePlayerScore(average, 'nfl')).toBeGreaterThan(computePlayerScore(bench, 'nfl'));
  });

  it('scores elite receivers above average receivers', () => {
    const rice = makeNFLPlayer({
      position: 'WR',
      stats: { receivingYards: 1570, receivingTDs: 22, receptions: 106 },
      isLegend: true,
    });
    const average = makeNFLPlayer({
      id: 'avg-wr',
      position: 'WR',
      stats: { receivingYards: 850, receivingTDs: 6, receptions: 65 },
    });

    expect(computePlayerScore(rice, 'nfl')).toBeGreaterThan(computePlayerScore(average, 'nfl'));
  });

  it('scores O-Line and Defense unit cards without NaN', () => {
    const line = makeNFLPlayer({
      id: 'ol',
      name: 'Test O-Line',
      position: 'OL',
      stats: { sacksAllowed: 18, lineRank: 1, runBlockRank: 1, passBlockRank: 2 },
      isLegend: true,
    });
    const defense = makeNFLPlayer({
      id: 'def',
      name: 'Test Defense',
      position: 'DEF',
      positionGroup: 'defense',
      stats: { pointsAllowed: 225, yardsAllowed: 4414, sacks: 47, takeaways: 36 },
      isLegend: true,
    });

    expect(Number.isNaN(computePlayerScore(line, 'nfl'))).toBe(false);
    expect(Number.isNaN(computePlayerScore(defense, 'nfl'))).toBe(false);
    expect(computePlayerScore(line, 'nfl')).toBeGreaterThanOrEqual(88);
    expect(computePlayerScore(defense, 'nfl')).toBeGreaterThanOrEqual(88);
  });
});
