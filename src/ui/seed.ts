import { mulberry32 } from '../logic/rng';
import type { Rng } from '../logic/types';

/** Seul endroit de l'application qui tire de l'aléa système. */
function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

/** `?seed=<entier>` n'est pris en compte qu'en développement ; sinon graine aléatoire. */
export function readSeed(search: string, dev: boolean): number {
  if (dev) {
    const raw = new URLSearchParams(search).get('seed');
    if (raw !== null && /^\d+$/.test(raw)) {
      const n = Number(raw);
      if (Number.isSafeInteger(n) && n <= 0xffffffff) return n;
    }
  }
  return randomSeed();
}

/** Deux générateurs distincts : plateau (logique) et décor (animations, confettis...). */
export function createRngs(seed: number): { readonly board: Rng; readonly decor: Rng } {
  return { board: mulberry32(seed), decor: mulberry32((seed ^ 0x9e3779b9) >>> 0) };
}
