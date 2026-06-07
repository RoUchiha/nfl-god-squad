/**
 * Tests: every team/sport combination produces enough players to fill each
 * roster position. Guards against empty pools or missing positions causing
 * a draft to get stuck.
 */
import { describe, it, expect } from 'vitest';
import { fetchSoccerPlayers, EPL_TEAMS, WCUP_TEAMS } from '../lib/sports/soccer';
import { getRosterTemplates } from '../lib/constants';
import type { Sport, Era, HistoricalTeam } from '../lib/types';

function makeEra(team: HistoricalTeam, sport: Sport, startYear: number): Era {
  return {
    id: `${sport}-${team.id}-${startYear}`,
    name: `${team.name} ${startYear}`,
    startYear,
    endYear: startYear + 5,
    sport,
    teamId: team.id,
    description: 'test era',
  };
}

// ─── Soccer coverage ──────────────────────────────────────────────────────────

describe('soccer roster coverage', () => {
  const soccerRosterSlots = getRosterTemplates('epl', 'combined');
  // Flatten multi-position slots to individual Position values for checking
  const requiredPositions = soccerRosterSlots.flatMap(s =>
    Array.isArray(s.position) ? s.position : [s.position]
  );

  for (const team of EPL_TEAMS) {
    it(`EPL team "${team.name}" (${team.id}) returns ≥11 players covering all positions`, async () => {
      const era = makeEra(team, 'epl', 2000);
      const players = await fetchSoccerPlayers(team, era);
      expect(players.length).toBeGreaterThanOrEqual(11);

      const returnedPositions = new Set(players.map(p => p.position));
      // Every required position appears at least once
      for (const pos of requiredPositions) {
        expect(returnedPositions.has(pos)).toBe(true);
      }
    });
  }

  for (const team of WCUP_TEAMS) {
    it(`World Cup team "${team.name}" (${team.id}) returns ≥11 players`, async () => {
      const era = makeEra(team, 'wcup', 1970);
      const players = await fetchSoccerPlayers(team, era);
      expect(players.length).toBeGreaterThanOrEqual(11);
    });
  }
});

// ─── Roster template completeness ─────────────────────────────────────────────

describe('getRosterTemplates – all sports have required slots', () => {
  const sports: Sport[] = ['nba', 'nfl', 'mlb', 'nhl', 'epl', 'wcup'];

  for (const sport of sports) {
    it(`${sport} has at least 5 roster slots`, () => {
      const slots = getRosterTemplates(sport, 'combined');
      expect(slots.length).toBeGreaterThanOrEqual(5);
    });
  }

  it('NFL roster has QB, WR, RB, TE, DE, DT, LB, CB, S positions', () => {
    const slots = getRosterTemplates('nfl', 'combined');
    const positions = slots.flatMap(s => Array.isArray(s.position) ? s.position : [s.position]);
    const required = ['QB', 'WR', 'RB', 'TE', 'DE', 'DT', 'LB', 'CB', 'S'];
    for (const pos of required) {
      expect(positions).toContain(pos);
    }
  });

  it('NHL has exactly 3 forward slots (not 6) — regression guard', () => {
    const slots = getRosterTemplates('nhl', 'combined');
    // forwards are lw1, c1, rw1
    const forwards = slots.filter(s => ['lw1', 'c1', 'rw1'].includes(s.id));
    expect(forwards.length).toBe(3);
    const offenseSlots = slots.filter(s => s.group === 'offense');
    expect(offenseSlots.length).toBeLessThanOrEqual(3);
  });

  it('soccer roster has exactly 11 slots (GK + 10 outfield)', () => {
    const eplSlots = getRosterTemplates('epl', 'combined');
    const wcupSlots = getRosterTemplates('wcup', 'combined');
    expect(eplSlots.length).toBe(11);
    expect(wcupSlots.length).toBe(11);
    const gkSlots = eplSlots.filter(s => s.position === 'GK');
    expect(gkSlots.length).toBe(1);
  });
});

// ─── Player data integrity ────────────────────────────────────────────────────

describe('soccer player data integrity', () => {
  it('all returned players have a playerScore > 0', async () => {
    const team = EPL_TEAMS[0]; // Man Utd
    const era = makeEra(team, 'epl', 1997);
    const players = await fetchSoccerPlayers(team, era);
    for (const p of players) {
      expect(p.playerScore).toBeGreaterThan(0);
    }
  });

  it('all returned players have a non-empty name', async () => {
    const team = WCUP_TEAMS[0]; // Brazil
    const era = makeEra(team, 'wcup', 1970);
    const players = await fetchSoccerPlayers(team, era);
    for (const p of players) {
      expect(p.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('GK players have positionGroup "goalie"', async () => {
    const team = EPL_TEAMS[0];
    const era = makeEra(team, 'epl', 1997);
    const players = await fetchSoccerPlayers(team, era);
    const gks = players.filter(p => p.position === 'GK');
    expect(gks.length).toBeGreaterThanOrEqual(1);
    for (const gk of gks) {
      expect(gk.positionGroup).toBe('goalie');
    }
  });
});
