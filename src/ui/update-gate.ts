/** R-104 : une mise à jour n'est jamais appliquée pendant une partie ; seulement sur le menu. */
export interface UpdateGate {
  /** Une nouvelle version est prête (service worker en attente). */
  needRefresh(): void;
  /** Le menu vient d'être affiché. */
  menuShown(): void;
  /** Le joueur a quitté le menu (partie ou écran). */
  gameStarted(): void;
  /** Le nouveau service worker contrôle la page : un rechargement est demandé. */
  reloadRequested(): void;
}

export function createUpdateGate({
  apply,
  reload = () => {},
}: {
  readonly apply: () => void;
  readonly reload?: () => void;
}): UpdateGate {
  let onMenu = false;
  let pending = false;
  let applied = false;
  let reloadPending = false;

  function tryApply(): void {
    if (!pending || !onMenu || applied) return;
    applied = true;
    apply();
  }

  /** Le rechargement attend lui aussi le menu (le joueur a pu lancer une partie entre-temps). */
  function tryReload(): void {
    if (!reloadPending || !onMenu) return;
    reloadPending = false;
    reload();
  }

  return {
    needRefresh() {
      pending = true;
      tryApply();
    },
    menuShown() {
      onMenu = true;
      tryApply();
      tryReload();
    },
    gameStarted() {
      onMenu = false;
    },
    reloadRequested() {
      reloadPending = true;
      tryReload();
    },
  };
}
