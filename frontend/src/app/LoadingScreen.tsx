/**
 * Pantalla de carga compartida.
 *
 * Se muestra mientras la sesión se restaura (refresh silencioso contra la
 * cookie httpOnly) y mientras se descarga el código de una ruta diferida.
 */
export function LoadingScreen(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="h-12 w-12 animate-spin rounded-full border-4 border-agro-green/20 border-t-agro-green"
        />
        <p className="text-sm font-semibold text-agro-green">Cargando AgroConnect…</p>
      </div>
    </div>
  );
}
