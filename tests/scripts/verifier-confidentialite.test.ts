import { describe, expect, it } from 'vitest';
import { findViolations } from '../../scripts/verifier-confidentialite.mjs';

const svgSain = () => '<svg><circle r="5"/></svg>';
const octets = (s: string, ...suite: number[]) =>
  new Uint8Array([...[...s].map((c) => c.charCodeAt(0)), ...suite]);

describe('verifier-confidentialite', () => {
  it('R-127 fichiers autorisés → aucune violation', () => {
    const paths = [
      'src/ui/main.ts',
      'public/icons/icone-512.png',
      'src/ui/art/chien.svg',
      'index.html',
    ];
    expect(findViolations(paths, null, svgSain)).toEqual([]);
  });

  it('R-127 SVG vectoriel accepté hors des dossiers autorisés', () => {
    expect(findViolations(['src/ui/logo.svg'], null, svgSain)).toEqual([]);
  });

  it('R-127 SVG contenant data:image/ → violation', () => {
    const r = findViolations(
      ['src/ui/logo.svg'],
      null,
      () => '<svg><use href="data:image/png;base64,AAAA"/></svg>',
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toContain('src/ui/logo.svg');
    expect(r[0]).toContain('data:image/');
  });

  it('R-127 SVG contenant une balise <image → violation', () => {
    const r = findViolations(
      ['docs/schema.svg'],
      null,
      () => '<svg><IMAGE href="photo.jpg"/></svg>',
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toContain('docs/schema.svg');
    expect(r[0]).toContain('<image');
  });

  it('R-127 SVG avec image intégrée refusé même dans src/ui/art/', () => {
    const r = findViolations(
      ['src/ui/art/chien.svg'],
      null,
      () => '<svg><image href="data:image/jpeg;base64,AAAA"/></svg>',
    );
    expect(r).toHaveLength(1);
  });

  it('R-127 SVG de prive/ signalé sans être lu', () => {
    const r = findViolations(['prive/tete.svg'], null, () => {
      throw new Error('lecture interdite');
    });
    expect(r).toHaveLength(1);
    expect(r[0]).toContain('prive/tete.svg');
  });

  it('R-127 image hors des dossiers autorisés → violation', () => {
    const r = findViolations(['src/photo.jpg'], null, svgSain);
    expect(r).toHaveLength(1);
    expect(r[0]).toContain('src/photo.jpg');
  });

  it('R-127 extension en majuscules détectée', () => {
    expect(findViolations(['docs/IMG_0001.HEIC'], null, svgSain)).toHaveLength(1);
  });

  it('R-127 son hors des dossiers autorisés → violation', () => {
    expect(findViolations(['src/ui/aboiement.m4a'], null, svgSain)).toHaveLength(1);
  });

  it('R-127 dossier voisin public/icons-bis/ refusé', () => {
    expect(findViolations(['public/icons-bis/a.png'], null, svgSain)).toHaveLength(1);
  });

  it('R-127 fichier de prive/ suivi → violation', () => {
    const r = findViolations(['prive/pack.json'], null, svgSain);
    expect(r).toHaveLength(1);
    expect(r[0]).toContain('prive/pack.json');
  });

  it('R-127 plusieurs problèmes → un message chacun', () => {
    expect(findViolations(['a.png', 'prive/x.txt', 'b.wav'], null, svgSain)).toHaveLength(3);
  });

  it('R-127 pack absent → aucune violation', () => {
    expect(findViolations([], null, svgSain)).toEqual([]);
  });

  it('R-127 pack avec en-tête SBPACK1 → aucune violation', () => {
    expect(findViolations(['public/pack/pack.bin'], octets('SBPACK1', 1, 2, 3), svgSain)).toEqual(
      [],
    );
  });

  it('R-127 pack sans en-tête SBPACK1 → violation', () => {
    const r = findViolations(['public/pack/pack.bin'], octets('XXPACK1'), svgSain);
    expect(r).toHaveLength(1);
    expect(r[0]).toContain('SBPACK1');
  });

  it('R-127 pack trop court → violation', () => {
    expect(findViolations(['public/pack/pack.bin'], octets('SB'), svgSain)).toHaveLength(1);
  });
});
