/**
 * Reporte opt-in de errores de cliente.
 *
 * Solo envía nombre, mensaje, ruta (sin query ni hash, para no filtrar tokens)
 * y el component stack truncado. No envía cookies, usuario, formularios ni
 * stack completo. Si `VITE_ERROR_REPORT_URL` no está definida, no hace red.
 */
interface ClientErrorPayload {
  type: 'client-error';
  name: string;
  message: string;
  componentStack?: string;
  route: string;
  timestamp: string;
}

const MAX_MESSAGE_LENGTH = 500;
const MAX_COMPONENT_STACK_LENGTH = 2_000;

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function buildClientErrorPayload(
  error: Error,
  componentStack?: string
): ClientErrorPayload {
  return {
    type: 'client-error',
    name: error.name.slice(0, 100),
    message: truncate(error.message, MAX_MESSAGE_LENGTH) ?? 'Error desconocido',
    componentStack: truncate(componentStack, MAX_COMPONENT_STACK_LENGTH),
    route: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
}

export function reportClientError(error: Error, componentStack?: string): boolean {
  const endpoint = import.meta.env['VITE_ERROR_REPORT_URL'];
  if (!endpoint) return false;

  const payload = buildClientErrorPayload(error, componentStack);
  const body = JSON.stringify(payload);

  if (typeof navigator.sendBeacon === 'function') {
    const sent = navigator.sendBeacon(
      endpoint,
      new Blob([body], { type: 'application/json' })
    );
    if (sent) return true;
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);

  return true;
}
