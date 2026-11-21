/** Valeur d'une carte : 1, 2, 3 ou 'S' (Sardine, la carte-bombe). */
export type CardValue = 1 | 2 | 3 | 'S';

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Variant = 'A' | 'B';

/** Générateur pseudo-aléatoire injecté : renvoie un nombre dans [0, 1). */
export type Rng = () => number;

/** Une entrée de la table de configurations (spec §3). */
export interface ConfigEntry {
  readonly level: Level;
  readonly variant: Variant;
  /** Nombre de Sardines (colonne « Voltorbes »). */
  readonly sardines: number;
  readonly twos: number;
  readonly threes: number;
  /** MaxLC : maximum **exclu** de multiplicateurs gratuits par ligne ou colonne (accepté si compte < max, §4). */
  readonly maxFreePerLine: number;
  /** MaxT : maximum **exclu** de multiplicateurs gratuits sur tout le plateau (accepté si compte < max, §4). */
  readonly maxFreeTotal: number;
}

/** Indicateur d'une ligne ou d'une colonne (R-02). */
export interface LineHint {
  /** Somme des valeurs (Sardine = 0). */
  readonly sum: number;
  /** Nombre de Sardines. */
  readonly sardines: number;
}

/** Plateau 5×5 immuable (R-01, R-24) ; `cells[id]` avec id = ligne × 5 + colonne. */
export interface Board {
  readonly cells: readonly CardValue[];
  readonly rowHints: readonly LineHint[];
  readonly colHints: readonly LineHint[];
}

/** Comptes de multiplicateurs gratuits (R-21). */
export interface FreeMultipliers {
  readonly total: number;
  readonly perRow: readonly number[];
  readonly perCol: readonly number[];
}

/** Issue d'une partie terminée (R-60). */
export type Outcome = 'WON' | 'LOST' | 'QUIT';

/** État d'une partie : en cours ou terminée avec son issue. */
export type RoundStatus = 'PLAYING' | Outcome;

/** Marque de mémo (R-80) : Sardine, 1, 2 ou 3. */
export type MemoMark = 'S' | 1 | 2 | 3;

/** État immuable d'une partie (R-04, R-30..R-34, R-80). */
export interface RoundState {
  readonly board: Board;
  /** 25 valeurs, index = id (R-01). */
  readonly flipped: readonly boolean[];
  /** 25 masques de bits (voir MEMO_BITS). */
  readonly memos: readonly number[];
  /** Gain de la partie. */
  readonly payout: number;
  /** Cartes chiffrées retournées (les 1 comptent, la Sardine non). */
  readonly cardsFlipped: number;
  readonly multipliersFlipped: number;
  /** Nombre de 2 et de 3 du plateau. */
  readonly multipliersTotal: number;
  /** min(produit des 2 et 3 du plateau, COIN_CAP). */
  readonly maxPayout: number;
  readonly status: RoundStatus;
}

/** Une partie terminée, telle que gardée dans l'historique (R-60). */
export interface RoundRecord {
  readonly outcome: Outcome;
  /** k : cartes chiffrées retournées (les 1 comptent). */
  readonly cardsFlipped: number;
  readonly level: Level;
}
