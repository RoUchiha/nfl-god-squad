import type { Player, HistoricalTeam, Era } from '../types';
import { computePlayerScore } from '../algorithms/powerRating';
import { generateTeamEras } from '../constants';
import { buildFranchiseDepthNFLPlayers } from './nfl-franchise-depth';

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

// ─── Hardcoded historical rosters (real players, pre-API era) ─────────────────
// Key: `${teamId}-${eraId}`
type HistoricalPlayer = {
  name: string;
  position: Player['position'];
  group: Player['positionGroup'];
  stats: Player['stats'];
  seasonStats?: Player['stats'][];
  isLegend?: boolean;
};

const HISTORICAL_ROSTERS: Record<string, HistoricalPlayer[]> = {
  // Steel Curtain Steelers 1975-1979
  '23-nfl-23-1975': [
    { name: 'Terry Bradshaw',   position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 2915, passingTDs: 28, passerRating: 84, interceptions: 14 } },
    { name: 'Franco Harris',    position: 'RB', group: 'offense', isLegend: true,  stats: { rushingYards: 1246, rushingTDs: 10, receptions: 33 } },
    { name: 'Rocky Bleier',     position: 'RB', group: 'offense',                  stats: { rushingYards: 740, rushingTDs: 5, receptions: 24 } },
    { name: 'Lynn Swann',       position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 880, receivingTDs: 11, receptions: 49 } },
    { name: 'John Stallworth',  position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 798, receivingTDs: 9, receptions: 41 } },
    { name: 'Randy Grossman',   position: 'TE', group: 'offense',                  stats: { receivingYards: 345, receivingTDs: 3, receptions: 28 } },
    { name: 'Roy Gerela',       position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Mean Joe Greene',  position: 'DT', group: 'defense', isLegend: true,  stats: { sacks: 10, tackles: 52 } },
    { name: 'Ernie Holmes',     position: 'DT', group: 'defense',                  stats: { sacks: 6, tackles: 44 } },
    { name: 'L.C. Greenwood',   position: 'DE', group: 'defense',                  stats: { sacks: 11, tackles: 48 } },
    { name: 'Dwight White',     position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 40 } },
    { name: 'Jack Ham',         position: 'LB', group: 'defense', isLegend: true,  stats: { sacks: 5, tackles: 95, interceptions: 4 } },
    { name: 'Jack Lambert',     position: 'LB', group: 'defense', isLegend: true,  stats: { sacks: 6, tackles: 120, interceptions: 5, forcedFumbles: 3 } },
    { name: 'Andy Russell',     position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 88, interceptions: 2 } },
    { name: 'Mel Blount',       position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 7, tackles: 62, passDeflections: 12 } },
    { name: 'J.T. Thomas',      position: 'CB', group: 'defense',                  stats: { interceptions: 4, tackles: 55, passDeflections: 8 } },
    { name: 'Mike Wagner',      position: 'S',  group: 'defense',                  stats: { interceptions: 5, tackles: 70 } },
    { name: 'Glen Edwards',     position: 'S',  group: 'defense',                  stats: { interceptions: 4, tackles: 60 } },
  ],
  // Montana 49ers 1980-1984
  '25-nfl-25-1980': [
    { name: 'Joe Montana',      position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 3521, passingTDs: 26, passerRating: 102, interceptions: 8 } },
    { name: 'Roger Craig',      position: 'RB', group: 'offense', isLegend: true,  stats: { rushingYards: 1050, rushingTDs: 9, receptions: 66 } },
    { name: 'Tom Rathman',      position: 'RB', group: 'offense',                  stats: { rushingYards: 420, rushingTDs: 6, receptions: 41 } },
    { name: 'Jerry Rice',       position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1570, receivingTDs: 22, receptions: 106 } },
    { name: 'John Taylor',      position: 'WR', group: 'offense',                  stats: { receivingYards: 1011, receivingTDs: 10, receptions: 60 } },
    { name: 'Dwight Clark',     position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 840, receivingTDs: 6, receptions: 70 } },
    { name: 'Russ Francis',     position: 'TE', group: 'offense',                  stats: { receivingYards: 665, receivingTDs: 7, receptions: 44 } },
    { name: 'Mike Cofer',       position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Charles Haley',    position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 15, tackles: 55, forcedFumbles: 4 } },
    { name: 'Jeff Stover',      position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 48 } },
    { name: 'Michael Carter',   position: 'DT', group: 'defense',                  stats: { sacks: 5, tackles: 60 } },
    { name: 'Pete Kugler',      position: 'DT', group: 'defense',                  stats: { sacks: 3, tackles: 44 } },
    { name: 'Keena Turner',     position: 'LB', group: 'defense',                  stats: { sacks: 5, tackles: 100, interceptions: 2 } },
    { name: 'Matt Millen',      position: 'LB', group: 'defense',                  stats: { sacks: 3, tackles: 95 } },
    { name: 'Riki Ellison',     position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 88 } },
    { name: 'Ronnie Lott',      position: 'S',  group: 'defense', isLegend: true,  stats: { interceptions: 9, tackles: 80, passDeflections: 15 } },
    { name: 'Carlton Williamson',position: 'S', group: 'defense',                  stats: { interceptions: 5, tackles: 72 } },
    { name: 'Eric Wright',      position: 'CB', group: 'defense',                  stats: { interceptions: 7, tackles: 58, passDeflections: 11 } },
    { name: 'Dwight Hicks',     position: 'CB', group: 'defense',                  stats: { interceptions: 6, tackles: 64 } },
  ],
  // Montana/Young 49ers 1985-1989
  '25-nfl-25-1985': [
    { name: 'Joe Montana',      position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 3521, passingTDs: 26, passerRating: 102, interceptions: 8 } },
    { name: 'Roger Craig',      position: 'RB', group: 'offense', isLegend: true,  stats: { rushingYards: 1050, rushingTDs: 9, receptions: 66 } },
    { name: 'Tom Rathman',      position: 'RB', group: 'offense',                  stats: { rushingYards: 420, rushingTDs: 6, receptions: 41 } },
    { name: 'Jerry Rice',       position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1570, receivingTDs: 22, receptions: 106 } },
    { name: 'John Taylor',      position: 'WR', group: 'offense',                  stats: { receivingYards: 1011, receivingTDs: 10, receptions: 60 } },
    { name: 'Dwight Clark',     position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 840, receivingTDs: 6, receptions: 70 } },
    { name: 'Russ Francis',     position: 'TE', group: 'offense',                  stats: { receivingYards: 665, receivingTDs: 7, receptions: 44 } },
    { name: 'Mike Cofer',       position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Charles Haley',    position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 15, tackles: 55, forcedFumbles: 4 } },
    { name: 'Jeff Stover',      position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 48 } },
    { name: 'Michael Carter',   position: 'DT', group: 'defense',                  stats: { sacks: 5, tackles: 60 } },
    { name: 'Pete Kugler',      position: 'DT', group: 'defense',                  stats: { sacks: 3, tackles: 44 } },
    { name: 'Keena Turner',     position: 'LB', group: 'defense',                  stats: { sacks: 5, tackles: 100, interceptions: 2 } },
    { name: 'Matt Millen',      position: 'LB', group: 'defense',                  stats: { sacks: 3, tackles: 95 } },
    { name: 'Riki Ellison',     position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 88 } },
    { name: 'Ronnie Lott',      position: 'S',  group: 'defense', isLegend: true,  stats: { interceptions: 9, tackles: 80, passDeflections: 15 } },
    { name: 'Carlton Williamson',position: 'S', group: 'defense',                  stats: { interceptions: 5, tackles: 72 } },
    { name: 'Eric Wright',      position: 'CB', group: 'defense',                  stats: { interceptions: 7, tackles: 58, passDeflections: 11 } },
    { name: 'Dwight Hicks',     position: 'CB', group: 'defense',                  stats: { interceptions: 6, tackles: 64 } },
  ],
  // Dallas Dynasty 1990-1994
  '6-nfl-6-1990': [
    { name: 'Troy Aikman',      position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 3200, passingTDs: 23, passerRating: 94, interceptions: 10 } },
    { name: 'Emmitt Smith',     position: 'RB', group: 'offense', isLegend: true,  stats: { rushingYards: 1484, rushingTDs: 21, receptions: 50 } },
    { name: 'Daryl Johnston',   position: 'RB', group: 'offense',                  stats: { rushingYards: 225, rushingTDs: 3, receptions: 44 } },
    { name: 'Michael Irvin',    position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1241, receivingTDs: 9, receptions: 88 } },
    { name: 'Alvin Harper',     position: 'WR', group: 'offense',                  stats: { receivingYards: 771, receivingTDs: 8, receptions: 48 } },
    { name: 'Kevin Williams',   position: 'WR', group: 'offense',                  stats: { receivingYards: 490, receivingTDs: 4, receptions: 36 } },
    { name: 'Jay Novacek',      position: 'TE', group: 'offense',                  stats: { receivingYards: 705, receivingTDs: 5, receptions: 68 } },
    { name: 'Lin Elliott',      position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Charles Haley',    position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 13, tackles: 50, forcedFumbles: 5 } },
    { name: 'Tony Tolbert',     position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 45 } },
    { name: 'Russell Maryland', position: 'DT', group: 'defense',                  stats: { sacks: 5, tackles: 55 } },
    { name: 'Leon Lett',        position: 'DT', group: 'defense',                  stats: { sacks: 6, tackles: 50 } },
    { name: 'Ken Norton Jr.',   position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 115, interceptions: 2 } },
    { name: 'Robert Jones',     position: 'LB', group: 'defense',                  stats: { sacks: 5, tackles: 100 } },
    { name: 'Darrin Smith',     position: 'LB', group: 'defense',                  stats: { sacks: 3, tackles: 88 } },
    { name: 'Deion Sanders',    position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 8, tackles: 48, passDeflections: 18 } },
    { name: 'Kevin Smith',      position: 'CB', group: 'defense',                  stats: { interceptions: 5, tackles: 60, passDeflections: 10 } },
    { name: 'Darren Woodson',   position: 'S',  group: 'defense', isLegend: true,  stats: { interceptions: 5, tackles: 105 } },
    { name: 'Thomas Everett',   position: 'S',  group: 'defense',                  stats: { interceptions: 4, tackles: 78 } },
  ],
  // Dallas Cowboys 1995-1999
  '6-nfl-6-1995': [
    { name: 'Troy Aikman',      position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 3304, passingTDs: 23, passerRating: 93, interceptions: 12 } },
    { name: 'Emmitt Smith',     position: 'RB', group: 'offense', isLegend: true,  stats: { rushingYards: 1773, rushingTDs: 25, receptions: 62 } },
    { name: 'Daryl Johnston',   position: 'RB', group: 'offense',                  stats: { rushingYards: 186, rushingTDs: 4, receptions: 43 } },
    { name: 'Michael Irvin',    position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1603, receivingTDs: 10, receptions: 111 } },
    { name: 'Alvin Harper',     position: 'WR', group: 'offense',                  stats: { receivingYards: 564, receivingTDs: 3, receptions: 34 } },
    { name: 'Eric Bjornson',    position: 'TE', group: 'offense',                  stats: { receivingYards: 470, receivingTDs: 3, receptions: 41 } },
    { name: 'Deion Sanders',    position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 6, tackles: 42, passDeflections: 20 } },
    { name: 'Kevin Smith',      position: 'CB', group: 'defense',                  stats: { interceptions: 4, tackles: 58, passDeflections: 9 } },
    { name: 'Darren Woodson',   position: 'S',  group: 'defense', isLegend: true,  stats: { interceptions: 6, tackles: 110 } },
    { name: 'Brock Marion',     position: 'S',  group: 'defense',                  stats: { interceptions: 4, tackles: 72 } },
    { name: 'Charles Haley',    position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 10, tackles: 44, forcedFumbles: 3 } },
    { name: 'Tony Tolbert',     position: 'DE', group: 'defense',                  stats: { sacks: 7, tackles: 40 } },
    { name: 'Leon Lett',        position: 'DT', group: 'defense',                  stats: { sacks: 5, tackles: 48 } },
    { name: 'Chad Hennings',    position: 'DT', group: 'defense',                  stats: { sacks: 4, tackles: 42 } },
    { name: 'Robert Jones',     position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 95 } },
    { name: 'Darrin Smith',     position: 'LB', group: 'defense',                  stats: { sacks: 3, tackles: 82 } },
    { name: 'Dixon Edwards',    position: 'LB', group: 'defense',                  stats: { sacks: 2, tackles: 90 } },
  ],
  // Belichick Dynasty I (Patriots 2000-2004)
  '17-nfl-17-2000': [
    { name: 'Tom Brady',        position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 4806, passingTDs: 50, passerRating: 117, interceptions: 8 } },
    { name: 'Corey Dillon',     position: 'RB', group: 'offense',                  stats: { rushingYards: 1635, rushingTDs: 12, receptions: 15 } },
    { name: 'Kevin Faulk',      position: 'RB', group: 'offense',                  stats: { rushingYards: 390, rushingTDs: 3, receptions: 49 } },
    { name: 'Randy Moss',       position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1493, receivingTDs: 23, receptions: 98 } },
    { name: 'Wes Welker',       position: 'WR', group: 'offense',                  stats: { receivingYards: 1175, receivingTDs: 8, receptions: 112 } },
    { name: 'Troy Brown',       position: 'WR', group: 'offense',                  stats: { receivingYards: 890, receivingTDs: 6, receptions: 83 } },
    { name: 'Ben Watson',       position: 'TE', group: 'offense',                  stats: { receivingYards: 540, receivingTDs: 4, receptions: 44 } },
    { name: 'Adam Vinatieri',   position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Richard Seymour',  position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 10, tackles: 55, forcedFumbles: 3 } },
    { name: 'Jarvis Green',     position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 45 } },
    { name: 'Vince Wilfork',    position: 'DT', group: 'defense', isLegend: true,  stats: { sacks: 4, tackles: 68, forcedFumbles: 2 } },
    { name: 'Ted Washington',   position: 'DT', group: 'defense',                  stats: { sacks: 3, tackles: 55 } },
    { name: 'Mike Vrabel',      position: 'LB', group: 'defense',                  stats: { sacks: 9, tackles: 98, interceptions: 2 } },
    { name: 'Tedy Bruschi',     position: 'LB', group: 'defense',                  stats: { sacks: 5, tackles: 120, interceptions: 4, forcedFumbles: 2 } },
    { name: 'Willie McGinest',  position: 'LB', group: 'defense',                  stats: { sacks: 11, tackles: 88, forcedFumbles: 4 } },
    { name: 'Ty Law',           position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 10, tackles: 55, passDeflections: 16 } },
    { name: 'Asante Samuel',    position: 'CB', group: 'defense',                  stats: { interceptions: 9, tackles: 48, passDeflections: 14 } },
    { name: 'Rodney Harrison',  position: 'S',  group: 'defense',                  stats: { interceptions: 5, tackles: 95 } },
    { name: 'Eugene Wilson',    position: 'S',  group: 'defense',                  stats: { interceptions: 4, tackles: 72 } },
  ],
  // Belichick Dynasty I (Patriots 2005-2009)
  '17-nfl-17-2005': [
    { name: 'Tom Brady',        position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 4806, passingTDs: 50, passerRating: 117, interceptions: 8 } },
    { name: 'Corey Dillon',     position: 'RB', group: 'offense',                  stats: { rushingYards: 1635, rushingTDs: 12, receptions: 15 } },
    { name: 'Kevin Faulk',      position: 'RB', group: 'offense',                  stats: { rushingYards: 390, rushingTDs: 3, receptions: 49 } },
    { name: 'Randy Moss',       position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1493, receivingTDs: 23, receptions: 98 } },
    { name: 'Wes Welker',       position: 'WR', group: 'offense',                  stats: { receivingYards: 1175, receivingTDs: 8, receptions: 112 } },
    { name: 'Troy Brown',       position: 'WR', group: 'offense',                  stats: { receivingYards: 890, receivingTDs: 6, receptions: 83 } },
    { name: 'Ben Watson',       position: 'TE', group: 'offense',                  stats: { receivingYards: 540, receivingTDs: 4, receptions: 44 } },
    { name: 'Adam Vinatieri',   position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Richard Seymour',  position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 10, tackles: 55, forcedFumbles: 3 } },
    { name: 'Jarvis Green',     position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 45 } },
    { name: 'Vince Wilfork',    position: 'DT', group: 'defense', isLegend: true,  stats: { sacks: 4, tackles: 68, forcedFumbles: 2 } },
    { name: 'Ted Washington',   position: 'DT', group: 'defense',                  stats: { sacks: 3, tackles: 55 } },
    { name: 'Mike Vrabel',      position: 'LB', group: 'defense',                  stats: { sacks: 9, tackles: 98, interceptions: 2 } },
    { name: 'Tedy Bruschi',     position: 'LB', group: 'defense',                  stats: { sacks: 5, tackles: 120, interceptions: 4, forcedFumbles: 2 } },
    { name: 'Willie McGinest',  position: 'LB', group: 'defense',                  stats: { sacks: 11, tackles: 88, forcedFumbles: 4 } },
    { name: 'Ty Law',           position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 10, tackles: 55, passDeflections: 16 } },
    { name: 'Asante Samuel',    position: 'CB', group: 'defense',                  stats: { interceptions: 9, tackles: 48, passDeflections: 14 } },
    { name: 'Rodney Harrison',  position: 'S',  group: 'defense',                  stats: { interceptions: 5, tackles: 95 } },
    { name: 'Eugene Wilson',    position: 'S',  group: 'defense',                  stats: { interceptions: 4, tackles: 72 } },
  ],
  // Belichick Dynasty II (Patriots 2010-2014)
  '17-nfl-17-2010': [
    { name: 'Tom Brady',        position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 4770, passingTDs: 40, passerRating: 112, interceptions: 9 } },
    { name: 'Stevan Ridley',    position: 'RB', group: 'offense',                  stats: { rushingYards: 1263, rushingTDs: 12, receptions: 9 } },
    { name: 'Danny Woodhead',   position: 'RB', group: 'offense',                  stats: { rushingYards: 350, rushingTDs: 5, receptions: 62 } },
    { name: 'Wes Welker',       position: 'WR', group: 'offense',                  stats: { receivingYards: 1569, receivingTDs: 9, receptions: 122 } },
    { name: 'Julian Edelman',   position: 'WR', group: 'offense',                  stats: { receivingYards: 1056, receivingTDs: 7, receptions: 105 } },
    { name: 'Brandon Lloyd',    position: 'WR', group: 'offense',                  stats: { receivingYards: 911, receivingTDs: 4, receptions: 74 } },
    { name: 'Rob Gronkowski',   position: 'TE', group: 'offense', isLegend: true,  stats: { receivingYards: 1327, receivingTDs: 17, receptions: 90 } },
    { name: 'Stephen Gostkowski', position: 'K', group: 'offense',                 stats: {} },
    { name: 'Chandler Jones',   position: 'DE', group: 'defense',                  stats: { sacks: 12, tackles: 48, forcedFumbles: 5 } },
    { name: 'Rob Ninkovich',    position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 52 } },
    { name: 'Vince Wilfork',    position: 'DT', group: 'defense', isLegend: true,  stats: { sacks: 5, tackles: 70, forcedFumbles: 3 } },
    { name: 'Tommy Kelly',      position: 'DT', group: 'defense',                  stats: { sacks: 4, tackles: 50 } },
    { name: 'Jerod Mayo',       position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 138, interceptions: 2 } },
    { name: 'Dont\'a Hightower',position: 'LB', group: 'defense',                  stats: { sacks: 7, tackles: 105, forcedFumbles: 3 } },
    { name: 'Brandon Spikes',   position: 'LB', group: 'defense',                  stats: { sacks: 3, tackles: 98 } },
    { name: 'Darrelle Revis',   position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 5, tackles: 55, passDeflections: 19 } },
    { name: 'Malcolm Butler',   position: 'CB', group: 'defense',                  stats: { interceptions: 5, tackles: 60, passDeflections: 15 } },
    { name: 'Devin McCourty',   position: 'S',  group: 'defense', isLegend: true,  stats: { interceptions: 7, tackles: 80 } },
    { name: 'Patrick Chung',    position: 'S',  group: 'defense',                  stats: { interceptions: 3, tackles: 78 } },
  ],
  // Belichick Dynasty II (Patriots 2015-2019)
  '17-nfl-17-2015': [
    { name: 'Tom Brady',        position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 4770, passingTDs: 40, passerRating: 112, interceptions: 9 } },
    { name: 'Stevan Ridley',    position: 'RB', group: 'offense',                  stats: { rushingYards: 1263, rushingTDs: 12, receptions: 9 } },
    { name: 'Danny Woodhead',   position: 'RB', group: 'offense',                  stats: { rushingYards: 350, rushingTDs: 5, receptions: 62 } },
    { name: 'Wes Welker',       position: 'WR', group: 'offense',                  stats: { receivingYards: 1569, receivingTDs: 9, receptions: 122 } },
    { name: 'Julian Edelman',   position: 'WR', group: 'offense',                  stats: { receivingYards: 1056, receivingTDs: 7, receptions: 105 } },
    { name: 'Brandon Lloyd',    position: 'WR', group: 'offense',                  stats: { receivingYards: 911, receivingTDs: 4, receptions: 74 } },
    { name: 'Rob Gronkowski',   position: 'TE', group: 'offense', isLegend: true,  stats: { receivingYards: 1327, receivingTDs: 17, receptions: 90 } },
    { name: 'Stephen Gostkowski', position: 'K', group: 'offense',                 stats: {} },
    { name: 'Chandler Jones',   position: 'DE', group: 'defense',                  stats: { sacks: 12, tackles: 48, forcedFumbles: 5 } },
    { name: 'Rob Ninkovich',    position: 'DE', group: 'defense',                  stats: { sacks: 8, tackles: 52 } },
    { name: 'Vince Wilfork',    position: 'DT', group: 'defense', isLegend: true,  stats: { sacks: 5, tackles: 70, forcedFumbles: 3 } },
    { name: 'Tommy Kelly',      position: 'DT', group: 'defense',                  stats: { sacks: 4, tackles: 50 } },
    { name: 'Jerod Mayo',       position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 138, interceptions: 2 } },
    { name: 'Dont\'a Hightower',position: 'LB', group: 'defense',                  stats: { sacks: 7, tackles: 105, forcedFumbles: 3 } },
    { name: 'Brandon Spikes',   position: 'LB', group: 'defense',                  stats: { sacks: 3, tackles: 98 } },
    { name: 'Darrelle Revis',   position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 5, tackles: 55, passDeflections: 19 } },
    { name: 'Malcolm Butler',   position: 'CB', group: 'defense',                  stats: { interceptions: 5, tackles: 60, passDeflections: 15 } },
    { name: 'Devin McCourty',   position: 'S',  group: 'defense', isLegend: true,  stats: { interceptions: 7, tackles: 80 } },
    { name: 'Patrick Chung',    position: 'S',  group: 'defense',                  stats: { interceptions: 3, tackles: 78 } },
  ],
  // Mahomes Chiefs 2015-2019
  '12-nfl-12-2015': [
    { name: 'Alex Smith',       position: 'QB', group: 'offense',                  stats: { passingYards: 3346, passingTDs: 26, passerRating: 104, interceptions: 5 } },
    { name: 'Kareem Hunt',      position: 'RB', group: 'offense',                  stats: { rushingYards: 1327, rushingTDs: 8, receptions: 53 } },
    { name: 'Spencer Ware',     position: 'RB', group: 'offense',                  stats: { rushingYards: 921, rushingTDs: 3, receptions: 33 } },
    { name: 'Tyreek Hill',      position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1183, receivingTDs: 7, receptions: 75 } },
    { name: 'Jeremy Maclin',    position: 'WR', group: 'offense',                  stats: { receivingYards: 1088, receivingTDs: 8, receptions: 87 } },
    { name: 'Albert Wilson',    position: 'WR', group: 'offense',                  stats: { receivingYards: 554, receivingTDs: 3, receptions: 42 } },
    { name: 'Travis Kelce',     position: 'TE', group: 'offense', isLegend: true,  stats: { receivingYards: 1125, receivingTDs: 4, receptions: 85 } },
    { name: 'Cairo Santos',     position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Justin Houston',   position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 22, tackles: 55, forcedFumbles: 6 } },
    { name: 'Dee Ford',         position: 'DE', group: 'defense',                  stats: { sacks: 13, tackles: 40 } },
    { name: 'Dontari Poe',      position: 'DT', group: 'defense',                  stats: { sacks: 7, tackles: 58 } },
    { name: 'Bennie Logan',     position: 'DT', group: 'defense',                  stats: { sacks: 3, tackles: 44 } },
    { name: 'Derrick Johnson',  position: 'LB', group: 'defense', isLegend: true,  stats: { sacks: 4, tackles: 122, interceptions: 3 } },
    { name: 'Josh Mauga',       position: 'LB', group: 'defense',                  stats: { sacks: 2, tackles: 98 } },
    { name: 'Tamba Hali',       position: 'LB', group: 'defense',                  stats: { sacks: 8, tackles: 60, forcedFumbles: 3 } },
    { name: 'Marcus Peters',    position: 'CB', group: 'defense', isLegend: true,  stats: { interceptions: 8, tackles: 48, passDeflections: 15 } },
    { name: 'Phillip Gaines',   position: 'CB', group: 'defense',                  stats: { interceptions: 3, tackles: 55, passDeflections: 8 } },
    { name: 'Eric Berry',       position: 'S',  group: 'defense', isLegend: true,  stats: { interceptions: 5, tackles: 78 } },
    { name: 'Ron Parker',       position: 'S',  group: 'defense',                  stats: { interceptions: 4, tackles: 65 } },
  ],
  // Mahomes Chiefs 2020-2024
  '12-nfl-12-2020': [
    { name: 'Patrick Mahomes',  position: 'QB', group: 'offense', isLegend: true,  stats: { passingYards: 5250, passingTDs: 50, passerRating: 113, interceptions: 12 } },
    { name: 'Isiah Pacheco',    position: 'RB', group: 'offense',                  stats: { rushingYards: 935, rushingTDs: 7, receptions: 20 } },
    { name: 'Jerick McKinnon',  position: 'RB', group: 'offense',                  stats: { rushingYards: 215, rushingTDs: 9, receptions: 56 } },
    { name: 'Tyreek Hill',      position: 'WR', group: 'offense', isLegend: true,  stats: { receivingYards: 1276, receivingTDs: 9, receptions: 90 } },
    { name: 'Mecole Hardman',   position: 'WR', group: 'offense',                  stats: { receivingYards: 711, receivingTDs: 6, receptions: 59 } },
    { name: 'Marquez Valdes-Scantling', position: 'WR', group: 'offense',          stats: { receivingYards: 858, receivingTDs: 5, receptions: 47 } },
    { name: 'Travis Kelce',     position: 'TE', group: 'offense', isLegend: true,  stats: { receivingYards: 1338, receivingTDs: 12, receptions: 110 } },
    { name: 'Harrison Butker',  position: 'K',  group: 'offense',                  stats: {} },
    { name: 'Chris Jones',      position: 'DE', group: 'defense', isLegend: true,  stats: { sacks: 15, tackles: 50, forcedFumbles: 4 } },
    { name: 'Frank Clark',      position: 'DE', group: 'defense',                  stats: { sacks: 9, tackles: 44 } },
    { name: 'Derrick Nnadi',    position: 'DT', group: 'defense',                  stats: { sacks: 3, tackles: 55 } },
    { name: 'Khalen Saunders',  position: 'DT', group: 'defense',                  stats: { sacks: 2, tackles: 44 } },
    { name: 'Willie Gay Jr.',   position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 78, interceptions: 2, forcedFumbles: 2 } },
    { name: 'Nick Bolton',      position: 'LB', group: 'defense',                  stats: { sacks: 3, tackles: 131 } },
    { name: 'Drue Tranquill',   position: 'LB', group: 'defense',                  stats: { sacks: 4, tackles: 105 } },
    { name: 'L\'Jarius Sneed',  position: 'CB', group: 'defense',                  stats: { interceptions: 4, tackles: 62, passDeflections: 12 } },
    { name: 'Trent McDuffie',   position: 'CB', group: 'defense',                  stats: { interceptions: 3, tackles: 55, passDeflections: 10 } },
    { name: 'Justin Reid',      position: 'S',  group: 'defense',                  stats: { interceptions: 4, tackles: 82 } },
    { name: 'Juan Thornhill',   position: 'S',  group: 'defense',                  stats: { interceptions: 5, tackles: 70 } },
  ],
};

function nflEraKey(teamId: string, eraId: string): string {
  return `${teamId}-${eraId}`;
}

function normalizePlayerName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function rosterNameSet(key: string): Set<string> {
  return new Set(
    (HISTORICAL_ROSTERS[key] ?? [])
      .filter(player => player.position !== 'K')
      .map(player => normalizePlayerName(player.name))
  );
}

function adjacentRosterOverlap(aKey: string, bKey: string): number {
  const a = rosterNameSet(aKey);
  const b = rosterNameSet(bKey);
  if (a.size === 0 || b.size === 0) return 0;

  let overlap = 0;
  for (const name of a) {
    if (b.has(name)) overlap += 1;
  }

  return overlap / Math.min(a.size, b.size);
}

type CombinedEraGroup = {
  rootKey: string;
  keys: string[];
  teamId: string;
  startYear: number;
  endYear: number;
};

function parsedHistoricalKey(key: string): { teamId: string; eraId: string; startYear: number } {
  const [teamId, sport, sportTeamId, start] = key.split('-');
  return { teamId, eraId: `${sport}-${sportTeamId}-${start}`, startYear: Number(start) };
}

function buildCombinedRosterGroups(): CombinedEraGroup[] {
  const byTeam = new Map<string, string[]>();
  for (const key of Object.keys(HISTORICAL_ROSTERS)) {
    const { teamId } = parsedHistoricalKey(key);
    byTeam.set(teamId, [...(byTeam.get(teamId) ?? []), key]);
  }

  const groups: CombinedEraGroup[] = [];
  for (const [teamId, keys] of byTeam) {
    const ordered = keys.sort((a, b) => parsedHistoricalKey(a).startYear - parsedHistoricalKey(b).startYear);
    let current: string[] = [];

    const flush = () => {
      if (current.length === 0) return;
      const startYear = parsedHistoricalKey(current[0]).startYear;
      const endYear = parsedHistoricalKey(current[current.length - 1]).startYear + 4;
      groups.push({ rootKey: current[0], keys: current, teamId, startYear, endYear });
      current = [];
    };

    for (const key of ordered) {
      if (current.length === 0) {
        current = [key];
        continue;
      }

      const previous = current[current.length - 1];
      const previousStart = parsedHistoricalKey(previous).startYear;
      const nextStart = parsedHistoricalKey(key).startYear;
      const isAdjacent = nextStart - previousStart === 5;
      const hasSameCore = adjacentRosterOverlap(previous, key) >= 0.5;

      if (isAdjacent && hasSameCore) current.push(key);
      else {
        flush();
        current = [key];
      }
    }
    flush();
  }

  return groups;
}

const COMBINED_ROSTER_GROUPS = buildCombinedRosterGroups();
const COMBINED_ROSTER_GROUP_BY_KEY = new Map<string, CombinedEraGroup>();
for (const group of COMBINED_ROSTER_GROUPS) {
  for (const key of group.keys) COMBINED_ROSTER_GROUP_BY_KEY.set(key, group);
}
const NFL_HIDDEN_COMBINED_ERA_KEYS = new Set(
  COMBINED_ROSTER_GROUPS.flatMap(group => group.keys.slice(1))
);

export const NFL_CURATED_ERA_KEYS = Object.keys(HISTORICAL_ROSTERS).filter(key => !NFL_HIDDEN_COMBINED_ERA_KEYS.has(key));

export const NFL_ELITE_SCORE = 90;
export const NFL_SUPERSTAR_SCORE = 93;
export const NFL_GOAT_SCORE = 96;

export function curatedEraWeight(players: Player[]): number {
  const eliteCount = players.filter(player => player.playerScore >= NFL_ELITE_SCORE).length;
  const superstarCount = players.filter(player => player.playerScore >= NFL_SUPERSTAR_SCORE).length;
  const goatCount = players.filter(player => player.playerScore >= NFL_GOAT_SCORE).length;
  const hasEliteUnit = players.some(player => (player.position === 'OL' || player.position === 'DEF') && player.playerScore >= 90);
  const topScore = Math.max(0, ...players.map(player => player.playerScore));

  let weight = topScore >= NFL_GOAT_SCORE
    ? 0.26
    : topScore >= NFL_SUPERSTAR_SCORE
      ? 0.5
      : eliteCount > 0
        ? 0.78
        : 1;

  weight *= Math.pow(0.58, Math.max(0, eliteCount - 1));
  weight *= Math.pow(0.62, Math.max(0, superstarCount - 1));
  weight *= Math.pow(0.7, Math.max(0, goatCount - 1));
  if (hasEliteUnit) weight *= 0.82;

  return Math.max(0.1, Math.round(weight * 1000) / 1000);
}

export interface CuratedNFLEraCatalogEntry {
  key: string;
  team: HistoricalTeam;
  era: Era;
  weight: number;
  elitePlayerCount: number;
  superstarPlayerCount: number;
  goatPlayerCount: number;
}

type UnitMeta = {
  offensiveLine: { name: string; bestSeasonYear: number; stats: Player['stats']; isLegend?: boolean };
  defense: { name: string; bestSeasonYear: number; stats: Player['stats']; isLegend?: boolean };
};

const CURATED_UNITS: Record<string, UnitMeta> = {
  '23-nfl-23-1975': {
    offensiveLine: { name: 'Steelers Dynasty O-Line', bestSeasonYear: 1978, isLegend: true, stats: { sacksAllowed: 31, lineRank: 3, runBlockRank: 4, passBlockRank: 5 } },
    defense: { name: 'Steel Curtain Defense', bestSeasonYear: 1976, isLegend: true, stats: { pointsAllowed: 138, yardsAllowed: 3566, sacks: 46, takeaways: 47 } },
  },
  '25-nfl-25-1980': {
    offensiveLine: { name: 'Walsh West Coast O-Line', bestSeasonYear: 1984, stats: { sacksAllowed: 32, lineRank: 7, runBlockRank: 9, passBlockRank: 5 } },
    defense: { name: '1984 49ers Defense', bestSeasonYear: 1984, stats: { pointsAllowed: 227, yardsAllowed: 4861, sacks: 51, takeaways: 38 } },
  },
  '25-nfl-25-1985': {
    offensiveLine: { name: 'Montana-Rice O-Line', bestSeasonYear: 1989, isLegend: true, stats: { sacksAllowed: 25, lineRank: 4, runBlockRank: 7, passBlockRank: 3 } },
    defense: { name: '1989 49ers Defense', bestSeasonYear: 1989, stats: { pointsAllowed: 253, yardsAllowed: 4880, sacks: 44, takeaways: 34 } },
  },
  '6-nfl-6-1990': {
    offensiveLine: { name: 'Great Wall of Dallas', bestSeasonYear: 1993, isLegend: true, stats: { sacksAllowed: 25, lineRank: 1, runBlockRank: 1, passBlockRank: 3 } },
    defense: { name: '1992 Cowboys Defense', bestSeasonYear: 1992, stats: { pointsAllowed: 243, yardsAllowed: 4470, sacks: 44, takeaways: 37 } },
  },
  '6-nfl-6-1995': {
    offensiveLine: { name: 'Last Triplets O-Line', bestSeasonYear: 1995, isLegend: true, stats: { sacksAllowed: 18, lineRank: 1, runBlockRank: 1, passBlockRank: 2 } },
    defense: { name: '1995 Cowboys Defense', bestSeasonYear: 1995, stats: { pointsAllowed: 291, yardsAllowed: 5050, sacks: 36, takeaways: 31 } },
  },
  '17-nfl-17-2000': {
    offensiveLine: { name: 'Brady Dynasty O-Line I', bestSeasonYear: 2004, stats: { sacksAllowed: 26, lineRank: 8, runBlockRank: 7, passBlockRank: 6 } },
    defense: { name: '2003 Patriots Defense', bestSeasonYear: 2003, isLegend: true, stats: { pointsAllowed: 238, yardsAllowed: 4670, sacks: 41, takeaways: 41 } },
  },
  '17-nfl-17-2005': {
    offensiveLine: { name: 'Brady-Moss Pass Pro Unit', bestSeasonYear: 2007, isLegend: true, stats: { sacksAllowed: 21, lineRank: 2, runBlockRank: 8, passBlockRank: 1 } },
    defense: { name: '2007 Patriots Defense', bestSeasonYear: 2007, stats: { pointsAllowed: 274, yardsAllowed: 4613, sacks: 47, takeaways: 31 } },
  },
  '17-nfl-17-2010': {
    offensiveLine: { name: 'Gronk Era O-Line', bestSeasonYear: 2012, stats: { sacksAllowed: 27, lineRank: 5, runBlockRank: 6, passBlockRank: 5 } },
    defense: { name: '2014 Patriots Defense', bestSeasonYear: 2014, stats: { pointsAllowed: 313, yardsAllowed: 5480, sacks: 40, takeaways: 25 } },
  },
  '17-nfl-17-2015': {
    offensiveLine: { name: 'Late Brady O-Line', bestSeasonYear: 2016, stats: { sacksAllowed: 24, lineRank: 6, runBlockRank: 10, passBlockRank: 4 } },
    defense: { name: '2019 Patriots Defense', bestSeasonYear: 2019, isLegend: true, stats: { pointsAllowed: 225, yardsAllowed: 4414, sacks: 47, takeaways: 36 } },
  },
  '12-nfl-12-2015': {
    offensiveLine: { name: 'Early Reid O-Line', bestSeasonYear: 2018, stats: { sacksAllowed: 26, lineRank: 7, runBlockRank: 11, passBlockRank: 4 } },
    defense: { name: '2016 Chiefs Defense', bestSeasonYear: 2016, stats: { pointsAllowed: 311, yardsAllowed: 5890, sacks: 28, takeaways: 33 } },
  },
  '12-nfl-12-2020': {
    offensiveLine: { name: 'Creed & Thuney O-Line', bestSeasonYear: 2022, isLegend: true, stats: { sacksAllowed: 26, lineRank: 2, runBlockRank: 5, passBlockRank: 2 } },
    defense: { name: '2023 Chiefs Defense', bestSeasonYear: 2023, isLegend: true, stats: { pointsAllowed: 294, yardsAllowed: 4926, sacks: 57, takeaways: 17 } },
  },
};

const LOWER_IS_BETTER_STATS = new Set<keyof Player['stats']>([
  'sacksAllowed',
  'lineRank',
  'runBlockRank',
  'passBlockRank',
  'pointsAllowed',
  'yardsAllowed',
]);

function bestStatsInEra(player: HistoricalPlayer): Player['stats'] {
  const statLines = player.seasonStats && player.seasonStats.length > 0 ? player.seasonStats : [player.stats];
  const best: Player['stats'] = {};

  for (const stats of statLines) {
    for (const [key, value] of Object.entries(stats) as [keyof Player['stats'], number | undefined][]) {
      if (value == null) continue;
      const existing = best[key];
      const lowerIsBetter = LOWER_IS_BETTER_STATS.has(key) || (player.position === 'QB' && key === 'interceptions');
      if (existing == null || (lowerIsBetter ? value < existing : value > existing)) {
        best[key] = value;
      }
    }
  }

  return best;
}

function buildUnitPlayer(
  team: HistoricalTeam,
  era: Era,
  key: string,
  kind: 'offensiveLine' | 'defense',
): Player | null {
  const units = CURATED_UNITS[key];
  const source = units?.[kind];
  if (!source) return null;

  const player: Player = {
    id: `nfl-unit-${team.id}-${era.id}-${kind === 'offensiveLine' ? 'ol' : 'def'}`,
    name: source.name,
    position: kind === 'offensiveLine' ? 'OL' : 'DEF',
    positionGroup: kind === 'offensiveLine' ? 'offense' : 'defense',
    eraId: era.id,
    teamId: team.id,
    bestSeasonYear: source.bestSeasonYear,
    yearsWithTeam: `${era.startYear}-${era.endYear}`,
    stats: source.stats,
    playerScore: 0,
    isLegend: source.isLegend,
  };
  player.playerScore = computePlayerScore(player, 'nfl');
  return player;
}

function bestUnitForGroup(
  team: HistoricalTeam,
  era: Era,
  keys: string[],
  kind: 'offensiveLine' | 'defense',
): Player | null {
  return keys
    .map(key => buildUnitPlayer(team, era, key, kind))
    .filter((player): player is Player => player !== null)
    .sort((a, b) => b.playerScore - a.playerScore)[0] ?? null;
}

function buildCuratedNFLPlayers(team: HistoricalTeam, era: Era): Player[] {
  const requestedKey = nflEraKey(team.id, era.id);
  const group = COMBINED_ROSTER_GROUP_BY_KEY.get(requestedKey);
  if (!group) return buildFranchiseDepthNFLPlayers(team, era);

  const rootEraId = parsedHistoricalKey(group.rootKey).eraId;
  const effectiveEra: Era = {
    ...era,
    id: rootEraId,
    startYear: group.startYear,
    endYear: group.endYear,
    name: group.endYear > group.startYear + 4 ? `${group.startYear}-${group.endYear}` : era.name,
    description: group.endYear > group.startYear + 4
      ? `${team.city} ${team.name} from ${group.startYear}-${group.endYear}`
      : era.description,
  };

  const deduped = new Map<string, Player>();
  let index = 0;
  for (const key of group.keys) {
    for (const historical of HISTORICAL_ROSTERS[key] ?? []) {
      if (historical.group !== 'offense' || historical.position === 'K') continue;
      const player: Player = {
        id: `nfl-hist-${team.id}-${effectiveEra.id}-${index}`,
        name: historical.name,
        position: historical.position,
        positionGroup: historical.group,
        eraId: effectiveEra.id,
        teamId: team.id,
        yearsWithTeam: `${effectiveEra.startYear}-${effectiveEra.endYear}`,
        stats: bestStatsInEra(historical),
        playerScore: 0,
        isLegend: historical.isLegend,
      };
      player.playerScore = computePlayerScore(player, 'nfl');
      index += 1;

      const identity = normalizePlayerName(player.name);
      const existing = deduped.get(identity);
      if (!existing || player.playerScore > existing.playerScore) deduped.set(identity, player);
    }
  }

  const offensiveLine = bestUnitForGroup(team, effectiveEra, group.keys, 'offensiveLine');
  const defense = bestUnitForGroup(team, effectiveEra, group.keys, 'defense');
  const units = [offensiveLine, defense].filter((player): player is Player => player !== null);

  return [...deduped.values(), ...units].sort((a, b) => b.playerScore - a.playerScore);
}

export function getCuratedNFLPlayers(team: HistoricalTeam, era: Era): Player[] {
  return buildCuratedNFLPlayers(team, era);
}

let curatedCatalogCache: CuratedNFLEraCatalogEntry[] | null = null;

export function getCuratedNFLEraCatalog(): CuratedNFLEraCatalogEntry[] {
  if (!curatedCatalogCache) {
    curatedCatalogCache = NFL_TEAMS.flatMap(team => generateTeamEras(team).map(era => {
      const requestedKey = nflEraKey(team.id, era.id);
      if (NFL_HIDDEN_COMBINED_ERA_KEYS.has(requestedKey)) return null;

      const group = COMBINED_ROSTER_GROUP_BY_KEY.get(requestedKey);
      const catalogEra: Era = group && group.endYear > group.startYear + 4
        ? {
            ...era,
            id: parsedHistoricalKey(group.rootKey).eraId,
            startYear: group.startYear,
            endYear: group.endYear,
            name: `${group.startYear}-${group.endYear}`,
            description: `${team.city} ${team.name} from ${group.startYear}-${group.endYear}`,
          }
        : era;

      const players = getCuratedNFLPlayers(team, era);
      return {
        key: nflEraKey(team.id, catalogEra.id),
        team,
        era: catalogEra,
        weight: curatedEraWeight(players),
        elitePlayerCount: players.filter(player => player.playerScore >= NFL_ELITE_SCORE).length,
        superstarPlayerCount: players.filter(player => player.playerScore >= NFL_SUPERSTAR_SCORE).length,
        goatPlayerCount: players.filter(player => player.playerScore >= NFL_GOAT_SCORE).length,
      };
    })).filter((entry): entry is CuratedNFLEraCatalogEntry => entry !== null);
  }
  return curatedCatalogCache;
}

export async function fetchNFLPlayers(team: HistoricalTeam, era: Era): Promise<Player[]> {
  // The playable catalog is backed by synchronous canonical rosters so queue,
  // browser, and simulation validation all agree on the same player identities.
  const canonical = getCuratedNFLPlayers(team, era);
  return canonical.length >= 8 ? canonical : [];
}
