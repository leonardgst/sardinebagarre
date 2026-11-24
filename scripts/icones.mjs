// Produit les icônes de l'application à partir de src/ui/art/chien.svg (dessin original).
// Utilisation : npm run icones (Playwright est déjà installé ; aucune dépendance nouvelle).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const sortie = join(racine, 'public', 'icons');
const symbole = readFileSync(join(racine, 'src', 'ui', 'art', 'chien.svg'), 'utf8');

// `part` : part de la largeur occupée par la tête (la zone sûre « maskable » fait 80 % au centre).
const icones = [
  { fichier: 'icon-192.png', taille: 192, part: 0.82 },
  { fichier: 'icon-512.png', taille: 512, part: 0.82 },
  { fichier: 'icon-maskable-512.png', taille: 512, part: 0.62 },
  { fichier: 'apple-touch-icon.png', taille: 180, part: 0.82 },
];

function page(part) {
  return `<!doctype html><html><head><style>
    :root { --chien-tete: #d9a066; --chien-oreille: #8a5a33; --chien-museau: #f6e3c6; }
    html, body { margin: 0; width: 100%; height: 100%; background: #6b2a2d; }
    body { display: grid; place-items: center; }
    .tete { width: ${part * 100}vmin; height: ${part * 100}vmin; }
  </style></head><body>${symbole}
  <svg class="tete" viewBox="0 0 100 100"><use href="#chien"/></svg></body></html>`;
}

mkdirSync(sortie, { recursive: true });
const navigateur = await webkit.launch();
try {
  for (const { fichier, taille, part } of icones) {
    const contexte = await navigateur.newContext({
      viewport: { width: taille, height: taille },
      deviceScaleFactor: 1,
    });
    const p = await contexte.newPage();
    await p.setContent(page(part));
    writeFileSync(join(sortie, fichier), await p.screenshot({ type: 'png' }));
    await contexte.close();
    console.log(`public/icons/${fichier} (${taille} px)`);
  }
} finally {
  await navigateur.close();
}
