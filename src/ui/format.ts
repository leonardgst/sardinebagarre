/** UI-02 : jetons sur 5 chiffres. */
export function formatCoins(n: number): string {
  return String(n).padStart(5, '0');
}

/** R-02 : somme d'un indicateur sur 2 chiffres. */
export function formatHintSum(n: number): string {
  return String(n).padStart(2, '0');
}
