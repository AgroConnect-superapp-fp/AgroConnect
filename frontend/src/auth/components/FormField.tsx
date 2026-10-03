import type { InputHTMLAttributes } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  placeholder?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}

export function FormField({
  id,
  label,
  value,
  onChange,
  error,
  help,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}: FormFieldProps): React.ReactElement {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
      </label>
      <input
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
        aria-invalid={error ? true : undefined}
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
        className={`min-h-12 w-full rounded-lg border px-3.5 py-2.5 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-agro-green focus:ring-agro-green/25'
        }`}
      />
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
