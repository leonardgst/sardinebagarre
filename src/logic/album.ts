import { freezeGame } from './game';
import type { AlbumPhoto, GameState } from './types';

/** R-111 : première photo du pack pas encore débloquée (ordre du pack). */
export function nextPhoto(
  photos: readonly AlbumPhoto[],
  album: readonly string[],
): AlbumPhoto | null {
  return photos.find((p) => !album.includes(p.id)) ?? null;
}

/**
 * R-112 : jetons manquants pour la prochaine photo (0 si la photo est achetable, s'il n'en reste
 * aucune ou si son prix est invalide ; l'interface se fie au refus de `buyNextPhoto`).
 */
export function missingCoins(game: GameState, photos: readonly AlbumPhoto[]): number {
  const photo = nextPhoto(photos, game.album);
  return photo === null || !validPrice(photo.price) ? 0 : Math.max(0, photo.price - game.coins);
}

/** R-110, R-116 : un prix est un entier ≥ 0. */
function validPrice(price: number): boolean {
  return Number.isInteger(price) && price >= 0;
}

/** R-112 : achète la prochaine photo ; en cas de refus, renvoie le même objet. */
export function buyNextPhoto(game: GameState, photos: readonly AlbumPhoto[]): GameState {
  const photo = nextPhoto(photos, game.album);
  if (photo === null || !validPrice(photo.price) || game.coins < photo.price) return game;
  return freezeGame({
    ...game,
    coins: game.coins - photo.price,
    album: [...game.album, photo.id],
  });
}
