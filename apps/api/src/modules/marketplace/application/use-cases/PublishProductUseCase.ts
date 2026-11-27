import { DomainError } from '../../../../shared/errors/errors';
import type {
  Product,
  ProductCertification,
  ProductCrop,
  ProductImage,
} from '../../domain/entities/Product';
import type { ProductRepository } from '../../domain/interfaces/ProductRepository';
import { sanitizeProductImages } from '../productImages';

export interface ProductActor {
  id: string;
  fullName: string;
  role: string;
}

export interface PublishProductCommand {
  name: string;
  owner?: string;
  description?: string;
  contact?: string;
  department: string;
  municipality: string;
  crop: ProductCrop;
  area: number;
  productivity: number;
  certification?: ProductCertification;
  lat: number;
  lng: number;
  images: ProductImage[];
  coordinates: [number, number][];
}

/**
 * Publica un producto en nombre del productor autenticado.
 *
 * El `producerId` se toma del actor, nunca del cuerpo de la petición: así un
 * cliente no puede publicar a nombre de otro usuario. La barrera primaria de
 * entrada es el contrato Zod; este caso de uso repite las reglas esenciales
 * para proteger el dominio si se invoca desde otro adaptador.
 */
export class PublishProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly uploadFolder = 'agroconnect/products',
  ) {}

  async execute(actor: ProductActor, command: PublishProductCommand): Promise<Product> {
    if (actor.role !== 'productor' && actor.role !== 'administrador') {
      throw new DomainError(
        'FORBIDDEN',
        'Solo un productor autenticado puede publicar productos',
        403,
      );
    }

    if (!Number.isFinite(command.area) || command.area <= 0 || command.area > 100_000) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El área debe estar entre 0 y 100000 hectáreas',
        422,
      );
    }

    if (
      !Number.isInteger(command.productivity) ||
      command.productivity < 0 ||
      command.productivity > 100
    ) {
      throw new DomainError('VALIDATION_ERROR', 'La productividad debe estar entre 0 y 100', 422);
    }

    if (
      !Number.isFinite(command.lat) ||
      !Number.isFinite(command.lng) ||
      command.lat < -90 ||
      command.lat > 90 ||
      command.lng < -180 ||
      command.lng > 180
    ) {
      throw new DomainError('VALIDATION_ERROR', 'Coordenadas inválidas', 422);
    }

    if (command.images.length > 6) {
      throw new DomainError('VALIDATION_ERROR', 'Máximo 6 imágenes por producto', 422);
    }

    return this.productRepository.create({
      name: command.name,
      owner: command.owner?.trim() || actor.fullName,
      description: command.description,
      contact: command.contact,
      department: command.department,
      municipality: command.municipality,
      crop: command.crop,
      area: command.area,
      productivity: command.productivity,
      certification: command.certification,
      lat: command.lat,
      lng: command.lng,
      producerId: actor.id,
      images: sanitizeProductImages(command.images, actor, this.uploadFolder),
      coordinates: command.coordinates,
    });
  }
}
