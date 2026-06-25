export type Sport = 'nba' | 'nfl' | 'mlb' | 'nhl' | 'epl' | 'wcup';

export type DraftMode = 'offense' | 'defense' | 'combined';

export type DraftPhase = 'offense' | 'defense' | 'complete';

export interface Era {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  sport: Sport;
  teamId: string;
  description: string;
}

export interface HistoricalTeam {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  sport: Sport;
  primaryColor: string;
  secondaryColor: string;
}

export type Position =
  | 'PG' | 'SG' | 'SF' | 'PF' | 'C'          // NBA
  | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'OL' | 'DEF' // NFL Standard Mode
  | 'DE' | 'DT' | 'LB' | 'CB' | 'S'           // NFL Defense
  | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'C_MLB' // MLB Batting
  | 'SP' | 'RP' | 'CL'                          // MLB Pitching
  | 'LW' | 'RW' | 'C_NHL' | 'D' | 'G_NHL'     // NHL
  | 'GK' | 'CB_S' | 'LB_S' | 'RB_S' | 'CDM' | 'CM_S' | 'CAM' | 'LW_S' | 'RW_S' | 'ST' | 'CF_S'; // Soccer

export type PositionGroup = 'offense' | 'defense' | 'pitching' | 'goalie';

export interface PlayerStats {
  // NBA
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  fieldGoalPct?: number;
  threePointPct?: number;
  freeThrowPct?: number;
  // NFL Offense
  passingYards?: number;
  passingTDs?: number;
  passerRating?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  sacksAllowed?: number;
  lineRank?: number;
  runBlockRank?: number;
  passBlockRank?: number;
  // NFL Defense
  sacks?: number;
  interceptions?: number;
  tackles?: number;
  forcedFumbles?: number;
  passDeflections?: number;
  pointsAllowed?: number;
  yardsAllowed?: number;
  takeaways?: number;
  // NBA extra
  turnovers?: number;
  // MLB Batting
  battingAvg?: number;
  homeRuns?: number;
  rbi?: number;
  onBasePct?: number;
  sluggingPct?: number;
  ops?: number;
  stolenBases?: number;
  // MLB Pitching
  era?: number;
  whip?: number;
  strikeoutsPerNine?: number;
  wins?: number;
  saves?: number;
  inningsPitched?: number;
  // NHL
  goals?: number;
  nhlAssists?: number;
  nhlPoints?: number;
  plusMinus?: number;
  savePct?: number;
  goalsAgainstAvg?: number;
  penaltyMinutes?: number;
  powerPlayGoals?: number;
  // Soccer
  soccerGoals?: number;
  soccerAssists?: number;
  soccerApps?: number;
  cleanSheets?: number;
  savePctSoc?: number;
  keyPasses?: number;
  tacklesPG?: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  positionGroup: PositionGroup;
  eraId?: string;   // for era-chemistry bonus
  teamId?: string;  // for team-chemistry bonus
  bestSeasonYear?: number; // year of the best season shown
  yearsWithTeam: string;
  stats: PlayerStats;
  playerScore: number;       // individual era-adjusted score 0–100
  isLegend?: boolean;         // Hall of Fame / GOAT tier
  isAllStar?: boolean;        // All-Star / Pro Bowl level
  imageUrl?: string;
}

export interface RosterSlotTemplate {
  id: string;
  position: Position | Position[];  // accepts multiple positions (flex slots)
  label: string;
  group: PositionGroup;
  required: boolean;
}

export interface FilledRosterSlot extends RosterSlotTemplate {
  player: Player | null;
}

export interface TeamPower {
  gspr: number;
  offenseScore: number;
  defenseScore: number;
  depthScore: number;
  chemistryBonus: number;
  tier: 'average' | 'good' | 'great' | 'legendary' | 'god';
  breakdown: string[];
}

export interface GameResult {
  gameNumber: number;
  win: boolean;
  scoreDiff: number;
  opponentTier: string;
  opponentTeamId?: string;
  opponentName?: string;
  opponentAbbreviation?: string;
  opponentGspr?: number;
  isHome?: boolean;
  teamScore?: number;
  opponentScore?: number;
}

export interface TeamCompositionAnalysis {
  pros: string[];
  cons: string[];
}

export interface LeagueStanding {
  rank: number;
  conferenceRank: number;
  teamId: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: string;
  wins: number;
  losses: number;
  gspr: number;
  powerScore: number;
  isCustomTeam?: boolean;
}

export interface NFLTeamStrength {
  teamId: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: 'AFC' | 'NFC';
  gspr: number;
  offenseScore: number;
  defenseScore: number;
  snapshotDate: string;
}

export interface PlayerSeasonStatLine {
  playerId: string;
  name: string;
  position: Position;
  slotLabel: string;
  playerScore: number;
  gamesPlayed: number;
  passingYards?: number;
  passingTDs?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  sacksAllowed?: number;
  pointsAllowed?: number;
  sacks?: number;
  takeaways?: number;
}

export interface SeasonResults {
  sport: Sport;
  wins: number;
  losses: number;
  totalGames: number;
  games: GameResult[];
  teamPower: TeamPower;
  compositionAnalysis?: TeamCompositionAnalysis;
  leagueStandings?: LeagueStanding[];
  rosterStats?: PlayerSeasonStatLine[];
  teamStrengthSnapshotDate?: string;
  isUndefeated: boolean;
  longestWinStreak: number;
  achievement: string;
  achievementSubtext: string;
  recordLabel: string;
}

export interface RerollState {
  teamRerollsUsed: number;
  positionSwapUsed: boolean;
}

export type GamePhase = 'loading' | 'draft' | 'simulate' | 'results';

export interface EraResponse {
  era: Era;
  team: HistoricalTeam;
}

export interface PlayersResponse {
  players: Player[];
  era: Era;
  team: HistoricalTeam;
}
