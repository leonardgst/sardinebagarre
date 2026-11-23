import { formatCoins } from '../format';
import { markButtonLabel, symbols, texts } from '../texts.fr';

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

const MARK_ORDER = ['S', 1, 2, 3] as const;
const MARK_BIT: Readonly<Record<(typeof MARK_ORDER)[number], number>> = { S: 1, 1: 2, 2: 4, 3: 8 };

function actionButton(name: string, label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.action = name;
  button.textContent = label;
  return button;
}

/** R-81 : rangée des 4 boutons de marque (`aria-disabled`, jamais `disabled` : le clic doit arriver à l'écouteur). */
function renderMemoPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'memo-marques';
  for (const mark of MARK_ORDER) {
    const button = actionButton(`mark-${mark}`, symbols.marks[mark]);
    button.classList.add('marque');
    button.setAttribute('aria-label', markButtonLabel(mark));
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-disabled', 'true');
    panel.append(button);
  }
  return panel;
}

/**
 * Pied de page : [panneau des marques si le mémo est ouvert] puis Mémo/Fermer et Quitter.
 * `marks` : bits de la carte sélectionnée, ou `null` sans sélection.
 */
export function renderActions(open = false, marks: number | null = null): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'actions';
  if (open) footer.append(renderMemoPanel());
  footer.append(
    actionButton('memo', open ? texts.close : texts.memo),
    actionButton('quit', texts.quit),
  );
  updateMemoPanel(footer, marks);
  return footer;
}

/** Met à jour l'état (pressé, inactif) des boutons de marque en place. */
export function updateMemoPanel(footer: HTMLElement, marks: number | null): void {
  for (const mark of MARK_ORDER) {
    const button = footer.querySelector<HTMLElement>(`[data-action=mark-${mark}]`);
    if (!button) continue;
    button.setAttribute('aria-disabled', String(marks === null));
    button.setAttribute('aria-pressed', String(marks !== null && (marks & MARK_BIT[mark]) !== 0));
  }
}
