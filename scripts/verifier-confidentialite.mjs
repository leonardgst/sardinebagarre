// Contrôle de confidentialité (R-127) : aucune image/son/vidéo hors des dossiers autorisés,
// aucun fichier de prive/, pack chiffré bien formé. Ne lit jamais prive/.
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EXTENSIONS_BLOQUEES = new Set([
  ...[
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'avif',
    'heic',
    'heif',
    'bmp',
    'tif',
    'tiff',
    'ico',
    'dng',
  ],
  ...['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac', 'caf'],
  ...['mov', 'mp4', 'm4v', 'webm'],
]);
const RACINE = fileURLToPath(new URL('..', import.meta.url));
const DOSSIERS_AUTORISES = ['public/icons/', 'src/ui/art/'];
const CHEMIN_PACK = 'public/pack/pack.bin';
const ENTETE_PACK = 'SBPACK1';

function extension(chemin) {
  const nom = chemin.slice(chemin.lastIndexOf('/') + 1);
  const i = nom.lastIndexOf('.');
  return i < 0 ? '' : nom.slice(i + 1).toLowerCase();
}

/**
 * @param {string[]} paths chemins Git (séparateur /)
 * @param {Uint8Array | null} packHeader premiers octets de public/pack/pack.bin, ou null s'il n'existe pas
 * @param {(path: string) => string} readText lecture d'un .svg (jamais appelée pour prive/)
 * @returns {string[]} messages de violation
 */
export function findViolations(paths, packHeader, readText) {
  const violations = [];
  for (const chemin of paths) {
    if (chemin.startsWith('prive/')) {
      violations.push(`${chemin} : fichier de prive/ suivi par Git — interdit (dépôt public)`);
      continue;
    }
    const ext = extension(chemin);
    if (ext === 'svgz') {
      violations.push(
        `${chemin} : SVG compressé (.svgz) — interdit, contenu non vérifiable (une photo pourrait s'y cacher)`,
      );
      continue;
    }
    if (ext === 'svg') {
      const texte = readText(chemin).toLowerCase();
      if (texte.includes('data:image/') || texte.includes('<image')) {
        violations.push(
          `${chemin} : SVG contenant une image intégrée (data:image/ ou <image) — interdit, une photo pourrait s'y cacher`,
        );
      }
      continue;
    }
    if (EXTENSIONS_BLOQUEES.has(ext) && !DOSSIERS_AUTORISES.some((d) => chemin.startsWith(d))) {
      violations.push(
        `${chemin} : image, son ou vidéo hors de public/icons/ et src/ui/art/ — interdit`,
      );
    }
  }
  if (packHeader !== null) {
    const attendu = new TextEncoder().encode(ENTETE_PACK);
    const ok = packHeader.length >= attendu.length && attendu.every((o, i) => packHeader[i] === o);
    if (!ok) {
      violations.push(`${CHEMIN_PACK} : l'en-tête ne commence pas par ${ENTETE_PACK}`);
    }
  }
  return violations;
}

function lireEntetePack() {
  const complet = join(RACINE, CHEMIN_PACK);
  if (!existsSync(complet)) return null;
  const fd = openSync(complet, 'r');
  try {
    const tampon = new Uint8Array(ENTETE_PACK.length);
    const lus = readSync(fd, tampon, 0, tampon.length, 0);
    return tampon.slice(0, lus);
  } finally {
    closeSync(fd);
  }
}

function main() {
  let paths;
  try {
    const sortie = execFileSync(
      'git',
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    paths = [...new Set(sortie.split('\0').filter((p) => p !== ''))];
  } catch (erreur) {
    console.error(`Contrôle de confidentialité : échec de git (${erreur.message})`);
    process.exit(1);
  }
  // Un fichier listé mais supprimé du disque n'est pas lisible : on l'ignore.
  const readText = (p) => {
    const complet = join(RACINE, p);
    return existsSync(complet) ? readFileSync(complet, 'utf8') : '';
  };
  const violations = findViolations(paths, lireEntetePack(), readText);
  if (violations.length > 0) {
    console.error('Contrôle de confidentialité : ÉCHEC');
    for (const v of violations) console.error(`- ${v}`);
    process.exit(1);
  }
  console.log('Contrôle de confidentialité : OK');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
