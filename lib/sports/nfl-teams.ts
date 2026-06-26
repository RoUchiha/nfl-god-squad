import type { HistoricalTeam } from '../types';

// Lightweight team directory — intentionally free of any heavy data/algorithm
// imports so client components (e.g. PlayerCard) can resolve a team's display
// name from a `teamId` without pulling the franchise-depth dataset into the
// browser bundle. `nfl.ts` re-exports NFL_TEAMS from here for server code.
export const NFL_TEAMS: HistoricalTeam[] = [
  { id: '22', name: 'Cardinals',  city: 'Arizona',      abbreviation: 'ARI', sport: 'nfl', primaryColor: '#97233F', secondaryColor: '#000000' },
  { id: '1',  name: 'Falcons',    city: 'Atlanta',      abbreviation: 'ATL', sport: 'nfl', primaryColor: '#A71930', secondaryColor: '#000000' },
  { id: '33', name: 'Ravens',     city: 'Baltimore',    abbreviation: 'BAL', sport: 'nfl', primaryColor: '#241773', secondaryColor: '#000000' },
  { id: '2',  name: 'Bills',      city: 'Buffalo',      abbreviation: 'BUF', sport: 'nfl', primaryColor: '#00338D', secondaryColor: '#C60C30' },
  { id: '29', name: 'Panthers',   city: 'Carolina',     abbreviation: 'CAR', sport: 'nfl', primaryColor: '#0085CA', secondaryColor: '#101820' },
  { id: '3',  name: 'Bears',      city: 'Chicago',      abbreviation: 'CHI', sport: 'nfl', primaryColor: '#0B162A', secondaryColor: '#C83803' },
  { id: '4',  name: 'Bengals',    city: 'Cincinnati',   abbreviation: 'CIN', sport: 'nfl', primaryColor: '#FB4F14', secondaryColor: '#000000' },
  { id: '5',  name: 'Browns',     city: 'Cleveland',    abbreviation: 'CLE', sport: 'nfl', primaryColor: '#311D00', secondaryColor: '#FF3C00' },
  { id: '6',  name: 'Cowboys',    city: 'Dallas',       abbreviation: 'DAL', sport: 'nfl', primaryColor: '#003594', secondaryColor: '#041E42' },
  { id: '7',  name: 'Broncos',    city: 'Denver',       abbreviation: 'DEN', sport: 'nfl', primaryColor: '#FB4F14', secondaryColor: '#002244' },
  { id: '8',  name: 'Lions',      city: 'Detroit',      abbreviation: 'DET', sport: 'nfl', primaryColor: '#0076B6', secondaryColor: '#B0B7BC' },
  { id: '9',  name: 'Packers',    city: 'Green Bay',    abbreviation: 'GB',  sport: 'nfl', primaryColor: '#203731', secondaryColor: '#FFB612' },
  { id: '34', name: 'Texans',     city: 'Houston',      abbreviation: 'HOU', sport: 'nfl', primaryColor: '#03202F', secondaryColor: '#A71930' },
  { id: '11', name: 'Colts',      city: 'Indianapolis', abbreviation: 'IND', sport: 'nfl', primaryColor: '#002C5F', secondaryColor: '#A2AAAD' },
  { id: '30', name: 'Jaguars',    city: 'Jacksonville', abbreviation: 'JAX', sport: 'nfl', primaryColor: '#101820', secondaryColor: '#D7A22A' },
  { id: '12', name: 'Chiefs',     city: 'Kansas City',  abbreviation: 'KC',  sport: 'nfl', primaryColor: '#E31837', secondaryColor: '#FFB81C' },
  { id: '13', name: 'Raiders',    city: 'Las Vegas',    abbreviation: 'LV',  sport: 'nfl', primaryColor: '#000000', secondaryColor: '#A5ACAF' },
  { id: '24', name: 'Chargers',   city: 'Los Angeles',  abbreviation: 'LAC', sport: 'nfl', primaryColor: '#0080C6', secondaryColor: '#FFC20E' },
  { id: '14', name: 'Rams',       city: 'Los Angeles',  abbreviation: 'LAR', sport: 'nfl', primaryColor: '#003594', secondaryColor: '#FFA300' },
  { id: '15', name: 'Dolphins',   city: 'Miami',        abbreviation: 'MIA', sport: 'nfl', primaryColor: '#008E97', secondaryColor: '#FC4C02' },
  { id: '16', name: 'Vikings',    city: 'Minnesota',    abbreviation: 'MIN', sport: 'nfl', primaryColor: '#4F2683', secondaryColor: '#FFC62F' },
  { id: '17', name: 'Patriots',   city: 'New England',  abbreviation: 'NE',  sport: 'nfl', primaryColor: '#002244', secondaryColor: '#C60C30' },
  { id: '18', name: 'Saints',     city: 'New Orleans',  abbreviation: 'NO',  sport: 'nfl', primaryColor: '#D3BC8D', secondaryColor: '#101820' },
  { id: '19', name: 'Giants',     city: 'New York',     abbreviation: 'NYG', sport: 'nfl', primaryColor: '#0B2265', secondaryColor: '#A71930' },
  { id: '20', name: 'Jets',       city: 'New York',     abbreviation: 'NYJ', sport: 'nfl', primaryColor: '#125740', secondaryColor: '#000000' },
  { id: '21', name: 'Eagles',     city: 'Philadelphia', abbreviation: 'PHI', sport: 'nfl', primaryColor: '#004C54', secondaryColor: '#A5ACAF' },
  { id: '23', name: 'Steelers',   city: 'Pittsburgh',   abbreviation: 'PIT', sport: 'nfl', primaryColor: '#101820', secondaryColor: '#FFB612' },
  { id: '25', name: '49ers',      city: 'San Francisco',abbreviation: 'SF',  sport: 'nfl', primaryColor: '#AA0000', secondaryColor: '#B3995D' },
  { id: '26', name: 'Seahawks',   city: 'Seattle',      abbreviation: 'SEA', sport: 'nfl', primaryColor: '#002244', secondaryColor: '#69BE28' },
  { id: '27', name: 'Buccaneers', city: 'Tampa Bay',    abbreviation: 'TB',  sport: 'nfl', primaryColor: '#D50A0A', secondaryColor: '#FF7900' },
  { id: '10', name: 'Titans',     city: 'Tennessee',    abbreviation: 'TEN', sport: 'nfl', primaryColor: '#0C2340', secondaryColor: '#4B92DB' },
  { id: '28', name: 'Commanders', city: 'Washington',   abbreviation: 'WAS', sport: 'nfl', primaryColor: '#5A1414', secondaryColor: '#FFB612' },
];

const TEAM_BY_ID: Record<string, HistoricalTeam> = Object.fromEntries(
  NFL_TEAMS.map(team => [team.id, team]),
);

export function getNflTeamById(teamId: string | undefined): HistoricalTeam | null {
  if (!teamId) return null;
  return TEAM_BY_ID[teamId] ?? null;
}
