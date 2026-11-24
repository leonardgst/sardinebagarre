/** R-104 : une mise à jour n'est jamais appliquée pendant une partie ; seulement sur le menu. */
export interface UpdateGate {
  /** Une nouvelle version est prête (service worker en attente). */
  needRefresh(): void;
  /** Le menu vient d'être affiché. */
  menuShown(): void;
  /** Le joueur a quitté le menu (partie ou écran). */
  gameStarted(): void;
}

export function createUpdateGate({ apply }: { readonly apply: () => void }): UpdateGate {
  let onMenu = false;
  let pending = false;
  let applied = false;

  function tryApply(): void {
    if (!pending || !onMenu || applied) return;
    applied = true;
    apply();
  }

  return {
    needRefresh() {
      pending = true;
      tryApply();
    },
    menuShown() {
      onMenu = true;
      tryApply();
    },
    gameStarted() {
      onMenu = false;
    },
  };
}
