import type { HTMLAttributes, ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  children: ReactNode;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
};

/** Superficie base para agrupar contenido relacionado. */
export function Card({
  padding = 'md',
  children,
  className = '',
  ...rest
}: CardProps): React.ReactElement {
  return (
    <div
      {...rest}
      className={`rounded-2xl border border-emerald-100 bg-white shadow-sm ${PADDING_CLASSES[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
