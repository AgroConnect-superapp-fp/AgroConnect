import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global de persistencia.
 *
 * Se registra como provider global para que cualquier módulo pueda inyectar
 * `PrismaService` sin reimportar el módulo. La capa de aplicación y de
 * dominio NUNCA lo usan directamente: reciben interfaces de repositorio
 * (Clean Architecture), y es la capa de infraestructura la que implementa esas
 * interfaces sobre Prisma.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
