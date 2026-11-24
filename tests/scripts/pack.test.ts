import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { lireSource, recadrerTete } from '../../scripts/pack-lib.mjs';
import { type Asset, assetBytes, decodePack, decryptPack } from '../../src/ui/pack';

const RACINE = join(import.meta.dirname, '..', '..');
const SCRIPT = join(RACINE, 'scripts', 'pack.mjs');
const CODE = 'alpha-bravo-charlie-delta';
const TIMEOUT = 60_000;

let dossier: string;

async function image(fichier: string, largeur: number, hauteur: number): Promise<void> {
  const octets = await sharp({
    create: { width: largeur, height: hauteur, channels: 3, background: '#336699' },
  })
    .jpeg()
    .toBuffer();
  writeFileSync(fichier, octets);
}

function ecrireConfig(config: unknown): void {
  writeFileSync(join(dossier, 'pack.json'), JSON.stringify(config));
}

function lancer(sortie: string, code: string) {
  return spawnSync(process.execPath, [SCRIPT, '--source', dossier, '--sortie', sortie], {
    env: { ...process.env, PACK_CODE: code },
    encoding: 'utf8',
  });
}

beforeAll(async () => {
  dossier = mkdtempSync(join(tmpdir(), 'sardine-test-'));
  mkdirSync(join(dossier, 'photos'));
  await image(join(dossier, 'tete.jpg'), 800, 600);
  await image(join(dossier, 'photos', 'grande.jpg'), 3000, 2000);
  await image(join(dossier, 'photos', 'petite.jpg'), 320, 240);
});

afterAll(() => {
  rmSync(dossier, { recursive: true, force: true });
});

const base = {
  bienvenue: 'Salut',
  tete: { fichier: 'tete.jpg', cadrage: { x: 0.5, y: 0.5, zoom: 1 } },
  photos: [
    { fichier: 'photos/grande.jpg', legende: 'g' },
    { fichier: 'photos/petite.jpg', legende: 'p' },
  ],
};

describe('npm run pack', () => {
  it(
    'R-121 R-115 R-120 pack complet : prix par défaut, photos 1 280 px, tête 512 px',
    async () => {
      ecrireConfig(base);
      const sortie = join(dossier, 'sortie.bin');
      const r = lancer(sortie, CODE);
      expect(r.status).toBe(0);
      expect(r.stdout).not.toContain(CODE);
      const pack = decodePack(await decryptPack(new Uint8Array(readFileSync(sortie)), CODE));
      expect(pack.index.photos[1]?.price).toBe(200); // R-115
      const photo = await sharp(
        assetBytes(pack, (pack.index.photos[0] as { asset: Asset }).asset),
      ).metadata();
      expect(photo.format).toBe('jpeg');
      expect(photo.width).toBeLessThanOrEqual(1280); // R-121
      const tete = await sharp(assetBytes(pack, pack.index.head)).metadata();
      expect([tete.format, tete.width, tete.height]).toEqual(['jpeg', 512, 512]); // R-120
    },
    TIMEOUT,
  );

  it('R-123 code faible refusé par le script, aucun fichier écrit', () => {
    ecrireConfig(base);
    const sortie = join(dossier, 'faible.bin');
    const r = lancer(sortie, 'sardine');
    expect(r.status).not.toBe(0);
    expect(existsSync(sortie)).toBe(false);
    expect(r.stderr).not.toContain('sardine'.repeat(2));
  });

  it('R-123 codes publiés refusés par npm run pack (aucune option ne les autorise)', () => {
    ecrireConfig(base);
    for (const code of ['test-test-test-test', 'croquette-tempete-violon-sardine']) {
      const sortie = join(dossier, 'public.bin');
      const r = lancer(sortie, code);
      expect(r.status).not.toBe(0);
      expect(existsSync(sortie)).toBe(false);
      expect(r.stderr).not.toContain(code);
    }
  });

  it('R-122 le code ne figure ni dans stdout ni dans stderr', () => {
    ecrireConfig(base);
    const r = lancer(join(dossier, 'sortie2.bin'), CODE);
    expect(r.stdout + r.stderr).not.toContain(CODE);
  });
});

describe('lireSource', () => {
  const photo = { fichier: 'photos/petite.jpg', legende: 'p' };

  it.each([
    ['prix en texte', { ...base, photos: [{ ...photo, prix: '100' }] }, /photo 1.*prix/],
    ['prix négatif', { ...base, photos: [photo, { ...photo, prix: -1 }] }, /photo 2.*prix/],
    ['légende numérique', { ...base, photos: [{ ...photo, legende: 3 }] }, /photo 1.*legende/],
    [
      'fichier absent',
      { ...base, photos: [{ ...photo, fichier: 'nope.jpg' }] },
      /photo 1.*nope\.jpg/,
    ],
    [
      'cadrage non numérique',
      { ...base, tete: { ...base.tete, cadrage: { x: 'a' } } },
      /cadrage\.x/,
    ],
    ['bienvenue numérique', { ...base, bienvenue: 4 }, /bienvenue/],
    ['messages pas une liste', { ...base, messages: { victoire: 'a' } }, /messages\.victoire/],
    ['aboiement absent', { ...base, aboiement: 'rien.m4a' }, /aboiement/],
    [
      'E8 13e photo sans prix',
      { ...base, photos: Array.from({ length: 13 }, () => photo) },
      /photo 13.*obligatoire/,
    ],
  ])('R-120 %s → message français nommant le champ', async (_nom, config, attendu) => {
    ecrireConfig(config);
    await expect(lireSource(dossier)).rejects.toThrow(attendu);
  });

  it('R-120 JSON invalide → message clair', async () => {
    writeFileSync(join(dossier, 'pack.json'), '{ "bienvenue": ');
    await expect(lireSource(dossier)).rejects.toThrow(/pack\.json illisible/);
  });

  it(
    'R-115 la 13e photo avec prix explicite est acceptée',
    async () => {
      const photos = Array.from({ length: 13 }, (_, i) =>
        i === 12 ? { ...photo, prix: 12000 } : photo,
      );
      ecrireConfig({ ...base, photos });
      await expect(lireSource(dossier)).resolves.toBeInstanceOf(Uint8Array);
    },
    TIMEOUT,
  );

  it('R-120 tête cadrée dans un coin (x 1, y 1, zoom 2) : carré de 300 px en bas à droite', async () => {
    // image 800 × 600 : bleue, avec un rectangle rouge sur x ≥ 500 et y ≥ 300
    const rouge = await sharp({
      create: { width: 300, height: 300, channels: 3, background: '#ff0000' },
    })
      .png()
      .toBuffer();
    const octets = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#0000ff' },
    })
      .composite([{ input: rouge, left: 500, top: 300 }])
      .png()
      .toBuffer();
    const tete = await recadrerTete(octets, { x: 1, y: 1, zoom: 2 });
    const { data, info } = await sharp(tete).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([512, 512]);
    for (const [x, y] of [
      [10, 10],
      [500, 10],
      [10, 500],
      [500, 500],
    ] as const) {
      const i = (y * info.width + x) * info.channels;
      expect(data[i]).toBeGreaterThan(200); // rouge
      expect(data[i + 2]).toBeLessThan(60);
    }
  });
});
