// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMap } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { useMapViewport } from './useMapViewport';

vi.mock('react-leaflet', () => ({
  useMap: vi.fn(),
}));

const mockedUseMap = vi.mocked(useMap);

interface ZoomControlMock {
  disable: ReturnType<typeof vi.fn>;
  enable: ReturnType<typeof vi.fn>;
}

interface FakeMap {
  map: LeafletMap;
  container: HTMLDivElement;
  handlers: Map<string, () => void>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  zoomControls: ZoomControlMock[];
}

function createFakeMap(): FakeMap {
  const container = document.createElement('div');
  const handlers = new Map<string, () => void>();
  const zoomControls: ZoomControlMock[] = [
    { disable: vi.fn(), enable: vi.fn() },
    { disable: vi.fn(), enable: vi.fn() },
    { disable: vi.fn(), enable: vi.fn() },
    { disable: vi.fn(), enable: vi.fn() },
  ];

  const on = vi.fn((event: string, handler: () => void) => {
    handlers.set(event, handler);
  });
  const off = vi.fn((event: string) => {
    handlers.delete(event);
  });

  const map = {
    getContainer: () => container,
    on,
    off,
    scrollWheelZoom: zoomControls[0],
    doubleClickZoom: zoomControls[1],
    touchZoom: zoomControls[2],
    boxZoom: zoomControls[3],
  } as unknown as LeafletMap;

  return { map, container, handlers, on, off, zoomControls };
}

describe('useMapViewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('captura la instancia del mapa en el ref compartido', () => {
    const fake = createFakeMap();
    mockedUseMap.mockReturnValue(fake.map);
    const mapRef: { current: LeafletMap | null } = { current: null };

    renderHook(() => useMapViewport(mapRef));

    expect(mapRef.current).toBe(fake.map);
    expect(fake.on).toHaveBeenCalledWith('popupopen', expect.any(Function));
    expect(fake.on).toHaveBeenCalledWith('popupclose', expect.any(Function));
  });

  it('bloquea el zoom al abrir un popup y lo restaura al cerrarlo', () => {
    const fake = createFakeMap();
    mockedUseMap.mockReturnValue(fake.map);
    const mapRef: { current: LeafletMap | null } = { current: null };

    renderHook(() => useMapViewport(mapRef));

    act(() => fake.handlers.get('popupopen')?.());
    expect(fake.container.getAttribute('data-popup-open')).toBe('true');
    fake.zoomControls.forEach((control) => {
      expect(control.disable).toHaveBeenCalledTimes(1);
    });

    act(() => fake.handlers.get('popupclose')?.());
    expect(fake.container.hasAttribute('data-popup-open')).toBe(false);
    fake.zoomControls.forEach((control) => {
      expect(control.enable).toHaveBeenCalledTimes(1);
    });
  });

  it('limpia listeners y reactiva el zoom al desmontar', () => {
    const fake = createFakeMap();
    mockedUseMap.mockReturnValue(fake.map);
    const mapRef: { current: LeafletMap | null } = { current: null };

    const { unmount } = renderHook(() => useMapViewport(mapRef));
    unmount();

    expect(fake.off).toHaveBeenCalledWith('popupopen', expect.any(Function));
    expect(fake.off).toHaveBeenCalledWith('popupclose', expect.any(Function));
    fake.zoomControls.forEach((control) => {
      expect(control.enable).toHaveBeenCalled();
    });
  });
});
