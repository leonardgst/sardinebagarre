import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createPackStore, mergeMessages } from '../../src/ui/pack-store';
import { messages } from '../../src/ui/texts.fr';

const FIXTURE = join(import.meta.dirname, '..', 'fixtures', 'pack-test.bin');
const CODE = 'test-test-test-test';
const TIMEOUT = 60_000;

const octets = () => new Uint8Array(readFileSync(FIXTURE));

function creerMagasin(reponse: () => Response | Promise<Response>) {
  let n = 0;
  const revoked: string[] = [];
  const fetchPack = vi.fn(async () => reponse());
  const store = createPackStore({
    fetchPack,
    createUrl: () => `blob:test/${++n}`,
    revokeUrl: (url) => revoked.push(url),
  });
  return { store, fetchPack, revoked };
}

const fixtureOk = () => new Response(octets());

describe('pack-store.ts', () => {
  it(
    'R-124 pack-store : bon code → ok, tête et 3 photos en blob:',
    async () => {
      const { store } = creerMagasin(fixtureOk);
      expect(await store.load(CODE)).toBe('ok');
      const contenu = store.content();
      expect(contenu?.headUrl.startsWith('blob:')).toBe(true);
      expect(contenu?.photos).toHaveLength(3);
      expect(contenu?.photos.every((p) => p.url.startsWith('blob:'))).toBe(true);
      expect(contenu?.welcome).not.toBe('');
      expect(store.decryptMs()).not.toBeNull();
    },
    TIMEOUT,
  );

  it(
    'R-124 pack-store : code saisi avec majuscules et espaces → ok',
    async () => {
      const { store } = creerMagasin(fixtureOk);
      expect(await store.load('  Test Test Test Test ')).toBe('ok');
    },
    TIMEOUT,
  );

  it(
    'R-124 pack-store : mauvais code → wrong, contenu inchangé',
    async () => {
      const { store, revoked } = creerMagasin(fixtureOk);
      expect(await store.load('faux-faux-faux-faux')).toBe('wrong');
      expect(store.content()).toBeNull();
      expect(await store.load(CODE)).toBe('ok');
      const avant = store.content();
      expect(await store.load('faux-faux-faux-faux')).toBe('wrong');
      expect(store.content()).toBe(avant);
      expect(revoked).toEqual([]);
    },
    TIMEOUT,
  );

  it('R-124 pack-store : code vide → empty sans déchiffrer', async () => {
    const { store, fetchPack } = creerMagasin(fixtureOk);
    expect(await store.load('  - ')).toBe('empty');
    expect(fetchPack).not.toHaveBeenCalled();
  });

  it('R-126 pack-store : 404 → unavailable', async () => {
    const { store } = creerMagasin(() => new Response('nope', { status: 404 }));
    expect(await store.load(CODE)).toBe('unavailable');
    expect(store.content()).toBeNull();
  });

  it('R-126 pack-store : corps HTML (en-tête invalide) → unavailable', async () => {
    const { store } = creerMagasin(() => new Response('<!doctype html><html></html>'));
    expect(await store.load(CODE)).toBe('unavailable');
  });

  it('R-126 pack-store : fetch en échec → unavailable', async () => {
    const { store } = creerMagasin(() => Promise.reject(new TypeError('réseau')));
    expect(await store.load(CODE)).toBe('unavailable');
  });

  it(
    'R-124 pack-store : un nouveau pack révoque les anciennes URL',
    async () => {
      const { store, revoked } = creerMagasin(fixtureOk);
      await store.load(CODE);
      const anciennes = store.content();
      await store.load(CODE);
      expect(revoked).toContain(anciennes?.headUrl);
      expect(revoked).toHaveLength(1 + (anciennes?.photos.length ?? 0) + 0);
    },
    TIMEOUT,
  );

  it(
    'UI-60 messages Sardine du pack ajoutés à la liste publique',
    async () => {
      const { store } = creerMagasin(fixtureOk);
      expect(store.sardineMessages(messages.sardine)).toEqual(messages.sardine);
      await store.load(CODE);
      const prives = store.content()?.messages.sardine ?? [];
      expect(store.sardineMessages(messages.sardine)).toEqual([...messages.sardine, ...prives]);
    },
    TIMEOUT,
  );

  it(
    'R-T8 pack-store : la durée ne compte que le déchiffrement, pas le téléchargement',
    async () => {
      let horloge = 0;
      const store = createPackStore({
        fetchPack: async () => {
          horloge += 100_000; // téléchargement très lent
          return fixtureOk();
        },
        createUrl: () => 'blob:x',
        revokeUrl: () => {},
        now: () => horloge,
      });
      expect(await store.load(CODE)).toBe('ok');
      expect(store.decryptMs()).toBe(0);
    },
    TIMEOUT,
  );

  it('UI-60 mergeMessages : listes concaténées, extra absent toléré', () => {
    expect(mergeMessages(['a'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(mergeMessages(['a'], undefined)).toEqual(['a']);
  });
});
