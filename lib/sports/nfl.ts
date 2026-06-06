import type { Player, HistoricalTeam, Era } from '../types';
import { computePlayerScore } from '../algorithms/powerRating';

export const NFL_TEAMS: HistoricalTeam[] = [
  { id: '22', name: 'Cardinals', city: 'Arizona', abbreviation: 'ARI', sport: 'nfl', primaryColor: '#97233F', secondaryColor: '#000000' },
  { id: '1', name: 'Falcons', city: 'Atlanta', abbreviation: 'ATL', sport: 'nfl', primaryColor: '#A71930', secondaryColor: '#000000' },
  { id: '33', name: 'Ravens', city: 'Baltimore', abbreviation: 'BAL', sport: 'nfl', primaryColor: '#241773', secondaryColor: '#000000' },
  { id: '2', name: 'Bills', city: 'Buffalo', abbreviation: 'BUF', sport: 'nfl', primaryColor: '#00338D', secondaryColor: '#C60C30' },
  { id: '29', name: 'Panthers', city: 'Carolina', abbreviation: 'CAR', sport: 'nfl', primaryColor: '#0085CA', secondaryColor: '#101820' },
  { id: '3', name: 'Bears', city: 'Chicago', abbreviation: 'CHI', sport: 'nfl', primaryColor: '#0B162A', secondaryColor: '#C83803' },
  { id: '4', name: 'Bengals', city: 'Cincinnati', abbreviation: 'CIN', sport: 'nfl', primaryColor: '#FB4F14', secondaryColor: '#000000' },
  { id: '5', name: 'Browns', city: 'Cleveland', abbreviation: 'CLE', sport: 'nfl', primaryColor: '#311D00', secondaryColor: '#FF3C00' },
  { id: '6', name: 'Cowboys', city: 'Dallas', abbreviation: 'DAL', sport: 'nfl', primaryColor: '#003594', secondaryColor: '#041E42' },
  { id: '7', name: 'Broncos', city: 'Denver', abbreviation: 'DEN', sport: 'nfl', primaryColor: '#FB4F14', secondaryColor: '#002244' },
  { id: '8', name: 'Lions', city: 'Detroit', abbreviation: 'DET', sport: 'nfl', primaryColor: '#0076B6', secondaryColor: '#B0B7BC' },
  { id: '9', name: 'Packers', city: 'Green Bay', abbreviation: 'GB', sport: 'nfl', primaryColor: '#203731', secondaryColor: '#FFB612' },
  { id: '34', name: 'Texans', city: 'Houston', abbreviation: 'HOU', sport: 'nfl', primaryColor: '#03202F', secondaryColor: '#A71930' },
  { id: '11', name: 'Colts', city: 'Indianapolis', abbreviation: 'IND', sport: 'nfl', primaryColor: '#002C5F', secondaryColor: '#A2AAAD' },
  { id: '30', name: 'Jaguars', city: 'Jacksonville', abbreviation: 'JAX', sport: 'nfl', primaryColor: '#101820', secondaryColor: '#D7A22A' },
  { id: '12', name: 'Chiefs', city: 'Kansas City', abbreviation: 'KC', sport: 'nfl', primaryColor: '#E31837', secondaryColor: '#FFB81C' },
  { id: '13', name: 'Raiders', city: 'Las Vegas', abbreviation: 'LV', sport: 'nfl', primaryColor: '#000000', secondaryColor: '#A5ACAF' },
  { id: '24', name: 'Chargers', city: 'Los Angeles', abbreviation: 'LAC', sport: 'nfl', primaryColor: '#0080C6', secondaryColor: '#FFC20E' },
  { id: '14', name: 'Rams', city: 'Los Angeles', abbreviation: 'LAR', sport: 'nfl', primaryColor: '#003594', secondaryColor: '#FFA300' },
  { id: '15', name: 'Dolphins', city: 'Miami', abbreviation: 'MIA', sport: 'nfl', primaryColor: '#008E97', secondaryColor: '#FC4C02' },
  { id: '16', name: 'Vikings', city: 'Minnesota', abbreviation: 'MIN', sport: 'nfl', primaryColor: '#4F2683', secondaryColor: '#FFC62F' },
  { id: '17', name: 'Patriots', city: 'New England', abbreviation: 'NE', sport: 'nfl', primaryColor: '#002244', secondaryColor: '#C60C30' },
  { id: '18', name: 'Saints', city: 'New Orleans', abbreviation: 'NO', sport: 'nfl', primaryColor: '#D3BC8D', secondaryColor: '#101820' },
  { id: '19', name: 'Giants', city: 'New York', abbreviation: 'NYG', sport: 'nfl', primaryColor: '#0B2265', secondaryColor: '#A71930' },
  { id: '20', name: 'Jets', city: 'New York', abbreviation: 'NYJ', sport: 'nfl', primaryColor: '#125740', secondaryColor: '#000000' },
  { id: '21', name: 'Eagles', city: 'Philadelphia', abbreviation: 'PHI', sport: 'nfl', primaryColor: '#004C54', secondaryColor: '#A5ACAF' },
  { id: '23', name: 'Steelers', city: 'Pittsburgh', abbreviation: 'PIT', sport: 'nfl', primaryColor: '#101820', secondaryColor: '#FFB612' },
  { id: '25', name: '49ers', city: 'San Francisco', abbreviation: 'SF', sport: 'nfl', primaryColor: '#AA0000', secondaryColor: '#B3995D' },
  { id: '26', name: 'Seahawks', city: 'Seattle', abbreviation: 'SEA', sport: 'nfl', primaryColor: '#002244', secondaryColor: '#69BE28' },
  { id: '27', name: 'Buccaneers', city: 'Tampa Bay', abbreviation: 'TB', sport: 'nfl', primaryColor: '#D50A0A', secondaryColor: '#FF7900' },
  { id: '10', name: 'Titans', city: 'Tennessee', abbreviation: 'TEN', sport: 'nfl', primaryColor: '#0C2340', secondaryColor: '#4B92DB' },
  { id: '28', name: 'Commanders', city: 'Washington', abbreviation: 'WAS', sport: 'nfl', primaryColor: '#5A1414', secondaryColor: '#FFB612' },
];

// ESPN unofficial API
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

interface ESPNRosterAthleteStats {
  displayValue?: string;
  name?: string;
}
interface ESPNRosterAthlete {
  id: string;
  displayName: string;
  position?: { abbreviation: string };
  statistics?: ESPNRosterAthleteStats[];
}

export async function fetchNFLPlayers(team: HistoricalTeam, era: Era): Promise<Player[]> {
  const year = Math.min(era.endYear, 2024);
  const players: Player[] = [];

  try {
    const res = await fetch(
      `${ESPN_BASE}/teams/${team.id}/roster?season=${year}`,
      { next: { revalidate: 3600 } }
    );

    if (res.ok) {
      const data = await res.json();
      const athletes: ESPNRosterAthlete[] = [
        ...(data.athletes?.[0]?.items ?? []), // offense
        ...(data.athletes?.[1]?.items ?? []), // defense
        ...(data.athletes?.[2]?.items ?? []), // special teams
      ];

      for (const athlete of athletes.slice(0, 55)) {
        const pos = athlete.position?.abbreviation ?? 'QB';
        const { position, group } = nflPositionMap(pos);

        const statsMap: Record<string, number> = {};
        for (const s of athlete.statistics ?? []) {
          if (s.name && s.displayValue) {
            const val = parseFloat(s.displayValue.replace(',', ''));
            if (!isNaN(val)) statsMap[s.name] = val;
          }
        }

        const p: Player = {
          id: `nfl-${athlete.id}-${year}`,
          name: athlete.displayName,
          position,
          positionGroup: group,
          yearsWithTeam: `${era.startYear}–${era.endYear}`,
          stats: extractNFLStats(position, statsMap),
          playerScore: 0,
        };
        p.playerScore = computePlayerScore(p, 'nfl');
        players.push(p);
      }
    }
  } catch {
    // fallback below
  }

  if (players.length < 8) return generateFallbackNFLPlayers(team, era);

  // Attach era/team context for bonus calculation
  for (const p of players) { p.eraId = era.id; p.teamId = team.id; }

  // Return starting lineup: top player per key position group, max 20
  return dedupeToStarters(players);
}

function nflPositionMap(pos: string): { position: Player['position']; group: Player['positionGroup'] } {
  const offenseMap: Record<string, Player['position']> = {
    QB: 'QB', RB: 'RB', HB: 'RB', FB: 'RB',
    WR: 'WR', TE: 'TE', K: 'K', P: 'K',
  };
  const defenseMap: Record<string, Player['position']> = {
    DE: 'DE', DT: 'DT', NT: 'DT',
    OLB: 'LB', MLB: 'LB', ILB: 'LB', LB: 'LB',
    CB: 'CB', FS: 'S', SS: 'S', S: 'S', DB: 'CB',
  };
  if (offenseMap[pos]) return { position: offenseMap[pos], group: 'offense' };
  if (defenseMap[pos]) return { position: defenseMap[pos], group: 'defense' };
  return { position: 'LB', group: 'defense' };
}

function extractNFLStats(position: Player['position'], stats: Record<string, number>): Player['stats'] {
  switch (position) {
    case 'QB':
      return {
        passingYards: stats['passingYards'] ?? stats['yds'] ?? 0,
        passingTDs: stats['passingTouchdowns'] ?? stats['td'] ?? 0,
        passerRating: stats['QBRating'] ?? stats['rtg'] ?? 85,
      };
    case 'RB':
      return {
        rushingYards: stats['rushingYards'] ?? stats['yds'] ?? 0,
        rushingTDs: stats['rushingTouchdowns'] ?? stats['td'] ?? 0,
      };
    case 'WR':
    case 'TE':
      return {
        receivingYards: stats['receivingYards'] ?? stats['yds'] ?? 0,
        receivingTDs: stats['receivingTouchdowns'] ?? stats['td'] ?? 0,
        receptions: stats['receptions'] ?? stats['rec'] ?? 0,
      };
    case 'DE':
    case 'DT':
      return {
        sacks: stats['sacks'] ?? 0,
        tackles: stats['totalTackles'] ?? stats['tkl'] ?? 0,
      };
    case 'LB':
      return {
        sacks: stats['sacks'] ?? 0,
        tackles: stats['totalTackles'] ?? stats['tkl'] ?? 0,
        interceptions: stats['interceptions'] ?? stats['int'] ?? 0,
      };
    case 'CB':
    case 'S':
      return {
        interceptions: stats['interceptions'] ?? stats['int'] ?? 0,
        tackles: stats['totalTackles'] ?? stats['tkl'] ?? 0,
      };
    default:
      return {};
  }
}

// Keep only one starter per position slot up to a starting-lineup count
function dedupeToStarters(players: Player[]): Player[] {
  const counts: Record<string, number> = {};
  const maxPerPos: Record<string, number> = { QB: 1, RB: 2, WR: 3, TE: 1, K: 1, DE: 2, DT: 2, LB: 3, CB: 2, S: 2 };
  const result: Player[] = [];
  for (const p of players.sort((a, b) => b.playerScore - a.playerScore)) {
    const pos = String(p.position);
    counts[pos] = (counts[pos] ?? 0) + 1;
    if (counts[pos] <= (maxPerPos[pos] ?? 2)) result.push(p);
  }
  return result;
}

const NFL_FIRST = ['Dak', 'Lamar', 'Josh', 'Patrick', 'Justin', 'Jalen', 'Trevor', 'Tua', 'Sam', 'Derek', 'Marcus', 'Tyreek', 'Davante', 'Stefon', 'Travis', 'Dalton', 'Micah', 'Myles', 'Von', 'Aaron', 'Richard', 'Derrick', 'Christian', 'Nick', 'Roquan'];
const NFL_LAST = ['Smith', 'Jackson', 'Allen', 'Mahomes', 'Herbert', 'Hurts', 'Lawrence', 'Tagovailoa', 'Darnold', 'Carr', 'Mariota', 'Hill', 'Adams', 'Diggs', 'Kelce', 'Schultz', 'Parsons', 'Garrett', 'Miller', 'Donald', 'Sherman', 'Henry', 'McCaffrey', 'Chubb', 'Walker'];

function nflFakeName(seed: number): string {
  return `${NFL_FIRST[seed % NFL_FIRST.length]} ${NFL_LAST[(seed * 7 + 5) % NFL_LAST.length]}`;
}

function generateFallbackNFLPlayers(team: HistoricalTeam, era: Era): Player[] {
  const templates: Array<{ pos: Player['position']; group: Player['positionGroup']; idx: number }> = [
    { pos: 'QB', group: 'offense', idx: 0 },
    { pos: 'RB', group: 'offense', idx: 1 },
    { pos: 'WR', group: 'offense', idx: 2 },
    { pos: 'WR', group: 'offense', idx: 3 },
    { pos: 'WR', group: 'offense', idx: 4 },
    { pos: 'TE', group: 'offense', idx: 5 },
    { pos: 'K',  group: 'offense', idx: 6 },
    { pos: 'DE', group: 'defense', idx: 7 },
    { pos: 'DE', group: 'defense', idx: 8 },
    { pos: 'DT', group: 'defense', idx: 9 },
    { pos: 'LB', group: 'defense', idx: 10 },
    { pos: 'LB', group: 'defense', idx: 11 },
    { pos: 'CB', group: 'defense', idx: 12 },
    { pos: 'CB', group: 'defense', idx: 13 },
    { pos: 'S',  group: 'defense', idx: 14 },
  ];

  const teamSeed = parseInt(team.id, 10) * 11;

  return templates.map(({ pos, group, idx }) => {
    const s = teamSeed + idx;
    let stats: Player['stats'] = {};
    if (pos === 'QB') stats = { passingYards: 3500 + (s * 97 % 1500), passingTDs: 25 + (s * 13 % 15), passerRating: 85 + (s * 7 % 15), interceptions: 6 + (s % 8) };
    else if (pos === 'RB') stats = { rushingYards: 800 + (s * 83 % 800), rushingTDs: 6 + (s * 11 % 8), receptions: 30 + (s % 30) };
    else if (pos === 'WR') stats = { receivingYards: 700 + (s * 73 % 700), receivingTDs: 4 + (s * 9 % 8), receptions: 55 + (s % 40) };
    else if (pos === 'TE') stats = { receivingYards: 500 + (s * 61 % 500), receivingTDs: 4 + (s % 6), receptions: 45 + (s % 30) };
    else if (pos === 'DE') stats = { sacks: 8 + (s * 3 % 10), tackles: 40 + (s * 5 % 30), forcedFumbles: s % 4 };
    else if (pos === 'DT') stats = { sacks: 4 + (s * 2 % 6), tackles: 35 + (s * 4 % 25), forcedFumbles: s % 3 };
    else if (pos === 'LB') stats = { sacks: 3 + (s % 5), tackles: 90 + (s * 7 % 50), interceptions: s % 3, forcedFumbles: s % 3 };
    else if (pos === 'CB' || pos === 'S') stats = { interceptions: 1 + (s * 3 % 4), tackles: 55 + (s * 6 % 35), passDeflections: 5 + (s % 8) };

    const p: Player = {
      id: `nfl-fb-${team.id}-${idx}`,
      name: nflFakeName(s),
      position: pos,
      positionGroup: group,
      eraId: era.id,
      teamId: team.id,
      yearsWithTeam: `${era.startYear}–${era.endYear}`,
      stats,
      playerScore: 0,
    };
    p.playerScore = computePlayerScore(p, 'nfl');
    return p;
  }).sort((a, b) => b.playerScore - a.playerScore);
}
