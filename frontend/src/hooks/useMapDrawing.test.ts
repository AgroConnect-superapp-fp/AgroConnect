// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLeafletDraw } from './useLeafletDraw';
import { useMapDrawing } from './useMapDrawing';

vi.mock('./useLeafletDraw', () => ({
  useLeafletDraw: vi.fn(),
}));

const mockedUseLeafletDraw = vi.mocked(useLeafletDraw);

describe('useMapDrawing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delega la configuración en useLeafletDraw sin duplicar estado', () => {
    const onPolygonCreated = vi.fn();

    renderHook(() => useMapDrawing({ enabled: true, onPolygonCreated }));

    expect(mockedUseLeafletDraw).toHaveBeenCalledWith({
      enabled: true,
      onPolygonCreated,
    });
  });
});
