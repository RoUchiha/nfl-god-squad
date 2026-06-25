import { describe, expect, it } from 'vitest';
import { getRosterTemplates } from '../lib/constants';
import { fetchNFLPlayers, getCuratedNFLEraCatalog } from '../lib/sports/nfl';

const SKILL_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE']);

function parseYearRange(yearsWithTeam: string): { start: number; end: number } {
  const match = yearsWithTeam.match(/(\d{4})\s*-\s*(\d{4})/);
  if (!match) throw new Error(`Unable to parse yearsWithTeam: ${yearsWithTeam}`);
  return { start: Number(match[1]), end: Number(match[2]) };
}

describe('NFL Standard Mode roster coverage', () => {
  it('uses the requested QB, RB, WR, WR, TE, FLEX, O-Line, Defense slot set', () => {
    const slots = getRosterTemplates('nfl', 'combined');

    expect(slots.map(slot => slot.id)).toEqual(['qb', 'rb', 'wr1', 'wr2', 'te', 'flex', 'ol', 'def']);
    expect(slots.filter(slot => slot.position === 'WR')).toHaveLength(2);
    expect(slots.find(slot => slot.id === 'flex')?.position).toEqual(['RB', 'WR', 'TE']);
    expect(slots.find(slot => slot.id === 'ol')?.position).toBe('OL');
    expect(slots.find(slot => slot.id === 'def')?.position).toBe('DEF');
  });

  it('every curated era can fill Standard Mode with skill players and team units', async () => {
    for (const { team, era } of getCuratedNFLEraCatalog()) {
      const players = await fetchNFLPlayers(team, era);
      const positions = new Set(players.map(player => player.position));

      expect(players.length).toBeGreaterThanOrEqual(8);
      expect(positions.has('QB')).toBe(true);
      expect(positions.has('RB')).toBe(true);
      expect(players.filter(player => player.position === 'WR').length).toBeGreaterThanOrEqual(2);
      expect(positions.has('TE')).toBe(true);
      expect(positions.has('OL')).toBe(true);
      expect(positions.has('DEF')).toBe(true);
      expect(players.some(player => ['DE', 'DT', 'LB', 'CB', 'S', 'K'].includes(player.position))).toBe(false);
    }
  });

  it('does not expose generated placeholder player labels in playable rosters', async () => {
    const placeholderPattern = /\b(Field General|Feature Back|Changeup Back|Boundary WR|Slot WR|Deep Threat|Move TE)\b/i;

    for (const { team, era } of getCuratedNFLEraCatalog()) {
      const players = await fetchNFLPlayers(team, era);
      for (const player of players) {
        expect(player.name).not.toMatch(placeholderPattern);
        expect(player.name).not.toMatch(/^\d{4}\s+[A-Z]{2,4}\s+/);
      }
    }
  });

  it('does not expose skill players whose team years miss the rolled era', async () => {
    for (const { team, era } of getCuratedNFLEraCatalog()) {
      const players = await fetchNFLPlayers(team, era);
      for (const player of players.filter(player => SKILL_POSITIONS.has(player.position))) {
        const range = parseYearRange(player.yearsWithTeam);
        expect(
          range.start <= era.endYear && range.end >= era.startYear,
          `${team.abbreviation} ${era.startYear}-${era.endYear} includes ${player.name} from ${player.yearsWithTeam}`,
        ).toBe(true);
      }
    }
  });

  it('floors AP MVP winners from the rolled era at 90+', async () => {
    const expectedMvpCards = [
      { team: 'BUF', eraStart: 2020, name: 'Josh Allen' },
      { team: 'KC', eraStart: 2020, name: 'Patrick Mahomes' },
      { team: 'GB', eraStart: 2020, name: 'Aaron Rodgers' },
      { team: 'DAL', eraStart: 1990, name: 'Emmitt Smith' },
      { team: 'LV', eraStart: 2000, name: 'Rich Gannon' },
    ];

    for (const expected of expectedMvpCards) {
      const entry = getCuratedNFLEraCatalog().find(({ team, era }) =>
        team.abbreviation === expected.team &&
        era.startYear <= expected.eraStart &&
        era.endYear >= expected.eraStart
      );
      expect(entry, `${expected.team} ${expected.eraStart} catalog entry`).toBeDefined();
      if (!entry) continue;

      const players = await fetchNFLPlayers(entry.team, entry.era);
      const player = players.find(player => player.name === expected.name);
      expect(player, `${expected.name} in ${entry.team.abbreviation} ${entry.era.startYear}-${entry.era.endYear}`).toBeDefined();
      expect(player?.playerScore).toBeGreaterThanOrEqual(90);
    }
  });

  it('keeps ordinary defense unit cards centered near a 75 rating', async () => {
    const defenseScores: number[] = [];

    for (const { team, era } of getCuratedNFLEraCatalog()) {
      const players = await fetchNFLPlayers(team, era);
      const defense = players.find(player => player.position === 'DEF');
      if (defense) defenseScores.push(defense.playerScore);
    }

    const average = defenseScores.reduce((sum, score) => sum + score, 0) / defenseScores.length;
    expect(average).toBeGreaterThanOrEqual(72);
    expect(average).toBeLessThanOrEqual(78);
    expect(Math.max(...defenseScores)).toBeGreaterThanOrEqual(90);
  });
});
