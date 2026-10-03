import { Request, Response } from 'express';
import { FindNearbyPlotsUseCase } from '../../application/useCases/FindNearbyPlotsUseCase';

export class PlotController {
  constructor(private readonly findNearbyPlotsUseCase: FindNearbyPlotsUseCase) {}

  async findNearby(req: Request, res: Response): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 10;

      const plots = await this.findNearbyPlotsUseCase.execute(lat, lng, radius);

      res.json({ success: true, data: plots });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Solicitud inválida';
      res.status(400).json({ success: false, message });
    }
  }
}
