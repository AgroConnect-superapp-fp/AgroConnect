import { SmtpEmailService } from '../../../src/modules/identity/infrastructure/services/SmtpEmailService';

const sendMail = jest.fn().mockResolvedValue({ messageId: 'id-1' });
const createTransport = jest.fn(() => ({ sendMail }));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: (...args: unknown[]) =>
      (createTransport as unknown as (...a: unknown[]) => unknown)(...args),
  },
}));

/**
 * Pruebas del envío de correo por SMTP.
 *
 * El transporte se simula: la prueba verifica el contenido y el destino del
 * correo (los enlaces de verificación y de restablecimiento son el mecanismo
 * de recuperación de acceso), no el protocolo SMTP.
 */
describe('SmtpEmailService', () => {
  const config = {
    host: 'smtp.agroconnect.co',
    port: 587,
    user: 'no-reply@agroconnect.co',
    pass: 'secreto',
    secure: false,
    from: 'AgroConnect <no-reply@agroconnect.co>',
  };

  beforeEach(() => {
    sendMail.mockClear();
    createTransport.mockClear();
  });

  it('envía el correo de restablecimiento con el enlace y el tiempo de expiración', async () => {
    const service = new SmtpEmailService(config);

    await service.sendPasswordReset({
      to: 'ana@agroconnect.co',
      fullName: 'Ana Rodríguez',
      resetUrl: 'https://agroconnect.co/?resetToken=abc123',
      expiresInMinutes: 30,
    });

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mensaje = sendMail.mock.calls[0][0] as {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(mensaje.to).toBe('ana@agroconnect.co');
    expect(mensaje.from).toBe(config.from);
    expect(mensaje.subject).toContain('contraseña');
    expect(mensaje.text).toContain('https://agroconnect.co/?resetToken=abc123');
    expect(mensaje.text).toContain('30 minutos');
    expect(mensaje.html).toContain('https://agroconnect.co/?resetToken=abc123');
  });

  it('envía el correo de verificación con el enlace y el tiempo de expiración', async () => {
    const service = new SmtpEmailService(config);

    await service.sendEmailVerification({
      to: 'ana@agroconnect.co',
      fullName: 'Ana Rodríguez',
      verifyUrl: 'https://agroconnect.co/?verifyToken=xyz789',
      expiresInMinutes: 1440,
    });

    const mensaje = sendMail.mock.calls[0][0] as { subject: string; text: string; html: string };
    expect(mensaje.subject).toContain('Verifica');
    expect(mensaje.text).toContain('https://agroconnect.co/?verifyToken=xyz789');
    expect(mensaje.text).toContain('1440 minutos');
    expect(mensaje.html).toContain('https://agroconnect.co/?verifyToken=xyz789');
  });

  it('configura el transporte con los datos del servidor SMTP', () => {
    new SmtpEmailService(config);

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.agroconnect.co',
      port: 587,
      secure: false,
      auth: { user: 'no-reply@agroconnect.co', pass: 'secreto' },
    });
  });

  it('omite las credenciales cuando el servidor no requiere autenticación', () => {
    new SmtpEmailService({ ...config, user: undefined, pass: undefined });

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.agroconnect.co',
      port: 587,
      secure: false,
      auth: undefined,
    });
  });
});
