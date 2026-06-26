import { describe, expect, it } from 'vitest';
import { buildEraQueue } from '../lib/eraQueue';
import { getRosterTemplates } from '../lib/constants';
import type { FilledRosterSlot, Player, RosterSlotTemplate } from '../lib/types';
import {
  curatedEraWeight,
  fetchNFLPlayers,
  getCuratedNFLEraCatalog,
  NFL_GOAT_SCORE,
  NFL_SUPERSTAR_SCORE,
} from '../lib/sports/nfl';
import { canonicalizeSimulationRoster, validateSimulationRoster } from '../lib/simulationRoster';

function accepts(slot: RosterSlotTemplate, player: Player): boolean {
  return Array.isArray(slot.position)
    ? slot.position.includes(player.position)
    : slot.position === player.position;
}

async function buildCompleteRoster(): Promise<FilledRosterSlot[]> {
  const catalog = getCuratedNFLEraCatalog();
  const templates = getRosterTemplates('nfl', 'combined');
  const slots: FilledRosterSlot[] = templates.map(slot => ({ ...slot, player: null }));

  for (const entry of catalog) {
    const players = await fetchNFLPlayers(entry.team, entry.era);
    for (const slot of slots) {
      if (slot.player) continue;
      const player = players.find(candidate =>
        accepts(slot, candidate) &&
        !slots.some(existing => existing.player?.name === candidate.name)
      );
      if (player) slot.player = player;
    }
    if (slots.every(slot => slot.player)) return slots;
  }

  throw new Error('Could not build a complete NFL Standard Mode roster from curated eras');
}

describe('NFL Standard Mode', () => {
  it('builds a weighted queue only from roster-backed curated NFL eras', async () => {
    const catalog = getCuratedNFLEraCatalog();
    const queue = buildEraQueue({ rng: () => 0.42 });
    expect(queue).toHaveLength(catalog.length);
    expect(new Set(queue.map(item => item.key)).size).toBe(queue.length);

    for (const item of queue) {
      const players = await fetchNFLPlayers(item.team, item.era);
      const positions = new Set(players.map(player => player.position));
      expect(positions.has('QB')).toBe(true);
      expect(positions.has('RB')).toBe(true);
      expect(positions.has('WR')).toBe(true);
      expect(positions.has('TE')).toBe(true);
      expect(positions.has('OL')).toBe(true);
      expect(positions.has('DEF')).toBe(true);
      expect(players.some(player => ['DE', 'DT', 'LB', 'CB', 'S', 'K'].includes(player.position))).toBe(false);
    }
  });

  it('can exhaust all team-eras without reintroducing repeats', () => {
    const fullQueue = buildEraQueue({ rng: () => 0.42 });
    const exhausted = buildEraQueue({
      rng: () => 0.42,
      excludeKeys: fullQueue.map(item => item.key),
    });

    expect(exhausted).toHaveLength(0);
  });

  it('makes GOAT and stacked NFL eras substantially rarer without removing them', () => {
    const ordinary: Player = { id: 'ordinary', name: 'Ordinary', position: 'QB', positionGroup: 'offense', yearsWithTeam: '2000', stats: {}, playerScore: 82 };
    const superstar: Player = { ...ordinary, id: 'superstar', playerScore: NFL_SUPERSTAR_SCORE };
    const goat: Player = { ...ordinary, id: 'goat', playerScore: NFL_GOAT_SCORE };
    const eliteLine: Player = { ...ordinary, id: 'line', position: 'OL', playerScore: 91 };

    expect(curatedEraWeight([ordinary])).toBe(1);
    expect(curatedEraWeight([superstar])).toBe(0.5);
    expect(curatedEraWeight([goat])).toBe(0.26);
    expect(curatedEraWeight([goat, superstar, eliteLine])).toBe(0.1);
  });

  it('canonicalizes submitted rosters so forged scores cannot affect simulation', async () => {
    const roster = await buildCompleteRoster();
    expect(validateSimulationRoster(roster)).toBeNull();

    const forged = roster.map(slot => ({
      ...slot,
      player: slot.player ? { ...slot.player, name: 'Cheat Code', playerScore: 99.9, stats: {} } : null,
    }));

    const canonical = canonicalizeSimulationRoster(forged);
    expect(canonical.slots).not.toBeNull();
    expect(canonical.error).toBeNull();
    expect(canonical.slots![0].player?.name).not.toBe('Cheat Code');
    expect(validateSimulationRoster(canonical.slots!)).toBeNull();
  });

  it('rejects duplicate real players across different teams or eras', async () => {
    const roster = await buildCompleteRoster();
    const qbSlot = roster.find(slot => slot.id === 'qb');
    expect(qbSlot?.player).toBeTruthy();

    const duplicated = roster.map(slot => {
      if (slot.id !== 'flex' || !qbSlot?.player) return slot;
      return {
        ...slot,
        player: {
          ...qbSlot.player,
          id: 'different-team-era-duplicate',
          name: `${qbSlot.player.name} Jr.`,
          position: 'RB' as const,
          teamId: '27',
          eraId: 'nfl-27-2020',
        },
      };
    });

    expect(validateSimulationRoster(duplicated)).toBe('Duplicate players are not allowed.');
  });
});
