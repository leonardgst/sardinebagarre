/** UI-50 : aboiement synthétisé (Web Audio). Le contexte naît au premier geste (iOS). */

let ctx: AudioContext | null = null;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** À appeler dans le gestionnaire d'un geste de l'utilisateur. */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Deux « wouf » courts : bruit filtré passe-bande et enveloppe. */
export function bark(): void {
  const audio = ctx;
  if (audio?.state !== 'running') return;
  try {
    const length = Math.floor(audio.sampleRate * 0.12);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = seed / 0x80000000 - 1;
    }
    const start = audio.currentTime + 0.01;
    for (const [i, freq] of [650, 520].entries()) {
      const t = start + i * 0.21;
      const source = audio.createBufferSource();
      source.buffer = buffer;
      const filter = audio.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.4, t);
      filter.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
      filter.Q.value = 3;
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.9, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      source.connect(filter).connect(gain).connect(audio.destination);
      source.start(t);
    }
  } catch {
    // Pas de son : sans importance.
  }
}
