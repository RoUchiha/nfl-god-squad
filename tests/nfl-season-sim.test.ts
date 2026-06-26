import { describe, expect, it } from 'vitest';
import { getRosterTemplates } from '../lib/constants';
import { computeTeamGSPR } from '../lib/algorithms/powerRating';
import { simulateSeason } from '../lib/algorithms/simulator';
import { getHardcodedNflTeamStrengths } from '../lib/nflLeague';
import { getCuratedNFLEraCatalog, fetchNFLPlayers } from '../lib/sports/nfl';
import type { FilledRosterSlot, Player, RosterSlotTemplate } from '../lib/types';

function accepts(slot: RosterSlotTemplate, player: Player): boolean {
  return Array.isArray(slot.position) ? slot.position.includes(player.position) : slot.position === player.position;
}

async function buildRoster(): Promise<FilledRosterSlot[]> {
  const slots: FilledRosterSlot[] = getRosterTemplates('nfl', 'combined').map(s => ({ ...s, player: null }));
  for (const entry of getCuratedNFLEraCatalog()) {
    const players = await fetchNFLPlayers(entry.team, entry.era);
    for (const slot of slots) {
      if (slot.player) continue;
      const player = players.find(c => accepts(slot, c) && !slots.some(e => e.player?.name === c.name));
      if (player) slot.player = player;
    }
    if (slots.every(s => s.player)) break;
  }
  return slots;
}

describe('NFL season sim + playoffs', () => {
  it('produces last-season-grounded standings and a complete playoff bracket', async () => {
    const slots = await buildRoster();
    const teamPower = computeTeamGSPR(slots, 'nfl', 'combined');
    const results = simulateSeason(teamPower, 'nfl', { pros: [], cons: [] }, getHardcodedNflTeamStrengths(), slots);

    // Standings: 32 real teams + the custom God Squad.
    expect(results.leagueStandings).toBeDefined();
    expect(results.leagueStandings!.length).toBe(33);
    expect(results.leagueStandings!.some(s => s.isCustomTeam)).toBe(true);
    expect(results.baselineLabel).toMatch(/2024/);

    const playoffs = results.playoffs!;
    expect(playoffs).toBeDefined();

    // Each conference seeds exactly 7 unique teams, numbered 1–7.
    for (const seeds of [playoffs.afcSeeds, playoffs.nfcSeeds]) {
      expect(seeds).toHaveLength(7);
      expect(seeds.map(s => s.seed).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(new Set(seeds.map(s => s.teamId)).size).toBe(7);
    }

    // Bracket has the right round shape: 6 wild card, 4 divisional, 2 conf, 1 SB.
    const counts = Object.fromEntries(playoffs.rounds.map(r => [r.name, r.games.length]));
    expect(counts['Wild Card']).toBe(6);
    expect(counts['Divisional Round']).toBe(4);
    expect(counts['Conference Championships']).toBe(2);
    expect(counts['Super Bowl']).toBe(1);

    // Every game has a winner that is one of its two teams.
    for (const round of playoffs.rounds) {
      for (const game of round.games) {
        expect([game.home.teamId, game.away.teamId]).toContain(game.winnerId);
        expect(game.homeScore).not.toBe(game.awayScore); // no ties in the playoffs
      }
    }

    // The Super Bowl winner is the champion.
    expect(playoffs.champion.teamId).toBe(playoffs.superBowl.winnerId);
    expect(playoffs.customResult.length).toBeGreaterThan(0);

    // If the God Squad made the bracket, its seed matches the standings seed.
    const customSeedInBracket = [...playoffs.afcSeeds, ...playoffs.nfcSeeds].find(s => s.isCustomTeam)?.seed;
    if (customSeedInBracket) expect(results.customSeed).toBe(customSeedInBracket);
  });

  it('crowns the God Squad when it is dramatically stronger than the league', async () => {
    const slots = await buildRoster();
    const teamPower = computeTeamGSPR(slots, 'nfl', 'combined');
    // Force a god-tier team so it should run the table most of the time.
    const godPower = { ...teamPower, gspr: 1000, offenseScore: 99, defenseScore: 99 };

    let titles = 0;
    for (let i = 0; i < 20; i++) {
      const r = simulateSeason(godPower, 'nfl', { pros: [], cons: [] }, getHardcodedNflTeamStrengths(), slots);
      if (r.playoffs!.customResult.includes('Super Bowl') && r.playoffs!.champion.isCustomTeam) titles++;
    }
    expect(titles).toBeGreaterThan(0);
  });
});
