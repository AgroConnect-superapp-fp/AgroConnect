import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <header className="flex items-center justify-center gap-2 px-4 pt-8 pb-2">
        <span aria-hidden="true" className="text-3xl">
          🌱
        </span>
        <span className="font-sans text-2xl font-bold tracking-tight text-agro-green">
          AgroConnect
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6">
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-center font-sans text-2xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-center text-sm leading-relaxed text-gray-600">
              {subtitle}
            </p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-gray-500">
        AgroConnect · Conectando el campo con la tecnología · SENA ADSO 2026
      </footer>
    </div>
  );
}
