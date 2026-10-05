# Contribuir a AgroConnect

¡Gracias por tu interés! Este es un **proyecto formativo (SENA ADSO — Ficha 2026)**
y su desarrollo sigue las convenciones descritas aquí y en
[`SPEC.md`](.opencode/SPEC.md).

## Requisitos del entorno

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | **≥ 20 (recomendado 24 — ver `.nvmrc`)** | `nvm use` |
| npm | ≥ 10 | Se usa el lockfile por proyecto |
| Docker + Compose | reciente | `docker compose up -d` levanta PostgreSQL 16 + PostGIS 3.4 en `localhost:5434` |
| Git | reciente | Flujo de ramas descrito abajo |

## Flujo de trabajo (Git Flow simplificado)

```
main        ← sólo merges de develop o hotfix/* (nunca commits directos)
develop     ← integración; recibe feature/*
feature/*   ← nueva funcionalidad (sale de develop, vuelve a develop)
hotfix/*    ← corrección urgente (sale de main, vuelve a main y develop)
```

1. Crea tu rama: `feature/<descripcion-corta>` o `fix/<descripcion-corta>`.
2. Commits pequeños y atómicos con **Conventional Commits**:
   `feat|fix|docs|chore|refactor|test|ci|build|perf|style(alcance): mensaje`.
3. Abre un **Pull Request** con la plantilla. Todo PR requiere:
   - **CI en verde** (lint · type-check · pruebas · build · E2E · alineación).
   - **Revisión aprobada** antes del merge.
   - Para PRs hacia `main`: **2 aprobaciones** cuando el equipo lo disponga.

> Nota: GitHub Free en repositorios privados de organización no permite
> *branch protection* nativo. Mientras eso siga así, este flujo es una **regla
> contractual del equipo**: no se hace push directo a `main` ni se mergea sin CI
> verde y revisión.

## Gates de calidad (ejecutar antes de cada commit)

```bash
# Backend
cd backend
npm run lint           # 0 errores permitidos
npm run typecheck      # tsc --noEmit
npm test -- --coverage # cobertura ≥ 80% (bloquea el merge)
npm audit              # 0 vulnerabilidades críticas

# Frontend
cd frontend
npm run lint
npx tsc --noEmit
npm run build          # verifica el bundle (presupuesto: < 200 KB gzip inicial)
npx playwright test    # E2E (en CI o contra el entorno local)
```

## Convenciones de código

- **TypeScript estricto**: prohibido `any` (usar `unknown` + type guards).
- **Clean Architecture**: el dominio no conoce Prisma, Express ni HTTP.
- **Geoespacial**: los cálculos de distancia/área se hacen en PostGIS, nunca en JS.
- **Mapas**: Leaflet + OpenStreetMap (Google Maps está prohibido en este proyecto).
- **Logs**: Pino con Correlation ID; `console.log` no se acepta en producción.
- **Secretos**: jamás en el repositorio; usar `.env` local (ver `.env.example`).
- **Errores**: errores de dominio tipados; nunca capturar y silenciar.

## Revisiones de código

- Sé amable y específico en los comentarios; propone, no impongas.
- Los PRs deben ser **pequeños y revisables**; justifica cualquier cambio grande.
- La documentación (README, CHANGELOG) se actualiza en el mismo PR cuando aplique.

## Reportes de seguridad

No abras un issue público para vulnerabilidades: sigue [`SECURITY.md`](SECURITY.md).
