// `npm run pack` : chiffre le dossier source (prive/ par défaut) en public/pack/pack.bin (R-121).
// À lancer par l'humain seul. Le code est lu dans PACK_CODE, sinon saisi en masqué (deux fois).
// N'affiche jamais le code.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encryptPlain, lireIndex, lireSource, verifierCode } from './pack-lib.mjs';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const SEUIL_AVERTISSEMENT = 8 * 1024 * 1024;

export function lireArguments(argv) {
  const options = {
    source: resolve(RACINE, 'prive'),
    sortie: resolve(RACINE, 'public', 'pack', 'pack.bin'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--source' && argv[i + 1]) options.source = resolve(argv[++i]);
    else if (argv[i] === '--sortie' && argv[i + 1]) options.sortie = resolve(argv[++i]);
    else throw new Error(`Argument inconnu : ${argv[i]}`);
  }
  return options;
}

/** Saisie masquée (sans écho) ; gère retour arrière et Ctrl+C. */
function saisirMasque(invite) {
  return new Promise((resolvePromise, rejectPromise) => {
    const entree = process.stdin;
    process.stdout.write(invite);
    entree.setRawMode(true);
    entree.resume();
    entree.setEncoding('utf8');
    let saisie = '';
    const fin = () => {
      entree.setRawMode(false);
      entree.pause();
      entree.removeListener('data', surDonnees);
      process.stdout.write('\n');
    };
    const surDonnees = (morceau) => {
      for (const c of morceau) {
        if (c === '\r' || c === '\n') {
          fin();
          resolvePromise(saisie);
          return;
        }
        if (c === '\u0003') {
          fin();
          rejectPromise(new Error('Annulé.'));
          return;
        }
        if (c === '\u007f' || c === '\b') saisie = saisie.slice(0, -1);
        else saisie += c;
      }
    };
    entree.on('data', surDonnees);
  });
}

async function obtenirCode() {
  if (process.env.PACK_CODE) return process.env.PACK_CODE;
  if (!process.stdin.isTTY) {
    throw new Error('Pas de terminal : définis la variable d’environnement PACK_CODE.');
  }
  const premier = await saisirMasque('Code secret (4 mots) : ');
  verifierCode(premier);
  const second = await saisirMasque('Confirme le code : ');
  if (second !== premier) throw new Error('Les deux saisies sont différentes.');
  return premier;
}

async function main() {
  const { source, sortie } = lireArguments(process.argv.slice(2));
  const code = await obtenirCode();
  verifierCode(code); // avant toute lecture du dossier source
  const debut = Date.now();
  const clair = await lireSource(source);
  const fichier = await encryptPlain(clair, code);
  await mkdir(dirname(sortie), { recursive: true });
  await writeFile(sortie, fichier);
  const nbPhotos = lireIndex(clair).photos.length;
  console.log(
    `Pack écrit : ${nbPhotos} photo(s), ${(fichier.length / 1024).toFixed(0)} Ko, ${((Date.now() - debut) / 1000).toFixed(1)} s.`,
  );
  if (fichier.length > SEUIL_AVERTISSEMENT) {
    console.warn(
      'Attention : plus de 8 Mo ; le service worker n’embarque que les fichiers de 10 Mo au plus.',
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((erreur) => {
    console.error(erreur.message);
    process.exit(1);
  });
}
