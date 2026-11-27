// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Map as LeafletMap } from 'leaflet';
import type { Property } from '../types/property';
import { MAP_CONSTANTS } from '../components/maps/mapConstants';
import { findMarkerByCoordinates } from '../components/maps/mapUtils';
import { usePropertySelection } from './usePropertySelection';

vi.mock('../components/maps/mapUtils', () => ({
  findMarkerByCoordinates: vi.fn(),
}));

const mockedFindMarker = vi.mocked(findMarkerByCoordinates);

const property: Property = {
  id: 'p-1',
  name: 'Finca La Esperanza',
  owner: 'María López',
  department: 'Quindío',
  municipality: 'Armenia',
  crop: 'coffee',
  area: 3.5,
  productivity: 82,
  lat: 4.5339,
  lng: -75.6811,
};

interface HookProps {
  properties: Property[];
  showProductiveZones: boolean;
  enableDrawing: boolean;
}

function renderSelection(
  initialProps: HookProps = {
    properties: [property],
    showProductiveZones: false,
    enableDrawing: false,
  }
) {
  const map = {} as LeafletMap;
  const mapRef: { current: LeafletMap | null } = { current: map };

  return {
    map,
    ...renderHook(
      (props: HookProps) =>
        usePropertySelection({
          mapRef,
          properties: props.properties,
          showProductiveZones: props.showProductiveZones,
          enableDrawing: props.enableDrawing,
        }),
      { initialProps }
    ),
  };
}

describe('usePropertySelection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('restaura el popup de la propiedad seleccionada tras cambiar capas', () => {
    const marker = { openPopup: vi.fn() };
    mockedFindMarker.mockReturnValue(marker as never);
    const { result, rerender, map } = renderSelection();

    act(() => result.current.handlePopupOpen(property.id));
    rerender({
      properties: [property],
      showProductiveZones: true,
      enableDrawing: false,
    });
    act(() => vi.advanceTimersByTime(100));

    expect(mockedFindMarker).toHaveBeenCalledWith(
      map,
      property.lat,
      property.lng,
      MAP_CONSTANTS.COORDINATE_TOLERANCE
    );
    expect(marker.openPopup).toHaveBeenCalledTimes(1);
  });

  it('no busca marcador si no hay popup seleccionado', () => {
    const { rerender } = renderSelection();

    rerender({
      properties: [property],
      showProductiveZones: true,
      enableDrawing: false,
    });
    act(() => vi.advanceTimersByTime(100));

    expect(mockedFindMarker).not.toHaveBeenCalled();
  });

  it('no restaura si la propiedad seleccionada ya no existe', () => {
    const { result, rerender } = renderSelection();

    act(() => result.current.handlePopupOpen(property.id));
    rerender({
      properties: [],
      showProductiveZones: true,
      enableDrawing: false,
    });
    act(() => vi.advanceTimersByTime(100));

    expect(mockedFindMarker).not.toHaveBeenCalled();
  });

  it('olvida la selección al cerrar el popup', () => {
    const { result, rerender } = renderSelection();

    act(() => result.current.handlePopupOpen(property.id));
    act(() => result.current.handlePopupClose());
    rerender({
      properties: [property],
      showProductiveZones: true,
      enableDrawing: false,
    });
    act(() => vi.advanceTimersByTime(100));

    expect(mockedFindMarker).not.toHaveBeenCalled();
  });

  it('cancela la restauración pendiente al desmontar', () => {
    const marker = { openPopup: vi.fn() };
    mockedFindMarker.mockReturnValue(marker as never);
    const { result, rerender, unmount } = renderSelection();

    act(() => result.current.handlePopupOpen(property.id));
    rerender({
      properties: [property],
      showProductiveZones: true,
      enableDrawing: false,
    });
    unmount();
    act(() => vi.advanceTimersByTime(100));

    expect(marker.openPopup).not.toHaveBeenCalled();
  });
});
