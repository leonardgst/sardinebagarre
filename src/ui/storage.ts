import { deserialize, serialize } from '../logic/save';
import type { LoadStatus, SaveData } from '../logic/types';

/** R-100 : clé de la sauvegarde dans `localStorage`. */
export const SAVE_KEY = 'sardinebagarre:save';

/** R-102, CL-22 : lecture tolérante ; un stockage bloqué équivaut à une sauvegarde absente. */
export function loadSave(): { readonly save: SaveData; readonly status: LoadStatus } {
  let text: string | null = null;
  try {
    text = localStorage.getItem(SAVE_KEY);
  } catch {
    text = null;
  }
  return deserialize(text);
}

/** R-100 : écrit la sauvegarde ; `false` si le stockage refuse (quota, navigation privée). */
export function writeSave(save: SaveData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, serialize(save));
    return true;
  } catch {
    return false;
  }
}
