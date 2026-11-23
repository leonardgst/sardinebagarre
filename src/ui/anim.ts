/** Animations à base de promesses, interruptibles (CL-20). */

const pending = new Set<() => void>();
let fast = false;

/** UI-04 (partiel) : durées divisées par 4 si l'appareil demande moins d'animations. */
export function scale(ms: number): number {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduced ? ms / 4 : ms;
}

/** Mode accéléré : toutes les attentes suivantes sont immédiates. */
export function setFast(value: boolean): void {
  fast = value;
}

/** CL-20 : termine l'attente en cours et accélère la suite de l'enchaînement. */
export function skip(): void {
  fast = true;
  for (const end of [...pending]) end();
}

export function wait(ms: number): Promise<void> {
  if (fast) return Promise.resolve();
  return new Promise((resolve) => {
    const end = (): void => {
      clearTimeout(timer);
      pending.delete(end);
      resolve();
    };
    const timer = setTimeout(end, scale(ms));
    pending.add(end);
  });
}

/** Ajoute la classe d'animation CSS, attend la fin (ou `skip`), puis la retire. */
export function play(el: HTMLElement, className: string, ms: number): Promise<void> {
  if (fast) return Promise.resolve();
  const duration = scale(ms);
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const end = (): void => {
      clearTimeout(timer);
      el.removeEventListener('animationend', onEnd);
      pending.delete(end);
      el.classList.remove(className);
      el.style.removeProperty('animation-duration');
      resolve();
    };
    const onEnd = (e: Event): void => {
      if (e.target === el) end();
    };
    el.addEventListener('animationend', onEnd);
    el.style.animationDuration = `${duration}ms`;
    el.classList.add(className);
    // Secours : `animationend` n'arrive pas toujours (onglet caché).
    timer = setTimeout(end, duration + 80);
    pending.add(end);
  });
}

/** Appelle `step(progression)` de 0 à 1 sur `ms` ; un `skip` saute directement à 1. */
export async function tween(ms: number, step: (progress: number) => void): Promise<void> {
  const n = Math.max(1, Math.round(scale(ms) / 40));
  for (let i = 1; i < n && !fast; i++) {
    await wait(ms / n);
    if (!fast) step(i / n);
  }
  step(1);
}
