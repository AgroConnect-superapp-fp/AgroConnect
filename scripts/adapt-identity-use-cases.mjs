/**
 * Transformación de los casos de uso copiados del backend legacy al estilo
 * NestJS: decorador @Injectable() + inyección por token de los puertos del
 * dominio. NO modifica la lógica de negocio: solo el constructor.
 *
 * Uso: node scripts/adapt-identity-use-cases.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'apps/api/src/modules/identity/application/use-cases';

const TOKENS = {
  userRepository: 'USER_REPOSITORY',
  passwordHasher: 'PASSWORD_HASHER',
  tokenService: 'TOKEN_SERVICE',
  emailService: 'EMAIL_SERVICE',
  emailVerificationTokenRepository: 'EMAIL_VERIFICATION_TOKEN_REPOSITORY',
  passwordResetTokenRepository: 'PASSWORD_RESET_TOKEN_REPOSITORY',
  appBaseUrl: 'APP_BASE_URL',
};

const FILES = [
  'RegisterUserUseCase.ts',
  'LoginUseCase.ts',
  'RefreshTokenUseCase.ts',
  'LogoutUseCase.ts',
  'RequestPasswordResetUseCase.ts',
  'RequestEmailVerificationUseCase.ts',
  'ResetPasswordUseCase.ts',
  'VerifyEmailUseCase.ts',
];

for (const file of FILES) {
  const path = join(BASE, file);
  let source = readFileSync(path, 'utf8');

  // 1. Imports de NestJS y de los tokens.
  //    El token se deduce del TIPO del puerto presente en el archivo, porque el
  //    nombre del token todavía no aparece en el código original.
  const PORTS = {
    UserRepository: 'USER_REPOSITORY',
    PasswordHasher: 'PASSWORD_HASHER',
    TokenService: 'TOKEN_SERVICE',
    EmailService: 'EMAIL_SERVICE',
    EmailVerificationTokenRepository: 'EMAIL_VERIFICATION_TOKEN_REPOSITORY',
    PasswordResetTokenRepository: 'PASSWORD_RESET_TOKEN_REPOSITORY',
  };
  const used = new Set();
  for (const [port, token] of Object.entries(PORTS)) {
    if (new RegExp(`\\b${port}\\b`).test(source)) used.add(token);
  }
  if (/private readonly appBaseUrl: string/.test(source)) used.add('APP_BASE_URL');

  const tokenImports = [...used].join(', ');
  source = `import { Inject, Injectable } from '@nestjs/common';\nimport { ${tokenImports} } from '../tokens';\n${source}`;

  // 2. Decorador @Injectable() sobre la clase del caso de uso.
  source = source.replace(/export class (\w+UseCase) \{/, '@Injectable()\nexport class $1 {');

  // 3. Inyección por token en los parámetros del constructor.
  source = source.replace(
    /(    )private readonly (\w+): (UserRepository|PasswordHasher|TokenService|EmailService|EmailVerificationTokenRepository|PasswordResetTokenRepository|string)(,|\n)/g,
    (match, indent, param, type, tail) => {
      const token = TOKENS[param];
      if (!token) return match;
      return `${indent}@Inject(${token}) private readonly ${param}: ${type}${tail}`;
    },
  );

  writeFileSync(path, source, 'utf8');
  console.log(`✓ ${file}`);
}
