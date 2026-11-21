import { COIN_CAP } from './constants';
import { freezeGame, initialGame, resetProgress } from './game';
import type {
  GameState,
  Level,
  LoadStatus,
  Outcome,
  RoundRecord,
  SaveData,
  Settings,
  Stats,
} from './types';

/** Version courante du format de sauvegarde (R-100). */
export const SAVE_VERSION = 1;

const OUTCOMES: readonly string[] = ['WON', 'LOST', 'QUIT'];
const HISTORY_MAX = 5;

type Raw = Readonly<Record<string, unknown>>;

function isObject(x: unknown): x is Raw {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isIntIn(x: unknown, min: number, max: number): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}

function freezeSave(save: SaveData): SaveData {
  return Object.freeze({
    game: freezeGame({
      ...save.game,
      history: save.game.history.map((r) => Object.freeze({ ...r })),
    }),
    settings: Object.freeze({ ...save.settings }),
    welcomeSeen: save.welcomeSeen,
    packCode: save.packCode,
  });
}

/** R-101 : sauvegarde du premier lancement (son actif, animations non renseignées). */
export function initialSave(): SaveData {
  return freezeSave({
    game: initialGame(),
    settings: { sound: true, reducedMotion: null },
    welcomeSeen: false,
    packCode: null,
  });
}

/** R-100, R-101 : objet plat, sans la partie en cours (R-68). */
export function serialize(save: SaveData): string {
  const { game, settings } = save;
  return JSON.stringify({
    version: SAVE_VERSION,
    coins: game.coins,
    level: game.level,
    history: game.history.map((r) => ({
      outcome: r.outcome,
      cardsFlipped: r.cardsFlipped,
      level: r.level,
    })),
    settings: { sound: settings.sound, reducedMotion: settings.reducedMotion },
    stats: {
      bestPayout: game.stats.bestPayout,
      maxLevel: game.stats.maxLevel,
      played: game.stats.played,
      won: game.stats.won,
      lost: game.stats.lost,
      quit: game.stats.quit,
      level8Reached: game.stats.level8Reached,
    },
    album: [...game.album],
    welcomeSeen: save.welcomeSeen,
    packCode: save.packCode,
  });
}

function readCoins(raw: Raw): number | null {
  return isIntIn(raw.coins, 0, COIN_CAP) ? raw.coins : null;
}

function readHistory(x: unknown): readonly RoundRecord[] | null {
  if (!Array.isArray(x) || x.length > HISTORY_MAX) return null;
  const out: RoundRecord[] = [];
  for (const e of x as unknown[]) {
    if (
      !isObject(e) ||
      typeof e.outcome !== 'string' ||
      !OUTCOMES.includes(e.outcome) ||
      !isIntIn(e.cardsFlipped, 0, 25) ||
      !isIntIn(e.level, 1, 8)
    ) {
      return null;
    }
    out.push({
      outcome: e.outcome as Outcome,
      cardsFlipped: e.cardsFlipped,
      level: e.level as Level,
    });
  }
  return out;
}

function readStats(x: unknown): Stats | null {
  if (!isObject(x)) return null;
  const counters = ['bestPayout', 'played', 'won', 'lost', 'quit', 'level8Reached'] as const;
  for (const k of counters) {
    if (!isIntIn(x[k], 0, Number.MAX_SAFE_INTEGER)) return null;
  }
  if (!isIntIn(x.maxLevel, 1, 8)) return null;
  return {
    bestPayout: x.bestPayout as number,
    maxLevel: x.maxLevel as Level,
    played: x.played as number,
    won: x.won as number,
    lost: x.lost as number,
    quit: x.quit as number,
    level8Reached: x.level8Reached as number,
  };
}

function readAlbum(x: unknown): readonly string[] | null {
  if (!Array.isArray(x)) return null;
  const ids: string[] = [];
  for (const e of x as unknown[]) {
    if (typeof e !== 'string' || e === '' || ids.includes(e)) return null;
    ids.push(e);
  }
  return ids;
}

/**
 * Point d'entrée des migrations futures : amène un objet brut de `version` donnée
 * au format courant. Seule `SAVE_VERSION` est gérée ; sinon `null` (repli, CL-22).
 */
function migrate(raw: Raw, version: unknown): Raw | null {
  return version === SAVE_VERSION ? raw : null;
}

/** R-102, CL-22 : lecture tolérante, ne lève jamais d'exception. */
export function deserialize(text: string | null): {
  readonly save: SaveData;
  readonly status: LoadStatus;
} {
  if (text === null) return { save: initialSave(), status: 'new' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { save: initialSave(), status: 'recovered' };
  }
  if (!isObject(parsed)) return { save: initialSave(), status: 'recovered' };

  const raw = migrate(parsed, parsed.version);
  if (raw === null) {
    // CL-22 : version inconnue → partie neuve, mais on garde les jetons s'ils sont lisibles.
    const coins = readCoins(parsed) ?? 0;
    const base = initialSave();
    return {
      save: freezeSave({ ...base, game: { ...base.game, coins } }),
      status: 'recovered',
    };
  }

  const base = initialSave();
  let ok = true;
  const pick = <T>(value: T | null, fallback: T): T => {
    if (value === null) {
      ok = false;
      return fallback;
    }
    return value;
  };

  const coins = pick(readCoins(raw), 0);
  const level = pick(isIntIn(raw.level, 1, 8) ? (raw.level as Level) : null, 1 as Level);
  const history = pick(readHistory(raw.history), [] as readonly RoundRecord[]);
  const stats = pick(readStats(raw.stats), base.game.stats);
  const album = pick(readAlbum(raw.album), [] as readonly string[]);
  const st = isObject(raw.settings) ? raw.settings : {};
  if (!isObject(raw.settings)) ok = false;
  const sound = pick(typeof st.sound === 'boolean' ? st.sound : null, true);
  let reducedMotion: boolean | null = null;
  if (typeof st.reducedMotion === 'boolean' || st.reducedMotion === null) {
    reducedMotion = st.reducedMotion;
  } else {
    ok = false;
  }
  const welcomeSeen = pick(typeof raw.welcomeSeen === 'boolean' ? raw.welcomeSeen : null, false);
  // packCode : `null` est valide ; une chaîne vide ou un autre type est remplacé par `null`.
  let packCode: string | null = null;
  if (typeof raw.packCode === 'string' && raw.packCode !== '') packCode = raw.packCode;
  else if (raw.packCode !== null) ok = false;

  const game: GameState = { coins, level, history, stats, album };
  const settings: Settings = { sound, reducedMotion };
  return {
    save: freezeSave({ game, settings, welcomeSeen, packCode }),
    status: ok ? 'ok' : 'recovered',
  };
}

/** ADR-017 : efface la progression, garde code, réglages et bienvenue. */
export function resetProgressInSave(save: SaveData): SaveData {
  return freezeSave({ ...save, game: resetProgress(save.game) });
}
