import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { EraResponse } from '@/lib/types';
import { getCuratedNFLEraCatalog } from '@/lib/sports/nfl';

const ParamsSchema = z.object({
  sport: z.literal('nfl'),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sport: string }> }
) {
  const routeParsed = ParamsSchema.safeParse(await params);
  if (!routeParsed.success) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
  }

  const catalog = getCuratedNFLEraCatalog();
  const item = catalog[Math.floor(Math.random() * catalog.length)];
  if (!item) return NextResponse.json({ error: 'No NFL eras available' }, { status: 404 });

  return NextResponse.json({ era: item.era, team: item.team } as EraResponse, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
