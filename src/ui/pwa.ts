import { registerSW } from 'virtual:pwa-register';
import { createUpdateGate, type UpdateGate } from './update-gate';

/**
 * Enregistre le service worker (production seulement, pour ne pas gêner le développement).
 * Renvoie la porte de mise à jour (R-104), à prévenir à chaque affichage du menu et à chaque départ du menu.
 */
export function setupPwa(): UpdateGate {
  let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
  const gate = createUpdateGate({ apply: () => void updateSW?.(true) });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    updateSW = registerSW({ onNeedRefresh: () => gate.needRefresh() });
  }
  return gate;
}
