import type { ReactNode } from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

const TONE_CLASSES: Record<AlertTone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-800',
};

/**
 * Mensaje contextual con rol adecuado: `alert` para errores/avisos y
 * `status` para información. El color nunca es el único portador del
 * significado: el texto lo explica.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  onDismiss,
  dismissLabel = 'Cerrar aviso',
  className = '',
}: AlertProps): React.ReactElement {
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_CLASSES[tone]} ${className}`}
    >
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="min-h-12 min-w-12 rounded-lg text-current hover:bg-black/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-current/30"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
