#!/usr/bin/env node
/**
 * Smoke test de Cloudinary para AgroConnect.
 *
 * Usa las credenciales server-side (`CLOUDINARY_API_SECRET`) para firmar una
 * subida de prueba. No imprime el secreto y sube una imagen mínima sin PII.
 *
 * Uso:
 *   CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... \
 *     npm run smoke:cloudinary
 */
import { createHash } from "node:crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Faltan CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.",
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
  const folder = "agroconnect/smoke";
  const allowedFormats = "jpg,jpeg,png,webp,avif";
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha256")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");

  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("allowed_formats", allowedFormats);

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
