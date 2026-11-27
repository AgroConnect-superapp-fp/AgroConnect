/**
 * Runner de CLI del seed de AgroConnect.
 *
 * Uso:
 *   npm run prisma:seed -w @agroconnect/api
 *
 * Variables obligatorias (el seed no tiene contraseñas por defecto):
 *   SEED_ADMIN_PASSWORD     contraseña de admin@agroconnect.local
 *   SEED_PRODUCER_PASSWORD  contraseña de productor@agroconnect.local
 *
 * Variables de control:
 *   ALLOW_DEV_SEED=true     habilita el seed fuera de development/test local
 *   NODE_ENV                `development` o `test` para el seed local
 *
 * La lógica vive en `prisma/seed.ts`; este archivo solo presenta el reporte.
 * Las contraseñas NUNCA se imprimen: solo se indica de qué variable vinieron.
 */
import { runSeed } from '../prisma/seed';

function printReport(report: Awaited<ReturnType<typeof runSeed>>): void {
  console.log('AgroConnect · seed de desarrollo');
  console.log('─'.repeat(60));
  console.log(`Base de datos: ${report.database} (schema ${report.schema})`);
  console.log(`Roles: ${report.roles.length} → ${report.roles.join(', ')}`);
  console.log(`Usuarios: ${report.users.length}`);
  for (const user of report.users) {
    const estado = user.passwordApplied
      ? 'aplicada'
      : 'conservada (la cuenta ya existía)';
    console.log(
      `  · ${user.correo} · rol=${user.rol} · contraseña desde variable ` +
        `${user.passwordEnv} · ${estado}`,
    );
  }
  console.log(`Parcelas: ${report.plots.length}`);
  for (const plot of report.plots) {
    console.log(
      `  · ${plot.name} · ${plot.municipality}/${plot.department} · ` +
        `${plot.areaHectares.toFixed(2)} ha · centroide ${plot.centroid ?? 'sin centroide'}`,
    );
  }

  if (report.warnings.length > 0) {
    console.log('─'.repeat(60));
    console.log('Avisos:');
    for (const warning of report.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
  }

  console.log('─'.repeat(60));
  console.log('Seed completado. Las contraseñas nunca se imprimen ni se registran.');
}

runSeed()
  .then((report) => {
    printReport(report);
  })
  .catch((error: unknown) => {
    console.error(
      'Error ejecutando el seed de AgroConnect:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  });
