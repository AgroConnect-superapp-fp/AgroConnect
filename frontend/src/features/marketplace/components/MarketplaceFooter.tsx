/** Pie institucional del marketplace; no depende del catálogo. */
export function MarketplaceFooter(): React.ReactElement {
  return (
    <footer className="mt-4 animate-fadeInUp bg-gradient-to-br from-agro-dark via-green-900 to-agro-dark text-white delay-1200">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="group">
            <h3 className="mb-3 flex items-center gap-2 text-2xl font-bold text-agro-yellow-soft transition-transform group-hover:scale-105">
              🌱 AgroConnect
            </h3>
            <p className="text-sm font-semibold leading-relaxed text-green-100 transition-colors hover:text-white">
              Conectando el campo colombiano con el mundo a través de tecnología
              geoespacial y visualización de datos agrícolas.
            </p>
            <div className="mt-4 flex gap-3">
              {[
                { label: 'Facebook', icon: '📘' },
                { label: 'Twitter', icon: '🐦' },
                { label: 'Instagram', icon: '📷' },
                { label: 'LinkedIn', icon: '💼' },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-all hover:-translate-y-1 hover:scale-110 hover:bg-agro-green"
                >
                  <span className="text-sm" aria-hidden="true">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-lg font-bold uppercase tracking-wide text-agro-yellow-soft">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                'Mapa Interactivo',
                'Productores Destacados',
                'Distribución de Cultivos',
                'Estadísticas',
                'Contacto',
              ].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="inline-block text-green-100 transition-all hover:translate-x-2 hover:text-agro-yellow-soft"
                  >
                    → {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-lg font-bold uppercase tracking-wide text-agro-yellow-soft">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-green-100">
              <li className="flex items-start gap-2 transition-colors hover:text-white">
                <span className="text-lg" aria-hidden="true">
                  📍
                </span>
                <span>
                  SENA - Servicio Nacional de Aprendizaje
                  <br />
                  Centro de Comercio y Turismo - Armenia, Colombia
                </span>
              </li>
              <li className="flex items-center gap-2 transition-colors hover:text-white">
                <span className="text-lg" aria-hidden="true">
                  📧
                </span>
                <a href="mailto:agroconnet.07@gmail.com">agroconnet.07@gmail.com</a>
              </li>
              <li className="flex items-center gap-2 transition-colors hover:text-white">
                <span className="text-lg" aria-hidden="true">
                  📞
                </span>
                <span>+57 317 576 15 71</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
            <p className="text-center text-green-100 md:text-left">
              © 2026 <span className="font-bold text-agro-yellow-soft">AgroConnect</span>{' '}
              - Proyecto Formativo ADSO SENA
            </p>
            <p className="flex flex-wrap items-center justify-center gap-2 text-center text-green-200 md:justify-end md:text-right">
              <span>Powered by</span>
              <span className="font-semibold text-agro-yellow-soft transition-colors hover:text-white">
                NestJS + PostgreSQL
              </span>
              <span aria-hidden="true">•</span>
              <span className="font-semibold text-agro-yellow-soft transition-colors hover:text-white">
                PostGIS
              </span>
              <span aria-hidden="true">•</span>
              <span className="font-semibold text-agro-yellow-soft transition-colors hover:text-white">
                Vercel
              </span>
            </p>
          </div>
          <p className="mt-4 text-center text-xs text-green-200/80">
            Imágenes de cultivos:{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-agro-yellow-soft"
            >
              Unsplash
            </a>{' '}
            y{' '}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-agro-yellow-soft"
            >
              Wikimedia Commons
            </a>{' '}
            (CC BY-SA 3.0/4.0). Créditos completos en el README del proyecto.
          </p>
        </div>
      </div>
    </footer>
  );
}
