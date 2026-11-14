/** RNG có seed (mulberry32) để rèn đồ / chiến đấu tái lập được và test được. */
export class Rng {
  private s: number;
  constructor(seed: number = (Date.now() ^ 0x9e3779b9) >>> 0) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  weighted<T extends { weight: number }>(arr: readonly T[]): T {
    const total = arr.reduce((a, b) => a + b.weight, 0);
    let r = this.next() * total;
    for (const x of arr) {
      r -= x.weight;
      if (r <= 0) return x;
    }
    return arr[arr.length - 1];
  }
}
