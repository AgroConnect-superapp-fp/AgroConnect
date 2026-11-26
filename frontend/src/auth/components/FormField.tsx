import type { InputHTMLAttributes } from 'react';
import { Field } from '../../shared/ui/Field';
import { Input } from '../../shared/ui/Input';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: string;
  required?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  placeholder?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}

/**
 * Campo de texto de autenticación sobre los primitivos compartidos.
 *
 * Se conserva la API histórica (`onChange` recibe el valor) para que el
 * formulario no dependa de detalles del DOM.
 */
export function FormField({
  id,
  label,
  value,
  onChange,
  error,
  help,
  required = false,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}: FormFieldProps): React.ReactElement {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <Field id={id} label={label} help={help} error={error} required={required}>
      <Input
        id={id}
        name={id}
        data-testid={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
      />
    </Field>
  );
}
