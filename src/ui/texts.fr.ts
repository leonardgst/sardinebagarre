/** Tous les textes de l'interface (français). */
export const texts = {
  level: 'Niveau',
  roundCoins: 'Jetons de la partie',
  total: 'Total',
  memo: 'Mémo',
  quit: 'Quitter',
  close: 'Fermer',
  hiddenCard: 'Carte cachée',
  sardine: 'Sardine',
  board: 'Plateau',
  title: 'Sardinebagarre',
  yes: 'Oui',
  no: 'Non',
  album: 'Album',
  infos: 'Infos',
  settings: 'Réglages',
  leaveTable: 'Quitter la table',
  soon: 'Bientôt ici.',
  back: 'Retour',
} as const;

/** UI-04 : version de l'application (Réglages). */
export function versionLabel(version: string): string {
  return `Version ${version}`;
}

/** UI-01 : bouton du menu. */
export function playButtonLabel(level: number): string {
  return `Jouer au niveau ${level}`;
}

/** ADR-019 : question posée après chaque partie. */
export function playQuestion(level: number): string {
  return `Jouer au niveau ${level} ?`;
}

/** R-40 : confirmation de l'abandon. */
export function quitQuestion(payout: number): string {
  return payout === 0
    ? "Tu n'as encore trouvé aucun jeton. Quitter quand même ?"
    : `Si tu t'arrêtes maintenant, tu gagnes ${coinsLabel(payout)}. Tu t'arrêtes ?`;
}

/** R-67 : confirmation de « Quitter la table ». */
export const leaveTableQuestion = 'Quitter la table ? Tu repartiras du niveau 1.';

/** R-80 : nom parlé d'une marque du mémo. */
export const markNames = { S: 'Sardine', 1: '1', 2: '2', 3: '3' } as const;

/** Libellé du bouton de marque (« Marque Sardine », « Marque 1 »…). */
export function markButtonLabel(mark: 'S' | 1 | 2 | 3): string {
  return `Marque ${markNames[mark]}`;
}

/** Carte cachée, avec ses marques s'il y en a (UI-20, R-82). */
export function hiddenCardLabel(marks: readonly ('S' | 1 | 2 | 3)[]): string {
  if (marks.length === 0) return texts.hiddenCard;
  return `${texts.hiddenCard}, marques : ${marks.map((m) => markNames[m]).join(', ')}`;
}

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

/** UI-60 : « jeton » au singulier pour 0 et 1. */
export function coinsLabel(n: number): string {
  return `${n} ${n >= 2 ? 'jetons' : 'jeton'}`;
}

export const messages = {
  /** UI-60 : listes d'ambiance (tirage avec `rngs.decor`). */
  sardine: [
    "Wouf ! Sardine t'a tout pris. 0 jeton.",
    'Ouaf ! Sardine a trouvé ta cachette… 0 jeton.',
    'Sardine est passée par là : 0 jeton !',
  ],
  won: 'Gagné ! Tu as trouvé tous les 2 et les 3.',
  wonBanner: 'Gagné !',
  tapToContinue: "Touche l'écran pour continuer.",
  boxFull: 'Ta boîte à jetons est pleine (50 000). Tu ne peux plus en gagner.',
  bravo: 'Bravo ! Tu peux gagner encore plus de jetons.',
} as const;

/** Tire un message dans une liste avec le générateur de décor. */
export function pickMessage(list: readonly string[], rng: () => number): string {
  const item = list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  return item ?? '';
}

/** Première carte chiffrée (§10.6). */
export function firstCardMessage(value: number, payout: number): string {
  return `${value} ! Tu gagnes ${coinsLabel(payout)} !`;
}

/** 2 ou 3 retourné ensuite (§10.6). */
export function multiplierMessage(value: number, payout: number): string {
  return `×${value} ! Tu as maintenant ${coinsLabel(payout)} !`;
}

export function wonPayoutMessage(payout: number): string {
  return `Tu remportes ${coinsLabel(payout)} !`;
}

/** R-66 : messages de changement de niveau ; le « Bravo » une seule fois par session. */
export function levelChangeMessages(from: number, to: number, bravoSeen: boolean): string[] {
  if (to > from) {
    const up = `Niveau ${to} atteint !`;
    return bravoSeen ? [up] : [up, messages.bravo];
  }
  if (to < from) return [`Retour au niveau ${to}.`];
  return [];
}
