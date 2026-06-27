import type { LeagueStanding, NFLDivision, NFLTeamStrength, PlayoffSeed, TeamPower } from './types';
import { clamp } from './utils';
import { NFL_TEAMS } from './sports/nfl-teams';
import { buildLastSeasonStrength, NFL_BASELINE_DATE } from './nflLastSeason';

const SEASON_GAMES = 17;

const LAST_SEASON_STRENGTHS: NFLTeamStrength[] = NFL_TEAMS.map(buildLastSeasonStrength);

export function getHardcodedNflTeamStrengths(): NFLTeamStrength[] {
  return LAST_SEASON_STRENGTHS;
}

// ─── Win probability ──────────────────────────────────────────────────────────

export function matchupWinProbability(teamPower: TeamPower, opponent: NFLTeamStrength, isHome: boolean): number {
  const offenseEdge = teamPower.offenseScore - opponent.defenseScore;
  const defenseEdge = teamPower.defenseScore - opponent.offenseScore;
  const ratingEdge = (teamPower.gspr - opponent.gspr) / 1000 + (offenseEdge + defenseEdge) / 520;
  const home = isHome ? 0.025 : -0.015;
  return clamp(0.5 + ratingEdge + home, 0.05, 0.985);
}

// Win probability between two scouted teams (used for league + playoff games).
export function teamVsTeamProbability(
  a: { gspr: number; offenseScore: number; defenseScore: number },
  b: { gspr: number; offenseScore: number; defenseScore: number },
  homeEdge: number,
): number {
  const offenseEdge = a.offenseScore - b.defenseScore;
  const defenseEdge = a.defenseScore - b.offenseScore;
  const ratingEdge = (a.gspr - b.gspr) / 1000 + (offenseEdge + defenseEdge) / 520;
  return clamp(0.5 + ratingEdge + homeEdge, 0.04, 0.96);
}

// ─── Custom-team schedule ─────────────────────────────────────────────────────
// 17 opponents weighted toward a realistic spread of tiers (some cupcakes, a
// gauntlet down the stretch) drawn from last season's league.
export function buildNflSchedule(teamStrengths: NFLTeamStrength[], rand: () => number): NFLTeamStrength[] {
  const teams = [...teamStrengths].sort((a, b) => b.gspr - a.gspr);
  const schedule: NFLTeamStrength[] = [];
  for (let i = 0; i < SEASON_GAMES; i++) {
    const tierBias = i < 5 ? 0.15 : i < 11 ? 0.4 : 0.7;
    const index = Math.min(teams.length - 1, Math.floor(Math.pow(rand(), tierBias + 0.85) * teams.length));
    schedule.push(teams[index]);
  }
  return schedule;
}

// ─── League standings ─────────────────────────────────────────────────────────
// Anchored to each team's real 2024 record (so the league keeps last season's
// shape) with game-to-game variance, then seeded into the playoff picture.

function gaussian(rand: () => number): number {
  return rand() + rand() + rand() - 1.5;
}

export function simulateLeagueStandings(teamStrengths: NFLTeamStrength[], rand: () => number): LeagueStanding[] {
  return teamStrengths.map(team => {
    const expected = team.baselineWins * 0.7 + (4 + Math.pow(team.gspr / 1000, 2.1) * 10.5) * 0.3;
    const wins = Math.round(clamp(expected + gaussian(rand) * 1.9, 1, 16));
    return {
      rank: 0,
      conferenceRank: 0,
      teamId: team.teamId,
      name: team.name,
      city: team.city,
      abbreviation: team.abbreviation,
      conference: team.conference,
      division: team.division,
      wins,
      losses: SEASON_GAMES - wins,
      pointsFor: Math.round(team.pointsForPg * SEASON_GAMES),
      pointsAgainst: Math.round(team.pointsAgainstPg * SEASON_GAMES),
      gspr: team.gspr,
      powerScore: Math.round(team.gspr + wins * 9 + team.offenseScore + team.defenseScore),
    } satisfies LeagueStanding;
  });
}

const DIVISIONS: NFLDivision[] = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West',
];

function byRecord(a: LeagueStanding, b: LeagueStanding): number {
  return b.wins - a.wins || b.powerScore - a.powerScore || a.name.localeCompare(b.name);
}

// Seeds a single conference: 4 division winners (seeds 1–4 by record) followed by
// the 3 best remaining teams as wildcards (seeds 5–7). The custom God Squad, which
// has no division, is merged into the field strictly by record so a dominant
// superteam can claim a top seed (a deliberate game-design bend of the real rule
// that wildcards always seed below division winners).
export function computeConferenceSeeds(
  conference: 'AFC' | 'NFC',
  standings: LeagueStanding[],
): { seeds: LeagueStanding[]; firstOut: LeagueStanding | null } {
  const inConference = standings.filter(s => s.conference === conference);
  const custom = inConference.find(s => s.isCustomTeam) ?? null;
  const realTeams = inConference.filter(s => !s.isCustomTeam);

  const divisionWinners: LeagueStanding[] = [];
  for (const division of DIVISIONS.filter(d => d.startsWith(conference))) {
    const winner = realTeams.filter(s => s.division === division).sort(byRecord)[0];
    if (winner) divisionWinners.push(winner);
  }
  divisionWinners.sort(byRecord);
  const winnerIds = new Set(divisionWinners.map(s => s.teamId));
  const wildcardPool = realTeams.filter(s => !winnerIds.has(s.teamId)).sort(byRecord);

  // Real field: 4 division winners then wildcards in record order.
  const realField = [...divisionWinners, ...wildcardPool];

  // Merge the custom team in by record (it competes for any spot but a division title).
  let merged = realField;
  if (custom) {
    merged = [...realField];
    let insertAt = merged.findIndex(s => byRecord(custom, s) < 0);
    if (insertAt === -1) insertAt = merged.length;
    merged.splice(insertAt, 0, custom);
  }

  const seeds = merged.slice(0, 7).map((s, i) => ({ ...s, seed: i + 1 }));
  const firstOut = merged[7] ?? null;
  return { seeds, firstOut };
}

// Ranks the full league overall + per-conference and tags playoff status.
export function rankLeagueStandings(standings: LeagueStanding[]): LeagueStanding[] {
  const ranked = [...standings].sort(byRecord);
  ranked.forEach((team, index) => { team.rank = index + 1; });

  for (const conference of ['AFC', 'NFC'] as const) {
    const { seeds, firstOut } = computeConferenceSeeds(conference, ranked);
    const seedIds = new Map(seeds.map(s => [s.teamId, s.seed!]));
    const divisionWinnerIds = new Set(
      DIVISIONS.filter(d => d.startsWith(conference)).map(division =>
        ranked.filter(s => !s.isCustomTeam && s.division === division).sort(byRecord)[0]?.teamId,
      ),
    );
    ranked
      .filter(s => s.conference === conference)
      .sort(byRecord)
      .forEach((team, index) => {
        team.conferenceRank = index + 1;
        const seed = seedIds.get(team.teamId);
        if (seed) {
          team.seed = seed;
          team.playoffStatus = divisionWinnerIds.has(team.teamId) ? 'division-winner' : 'wildcard';
        } else if (firstOut && team.teamId === firstOut.teamId) {
          team.playoffStatus = 'in-hunt';
        } else {
          team.playoffStatus = 'eliminated';
        }
      });
  }
  return ranked;
}

export function conferenceSeedsToPlayoffSeeds(seeds: LeagueStanding[]): PlayoffSeed[] {
  return seeds.map(s => ({
    seed: s.seed!,
    teamId: s.teamId,
    abbreviation: s.abbreviation,
    city: s.city,
    name: s.name,
    conference: s.conference as 'AFC' | 'NFC',
    wins: s.wins,
    losses: s.losses,
    isCustomTeam: s.isCustomTeam,
  }));
}

export { NFL_BASELINE_DATE };
