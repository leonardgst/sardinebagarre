/** Un seul écouteur délégué sur la racine (UI-20) : carte touchée ou toucher ailleurs. */
export interface InputHandlers {
  onCard(id: number): void;
  onElsewhere(): void;
  /** Appelé à chaque geste, avant tout (déverrouillage audio iOS). */
  onGesture(): void;
}

export function installInput(root: HTMLElement, handlers: InputHandlers): void {
  root.addEventListener('click', (event) => {
    handlers.onGesture();
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-action]')) return; // Mémo et Quitter : inertes (T-011).
    const card = target?.closest<HTMLElement>('.card[data-id]');
    const id = Number(card?.dataset.id);
    if (card && Number.isInteger(id) && id >= 0 && id <= 24) handlers.onCard(id);
    else handlers.onElsewhere();
  });
  // Mac : le fond décoré hors de la colonne compte aussi comme « toucher ailleurs ».
  // Ce second écouteur ne gère que les clics situés en dehors de la racine.
  document.body.addEventListener('click', (event) => {
    const target = event.target instanceof Node ? event.target : null;
    if (target && root.contains(target)) return;
    handlers.onGesture();
    handlers.onElsewhere();
  });
}
