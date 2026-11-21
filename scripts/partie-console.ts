// Jouer à Sardinebagarre dans le terminal, pour « sentir » les règles (plan, étape 1.6).
// Outil de développement : il n'est pas livré avec le jeu et n'utilise que src/logic/.
//
// Lancement :  npx tsx scripts/partie-console.ts            (graine aléatoire)
//              npx tsx scripts/partie-console.ts --seed=42  (parties reproductibles)
//              npx tsx scripts/partie-console.ts --niveau=5 (commencer à un autre niveau)

import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline';
import { finalizeRound, initialGame, startRound } from '../src/logic/game';
import { mulberry32 } from '../src/logic/rng';
import { flip, hasMark, quit, toggleMemo } from '../src/logic/round';
import type { GameState, Level, MemoMark, RoundState } from '../src/logic/types';

const MARKS: readonly MemoMark[] = ['S', 1, 2, 3];

function readArg(name: string): number | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (arg === undefined) return undefined;
  const value = Number(arg.slice(name.length + 3));
  return Number.isInteger(value) ? value : undefined;
}

/** Une case : la valeur si elle est retournée (ou si on révèle tout), sinon les marques du mémo. */
function cell(round: RoundState, id: number, revealAll: boolean): string {
  const value = round.board.cells[id];
  if (round.flipped[id]) return `[${value}]`.padStart(4);
  if (revealAll) return ` ${value} `.padStart(4);
  const marks = MARKS.filter((m) => hasMark(round, id, m)).join('');
  return (marks === '' ? ' · ' : marks).padStart(4);
}

function render(game: GameState, round: RoundState, revealAll = false): string {
  const lines: string[] = [];
  lines.push(`Niveau ${game.level} · Jetons ${game.coins} · Gain de la partie ${round.payout}`);
  lines.push(`      1   2   3   4   5     (somme/Sardines)`);
  for (let r = 0; r < 5; r++) {
    let line = ` ${r + 1}  `;
    for (let c = 0; c < 5; c++) line += cell(round, r * 5 + c, revealAll);
    const h = round.board.rowHints[r];
    line += `   ${h?.sum ?? 0}/${h?.sardines ?? 0}`;
    lines.push(line);
  }
  lines.push(
    `    ${round.board.colHints.map((h) => `${h.sum}`.padStart(3).padEnd(4)).join('')}  ← sommes`,
  );
  lines.push(
    `    ${round.board.colHints.map((h) => `${h.sardines}S`.padStart(3).padEnd(4)).join('')}  ← Sardines`,
  );
  return lines.join('\n');
}

const AIDE = `Commandes :
  23        retourner la carte ligne 2, colonne 3
  m 23 S    inverser la marque S (ou 1, 2, 3) sur la carte ligne 2, colonne 3
  q         s'arrêter et encaisser le gain (avec confirmation)
  x         quitter le programme
  ?         afficher cette aide`;

function parseId(text: string | undefined): number | null {
  if (text === undefined || !/^[1-5][1-5]$/.test(text)) return null;
  return (Number(text[0]) - 1) * 5 + (Number(text[1]) - 1);
}

function parseMark(text: string | undefined): MemoMark | null {
  if (text === undefined) return null;
  const t = text.toUpperCase();
  if (t === 'S') return 'S';
  if (t === '1' || t === '2' || t === '3') return Number(t) as 1 | 2 | 3;
  return null;
}

async function main(): Promise<void> {
  const seed = readArg('seed') ?? Math.floor(Math.random() * 2 ** 32);
  const rng = mulberry32(seed);
  const startLevel = readArg('niveau');
  let game: GameState = initialGame();
  if (startLevel !== undefined && startLevel >= 1 && startLevel <= 8) {
    game = { ...game, level: startLevel as Level };
  }
  const rl = createInterface({ input, output });
  // File de lignes : fonctionne au clavier comme avec des commandes envoyées par un tube.
  const lines: string[] = [];
  const waiting: ((line: string) => void)[] = [];
  let closed = false;
  rl.on('line', (line) => {
    const resolve = waiting.shift();
    if (resolve) resolve(line);
    else lines.push(line);
  });
  rl.on('close', () => {
    closed = true;
    for (const resolve of waiting.splice(0)) resolve('x');
  });
  const ask = (prompt: string): Promise<string> => {
    output.write(prompt);
    const line = lines.shift();
    if (line !== undefined) return Promise.resolve(line);
    if (closed) return Promise.resolve('x');
    return new Promise((resolve) => waiting.push(resolve));
  };
  console.log(`Sardinebagarre en console — graine ${seed}\n${AIDE}\n`);

  for (;;) {
    const started = startRound(game, rng);
    if (started === null) {
      console.log('Ta boîte à jetons est pleine (50 000). Tu ne peux plus en gagner.');
      break;
    }
    let round = started.round;
    console.log(
      `\n— Nouvelle partie : niveau ${game.level}, ${started.entry.sardines} Sardines, ` +
        `${started.entry.twos} × 2, ${started.entry.threes} × 3 (gain max ${round.maxPayout}) —`,
    );

    while (round.status === 'PLAYING') {
      console.log(`\n${render(game, round)}`);
      const [cmd, arg1, arg2] = (await ask('> ')).trim().split(/\s+/);
      if (cmd === 'x') {
        rl.close();
        return;
      }
      if (cmd === '?') {
        console.log(AIDE);
      } else if (cmd === 'q') {
        const question =
          round.payout === 0
            ? "Tu n'as encore trouvé aucun jeton. Quitter quand même ? (o/n) "
            : `Si tu t'arrêtes maintenant, tu gagnes ${round.payout} jeton(s). Tu t'arrêtes ? (o/n) `;
        if ((await ask(question)).trim().toLowerCase() === 'o') round = quit(round);
      } else if (cmd === 'm') {
        const id = parseId(arg1);
        const mark = parseMark(arg2);
        if (id === null || mark === null) console.log('Exemple : m 23 S');
        else {
          const next = toggleMemo(round, id, mark);
          if (next === round) console.log('Refus : cette carte est déjà retournée.');
          round = next;
        }
      } else {
        const id = parseId(cmd);
        if (id === null) console.log('Commande inconnue (? pour l’aide).');
        else {
          const next = flip(round, id);
          if (next === round) console.log('Refus : cette carte est déjà retournée.');
          round = next;
        }
      }
    }

    const before = game.level;
    game = finalizeRound(game, round);
    const issue = { WON: 'Gagné !', LOST: 'Sardine ! Perdu.', QUIT: 'Abandon.' }[round.status];
    console.log(`\n${issue} (${round.cardsFlipped} carte(s) chiffrée(s) retournée(s))`);
    console.log(render(game, round, true));
    if (game.level > before) console.log(`Niveau ${game.level} atteint !`);
    else if (game.level < before) console.log(`Retour au niveau ${game.level}.`);
    console.log(
      `Records : ${game.stats.played} partie(s), meilleur gain ${game.stats.bestPayout}, ` +
        `niveau max ${game.stats.maxLevel}`,
    );
    await ask('(Entrée pour continuer) ');
  }
  rl.close();
}

await main();
