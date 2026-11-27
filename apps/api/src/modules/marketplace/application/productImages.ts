import { DomainError } from '../../../shared/errors/errors';
import type { ProductImage } from '../domain/entities/Product';

export interface ImageActor {
  id: string;
  role: string;
}

/**
 * Normaliza las imágenes que un cliente puede persistir.
 *
 * - Un productor solo puede añadir imágenes de su propia carpeta firmada.
 * - Las imágenes ya existentes se conservan para permitir editar un producto
 *   legado sin perder sus referencias.
 * - `moderationStatus` es server-side: un productor no puede autodeclarar una
 *   imagen como aprobada.
 */
export function sanitizeProductImages(
  images: ProductImage[],
  actor: ImageActor,
  uploadFolder: string,
  existingPublicIds: Set<string> = new Set(),
): ProductImage[] {
  const baseFolder = `${uploadFolder.replace(/\/+$/, '')}/${actor.id}/`;

  return images.map((image) => {
    const isExisting = existingPublicIds.has(image.publicId);
    if (actor.role !== 'administrador') {
      if (!isExisting && !image.publicId.startsWith(baseFolder)) {
        throw new DomainError(
          'FORBIDDEN',
          'La imagen no pertenece a la carpeta del productor autenticado',
          403,
        );
      }

      return isExisting ? image : { ...image, moderationStatus: 'pending' as const };
    }

    return image;
  });
}
