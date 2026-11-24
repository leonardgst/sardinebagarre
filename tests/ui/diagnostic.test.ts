import { describe, expect, it } from 'vitest';
import { formatOfflineInfo, type OfflineInfo } from '../../src/ui/diagnostic';

const base: OfflineInfo = {
  hasServiceWorker: true,
  controlled: true,
  mode: 'app',
  page: '/sardinebagarre/',
  scope: 'https://x/sardinebagarre/',
  workerState: 'active',
  cacheCount: 9,
};

describe('diagnostic hors ligne', () => {
  it('ADR-001 diagnostic : page contrôlée → actif', () => {
    const [l1, l2] = formatOfflineInfo(base);
    expect(l1).toBe('Hors ligne : actif');
    expect(l2).toContain('app');
    expect(l2).toContain('portée /sardinebagarre/');
    expect(l2).toContain('réserve 9');
    expect(l2).toContain('sw active');
    expect(l2).toContain('page /sardinebagarre/');
  });

  it('ADR-001 diagnostic : enregistré mais non contrôlé → pas encore prêt', () => {
    const [l1] = formatOfflineInfo({ ...base, controlled: false, mode: 'navigateur' });
    expect(l1).toBe('Hors ligne : pas encore prêt');
  });

  it('ADR-001 diagnostic : sans service worker → indisponible', () => {
    const lignes = formatOfflineInfo({
      ...base,
      hasServiceWorker: false,
      controlled: false,
      scope: null,
      workerState: 'aucun',
    });
    expect(lignes[0]).toBe('Hors ligne : indisponible');
    expect(lignes[1]).toContain('portée aucune');
  });

  it('ADR-001 diagnostic : valeur illisible → ?', () => {
    const [, l2] = formatOfflineInfo({ ...base, cacheCount: '?' });
    expect(l2).toContain('réserve ?');
  });
});
