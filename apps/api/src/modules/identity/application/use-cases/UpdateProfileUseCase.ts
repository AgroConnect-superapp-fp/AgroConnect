import { DomainError } from '../../../../shared/errors/errors';
import { ProducerProfile } from '../../domain/entities/ProducerProfile';
import { CompanyProfile } from '../../domain/entities/CompanyProfile';
import { TransporterProfile } from '../../domain/entities/TransporterProfile';
import type { VehicleType } from '../../domain/entities/TransporterProfile';
import type { CompanyType } from '../../domain/entities/CompanyProfile';
import type { ProfileSnapshot, UserRepository } from '../../domain/interfaces/UserRepository';
import { InvalidDataError } from '../../domain/errors/AuthErrors';

export interface UpdateProfileActor {
  id: string;
  role: string;
}

export interface UpdateProfileCommand {
  producer?: {
    farmName?: string;
    municipality?: string;
    village?: string;
    latitude?: number;
    longitude?: number;
  };
  company?: {
    companyName?: string;
    address?: string;
    companyType?: CompanyType;
    department?: string;
    municipality?: string;
  };
  transporter?: {
    vehicleType?: VehicleType;
    plate?: string;
    capacityKg?: number;
    coverageMunicipalities?: string[];
    coldChain?: boolean;
    soatExpiresAt?: string;
    licenseExpiresAt?: string;
  };
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    actor: UpdateProfileActor,
    command: UpdateProfileCommand,
  ): Promise<ProfileSnapshot> {
    const blocks = [command.producer, command.company, command.transporter].filter(Boolean);
    if (blocks.length !== 1) {
      throw new InvalidDataError('Solo puedes actualizar el perfil correspondiente a tu rol');
    }

    const current = await this.userRepository.findProfileById(actor.id);
    if (!current) {
      throw new DomainError('NOT_FOUND', 'No se encontró el perfil del usuario', 404);
    }

    if (actor.role === 'productor') {
      if (!command.producer) {
        throw new DomainError('FORBIDDEN', 'Solo puedes actualizar el perfil de productor', 403);
      }
      await this.updateProducer(actor.id, current, command.producer);
    } else if (actor.role === 'comprador_b2b') {
      if (!command.company) {
        throw new DomainError('FORBIDDEN', 'Solo puedes actualizar el perfil de empresa', 403);
      }
      await this.updateCompany(actor.id, current, command.company);
    } else if (actor.role === 'transportista') {
      if (!command.transporter) {
        throw new DomainError(
          'FORBIDDEN',
          'Solo puedes actualizar el perfil de transportista',
          403,
        );
      }
      await this.updateTransporter(actor.id, current, command.transporter);
    } else {
      throw new DomainError('FORBIDDEN', 'Tu rol no tiene un perfil editable en esta versión', 403);
    }

    const updated = await this.userRepository.findProfileById(actor.id);
    if (!updated) {
      throw new DomainError('NOT_FOUND', 'No se encontró el perfil del usuario', 404);
    }
    return updated;
  }

  private async updateProducer(
    userId: string,
    current: ProfileSnapshot,
    update: UpdateProfileCommand['producer'],
  ): Promise<void> {
    if (!current.producer) {
      throw new DomainError('NOT_FOUND', 'No se encontró el perfil de productor', 404);
    }
    if (!update) {
      throw new InvalidDataError('Envía al menos un campo del perfil de productor');
    }

    if ((update.latitude === undefined) !== (update.longitude === undefined)) {
      throw new InvalidDataError('Debes enviar latitud y longitud juntas');
    }

    const merged = {
      farmName: update.farmName ?? current.producer.farmName,
      municipality: update.municipality ?? current.producer.municipality,
      village: update.village ?? current.producer.village,
      latitude: update.latitude ?? current.producer.latitude,
      longitude: update.longitude ?? current.producer.longitude,
    };

    ProducerProfile.create({ id: 'profile', userId, ...merged });

    await this.userRepository.updateProducerProfile(userId, {
      ...(update.farmName !== undefined ? { farmName: update.farmName } : {}),
      ...(update.municipality !== undefined ? { municipality: update.municipality } : {}),
      ...(update.village !== undefined ? { village: update.village } : {}),
      ...(merged.latitude !== undefined && merged.longitude !== undefined
        ? { latitude: merged.latitude, longitude: merged.longitude }
        : {}),
    });
  }

  private async updateCompany(
    userId: string,
    current: ProfileSnapshot,
    update: UpdateProfileCommand['company'],
  ): Promise<void> {
    if (!current.company) {
      throw new DomainError('NOT_FOUND', 'No se encontró el perfil de empresa', 404);
    }
    if (!update) {
      throw new InvalidDataError('Envía al menos un campo del perfil de empresa');
    }

    const merged = {
      companyName: update.companyName ?? current.company.companyName,
      nit: current.company.nit,
      address: update.address ?? current.company.address,
      companyType: update.companyType ?? current.company.companyType,
      department: update.department ?? current.company.department,
      municipality: update.municipality ?? current.company.municipality,
    };

    CompanyProfile.create({ id: 'profile', userId, ...merged });

    await this.userRepository.updateCompanyProfile(userId, {
      ...(update.companyName !== undefined ? { companyName: update.companyName } : {}),
      ...(update.address !== undefined ? { address: update.address } : {}),
      ...(update.companyType !== undefined ? { companyType: update.companyType } : {}),
      ...(update.department !== undefined ? { department: update.department } : {}),
      ...(update.municipality !== undefined ? { municipality: update.municipality } : {}),
    });
  }

  private async updateTransporter(
    userId: string,
    current: ProfileSnapshot,
    update: UpdateProfileCommand['transporter'],
  ): Promise<void> {
    if (!current.transporter) {
      throw new DomainError('NOT_FOUND', 'No se encontró el perfil de transportista', 404);
    }
    if (!update) {
      throw new InvalidDataError('Envía al menos un campo del perfil de transportista');
    }

    const merged = {
      vehicleType: update.vehicleType ?? current.transporter.vehicleType,
      plate: update.plate ?? current.transporter.plate,
      capacityKg: update.capacityKg ?? current.transporter.capacityKg,
      coverageMunicipalities:
        update.coverageMunicipalities ?? current.transporter.coverageMunicipalities,
      coldChain: update.coldChain ?? current.transporter.coldChain,
      soatExpiresAt: update.soatExpiresAt
        ? parseDate(update.soatExpiresAt, 'SOAT')
        : current.transporter.soatExpiresAt,
      licenseExpiresAt: update.licenseExpiresAt
        ? parseDate(update.licenseExpiresAt, 'licencia')
        : current.transporter.licenseExpiresAt,
    };

    TransporterProfile.create({ id: 'profile', userId, ...merged });

    await this.userRepository.updateTransporterProfile(userId, {
      ...(update.vehicleType !== undefined ? { vehicleType: update.vehicleType } : {}),
      ...(update.plate !== undefined ? { plate: update.plate.toUpperCase() } : {}),
      ...(update.capacityKg !== undefined ? { capacityKg: update.capacityKg } : {}),
      ...(update.coverageMunicipalities !== undefined
        ? { coverageMunicipalities: update.coverageMunicipalities }
        : {}),
      ...(update.coldChain !== undefined ? { coldChain: update.coldChain } : {}),
      ...(update.soatExpiresAt !== undefined ? { soatExpiresAt: merged.soatExpiresAt } : {}),
      ...(update.licenseExpiresAt !== undefined
        ? { licenseExpiresAt: merged.licenseExpiresAt }
        : {}),
    });
  }
}

function parseDate(value: string, label: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 23, 59, 59, 999));
  const isValid =
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 1) - 1 &&
    date.getUTCDate() === day;

  if (!isValid) {
    throw new InvalidDataError(`La fecha de ${label} no es válida`);
  }
  return date;
}
