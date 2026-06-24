import type { Era, HistoricalTeam } from './types';
import { getCuratedNFLEraCatalog } from './sports/nfl';

export type Rng = () => number;

export type EraQueueItem = {
  key: string;
  team: HistoricalTeam;
  era: Era;
  weight: number;
  elitePlayerCount: number;
};

export interface EraQueueOptions {
  rng?: Rng;
  excludeKeys?: Iterable<string>;
}

function boundedRandom(rng: Rng): number {
  const value = rng();
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.999999999, Math.max(0, value));
}

function weightedPickIndex(items: EraQueueItem[], rng: Rng): number {
  const total = items.reduce((sum, item) => sum + Math.max(0.001, item.weight), 0);
  let cursor = boundedRandom(rng) * total;

  for (let i = 0; i < items.length; i++) {
    cursor -= Math.max(0.001, items[i].weight);
    if (cursor <= 0) return i;
  }

  return items.length - 1;
}

export function buildEraQueue(options: EraQueueOptions = {}): EraQueueItem[] {
  const rng = options.rng ?? Math.random;
  const exclude = new Set(options.excludeKeys ?? []);
  const pool: EraQueueItem[] = getCuratedNFLEraCatalog()
    .filter(item => !exclude.has(item.key))
    .map(item => ({
      key: item.key,
      team: item.team,
      era: item.era,
      weight: item.weight,
      elitePlayerCount: item.elitePlayerCount,
    }));

  const queue: EraQueueItem[] = [];
  const remaining = [...pool];
  while (remaining.length > 0) {
    const index = weightedPickIndex(remaining, rng);
    const [item] = remaining.splice(index, 1);
    queue.push(item);
  }

  return queue;
}

export function rerollTeam(
  queue: EraQueueItem[],
  excludeTeamId: string,
  currentStartYear?: number,
): { item: EraQueueItem; newQueue: EraQueueItem[] } | null {
  const idx = queue.findIndex(item => {
    if (item.team.id === excludeTeamId) return false;
    if (currentStartYear == null) return true;
    return Math.abs(item.era.startYear - currentStartYear) <= 20;
  });
  if (idx === -1) return null;
  const newQueue = [...queue];
  const [item] = newQueue.splice(idx, 1);
  return { item, newQueue };
}

export function rerollEra(
  queue: EraQueueItem[],
  team: HistoricalTeam,
  excludeEraId: string,
): { item: EraQueueItem; newQueue: EraQueueItem[] } | null {
  const idx = queue.findIndex(item => item.team.id === team.id && item.era.id !== excludeEraId);
  if (idx === -1) return null;
  const newQueue = [...queue];
  const [item] = newQueue.splice(idx, 1);
  return { item, newQueue };
}

export function hasTeamReroll(queue: EraQueueItem[], teamId: string, currentStartYear?: number): boolean {
  return queue.some(item => {
    if (item.team.id === teamId) return false;
    if (currentStartYear == null) return true;
    return Math.abs(item.era.startYear - currentStartYear) <= 20;
  });
}

export function hasEraReroll(queue: EraQueueItem[], teamId: string, eraId: string): boolean {
  return queue.some(item => item.team.id === teamId && item.era.id !== eraId);
}
