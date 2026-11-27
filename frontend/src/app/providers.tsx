import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { queryClient } from '../shared/api/queryClient';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Proveedores globales de la aplicación.
 *
 * Un único `QueryClientProvider` evita cachés paralelas y mantiene la
 * invalidación coherente entre marketplace, moderación y perfil.
 */
export function AppProviders({ children }: AppProvidersProps): React.ReactElement {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
