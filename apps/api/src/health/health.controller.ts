import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sondas de salud.
 *
 * - `GET /health` (liveness): solo confirma que el proceso responde. Es el
 *   `healthCheckPath` de Render y NO toca la base de datos: un fallo de la DB
 *   no debe provocar reinicios en bucle del servicio.
 * - `GET /health/ready` (readiness): ejecuta `SELECT 1` contra PostgreSQL.
 *   Devuelve 200 si la DB responde y 503 si no. Es la sonda que debe usar el
 *   monitoreo para detectar una base caída o un `DATABASE_SCHEMA` inexistente.
 *
 * El contrato de `/health` se mantiene idéntico al del backend legacy.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  check(): { status: string; service: string } {
    return {
      status: 'ok',
      service: 'agroconnect-api',
    };
  }

  @Get('ready')
  async ready(
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ status: string; service: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'agroconnect-api',
        database: 'up',
      };
    } catch {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        status: 'error',
        service: 'agroconnect-api',
        database: 'down',
      };
    }
  }
}
