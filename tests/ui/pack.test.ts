import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  encodePlain,
  encryptPlain,
  normalizeCode as normalizeNode,
} from '../../scripts/pack-lib.mjs';
import {
  assetBytes,
  BadPackError,
  decodePack,
  decryptPack,
  normalizeCode,
  WrongCodeError,
} from '../../src/ui/pack';

const FIXTURE = join(import.meta.dirname, '..', 'fixtures', 'pack-test.bin');
const CODE = 'test-test-test-test';
const TIMEOUT = 60_000;

const petitContenu = () => ({
  welcome: 'Bonjour',
  head: { bytes: new Uint8Array([1, 2, 3]), type: 'image/jpeg' },
  photos: [
    { id: 'p01', caption: 'a', price: 100, bytes: new Uint8Array([4, 5]), type: 'image/jpeg' },
    {
      id: 'p02',
      caption: 'b',
      price: 200,
      bytes: new Uint8Array([6, 7, 8, 9]),
      type: 'image/jpeg',
    },
  ],
  messages: { won: ['Bravo'] },
});

describe('pack.ts', () => {
  it('R-122 normalisation du code', () => {
    expect(normalizeCode('  Croquette Tempête-violon  sardine ')).toBe(
      'croquette-tempete-violon-sardine',
    );
    expect(normalizeCode('TEST_test.test test')).toBe('test-test-test-test');
  });

  it('R-122 la normalisation du script et celle du jeu sont identiques', () => {
    for (const s of ['  Été--Ça_va. bien ', 'A  B', '---x---', 'ÀÉÎÕÜ ñ']) {
      expect(normalizeNode(s)).toBe(normalizeCode(s));
    }
  });

  it(
    'R-122 aller-retour chiffrement Node → déchiffrement pack.ts',
    async () => {
      const contenu = petitContenu();
      const fichier = await encryptPlain(encodePlain(contenu), CODE);
      const pack = decodePack(await decryptPack(fichier, 'Test Test Test Test'));
      expect(pack.index.welcome).toBe('Bonjour');
      expect(pack.index.messages.won).toEqual(['Bravo']);
      expect(pack.index.photos.map((p) => p.price)).toEqual([100, 200]);
      expect([...assetBytes(pack, pack.index.head)]).toEqual([1, 2, 3]);
      const [p1, p2] = pack.index.photos;
      expect([...assetBytes(pack, p1!.asset)]).toEqual([4, 5]);
      expect([...assetBytes(pack, p2!.asset)]).toEqual([6, 7, 8, 9]);
    },
    TIMEOUT,
  );

  it(
    'R-122 deux chiffrements du même contenu diffèrent',
    async () => {
      const clair = encodePlain(petitContenu());
      const a = await encryptPlain(clair, CODE);
      const b = await encryptPlain(clair, CODE);
      expect(a.slice(7, 23)).not.toEqual(b.slice(7, 23)); // sel
      expect(a.slice(23, 35)).not.toEqual(b.slice(23, 35)); // IV
    },
    TIMEOUT,
  );

  it('R-122 en-tête invalide refusé', async () => {
    await expect(decryptPack(new Uint8Array(100), CODE)).rejects.toBeInstanceOf(BadPackError);
  });

  it('R-122 fichier tronqué refusé', async () => {
    const tronque = new TextEncoder().encode('SBPACK1abc');
    await expect(decryptPack(tronque, CODE)).rejects.toBeInstanceOf(BadPackError);
  });

  it(
    'R-124 mauvais code refusé',
    async () => {
      const octets = new Uint8Array(readFileSync(FIXTURE));
      await expect(decryptPack(octets, 'test-test-test-tesx')).rejects.toBeInstanceOf(
        WrongCodeError,
      );
    },
    TIMEOUT,
  );

  it(
    'R-124 code de test accepté, avec variantes de saisie',
    async () => {
      const octets = new Uint8Array(readFileSync(FIXTURE));
      const pack = decodePack(await decryptPack(octets, 'Test Test Test Test'));
      expect(pack.index.photos).toHaveLength(3);
      expect(pack.index.head.type).toBe('image/jpeg');
      expect(pack.index.bark).toBeUndefined();
      for (const liste of ['sardine', 'won', 'suspense', 'levelUp', 'levelDown'] as const) {
        expect(pack.index.messages[liste]?.length).toBeGreaterThan(0);
      }
    },
    TIMEOUT,
  );

  it('R-127 fixture de test bien formée', () => {
    const octets = readFileSync(FIXTURE);
    expect(octets.subarray(0, 7).toString('latin1')).toBe('SBPACK1');
  });
});
