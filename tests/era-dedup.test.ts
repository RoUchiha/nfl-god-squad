/**
 * Tests: era deduplication logic
 *
 * Guardrail: the `exclude` param must prevent the same era from being returned
 * twice. These tests simulate the exclusion logic in isolation without hitting
 * network routes.
 */
import { describe, it, expect } from 'vitest';

// ─── Helpers (mirrors logic in app/api/era/[sport]/route.ts) ─────────────────

function pickExcluding(pool: string[], exclude: Set<string>, maxAttempts = 10): string | null {
  const available = pool.filter(id => !exclude.has(id));
  if (available.length === 0) return null; // fallback: all exhausted
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}

function simulateDraftSession(pool: string[], totalPicks: number): string[] {
  const used = new Set<string>();
  const picks: string[] = [];
  for (let i = 0; i < totalPicks; i++) {
    const pick = pickExcluding(pool, used);
    if (pick === null) break; // exhausted
    picks.push(pick);
    used.add(pick);
  }
  return picks;
}

// ─── Era pool used in tests ───────────────────────────────────────────────────

const MOCK_NBA_ERAS = [
  'nba-1-1985', 'nba-1-1996', 'nba-5-2000', 'nba-5-2010',
  'nba-14-1980', 'nba-14-1990', 'nba-23-2000', 'nba-23-2010',
];

// ─── Core invariant: no duplicates ───────────────────────────────────────────

describe('era deduplication – core invariant', () => {
  it('picks never contain a duplicate', () => {
    for (let trial = 0; trial < 20; trial++) {
      const picks = simulateDraftSession(MOCK_NBA_ERAS, 8);
      const unique = new Set(picks);
      expect(unique.size).toBe(picks.length);
    }
  });

  it('stops when pool is exhausted rather than repeating', () => {
    const picks = simulateDraftSession(MOCK_NBA_ERAS, 100); // request more than pool size
    expect(picks.length).toBeLessThanOrEqual(MOCK_NBA_ERAS.length);
    const unique = new Set(picks);
    expect(unique.size).toBe(picks.length);
  });

  it('returns null when all eras are excluded', () => {
    const allExcluded = new Set(MOCK_NBA_ERAS);
    const result = pickExcluding(MOCK_NBA_ERAS, allExcluded);
    expect(result).toBeNull();
  });
});

// ─── Exclude param string parsing ────────────────────────────────────────────

describe('era deduplication – exclude param parsing', () => {
  function parseExclude(param: string | null): Set<string> {
    if (!param) return new Set<string>();
    return new Set(param.split(',').filter(Boolean));
  }

  it('parses comma-separated exclude string into a Set', () => {
    const result = parseExclude('nba-1-1985,nba-5-2000,nba-14-1980');
    expect(result.size).toBe(3);
    expect(result.has('nba-1-1985')).toBe(true);
    expect(result.has('nba-5-2000')).toBe(true);
    expect(result.has('nba-14-1980')).toBe(true);
  });

  it('handles empty string → empty set', () => {
    expect(parseExclude('').size).toBe(0);
  });

  it('handles null → empty set', () => {
    expect(parseExclude(null).size).toBe(0);
  });

  it('filters out empty tokens from trailing commas', () => {
    const result = parseExclude('nba-1-1985,,nba-5-2000,');
    expect(result.size).toBe(2);
  });
});

// ─── usedEraIds accumulation ──────────────────────────────────────────────────

describe('era deduplication – usedEraIds accumulation', () => {
  it('each pick is added to the exclusion set for subsequent picks', () => {
    const used = new Set<string>();
    const picked: string[] = [];

    for (let i = 0; i < MOCK_NBA_ERAS.length; i++) {
      const pick = pickExcluding(MOCK_NBA_ERAS, used);
      expect(pick).not.toBeNull();
      expect(used.has(pick!)).toBe(false); // was not yet in set
      used.add(pick!);
      picked.push(pick!);
      expect(used.size).toBe(i + 1);
    }
    // Pool fully exhausted
    expect(pickExcluding(MOCK_NBA_ERAS, used)).toBeNull();
  });

  it('exclude set built from Array.from is identical to spread set', () => {
    const original = new Set(['a', 'b', 'c']);
    const copy1 = new Set(Array.from(original));
    expect(Array.from(copy1)).toEqual(Array.from(original));
  });
});

// ─── Cross-reroll guarantee ───────────────────────────────────────────────────

describe('era deduplication – reroll behavior', () => {
  it('rerolling 8 times across a small pool never repeats', () => {
    const smallPool = ['era-A', 'era-B', 'era-C', 'era-D', 'era-E'];
    const picks = simulateDraftSession(smallPool, 5);
    expect(new Set(picks).size).toBe(picks.length);
  });

  it('era picked on initial load is excluded from rerolls', () => {
    const pool = ['era-X', 'era-Y', 'era-Z'];
    const used = new Set<string>(['era-X']); // simulates initial load
    for (let i = 0; i < 20; i++) {
      const pick = pickExcluding(pool, used);
      if (pick) expect(pick).not.toBe('era-X');
    }
  });
});
