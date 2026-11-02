import { Injectable } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type {
  EmailService,
  EmailVerificationEmail,
  PasswordResetEmail,
} from '../../domain/interfaces/EmailService';

export interface SmtpConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  secure: boolean;
  from: string;
}

/**
 * Escapa texto interpolado en el HTML del correo. `fullName` lo escribe el
 * usuario y las URLs pueden contener `&` en el query string; sin escape, un
 * nombre como `<img onerror=...>` se renderiza en el cliente de correo.
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/**
 * Envío real de correo por SMTP.
 *
 * Sustituye al `FileEmailService` (que escribe los correos en disco) cuando
 * hay servidor SMTP configurado. Es el mecanismo que permite la verificación
 * de correo y la recuperación de contraseña en producción.
 */
@Injectable()
export class SmtpEmailService implements EmailService {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      // Límites duros: sin ellos un SMTP inalcanzable cuelga el envío
      // indefinidamente y degrada cualquier flujo que espere el resultado.
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    });
  }

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: email.to,
      subject: 'Restablece tu contraseña de AgroConnect',
      text: [
        `Hola ${email.fullName},`,
        '',
        'Solicitaste restablecer tu contraseña. Abre el siguiente enlace:',
        email.resetUrl,
        '',
        `El enlace expira en ${email.expiresInMinutes} minutos.`,
        'Si no solicitaste el cambio, ignora este mensaje.',
      ].join('\n'),
      html: [
        `<p>Hola ${escapeHtml(email.fullName)},</p>`,
        '<p>Solicitaste restablecer tu contraseña. Abre el siguiente enlace:</p>',
        `<p><a href="${escapeHtml(email.resetUrl)}">${escapeHtml(email.resetUrl)}</a></p>`,
        `<p>El enlace expira en ${email.expiresInMinutes} minutos.</p>`,
        '<p>Si no solicitaste el cambio, ignora este mensaje.</p>',
      ].join(''),
    });
  }

  async sendEmailVerification(email: EmailVerificationEmail): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: email.to,
      subject: 'Verifica tu correo de AgroConnect',
      text: [
        `Hola ${email.fullName},`,
        '',
        'Confirma tu correo electrónico en AgroConnect:',
        email.verifyUrl,
        '',
        `El enlace expira en ${email.expiresInMinutes} minutos.`,
      ].join('\n'),
      html: [
        `<p>Hola ${escapeHtml(email.fullName)},</p>`,
        '<p>Confirma tu correo electrónico en AgroConnect:</p>',
        `<p><a href="${escapeHtml(email.verifyUrl)}">${escapeHtml(email.verifyUrl)}</a></p>`,
        `<p>El enlace expira en ${email.expiresInMinutes} minutos.</p>`,
      ].join(''),
    });
  }
}
