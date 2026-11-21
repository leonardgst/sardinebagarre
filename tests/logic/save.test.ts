import { describe, expect, it } from 'vitest';
import { initialGame } from '../../src/logic/game';
import { mulberry32 } from '../../src/logic/rng';
import {
  deserialize,
  initialSave,
  resetProgressInSave,
  SAVE_VERSION,
  serialize,
} from '../../src/logic/save';
import type { SaveData } from '../../src/logic/types';

const SAVE_PLEINE: SaveData = {
  game: {
    coins: 1234,
    level: 5,
    history: [
      { outcome: 'WON', cardsFlipped: 6, level: 4 },
      { outcome: 'QUIT', cardsFlipped: 8, level: 5 },
    ],
    stats: {
      bestPayout: 432,
      maxLevel: 6,
      played: 12,
      won: 5,
      lost: 4,
      quit: 3,
      level8Reached: 0,
    },
    album: ['p1', 'p2'],
  },
  settings: { sound: false, reducedMotion: true },
  welcomeSeen: true,
  packCode: 'test-test-test-test',
};

const STATS_VALIDES = {
  bestPayout: 432,
  maxLevel: 6,
  played: 12,
  won: 5,
  lost: 4,
  quit: 3,
  level8Reached: 0,
};

/** Objet JSON plat valide, écrit à la main (sans `serialize`). */
function rawObject(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    coins: 1234,
    level: 5,
    history: [
      { outcome: 'WON', cardsFlipped: 6, level: 4 },
      { outcome: 'QUIT', cardsFlipped: 8, level: 5 },
    ],
    settings: { sound: false, reducedMotion: true },
    stats: { ...STATS_VALIDES },
    album: ['p1', 'p2'],
    welcomeSeen: true,
    packCode: 'test-test-test-test',
    ...overrides,
  };
}

function raw(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify(rawObject(overrides));
}

/** Sauvegarde initiale avec seulement les jetons de SAVE_PLEINE (CL-22). */
function seulementJetons(): SaveData {
  return { ...initialSave(), game: { ...initialGame(), coins: 1234 } };
}

function withGame(s: SaveData, patch: Partial<SaveData['game']>): SaveData {
  return { ...s, game: { ...s.game, ...patch } };
}

function historiqueDe(n: number): unknown[] {
  return Array.from({ length: n }, () => ({ outcome: 'WON', cardsFlipped: 1, level: 1 }));
}

describe('sauvegarde', () => {
  it('R-101 sauvegarde initiale', () => {
    const s = initialSave();
    expect(s.game).toEqual(initialGame());
    expect(s.settings).toEqual({ sound: true, reducedMotion: null });
    expect(s.welcomeSeen).toBe(false);
    expect(s.packCode).toBeNull();
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.game)).toBe(true);
    expect(Object.isFrozen(s.game.history)).toBe(true);
    expect(Object.isFrozen(s.game.stats)).toBe(true);
    expect(Object.isFrozen(s.game.album)).toBe(true);
    expect(Object.isFrozen(s.settings)).toBe(true);
  });

  it("R-101 serialize écrit exactement les clés prévues, dans l'ordre", () => {
    const parsed = JSON.parse(serialize(SAVE_PLEINE));
    expect(Object.keys(parsed)).toEqual([
      'version',
      'coins',
      'level',
      'history',
      'settings',
      'stats',
      'album',
      'welcomeSeen',
      'packCode',
    ]);
    expect(parsed.version).toBe(1);
    expect(SAVE_VERSION).toBe(1);
  });

  it("R-68 CL-18 la partie en cours n'est jamais sauvegardée", () => {
    const texte = serialize(SAVE_PLEINE);
    for (const mot of ['board', 'flipped', 'memos', 'payout']) {
      expect(texte).not.toContain(mot);
    }
  });

  it('R-102 aller-retour serialize → deserialize identique', () => {
    const r = deserialize(serialize(SAVE_PLEINE));
    expect(r.save).toEqual(SAVE_PLEINE);
    expect(r.status).toBe('ok');
  });

  it('R-102 aller-retour de la sauvegarde initiale', () => {
    const r = deserialize(serialize(initialSave()));
    expect(r.save).toEqual(initialSave());
    expect(r.status).toBe('ok');
  });

  it('R-102 la sauvegarde écrite à la main est relue telle quelle', () => {
    const r = deserialize(raw());
    expect(r.save).toEqual(SAVE_PLEINE);
    expect(r.status).toBe('ok');
  });

  it('R-61 rien de sauvegardé → nouvelle sauvegarde', () => {
    const r = deserialize(null);
    expect(r.save).toEqual(initialSave());
    expect(r.status).toBe('new');
  });

  it.each(['{pas du json', '', 'null', '42', '[]'])(
    'CL-22 JSON illisible → repli sans planter (%j)',
    (texte) => {
      const r = deserialize(texte);
      expect(r.save).toEqual(initialSave());
      expect(r.status).toBe('recovered');
    },
  );

  it('CL-22 version inconnue : on garde le total de jetons', () => {
    const r = deserialize(raw({ version: 99 }));
    expect(r.save.game.coins).toBe(1234);
    expect(r.save).toEqual(seulementJetons());
    expect(r.status).toBe('recovered');
  });

  it.each([undefined, '1', 1.5])(
    'CL-22 version absente ou invalide : on garde le total de jetons (%j)',
    (version) => {
      const r = deserialize(raw({ version }));
      expect(r.save).toEqual(seulementJetons());
      expect(r.status).toBe('recovered');
    },
  );

  it('CL-22 version inconnue et jetons illisibles → 0', () => {
    const r = deserialize(raw({ version: 99, coins: 'beaucoup' }));
    expect(r.save).toEqual(initialSave());
    expect(r.status).toBe('recovered');
  });

  const cas: ReadonlyArray<readonly [string, Record<string, unknown>, SaveData]> = [
    ['coins -1', { coins: -1 }, withGame(SAVE_PLEINE, { coins: 0 })],
    ['coins 50001', { coins: 50_001 }, withGame(SAVE_PLEINE, { coins: 0 })],
    ['coins 12.5', { coins: 12.5 }, withGame(SAVE_PLEINE, { coins: 0 })],
    ["coins '10'", { coins: '10' }, withGame(SAVE_PLEINE, { coins: 0 })],
    ['level 0', { level: 0 }, withGame(SAVE_PLEINE, { level: 1 })],
    ['level 9', { level: 9 }, withGame(SAVE_PLEINE, { level: 1 })],
    ["level '3'", { level: '3' }, withGame(SAVE_PLEINE, { level: 1 })],
    ['history 6 éléments', { history: historiqueDe(6) }, withGame(SAVE_PLEINE, { history: [] })],
    [
      "history outcome 'GAGNE'",
      { history: [{ outcome: 'GAGNE', cardsFlipped: 3, level: 1 }] },
      withGame(SAVE_PLEINE, { history: [] }),
    ],
    [
      'history cardsFlipped -1',
      { history: [{ outcome: 'WON', cardsFlipped: -1, level: 1 }] },
      withGame(SAVE_PLEINE, { history: [] }),
    ],
    [
      'stats played -1',
      { stats: { ...STATS_VALIDES, played: -1 } },
      withGame(SAVE_PLEINE, { stats: initialGame().stats }),
    ],
    [
      'stats maxLevel 0',
      { stats: { ...STATS_VALIDES, maxLevel: 0 } },
      withGame(SAVE_PLEINE, { stats: initialGame().stats }),
    ],
    ['stats absent', { stats: undefined }, withGame(SAVE_PLEINE, { stats: initialGame().stats })],
    ['album [1]', { album: [1] }, withGame(SAVE_PLEINE, { album: [] })],
    ["album ['']", { album: [''] }, withGame(SAVE_PLEINE, { album: [] })],
    ['album doublon', { album: ['p1', 'p1'] }, withGame(SAVE_PLEINE, { album: [] })],
    [
      "settings.sound 'oui'",
      { settings: { sound: 'oui', reducedMotion: true } },
      { ...SAVE_PLEINE, settings: { sound: true, reducedMotion: true } },
    ],
    [
      "settings.reducedMotion 'auto'",
      { settings: { sound: false, reducedMotion: 'auto' } },
      { ...SAVE_PLEINE, settings: { sound: false, reducedMotion: null } },
    ],
    ['welcomeSeen 1', { welcomeSeen: 1 }, { ...SAVE_PLEINE, welcomeSeen: false }],
    ["packCode ''", { packCode: '' }, { ...SAVE_PLEINE, packCode: null }],
    ['packCode 42', { packCode: 42 }, { ...SAVE_PLEINE, packCode: null }],
    [
      'settings absent',
      { settings: undefined },
      { ...SAVE_PLEINE, settings: { sound: true, reducedMotion: null } },
    ],
  ];

  it.each(cas)(
    'R-102 un champ invalide est remplacé, les autres sont gardés (%s)',
    (_nom, override, attendu) => {
      const r = deserialize(raw(override));
      expect(r.save).toEqual(attendu);
      expect(r.status).toBe('recovered');
    },
  );

  it('R-101 reducedMotion null est valide (non renseigné)', () => {
    const r = deserialize(raw({ settings: { sound: false, reducedMotion: null } }));
    expect(r.save.settings.reducedMotion).toBeNull();
    expect(r.status).toBe('ok');
  });

  it('R-102 les clés inconnues sont ignorées', () => {
    const r = deserialize(raw({ partieEnCours: { x: 1 } }));
    expect(r.save).toEqual(SAVE_PLEINE);
    expect(r.status).toBe('ok');
    expect(Object.keys(r.save)).not.toContain('partieEnCours');
  });

  it('R-102 limites valides acceptées', () => {
    for (const coins of [0, 50_000]) {
      const r = deserialize(raw({ coins }));
      expect(r.save.game.coins).toBe(coins);
      expect(r.status).toBe('ok');
    }
    for (const level of [1, 8]) {
      const r = deserialize(raw({ level }));
      expect(r.save.game.level).toBe(level);
      expect(r.status).toBe('ok');
    }
    const r = deserialize(raw({ history: [], album: [], packCode: null }));
    expect(r.save.game.history).toEqual([]);
    expect(r.save.game.album).toEqual([]);
    expect(r.save.packCode).toBeNull();
    expect(r.status).toBe('ok');
  });

  it("R-102 l'état relu est gelé en profondeur, historique compris", () => {
    const { save } = deserialize(raw());
    expect(Object.isFrozen(save)).toBe(true);
    expect(Object.isFrozen(save.game)).toBe(true);
    expect(Object.isFrozen(save.game.history)).toBe(true);
    expect(save.game.history.length).toBe(2);
    for (const r of save.game.history) expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(save.game.stats)).toBe(true);
    expect(Object.isFrozen(save.game.album)).toBe(true);
    expect(Object.isFrozen(save.settings)).toBe(true);
  });

  it('ADR-017 effacer la progression garde code, réglages et bienvenue', () => {
    const s = resetProgressInSave(SAVE_PLEINE);
    expect(s.game).toEqual(initialGame());
    expect(s.settings).toEqual(SAVE_PLEINE.settings);
    expect(s.welcomeSeen).toBe(SAVE_PLEINE.welcomeSeen);
    expect(s.packCode).toBe(SAVE_PLEINE.packCode);
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.game)).toBe(true);
    expect(Object.isFrozen(s.settings)).toBe(true);
  });

  it("R-102 deserialize ne lève jamais d'exception", () => {
    const rng = mulberry32(1);
    const cles = [
      'version',
      'coins',
      'level',
      'history',
      'settings',
      'stats',
      'album',
      'welcomeSeen',
      'packCode',
    ];
    const choix: ReadonlyArray<() => unknown> = [
      () => null,
      () => Math.floor(rng() * 100_000) - 100,
      () => rng() * 10,
      () => 'x'.repeat(Math.floor(rng() * 3)),
      () => rng() < 0.5,
      () => [],
      () => [{ outcome: 'WON', cardsFlipped: 3, level: 2 }, 5],
      () => ({ sound: rng() < 0.5, reducedMotion: 'oui' }),
      () => ({ played: -1 }),
      () => ['a', 'a'],
    ];
    const textes: string[] = [];
    for (let i = 0; i < 100; i++) {
      const o: Record<string, unknown> = {};
      for (const c of cles) {
        if (rng() >= 0.7) continue;
        o[c] = c === 'version' && rng() < 0.6 ? 1 : choix[Math.floor(rng() * choix.length)]?.();
      }
      textes.push(JSON.stringify(o));
    }
    const complet = serialize(SAVE_PLEINE);
    for (let i = 0; i < 100; i++) textes.push(complet.slice(0, Math.floor(rng() * complet.length)));
    for (const t of textes) {
      const r = deserialize(t);
      expect(['new', 'ok', 'recovered']).toContain(r.status);
      expect(Number.isInteger(r.save.game.coins)).toBe(true);
      expect(r.save.game.coins).toBeGreaterThanOrEqual(0);
      expect(r.save.game.coins).toBeLessThanOrEqual(50_000);
    }
  });
});
