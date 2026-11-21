import type { AlbumPhoto, GameState } from './types';

/** R-111 : première photo du pack pas encore débloquée (ordre du pack). */
export function nextPhoto(
  photos: readonly AlbumPhoto[],
  album: readonly string[],
): AlbumPhoto | null {
  return photos.find((p) => !album.includes(p.id)) ?? null;
}

/** R-112 : jetons manquants pour la prochaine photo (0 si achetable ou s'il n'en reste aucune). */
export function missingCoins(game: GameState, photos: readonly AlbumPhoto[]): number {
  const photo = nextPhoto(photos, game.album);
  return photo === null ? 0 : Math.max(0, photo.price - game.coins);
}

/** R-112 : achète la prochaine photo ; en cas de refus, renvoie le même objet. */
export function buyNextPhoto(game: GameState, photos: readonly AlbumPhoto[]): GameState {
  const photo = nextPhoto(photos, game.album);
  if (photo === null || game.coins < photo.price) return game;
  return Object.freeze({
    ...game,
    coins: game.coins - photo.price,
    album: Object.freeze([...game.album, photo.id]),
  });
}
