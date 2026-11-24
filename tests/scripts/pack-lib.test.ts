import { describe, expect, it } from 'vitest';
import { traiterSaisie } from '../../scripts/pack.mjs';
import { verifierCode } from '../../scripts/pack-lib.mjs';

describe('verifierCode', () => {
  it('R-123 code de 4 mots accepté et normalisé', () => {
    expect(verifierCode('  Alpha Bravo-charlie_delta ')).toBe('alpha-bravo-charlie-delta');
  });

  it('R-123 moins de 4 mots refusé', () => {
    expect(() => verifierCode('alpha-bravo-charlie')).toThrow();
    expect(() => verifierCode('sardine')).toThrow();
    expect(() => verifierCode('')).toThrow();
  });

  it('R-123 moins de 16 caractères refusé même avec 4 mots', () => {
    expect(() => verifierCode('a-b-c-defghijkl')).toThrow(); // 15 caractères
    expect(verifierCode('a-b-c-defghijklm')).toBe('a-b-c-defghijklm'); // 16
  });

  it('R-123 caractères hors a-z et 0-9 refusés', () => {
    expect(() => verifierCode('œuf-ßtest-aaaa-bbbbbbbb')).toThrow();
    expect(() => verifierCode('alpha-bravo-charlie-delta!')).toThrow();
  });

  it('R-123 les deux codes publiés sont refusés pour un vrai pack', () => {
    expect(() => verifierCode('croquette-tempete-violon-sardine')).toThrow(/publié/);
    expect(() => verifierCode('Croquette Tempête violon Sardine')).toThrow(/publié/);
    expect(() => verifierCode('test-test-test-test')).toThrow(/publié/);
  });

  it('R-123 le code de test passe seulement avec autoriserCodeDeTest', () => {
    expect(verifierCode('test-test-test-test', { autoriserCodeDeTest: true })).toBe(
      'test-test-test-test',
    );
    // l'autorisation ne vaut pas pour l'exemple publié
    expect(() =>
      verifierCode('croquette-tempete-violon-sardine', { autoriserCodeDeTest: true }),
    ).toThrow(/publié/);
  });
});

describe('traiterSaisie', () => {
  it('R-121 saisie normale, retour arrière, Entrée', () => {
    expect(traiterSaisie('', 'abx\u007f')).toEqual({ saisie: 'ab', etat: 'suite' });
    expect(traiterSaisie('ab', 'c\r')).toEqual({ saisie: 'abc', etat: 'fin' });
  });

  it('R-121 Ctrl+C annule', () => {
    expect(traiterSaisie('ab', '\u0003').etat).toBe('annule');
  });

  it('R-121 séquences d’échappement et caractères de contrôle ignorés', () => {
    expect(traiterSaisie('', 'a\u001b[Ab\u001b[3~c\u0001\u0009d')).toEqual({
      saisie: 'abcd',
      etat: 'suite',
    });
  });
});
