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

const FIRST_NAMES = ['Marcus', 'DeShawn', 'Tyrell', 'Jordan', 'Andre', 'Kevin', 'Darius', 'Malik', 'Jalen', 'Trae', 'Donovan', 'Bam', 'Jaylen', 'Brandon', 'Miles', 'Gary', 'Isaiah', 'Chris', 'Paul', 'Tony', 'Dwight', 'Shawn', 'Allen', 'Grant', 'Chauncey'];
const LAST_NAMES  = ['Williams', 'Johnson', 'Mitchell', 'Davis', 'Brown', 'Thompson', 'Jackson', 'Harris', 'Robinson', 'Walker', 'Carter', 'Edwards', 'Green', 'Baker', 'Nelson', 'Hill', 'Thomas', 'Martin', 'Scott', 'Young', 'Collins', 'Parker', 'Adams', 'Moore', 'White'];

function fakeName(seed: number): string {
  return `${FIRST_NAMES[seed % FIRST_NAMES.length]} ${LAST_NAMES[(seed * 7 + 3) % LAST_NAMES.length]}`;
}

type RawStat = {
  player: { id: number; first_name: string; last_name: string; position: string };
  pts: number; reb: number; ast: number; stl: number; blk: number;
  fg_pct: number; fg3_pct: number; ft_pct: number; turnover: number;
};

const POS_MAP: Record<string, Player['position']> = {
  PG: 'PG', SG: 'SG', SF: 'SF', PF: 'PF', C: 'C',
  G: 'SG', F: 'SF', 'F-G': 'SG', 'G-F': 'SF', 'F-C': 'PF', 'C-F': 'C',
};

async function fetchSeasonStats(teamId: string, season: number, apiKey: string): Promise<RawStat[]> {
  const url = new URL(`${NBA_API}/stats`);
  url.searchParams.set('team_ids[]', teamId);
  url.searchParams.set('season', String(season));
  url.searchParams.set('per_page', '100');
  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

export async function fetchNBAPlayers(team: HistoricalTeam, era: Era, apiKey?: string): Promise<Player[]> {
  if (!apiKey) return generateFallbackNBAPlayers(team, era);

  // Check up to 3 seasons in the era to find each player's BEST season
  const yearsToCheck = Array.from(
    new Set([era.startYear, Math.round((era.startYear + era.endYear) / 2), era.endYear])
  ).filter(y => y >= 1979 && y <= 2023);

  const allStats: RawStat[] = [];
  try {
    const results = await Promise.all(yearsToCheck.map(y => fetchSeasonStats(team.id, y, apiKey)));
    for (const r of results) allStats.push(...r);
  } catch {
    return generateFallbackNBAPlayers(team, era);
  }

  if (allStats.length === 0) return generateFallbackNBAPlayers(team, era);

  // For each player, aggregate per game within each season, then keep best season
  type SeasonBucket = { info: RawStat['player']; sum: { pts: number; reb: number; ast: number; stl: number; blk: number; fg_pct: number; fg3_pct: number; ft_pct: number; turnover: number }; count: number; season: number };
  const byPlayerSeason = new Map<string, SeasonBucket>();

  for (const s of allStats) {
    if (!s.player?.id) continue;
    // Determine which season this game belongs to by position in yearsToCheck
    // We can't recover this from allStats directly, so we re-fetch per season below
  }

  // Better: aggregate per-season per player across separate fetches
  const seasonData: Array<{ season: number; stats: RawStat[] }> = [];
  try {
    for (const year of yearsToCheck) {
      const stats = await fetchSeasonStats(team.id, year, apiKey);
      if (stats.length > 0) seasonData.push({ season: year, stats });
    }
  } catch {
    // use what we have
  }

  if (seasonData.length === 0) return generateFallbackNBAPlayers(team, era);

  // Per season, compute each player's average. Then keep each player's best season.
  const bestByPlayer = new Map<number, { info: RawStat['player']; avg: { pts: number; reb: number; ast: number; stl: number; blk: number; fg_pct: number; fg3_pct: number; ft_pct: number }; season: number }>();

  for (const { season, stats } of seasonData) {
    const totals = new Map<number, { info: RawStat['player']; sum: { pts: number; reb: number; ast: number; stl: number; blk: number; fg_pct: number; fg3_pct: number; ft_pct: number }; count: number }>();
    for (const s of stats) {
      if (!s.player?.id) continue;
      const ex = totals.get(s.player.id);
      if (ex) {
        ex.sum.pts += s.pts ?? 0; ex.sum.reb += s.reb ?? 0; ex.sum.ast += s.ast ?? 0;
        ex.sum.stl += s.stl ?? 0; ex.sum.blk += s.blk ?? 0;
        ex.sum.fg_pct += s.fg_pct ?? 0; ex.sum.fg3_pct += s.fg3_pct ?? 0; ex.sum.ft_pct += s.ft_pct ?? 0;
        ex.count++;
      } else {
        totals.set(s.player.id, { info: s.player, sum: { pts: s.pts ?? 0, reb: s.reb ?? 0, ast: s.ast ?? 0, stl: s.stl ?? 0, blk: s.blk ?? 0, fg_pct: s.fg_pct ?? 0, fg3_pct: s.fg3_pct ?? 0, ft_pct: s.ft_pct ?? 0 }, count: 1 });
      }
    }
    for (const { info, sum, count } of Array.from(totals.values())) {
      if (count < 5) continue;
      const avg = { pts: sum.pts / count, reb: sum.reb / count, ast: sum.ast / count, stl: sum.stl / count, blk: sum.blk / count, fg_pct: sum.fg_pct / count, fg3_pct: sum.fg3_pct / count, ft_pct: sum.ft_pct / count };
      const existing = bestByPlayer.get(info.id);
      if (!existing || avg.pts > existing.avg.pts) {
        bestByPlayer.set(info.id, { info, avg, season });
      }
    }
  }

  const players: Player[] = [];
  for (const { info, avg, season } of Array.from(bestByPlayer.values())) {
    const position = POS_MAP[info.position] ?? 'SF';
    const r = (v: number) => Math.round(v * 10) / 10;
    const rp = (v: number) => Math.round(v * 1000) / 1000;
    const p: Player = {
      id: `nba-${info.id}-${season}`,
      name: `${info.first_name} ${info.last_name}`,
      position,
      positionGroup: 'offense',
      eraId: era.id,
      teamId: team.id,
      bestSeasonYear: season,
      yearsWithTeam: `${era.startYear}–${era.endYear}`,
      stats: {
        points: r(avg.pts), rebounds: r(avg.reb), assists: r(avg.ast),
        steals: r(avg.stl), blocks: r(avg.blk),
        fieldGoalPct: rp(avg.fg_pct), threePointPct: rp(avg.fg3_pct), freeThrowPct: rp(avg.ft_pct),
      },
      playerScore: 0,
    };
    p.playerScore = computePlayerScore(p, 'nba');
    players.push(p);
  }

  if (players.length < 5) return generateFallbackNBAPlayers(team, era);

  // Return top 8 starters (starting lineup + a couple key reserves)
  return players.sort((a, b) => b.playerScore - a.playerScore).slice(0, 8);
}

// Starting-lineup positions (5 starters + 3 reserve spots)
const STARTER_TEMPLATES: Array<{ pos: Player['position']; idx: number }> = [
  { pos: 'PG', idx: 0 }, { pos: 'SG', idx: 1 }, { pos: 'SF', idx: 2 },
  { pos: 'PF', idx: 3 }, { pos: 'C',  idx: 4 },
  { pos: 'PG', idx: 5 }, { pos: 'SF', idx: 6 }, { pos: 'PF', idx: 7 },
];

function generateFallbackNBAPlayers(team: HistoricalTeam, era: Era): Player[] {
  const teamSeed = parseInt(team.id, 10) * 13;

  return STARTER_TEMPLATES.map(({ pos, idx }) => {
    const s = teamSeed + idx;
    // Generate peak-season caliber stats (not average — this is their best year)
    const basePts = pos === 'PG' ? 22 : pos === 'SG' ? 20 : pos === 'SF' ? 19 : pos === 'PF' ? 17 : 15;
    const pts = basePts + (s % 12);
    const p: Player = {
      id: `nba-fb-${team.id}-${idx}`,
      name: fakeName(s),
      position: pos,
      positionGroup: 'offense',
      eraId: era.id,
      teamId: team.id,
      yearsWithTeam: `${era.startYear}–${era.endYear}`,
      stats: {
        points: pts,
        rebounds: (pos === 'C' ? 10 : pos === 'PF' ? 8 : 4) + (s * 3 % 4),
        assists: (pos === 'PG' ? 7 : pos === 'SG' ? 4 : 3) + (s * 5 % 4),
        steals: Math.round(((s % 18) / 10) * 10) / 10,
        blocks: pos === 'C' ? 1.5 + (s % 10) / 10 : Math.round(((s * 2 % 12) / 10) * 10) / 10,
        fieldGoalPct: (pos === 'C' ? 0.52 : 0.44) + (s * 7 % 10) / 100,
        threePointPct: (pos === 'PG' || pos === 'SG' ? 0.36 : 0.32) + (s * 11 % 8) / 100,
        freeThrowPct: 0.74 + (s * 9 % 18) / 100,
      },
      playerScore: 0,
    };
    p.playerScore = computePlayerScore(p, 'nba');
    return p;
  }).sort((a, b) => b.playerScore - a.playerScore);
}
