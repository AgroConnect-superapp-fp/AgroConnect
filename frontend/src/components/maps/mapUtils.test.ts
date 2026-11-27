import { describe, expect, it, vi } from 'vitest';
import L from '../../lib/leaflet';
import { findMarkerByCoordinates } from './mapUtils';

vi.mock('../../lib/leaflet', () => {
  class Marker {
    constructor(private readonly position: { lat: number; lng: number }) {}

    getLatLng(): { lat: number; lng: number } {
      return this.position;
    }
  }

  return { default: { Marker } };
});

interface MarkerLike {
  getLatLng: () => { lat: number; lng: number };
}

const MarkerClass = (
  L as unknown as { Marker: new (position: { lat: number; lng: number }) => MarkerLike }
).Marker;

describe('findMarkerByCoordinates', () => {
  it('encuentra el marcador dentro de la tolerancia e ignora otras capas', () => {
    const near = new MarkerClass({ lat: 4.53395, lng: -75.68115 });
    const far = new MarkerClass({ lat: 4.6, lng: -75.7 });
    const polygon = {};
    const map = {
      eachLayer: (callback: (layer: unknown) => void) => {
        [polygon, far, near].forEach(callback);
      },
    } as unknown as L.Map;

    expect(findMarkerByCoordinates(map, 4.5339, -75.6811, 0.001)).toBe(near);
  });

  it('devuelve null si ningún marcador está dentro de la tolerancia', () => {
    const far = new MarkerClass({ lat: 4.6, lng: -75.7 });
    const map = {
      eachLayer: (callback: (layer: unknown) => void) => {
        [far].forEach(callback);
      },
    } as unknown as L.Map;

    expect(findMarkerByCoordinates(map, 4.5339, -75.6811, 0.001)).toBeNull();
  });
});
