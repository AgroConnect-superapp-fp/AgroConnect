// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Property } from '../../types/property';
import {
  clearSearchInput,
  CombinedSearchProvider,
  findPropertyByName,
  flyToAndOpenPopup,
  flyToPlace,
} from './mapSearchUtils';

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

vi.mock('./mapUtils', () => ({ findMarkerByCoordinates: vi.fn() }));

const fetchMock = vi.fn();

describe('findPropertyByName', () => {
  it('encuentra por nombre sin distinguir mayúsculas', () => {
    expect(findPropertyByName('🌱 finca la esperanza - Armenia', [property])).toBe(
      property
    );
  });

  it('devuelve null cuando no hay coincidencia', () => {
    expect(findPropertyByName('🌱 Otra finca', [property])).toBeNull();
  });
});

describe('CombinedSearchProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('combina propiedades locales con lugares de Nominatim', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: '4.5339',
          lon: '-75.6811',
          display_name: 'Armenia, Quindío, Colombia',
          type: 'city',
        },
      ],
    });

    const results = await new CombinedSearchProvider([property]).search({
      query: 'armenia',
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      x: property.lng,
      y: property.lat,
      raw: { type: 'property', data: property },
    });
    expect(results[1]).toMatchObject({
      x: -75.6811,
      y: 4.5339,
      raw: { type: 'place' },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('q=armenia'),
      expect.objectContaining({
        headers: { 'User-Agent': 'AgroConnect/1.0 (SENA Project)' },
      })
    );
  });

  it('no consulta Nominatim si la búsqueda está vacía', async () => {
    const results = await new CombinedSearchProvider([property]).search({
      query: '   ',
    });

    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mantiene las coincidencias locales si Nominatim falla', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fetchMock.mockRejectedValue(new Error('sin red'));

    const results = await new CombinedSearchProvider([property]).search({
      query: 'finca',
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.raw.type).toBe('property');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('ignora la respuesta de Nominatim cuando no es OK', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => [] });

    const results = await new CombinedSearchProvider([property]).search({
      query: 'finca',
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.raw.type).toBe('property');
  });
});

describe('controles del mapa', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('limpia el input y el dropdown de búsqueda', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.value = 'café';
    const results = document.createElement('div');
    results.className = 'results';
    const wrapper = document.createElement('div');
    wrapper.className = 'leaflet-control-geosearch';
    wrapper.append(input, results);
    container.append(wrapper);

    clearSearchInput(container);

    expect(input.value).toBe('');
    vi.advanceTimersByTime(60);
    expect(results.innerHTML).toBe('');
  });

  it('vuela a un lugar y limpia la búsqueda', () => {
    const container = document.createElement('div');
    const map = {
      getContainer: () => container,
      flyTo: vi.fn(),
    } as unknown as L.Map;

    flyToPlace(map, 4.53, -75.68, 12);

    expect(map.flyTo).toHaveBeenCalledWith([4.53, -75.68], 12, { duration: 1.2 });
  });

  it('vuela a una propiedad y abre su popup', async () => {
    const container = document.createElement('div');
    const marker = { openPopup: vi.fn(), fire: vi.fn() };
    const map = {
      getContainer: () => container,
      flyTo: vi.fn(),
      closePopup: vi.fn(),
      eachLayer: vi.fn(),
    } as unknown as L.Map;

    const { findMarkerByCoordinates } = await import('./mapUtils');
    vi.mocked(findMarkerByCoordinates).mockReturnValue(marker as never);

    const onPopupOpen = vi.fn();
    flyToAndOpenPopup(map, property, { current: true }, onPopupOpen);

    vi.advanceTimersByTime(1800);
    vi.advanceTimersByTime(250);

    expect(map.flyTo).toHaveBeenCalled();
    expect(marker.openPopup).toHaveBeenCalled();
    expect(onPopupOpen).toHaveBeenCalledWith('p-1');
  });
});
