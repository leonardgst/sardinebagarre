import { formatCoins } from '../format';
import { playButtonLabel, texts, versionLabel } from '../texts.fr';
import { dogHead } from './board';

export type ScreenName = 'album' | 'infos' | 'settings';

function button(action: string, label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.action = action;
  b.textContent = label;
  return b;
}

/** UI-01 : menu d'accueil. `message` : une ligne (boîte pleine, R-53). */
export function renderMenu(level: number, total: number, message: string): HTMLElement {
  const menu = document.createElement('main');
  menu.className = 'menu';
  const head = document.createElement('header');
  head.className = 'menu-tete';
  const title = document.createElement('h1');
  title.textContent = texts.title;
  const stats = document.createElement('p');
  stats.className = 'menu-stats';
  const lvl = document.createElement('span');
  lvl.className = 'menu-niveau';
  lvl.textContent = `${texts.level} ${level}`;
  const coins = document.createElement('span');
  coins.className = 'menu-total';
  coins.textContent = `${texts.total} `;
  const strong = document.createElement('strong');
  strong.className = 'menu-valeur';
  strong.textContent = formatCoins(total);
  coins.append(strong);
  stats.append(lvl, coins);
  head.append(dogHead('menu-chien'), title, stats);
  const nav = document.createElement('nav');
  nav.className = 'menu-boutons';
  nav.append(
    button('play', playButtonLabel(level)),
    button('album', texts.album),
    button('infos', texts.infos),
    button('settings', texts.settings),
    button('leave-table', texts.leaveTable),
  );
  const note = document.createElement('p');
  note.className = 'menu-message';
  note.setAttribute('aria-live', 'polite');
  note.textContent = message;
  menu.append(head, nav, note);
  return menu;
}

/** Écran provisoire (Album, Infos, Réglages) : un titre, une phrase et Retour. */
export function renderScreen(title: string, version?: string): HTMLElement {
  const screen = document.createElement('main');
  screen.className = 'menu ecran';
  const h = document.createElement('h2');
  h.textContent = title;
  const p = document.createElement('p');
  p.className = 'ecran-texte';
  p.textContent = texts.soon;
  const nav = document.createElement('nav');
  nav.className = 'menu-boutons';
  nav.append(button('back', texts.back));
  if (version === undefined) screen.append(h, p, nav);
  else {
    const v = document.createElement('p');
    v.className = 'ecran-version';
    v.textContent = versionLabel(version);
    const d = document.createElement('p');
    d.className = 'ecran-diagnostic';
    screen.append(h, p, v, d, nav);
  }
  return screen;
}
