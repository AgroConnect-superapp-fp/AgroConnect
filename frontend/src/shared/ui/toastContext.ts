import { createContext, useContext } from 'react';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ShowToastOptions {
  tone?: ToastTone;
  /** 0 mantiene el aviso hasta que el usuario lo cierre. */
  durationMs?: number;
}

export interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => void;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return context;
}
