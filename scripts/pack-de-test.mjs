// `npm run pack:test` : produit tests/fixtures/pack-test.bin (code test-test-test-test).
// Images factices (aplats de couleur) générées dans un dossier temporaire ; rien de personnel.
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { encryptPlain, lireSource, verifierCode } from './pack-lib.mjs';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const CODE_TEST = 'test-test-test-test';

async function aplat(fichier, largeur, hauteur, couleur) {
  const octets = await sharp({
    create: { width: largeur, height: hauteur, channels: 3, background: couleur },
  })
    .jpeg()
    .toBuffer();
  await writeFile(fichier, octets);
}

verifierCode(CODE_TEST, { autoriserCodeDeTest: true });
const dossier = await mkdtemp(join(tmpdir(), 'sardine-pack-test-'));
try {
  await mkdir(join(dossier, 'photos'));
  await aplat(join(dossier, 'sardine-tete.jpg'), 800, 600, '#3b82c4');
  await aplat(join(dossier, 'photos', '01.jpg'), 640, 480, '#d9534f');
  await aplat(join(dossier, 'photos', '02.jpg'), 480, 640, '#5cb85c');
  await aplat(join(dossier, 'photos', '03.jpg'), 640, 640, '#f0ad4e');
  const config = {
    bienvenue: 'Bienvenue dans le pack de test.',
    tete: { fichier: 'sardine-tete.jpg', cadrage: { x: 0.5, y: 0.5, zoom: 1 } },
    photos: [
      { fichier: 'photos/01.jpg', legende: 'Photo de test rouge' },
      { fichier: 'photos/02.jpg', legende: 'Photo de test verte' },
      { fichier: 'photos/03.jpg', legende: 'Photo de test orange', prix: 250 },
    ],
    messages: {
      sardine: ['Message de test (sardine)'],
      victoire: ['Message de test (victoire)'],
      suspense: ['Message de test (suspense)'],
      montee: ['Message de test (montée)'],
      descente: ['Message de test (descente)'],
    },
  };
  await writeFile(join(dossier, 'pack.json'), JSON.stringify(config));
  const fichier = await encryptPlain(await lireSource(dossier), CODE_TEST);
  const sortie = join(RACINE, 'tests', 'fixtures', 'pack-test.bin');
  await mkdir(dirname(sortie), { recursive: true });
  await writeFile(sortie, fichier);
  console.log(`Fixture écrite : ${sortie} (${fichier.length} octets)`);
} finally {
  await rm(dossier, { recursive: true, force: true });
}
