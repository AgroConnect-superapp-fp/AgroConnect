import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  EmailService,
  EmailVerificationEmail,
  PasswordResetEmail,
} from '../../domain/interfaces/EmailService';

/**
 * Adaptador de correo para desarrollo: escribe cada mensaje como archivo de texto
 * en MAIL_DIR en lugar de enviarlo por SMTP. Evita registrar PII o tokens en los logs.
 * En producción se reemplaza por un proveedor real (SMTP/SendGrid) implementando EmailService.
 */
export class FileEmailService implements EmailService {
  constructor(private readonly mailDir: string) {}

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    const content = [
      `Para: ${email.to}`,
      'Asunto: Recuperación de contraseña — AgroConnect',
      '',
      `Hola ${email.fullName},`,
      '',
      'Recibimos una solicitud para restablecer tu contraseña.',
      `Abre este enlace para continuar (válido por ${email.expiresInMinutes} minutos):`,
      '',
      email.resetUrl,
      '',
      'Si no solicitaste este cambio, ignora este mensaje.',
      '',
      '— Equipo AgroConnect',
    ].join('\n');

    await this.writeMessage('password-reset', content);
  }

  async sendEmailVerification(email: EmailVerificationEmail): Promise<void> {
    const content = [
      `Para: ${email.to}`,
      'Asunto: Verifica tu correo — AgroConnect',
      '',
      `Hola ${email.fullName},`,
      '',
      'Gracias por registrarte en AgroConnect. Confirma tu correo para activar todas las funciones.',
      `Abre este enlace para verificar tu cuenta (válido por ${email.expiresInMinutes} minutos):`,
      '',
      email.verifyUrl,
      '',
      'Si no creaste esta cuenta, ignora este mensaje.',
      '',
      '— Equipo AgroConnect',
    ].join('\n');

    await this.writeMessage('email-verification', content);
  }

  private async writeMessage(kind: string, content: string): Promise<void> {
    await mkdir(this.mailDir, { recursive: true });
    const fileName = `${Date.now()}-${kind}.txt`;
    await writeFile(join(this.mailDir, fileName), content, 'utf8');
  }
}
