import { FindNearbyPlotsUseCase } from '../../../src/modules/geography/application/useCases/FindNearbyPlotsUseCase';
import type { PlotRepository } from '../../../src/modules/geography/domain/interfaces/PlotRepository';
import { Plot } from '../../../src/modules/geography/domain/entities/Plot';

function fakeRepository(): jest.Mocked<PlotRepository> {
  return {
    findById: jest.fn(),
    findNearby: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
  };
}

describe('FindNearbyPlotsUseCase', () => {
  it('delega la búsqueda al repositorio con latitud, longitud y radio', async () => {
    const repository = fakeRepository();
    const expected = [new Plot('plot-1', 'Lote', 1, 'Salento', 'Quindío', 'farmer-1')];
    repository.findNearby.mockResolvedValue(expected);
    const useCase = new FindNearbyPlotsUseCase(repository);

    const result = await useCase.execute(4.5339, -75.6811, 10);

    expect(repository.findNearby).toHaveBeenCalledWith(4.5339, -75.6811, 10);
    expect(result).toBe(expected);
  });

  it.each([
    [91, 0],
    [-91, 0],
    [0, 181],
    [0, -181],
  ])('rechaza coordenadas fuera de rango (%s, %s)', async (lat, lng) => {
    const repository = fakeRepository();
    const useCase = new FindNearbyPlotsUseCase(repository);

    await expect(useCase.execute(lat, lng, 10)).rejects.toThrow('Coordenadas inválidas');
    expect(repository.findNearby).not.toHaveBeenCalled();
  });

  it.each([0, -5, 101])('rechaza radios fuera del rango permitido (%s km)', async (radius) => {
    const repository = fakeRepository();
    const useCase = new FindNearbyPlotsUseCase(repository);

    await expect(useCase.execute(4.5339, -75.6811, radius)).rejects.toThrow(
      'El radio debe ser entre 0 y 100 km',
    );
    expect(repository.findNearby).not.toHaveBeenCalled();
  });

  it('acepta los límites del rango (100 km)', async () => {
    const repository = fakeRepository();
    const useCase = new FindNearbyPlotsUseCase(repository);

    await useCase.execute(4.5339, -75.6811, 100);

    expect(repository.findNearby).toHaveBeenCalledWith(4.5339, -75.6811, 100);
  });
});
