import type { PlayoffBracket, PlayoffGame, PlayoffSeed } from './types';
import { clamp } from './utils';
import { teamVsTeamProbability } from './nflLeague';

export interface BracketStrength {
  gspr: number;
  offenseScore: number;
  defenseScore: number;
}

type StrengthOf = (teamId: string) => BracketStrength;
type Rand = () => number;

function noise(rand: Rand): number {
  return (rand() + rand() + rand() - 1.5) * 6;
}

// Higher seed (smaller number) is home.
function hostOf(a: PlayoffSeed, b: PlayoffSeed): { home: PlayoffSeed; away: PlayoffSeed } {
  return a.seed <= b.seed ? { home: a, away: b } : { home: b, away: a };
}

function playGame(
  round: PlayoffGame['round'],
  conference: PlayoffGame['conference'],
  home: PlayoffSeed,
  away: PlayoffSeed,
  neutral: boolean,
  strengthOf: StrengthOf,
  rand: Rand,
): PlayoffGame {
  const hs = strengthOf(home.teamId);
  const as = strengthOf(away.teamId);
  const pHome = teamVsTeamProbability(hs, as, neutral ? 0 : 0.04);
  const homeWins = rand() < pHome;

  const expectedTotal = clamp(
    44 + (hs.offenseScore + as.offenseScore - 150) * 0.12 - (hs.defenseScore + as.defenseScore - 150) * 0.06,
    30, 70,
  );
  const marginMag = Math.max(1, Math.round(Math.abs(pHome - 0.5) * 26 + Math.abs(noise(rand)) * 0.7));
  const total = clamp(expectedTotal + noise(rand), 24, 75);
  const winnerScore = Math.max(13, Math.round((total + marginMag) / 2));
  const loserScore = Math.max(3, Math.round((total - marginMag) / 2));

  const homeScore = homeWins ? winnerScore : loserScore;
  const awayScore = homeWins ? loserScore : winnerScore;
  return {
    round,
    conference,
    home,
    away,
    homeScore,
    awayScore,
    winnerId: homeWins ? home.teamId : away.teamId,
  };
}

function winnerSeed(game: PlayoffGame): PlayoffSeed {
  return game.winnerId === game.home.teamId ? game.home : game.away;
}

// Sims one conference's three rounds; returns the games and the conference champ.
function simulateConference(
  conference: 'AFC' | 'NFC',
  seeds: PlayoffSeed[],
  strengthOf: StrengthOf,
  rand: Rand,
): { wildCard: PlayoffGame[]; divisional: PlayoffGame[]; championship: PlayoffGame; champion: PlayoffSeed } {
  const bySeed = new Map(seeds.map(s => [s.seed, s]));
  const s1 = bySeed.get(1)!;

  // Wild Card: 2v7, 3v6, 4v5 (top seed byes).
  const wildCard = [
    playGame('Wild Card', conference, bySeed.get(2)!, bySeed.get(7)!, false, strengthOf, rand),
    playGame('Wild Card', conference, bySeed.get(3)!, bySeed.get(6)!, false, strengthOf, rand),
    playGame('Wild Card', conference, bySeed.get(4)!, bySeed.get(5)!, false, strengthOf, rand),
  ];
  const wcWinners = wildCard.map(winnerSeed).sort((a, b) => a.seed - b.seed);

  // Divisional: #1 hosts the lowest remaining seed; other two play.
  const lowestRemaining = wcWinners[wcWinners.length - 1];
  const others = wcWinners.filter(s => s.teamId !== lowestRemaining.teamId);
  const div1 = playGame('Divisional', conference, s1, lowestRemaining, false, strengthOf, rand);
  const matchup = hostOf(others[0], others[1]);
  const div2 = playGame('Divisional', conference, matchup.home, matchup.away, false, strengthOf, rand);
  const divisional = [div1, div2];

  // Conference Championship: higher seed hosts.
  const champMatchup = hostOf(winnerSeed(div1), winnerSeed(div2));
  const championship = playGame('Conference', conference, champMatchup.home, champMatchup.away, false, strengthOf, rand);
  return { wildCard, divisional, championship, champion: winnerSeed(championship) };
}

const ROUND_LABELS: Record<PlayoffGame['round'], string> = {
  'Wild Card': 'Wild Card',
  'Divisional': 'Divisional Round',
  'Conference': 'Conference Championships',
  'Super Bowl': 'Super Bowl',
};

function customResultLabel(
  customTeamId: string | null,
  madePlayoffs: boolean,
  champion: PlayoffSeed,
  eliminatedIn: PlayoffGame['round'] | null,
): string {
  if (!customTeamId) return '';
  if (!madePlayoffs) return 'Missed the playoffs';
  if (champion.teamId === customTeamId) return '🏆 Won the Super Bowl';
  switch (eliminatedIn) {
    case 'Wild Card': return 'Lost in the Wild Card round';
    case 'Divisional': return 'Lost in the Divisional round';
    case 'Conference': return 'Lost in the Conference Championship';
    case 'Super Bowl': return 'Lost in the Super Bowl';
    default: return 'Made the playoffs';
  }
}

export function simulatePlayoffs(
  afcSeeds: PlayoffSeed[],
  nfcSeeds: PlayoffSeed[],
  strengthOf: StrengthOf,
  customTeamId: string | null,
  rand: Rand,
): PlayoffBracket {
  const afc = simulateConference('AFC', afcSeeds, strengthOf, rand);
  const nfc = simulateConference('NFC', nfcSeeds, strengthOf, rand);
  const superBowl = playGame('Super Bowl', undefined, afc.champion, nfc.champion, true, strengthOf, rand);
  const champion = winnerSeed(superBowl);

  const rounds = [
    { name: ROUND_LABELS['Wild Card'], games: [...afc.wildCard, ...nfc.wildCard] },
    { name: ROUND_LABELS['Divisional'], games: [...afc.divisional, ...nfc.divisional] },
    { name: ROUND_LABELS['Conference'], games: [afc.championship, nfc.championship] },
    { name: ROUND_LABELS['Super Bowl'], games: [superBowl] },
  ];

  // Track the God Squad's run.
  const allGames = rounds.flatMap(r => r.games);
  const madePlayoffs = customTeamId
    ? [...afcSeeds, ...nfcSeeds].some(s => s.teamId === customTeamId)
    : false;
  let eliminatedIn: PlayoffGame['round'] | null = null;
  if (customTeamId && madePlayoffs) {
    for (const game of allGames) {
      const inGame = game.home.teamId === customTeamId || game.away.teamId === customTeamId;
      if (inGame && game.winnerId !== customTeamId) { eliminatedIn = game.round; break; }
    }
  }

  return {
    afcSeeds,
    nfcSeeds,
    rounds,
    champion,
    superBowl,
    customMadePlayoffs: madePlayoffs,
    customResult: customResultLabel(customTeamId, madePlayoffs, champion, eliminatedIn),
  };
}
