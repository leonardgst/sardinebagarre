/** T-015 (provisoire) : dernière erreur d'enregistrement du service worker, pour le diagnostic. */
let registerError: string | null = null;

export function setRegisterError(e: unknown): void {
  registerError = String(e).slice(0, 80);
}

export function getRegisterError(): string | null {
  return registerError;
}
