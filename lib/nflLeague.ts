import type { LeagueStanding, NFLTeamStrength, TeamPower } from './types';
import { clamp } from './utils';

const SNAPSHOT_DATE = '2026-06-25';

export function getHardcodedNflTeamStrengths(): NFLTeamStrength[] {
  return [
    ['BUF','Buffalo','Bills','AFC',850,86,82], ['MIA','Miami','Dolphins','AFC',790,83,73], ['NE','New England','Patriots','AFC',650,62,70], ['NYJ','New York','Jets','AFC',715,63,82],
    ['BAL','Baltimore','Ravens','AFC',870,87,84], ['CIN','Cincinnati','Bengals','AFC',820,86,72], ['CLE','Cleveland','Browns','AFC',720,62,84], ['PIT','Pittsburgh','Steelers','AFC',760,68,82],
    ['HOU','Houston','Texans','AFC',815,80,79], ['IND','Indianapolis','Colts','AFC',720,72,70], ['JAX','Jacksonville','Jaguars','AFC',700,72,66], ['TEN','Tennessee','Titans','AFC',640,60,68],
    ['KC','Kansas City','Chiefs','AFC',890,90,82], ['LAC','Los Angeles','Chargers','AFC',775,78,76], ['DEN','Denver','Broncos','AFC',735,69,80], ['LV','Las Vegas','Raiders','AFC',660,63,69],
    ['DAL','Dallas','Cowboys','NFC',825,82,80], ['PHI','Philadelphia','Eagles','NFC',860,86,83], ['NYG','New York','Giants','NFC',625,58,67], ['WAS','Washington','Commanders','NFC',705,70,69],
    ['DET','Detroit','Lions','NFC',865,88,79], ['GB','Green Bay','Packers','NFC',805,81,77], ['CHI','Chicago','Bears','NFC',705,71,68], ['MIN','Minnesota','Vikings','NFC',760,79,69],
    ['ATL','Atlanta','Falcons','NFC',710,72,70], ['CAR','Carolina','Panthers','NFC',610,58,64], ['NO','New Orleans','Saints','NFC',680,66,72], ['TB','Tampa Bay','Buccaneers','NFC',755,77,73],
    ['SF','San Francisco','49ers','NFC',875,86,86], ['LAR','Los Angeles','Rams','NFC',800,81,76], ['SEA','Seattle','Seahawks','NFC',735,73,75], ['ARI','Arizona','Cardinals','NFC',690,72,64],
  ].map(([abbreviation, city, name, conference, gspr, offenseScore, defenseScore]) => ({
    teamId: String(abbreviation),
    abbreviation: String(abbreviation),
    city: String(city),
    name: String(name),
    conference: conference as 'AFC' | 'NFC',
    gspr: Number(gspr),
    offenseScore: Number(offenseScore),
    defenseScore: Number(defenseScore),
    snapshotDate: SNAPSHOT_DATE,
  }));
}

export function matchupWinProbability(teamPower: TeamPower, opponent: NFLTeamStrength, isHome: boolean): number {
  const teamGspr = teamPower.gspr;
  const opponentGspr = opponent.gspr;
  const offenseEdge = teamPower.offenseScore - opponent.defenseScore;
  const defenseEdge = teamPower.defenseScore - opponent.offenseScore;
  const ratingEdge = (teamGspr - opponentGspr) / 1000 + (offenseEdge + defenseEdge) / 520;
  const home = isHome ? 0.025 : -0.015;
  return clamp(0.5 + ratingEdge + home, 0.05, 0.985);
}

export function buildNflSchedule(teamStrengths: NFLTeamStrength[], rand: () => number): NFLTeamStrength[] {
  const teams = [...teamStrengths].sort((a, b) => b.gspr - a.gspr);
  const schedule: NFLTeamStrength[] = [];
  for (let i = 0; i < 17; i++) {
    const tierBias = i < 5 ? 0.15 : i < 11 ? 0.4 : 0.7;
    const index = Math.min(teams.length - 1, Math.floor(Math.pow(rand(), tierBias + 0.85) * teams.length));
    schedule.push(teams[index]);
  }
  return schedule;
}

export function simulateLeagueStandings(teamStrengths: NFLTeamStrength[], rand: () => number): LeagueStanding[] {
  return teamStrengths.map(team => {
    const expectedWins = 4 + Math.pow(team.gspr / 1000, 2.1) * 10.5;
    const noise = (rand() + rand() + rand() - 1.5) * 2.1;
    const wins = Math.round(clamp(expectedWins + noise, 1, 16));
    return {
      rank: 0,
      conferenceRank: 0,
      teamId: team.teamId,
      name: team.name,
      city: team.city,
      abbreviation: team.abbreviation,
      conference: team.conference,
      wins,
      losses: 17 - wins,
      gspr: team.gspr,
      powerScore: team.gspr + wins * 9 + team.offenseScore + team.defenseScore,
    };
  });
}

export function rankLeagueStandings(standings: LeagueStanding[]): LeagueStanding[] {
  const ranked = [...standings].sort((a, b) => b.wins - a.wins || b.powerScore - a.powerScore);
  const conferenceCounts = new Map<string, number>();
  return ranked.map((team, index) => {
    const nextConferenceRank = (conferenceCounts.get(team.conference) ?? 0) + 1;
    conferenceCounts.set(team.conference, nextConferenceRank);
    return { ...team, rank: index + 1, conferenceRank: nextConferenceRank };
  });
}
