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

export type ProductModerationStatus = 'pending' | 'approved' | 'rejected';

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
  moderationStatus?: ProductModerationStatus;
  lat: number;
  lng: number;
  producerId?: string;
  images: ProductImage[];
  coordinates: [number, number][];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  public readonly props: ProductProps;

  constructor(props: ProductProps) {
    this.props = { ...props, moderationStatus: props.moderationStatus ?? 'pending' };
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  isOrganic(): boolean {
    return this.props.certification === 'organic';
  }

  get moderationStatus(): ProductModerationStatus {
    return this.props.moderationStatus ?? 'pending';
  }
}
