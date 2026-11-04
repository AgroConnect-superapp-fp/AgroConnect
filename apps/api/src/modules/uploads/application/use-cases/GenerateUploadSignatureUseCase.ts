import { createHash } from 'node:crypto';
import { DomainError } from '../../../../shared/errors/errors';

export interface UploadActor {
  id: string;
  role: string;
}

export interface CloudinaryUploadConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  folder: string;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string[];
  maxBytes: number;
}

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Emite una firma de subida directa a Cloudinary.
 *
 * La firma incluye `timestamp`, `folder` y `allowed_formats`; el cliente debe
 * enviar exactamente esos parámetros junto con `api_key` y la firma. El
 * `api_secret` permanece exclusivamente en el servidor.
 */
export class GenerateUploadSignatureUseCase {
  constructor(private readonly config: CloudinaryUploadConfig) {}

  execute(actor: UploadActor): UploadSignature {
    if (actor.role !== 'productor' && actor.role !== 'administrador') {
      throw new DomainError(
        'FORBIDDEN',
        'Solo un productor autenticado puede subir imágenes de productos',
        403,
      );
    }

    const { cloudName, apiKey, apiSecret } = this.config;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new DomainError(
        'SERVICE_UNAVAILABLE',
        'La carga firmada de imágenes no está configurada en este entorno',
        503,
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `${this.config.folder.replace(/\/+$/, '')}/${actor.id}`;
    const allowedFormats = ALLOWED_FORMATS.join(',');
    const toSign = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');

    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      allowedFormats: ALLOWED_FORMATS,
      maxBytes: MAX_BYTES,
    };
  }
}
