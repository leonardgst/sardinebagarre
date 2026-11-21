import { generateBoard } from './board';
import { COIN_CAP } from './constants';
import { appendHistory, nextLevel, pickEntry } from './levels';
import { newRound } from './round';
import type { ConfigEntry, GameState, Level, Rng, RoundState, Stats } from './types';

/** Renvoie une copie de l'état gelée en profondeur (objet, historique, records, album). */
export function freezeGame(state: GameState): GameState {
  return Object.freeze({
    ...state,
    history: Object.freeze([...state.history]),
    stats: Object.freeze({ ...state.stats }),
    album: Object.freeze([...state.album]),
  });
}

/** R-61, R-70 : premier lancement. */
export function initialGame(): GameState {
  return freezeGame({
    coins: 0,
    level: 1,
    history: [],
    stats: {
      bestPayout: 0,
      maxLevel: 1,
      played: 0,
      won: 0,
      lost: 0,
      quit: 0,
      level8Reached: 0,
    },
    album: [],
  });
}

/** R-53 : pas de partie quand la boîte est pleine. */
export function canStartRound(game: GameState): boolean {
  return game.coins < COIN_CAP;
}

/** Lance une partie : entrée tirée puis plateau généré avec le même `rng`. Ne modifie pas `game` (R-68). */
export function startRound(
  game: GameState,
  rng: Rng,
): { readonly entry: ConfigEntry; readonly round: RoundState } | null {
  if (!canStartRound(game)) return null;
  const entry = pickEntry(game.level, rng);
  const round = newRound(generateBoard(entry, rng));
  return { entry, round };
}

/** R-55 : encaisse, historise, calcule le niveau suivant et met à jour les records. */
export function finalizeRound(game: GameState, round: RoundState): GameState {
  const status = round.status;
  if (status === 'PLAYING') {
    throw new Error('Impossible de finaliser une partie encore en cours.');
  }
  const coins = status === 'LOST' ? game.coins : Math.min(game.coins + round.payout, COIN_CAP);
  const history = appendHistory(game.history, {
    outcome: status,
    cardsFlipped: round.cardsFlipped,
    level: game.level,
  });
  const level = nextLevel(history);
  const gains = status !== 'LOST';
  const stats: Stats = {
    bestPayout: gains ? Math.max(game.stats.bestPayout, round.payout) : game.stats.bestPayout,
    maxLevel: Math.max(game.stats.maxLevel, level) as Level,
    played: game.stats.played + 1,
    won: game.stats.won + (status === 'WON' ? 1 : 0),
    lost: game.stats.lost + (status === 'LOST' ? 1 : 0),
    quit: game.stats.quit + (status === 'QUIT' ? 1 : 0),
    level8Reached: game.stats.level8Reached + (game.level < 8 && level === 8 ? 1 : 0),
  };
  return freezeGame({ ...game, coins, history, level, stats });
}

/** R-67 : « Quitter la table » → niveau 1, historique vidé. */
export function leaveTable(game: GameState): GameState {
  return freezeGame({ ...game, level: 1, history: [] });
}

/** R-53 : vider la boîte → jetons à 0. */
export function emptyBox(game: GameState): GameState {
  return freezeGame({ ...game, coins: 0 });
}

/**
 * ADR-017 : effacer toute la progression ; équivaut à `initialGame()`.
 * Le paramètre est gardé pour la symétrie des appels.
 */
export function resetProgress(_game: GameState): GameState {
  return initialGame();
}
