import { apiRequest } from './apiClient';
import type { ProfileSnapshot } from '@agroconnect/contracts';

export type MyProfile = ProfileSnapshot;
export type ProducerProfile = NonNullable<MyProfile['productor']>;
export type CompanyProfile = NonNullable<MyProfile['empresa']>;
export type TransporterProfile = NonNullable<MyProfile['transportista']>;

export type ProfileUpdatePayload =
  | { productor: Partial<ProducerProfile> }
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
