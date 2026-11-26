import { useId, type ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/** Estado vacío neutro: explica qué falta y, si aplica, cómo continuar. */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps): React.ReactElement {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center"
    >
      {icon && <div aria-hidden="true">{icon}</div>}
      <h2 id={titleId} className="text-lg font-semibold text-gray-900">
        {title}
      </h2>
      {description && <p className="max-w-prose text-sm text-gray-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </section>
  );
}
