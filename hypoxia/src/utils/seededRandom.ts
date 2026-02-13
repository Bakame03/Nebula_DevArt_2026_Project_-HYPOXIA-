// Simple Seeded Pseudo-Random Number Generator (Mulberry32)
// This ensures that the scene generation is deterministic (same result every time).

export default class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     */
    next(): number {
        let t = (this.seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Resets the generator with a specific seed.
     */
    reset(seed: number) {
        this.seed = seed;
    }
}
