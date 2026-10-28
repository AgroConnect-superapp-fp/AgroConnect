import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

/**
 * Sonda de salud (SPEC §10 y `render.yaml` → `healthCheckPath: /health`).
 *
 * Mismo contrato que el backend legacy (`backend/src/app.ts`):
 * `GET /health` → 200 `{ "status": "ok", "service": "agroconnect-api" }`.
 * La ruta queda FUERA del prefijo global `/api/v1`.
 */
@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): { status: string; service: string } {
    return {
      status: 'ok',
      service: 'agroconnect-api',
    };
  }
}
