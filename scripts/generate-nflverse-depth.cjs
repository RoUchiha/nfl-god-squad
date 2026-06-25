const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLAYER_DIR = path.join(ROOT, '.tmp-data', 'player-reg');
const TEAM_DIR = path.join(ROOT, '.tmp-data', 'team-reg');
const OUT_FILE = path.join(ROOT, 'lib', 'sports', 'nflverse-generated-depth.ts');

const TEAM_BY_ABBR = {
  ARI: '22', ARZ: '22',
  ATL: '1',
  BAL: '33',
  BUF: '2',
  CAR: '29',
  CHI: '3',
  CIN: '4',
  CLE: '5',
  DAL: '6',
  DEN: '7',
  DET: '8',
  GB: '9',
  HOU: '34',
  IND: '11',
  JAX: '30', JAC: '30',
  KC: '12',
  LV: '13', OAK: '13', LVR: '13',
  LAC: '24', SD: '24',
  LAR: '14', LA: '14', STL: '14',
  MIA: '15',
  MIN: '16',
  NE: '17',
  NO: '18',
  NYG: '19',
  NYJ: '20',
  PHI: '21',
  PIT: '23',
  SF: '25', SFO: '25',
  SEA: '26',
  TB: '27', TAM: '27',
  TEN: '10', HOUOIL: '10',
  WAS: '28', WSH: '28',
};

const HOF_AND_FRANCHISE_STARS = new Set([
  'aaron rodgers', 'adrian peterson', 'andre johnson', 'antonio gates', 'ben roethlisberger',
  'brett favre', 'calvin johnson', 'christian mccaffrey', 'drew brees', 'edgerrin james',
  'frank gore', 'jason witten', 'joe thomas', 'josh allen', 'julio jones', 'kurt warner',
  'ladainian tomlinson', 'larry fitzgerald', 'marshall faulk', 'michael strahan',
  'patrick mahomes', 'peyton manning', 'randy moss', 'ray lewis', 'rob gronkowski',
  'steve smith', 'terrell owens', 'tom brady', 'tony gonzalez', 'travis kelce',
  'trent williams', 'troy polamalu', 'tyreek hill', 'walter jones',
]);

const DEFENSE_STARS_BY_TEAM_ERA = {
  '3-2005': { stars: 3, hof: 1 },
  '3-2010': { stars: 2, hof: 1 },
  '33-2000': { stars: 5, hof: 2 },
  '33-2005': { stars: 4, hof: 2 },
  '33-2010': { stars: 4, hof: 2 },
  '5-2020': { stars: 2, hof: 0 },
  '6-2005': { stars: 2, hof: 1 },
  '7-2015': { stars: 5, hof: 1 },
  '9-2010': { stars: 3, hof: 1 },
  '12-2020': { stars: 3, hof: 0 },
  '13-2000': { stars: 2, hof: 1 },
  '14-2015': { stars: 3, hof: 1 },
  '16-2005': { stars: 3, hof: 1 },
  '17-2000': { stars: 4, hof: 1 },
  '17-2015': { stars: 4, hof: 0 },
  '21-2020': { stars: 3, hof: 0 },
  '23-2005': { stars: 5, hof: 2 },
  '23-2010': { stars: 4, hof: 2 },
  '25-2010': { stars: 4, hof: 1 },
  '25-2015': { stars: 3, hof: 1 },
  '26-2010': { stars: 5, hof: 1 },
  '27-2000': { stars: 5, hof: 3 },
  '27-2020': { stars: 3, hof: 0 },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() ?? [];
  return rows.filter(r => r.length === headers.length).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

function num(value) {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function passerRating(row) {
  const attempts = num(row.attempts);
  if (attempts <= 0) return 0;
  const a = Math.max(0, Math.min(2.375, ((num(row.completions) / attempts) - 0.3) * 5));
  const b = Math.max(0, Math.min(2.375, ((num(row.passing_yards) / attempts) - 3) * 0.25));
  const c = Math.max(0, Math.min(2.375, (num(row.passing_tds) / attempts) * 20));
  const d = Math.max(0, Math.min(2.375, 2.375 - ((num(row.passing_interceptions) / attempts) * 25)));
  return Math.round(((a + b + c + d) / 6) * 1000) / 10;
}

function playerScore(row, position) {
  if (position === 'QB') {
    return num(row.passing_yards) + num(row.passing_tds) * 120 - num(row.passing_interceptions) * 80 + passerRating(row) * 18;
  }
  if (position === 'RB') {
    return num(row.rushing_yards) + num(row.rushing_tds) * 110 + num(row.receiving_yards) * 0.65 + num(row.receptions) * 8;
  }
  if (position === 'WR' || position === 'TE') {
    return num(row.receiving_yards) + num(row.receiving_tds) * 135 + num(row.receptions) * 9;
  }
  return 0;
}

function playerStats(row, position) {
  if (position === 'QB') {
    return {
      passingYards: num(row.passing_yards),
      passingTDs: num(row.passing_tds),
      passerRating: passerRating(row),
      interceptions: num(row.passing_interceptions),
    };
  }
  if (position === 'RB') {
    return {
      rushingYards: num(row.rushing_yards),
      rushingTDs: num(row.rushing_tds),
      receptions: num(row.receptions),
      receivingYards: num(row.receiving_yards),
      receivingTDs: num(row.receiving_tds),
    };
  }
  return {
    receptions: num(row.receptions),
    receivingYards: num(row.receiving_yards),
    receivingTDs: num(row.receiving_tds),
  };
}

function isUseful(row, position) {
  if (position === 'QB') return num(row.attempts) >= 80 || num(row.passing_yards) >= 800;
  if (position === 'RB') return num(row.carries) >= 35 || num(row.rushing_yards) + num(row.receiving_yards) >= 250;
  if (position === 'WR') return num(row.targets) >= 30 || num(row.receiving_yards) >= 250;
  if (position === 'TE') return num(row.targets) >= 20 || num(row.receiving_yards) >= 180;
  return false;
}

function isAllStar(row, position) {
  if (position === 'QB') return num(row.passing_yards) >= 4000 || num(row.passing_tds) >= 30 || passerRating(row) >= 105;
  if (position === 'RB') return num(row.rushing_yards) >= 1100 || num(row.rushing_tds) >= 12 || num(row.rushing_yards) + num(row.receiving_yards) >= 1500;
  if (position === 'WR') return num(row.receiving_yards) >= 1100 || num(row.receiving_tds) >= 10 || num(row.receptions) >= 90;
  if (position === 'TE') return num(row.receiving_yards) >= 750 || num(row.receiving_tds) >= 8 || num(row.receptions) >= 75;
  return false;
}

function eraStart(season) {
  return Math.floor(season / 5) * 5;
}

function buildPlayers() {
  const grouped = new Map();
  const files = fs.readdirSync(PLAYER_DIR).filter(name => /^stats_player_reg_\d{4}\.csv$/.test(name)).sort();

  for (const file of files) {
    const rows = parseCsv(fs.readFileSync(path.join(PLAYER_DIR, file), 'utf8'));
    for (const row of rows) {
      const position = row.position;
      if (!['QB', 'RB', 'WR', 'TE'].includes(position)) continue;
      if (row.season_type !== 'REG') continue;
      if (!isUseful(row, position)) continue;
      const teamId = TEAM_BY_ABBR[row.recent_team];
      if (!teamId) continue;

      const name = row.player_display_name || row.player_name;
      if (!name || name === 'NA') continue;
      const key = `${teamId}|${position}|${name}`;
      const score = playerScore(row, position);
      const season = Number(row.season);
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          name,
          position,
          from: season,
          to: season,
          bestSeasonYear: season,
          bestScore: score,
          stats: playerStats(row, position),
          isAllStar: isAllStar(row, position),
          isLegend: HOF_AND_FRANCHISE_STARS.has(name.toLowerCase()),
          teamId,
        });
      } else {
        existing.from = Math.min(existing.from, season);
        existing.to = Math.max(existing.to, season);
        existing.isAllStar = existing.isAllStar || isAllStar(row, position);
        existing.isLegend = existing.isLegend || HOF_AND_FRANCHISE_STARS.has(name.toLowerCase());
        if (score > existing.bestScore) {
          existing.bestScore = score;
          existing.bestSeasonYear = season;
          existing.stats = playerStats(row, position);
        }
      }
    }
  }

  const byTeam = {};
  for (const player of grouped.values()) {
    byTeam[player.teamId] ??= [];
    byTeam[player.teamId].push({
      name: player.name,
      position: player.position,
      from: player.from,
      to: player.to,
      bestSeasonYear: player.bestSeasonYear,
      stats: player.stats,
      ...(player.isLegend ? { isLegend: true } : {}),
      ...(player.isAllStar ? { isAllStar: true } : {}),
    });
  }

  for (const players of Object.values(byTeam)) {
    players.sort((a, b) => a.from - b.from || a.position.localeCompare(b.position) || a.name.localeCompare(b.name));
  }
  return byTeam;
}

function buildUnits() {
  const byTeamEra = {};
  const files = fs.readdirSync(TEAM_DIR).filter(name => /^stats_team_reg_\d{4}\.csv$/.test(name)).sort();

  for (const file of files) {
    const rows = parseCsv(fs.readFileSync(path.join(TEAM_DIR, file), 'utf8'));
    for (const row of rows) {
      if (row.season_type !== 'REG') continue;
      const teamId = TEAM_BY_ABBR[row.team];
      if (!teamId) continue;
      const season = Number(row.season);
      const start = eraStart(season);
      const key = `${teamId}-${start}`;
      const entry = byTeamEra[key] ?? {
        teamId,
        start,
        bestOlSeason: season,
        bestOlScore: -Infinity,
        bestDefSeason: season,
        bestDefScore: -Infinity,
        offensiveLine: {},
        defense: {},
      };

      const passingYards = num(row.passing_yards);
      const rushingYards = num(row.rushing_yards);
      const sacksAllowed = num(row.sacks_suffered);
      const olScore = passingYards * 0.012 + rushingYards * 0.018 - sacksAllowed * 1.6;
      if (olScore > entry.bestOlScore) {
        entry.bestOlScore = olScore;
        entry.bestOlSeason = season;
        entry.offensiveLine = {
          sacksAllowed,
          qbPassingYards: passingYards,
          teamRushingYards: rushingYards,
          lineRank: Math.max(1, Math.round(18 - Math.min(15, olScore / 14))),
          runBlockRank: Math.max(1, Math.round(20 - Math.min(17, rushingYards / 180))),
          passBlockRank: Math.max(1, Math.round(20 - Math.min(17, (passingYards / 330) - (sacksAllowed / 7)))),
        };
      }

      const sacks = num(row.def_sacks);
      const interceptions = num(row.def_interceptions);
      const forcedFumbles = num(row.def_fumbles_forced);
      const passDeflections = num(row.def_pass_defended);
      const tacklesForLoss = num(row.def_tackles_for_loss);
      const takeaways = interceptions + forcedFumbles + num(row.fumble_recovery_opp);
      const defScore = sacks * 2.1 + takeaways * 3 + passDeflections * 0.32 + tacklesForLoss * 0.8;
      if (defScore > entry.bestDefScore) {
        const starMeta = DEFENSE_STARS_BY_TEAM_ERA[key] ?? { stars: 0, hof: 0 };
        entry.bestDefScore = defScore;
        entry.bestDefSeason = season;
        entry.defense = {
          sacks,
          interceptions,
          forcedFumbles,
          passDeflections,
          defensiveTfl: tacklesForLoss,
          takeaways,
          defensiveStarCount: starMeta.stars,
          defensiveHofCount: starMeta.hof,
          pointsAllowed: Math.max(190, Math.round(390 - sacks * 1.4 - takeaways * 2.2 - starMeta.hof * 10)),
          yardsAllowed: Math.max(4100, Math.round(6100 - sacks * 22 - tacklesForLoss * 10 - passDeflections * 3 - starMeta.stars * 75)),
        };
      }

      byTeamEra[key] = entry;
    }
  }

  const units = {};
  for (const entry of Object.values(byTeamEra)) {
    units[entry.teamId] ??= {};
    units[entry.teamId][String(entry.start)] = {
      offensiveLine: {
        name: `${entry.bestOlSeason} O-Line`,
        bestSeasonYear: entry.bestOlSeason,
        stats: entry.offensiveLine,
      },
      defense: {
        name: `${entry.bestDefSeason} Defense`,
        bestSeasonYear: entry.bestDefSeason,
        stats: entry.defense,
        ...(entry.defense.defensiveHofCount > 0 || entry.defense.defensiveStarCount >= 4 ? { isLegend: true } : {}),
      },
    };
  }
  return units;
}

function writeTs(players, units) {
  const body = `// Auto-generated by scripts/generate-nflverse-depth.cjs.
// Source inputs: nflverse stats_player and stats_team regular-season releases, 1999-2024.
// Do not edit by hand; regenerate after refreshing .tmp-data/player-reg and .tmp-data/team-reg.
import type { Player } from '../types';
import type { DepthPlayer } from './nfl-franchise-depth';

export type GeneratedUnit = {
  offensiveLine: { name: string; bestSeasonYear: number; stats: Player['stats']; isLegend?: boolean };
  defense: { name: string; bestSeasonYear: number; stats: Player['stats']; isLegend?: boolean };
};

export const NFLVERSE_GENERATED_DEPTH_PLAYERS: Record<string, DepthPlayer[]> = ${JSON.stringify(players, null, 2)};

export const NFLVERSE_GENERATED_UNITS: Record<string, Record<string, GeneratedUnit>> = ${JSON.stringify(units, null, 2)};
`;
  fs.writeFileSync(OUT_FILE, body);
}

if (!fs.existsSync(PLAYER_DIR) || !fs.existsSync(TEAM_DIR)) {
  throw new Error('Missing .tmp-data/player-reg or .tmp-data/team-reg. Download nflverse release CSVs first.');
}

writeTs(buildPlayers(), buildUnits());
console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
