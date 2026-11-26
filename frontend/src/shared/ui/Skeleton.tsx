interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  className?: string;
  /** Si se informa, el esqueleto se anuncia como estado de carga. */
  label?: string;
}

const VARIANT_CLASSES: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'h-4 w-full rounded',
  circle: 'h-12 w-12 rounded-full',
  rect: 'h-24 w-full rounded-lg',
};

/**
 * Marcador de carga sin contenido semántico.
 *
 * Por defecto es decorativo (`aria-hidden`); si el consumidor necesita
 * anunciar la carga, pasa `label` y se convierte en `role="status"`.
 */
export function Skeleton({
  variant = 'text',
  className = '',
  label,
}: SkeletonProps): React.ReactElement {
  const classes = `animate-pulse bg-gray-200 ${VARIANT_CLASSES[variant]} ${className}`;

  if (label) {
    return (
      <div role="status" aria-live="polite">
        <div aria-hidden="true" className={classes} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return <div aria-hidden="true" className={classes} />;
}
