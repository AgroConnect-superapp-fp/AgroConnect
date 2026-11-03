// 🏛️ DOMAIN LAYER - Entidad pura (sin NestJS, sin Prisma)

/**
 * Cultivos y certificaciones del marketplace.
 *
 * La lista debe permanecer sincronizada con `MARKETPLACE_CROPS` y
 * `MARKETPLACE_CERTIFICATIONS` de `@agroconnect/contracts`; el contrato es la
 * barrera de validación y el dominio la usa para tipar su propio puerto.
 */
export type ProductCrop =
  'coffee' | 'cacao' | 'banana' | 'sugarcane' | 'rice' | 'corn' | 'cassava' | 'oil_palm';

export type ProductCertification =
  'organic' | 'rainforest_alliance' | 'fair_trade' | 'conventional' | 'global_gap';

export interface ProductImage {
  publicId: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  bytes?: number;
  uploadedAt?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  lqip?: string;
}

export interface ProductProps {
  id: string;
  name: string;
  owner: string;
  description?: string;
  contact?: string;
  department: string;
  municipality: string;
  crop: ProductCrop;
  area: number;
  productivity: number;
  certification?: ProductCertification;
  lat: number;
  lng: number;
  images: ProductImage[];
  coordinates: [number, number][];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  constructor(public readonly props: ProductProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  isOrganic(): boolean {
    return this.props.certification === 'organic';
  }
}
