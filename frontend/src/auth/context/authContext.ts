import { createContext } from 'react';
import type { LoginPayload, PublicUser, RegisterPayload } from '../types';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthContextValue {
  status: AuthStatus;
  /** La sesión vino de una cookie restaurada al arrancar (no de login/demo). */
  restored: boolean;
  /** La sesión activa es la demo en memoria, no una cuenta real. */
  isDemo: boolean;
  usuario: PublicUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
