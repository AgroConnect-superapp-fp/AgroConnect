import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../../../services/profileApi';
import type { MyProfile } from '../../../services/profileApi';
import { queryKeys } from '../queryKeys';

const PROFILE_STALE_TIME_MS = 30_000;

/**
 * Perfil de la sesión actual (`GET /api/v1/profile/me`).
 *
 * La clave depende solo del usuario autenticado porque la cookie identifica
 * la sesión; al cerrar sesión el caché se limpia desde `AuthProvider`.
 */
export function useProfile() {
  return useQuery<MyProfile>({
    queryKey: queryKeys.profile.me(),
    queryFn: getMyProfile,
    staleTime: PROFILE_STALE_TIME_MS,
  });
}
