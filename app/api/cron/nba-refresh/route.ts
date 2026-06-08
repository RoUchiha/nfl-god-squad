'use server';
import { NextRequest, NextResponse } from 'next/server';
import { NBA_TEAMS } from '@/lib/sports/nba';
import { ESPN_TEAM_ID } from '@/lib/sports/nba-espn';

/**
 * Vercel Cron endpoint — runs every 6 hours.
 * Pre-warms the ESPN roster cache for all 30 NBA teams so the first
 * user to hit the current-era player pool doesn't wait for a cold fetch.
 *
 * Vercel schedule: see vercel.json  (0 *\/6 * * *)
 * Protected by CRON_SECRET header (set in Vercel env vars).
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, string> = {};
  const CURRENT_ERA_START = 2020;

  for (const team of NBA_TEAMS) {
    const espnId = ESPN_TEAM_ID[team.id];
    if (!espnId) { results[team.abbreviation] = 'no-espn-id'; continue; }

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnId}/roster`;
      const res = await fetch(url, {
        next: { revalidate: 21600 }, // 6 hours
        headers: { 'User-Agent': 'GodSquadGame/1.0' },
      });
      results[team.abbreviation] = res.ok ? `ok-${res.status}` : `err-${res.status}`;
    } catch (e) {
      results[team.abbreviation] = `throw-${e instanceof Error ? e.message : 'unknown'}`;
    }
  }

  return NextResponse.json({
    refreshed: new Date().toISOString(),
    eraStart: CURRENT_ERA_START,
    results,
  });
}
