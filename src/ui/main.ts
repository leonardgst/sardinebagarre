import chienSvg from './art/chien.svg?raw';
import { createController } from './controller';
import { createRngs, readSeed } from './seed';
import './styles/main.css';

const dev = import.meta.env.DEV;
const rngs = createRngs(readSeed(location.search, dev));

const root = document.getElementById('app');
if (!root) throw new Error('Conteneur #app introuvable.');
document.body.insertAdjacentHTML('afterbegin', chienSvg);

const controller = createController(root, rngs);

if (dev && new URLSearchParams(location.search).get('debug') === '1') {
  const { installDebug } = await import('./debug');
  installDebug(controller);
}
