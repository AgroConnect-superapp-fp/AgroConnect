import { createHash } from 'node:crypto';
import {
  GenerateUploadSignatureUseCase,
  type CloudinaryUploadConfig,
} from '../../../src/modules/uploads/application/use-cases/GenerateUploadSignatureUseCase';

const config: CloudinaryUploadConfig = {
  cloudName: 'agro-demo',
  apiKey: 'api-key',
  apiSecret: 'secret',
  folder: 'agroconnect/products',
};

describe('GenerateUploadSignatureUseCase', () => {
  it('firma timestamp, carpeta y formatos sin exponer el secreto', () => {
    const useCase = new GenerateUploadSignatureUseCase(config);
    const before = Math.floor(Date.now() / 1000);

    const signature = useCase.execute({ id: 'user-1', role: 'productor' });

    const after = Math.floor(Date.now() / 1000);
    expect(signature.cloudName).toBe('agro-demo');
    expect(signature.apiKey).toBe('api-key');
    expect(signature.folder).toBe('agroconnect/products/user-1');
    expect(signature.allowedFormats).toEqual(['jpg', 'jpeg', 'png', 'webp', 'avif']);
    expect(signature.timestamp).toBeGreaterThanOrEqual(before);
    expect(signature.timestamp).toBeLessThanOrEqual(after);

    const toSign = `allowed_formats=${signature.allowedFormats.join(',')}&folder=${signature.folder}&timestamp=${signature.timestamp}`;
    const expected = createHash('sha256').update(`${toSign}${config.apiSecret}`).digest('hex');
    expect(signature.signature).toBe(expected);
    expect(JSON.stringify(signature)).not.toContain('secret');
  });

  it('normaliza la carpeta base sin dobles barras', () => {
    const useCase = new GenerateUploadSignatureUseCase({
      ...config,
      folder: 'agroconnect/products///',
    });

    expect(useCase.execute({ id: 'user-1', role: 'administrador' }).folder).toBe(
      'agroconnect/products/user-1',
    );
  });

  it('rechaza roles que no publican productos', () => {
    const useCase = new GenerateUploadSignatureUseCase(config);
    let thrown: unknown;

    try {
      useCase.execute({ id: 'user-1', role: 'comprador_b2c' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('responde 503 si Cloudinary no está configurado', () => {
    const useCase = new GenerateUploadSignatureUseCase({
      folder: 'agroconnect/products',
    });
    let thrown: unknown;

    try {
      useCase.execute({ id: 'user-1', role: 'productor' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: 'SERVICE_UNAVAILABLE', statusCode: 503 });
  });
});
