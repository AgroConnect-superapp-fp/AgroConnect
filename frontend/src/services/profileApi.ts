import { apiRequest } from './apiClient';
import type { PublicUser } from '../auth/types';
import type { CompanyType, VehicleType } from '@agroconnect/contracts';

export interface ProducerProfile {
  nombre: string;
  municipio: string;
  vereda: string;
  latitud?: number;
  longitud?: number;
}

export interface CompanyProfile {
  razonSocial: string;
  nit: string;
  direccion?: string;
  tipoEmpresa?: CompanyType;
  departamento?: string;
  municipio?: string;
}

export interface TransporterProfile {
  tipoVehiculo: VehicleType;
  placa: string;
  capacidadKg: number;
  cobertura: string[];
  cadenaFrio: boolean;
  soatVence: string;
  licenciaVence: string;
}

export interface MyProfile {
  usuario: PublicUser;
  productor?: ProducerProfile;
  empresa?: CompanyProfile;
  transportista?: TransporterProfile;
}

export type ProfileUpdatePayload =
  | { productor: Partial<Omit<ProducerProfile, 'latitud' | 'longitud'>> }
  | { empresa: Partial<Omit<CompanyProfile, 'nit'>> }
  | { transportista: Partial<TransporterProfile> };

export function getMyProfile(): Promise<MyProfile> {
  return apiRequest<MyProfile>('/api/v1/profile/me', {}, 20_000);
}

export function updateMyProfile(payload: ProfileUpdatePayload): Promise<MyProfile> {
  return apiRequest<MyProfile>(
    '/api/v1/profile/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    20_000
  );
}
