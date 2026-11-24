import { describe, expect, it, vi } from 'vitest';
import { createUpdateGate } from '../../src/ui/update-gate';

describe('porte de mise à jour (R-104)', () => {
  it('R-104 mise à jour sur le menu : appliquée tout de suite', () => {
    const apply = vi.fn();
    const gate = createUpdateGate({ apply });
    gate.menuShown();
    gate.needRefresh();
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('R-104 mise à jour pendant une partie : attend le menu', () => {
    const apply = vi.fn();
    const gate = createUpdateGate({ apply });
    gate.menuShown();
    gate.gameStarted();
    gate.needRefresh();
    expect(apply).not.toHaveBeenCalled();
    gate.menuShown();
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('R-104 pas de mise à jour en attente : rien', () => {
    const apply = vi.fn();
    const gate = createUpdateGate({ apply });
    gate.menuShown();
    gate.menuShown();
    gate.menuShown();
    expect(apply).not.toHaveBeenCalled();
  });

  it('R-104 apply une seule fois', () => {
    const apply = vi.fn();
    const gate = createUpdateGate({ apply });
    gate.menuShown();
    gate.needRefresh();
    gate.menuShown();
    gate.needRefresh();
    expect(apply).toHaveBeenCalledTimes(1);
  });
});
