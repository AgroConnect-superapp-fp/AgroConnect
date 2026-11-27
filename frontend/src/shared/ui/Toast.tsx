import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ShowToastOptions, type ToastTone } from './toastContext';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

const DEFAULT_DURATION_MS = 5_000;

const TONE_CLASSES: Record<ToastTone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-800',
};

interface ToastProps {
  message: string;
  tone?: ToastTone;
  onDismiss: () => void;
  closeLabel?: string;
}

/** Aviso individual; se anuncia como alerta si es de error o advertencia. */
export function Toast({
  message,
  tone = 'info',
  onDismiss,
  closeLabel = 'Cerrar notificación',
}: ToastProps): React.ReactElement {
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm ${TONE_CLASSES[tone]}`}
    >
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={closeLabel}
        className="min-h-12 min-w-12 rounded-lg text-current hover:bg-black/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-current/30"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

/** Proveedor de notificaciones con auto-cierre y limpieza de temporizadores. */
export function ToastProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number): void => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options: ShowToastOptions = {}): void => {
      const id = nextId.current++;
      const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

      setToasts((current) => [
        ...current,
        { id, message, tone: options.tone ?? 'info', durationMs },
      ]);

      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismissToast(id), durationMs)
        );
      }
    },
    [dismissToast]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        aria-label="Notificaciones"
        className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-96"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            tone={toast.tone}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
