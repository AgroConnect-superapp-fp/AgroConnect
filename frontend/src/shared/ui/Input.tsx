import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marca el campo como inválido y activa los estilos de error. */
  invalid?: boolean;
}

/**
 * Input base con 48 px de alto, foco visible y `aria-invalid` coherente.
 *
 * El consumidor es responsable de asociarlo a un `<label>` (normalmente vía
 * `Field`) y de enlazar el mensaje de error con `aria-describedby`.
 */
export function Input({
  invalid = false,
  className = '',
  ...rest
}: InputProps): React.ReactElement {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={`min-h-12 w-full rounded-lg border px-3.5 py-2.5 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
        invalid
          ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:border-agro-green focus:ring-agro-green/25'
      } ${className}`}
    />
  );
}
