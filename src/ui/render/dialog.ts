import { texts } from '../texts.fr';

/** Dialogue Oui/Non modal : un voile et une boîte `role="dialog"` à ajouter dans `#app`. */
export function renderDialog(text: string): {
  readonly veil: HTMLElement;
  readonly no: HTMLElement;
} {
  const veil = document.createElement('div');
  veil.className = 'voile';
  const box = document.createElement('div');
  box.className = 'dialogue';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'dialogue-texte');
  const p = document.createElement('p');
  p.id = 'dialogue-texte';
  p.className = 'dialogue-texte';
  p.textContent = text;
  const buttons = document.createElement('div');
  buttons.className = 'dialogue-boutons';
  const make = (action: 'yes' | 'no', label: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.action = action;
    b.textContent = label;
    return b;
  };
  const no = make('no', texts.no);
  buttons.append(make('yes', texts.yes), no);
  box.append(p, buttons);
  veil.append(box);
  return { veil, no };
}
