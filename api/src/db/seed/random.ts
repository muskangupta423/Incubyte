/**
 * Seeded random number generator: the same seed always gives the same sequence,
 * so the seed data is identical on every run (Math.random cannot be seeded).
 * Algorithm: mulberry32 — a small, well-known 32-bit generator. Good enough for fake data, not for security.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  /** Returns a number in [0, 1). */
  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a whole number between min and max, both included. */
  function integer(min: number, max: number): number {
    return min + Math.floor(next() * (max - min + 1));
  }

  function pick<T>(items: readonly T[]): T {
    const item = items[integer(0, items.length - 1)];
    if (item === undefined) throw new Error('Cannot pick from an empty list');
    return item;
  }

  /** Picks an item with probability proportional to its weight. */
  function pickWeighted<T extends { weight: number }>(items: readonly T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let remaining = next() * totalWeight;
    for (const item of items) {
      remaining -= item.weight;
      if (remaining < 0) return item;
    }
    return pick(items);
  }

  return { integer, pick, pickWeighted };
}

export type Random = ReturnType<typeof createRandom>;
