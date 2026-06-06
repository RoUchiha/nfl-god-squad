import type { Player, HistoricalTeam, Era } from '../types';
import { computePlayerScore } from '../algorithms/powerRating';

const NBA_API = 'https://api.balldontlie.io/v1';

export const NBA_TEAMS: HistoricalTeam[] = [
  { id: '1', name: 'Hawks', city: 'Atlanta', abbreviation: 'ATL', sport: 'nba', primaryColor: '#E03A3E', secondaryColor: '#C1D32F' },
  { id: '2', name: 'Celtics', city: 'Boston', abbreviation: 'BOS', sport: 'nba', primaryColor: '#007A33', secondaryColor: '#BA9653' },
  { id: '3', name: 'Nets', city: 'Brooklyn', abbreviation: 'BKN', sport: 'nba', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: '4', name: 'Hornets', city: 'Charlotte', abbreviation: 'CHA', sport: 'nba', primaryColor: '#1D1160', secondaryColor: '#00788C' },
  { id: '5', name: 'Bulls', city: 'Chicago', abbreviation: 'CHI', sport: 'nba', primaryColor: '#CE1141', secondaryColor: '#000000' },
  { id: '6', name: 'Cavaliers', city: 'Cleveland', abbreviation: 'CLE', sport: 'nba', primaryColor: '#860038', secondaryColor: '#FDBB30' },
  { id: '7', name: 'Mavericks', city: 'Dallas', abbreviation: 'DAL', sport: 'nba', primaryColor: '#00538C', secondaryColor: '#002B5E' },
  { id: '8', name: 'Nuggets', city: 'Denver', abbreviation: 'DEN', sport: 'nba', primaryColor: '#0E2240', secondaryColor: '#FEC524' },
  { id: '9', name: 'Pistons', city: 'Detroit', abbreviation: 'DET', sport: 'nba', primaryColor: '#C8102E', secondaryColor: '#1D42BA' },
  { id: '10', name: 'Warriors', city: 'Golden State', abbreviation: 'GSW', sport: 'nba', primaryColor: '#1D428A', secondaryColor: '#FFC72C' },
  { id: '11', name: 'Rockets', city: 'Houston', abbreviation: 'HOU', sport: 'nba', primaryColor: '#CE1141', secondaryColor: '#000000' },
  { id: '12', name: 'Pacers', city: 'Indiana', abbreviation: 'IND', sport: 'nba', primaryColor: '#002D62', secondaryColor: '#FDBB30' },
  { id: '13', name: 'Clippers', city: 'Los Angeles', abbreviation: 'LAC', sport: 'nba', primaryColor: '#C8102E', secondaryColor: '#1D428A' },
  { id: '14', name: 'Lakers', city: 'Los Angeles', abbreviation: 'LAL', sport: 'nba', primaryColor: '#552583', secondaryColor: '#FDB927' },
  { id: '15', name: 'Grizzlies', city: 'Memphis', abbreviation: 'MEM', sport: 'nba', primaryColor: '#5D76A9', secondaryColor: '#12173F' },
  { id: '16', name: 'Heat', city: 'Miami', abbreviation: 'MIA', sport: 'nba', primaryColor: '#98002E', secondaryColor: '#F9A01B' },
  { id: '17', name: 'Bucks', city: 'Milwaukee', abbreviation: 'MIL', sport: 'nba', primaryColor: '#00471B', secondaryColor: '#EEE1C6' },
  { id: '18', name: 'Timberwolves', city: 'Minnesota', abbreviation: 'MIN', sport: 'nba', primaryColor: '#0C2340', secondaryColor: '#236192' },
  { id: '19', name: 'Pelicans', city: 'New Orleans', abbreviation: 'NOP', sport: 'nba', primaryColor: '#0C2340', secondaryColor: '#C8102E' },
  { id: '20', name: 'Knicks', city: 'New York', abbreviation: 'NYK', sport: 'nba', primaryColor: '#006BB6', secondaryColor: '#F58426' },
  { id: '21', name: 'Thunder', city: 'Oklahoma City', abbreviation: 'OKC', sport: 'nba', primaryColor: '#007AC1', secondaryColor: '#EF3B24' },
  { id: '22', name: 'Magic', city: 'Orlando', abbreviation: 'ORL', sport: 'nba', primaryColor: '#0077C0', secondaryColor: '#C4CED4' },
  { id: '23', name: '76ers', city: 'Philadelphia', abbreviation: 'PHI', sport: 'nba', primaryColor: '#006BB6', secondaryColor: '#ED174C' },
  { id: '24', name: 'Suns', city: 'Phoenix', abbreviation: 'PHX', sport: 'nba', primaryColor: '#1D1160', secondaryColor: '#E56020' },
  { id: '25', name: 'Trail Blazers', city: 'Portland', abbreviation: 'POR', sport: 'nba', primaryColor: '#E03A3E', secondaryColor: '#000000' },
  { id: '26', name: 'Kings', city: 'Sacramento', abbreviation: 'SAC', sport: 'nba', primaryColor: '#5A2D81', secondaryColor: '#63727A' },
  { id: '27', name: 'Spurs', city: 'San Antonio', abbreviation: 'SAS', sport: 'nba', primaryColor: '#C4CED4', secondaryColor: '#000000' },
  { id: '28', name: 'Raptors', city: 'Toronto', abbreviation: 'TOR', sport: 'nba', primaryColor: '#CE1141', secondaryColor: '#000000' },
  { id: '29', name: 'Jazz', city: 'Utah', abbreviation: 'UTA', sport: 'nba', primaryColor: '#002B5C', secondaryColor: '#00471B' },
  { id: '30', name: 'Wizards', city: 'Washington', abbreviation: 'WAS', sport: 'nba', primaryColor: '#002B5C', secondaryColor: '#E31837' },
];

// Deterministic name pools for fallback
const FIRST_NAMES = ['Marcus', 'DeShawn', 'Tyrell', 'Jordan', 'Andre', 'Kevin', 'Darius', 'Malik', 'Jalen', 'Trae', 'Donovan', 'Bam', 'Jaylen', 'Brandon', 'Miles', 'Gary', 'Isaiah', 'Chris', 'Paul', 'Tony', 'Dwight', 'Shawn', 'Allen', 'Grant', 'Chauncey'];
const LAST_NAMES = ['Williams', 'Johnson', 'Mitchell', 'Davis', 'Brown', 'Thompson', 'Jackson', 'Harris', 'Robinson', 'Walker', 'Carter', 'Edwards', 'Green', 'Baker', 'Nelson', 'Hill', 'Thomas', 'Martin', 'Scott', 'Young', 'Collins', 'Parker', 'Adams', 'Moore', 'White'];

export function nbaFakeName(seed: number): string {
  return `${FIRST_NAMES[seed % FIRST_NAMES.length]} ${LAST_NAMES[(seed * 7 + 3) % LAST_NAMES.length]}`;
}

export async function fetchNBAPlayers(team: HistoricalTeam, era: Era, apiKey?: string): Promise<Player[]> {
  if (!apiKey) return generateFallbackNBAPlayers(team, era);

  const season = Math.min(Math.round((era.startYear + era.endYear) / 2), 2023);
  const players: Player[] = [];

  try {
    const statsUrl = new URL(`${NBA_API}/stats`);
    statsUrl.searchParams.set('team_ids[]', team.id);
    statsUrl.searchParams.set('season', String(season));
    statsUrl.searchParams.set('per_page', '100');

    const res = await fetch(statsUrl.toString(), {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`NBA API: ${res.status}`);
    const data = await res.json();

    type RawStat = {
      player: { id: number; first_name: string; last_name: string; position: string };
      pts: number; reb: number; ast: number; stl: number; blk: number;
      fg_pct: number; fg3_pct: number; ft_pct: number; turnover: number;
    };

    const rawStats: RawStat[] = data.data ?? [];

    // Aggregate per-game stats into true season averages
    const totals = new Map<number, {
      info: RawStat['player'];
      sum: { pts: number; reb: number; ast: number; stl: number; blk: number; fg_pct: number; fg3_pct: number; ft_pct: number; turnover: number };
      count: number;
    }>();

    for (const s of rawStats) {
      if (!s.player?.id) continue;
      const existing = totals.get(s.player.id);
      if (existing) {
        existing.sum.pts      += s.pts ?? 0;
        existing.sum.reb      += s.reb ?? 0;
        existing.sum.ast      += s.ast ?? 0;
        existing.sum.stl      += s.stl ?? 0;
        existing.sum.blk      += s.blk ?? 0;
        existing.sum.turnover += s.turnover ?? 0;
        existing.sum.fg_pct   += s.fg_pct ?? 0;
        existing.sum.fg3_pct  += s.fg3_pct ?? 0;
        existing.sum.ft_pct   += s.ft_pct ?? 0;
        existing.count++;
      } else {
        totals.set(s.player.id, {
          info: s.player,
          sum: {
            pts: s.pts ?? 0, reb: s.reb ?? 0, ast: s.ast ?? 0,
            stl: s.stl ?? 0, blk: s.blk ?? 0, turnover: s.turnover ?? 0,
            fg_pct: s.fg_pct ?? 0, fg3_pct: s.fg3_pct ?? 0, ft_pct: s.ft_pct ?? 0,
          },
          count: 1,
        });
      }
    }

    const posMap: Record<string, Player['position']> = {
      PG: 'PG', SG: 'SG', SF: 'SF', PF: 'PF', C: 'C',
      G: 'SG', F: 'SF', 'F-G': 'SG', 'G-F': 'SF', 'F-C': 'PF', 'C-F': 'C',
    };

    for (const { info, sum, count } of Array.from(totals.values())) {
      if (count < 5) continue;
      const avg = (v: number) => Math.round((v / count) * 10) / 10;
      const avgPct = (v: number) => Math.round((v / count) * 1000) / 1000;
      const position = posMap[info.position] ?? 'SF';

      const p: Player = {
        id: `nba-${info.id}-${season}`,
        name: `${info.first_name} ${info.last_name}`,
        position,
        positionGroup: 'offense',
        yearsWithTeam: `${era.startYear}–${era.endYear}`,
        stats: {
          points: avg(sum.pts),
          rebounds: avg(sum.reb),
          assists: avg(sum.ast),
          steals: avg(sum.stl),
          blocks: avg(sum.blk),
          turnovers: avg(sum.turnover),
          fieldGoalPct: avgPct(sum.fg_pct),
          threePointPct: avgPct(sum.fg3_pct),
          freeThrowPct: avgPct(sum.ft_pct),
        },
        playerScore: 0,
      };
      p.playerScore = computePlayerScore(p, 'nba');
      players.push(p);
    }
  } catch {
    return generateFallbackNBAPlayers(team, era);
  }

  if (players.length < 5) return generateFallbackNBAPlayers(team, era);
  return players.sort((a, b) => b.playerScore - a.playerScore).slice(0, 20);
}

function generateFallbackNBAPlayers(team: HistoricalTeam, era: Era): Player[] {
  const positions: Array<{ pos: Player['position']; idx: number }> = [
    { pos: 'PG', idx: 0 }, { pos: 'PG', idx: 1 },
    { pos: 'SG', idx: 2 }, { pos: 'SG', idx: 3 },
    { pos: 'SF', idx: 4 }, { pos: 'SF', idx: 5 },
    { pos: 'PF', idx: 6 }, { pos: 'PF', idx: 7 },
    { pos: 'C',  idx: 8 }, { pos: 'C',  idx: 9 },
    { pos: 'SF', idx: 10 }, { pos: 'PF', idx: 11 },
  ];

  const teamSeed = parseInt(team.id, 10) * 13;

  return positions.map(({ pos, idx }) => {
    const s = teamSeed + idx;
    const pts = 10 + (s % 19);
    const p: Player = {
      id: `nba-fb-${team.id}-${idx}`,
      name: nbaFakeName(s),
      position: pos,
      positionGroup: 'offense',
      yearsWithTeam: `${era.startYear}–${era.endYear}`,
      stats: {
        points: pts,
        rebounds: 3 + (s * 3 % 8),
        assists: 2 + (s * 5 % 7),
        steals: Math.round(((s % 20) / 10) * 10) / 10,
        blocks: Math.round(((s * 2 % 15) / 10) * 10) / 10,
        turnovers: Math.round((1 + s % 3) * 10) / 10,
        fieldGoalPct: 0.42 + (s * 7 % 13) / 100,
        threePointPct: 0.31 + (s * 11 % 13) / 100,
        freeThrowPct: 0.70 + (s * 9 % 21) / 100,
      },
      playerScore: 0,
    };
    p.playerScore = computePlayerScore(p, 'nba');
    return p;
  }).sort((a, b) => b.playerScore - a.playerScore);
}
