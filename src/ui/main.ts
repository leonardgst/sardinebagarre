import { initialGame, startRound } from '../logic/game';
import type { RoundState } from '../logic/types';
import chienSvg from './art/chien.svg?raw';
import { renderBoard } from './render/board';
import { renderActions, renderHud, renderMessage } from './render/hud';
import { createRngs, readSeed } from './seed';
import './styles/main.css';

const dev = import.meta.env.DEV;
const rngs = createRngs(readSeed(location.search, dev));
const game = initialGame();
const started = startRound(game, rngs.board);
if (!started) throw new Error('Impossible de démarrer la première partie.');

let round: RoundState = started.round;

const root = document.getElementById('app');
if (!root) throw new Error('Conteneur #app introuvable.');
document.body.insertAdjacentHTML('afterbegin', chienSvg);

function render(): void {
  const table = document.createElement('main');
  table.className = 'table';
  table.append(renderBoard(round));
  root?.replaceChildren(
    renderHud(game.level, round.payout, game.coins),
    table,
    renderMessage(),
    renderActions(),
  );
}

render();

if (dev && new URLSearchParams(location.search).get('debug') === '1') {
  const { installDebug } = await import('./debug');
  installDebug(
    () => round,
    (next) => {
      round = next;
      render();
    },
  );
}
