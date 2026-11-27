import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Envoltorio de campo: etiqueta, ayuda y error con ids estables.
 *
 * El input hijo debe recibir `id`, `aria-invalid` y
 * `aria-describedby={`${id}-help ${id}-error`}`; los helpers de este módulo
 * (`Input`) ya aceptan esas props.
 */
export function Field({
  id,
  label,
  help,
  error,
  required = false,
  children,
}: FieldProps): React.ReactElement {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      {children}
      {help && !error && (
        <p id={helpId} className="text-xs text-gray-500">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
