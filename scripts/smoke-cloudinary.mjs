#!/usr/bin/env node
/**
 * Smoke test de Cloudinary para AgroConnect.
 *
 * Usa el preset unsigned del frontend (los mismos valores públicos que recibe
 * el navegador). No lee ni imprime secretos, y sube una imagen mínima sin PII.
 *
 * Uso:
 *   CLOUDINARY_CLOUD_NAME=... CLOUDINARY_UPLOAD_PRESET=... \
 *     npm run smoke:cloudinary
 *
 * También acepta los nombres VITE_CLOUDINARY_CLOUD_NAME y
 * VITE_CLOUDINARY_UPLOAD_PRESET para reutilizar el .env.local del frontend.
 */
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset =
  process.env.CLOUDINARY_UPLOAD_PRESET ??
  process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!cloudName || !uploadPreset) {
  console.error(
    "Faltan CLOUDINARY_CLOUD_NAME/CLOUDINARY_UPLOAD_PRESET (o sus equivalentes VITE_*).",
  );
  console.error("Configúralos en la sesión y vuelve a ejecutar el smoke test.");
  process.exitCode = 1;
} else {
  // PNG 1x1 transparente: imagen mínima, sin datos personales.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  const form = new FormData();
  form.append(
    "file",
    new Blob([png], { type: "image/png" }),
    "agroconnect-smoke.png",
  );
  form.append("upload_preset", uploadPreset);
  form.append("folder", "agroconnect/smoke");
  form.append("tags", "smoke-test");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30_000),
      },
    );

    const body = await response.json().catch(() => ({}));
    if (!response.ok || typeof body.secure_url !== "string") {
      const message =
        typeof body.error?.message === "string"
          ? body.error.message
          : `HTTP ${response.status}`;
      throw new Error(`Cloudinary rechazó la subida: ${message}`);
    }

    console.log("Cloudinary smoke test OK");
    console.log(`  cloud: ${cloudName}`);
    console.log(`  public_id: ${body.public_id}`);
    console.log(`  secure_url: ${body.secure_url}`);
  } catch (error) {
    console.error(
      "Cloudinary smoke test FAIL:",
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}
