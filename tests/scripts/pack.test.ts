import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assetBytes, decodePack, decryptPack } from '../../src/ui/pack';

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
      const photo = await sharp(assetBytes(pack, pack.index.photos[0]!.asset)).metadata();
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
  });
});
