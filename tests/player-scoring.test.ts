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

  it('only lets top-five O-lines reach 90+', () => {
    const topFiveLine = makeNFLPlayer({
      id: 'top-five-line',
      name: 'Top Five O-Line',
      position: 'OL',
      stats: {
        sacksAllowed: 22,
        qbPassingYards: 4300,
        teamRushingYards: 2100,
        lineRank: 5,
        runBlockRank: 5,
        passBlockRank: 4,
      },
    });
    const volumeDrivenMidLine = makeNFLPlayer({
      id: 'mid-line',
      name: 'Volume O-Line',
      position: 'OL',
      stats: {
        sacksAllowed: 18,
        qbPassingYards: 5200,
        teamRushingYards: 2500,
        lineRank: 14,
        runBlockRank: 7,
        passBlockRank: 7,
      },
    });

    expect(computePlayerScore(topFiveLine, 'nfl')).toBeGreaterThanOrEqual(90);
    expect(computePlayerScore(volumeDrivenMidLine, 'nfl')).toBeLessThan(90);
  });

  it('weights O-line pass protection over offensive yardage volume', () => {
    const cleanPocket = makeNFLPlayer({
      id: 'clean-pocket-line',
      name: 'Clean Pocket O-Line',
      position: 'OL',
      stats: {
        sacksAllowed: 18,
        qbDropbacks: 620,
        pressureRate: 0.18,
        qbPassingYards: 3900,
        teamRushingYards: 1750,
        lineRank: 4,
        runBlockRank: 8,
        passBlockRank: 3,
      },
    });
    const volumeButLeaky = makeNFLPlayer({
      id: 'leaky-volume-line',
      name: 'Leaky Volume O-Line',
      position: 'OL',
      stats: {
        sacksAllowed: 44,
        qbDropbacks: 620,
        pressureRate: 0.34,
        qbPassingYards: 5200,
        teamRushingYards: 2400,
        lineRank: 4,
        runBlockRank: 3,
        passBlockRank: 11,
      },
    });

    expect(computePlayerScore(cleanPocket, 'nfl')).toBeGreaterThan(computePlayerScore(volumeButLeaky, 'nfl'));
  });
});
