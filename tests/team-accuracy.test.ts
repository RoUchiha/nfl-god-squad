import { describe, expect, it } from 'vitest';
import { NFL_TEAMS, getCuratedNFLEraCatalog } from '../lib/sports/nfl';

describe('NFL franchise data', () => {
  const EXPECTED_NFL_ABBREVIATIONS = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
  ];

  it('contains all 32 NFL franchises', () => {
    expect(NFL_TEAMS).toHaveLength(32);
    expect(NFL_TEAMS.map(team => team.abbreviation).sort()).toEqual([...EXPECTED_NFL_ABBREVIATIONS].sort());
  });

  it('has unique team IDs and abbreviations', () => {
    expect(new Set(NFL_TEAMS.map(team => team.id)).size).toBe(NFL_TEAMS.length);
    expect(new Set(NFL_TEAMS.map(team => team.abbreviation)).size).toBe(NFL_TEAMS.length);
  });

  it('has required display fields for every team', () => {
    for (const team of NFL_TEAMS) {
      expect(team.sport).toBe('nfl');
      expect(team.id).not.toBe('');
      expect(team.name.trim()).not.toBe('');
      expect(team.city.trim()).not.toBe('');
      expect(team.abbreviation.length).toBeGreaterThanOrEqual(2);
      expect(team.abbreviation.length).toBeLessThanOrEqual(4);
    }
  });
});

describe('curated NFL era catalog', () => {
  it('has unique playable team-era entries', () => {
    const catalog = getCuratedNFLEraCatalog();
    const keys = catalog.map(entry => entry.key);

    expect(catalog.length).toBeGreaterThanOrEqual(300);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every franchise at least three completed team-era windows', () => {
    const catalog = getCuratedNFLEraCatalog();

    for (const team of NFL_TEAMS) {
      const teamEras = catalog.filter(entry => entry.team.id === team.id);
      expect(teamEras.length).toBeGreaterThanOrEqual(3);
      expect(Math.max(...teamEras.map(entry => entry.era.startYear))).toBeLessThanOrEqual(2020);
      expect(Math.max(...teamEras.map(entry => entry.era.endYear))).toBeLessThanOrEqual(2024);
    }
  });

  it('only includes eras with named teams and positive randomization weights', () => {
    for (const entry of getCuratedNFLEraCatalog()) {
      expect(entry.team.sport).toBe('nfl');
      expect(entry.era.sport).toBe('nfl');
      expect(entry.era.name.trim()).not.toBe('');
      expect(entry.weight).toBeGreaterThan(0);
      expect(entry.weight).toBeLessThanOrEqual(1);
    }
  });
});
