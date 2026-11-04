import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { profileUpdateSchema, type ProfileUpdateInput } from '@agroconnect/contracts';
import { GetProfileUseCase } from '../../application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../application/use-cases/UpdateProfileUseCase';
import type { ProfileSnapshot } from '../../domain/interfaces/UserRepository';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';
import type { AuthenticatedRequest } from '../../../../shared/http/authenticated-user';
import { env } from '../../../../shared/config/env';
import { AuthThrottlerGuard } from '../guards/AuthThrottlerGuard';
import { SessionAuthGuard } from '../guards/SessionAuthGuard';

@Controller('profile')
@UseGuards(SessionAuthGuard)
export class ProfileController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  @Get('me')
  async getMine(@Req() request: AuthenticatedRequest): Promise<unknown> {
    const user = request.user!;
    const profile = await this.getProfileUseCase.execute(user.id);
    return success(toResponse(profile), 'Perfil obtenido correctamente');
  }

  @Patch('me')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({
    default: { limit: env.RATE_LIMIT_MAX_ATTEMPTS * 3, ttl: env.RATE_LIMIT_WINDOW_MS },
  })
  async updateMine(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(profileUpdateSchema)) body: ProfileUpdateInput,
  ): Promise<unknown> {
    const user = request.user!;
    const profile = await this.updateProfileUseCase.execute(
      { id: user.id, role: user.role },
      {
        ...(body.productor
          ? {
              producer: {
                farmName: body.productor.nombre,
                municipality: body.productor.municipio,
                village: body.productor.vereda,
                latitude: body.productor.latitud,
                longitude: body.productor.longitud,
              },
            }
          : {}),
        ...(body.empresa
          ? {
              company: {
                companyName: body.empresa.razonSocial,
                address: body.empresa.direccion,
                companyType: body.empresa.tipoEmpresa,
                department: body.empresa.departamento,
                municipality: body.empresa.municipio,
              },
            }
          : {}),
        ...(body.transportista
          ? {
              transporter: {
                vehicleType: body.transportista.tipoVehiculo,
                plate: body.transportista.placa,
                capacityKg: body.transportista.capacidadKg,
                coverageMunicipalities: body.transportista.cobertura,
                coldChain: body.transportista.cadenaFrio,
                soatExpiresAt: body.transportista.soatVence,
                licenseExpiresAt: body.transportista.licenciaVence,
              },
            }
          : {}),
      },
    );

    return success(toResponse(profile), 'Perfil actualizado correctamente');
  }
}

function toResponse(profile: ProfileSnapshot): unknown {
  return {
    usuario: profile.user,
    productor: profile.producer
      ? {
          nombre: profile.producer.farmName,
          municipio: profile.producer.municipality,
          vereda: profile.producer.village,
          latitud: profile.producer.latitude,
          longitud: profile.producer.longitude,
        }
      : undefined,
    empresa: profile.company
      ? {
          razonSocial: profile.company.companyName,
          nit: profile.company.nit,
          direccion: profile.company.address,
          tipoEmpresa: profile.company.companyType,
          departamento: profile.company.department,
          municipio: profile.company.municipality,
        }
      : undefined,
    transportista: profile.transporter
      ? {
          tipoVehiculo: profile.transporter.vehicleType,
          placa: profile.transporter.plate,
          capacidadKg: profile.transporter.capacityKg,
          cobertura: profile.transporter.coverageMunicipalities,
          cadenaFrio: profile.transporter.coldChain,
          soatVence: toDateOnly(profile.transporter.soatExpiresAt),
          licenciaVence: toDateOnly(profile.transporter.licenseExpiresAt),
        }
      : undefined,
  };
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
