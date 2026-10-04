import { createContext } from 'react';
import type { LoginPayload, PublicUser, RegisterPayload, RoleName } from '../types';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface DemoProfile {
  nombre?: string;
  correo?: string;
  rol?: RoleName;
}

export interface AuthContextValue {
  status: AuthStatus;
  usuario: PublicUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginDemo: (profile?: DemoProfile) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
