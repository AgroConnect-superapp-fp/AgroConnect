import { Router } from 'express';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { asyncHandler } from '../../../../shared/presentation/middleware/asyncHandler';
import { PrismaPlotRepository } from '../../infrastructure/repositories/PrismaPlotRepository';
import { FindNearbyPlotsUseCase } from '../../application/useCases/FindNearbyPlotsUseCase';
import { PlotController } from '../controllers/PlotController';

const router = Router();

const plotRepository = new PrismaPlotRepository(prisma);
const findNearbyPlotsUseCase = new FindNearbyPlotsUseCase(plotRepository);
const plotController = new PlotController(findNearbyPlotsUseCase);

router.get(
  '/plots/nearby',
  asyncHandler((req, res) => plotController.findNearby(req, res)),
);

export default router;
