import { formatCoins } from '../format';
import { packTexts, playButtonLabel, texts, versionLabel } from '../texts.fr';
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

/** État de la section « Code secret » (UI-04, R-124). */
export type CodeSectionState =
  | { readonly kind: 'form'; readonly error?: string }
  | { readonly kind: 'checking' }
  | { readonly kind: 'accepted'; readonly welcome: string };

/** UI-04 : saisir ou changer le code secret. Le champ est toujours vide. */
export function renderCodeSection(state: CodeSectionState): HTMLElement {
  const section = document.createElement('section');
  section.className = 'code-secret';
  if (state.kind === 'accepted') {
    const ok = document.createElement('p');
    ok.className = 'code-etat';
    ok.textContent = packTexts.accepted;
    const welcome = document.createElement('p');
    welcome.className = 'code-bienvenue';
    welcome.textContent = state.welcome;
    section.append(ok, welcome, button('change-code', packTexts.change));
    return section;
  }
  const label = document.createElement('label');
  label.className = 'code-libelle';
  label.htmlFor = 'code-secret';
  label.textContent = packTexts.label;
  const input = document.createElement('input');
  input.id = 'code-secret';
  input.className = 'code-champ';
  input.type = 'text';
  input.name = 'code';
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('enterkeyhint', 'done');
  const checking = state.kind === 'checking';
  input.disabled = checking;
  const submit = button('submit-code', checking ? packTexts.checking : packTexts.submit);
  submit.disabled = checking;
  const status = document.createElement('p');
  status.className = 'code-etat';
  status.setAttribute('aria-live', 'polite');
  status.textContent = state.kind === 'form' ? (state.error ?? '') : '';
  section.append(label, input, submit, status);
  return section;
}

/** Écran provisoire (Album, Infos, Réglages) : un titre, une phrase et Retour. */
export function renderScreen(
  title: string,
  version?: string,
  codeSection?: HTMLElement,
): HTMLElement {
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
    // T-015 (provisoire) : ligne du pack, remplie par le contrôleur.
    const pack = document.createElement('p');
    pack.className = 'ecran-pack';
    screen.append(h, ...(codeSection ? [codeSection] : []), v, d, pack, nav);
  }
  return screen;
}
