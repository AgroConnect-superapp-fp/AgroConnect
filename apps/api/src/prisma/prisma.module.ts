import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Módulo global de persistencia.
 *
 * Se registra como provider global para que cualquier módulo pueda inyectar
 * `PrismaService` sin reimportar el módulo. La capa de aplicación y de
 * dominio NUNCA lo usan directamente: reciben interfaces de repositorio
 * (Clean Architecture), y es la capa de infraestructura la que implementa esas
 * interfaces sobre Prisma.
 *
 * `PrismaClient` se exporta además como alias de `PrismaService`: los
 * repositoriosported del backend legacy tipan su dependencia como
 * `PrismaClient` (el tipo base del cliente generado), y así pueden inyectarse
 * sin modificar una línea de ese código copiado.
 */
@Global()
@Module({
  providers: [PrismaService, { provide: PrismaClient, useExisting: PrismaService }],
  exports: [PrismaService, PrismaClient],
})
export class PrismaModule {}
