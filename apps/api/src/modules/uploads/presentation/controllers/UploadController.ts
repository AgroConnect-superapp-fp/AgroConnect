import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GenerateUploadSignatureUseCase } from '../../application/use-cases/GenerateUploadSignatureUseCase';
import { success } from '../../../../shared/http/responses';
import type { AuthenticatedRequest } from '../../../../shared/http/authenticated-user';
import { SessionAuthGuard } from '../../../identity/presentation/guards/SessionAuthGuard';
import { AuthThrottlerGuard } from '../../../identity/presentation/guards/AuthThrottlerGuard';

@Controller('uploads')
@UseGuards(SessionAuthGuard)
export class UploadController {
  constructor(private readonly generateUploadSignature: GenerateUploadSignatureUseCase) {}

  @Post('signature')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  sign(@Req() request: AuthenticatedRequest): unknown {
    const user = request.user!;
    const signature = this.generateUploadSignature.execute({
      id: user.id,
      role: user.role,
    });

    return success(signature, 'Firma de subida generada');
  }
}
