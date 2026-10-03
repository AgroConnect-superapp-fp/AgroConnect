import type { Request, Response } from 'express';
import { PlotController } from '../../../src/modules/geography/presentation/controllers/PlotController';
import type { FindNearbyPlotsUseCase } from '../../../src/modules/geography/application/useCases/FindNearbyPlotsUseCase';

function mockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function buildController(): { controller: PlotController; execute: jest.Mock } {
  const execute = jest.fn();
  const useCase = { execute } as unknown as FindNearbyPlotsUseCase;
  return { controller: new PlotController(useCase), execute };
}

describe('PlotController.findNearby', () => {
  it('responde 200 con las parcelas cercanas', async () => {
    const { controller, execute } = buildController();
    const plots = [{ id: 'plot-1' }];
    execute.mockResolvedValue(plots);
    const req = { query: { lat: '4.5339', lng: '-75.6811', radius: '5' } } as unknown as Request;
    const res = mockResponse();

    await controller.findNearby(req, res);

    expect(execute).toHaveBeenCalledWith(4.5339, -75.6811, 5);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: plots });
  });

  it('usa un radio por defecto de 10 km cuando no se envía', async () => {
    const { controller, execute } = buildController();
    execute.mockResolvedValue([]);
    const req = { query: { lat: '4.5339', lng: '-75.6811' } } as unknown as Request;

    await controller.findNearby(req, mockResponse());

    expect(execute).toHaveBeenCalledWith(4.5339, -75.6811, 10);
  });

  it('responde 400 cuando el caso de uso rechaza la solicitud', async () => {
    const { controller, execute } = buildController();
    execute.mockRejectedValue(new Error('Coordenadas inválidas'));
    const req = { query: { lat: 'x', lng: 'y' } } as unknown as Request;
    const res = mockResponse();

    await controller.findNearby(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Coordenadas inválidas',
    });
  });

  it('responde 400 con mensaje genérico si el error no es instancia de Error', async () => {
    const { controller, execute } = buildController();
    execute.mockRejectedValue('fallo desconocido');
    const req = { query: { lat: '4.5', lng: '-75.6' } } as unknown as Request;
    const res = mockResponse();

    await controller.findNearby(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Solicitud inválida',
    });
  });
});
