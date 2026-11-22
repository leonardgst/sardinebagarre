/** Tous les textes de l'interface (français). */
export const texts = {
  level: 'Niveau',
  roundCoins: 'Jetons de la partie',
  total: 'Total',
  memo: 'Mémo',
  quit: 'Quitter',
  hiddenCard: 'Carte cachée',
  sardine: 'Sardine',
  board: 'Plateau',
} as const;

export function cardLabel(value: number): string {
  return `Carte ${value}`;
}

function sardines(k: number): string {
  return `${k} ${k >= 2 ? 'Sardines' : 'Sardine'}`;
}

/** `index` : 0 à 4 (affiché de 1 à 5). */
export function rowHintLabel(index: number, sum: number, k: number): string {
  return `Ligne ${index + 1} : somme ${sum}, ${sardines(k)}`;
}

export function colHintLabel(index: number, sum: number, k: number): string {
  return `Colonne ${index + 1} : somme ${sum}, ${sardines(k)}`;
}

/** Symboles du mémo (R-80) et du décor. */
export const symbols = {
  marks: { S: 'S', 1: '1', 2: '2', 3: '3' },
  coin: '♣',
} as const;
