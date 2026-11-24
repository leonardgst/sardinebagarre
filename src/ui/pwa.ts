import { registerSW } from 'virtual:pwa-register';
import { createUpdateGate, type UpdateGate } from './update-gate';

/**
 * Enregistre le service worker (production seulement, pour ne pas gêner le développement).
 * Renvoie la porte de mise à jour (R-104), à prévenir à chaque affichage du menu et à chaque départ du menu.
 * `apply` (tests en développement) remplace l'application réelle de la mise à jour.
 */
export function setupPwa(apply?: () => void): UpdateGate {
  let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
  const gate = createUpdateGate({
    apply: apply ?? (() => void updateSW?.(true)),
    reload: () => window.location.reload(),
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    updateSW = registerSW({
      onNeedRefresh: () => gate.needRefresh(),
      onNeedReload: () => gate.reloadRequested(),
    });
  }
  return gate;
}
