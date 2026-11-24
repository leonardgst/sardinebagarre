import chienSvg from './art/chien.svg?raw';
import { createController } from './controller';
import { setupPwa } from './pwa';
import { createRngs, readSeed } from './seed';
import { loadSave, writeSave } from './storage';
import './styles/main.css';

const dev = import.meta.env.DEV;
const rngs = createRngs(readSeed(location.search, dev));

const root = document.getElementById('app');
if (!root) throw new Error('Conteneur #app introuvable.');
document.body.insertAdjacentHTML('afterbegin', chienSvg);

// R-100 : pas d'écriture au chargement ; la sauvegarde corrigée sera écrite au prochain changement.
let save = loadSave().save;

// Tests de la porte R-104 en développement (`?debug=1`) : `apply` factice qui compte.
const debug = dev && new URLSearchParams(location.search).get('debug') === '1';
const applyCalls = { count: 0 };
const gate = setupPwa(
  debug
    ? () => {
        applyCalls.count += 1;
      }
    : undefined,
);

const controller = createController(root, rngs, {
  initialGame: save.game,
  onMenu: gate.menuShown,
  onLeaveMenu: gate.gameStarted,
  onGameChange(game) {
    save = { ...save, game }; // conserve settings, welcomeSeen et packCode.
    writeSave(save);
  },
});

if (debug) {
  const { installDebug } = await import('./debug');
  installDebug(controller, { gate, applyCalls });
}
