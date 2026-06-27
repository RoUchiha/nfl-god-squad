import type { NFLDivision, NFLTeamStrength } from './types';
import { clamp } from './utils';

// ─── 2024 NFL season baseline ─────────────────────────────────────────────────
// Real 2024 regular-season records and scoring drive each opponent's strength so
// the simulated league mirrors last season's NFL. Records are exact; points
// for/against are season totals (close approximations of the 2024 finals).
// `notable` lists each team's most recognizable 2024 contributors for flavor.

export const NFL_BASELINE_SEASON = '2024';
export const NFL_BASELINE_DATE = '2025-02-09'; // Super Bowl LIX week
export const NFL_BASELINE_LABEL = '2024 season baseline';

interface LastSeasonTeamData {
  conference: 'AFC' | 'NFC';
  division: NFLDivision;
  wins: number;
  losses: number;
  ties?: number;
  pf: number; // points for (season total)
  pa: number; // points against (season total)
  notable: string[];
}

const LAST_SEASON: Record<string, LastSeasonTeamData> = {
  // AFC East
  BUF: { conference: 'AFC', division: 'AFC East', wins: 13, losses: 4, pf: 525, pa: 368, notable: ['Josh Allen', 'James Cook', 'Khalil Shakir'] },
  MIA: { conference: 'AFC', division: 'AFC East', wins: 8, losses: 9, pf: 345, pa: 364, notable: ['Tua Tagovailoa', 'Tyreek Hill', 'De\'Von Achane'] },
  NYJ: { conference: 'AFC', division: 'AFC East', wins: 5, losses: 12, pf: 338, pa: 404, notable: ['Aaron Rodgers', 'Garrett Wilson', 'Breece Hall'] },
  NE:  { conference: 'AFC', division: 'AFC East', wins: 4, losses: 13, pf: 289, pa: 417, notable: ['Drake Maye', 'Rhamondre Stevenson', 'Christian Gonzalez'] },
  // AFC North
  BAL: { conference: 'AFC', division: 'AFC North', wins: 12, losses: 5, pf: 518, pa: 369, notable: ['Lamar Jackson', 'Derrick Henry', 'Zay Flowers'] },
  PIT: { conference: 'AFC', division: 'AFC North', wins: 10, losses: 7, pf: 369, pa: 347, notable: ['Russell Wilson', 'George Pickens', 'T.J. Watt'] },
  CIN: { conference: 'AFC', division: 'AFC North', wins: 9, losses: 8, pf: 477, pa: 434, notable: ['Joe Burrow', 'Ja\'Marr Chase', 'Tee Higgins'] },
  CLE: { conference: 'AFC', division: 'AFC North', wins: 3, losses: 14, pf: 265, pa: 425, notable: ['Jameis Winston', 'Jerry Jeudy', 'Myles Garrett'] },
  // AFC South
  HOU: { conference: 'AFC', division: 'AFC South', wins: 10, losses: 7, pf: 358, pa: 333, notable: ['C.J. Stroud', 'Joe Mixon', 'Nico Collins'] },
  IND: { conference: 'AFC', division: 'AFC South', wins: 8, losses: 9, pf: 377, pa: 415, notable: ['Anthony Richardson', 'Jonathan Taylor', 'Josh Downs'] },
  JAX: { conference: 'AFC', division: 'AFC South', wins: 4, losses: 13, pf: 333, pa: 425, notable: ['Trevor Lawrence', 'Brian Thomas Jr.', 'Travis Etienne'] },
  TEN: { conference: 'AFC', division: 'AFC South', wins: 3, losses: 14, pf: 311, pa: 460, notable: ['Will Levis', 'Tony Pollard', 'Calvin Ridley'] },
  // AFC West
  KC:  { conference: 'AFC', division: 'AFC West', wins: 15, losses: 2, pf: 415, pa: 326, notable: ['Patrick Mahomes', 'Travis Kelce', 'Chris Jones'] },
  LAC: { conference: 'AFC', division: 'AFC West', wins: 11, losses: 6, pf: 416, pa: 301, notable: ['Justin Herbert', 'Ladd McConkey', 'Khalil Mack'] },
  DEN: { conference: 'AFC', division: 'AFC West', wins: 10, losses: 7, pf: 425, pa: 311, notable: ['Bo Nix', 'Courtland Sutton', 'Patrick Surtain II'] },
  LV:  { conference: 'AFC', division: 'AFC West', wins: 4, losses: 13, pf: 309, pa: 422, notable: ['Gardner Minshew', 'Brock Bowers', 'Maxx Crosby'] },
  // NFC East
  PHI: { conference: 'NFC', division: 'NFC East', wins: 14, losses: 3, pf: 458, pa: 303, notable: ['Jalen Hurts', 'Saquon Barkley', 'A.J. Brown'] },
  WAS: { conference: 'NFC', division: 'NFC East', wins: 12, losses: 5, pf: 485, pa: 391, notable: ['Jayden Daniels', 'Terry McLaurin', 'Brian Robinson Jr.'] },
  DAL: { conference: 'NFC', division: 'NFC East', wins: 7, losses: 10, pf: 343, pa: 451, notable: ['Dak Prescott', 'CeeDee Lamb', 'Micah Parsons'] },
  NYG: { conference: 'NFC', division: 'NFC East', wins: 3, losses: 14, pf: 273, pa: 416, notable: ['Malik Nabers', 'Tyrone Tracy Jr.', 'Dexter Lawrence'] },
  // NFC North
  DET: { conference: 'NFC', division: 'NFC North', wins: 15, losses: 2, pf: 564, pa: 391, notable: ['Jared Goff', 'Jahmyr Gibbs', 'Amon-Ra St. Brown'] },
  MIN: { conference: 'NFC', division: 'NFC North', wins: 14, losses: 3, pf: 425, pa: 332, notable: ['Sam Darnold', 'Justin Jefferson', 'Jonathan Greenard'] },
  GB:  { conference: 'NFC', division: 'NFC North', wins: 11, losses: 6, pf: 460, pa: 373, notable: ['Jordan Love', 'Josh Jacobs', 'Jayden Reed'] },
  CHI: { conference: 'NFC', division: 'NFC North', wins: 5, losses: 12, pf: 295, pa: 366, notable: ['Caleb Williams', 'D.J. Moore', 'Rome Odunze'] },
  // NFC South
  TB:  { conference: 'NFC', division: 'NFC South', wins: 10, losses: 7, pf: 502, pa: 374, notable: ['Baker Mayfield', 'Mike Evans', 'Bucky Irving'] },
  ATL: { conference: 'NFC', division: 'NFC South', wins: 8, losses: 9, pf: 376, pa: 391, notable: ['Kirk Cousins', 'Bijan Robinson', 'Drake London'] },
  NO:  { conference: 'NFC', division: 'NFC South', wins: 5, losses: 12, pf: 364, pa: 411, notable: ['Derek Carr', 'Alvin Kamara', 'Chris Olave'] },
  CAR: { conference: 'NFC', division: 'NFC South', wins: 5, losses: 12, pf: 341, pa: 534, notable: ['Bryce Young', 'Chuba Hubbard', 'Adam Thielen'] },
  // NFC West
  LAR: { conference: 'NFC', division: 'NFC West', wins: 10, losses: 7, pf: 367, pa: 371, notable: ['Matthew Stafford', 'Puka Nacua', 'Kyren Williams'] },
  SEA: { conference: 'NFC', division: 'NFC West', wins: 10, losses: 7, pf: 386, pa: 358, notable: ['Geno Smith', 'Kenneth Walker III', 'Jaxon Smith-Njigba'] },
  ARI: { conference: 'NFC', division: 'NFC West', wins: 8, losses: 9, pf: 417, pa: 410, notable: ['Kyler Murray', 'Marvin Harrison Jr.', 'James Conner'] },
  SF:  { conference: 'NFC', division: 'NFC West', wins: 6, losses: 11, pf: 391, pa: 388, notable: ['Brock Purdy', 'Christian McCaffrey', 'George Kittle'] },
};

function teamRatings(d: LastSeasonTeamData) {
  const games = d.wins + d.losses + (d.ties ?? 0);
  const winPct = (d.wins + (d.ties ?? 0) * 0.5) / games;
  const ppg = d.pf / games;
  const papg = d.pa / games;
  const differential = ppg - papg;
  const offenseScore = clamp(60 + (ppg - 22.5) * 2.4 + winPct * 6, 55, 96);
  const defenseScore = clamp(60 + (22.5 - papg) * 2.6 + winPct * 6, 55, 96);
  const gspr = Math.round(clamp(560 + winPct * 300 + differential * 9, 555, 925));
  return { offenseScore, defenseScore, gspr, ppg, papg };
}

export function buildLastSeasonStrength(
  team: { id: string; name: string; city: string; abbreviation: string },
): NFLTeamStrength {
  const data = LAST_SEASON[team.abbreviation];
  if (!data) throw new Error(`Missing ${NFL_BASELINE_SEASON} data for ${team.abbreviation}`);
  const ratings = teamRatings(data);
  return {
    teamId: team.id,
    name: team.name,
    city: team.city,
    abbreviation: team.abbreviation,
    conference: data.conference,
    division: data.division,
    gspr: ratings.gspr,
    offenseScore: Math.round(ratings.offenseScore),
    defenseScore: Math.round(ratings.defenseScore),
    baselineWins: data.wins,
    baselineLosses: data.losses,
    pointsForPg: Math.round(ratings.ppg * 10) / 10,
    pointsAgainstPg: Math.round(ratings.papg * 10) / 10,
    notable: data.notable,
    snapshotDate: NFL_BASELINE_DATE,
  };
}
