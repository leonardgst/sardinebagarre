// Fabrication du pack chiffré (R-120..R-124), partagée par pack.mjs et pack-de-test.mjs.
// Ne lit jamais prive/ de sa propre initiative : le dossier source est toujours passé en argument.
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

export const ENTETE_EXTERNE = 'SBPACK1';
export const ENTETE_CLAIR = 'SBDATA1';
export const TAILLE_SEL = 16;
export const TAILLE_IV = 12;
export const ITERATIONS = 600_000;
export const PRIX_PAR_DEFAUT = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000, 5000, 7500, 10000];
export const LARGEUR_PHOTO_MAX = 1280;
export const COTE_TETE = 512;
export const QUALITE_JPEG = 80;

const encodeur = new TextEncoder();

/** R-122 : NFD sans diacritiques, minuscules, séparateurs → un seul « - », sans « - » en bordure. */
export function normalizeCode(code) {
  return code
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[\s\-_.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** R-123 : refuse un code de moins de 4 mots ou de moins de 16 caractères (après normalisation). */
export function verifierCode(code) {
  const n = normalizeCode(code);
  const mots = n === '' ? 0 : n.split('-').length;
  if (mots < 4 || n.length < 16) {
    throw new Error(
      'Code trop faible : il faut au moins 4 mots et 16 caractères (par exemple quatre mots tirés au hasard, séparés par des tirets).',
    );
  }
  return n;
}

async function deriveKey(code, sel) {
  const matiere = await crypto.subtle.importKey(
    'raw',
    encodeur.encode(normalizeCode(code)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sel, iterations: ITERATIONS },
    matiere,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
}

/** R-122 : SBPACK1 + sel (16) + IV (12) + chiffré AES-GCM (étiquette comprise). */
export async function encryptPlain(plain, code, options = {}) {
  const sel = options.salt ?? crypto.getRandomValues(new Uint8Array(TAILLE_SEL));
  const iv = options.iv ?? crypto.getRandomValues(new Uint8Array(TAILLE_IV));
  const cle = await deriveKey(code, sel);
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, plain));
  const entete = encodeur.encode(ENTETE_EXTERNE);
  const sortie = new Uint8Array(entete.length + sel.length + iv.length + chiffre.length);
  sortie.set(entete, 0);
  sortie.set(sel, entete.length);
  sortie.set(iv, entete.length + sel.length);
  sortie.set(chiffre, entete.length + sel.length + iv.length);
  return sortie;
}

/**
 * Assemble le clair : SBDATA1 + longueur JSON (uint32 LE) + JSON UTF-8 + binaires bout à bout.
 * @param {{welcome: string, head: {bytes: Uint8Array, type: string},
 *   photos: {id: string, caption: string, price: number, bytes: Uint8Array, type: string}[],
 *   messages: Record<string, string[]>, bark?: {bytes: Uint8Array, type: string}}} contenu
 */
export function encodePlain(contenu) {
  const morceaux = [];
  let decalage = 0;
  const ajouter = ({ bytes, type }) => {
    const asset = { offset: decalage, length: bytes.length, type };
    morceaux.push(bytes);
    decalage += bytes.length;
    return asset;
  };
  const index = {
    version: 1,
    welcome: contenu.welcome,
    head: ajouter(contenu.head),
    photos: contenu.photos.map((p) => ({
      id: p.id,
      caption: p.caption,
      price: p.price,
      asset: ajouter(p),
    })),
    messages: contenu.messages,
  };
  if (contenu.bark) index.bark = ajouter(contenu.bark);
  const json = encodeur.encode(JSON.stringify(index));
  const entete = encodeur.encode(ENTETE_CLAIR);
  const sortie = new Uint8Array(entete.length + 4 + json.length + decalage);
  sortie.set(entete, 0);
  new DataView(sortie.buffer).setUint32(entete.length, json.length, true);
  sortie.set(json, entete.length + 4);
  let pos = entete.length + 4 + json.length;
  for (const m of morceaux) {
    sortie.set(m, pos);
    pos += m.length;
  }
  return sortie;
}

const CLES_MESSAGES = {
  sardine: 'sardine',
  victoire: 'won',
  suspense: 'suspense',
  montee: 'levelUp',
  descente: 'levelDown',
};

const TYPES_SON = { '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };

async function chargerSharp() {
  const module = await import('sharp');
  return module.default;
}

/** R-121 : 1 280 px de large ou de haut au plus, JPEG qualité 80. */
export async function reduirePhoto(octets) {
  const sharp = await chargerSharp();
  return new Uint8Array(
    await sharp(octets)
      .rotate()
      .resize({
        width: LARGEUR_PHOTO_MAX,
        height: LARGEUR_PHOTO_MAX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: QUALITE_JPEG })
      .toBuffer(),
  );
}

/** R-120 : carré JPEG de 512 px centré sur (x, y), côté = min(l, h) / zoom, ramené dans l'image. */
export async function recadrerTete(octets, cadrage = {}) {
  const sharp = await chargerSharp();
  const x = cadrage.x ?? 0.5;
  const y = cadrage.y ?? 0.5;
  const zoom = Math.max(1, cadrage.zoom ?? 1);
  const droite = await sharp(octets).rotate().toBuffer();
  const { width: l, height: h } = await sharp(droite).metadata();
  const cote = Math.max(1, Math.min(l, h, Math.round(Math.min(l, h) / zoom)));
  const gauche = Math.round(Math.min(Math.max(x * l - cote / 2, 0), l - cote));
  const haut = Math.round(Math.min(Math.max(y * h - cote / 2, 0), h - cote));
  return new Uint8Array(
    await sharp(droite)
      .extract({ left: gauche, top: haut, width: cote, height: cote })
      .resize(COTE_TETE, COTE_TETE)
      .jpeg({ quality: QUALITE_JPEG })
      .toBuffer(),
  );
}

/**
 * Lit un dossier source (format `pack.json` en français) et produit le clair.
 * @param {string} dossier chemin du dossier source (jamais prive/ en test)
 */
export async function lireSource(dossier) {
  const config = JSON.parse(await readFile(join(dossier, 'pack.json'), 'utf8'));
  const tete = config.tete ?? {};
  const head = {
    bytes: await recadrerTete(
      await readFile(join(dossier, tete.fichier ?? 'sardine-tete.jpg')),
      tete.cadrage,
    ),
    type: 'image/jpeg',
  };
  const photos = [];
  const liste = config.photos ?? [];
  for (const [i, p] of liste.entries()) {
    photos.push({
      id: `p${String(i + 1).padStart(2, '0')}`,
      caption: p.legende ?? '',
      price: p.prix ?? PRIX_PAR_DEFAUT[i] ?? PRIX_PAR_DEFAUT[PRIX_PAR_DEFAUT.length - 1],
      bytes: await reduirePhoto(await readFile(join(dossier, p.fichier))),
      type: 'image/jpeg',
    });
  }
  const messages = {};
  for (const [cleFr, cleEn] of Object.entries(CLES_MESSAGES)) {
    const liste = config.messages?.[cleFr];
    if (Array.isArray(liste) && liste.length > 0) messages[cleEn] = liste;
  }
  const contenu = { welcome: config.bienvenue ?? '', head, photos, messages };
  if (config.aboiement) {
    contenu.bark = {
      bytes: new Uint8Array(await readFile(join(dossier, config.aboiement))),
      type: TYPES_SON[extname(config.aboiement).toLowerCase()] ?? 'application/octet-stream',
    };
  }
  return encodePlain(contenu);
}
