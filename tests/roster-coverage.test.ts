import { describe, expect, it } from 'vitest';
import { getRosterTemplates } from '../lib/constants';
import { fetchNFLPlayers, getCuratedNFLEraCatalog } from '../lib/sports/nfl';

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
});
