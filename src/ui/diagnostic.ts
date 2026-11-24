import { offlineTexts } from './texts.fr';

/** Diagnostic provisoire (T-015) : état du service worker vu de la page. */
export interface OfflineInfo {
  readonly hasServiceWorker: boolean;
  readonly controlled: boolean;
  readonly mode: 'app' | 'navigateur' | '?';
  readonly page: string;
  /** URL absolue de la portée, `null` si aucun enregistrement, `'?'` si illisible. */
  readonly scope: string | null;
  readonly workerState: 'active' | 'waiting' | 'installing' | 'aucun' | '?';
  readonly cacheCount: number | '?';
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
  const controlled = hasServiceWorker && navigator.serviceWorker.controller !== null;
  const mode = await safe<OfflineInfo['mode'], '?'>(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as NavigatorStandalone).standalone === true
        ? 'app'
        : 'navigateur',
    '?',
  );
  const page = await safe(() => location.pathname + location.search, '?');
  let scope: OfflineInfo['scope'] = null;
  let workerState: OfflineInfo['workerState'] = 'aucun';
  if (hasServiceWorker) {
    const reg = await safe(() => navigator.serviceWorker.getRegistration(), '?' as const);
    if (reg === '?') {
      scope = '?';
      workerState = '?';
    } else if (reg !== undefined) {
      scope = reg.scope;
      workerState = reg.active
        ? 'active'
        : reg.waiting
          ? 'waiting'
          : reg.installing
            ? 'installing'
            : 'aucun';
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
  return { hasServiceWorker, controlled, mode, page, scope, workerState, cacheCount };
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

/** Deux lignes : verdict, puis ligne technique. */
export function formatOfflineInfo(info: OfflineInfo): string[] {
  const verdict = !info.hasServiceWorker
    ? offlineTexts.unavailable
    : info.controlled
      ? offlineTexts.active
      : offlineTexts.notReady;
  const technical = [
    info.mode,
    `${offlineTexts.page} ${info.page}`,
    `${offlineTexts.scope} ${scopePath(info.scope)}`,
    `sw ${info.workerState}`,
    `${offlineTexts.cache} ${info.cacheCount}`,
  ].join(' · ');
  return [verdict, technical];
}
