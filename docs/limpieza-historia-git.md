# Limpieza de historia de git — Runbook

**Fecha:** 3 de octubre de 2026
**Estado:** planificado (requiere aprobación del equipo y ventana coordinada)
**Backup previo:** `git clone --mirror` en `/tmp/opencode/agroconnect-backup-20261003.git` (3-oct-2026)

---

## 1. Contexto

El repositorio `AgroConnect-superapp-fp/AgroConnect` contiene **~152 MB de binarios accidentales en su historia** (no en el árbol actual), subidos antes de que existiera el `.gitignore`. GitHub lo advirtió durante el primer push:

> `warning: File frontend/react is 90.59 MB; this is larger than GitHub's recommended maximum file size of 50.00 MB`

### Inventario de objetos grandes en la historia

| Ruta | Tamaño | Origen |
|---|---|---|
| `frontend/react` | 90.6 MB | Salida de terminal redirigida por error |
| `frontend/leaflet` | 38.8 MB | Ídem |
| `frontend/{` | 12.9 MB | Ídem |
| `frontend/react-leaflet-markercluster` | 5.9 MB | Ídem |
| `obsidian-vault/Ningendo` | 3.8 MB | Vault de Obsidian subido por error |
| PDFs de entregables | ~2.5 MB | Legítimos (se conservan) |

El archivo de 90 MB está por debajo del límite duro de GitHub (100 MB), por lo que **no bloquea**; el repositorio es privado y el `.git` comprimido pesa ~21 MB. La limpieza es una mejora de higiene, no una urgencia.

## 2. Opciones

| Opción | Ventaja | Costo |
|---|---|---|
| **A. Dejar como está** | Cero riesgo; no requiere coordinación | Historia de ~152 MB; clones más pesados |
| **B. Reescribir historia (recomendada si el equipo lo aprueba)** | Repo ligero desde el inicio | Force-push de `main` y `develop`; re-dispara CI; todos los hashes cambian |

**Criterio de decisión:** ejecutar la opción B **antes de que el equipo clone el repositorio** (momento actual: solo existe este clon y el PR #1 abierto). Si alguien ya clonó, coordinar la re-clonación.

## 3. Procedimiento (opción B)

### 3.1 Requisitos

```bash
# Instalar git-filter-repo (una vez)
pipx install git-filter-repo        # o: pip3 install --user git-filter-repo
git filter-repo --version
```

### 3.2 Backup (obligatorio antes de tocar nada)

```bash
# Ya ejecutado el 3-oct-2026:
git clone --mirror . /tmp/opencode/agroconnect-backup-20261003.git

# Verificar el backup
git -C /tmp/opencode/agroconnect-backup-20261003.git log --oneline -3
```

### 3.3 Reescritura

```bash
# Ejecutar desde la raíz del proyecto, con el árbol de trabajo limpio
git filter-repo --force --invert-paths \
  --path frontend/react \
  --path frontend/leaflet \
  --path 'frontend/{' \
  --path frontend/eslint \
  --path frontend/prettier \
  --path frontend/tsc \
  --path frontend/vite \
  --path frontend/frontend@0.0.0 \
  --path frontend/react-leaflet-markercluster \
  --path obsidian-vault
```

Notas:
- `filter-repo` **elimina los remotos** por seguridad; se re-agregan después.
- Reescribe **todos los commits** de todas las ramas (los hashes cambian).

### 3.4 Verificación

```bash
# 1. Los binarios ya no deben existir en ninguna rama
git log --all --oneline -- frontend/react        # debe salir vacío
git rev-list --objects --all | grep -E "frontend/(react$|leaflet$)"   # debe salir vacío

# 2. El proyecto sigue íntegro
cd backend && npm run lint && npm run typecheck && npm test -- --coverage
cd ../frontend && npm run lint && npx tsc -b && npm run build

# 3. Tamaño resultante
du -sh .git
```

### 3.5 Restaurar remotos y publicar

```bash
git remote add origin https://github.com/AgroConnect-superapp-fp/AgroConnect.git
git remote add personal https://github.com/fabiansuez183iii-boop/agroconnect.git   # corregir usuario real
git fetch origin

# Force-push coordinado (con --force-with-lease para no pisar trabajo ajeno)
git push origin main --force-with-lease
git push origin develop --force-with-lease

# El PR #1 se recalcula automáticamente (misma rama head)
```

### 3.6 Comunicación al equipo

Publicar en el PR #1 y/o canal del equipo:

> Se reescribió la historia para eliminar binarios accidentales (~152 MB). Todos los hashes cambiaron. Si ya habías clonado, vuelve a clonar o ejecuta:
> `git fetch origin && git reset --hard origin/develop`

## 4. Plan de reversión

Si algo falla:

```bash
# Restaurar desde el mirror
cd /ruta/segura && git clone /tmp/opencode/agroconnect-backup-20261003.git agroconnect-restore
# O reemplazar el repo de trabajo por el clon restaurado
```

El mirror contiene el estado exacto previo a la reescritura (todas las ramas y tags).

## 5. Decisión pendiente

- [ ] Aprobación del Tech Lead / equipo (Scrum Master: Nelson Fabián Gallego Sánchez)
- [ ] Confirmar que ningún miembro ha clonado el repositorio
- [ ] Ejecutar en ventana acordada (idealmente antes del merge del PR #1)
- [ ] Publicar el aviso de re-clonación
