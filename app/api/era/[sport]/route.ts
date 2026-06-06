import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Sport, EraResponse } from '@/lib/types';
import { generateTeamEras } from '@/lib/constants';
import { MLB_TEAMS } from '@/lib/sports/mlb';
import { NHL_TEAMS } from '@/lib/sports/nhl';
import { NBA_TEAMS } from '@/lib/sports/nba';
import { NFL_TEAMS } from '@/lib/sports/nfl';

const VALID_SPORTS: Sport[] = ['nba', 'nfl', 'mlb', 'nhl'];

const TEAMS_BY_SPORT = {
  mlb: MLB_TEAMS,
  nhl: NHL_TEAMS,
  nba: NBA_TEAMS,
  nfl: NFL_TEAMS,
};

const ParamsSchema = z.object({
  sport: z.enum(['nba', 'nfl', 'mlb', 'nhl']),
});

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sport: string } }
) {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid sport. Must be one of: nba, nfl, mlb, nhl' },
      { status: 400 }
    );
  }

  const sport = parsed.data.sport as Sport;
  const teams = TEAMS_BY_SPORT[sport];

  // Pick a random team, then a random 5-year era from that team's windows
  const team = pickRandom(teams);
  const eras = generateTeamEras(team);
  const era = pickRandom(eras);

  const response: EraResponse = { era, team };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
