/**
 * Contrato de firma para subida directa a Cloudinary.
 *
 * El cliente nunca recibe `api_secret`: solo un paquete de firma de corta
 * duración con la carpeta asignada por el servidor.
 */
import { z } from "zod";

export const uploadSignatureSchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  timestamp: z.number().int().positive(),
  signature: z.string().min(1),
  folder: z.string().min(1),
  allowedFormats: z.array(z.string().min(1)),
  maxBytes: z.number().int().positive(),
});

export type UploadSignature = z.infer<typeof uploadSignatureSchema>;
