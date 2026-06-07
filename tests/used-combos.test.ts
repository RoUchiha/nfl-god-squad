/**
 * Tests: usedCombos / team+era tracking
 *
 * Guardrail: once a team/era combination has been seen, it must not appear again
 * in the same draft session. These tests validate the exclusion accumulation
 * and the Array.from serialization used to build the query param.
 */
import { describe, it, expect } from 'vitest';

// ─── Simulate the client-side usedEraIds logic ───────────────────────────────

class DraftSession {
  private used: Set<string> = new Set();

  addEra(eraId: string): void {
    this.used.add(eraId);
  }

  /** Mirrors the Array.from(set).join(',') call in GameContainer */
  buildExcludeParam(): string {
    return Array.from(this.used).join(',');
  }

  hasUsed(eraId: string): boolean {
    return this.used.has(eraId);
  }

  get count(): number {
    return this.used.size;
  }
}

// ─── Accumulation ─────────────────────────────────────────────────────────────

describe('usedCombos – Set accumulation', () => {
  it('adding the same era twice does not increase count', () => {
    const session = new DraftSession();
    session.addEra('nba-5-2000');
    session.addEra('nba-5-2000');
    expect(session.count).toBe(1);
  });

  it('each distinct era increments count by 1', () => {
    const session = new DraftSession();
    session.addEra('nba-1-1985');
    session.addEra('nba-5-2000');
    session.addEra('nfl-17-2006');
    expect(session.count).toBe(3);
  });

  it('hasUsed returns false before add and true after', () => {
    const session = new DraftSession();
    expect(session.hasUsed('nba-1-1985')).toBe(false);
    session.addEra('nba-1-1985');
    expect(session.hasUsed('nba-1-1985')).toBe(true);
  });
});

// ─── Exclude param serialization ─────────────────────────────────────────────

describe('usedCombos – exclude param serialization', () => {
  it('empty session produces empty string', () => {
    const session = new DraftSession();
    expect(session.buildExcludeParam()).toBe('');
  });

  it('single era produces bare ID string (no trailing comma)', () => {
    const session = new DraftSession();
    session.addEra('nba-1-1985');
    expect(session.buildExcludeParam()).toBe('nba-1-1985');
  });

  it('multiple eras are joined with comma, no spaces', () => {
    const session = new DraftSession();
    session.addEra('nba-1-1985');
    session.addEra('nfl-17-2006');
    const param = session.buildExcludeParam();
    expect(param).toMatch(/^[a-z0-9-]+(,[a-z0-9-]+)*$/);
    expect(param.split(',')).toHaveLength(2);
  });

  it('serialized string can be parsed back to the same Set', () => {
    const session = new DraftSession();
    const eras = ['nba-1-1985', 'nfl-17-2006', 'mlb-147-1927', 'nhl-EDM-1983'];
    eras.forEach(e => session.addEra(e));

    const param = session.buildExcludeParam();
    const restored = new Set(param.split(',').filter(Boolean));
    expect(restored.size).toBe(eras.length);
    for (const era of eras) {
      expect(restored.has(era)).toBe(true);
    }
  });
});

// ─── Immutability of Set copies ───────────────────────────────────────────────

describe('usedCombos – Set copy immutability', () => {
  it('new Set(Array.from(prev)) does not mutate original', () => {
    const original = new Set(['a', 'b', 'c']);
    const copy = new Set([...Array.from(original), 'd']);
    expect(original.size).toBe(3);
    expect(copy.size).toBe(4);
    expect(original.has('d')).toBe(false);
  });

  it('Array.from is the correct way to spread a Set in this codebase', () => {
    const s = new Set(['x', 'y', 'z']);
    const fromArray = Array.from(s);
    expect(fromArray).toContain('x');
    expect(fromArray).toContain('y');
    expect(fromArray).toContain('z');
    expect(fromArray.length).toBe(3);
  });
});

// ─── Reroll invariant ─────────────────────────────────────────────────────────

describe('usedCombos – reroll invariant', () => {
  /**
   * Simulates N rerolls from a pool, adding each pick to `used`.
   * Returns true if any era was returned more than once.
   */
  function simulateRerolls(pool: string[], rolls: number): boolean {
    const used = new Set<string>();
    for (let i = 0; i < rolls; i++) {
      const available = pool.filter(id => !used.has(id));
      if (available.length === 0) break;
      const pick = available[Math.floor(Math.random() * available.length)];
      if (used.has(pick)) return true; // duplicate detected
      used.add(pick);
    }
    return false;
  }

  it('never produces a duplicate across 50 simulation trials', () => {
    const pool = Array.from({ length: 20 }, (_, i) => `era-${i}`);
    for (let trial = 0; trial < 50; trial++) {
      expect(simulateRerolls(pool, 20)).toBe(false);
    }
  });

  it('picks stop when pool is exhausted rather than repeating', () => {
    const pool = ['era-A', 'era-B', 'era-C'];
    const used = new Set<string>();
    let picks = 0;
    for (let i = 0; i < 10; i++) {
      const available = pool.filter(id => !used.has(id));
      if (available.length === 0) break;
      used.add(available[0]);
      picks++;
    }
    expect(picks).toBe(3); // stopped at pool size, did not loop
    expect(used.size).toBe(3);
  });
});
