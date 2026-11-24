// Contenu du pack en mémoire (R-124) : chargement, déchiffrement via pack.ts, URL blob:.
// Ne touche ni au DOM ni à crypto.subtle (voir pack.ts). Ne jamais journaliser le code.
import {
  assetBytes,
  type DecodedPack,
  decodePack,
  decryptPack,
  type MessageKind,
  normalizeCode,
  WrongCodeError,
} from './pack';

export type PackResult = 'ok' | 'wrong' | 'unavailable' | 'empty';

export interface PackPhotoContent {
  readonly id: string;
  readonly caption: string;
  readonly price: number;
  readonly url: string;
}

export interface PackContent {
  readonly welcome: string;
  readonly headUrl: string;
  readonly photos: readonly PackPhotoContent[];
  readonly barkUrl?: string;
  readonly messages: Partial<Record<MessageKind, readonly string[]>>;
}

export interface PackStoreDeps {
  /** Récupère `pack.bin` (injectable pour les tests). */
  readonly fetchPack?: () => Promise<Response>;
  readonly createUrl?: (blob: Blob) => string;
  readonly revokeUrl?: (url: string) => void;
  readonly now?: () => number;
}

export interface PackStore {
  /** Charge et déchiffre le pack avec ce code ; en cas d'échec, le contenu précédent reste en place. */
  load(code: string): Promise<PackResult>;
  content(): PackContent | null;
  /** Durée du dernier déchiffrement réussi (ms), pour la mesure R-T8. */
  decryptMs(): number | null;
  /** UI-60 : liste publique + messages « Sardine » du pack. */
  sardineMessages(base: readonly string[]): readonly string[];
}

/** UI-60 : ajoute les messages privés à une liste publique. */
export function mergeMessages(
  base: readonly string[],
  extra: readonly string[] | undefined,
): readonly string[] {
  return extra ? [...base, ...extra] : base;
}

const defaultFetch = (): Promise<Response> => fetch(`${import.meta.env.BASE_URL}pack/pack.bin`);

function urlsOf(content: PackContent): string[] {
  return [
    content.headUrl,
    ...content.photos.map((p) => p.url),
    ...(content.barkUrl ? [content.barkUrl] : []),
  ];
}

export function createPackStore(deps: PackStoreDeps = {}): PackStore {
  const fetchPack = deps.fetchPack ?? defaultFetch;
  const createUrl = deps.createUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
  const revokeUrl = deps.revokeUrl ?? ((url: string) => URL.revokeObjectURL(url));
  const now = deps.now ?? (() => performance.now());
  let current: PackContent | null = null;
  let duration: number | null = null;

  function build(pack: DecodedPack): PackContent {
    const blob = (asset: { offset: number; length: number; type: string }) =>
      createUrl(new Blob([new Uint8Array(assetBytes(pack, asset))], { type: asset.type }));
    const { index } = pack;
    return {
      welcome: index.welcome,
      headUrl: blob(index.head),
      photos: index.photos.map((p) => ({
        id: p.id,
        caption: p.caption,
        price: p.price,
        url: blob(p.asset),
      })),
      ...(index.bark ? { barkUrl: blob(index.bark) } : {}),
      messages: index.messages,
    };
  }

  return {
    async load(code) {
      if (normalizeCode(code) === '') return 'empty';
      let pack: DecodedPack;
      let elapsed: number;
      try {
        const response = await fetchPack();
        if (response.status !== 200) return 'unavailable';
        const bytes = new Uint8Array(await response.arrayBuffer());
        const start = now();
        const plain = await decryptPack(bytes, code);
        elapsed = now() - start;
        pack = decodePack(plain);
      } catch (error) {
        if (error instanceof WrongCodeError) return 'wrong';
        return 'unavailable';
      }
      const next = build(pack);
      if (current) for (const url of urlsOf(current)) revokeUrl(url);
      current = next;
      duration = elapsed;
      return 'ok';
    },
    content: () => current,
    decryptMs: () => duration,
    sardineMessages: (base) => mergeMessages(base, current?.messages.sardine),
  };
}
