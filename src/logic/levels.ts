import { entriesForLevel } from './configs';
import type { ConfigEntry, Level, Rng, RoundRecord } from './types';

/** Taille de l'historique (R-60). */
export const HISTORY_SIZE = 5;

/** Tire uniformément une entrée parmi celles du niveau (spec §3). Un seul appel à `rng`. */
export function pickEntry(level: Level, rng: Rng): ConfigEntry {
  const entries = entriesForLevel(level);
  return entries[Math.floor(rng() * entries.length)] as ConfigEntry;
}

/** Ajoute une partie (ordre ancien → récent), garde les 5 dernières (R-60). */
export function appendHistory(
  history: readonly RoundRecord[],
  record: RoundRecord,
): readonly RoundRecord[] {
  const frozen = Object.freeze({ ...record });
  return Object.freeze([...history, frozen].slice(-HISTORY_SIZE));
}

/** Niveau suivant : port exact de CalcNextLevel (spec §6.2, R-60..R-65). */
export function nextLevel(history: readonly RoundRecord[]): Level {
  const recent = history.slice(-HISTORY_SIZE);
  const d = recent[recent.length - 1];
  if (d === undefined) return 1; // R-61
  const k = d.cardsFlipped;
  const L = d.level;
  const o = d.outcome;

  if (o === 'WON' && L === 8) return 8;

  if (
    L >= 5 &&
    recent.length >= HISTORY_SIZE &&
    recent.every((g) => g.cardsFlipped >= 8 && g.outcome !== 'LOST')
  ) {
    return 8;
  }

  for (let n = 7; n >= 2; n--) {
    if ((L >= n && k >= n) || (L >= n - 1 && o === 'WON')) return n as Level;
  }
  return 1;
}
