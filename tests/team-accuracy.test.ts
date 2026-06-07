/**
 * Tests: team counts and data accuracy against canonical league sources.
 *
 * Sources:
 *   NBA  — nba.com/teams (30 current franchises)
 *   NFL  — nfl.com/teams (32 franchises)
 *   MLB  — mlb.com/teams (30 franchises)
 *   NHL  — nhl.com/teams (32 franchises as of 2021 with Seattle)
 *   EPL  — 6 curated historical clubs (Man Utd, Arsenal, Chelsea, Man City, Liverpool, Leicester)
 *   WCUP — 8 national teams (Brazil, Germany, Argentina, France, Italy, Spain, England, Netherlands)
 */
import { describe, it, expect } from 'vitest';
import { NBA_TEAMS } from '../lib/sports/nba';
import { NFL_TEAMS } from '../lib/sports/nfl';
import { MLB_TEAMS } from '../lib/sports/mlb';
import { NHL_TEAMS } from '../lib/sports/nhl';
import { EPL_TEAMS, WCUP_TEAMS } from '../lib/sports/soccer';

// ─── Team counts ──────────────────────────────────────────────────────────────

describe('team counts – canonical league sizes', () => {
  it('NBA has exactly 30 teams', () => {
    expect(NBA_TEAMS.length).toBe(30);
  });

  it('NFL has exactly 32 teams', () => {
    expect(NFL_TEAMS.length).toBe(32);
  });

  it('MLB has exactly 30 teams', () => {
    expect(MLB_TEAMS.length).toBe(30);
  });

  it('NHL has exactly 32 teams', () => {
    expect(NHL_TEAMS.length).toBe(32);
  });

  it('EPL has 6 curated historical clubs', () => {
    expect(EPL_TEAMS.length).toBe(6);
  });

  it('WCUP has 8 national teams', () => {
    expect(WCUP_TEAMS.length).toBe(8);
  });
});

// ─── No duplicate team IDs ────────────────────────────────────────────────────

describe('team IDs – no duplicates within sport', () => {
  function hasDuplicateIds(teams: { id: string }[]): boolean {
    const seen = new Set<string>();
    for (const t of teams) {
      if (seen.has(t.id)) return true;
      seen.add(t.id);
    }
    return false;
  }

  it('NBA team IDs are unique', () => {
    expect(hasDuplicateIds(NBA_TEAMS)).toBe(false);
  });

  it('NFL team IDs are unique', () => {
    expect(hasDuplicateIds(NFL_TEAMS)).toBe(false);
  });

  it('MLB team IDs are unique', () => {
    expect(hasDuplicateIds(MLB_TEAMS)).toBe(false);
  });

  it('NHL team IDs are unique', () => {
    expect(hasDuplicateIds(NHL_TEAMS)).toBe(false);
  });

  it('EPL team IDs are unique', () => {
    expect(hasDuplicateIds(EPL_TEAMS)).toBe(false);
  });

  it('WCUP team IDs are unique', () => {
    expect(hasDuplicateIds(WCUP_TEAMS)).toBe(false);
  });
});

// ─── Sport tag correctness ────────────────────────────────────────────────────

describe('team sport tags', () => {
  it('all NBA teams have sport="nba"', () => {
    expect(NBA_TEAMS.every(t => t.sport === 'nba')).toBe(true);
  });

  it('all NFL teams have sport="nfl"', () => {
    expect(NFL_TEAMS.every(t => t.sport === 'nfl')).toBe(true);
  });

  it('all MLB teams have sport="mlb"', () => {
    expect(MLB_TEAMS.every(t => t.sport === 'mlb')).toBe(true);
  });

  it('all NHL teams have sport="nhl"', () => {
    expect(NHL_TEAMS.every(t => t.sport === 'nhl')).toBe(true);
  });

  it('all EPL teams have sport="epl"', () => {
    expect(EPL_TEAMS.every(t => t.sport === 'epl')).toBe(true);
  });

  it('all WCUP teams have sport="wcup"', () => {
    expect(WCUP_TEAMS.every(t => t.sport === 'wcup')).toBe(true);
  });
});

// ─── Required team data fields ────────────────────────────────────────────────

describe('team data completeness', () => {
  function allHaveRequiredFields(teams: { id: string; name: string; city: string; abbreviation: string }[]): boolean {
    return teams.every(t =>
      t.id.length > 0 &&
      t.name.trim().length > 0 &&
      t.city.trim().length > 0 &&
      t.abbreviation.length >= 2 && t.abbreviation.length <= 4
    );
  }

  it('all NBA teams have id, name, city, abbreviation', () => {
    expect(allHaveRequiredFields(NBA_TEAMS)).toBe(true);
  });

  it('all NFL teams have id, name, city, abbreviation', () => {
    expect(allHaveRequiredFields(NFL_TEAMS)).toBe(true);
  });

  it('all MLB teams have id, name, city, abbreviation', () => {
    expect(allHaveRequiredFields(MLB_TEAMS)).toBe(true);
  });

  it('all NHL teams have id, name, city, abbreviation', () => {
    expect(allHaveRequiredFields(NHL_TEAMS)).toBe(true);
  });
});

// ─── Spot-check specific franchises exist ────────────────────────────────────

describe('canonical franchise spot-checks', () => {
  it('NBA: Lakers, Celtics, Bulls, Warriors, Spurs all present', () => {
    const names = NBA_TEAMS.map(t => t.name);
    for (const name of ['Lakers', 'Celtics', 'Bulls', 'Warriors', 'Spurs']) {
      expect(names).toContain(name);
    }
  });

  it('NFL: Cowboys, Patriots, Packers, Chiefs, 49ers all present', () => {
    const names = NFL_TEAMS.map(t => t.name);
    for (const name of ['Cowboys', 'Patriots', 'Packers', 'Chiefs', '49ers']) {
      expect(names).toContain(name);
    }
  });

  it('MLB: Yankees, Red Sox, Dodgers, Cubs, Cardinals all present', () => {
    const names = MLB_TEAMS.map(t => t.name);
    for (const name of ['Yankees', 'Red Sox', 'Dodgers', 'Cubs', 'Cardinals']) {
      expect(names).toContain(name);
    }
  });

  it('NHL: Maple Leafs, Canadiens, Blackhawks, Red Wings, Rangers all present', () => {
    const names = NHL_TEAMS.map(t => t.name);
    for (const name of ['Maple Leafs', 'Canadiens', 'Blackhawks', 'Red Wings', 'Rangers']) {
      expect(names).toContain(name);
    }
  });

  it('EPL: Man United, Arsenal, Chelsea, Liverpool all present', () => {
    const names = EPL_TEAMS.map(t => t.name);
    for (const name of ['Manchester United', 'Arsenal', 'Chelsea', 'Liverpool']) {
      expect(names).toContain(name);
    }
  });

  it('WCUP: Brazil, Germany, Argentina, France all present', () => {
    const names = WCUP_TEAMS.map(t => t.name);
    for (const name of ['Brazil', 'Germany', 'Argentina', 'France']) {
      expect(names).toContain(name);
    }
  });
});

// ─── NBA division/conference coverage (all 6 divisions × 5 teams) ─────────────

describe('NBA – geographic/franchise coverage', () => {
  const EXPECTED_NBA_ABBREVIATIONS = [
    'ATL','BOS','BKN','CHA','CHI','CLE','DAL','DEN','DET','GSW',
    'HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN','NOP','NYK',
    'OKC','ORL','PHI','PHX','POR','SAC','SAS','TOR','UTA','WAS',
  ];

  it('has all 30 expected NBA abbreviations', () => {
    const abbrevs = NBA_TEAMS.map(t => t.abbreviation);
    for (const abbr of EXPECTED_NBA_ABBREVIATIONS) {
      expect(abbrevs).toContain(abbr);
    }
  });
});

// ─── NFL all 32 franchises ────────────────────────────────────────────────────

describe('NFL – all 32 franchises', () => {
  const EXPECTED_NFL_ABBREVIATIONS = [
    'ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE',
    'DAL','DEN','DET','GB','HOU','IND','JAX','KC',
    'LAC','LAR','LV','MIA','MIN','NE','NO','NYG',
    'NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS',
  ];

  it('has all 32 expected NFL abbreviations', () => {
    const abbrevs = NFL_TEAMS.map(t => t.abbreviation);
    for (const abbr of EXPECTED_NFL_ABBREVIATIONS) {
      expect(abbrevs).toContain(abbr);
    }
  });
});

// ─── MLB all 30 franchises ────────────────────────────────────────────────────

describe('MLB – all 30 franchises', () => {
  const EXPECTED_MLB_ABBREVIATIONS = [
    'ARI','ATL','BAL','BOS','CHC','CWS','CIN','CLE',
    'COL','DET','HOU','KC','LAA','LAD','MIA','MIL',
    'MIN','NYM','NYY','OAK','PHI','PIT','SD','SF',
    'SEA','STL','TB','TEX','TOR','WSH',
  ];

  it('has all 30 expected MLB abbreviations', () => {
    const abbrevs = MLB_TEAMS.map(t => t.abbreviation);
    for (const abbr of EXPECTED_MLB_ABBREVIATIONS) {
      expect(abbrevs).toContain(abbr);
    }
  });
});

// ─── NHL all 32 franchises ────────────────────────────────────────────────────

describe('NHL – all 32 franchises', () => {
  const EXPECTED_NHL_ABBREVIATIONS = [
    'ANA','ARI','BOS','BUF','CGY','CAR','CHI','COL',
    'CBJ','DAL','DET','EDM','FLA','LAK','MIN','MTL',
    'NSH','NJD','NYI','NYR','OTT','PHI','PIT','SEA',
    'SJS','STL','TBL','TOR','VAN','VGK','WSH','WPG',
  ];

  it('has all 32 expected NHL abbreviations', () => {
    const abbrevs = NHL_TEAMS.map(t => t.abbreviation);
    for (const abbr of EXPECTED_NHL_ABBREVIATIONS) {
      expect(abbrevs).toContain(abbr);
    }
  });
});
