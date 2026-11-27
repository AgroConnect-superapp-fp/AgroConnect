import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { env } from '../../../shared/config/env';
import { IdentityModule } from '../../identity/presentation/identity.module';
import { GenerateUploadSignatureUseCase } from '../application/use-cases/GenerateUploadSignatureUseCase';
import { UploadController } from './controllers/UploadController';

@Module({
  imports: [
    IdentityModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX_ATTEMPTS,
      },
    ]),
  ],
  controllers: [UploadController],
  providers: [
    {
      provide: GenerateUploadSignatureUseCase,
      useFactory: () =>
        new GenerateUploadSignatureUseCase({
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          apiSecret: env.CLOUDINARY_API_SECRET,
          folder: env.CLOUDINARY_UPLOAD_FOLDER,
        }),
    },
  ],
})
export class UploadsModule {}
