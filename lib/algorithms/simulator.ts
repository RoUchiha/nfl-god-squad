import { randomInt } from 'node:crypto';
import type {
  FilledRosterSlot,
  GameResult,
  NFLTeamStrength,
  PlayerSeasonStatLine,
  SeasonResults,
  Sport,
  TeamCompositionAnalysis,
  TeamPower,
} from '../types';
import { SPORT_CONFIG } from '../constants';
import { clamp, getAchievement } from '../utils';
import {
  buildNflSchedule,
  getHardcodedNflTeamStrengths,
  matchupWinProbability,
  rankLeagueStandings,
  simulateLeagueStandings,
} from '../nflLeague';

const WIN_PROB_CONFIG: Record<Sport, { base: number; range: number; power: number }> = {
  nba: { base: 0.62, range: 0.365, power: 1.8 },
  nfl: { base: 0.56, range: 0.375, power: 1.95 },
  mlb: { base: 0.56, range: 0.432, power: 1.8 },
  nhl: { base: 0.6, range: 0.382, power: 1.8 },
  epl: { base: 0.57, range: 0.405, power: 1.8 },
  wcup: { base: 0.54, range: 0.44, power: 1.8 },
};

export function getBaseWinProbability(gspr: number, sport: Sport): number {
  if (sport === 'nfl' && gspr >= 985) {
    const undefeatedFloor = Math.pow(0.5, 1 / SPORT_CONFIG.nfl.gamesInSeason);
    return clamp(undefeatedFloor + ((gspr - 985) / 15) * (0.985 - undefeatedFloor), undefeatedFloor, 0.985);
  }
  const { base, range, power } = WIN_PROB_CONFIG[sport];
  const normalized = Math.pow(gspr / 1000, power);
  return clamp(base + range * normalized, 0.05, sport === 'nfl' ? 0.985 : 0.995);
}

function opponentTier(gspr: number): string {
  if (gspr >= 850) return 'Elite';
  if (gspr >= 790) return 'Strong';
  if (gspr >= 710) return 'Average';
  if (gspr >= 650) return 'Weak';
  return 'Poor';
}

function scoringNoise(rand: () => number): number {
  return (rand() + rand() + rand() - 1.5) * 7.5;
}

function simulateGameScore(
  teamPower: TeamPower,
  opponent: NFLTeamStrength,
  isHome: boolean,
  rand: () => number,
): { teamScore: number; opponentScore: number; win: boolean } {
  const winProbability = matchupWinProbability(teamPower, opponent, isHome);
  const win = rand() < winProbability;
  const expectedMargin = Math.abs((winProbability - 0.5) * 30 + (isHome ? 1.4 : -1.1));
  const expectedTotal =
    43 +
    (teamPower.offenseScore - 75) * 0.18 +
    (opponent.offenseScore - 75) * 0.13 -
    (teamPower.defenseScore - 75) * 0.07 -
    (opponent.defenseScore - 75) * 0.06;
  const marginMagnitude = Math.max(1, Math.round(expectedMargin + Math.abs(scoringNoise(rand)) * 0.55));
  const margin = win ? marginMagnitude : -marginMagnitude;
  const total = clamp(expectedTotal + scoringNoise(rand), 27, 76);
  const teamScore = Math.max(6, Math.round((total + margin) / 2));
  const opponentScore = Math.max(3, Math.round((total - margin) / 2));
  return { teamScore, opponentScore, win };
}

function simulateRosterStats(slots: FilledRosterSlot[], teamPower: TeamPower, rand: () => number): PlayerSeasonStatLine[] {
  const filled = slots.filter(slot => slot.player);
  const qbSlot = filled.find(slot => slot.player?.position === 'QB');
  const qbScore = qbSlot?.player?.playerScore ?? 75;
  const passingYards = Math.round(3550 + teamPower.offenseScore * 18 + (rand() - 0.5) * 420);
  const passingTDs = Math.round(21 + teamPower.offenseScore * 0.21 + (rand() - 0.5) * 5);

  return filled.map(slot => {
    const player = slot.player!;
    const variance = 0.94 + rand() * 0.12;
    const base = {
      playerId: player.id,
      name: player.name,
      position: player.position,
      slotLabel: slot.label,
      playerScore: player.playerScore,
      gamesPlayed: Math.max(12, Math.min(17, Math.round(15 + rand() * 2.2))),
    };
    if (player.position === 'QB') return { ...base, passingYards, passingTDs };
    if (player.position === 'RB') {
      return {
        ...base,
        rushingYards: Math.round((player.stats.rushingYards ?? player.playerScore * 12) * variance * 0.86),
        rushingTDs: Math.round((player.stats.rushingTDs ?? 7) * variance),
        receptions: Math.round((player.stats.receptions ?? 30) * variance),
        receivingYards: Math.round((player.stats.receivingYards ?? 220) * variance),
      };
    }
    if (player.position === 'WR' || player.position === 'TE') {
      const targetShare = player.position === 'TE' ? 0.17 : 0.23;
      return {
        ...base,
        receivingYards: Math.round(Math.max(player.stats.receivingYards ?? 650, passingYards * targetShare * (player.playerScore / Math.max(qbScore, 1))) * variance),
        receivingTDs: Math.round((player.stats.receivingTDs ?? 5) * variance),
        receptions: Math.round((player.stats.receptions ?? 58) * variance),
      };
    }
    if (player.position === 'OL') return { ...base, sacksAllowed: player.stats.sacksAllowed };
    if (player.position === 'DEF') {
      return {
        ...base,
        pointsAllowed: player.stats.pointsAllowed,
        sacks: player.stats.sacks,
        takeaways: player.stats.takeaways,
      };
    }
    return base;
  }).sort((a, b) => b.playerScore - a.playerScore || a.name.localeCompare(b.name));
}

export function simulateSeason(
  teamPower: TeamPower,
  sport: Sport = 'nfl',
  compositionAnalysis: TeamCompositionAnalysis = { pros: [], cons: [] },
  teamStrengths: NFLTeamStrength[] = getHardcodedNflTeamStrengths(),
  rosterSlots: FilledRosterSlot[] = [],
): SeasonResults {
  const totalGames = SPORT_CONFIG[sport].gamesInSeason;
  let seed = randomInt(0, 0x100000000);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  const schedule = sport === 'nfl' ? buildNflSchedule(teamStrengths, rand) : [];
  const games: GameResult[] = [];
  let wins = 0;
  let losses = 0;
  let currentStreak = 0;
  let longestStreak = 0;

  for (let i = 0; i < totalGames; i++) {
    const opponent = schedule[i] ?? teamStrengths[i % teamStrengths.length];
    const isHome = i % 2 === 0;
    const score = simulateGameScore(teamPower, opponent, isHome, rand);
    games.push({
      gameNumber: i + 1,
      win: score.win,
      scoreDiff: score.teamScore - score.opponentScore,
      opponentTier: opponentTier(opponent.gspr),
      opponentTeamId: opponent.teamId,
      opponentName: `${opponent.city} ${opponent.name}`,
      opponentAbbreviation: opponent.abbreviation,
      opponentGspr: opponent.gspr,
      isHome,
      teamScore: score.teamScore,
      opponentScore: score.opponentScore,
    });
    if (score.win) {
      wins++;
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      losses++;
      currentStreak = 0;
    }
  }

  const { title: achievement, subtext: achievementSubtext } = getAchievement(wins, losses, sport);
  const realTeamStandings = simulateLeagueStandings(teamStrengths, rand);
  const customStanding = {
    rank: 0,
    conferenceRank: 0,
    teamId: 'custom',
    name: 'God Squad',
    city: 'Your',
    abbreviation: 'GOD',
    conference: 'AFC',
    wins,
    losses,
    gspr: teamPower.gspr,
    powerScore: teamPower.gspr + wins * 9 + teamPower.offenseScore + teamPower.defenseScore,
    isCustomTeam: true,
  };

  return {
    sport,
    wins,
    losses,
    totalGames,
    games,
    teamPower,
    compositionAnalysis,
    leagueStandings: rankLeagueStandings([...realTeamStandings, customStanding]),
    rosterStats: simulateRosterStats(rosterSlots, teamPower, rand),
    teamStrengthSnapshotDate: teamStrengths[0]?.snapshotDate,
    isUndefeated: losses === 0,
    longestWinStreak: longestStreak,
    achievement,
    achievementSubtext,
    recordLabel: `${wins}-${losses}`,
  };
}

export function estimateUndefeatedChance(gspr: number, sport: Sport): number {
  const p = getBaseWinProbability(gspr, sport);
  const games = SPORT_CONFIG[sport].gamesInSeason;
  return Math.pow(p, games) * 100;
}
