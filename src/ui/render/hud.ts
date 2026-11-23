import { formatCoins } from '../format';
import { texts } from '../texts.fr';

function bloc(className: string, label: string, value: string): HTMLElement {
  const div = document.createElement('div');
  div.className = `bloc ${className}`;
  const small = document.createElement('small');
  small.textContent = label;
  const strong = document.createElement('strong');
  strong.textContent = value;
  div.append(small, strong);
  return div;
}

/** UI-02 : bandeau (niveau, jetons de la partie, total). */
export function renderHud(level: number, payout: number, total: number): HTMLElement {
  const header = document.createElement('header');
  header.className = 'hud';
  header.append(
    bloc('niveau', texts.level, String(level)),
    bloc('gain', texts.roundCoins, formatCoins(payout)),
    bloc('total', texts.total, formatCoins(total)),
  );
  return header;
}

/** Met à jour le bandeau en place (niveau, jetons de la partie, total). */
export function updateHud(hud: HTMLElement, level: number, payout: number, total: number): void {
  const set = (selector: string, value: string): void => {
    const target = hud.querySelector(selector);
    if (target) target.textContent = value;
  };
  set('.niveau strong', String(level));
  set('.gain strong', formatCoins(payout));
  set('.total strong', formatCoins(total));
}

/** Zone de message d'une ligne (vide pour l'instant). */
export function renderMessage(text = ''): HTMLElement {
  const p = document.createElement('p');
  p.className = 'message';
  p.setAttribute('aria-live', 'polite');
  p.textContent = text;
  return p;
}

/** Boutons Mémo (inerte jusqu'à l'étape 2.4) et Quitter. */
export function renderActions(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'actions';
  for (const [name, label] of [
    ['memo', texts.memo],
    ['quit', texts.quit],
  ] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = name;
    button.textContent = label;
    footer.append(button);
  }
  return footer;
}
