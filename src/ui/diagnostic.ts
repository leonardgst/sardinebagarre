import { getRegisterError } from './register-error';
import { offlineTexts, packLoadedLabel, packTexts } from './texts.fr';

/** Diagnostic provisoire (T-015) : état du service worker vu de la page. */
export interface OfflineInfo {
  readonly hasServiceWorker: boolean;
  readonly controlled: boolean;
  readonly mode: 'standalone' | 'browser' | 'unknown';
  readonly page: string;
  /** URL absolue de la portée, `null` si aucun enregistrement, `'?'` si illisible. */
  readonly scope: string | null;
  readonly workerState: 'active' | 'waiting' | 'installing' | 'none' | 'unknown';
  readonly cacheCount: number | '?';
  readonly registerError: string | null;
}

interface NavigatorStandalone {
  readonly standalone?: boolean;
}

/** Exécute une lecture ; en cas d'erreur, renvoie la valeur de repli. */
async function safe<T, F>(read: () => T | Promise<T>, fallback: F): Promise<T | F> {
  try {
    return await read();
  } catch {
    return fallback;
  }
}

export async function collectOfflineInfo(): Promise<OfflineInfo> {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const controlled = hasServiceWorker
    ? await safe(() => navigator.serviceWorker.controller !== null, false)
    : false;
  const mode = await safe<OfflineInfo['mode'], 'unknown'>(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as NavigatorStandalone).standalone === true
        ? 'standalone'
        : 'browser',
    'unknown',
  );
  const page = await safe(() => location.pathname + location.search, '?');
  let scope: OfflineInfo['scope'] = null;
  let workerState: OfflineInfo['workerState'] = 'none';
  if (hasServiceWorker) {
    const reg = await safe(() => navigator.serviceWorker.getRegistration(), '?' as const);
    if (reg === '?') {
      scope = '?';
      workerState = 'unknown';
    } else if (reg !== undefined) {
      scope = reg.scope;
      workerState = reg.active
        ? 'active'
        : reg.waiting
          ? 'waiting'
          : reg.installing
            ? 'installing'
            : 'none';
    }
  }
  const cacheCount = await safe<number, '?'>(async () => {
    if (!('caches' in window)) throw new Error('caches indisponible');
    let total = 0;
    for (const name of await caches.keys()) {
      total += (await (await caches.open(name)).keys()).length;
    }
    return total;
  }, '?');
  return {
    hasServiceWorker,
    controlled,
    mode,
    page,
    scope,
    workerState,
    cacheCount,
    registerError: getRegisterError(),
  };
}

function scopePath(scope: string | null): string {
  if (scope === null) return offlineTexts.noScope;
  if (scope === '?') return '?';
  try {
    return new URL(scope).pathname;
  } catch {
    return '?';
  }
}

/** Deux lignes (verdict, ligne technique), plus l'erreur d'enregistrement s'il y en a une. */
export function formatOfflineInfo(info: OfflineInfo): string[] {
  const verdict = !info.hasServiceWorker
    ? offlineTexts.unavailable
    : info.controlled
      ? offlineTexts.active
      : offlineTexts.notReady;
  const mode =
    info.mode === 'standalone'
      ? offlineTexts.app
      : info.mode === 'browser'
        ? offlineTexts.browser
        : '?';
  const state =
    info.workerState === 'none'
      ? offlineTexts.none
      : info.workerState === 'unknown'
        ? '?'
        : info.workerState;
  const technical = [
    mode,
    `${offlineTexts.page} ${info.page}`,
    `${offlineTexts.scope} ${scopePath(info.scope)}`,
    `${offlineTexts.sw} ${state}`,
    `${offlineTexts.cache} ${info.cacheCount}`,
  ].join(' · ');
  const lines = [verdict, technical];
  if (info.registerError !== null)
    lines.push(`${offlineTexts.registerError} ${info.registerError}`);
  return lines;
}

/** T-017 (provisoire) : état du pack, pour mesurer R-T8 sur iPhone. */
export type PackInfo =
  | { readonly status: 'absent' | 'unavailable' }
  | { readonly status: 'loaded'; readonly photos: number; readonly ms: number };

export function formatPackInfo(info: PackInfo): string {
  if (info.status === 'loaded') return packLoadedLabel(info.photos, info.ms);
  return info.status === 'absent' ? packTexts.diagAbsent : packTexts.diagUnavailable;
}
