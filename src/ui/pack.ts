// Lecture du pack chiffré (R-122, R-124). Seul fichier de src/ à utiliser crypto.subtle.
// Renvoie des Uint8Array et des types : aucune URL blob: ni DOM (voir T-017).

export interface Asset {
  readonly offset: number;
  readonly length: number;
  readonly type: string;
}

export type MessageKind = 'sardine' | 'won' | 'suspense' | 'levelUp' | 'levelDown';

export interface PackPhoto {
  readonly id: string;
  readonly caption: string;
  readonly price: number;
  readonly asset: Asset;
}

export interface PackIndex {
  readonly version: 1;
  readonly welcome: string;
  readonly head: Asset;
  readonly photos: readonly PackPhoto[];
  readonly messages: Partial<Record<MessageKind, readonly string[]>>;
  readonly bark?: Asset;
}

export interface DecodedPack {
  readonly index: PackIndex;
  /** Zone binaire : les `offset` des assets sont comptés depuis son début. */
  readonly binary: Uint8Array;
}

export class WrongCodeError extends Error {
  constructor() {
    super('Mauvais code');
    this.name = 'WrongCodeError';
  }
}

export class BadPackError extends Error {
  constructor(detail: string) {
    super(`Pack invalide : ${detail}`);
    this.name = 'BadPackError';
  }
}

const ENTETE_EXTERNE = 'SBPACK1';
const ENTETE_CLAIR = 'SBDATA1';
const TAILLE_SEL = 16;
const TAILLE_IV = 12;
const TAILLE_ETIQUETTE = 16;
const ITERATIONS = 600_000;
const DEBUT_CHIFFRE = ENTETE_EXTERNE.length + TAILLE_SEL + TAILLE_IV;

/** R-122 : NFD sans diacritiques, minuscules, séparateurs → un seul « - », sans « - » en bordure. */
export function normalizeCode(code: string): string {
  return code
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[\s\-_.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function commencePar(octets: Uint8Array, texte: string): boolean {
  const attendu = new TextEncoder().encode(texte);
  return octets.length >= attendu.length && attendu.every((o, i) => octets[i] === o);
}

/** Déchiffre le pack ; lève WrongCodeError (code faux) ou BadPackError (format invalide). */
export async function decryptPack(bytes: Uint8Array, code: string): Promise<Uint8Array> {
  if (!commencePar(bytes, ENTETE_EXTERNE)) throw new BadPackError('en-tête SBPACK1 absent');
  if (bytes.length < DEBUT_CHIFFRE + TAILLE_ETIQUETTE) throw new BadPackError('fichier tronqué');
  const sel = new Uint8Array(
    bytes.subarray(ENTETE_EXTERNE.length, ENTETE_EXTERNE.length + TAILLE_SEL),
  );
  const iv = new Uint8Array(bytes.subarray(ENTETE_EXTERNE.length + TAILLE_SEL, DEBUT_CHIFFRE));
  const chiffre = new Uint8Array(bytes.subarray(DEBUT_CHIFFRE));
  const matiere = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(normalizeCode(code)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const cle = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sel, iterations: ITERATIONS },
    matiere,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  try {
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cle, chiffre));
  } catch {
    throw new WrongCodeError();
  }
}

function assetValide(a: unknown, tailleBinaire: number): a is Asset {
  if (typeof a !== 'object' || a === null) return false;
  const { offset, length, type } = a as Record<string, unknown>;
  return (
    typeof offset === 'number' &&
    typeof length === 'number' &&
    typeof type === 'string' &&
    Number.isInteger(offset) &&
    Number.isInteger(length) &&
    offset >= 0 &&
    length >= 0 &&
    offset + length <= tailleBinaire
  );
}

/** Décode le clair : SBDATA1 + longueur JSON (uint32 LE) + JSON + binaires. */
export function decodePack(plain: Uint8Array): DecodedPack {
  if (!commencePar(plain, ENTETE_CLAIR)) throw new BadPackError('en-tête SBDATA1 absent');
  const debutLongueur = ENTETE_CLAIR.length;
  if (plain.length < debutLongueur + 4) throw new BadPackError('contenu tronqué');
  const longueur = new DataView(plain.buffer, plain.byteOffset, plain.byteLength).getUint32(
    debutLongueur,
    true,
  );
  const debutJson = debutLongueur + 4;
  if (debutJson + longueur > plain.length) throw new BadPackError('index tronqué');
  let index: PackIndex;
  try {
    index = JSON.parse(new TextDecoder().decode(plain.subarray(debutJson, debutJson + longueur)));
  } catch {
    throw new BadPackError('index illisible');
  }
  const binary = plain.subarray(debutJson + longueur);
  const assets = [index?.head, ...(index?.photos ?? []).map((p) => p?.asset)];
  if (index?.bark) assets.push(index.bark);
  if (
    index?.version !== 1 ||
    !Array.isArray(index.photos) ||
    !assets.every((a) => assetValide(a, binary.length))
  ) {
    throw new BadPackError('index incohérent');
  }
  return { index, binary };
}

/** Octets d'un asset (vue sur la zone binaire, sans copie). */
export function assetBytes(pack: DecodedPack, asset: Asset): Uint8Array {
  return pack.binary.subarray(asset.offset, asset.offset + asset.length);
}
