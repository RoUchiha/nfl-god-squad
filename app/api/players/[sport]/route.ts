import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { PlayersResponse } from '@/lib/types';
import { NFL_TEAMS, fetchNFLPlayers } from '@/lib/sports/nfl';
import { getCuratedNFLEraCatalog } from '@/lib/sports/nfl';

const ParamsSchema = z.object({
  sport: z.literal('nfl'),
});

const QuerySchema = z.object({
  teamId: z.string().min(1).max(20).regex(/^[a-zA-Z0-9]+$/),
  eraId: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sport: string }> }
) {
  const routeParsed = ParamsSchema.safeParse(await params);
  if (!routeParsed.success) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const queryParsed = QuerySchema.safeParse({
    teamId: searchParams.get('teamId') ?? '',
    eraId: searchParams.get('eraId') ?? '',
  });

  if (!queryParsed.success) {
    return NextResponse.json({ error: 'Missing or invalid teamId/eraId' }, { status: 400 });
  }

  const { teamId, eraId } = queryParsed.data;
  const team = NFL_TEAMS.find(t => t.id === teamId);
  const catalogEntry = getCuratedNFLEraCatalog().find(entry => entry.team.id === teamId && entry.era.id === eraId);

  if (!team || !catalogEntry) {
    return NextResponse.json({ error: 'Team-era not found' }, { status: 404 });
  }

  const players = await fetchNFLPlayers(team, catalogEntry.era);
  if (players.length === 0) {
    return NextResponse.json({ error: 'Roster not available for this team-era' }, { status: 404 });
  }

  const response: PlayersResponse = { players, era: catalogEntry.era, team };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
