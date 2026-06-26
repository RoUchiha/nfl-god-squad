import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { FilledRosterSlot } from '@/lib/types';
import { computeTeamGSPR } from '@/lib/algorithms/powerRating';
import { simulateSeason } from '@/lib/algorithms/simulator';
import { canonicalizeSimulationRoster, validateSimulationRoster } from '@/lib/simulationRoster';
import { checkRateLimit, getClientIp, isTrustedMutationRequest, readJsonBody } from '@/lib/security';
import { getHardcodedNflTeamStrengths } from '@/lib/nflLeague';
import { analyzeTeamComposition } from '@/lib/teamComposition';

const RateStat = z.number().finite().min(0).max(1);
const CountStat = z.number().finite().min(0).max(10000);

const PlayerStatsSchema = z.object({
  passingYards: CountStat.optional(),
  passingTDs: CountStat.optional(),
  passerRating: z.number().finite().min(0).max(158.3).optional(),
  rushingYards: CountStat.optional(),
  rushingTDs: CountStat.optional(),
  receivingYards: CountStat.optional(),
  receivingTDs: CountStat.optional(),
  receptions: CountStat.optional(),
  sacksAllowed: CountStat.optional(),
  qbDropbacks: CountStat.optional(),
  pressuresAllowed: CountStat.optional(),
  sackRate: RateStat.optional(),
  pressureRate: RateStat.optional(),
  qbPassingYards: CountStat.optional(),
  teamRushingYards: CountStat.optional(),
  lineRank: CountStat.optional(),
  runBlockRank: CountStat.optional(),
  passBlockRank: CountStat.optional(),
  sacks: CountStat.optional(),
  interceptions: CountStat.optional(),
  tackles: CountStat.optional(),
  forcedFumbles: CountStat.optional(),
  passDeflections: CountStat.optional(),
  pointsAllowed: CountStat.optional(),
  yardsAllowed: CountStat.optional(),
  takeaways: CountStat.optional(),
  defensiveTfl: CountStat.optional(),
  defensiveStarCount: CountStat.optional(),
  defensiveHofCount: CountStat.optional(),
  fieldGoalPct: RateStat.optional(),
}).strict();

const PositionSchema = z.enum(['QB', 'RB', 'WR', 'TE', 'OL', 'DEF']);

const PlayerSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().min(1).max(100),
  position: PositionSchema,
  positionGroup: z.enum(['offense', 'defense']),
  eraId: z.string().max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
  teamId: z.string().max(20).regex(/^[a-zA-Z0-9]+$/).optional(),
  bestSeasonYear: z.number().int().min(1920).max(2100).optional(),
  yearsWithTeam: z.string().max(20),
  stats: PlayerStatsSchema,
  playerScore: z.number().min(0).max(100),
  isLegend: z.boolean().optional(),
  isAllStar: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
}).strict();

const RosterSlotSchema = z.object({
  id: z.string().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  position: z.union([PositionSchema, z.array(PositionSchema).max(3)]),
  label: z.string().min(1).max(40),
  group: z.enum(['offense', 'defense']),
  required: z.boolean(),
  player: PlayerSchema.nullable(),
}).strict();

const SimulateBodySchema = z.object({
  sport: z.literal('nfl'),
  mode: z.literal('combined'),
  slots: z.array(RosterSlotSchema).length(8),
}).strict();

export async function POST(req: NextRequest) {
  if (!isTrustedMutationRequest(req)) {
    return NextResponse.json({ error: 'Cross-site requests are not allowed' }, {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, {
      status: 415,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const ip = getClientIp(req);
  const requestLimit = checkRateLimit(`simulate:${ip}`, { limit: 12, windowMs: 60_000 });
  if (!requestLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many simulation requests' },
      { status: 429, headers: { 'Retry-After': String(requestLimit.retryAfter), 'Cache-Control': 'no-store' } }
    );
  }

  const bodyResult = await readJsonBody(req);
  if (!bodyResult.ok) {
    return NextResponse.json(
      { error: bodyResult.reason === 'too-large' ? 'Request body is too large' : 'Invalid JSON body' },
      { status: bodyResult.reason === 'too-large' ? 413 : 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const parsed = SimulateBodySchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request data' }, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const submittedSlots = parsed.data.slots as unknown as FilledRosterSlot[];
  const rosterError = validateSimulationRoster(submittedSlots);
  if (rosterError) {
    return NextResponse.json({ error: rosterError }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const canonical = canonicalizeSimulationRoster(submittedSlots);
  if (!canonical.slots) {
    return NextResponse.json({ error: canonical.error }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const canonicalRosterError = validateSimulationRoster(canonical.slots);
  if (canonicalRosterError) {
    return NextResponse.json({ error: canonicalRosterError }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const teamPower = computeTeamGSPR(canonical.slots, 'nfl', 'combined');
  const compositionAnalysis = analyzeTeamComposition(canonical.slots);
  const results = simulateSeason(teamPower, 'nfl', compositionAnalysis, getHardcodedNflTeamStrengths(), canonical.slots);

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
