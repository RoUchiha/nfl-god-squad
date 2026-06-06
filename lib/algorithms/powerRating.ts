import type { Player, Sport, FilledRosterSlot, TeamPower, DraftMode } from '../types';
import { clamp, normalizeToRange, sigmoid } from '../utils';

// ─── Era normalization constants ─────────────────────────────────────────────
// These represent typical seasonal averages for each era, used to z-score stats

interface EraNorms {
  points?: { mean: number; std: number };
  rebounds?: { mean: number; std: number };
  assists?: { mean: number; std: number };
  ops?: { mean: number; std: number };
  era?: { mean: number; std: number };
  nhlPoints?: { mean: number; std: number };
  passingYards?: { mean: number; std: number };
  rushingYards?: { mean: number; std: number };
  sacks?: { mean: number; std: number };
}

const NBA_NORMS: EraNorms = {
  points:   { mean: 18, std: 8 },
  rebounds: { mean: 7,  std: 3.5 },
  assists:  { mean: 5,  std: 3 },
};

const NFL_OFF_NORMS: EraNorms = {
  passingYards: { mean: 3800, std: 900 },
  rushingYards: { mean: 900, std: 400 },
};

const NFL_DEF_NORMS: EraNorms = {
  sacks:         { mean: 10, std: 5 },
};

const MLB_NORMS: EraNorms = {
  ops: { mean: 0.760, std: 0.100 },
  era: { mean: 4.0,   std: 0.9 },
};

const NHL_NORMS: EraNorms = {
  nhlPoints: { mean: 50, std: 25 },
};

// ─── Individual Player Score (0–100) ─────────────────────────────────────────

function scoreNBAPlayer(p: Player): number {
  const s = p.stats;
  const ptsZ = normalizeToRange(s.points ?? 0, 18, 8);
  const rebZ = normalizeToRange(s.rebounds ?? 0, 7, 3.5);
  const astZ = normalizeToRange(s.assists ?? 0, 5, 3);
  const fgBonus  = (s.fieldGoalPct ?? 0.45) > 0.50 ? 5 : 0;
  const stlBlkBonus = ((s.steals ?? 0) + (s.blocks ?? 0)) * 2;

  const raw = ptsZ * 0.40 + rebZ * 0.25 + astZ * 0.25 + fgBonus + clamp(stlBlkBonus, 0, 10);
  return clamp(raw, 0, 100);
}

function scoreNFLOffensePlayer(p: Player): number {
  const s = p.stats;
  let score = 50;

  if (p.position === 'QB') {
    const pyZ = normalizeToRange(s.passingYards ?? 0, 3800, 900);
    const tdZ = normalizeToRange(s.passingTDs ?? 0, 28, 8);
    const ratingZ = normalizeToRange(s.passerRating ?? 85, 85, 15);
    score = pyZ * 0.35 + tdZ * 0.35 + ratingZ * 0.30;
  } else if (p.position === 'RB') {
    const ryZ = normalizeToRange(s.rushingYards ?? 0, 900, 400);
    const tdZ = normalizeToRange(s.rushingTDs ?? 0, 8, 4);
    score = ryZ * 0.60 + tdZ * 0.40;
  } else if (p.position === 'WR' || p.position === 'TE') {
    const rcvZ = normalizeToRange(s.receivingYards ?? 0, 900, 350);
    const tdZ = normalizeToRange(s.receivingTDs ?? 0, 6, 3);
    const recZ = normalizeToRange(s.receptions ?? 0, 65, 25);
    score = rcvZ * 0.45 + tdZ * 0.30 + recZ * 0.25;
  } else if (p.position === 'K') {
    score = 55 + (p.isLegend ? 15 : p.isAllStar ? 8 : 0);
  }

  return clamp(score, 0, 100);
}

function scoreNFLDefensePlayer(p: Player): number {
  const s = p.stats;
  let score = 50;

  if (p.position === 'DE') {
    const sackZ = normalizeToRange(s.sacks ?? 0, 10, 5);
    const tklZ = normalizeToRange(s.tackles ?? 0, 45, 20);
    score = sackZ * 0.55 + tklZ * 0.45;
  } else if (p.position === 'DT') {
    const sackZ = normalizeToRange(s.sacks ?? 0, 6, 3);
    const tklZ = normalizeToRange(s.tackles ?? 0, 40, 18);
    score = sackZ * 0.45 + tklZ * 0.55;
  } else if (p.position === 'LB') {
    const tklZ = normalizeToRange(s.tackles ?? 0, 100, 30);
    const sackZ = normalizeToRange(s.sacks ?? 0, 5, 3);
    const intZ = normalizeToRange(s.interceptions ?? 0, 2, 2);
    score = tklZ * 0.50 + sackZ * 0.30 + intZ * 0.20;
  } else if (p.position === 'CB' || p.position === 'S') {
    const intZ = normalizeToRange(s.interceptions ?? 0, 3, 2);
    const tklZ = normalizeToRange(s.tackles ?? 0, 60, 25);
    score = intZ * 0.50 + tklZ * 0.50;
  }

  return clamp(score, 0, 100);
}

function scoreMLBBatter(p: Player): number {
  const s = p.stats;
  const opsZ = normalizeToRange(s.ops ?? 0.700, 0.760, 0.100);
  const hrBonus = clamp((s.homeRuns ?? 0) / 50 * 10, 0, 10);
  const sbBonus = clamp((s.stolenBases ?? 0) / 30 * 5, 0, 5);
  return clamp(opsZ * 0.80 + hrBonus + sbBonus, 0, 100);
}

function scoreMLBPitcher(p: Player): number {
  const s = p.stats;
  // Lower ERA is better — invert the z-score
  const eraZ = normalizeToRange(-(s.era ?? 4.0), -4.0, 0.9);
  const whipZ = normalizeToRange(-(s.whip ?? 1.30), -1.30, 0.20);
  const kZ = normalizeToRange(s.strikeoutsPerNine ?? 8.0, 8.0, 2.5);
  const saveBonus = p.position === 'CL' ? clamp((s.saves ?? 0) / 45 * 10, 0, 10) : 0;
  return clamp(eraZ * 0.40 + whipZ * 0.35 + kZ * 0.20 + saveBonus, 0, 100);
}

function scoreNHLSkater(p: Player): number {
  const s = p.stats;
  const ptsZ = normalizeToRange(s.nhlPoints ?? 50, 50, 25);
  const plusMinusZ = normalizeToRange(s.plusMinus ?? 0, 0, 15);
  const ppBonus = clamp((s.powerPlayGoals ?? 0) * 0.8, 0, 8);
  return clamp(ptsZ * 0.65 + plusMinusZ * 0.25 + ppBonus, 0, 100);
}

function scoreNHLGoalie(p: Player): number {
  const s = p.stats;
  const svPctZ = normalizeToRange(s.savePct ?? 0.910, 0.910, 0.012);
  const gaaNeg = normalizeToRange(-(s.goalsAgainstAvg ?? 2.8), -2.8, 0.4);
  return clamp(svPctZ * 0.55 + gaaNeg * 0.45, 0, 100);
}

export function computePlayerScore(player: Player, sport: Sport): number {
  let base: number;

  switch (sport) {
    case 'nba':
      base = scoreNBAPlayer(player);
      break;
    case 'nfl':
      if (player.positionGroup === 'offense') base = scoreNFLOffensePlayer(player);
      else base = scoreNFLDefensePlayer(player);
      break;
    case 'mlb':
      if (player.positionGroup === 'offense') base = scoreMLBBatter(player);
      else base = scoreMLBPitcher(player);
      break;
    case 'nhl':
      if (player.position === 'G_NHL') base = scoreNHLGoalie(player);
      else base = scoreNHLSkater(player);
      break;
    default:
      base = 50;
  }

  // Apply greatness multipliers
  if (player.isLegend) base = clamp(base * 1.15, 0, 100);
  else if (player.isAllStar) base = clamp(base * 1.08, 0, 100);

  return Math.round(base * 10) / 10;
}

// ─── Team GSPR Calculation ────────────────────────────────────────────────────

const SPORT_WEIGHTS: Record<Sport, { offense: number; defense: number; depth: number }> = {
  nba: { offense: 0.55, defense: 0.35, depth: 0.10 },
  nfl: { offense: 0.45, defense: 0.45, depth: 0.10 },
  mlb: { offense: 0.50, defense: 0.40, depth: 0.10 },
  nhl: { offense: 0.50, defense: 0.30, depth: 0.10 }, // goalie weight absorbed into defense
};

function weightedAverage(scores: number[], weights?: number[]): number {
  if (scores.length === 0) return 0;
  if (!weights) return scores.reduce((a, b) => a + b, 0) / scores.length;
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return scores.reduce((acc, s, i) => acc + s * (weights[i] ?? 1), 0) / totalWeight;
}

// ─── Historic duo bonus ───────────────────────────────────────────────────────
const HISTORIC_DUOS: [string, string, number, string][] = [
  // NBA
  ['Michael Jordan',      'Scottie Pippen',      10, '🐐 Jordan & Pippen — Greatest Duo Ever'],
  ['Magic Johnson',       'Kareem Abdul-Jabbar',  9, '✨ Magic & Kareem — Showtime'],
  ["Shaquille O'Neal",    'Kobe Bryant',           8, '🔥 Shaq & Kobe — Three-Peat'],
  ['LeBron James',        'Dwyane Wade',           7, '👑 LeBron & Wade — Heat Big Three'],
  ['LeBron James',        'Anthony Davis',         7, '💪 LeBron & AD — Lake Show'],
  ['LeBron James',        'Kyrie Irving',          8, '🏆 LeBron & Kyrie — Cavs Champions'],
  ['Stephen Curry',       'Klay Thompson',         8, '🎯 Curry & Klay — Splash Brothers'],
  ['Stephen Curry',       'Draymond Green',        6, '🧠 Curry & Draymond — Warriors IQ'],
  ['Kevin Durant',        'Stephen Curry',         9, '⚡ KD & Curry — Unstoppable Force'],
  ['Larry Bird',          'Kevin McHale',          7, '☘️ Bird & McHale — Celtics Frontcourt'],
  ['Larry Bird',          'Robert Parish',         6, '☘️ Bird & Parish — Celtics Big Three'],
  ['Tim Duncan',          'Tony Parker',           7, '🪨 Duncan & Parker — Spurs Dynasty'],
  ['Tim Duncan',          'Manu Ginobili',         6, '🪨 Duncan & Ginobili — Spurs Big Three'],
  ['Tony Parker',         'Manu Ginobili',         6, '🇫🇷 Parker & Ginobili — International Flair'],
  ['Hakeem Olajuwon',     'Clyde Drexler',         7, '🚀 Hakeem & Clyde — Dream Team'],
  ['Isiah Thomas',        'Joe Dumars',            7, '😈 Isiah & Dumars — Bad Boys Backcourt'],
  ['Kevin Garnett',       'Paul Pierce',           7, '☘️ KG & Pierce — Boston Revived'],
  ['Kevin Garnett',       'Ray Allen',             6, '☘️ KG & Ray Allen — Banner 17'],
  ['Giannis Antetokounmpo','Khris Middleton',      7, '🦌 Giannis & Middleton — Bucks Champions'],
  ['Nikola Jokic',        'Jamal Murray',          7, '⛏️ Jokic & Murray — Mile High Magic'],
  ['Kawhi Leonard',       'Paul George',           7, '🦞 Kawhi & PG — Clippers Threat'],
  ['Karl Malone',         'John Stockton',         9, '📮 Malone & Stockton — Mailman Express'],
  ['Charles Barkley',     'Kevin Johnson',         6, '🌵 Barkley & KJ — Suns Machine'],
  ['Patrick Ewing',       'Charles Oakley',        5, '🗽 Ewing & Oakley — Knicks Bruisers'],
  // NFL
  ['Tom Brady',           'Rob Gronkowski',        9, '🏈 Brady & Gronk — Unstoppable'],
  ['Tom Brady',           'Randy Moss',            9, '🏈 Brady & Moss — Record Breakers'],
  ['Joe Montana',         'Jerry Rice',            10, '🐐 Montana & Rice — GOAT Connection'],
  ['Peyton Manning',      'Marvin Harrison',       8, '🏹 Manning & Harrison — Precision'],
  ['Peyton Manning',      'Reggie Wayne',          7, '🏹 Manning & Wayne — AFC Dominance'],
  ['Aaron Rodgers',       'Davante Adams',         7, '🎯 Rodgers & Adams — Fade Route Kings'],
  ['Aaron Rodgers',       'Jordy Nelson',          6, '💛 Rodgers & Jordy — Packer Magic'],
  ['Patrick Mahomes',     'Travis Kelce',          8, '⚡ Mahomes & Kelce — Dynasty Duo'],
  ['Troy Aikman',         'Michael Irvin',         7, '⭐ Aikman & Irvin — Cowboys WR'],
  ['Dan Marino',          'Mark Clayton',          6, '🌴 Marino & Clayton — Miami Air'],
  ['Lawrence Taylor',     'Carl Banks',            6, '😤 LT & Banks — Giants Defense'],
  ['Emmitt Smith',        'Michael Irvin',         6, '⭐ Smith & Irvin — Cowboys Offense'],
  ['Barry Sanders',       'Herman Moore',          6, '🦁 Sanders & Moore — Lions Magic'],
  ['Steve Young',         'Jerry Rice',            8, '🌉 Young & Rice — 49ers Reload'],
  ['John Elway',          'Shannon Sharpe',        6, '🏔️ Elway & Sharpe — Broncos Champions'],
  // MLB
  ['Babe Ruth',           'Lou Gehrig',            10, '⚾ Ruth & Gehrig — Murderers Row'],
  ['Mickey Mantle',       'Whitey Ford',           8, '⚾ Mantle & Ford — Yankee Dynasty'],
  ['Derek Jeter',         'Mariano Rivera',        9, '⚾ Jeter & Mo — Core Four'],
  ['Willie Mays',         'Willie McCovey',        7, '⚾ Mays & McCovey — Giants Power'],
  ['Hank Aaron',          'Eddie Mathews',         8, '⚾ Aaron & Mathews — Braves Thunder'],
  ['Greg Maddux',         'Tom Glavine',           8, '⚾ Maddux & Glavine — Braves Rotation'],
  ['Ken Griffey Jr.',     'Randy Johnson',         7, '⚾ Griffey & Big Unit — Seattle Legends'],
  ['Albert Pujols',       'Jim Edmonds',           6, '⚾ Pujols & Edmonds — Cards Machine'],
  ['Pedro Martinez',      'Manny Ramirez',         7, '⚾ Pedro & Manny — Sox World Series'],
  ['David Ortiz',         'Manny Ramirez',         7, '⚾ Ortiz & Manny — Boston Clutch'],
  // NHL
  ['Wayne Gretzky',       'Mark Messier',          10, '🏒 Gretzky & Messier — Oilers Dynasty'],
  ['Wayne Gretzky',       'Jari Kurri',             9, '🏒 Gretzky & Kurri — Scoring Machine'],
  ['Mario Lemieux',       'Jaromir Jagr',           9, '🏒 Lemieux & Jagr — Penguins Glory'],
  ['Sidney Crosby',       'Evgeni Malkin',          8, '🏒 Crosby & Malkin — Double Threat'],
  ['Sidney Crosby',       'Marc-Andre Fleury',      7, '🏒 Crosby & Fleury — Penguins Core'],
  ['Patrick Roy',         'Joe Sakic',              8, '🏒 Roy & Sakic — Avs Champions'],
  ['Steve Yzerman',       'Nicklas Lidstrom',       8, '🏒 Yzerman & Lidstrom — Wings Dynasty'],
  ['Bobby Orr',           'Phil Esposito',          9, '🏒 Orr & Esposito — Bruins Gold'],
  ['Gordie Howe',         'Alex Delvecchio',        7, '🏒 Howe & Delvecchio — Wings Classic'],
];

// ─── Historic rival pairings ──────────────────────────────────────────────────
const HISTORIC_RIVALS: [string, string, number, string][] = [
  // NBA
  ['Larry Bird',          'Magic Johnson',       5, '🔥 Bird vs Magic — Ultimate Rivals'],
  ['Larry Bird',          'Kareem Abdul-Jabbar', 4, '🔥 Bird vs Kareem — Old-School Clash'],
  ['Bill Russell',        'Wilt Chamberlain',    5, '🔥 Russell vs Wilt — Centers Rivalry'],
  ['Michael Jordan',      'Isiah Thomas',        4, '🔥 Jordan vs Isiah — Bad Boys vs Bull'],
  ['LeBron James',        'Kobe Bryant',         4, '🔥 LeBron vs Kobe — The Debate'],
  ['Stephen Curry',       'LeBron James',        4, '🔥 Curry vs LeBron — Finals Rivals'],
  // NFL
  ['Peyton Manning',      'Ray Lewis',           4, '🔥 Manning vs Lewis — Rivals'],
  ['Tom Brady',           'Peyton Manning',      5, '🔥 Brady vs Manning — AFC Legends'],
  ['Tom Brady',           'Aaron Rodgers',       4, '🔥 Brady vs Rodgers — QB Debate'],
  ['Jerry Rice',          'Deion Sanders',       4, '🔥 Rice vs Prime Time'],
  // MLB
  ['Babe Ruth',           'Ty Cobb',             4, '🔥 Ruth vs Cobb — Era Rivals'],
  ['Derek Jeter',         'Manny Ramirez',       4, '🔥 Jeter vs Manny — Sox/Yanks'],
  ['Pedro Martinez',      'Roger Clemens',       4, '🔥 Pedro vs Clemens — Ace Rivals'],
  // NHL
  ['Wayne Gretzky',       'Mario Lemieux',       5, '🔥 Gretzky vs Lemieux — GOAT Debate'],
  ['Patrick Roy',         'Chris Chelios',       4, '🔥 Roy vs Chelios — Classic Clash'],
  ['Sidney Crosby',       'Alex Ovechkin',       5, '🔥 Crosby vs Ovechkin — Modern Rivals'],
];

interface BonusResult { total: number; labels: string[] }

function duoAndRivalBonus(players: Player[]): BonusResult {
  const names = players.map(p => p.name);
  const labels: string[] = [];
  let duoBonus = 0;
  let bestLabel = '';
  for (const [a, b, pts, label] of HISTORIC_DUOS) {
    if (names.includes(a) && names.includes(b) && pts > duoBonus) {
      duoBonus = pts;
      bestLabel = label;
    }
  }
  if (duoBonus > 0) labels.push(bestLabel);

  let rivalBonus = 0;
  for (const [a, b, pts, label] of HISTORIC_RIVALS) {
    if (names.includes(a) && names.includes(b)) {
      rivalBonus += pts * 0.5;
      labels.push(label);
    }
  }
  return { total: duoBonus + rivalBonus, labels };
}

// ─── Era chemistry bonus ──────────────────────────────────────────────────────
function eraChemistryBonus(players: Player[]): BonusResult {
  const eraIds = players.map(p => p.eraId).filter((e): e is string => Boolean(e));
  if (eraIds.length < 3) return { total: 0, labels: [] };
  const unique = new Set(eraIds);
  if (unique.size === 1) return { total: 8, labels: ['🕰️ Era Synergy — Same-Era Perfection (+8)'] };
  if (unique.size === 2) return { total: 3, labels: ['🕰️ Era Blend — Cross-Era Chemistry (+3)'] };
  return { total: 0, labels: [] };
}

// ─── Team chemistry bonus ─────────────────────────────────────────────────────
function teamChemistryBonus(players: Player[]): BonusResult {
  const teamIds = players.map(p => p.teamId).filter((t): t is string => Boolean(t));
  if (teamIds.length < 2) return { total: 0, labels: [] };
  const counts: Record<string, number> = {};
  for (const t of teamIds) counts[t] = (counts[t] ?? 0) + 1;
  const max = Math.max(...Object.values(counts));
  if (max >= 5) return { total: 10, labels: ['🤝 Dynasty Core — 5+ Teammates (+10)'] };
  if (max >= 3) return { total: 5,  labels: ['🤝 Familiar Faces — 3+ Teammates (+5)'] };
  if (max >= 2) return { total: 2,  labels: ['🤝 Familiar Faces — 2 Teammates (+2)'] };
  return { total: 0, labels: [] };
}

// ─── Physical composition bonus ───────────────────────────────────────────────
function physicalBonus(players: Player[], sport: Sport): BonusResult {
  if (sport !== 'nba') return { total: 0, labels: [] };

  const heightMap: Record<string, number> = { C: 84, PF: 81, SF: 79, SG: 76, PG: 73 };
  const heights = players.map(p => heightMap[p.position] ?? 77);
  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

  const centers = players.filter(p => p.position === 'C').length;
  const bigs    = players.filter(p => p.position === 'C' || p.position === 'PF').length;

  const labels: string[] = [];
  let bonus = 0;
  if (centers >= 2) { bonus += 8; labels.push('🏗️ Twin Towers — Dominant Inside (+8)'); }
  else if (bigs >= 3) { bonus += 5; labels.push('💪 Big Lineup — Frontcourt Dominance (+5)'); }
  if (avgHeight >= 80) { bonus += 3; labels.push('📏 Tall Team — Height Advantage (+3)'); }
  return { total: bonus, labels };
}

// ─── Stat-based combo bonuses ─────────────────────────────────────────────────
function statComboBonus(players: Player[], sport: Sport): BonusResult {
  if (sport !== 'nba') return { total: 0, labels: [] };

  const labels: string[] = [];
  let bonus = 0;

  // Alley-oop engine: a high-assist PG paired with a high-athleticism dunker (SG/SF with high blocks/pts)
  const passers = players.filter(p => p.position === 'PG' && (p.stats.assists ?? 0) >= 8);
  const dunkers = players.filter(p =>
    (p.position === 'SG' || p.position === 'SF' || p.position === 'PF') &&
    (p.stats.points ?? 0) >= 20 && (p.stats.blocks ?? 0) >= 0.8
  );
  if (passers.length > 0 && dunkers.length > 0) {
    bonus += 8;
    labels.push(`🔛 Alley-Oop Factory — ${passers[0].name} feeds ${dunkers[0].name} (+8)`);
  }

  // Deadeye shooter + facilitator: 3pt% > 0.40 shooter + assists > 8 player
  const snipers = players.filter(p => (p.stats.threePointPct ?? 0) >= 0.40 && (p.stats.points ?? 0) >= 15);
  const facilitators = players.filter(p => (p.stats.assists ?? 0) >= 8 && p !== (passers[0] ?? null));
  if (snipers.length >= 2 && facilitators.length > 0) {
    bonus += 7;
    labels.push(`🎯 Deadeye Arsenal — ${snipers[0].name} & ${snipers[1].name} off assists (+7)`);
  } else if (snipers.length >= 2) {
    bonus += 5;
    labels.push(`🎯 Sniper Duo — ${snipers[0].name} & ${snipers[1].name} shoot lights out (+5)`);
  }

  // Rim protector + scorer: C/PF with blocks >= 2 + SG/SF with pts >= 22
  const rimProtectors = players.filter(p =>
    (p.position === 'C' || p.position === 'PF') && (p.stats.blocks ?? 0) >= 2
  );
  const eliteScorers = players.filter(p =>
    (p.position === 'SG' || p.position === 'SF' || p.position === 'PG') && (p.stats.points ?? 0) >= 22
  );
  if (rimProtectors.length > 0 && eliteScorers.length > 0) {
    bonus += 7;
    labels.push(`🛡️ Defend & Attack — ${rimProtectors[0].name} protects, ${eliteScorers[0].name} scores (+7)`);
  }

  // Inside-outside: dominant big (pts >= 20, reb >= 10) + perimeter threat (3pt% >= 0.38, pts >= 15)
  const dominantBigs = players.filter(p =>
    (p.position === 'C' || p.position === 'PF') &&
    (p.stats.points ?? 0) >= 20 && (p.stats.rebounds ?? 0) >= 10
  );
  const perimeterThreats = players.filter(p =>
    (p.position === 'PG' || p.position === 'SG' || p.position === 'SF') &&
    (p.stats.threePointPct ?? 0) >= 0.38 && (p.stats.points ?? 0) >= 15
  );
  if (dominantBigs.length > 0 && perimeterThreats.length > 0) {
    bonus += 6;
    labels.push(`⚖️ Inside-Outside — ${dominantBigs[0].name} in the post, ${perimeterThreats[0].name} from deep (+6)`);
  }

  // Triple-double threat: player with pts >= 20, reb >= 8, ast >= 7
  const tripleDoubleThreats = players.filter(p =>
    (p.stats.points ?? 0) >= 20 &&
    (p.stats.rebounds ?? 0) >= 8 &&
    (p.stats.assists ?? 0) >= 7
  );
  if (tripleDoubleThreats.length >= 2) {
    bonus += 10;
    labels.push(`🌟 Double Triple-Double Threat — ${tripleDoubleThreats[0].name} & ${tripleDoubleThreats[1].name} (+10)`);
  } else if (tripleDoubleThreats.length === 1) {
    bonus += 5;
    labels.push(`🌟 Triple-Double Threat — ${tripleDoubleThreats[0].name} does it all (+5)`);
  }

  return { total: bonus, labels };
}

export function computeTeamGSPR(
  slots: FilledRosterSlot[],
  sport: Sport,
  mode: DraftMode
): TeamPower {
  const filled = slots.filter(s => s.player !== null);
  const players = filled.map(s => s.player as Player);

  if (players.length === 0) {
    return { gspr: 0, offenseScore: 0, defenseScore: 0, depthScore: 0, chemistryBonus: 0, tier: 'average', breakdown: [] };
  }

  const offPlayers = players.filter(p => p.positionGroup === 'offense' || (sport === 'nba'));
  const defPlayers = players.filter(p =>
    p.positionGroup === 'defense' ||
    p.positionGroup === 'pitching' ||
    p.positionGroup === 'goalie'
  );

  // Starters weighted more heavily
  const buildWeights = (arr: Player[]) =>
    arr.map((_, i) => Math.max(1, 1.5 - i * 0.1));

  const offenseScore = offPlayers.length > 0
    ? weightedAverage(offPlayers.map(p => p.playerScore), buildWeights(offPlayers))
    : mode === 'defense' ? 55 : 0; // assume league-average offense if defense-only

  const defenseScore = defPlayers.length > 0
    ? weightedAverage(defPlayers.map(p => p.playerScore), buildWeights(defPlayers))
    : mode === 'offense' ? 55 : 0;

  // Depth: bonus for filling all required slots
  const required = slots.filter(s => s.required);
  const filledRequired = required.filter(s => s.player !== null);
  const depthScore = required.length > 0
    ? (filledRequired.length / required.length) * 100
    : 80;

  const duoRival   = duoAndRivalBonus(players);
  const eraChem    = eraChemistryBonus(players);
  const teamChem   = teamChemistryBonus(players);
  const physical   = physicalBonus(players, sport);
  const statCombo  = statComboBonus(players, sport);
  const totalBonus = duoRival.total + eraChem.total + teamChem.total + physical.total + statCombo.total;

  const w = SPORT_WEIGHTS[sport];
  const raw = (
    offenseScore * w.offense +
    defenseScore * w.defense +
    depthScore * w.depth +
    totalBonus * 0.12
  );

  // Scale to 0–1000
  const gspr = Math.round(clamp(raw * 10, 0, 1000));

  const tier = gspr >= 950 ? 'god'
    : gspr >= 850 ? 'legendary'
    : gspr >= 700 ? 'great'
    : gspr >= 500 ? 'good'
    : 'average';

  const breakdownParts: string[] = [
    `📊 Offense: ${Math.round(offenseScore)}/100`,
    `🛡️ Defense: ${Math.round(defenseScore)}/100`,
    `📋 Depth: ${Math.round(depthScore)}/100`,
    ...duoRival.labels,
    ...eraChem.labels,
    ...teamChem.labels,
    ...physical.labels,
    ...statCombo.labels,
  ];

  return { gspr, offenseScore, defenseScore, depthScore, chemistryBonus: totalBonus, tier, breakdown: breakdownParts };
}
