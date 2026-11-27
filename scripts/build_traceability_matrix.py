#!/usr/bin/env python3
"""
Construye la matriz detallada RF->CU->HU a partir del CSV de trazabilidad refinado.
Genera:
  - docs/matriz_trazabilidad_rf_cu_hu_detalle.csv (filas RF-CU-HU)
  - docs/matriz_trazabilidad_rf_cu.csv (RF->CU)
  - docs/matriz_trazabilidad_cu_hu.csv (CU->HU)
  - docs/matriz_trazabilidad_resumen_v2.md

Principio de autoridad (SENA):
  Los CSV de trazabilidad son artefactos curados a mano. El generador es un
  bootstrap: NUNCA borra una relación existente y solo añade los pares que
  falten. Por eso las multi-relaciones manuales de M17 (CU#66 -> HU61..HU67,
  HU69) y las equivalencias aprobadas por D7 (CU#31 -> HU33) sobreviven a una
  regeneración.

Modos de uso:
  python3 scripts/build_traceability_matrix.py            # regenera (no destructivo)
  python3 scripts/build_traceability_matrix.py --check    # valida sin escribir
"""

import csv
import pathlib
import re
import sys
from collections import defaultdict, Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
DETAIL_CSV = ROOT / "docs" / "matriz_trazabilidad_detalle.csv"
RF_CU_CSV = ROOT / "docs" / "matriz_trazabilidad_rf_cu.csv"
CU_HU_CSV = ROOT / "docs" / "matriz_trazabilidad_cu_hu.csv"
RF_CU_HU_DETAIL_CSV = ROOT / "docs" / "matriz_trazabilidad_rf_cu_hu_detalle.csv"
MODULES_CSV = ROOT / "docs" / "matriz_trazabilidad_rf_cu_hu.csv"
RESUMEN_MD = ROOT / "docs" / "matriz_trazabilidad_resumen_v2.md"

# Equivalencias aprobadas por la decisión D7 del 2026-11-05.
D7_APROBADAS = {
    "HU04": "HU11",
    "HU06": "HU14",
    "HU15": "HU08",
}
# Estas tres fichas de la numeración original no tienen equivalencia CU en el
# SSOT: inventar una relación para ellas está prohibido.
D7_SIN_EQUIVALENCIA = {"HU08", "HU28", "HU30"}
# Relación confirmada en la matriz detallada de Notion.
D7_RELACIONES = {("CU#31", "HU33")}


def read_csv(path):
    """Lee un CSV tolerando CRLF; devuelve lista de diccionarios."""
    if not path.exists():
        return []
    return list(csv.DictReader(path.read_text(encoding="utf-8").splitlines()))


def load():
    rows = read_csv(DETAIL_CSV)
    rf = [r for r in rows if r["Tipo"] == "RF"]
    cu = [r for r in rows if r["Tipo"] == "CU"]
    hu = [r for r in rows if r["Tipo"] == "HU"]
    return rf, cu, hu


def norm(s):
    return re.sub(r"[^a-z0-9áéíóúñ]+", " ", s.lower()).strip()


def token_score(a_title, b_title):
    a = set(norm(a_title).split())
    b = set(norm(b_title).split())
    if not a or not b:
        return 0.0
    return len(a & b) / max(len(a), len(b))


# Sobrescrituras manuales de RF -> CU (prioritarias). Usar cuando el emparejamiento
# semántico es claro para el dominio aunque los títulos no compartan tokens.
RF_CU_OVERRIDES = {
    "RF-01": "CU#09",  # Autenticación -> Dashboard del productor (M01)
    "RF-02": "CU#09",  # Recuperación contraseña -> Dashboard (M01)
    "RF-03": "CU#36",  # Control de sesiones -> Preferencias iniciales (M01)
    "RF-04": "CU#09",  # Panel general por rol -> Dashboard del productor (M01)
    "RF-05": "CU#01",  # Registro multi-rol -> Registrar productor (M02)
    "RF-07": "CU#15",  # Gestión roles -> Gestionar usuarios admin (M09/M02)
    "RF-08": "CU#15",  # Búsqueda consulta usuarios -> Gestionar usuarios admin
    "RF-14": "CU#06",  # Solicitud de compra -> Publicar demanda B2B (M03)
    "RF-16": "CU#08",  # Calificaciones -> Calificar transacción (M03)
    "RF-18": "CU#27",  # Disponibilidad tiempo real -> Alertas inventario (M04)
    "RF-20": "CU#13",  # Mensajería interna -> Enviar mensaje (M05)
    "RF-23": "CU#29",  # Registro transportistas -> Registrar transportista (M06)
    "RF-24": "CU#11",  # Asignación envíos -> Asignar envío (M06)
    "RF-25": "CU#12",  # Seguimiento envíos -> Consultar estado envío (M06)
    "RF-29": "CU#21",  # Integración pagos -> Registrar transacción (M08)
    "RF-33": "CU#31",  # Gestión incidencias -> Monitorear sistema admin (M09)
    "RF-36": "CU#48",  # Copias seguridad -> Habilitar 2FA (M10)
    "RF-39": "CU#07",  # Chatbot -> Interacción con AgroBot (M12)
    "RF-40": "CU#50",  # Respuestas automáticas -> Consultar AgroBot RF (M12)
    "RF-41": "CU#51",  # Orientación contextual -> AgroBot aprende (M12)
    "RF-42": "CU#49",  # Escalamiento soporte -> Chat soporte humano (M11)
    "RF-47": "CU#57",  # App web -> Acceder desde múltiples dispositivos (M14)
    "RF-48": "CU#57",  # App Android nativa -> Múltiples dispositivos (M14)
    "RF-49": "CU#57",  # App iOS nativa -> Múltiples dispositivos (M14)
    "RF-50": "CU#56",  # Offline productor -> Sincronizar offline (M14)
    "RF-51": "CU#56",  # Offline transportista -> Sincronizar offline (M14)
    "RF-52": "CU#56",  # Cola sincronización -> Sincronizar offline (M14)
    "RF-53": "CU#56",  # Sincronización automática -> Sincronizar offline (M14)
    "RF-54": "CU#56",  # Resolución conflictos -> Sincronizar offline (M14)
    "RF-55": "CU#56",  # Caché catálogo -> Sincronizar offline (M14)
    "RF-56": "CU#59",  # Pago contra entrega -> Pagar con PSE (genérico M15)
    "RF-57": "CU#59",  # Transferencia bancaria -> Pagar con PSE (genérico M15)
    "RF-58": "CU#59",  # Pasarela tarjetas -> Pagar con PSE (genérico M15)
    "RF-59": "CU#59",  # Liquidación comisión -> Pagar con PSE (genérico M15)
    "RF-60": "CU#62",  # Facturación electrónica -> Factura CUFE (M15)
    "RF-61": "CU#63",  # Geolocalización productor -> Zona cobertura (M16)
    "RF-62": "CU#63",  # Búsqueda por proximidad -> Zona cobertura (M16)
    "RF-63": "CU#64",  # Mapa rutas -> Calcular ruta óptima (M16)
    "RF-64": "CU#63",  # Cobertura veredas -> Zona cobertura (M16)
    "RF-65": "CU#66",  # Clasificación perecibilidad -> Cadena de frío (M17)
    "RF-66": "CU#66",  # Fechas cosecha/caducidad -> Cadena de frío (M17)
    "RF-67": "CU#66",  # Ventana entrega -> Cadena de frío (M17)
    "RF-68": "CU#66",  # Trazabilidad origen-destino -> Cadena de frío (M17)
}

# Sobrescrituras manuales de CU -> HU (prioritarias)
CU_HU_OVERRIDES = {
    "CU#01": "HU01",  # Registrar productor -> Registro de usuario
    "CU#02": "HU02",  # Iniciar sesión
    "CU#03": "HU04",  # Registrar producto -> Publicar productos (M04)
    "CU#04": "HU51",  # Gestionar inventario sin conexión -> Sincronizar offline
    "CU#05": "HU43",  # Realizar pedido B2C -> Gestionar carrito de compras
    "CU#06": "HU11",  # Publicar demanda B2B -> Negociación empresarial
    "CU#07": "HU39",  # Interacción con AgroBot -> Chatbot IA
    "CU#08": "HU19",  # Calificar transacción -> Calificaciones
    "CU#09": "HU14",  # Dashboard productor -> Panel general
    "CU#10": "HU07",  # Gestionar pedido productor -> Registro de pedidos
    "CU#11": "HU26",  # Asignar envío
    "CU#12": "HU27",  # Consultar estado envío -> Seguimiento de envíos
    "CU#13": "HU22",  # Enviar mensaje -> Mensajería interna
    "CU#14": "HU23",  # Historial mensajes
    "CU#15": "HU09",  # Gestionar usuarios admin -> Gestión de roles
    "CU#16": "HU10",  # Generar reportes
    "CU#17": "HU34",  # Gestionar accesos -> Control de accesos
    "CU#18": "HU35",  # Registrar actividad
    "CU#19": "HU38",  # Crear ticket -> Gestión de tickets
    "CU#20": "HU37",  # Centro de ayuda
    "CU#21": "HU31",  # Registrar transacción
    "CU#22": "HU12",  # Recuperar contraseña
    "CU#23": "HU03",  # Editar perfil -> Gestión de perfil
    "CU#24": "HU05",  # Explorar productos
    "CU#25": "HU18",  # Buscar con filtros
    "CU#26": "HU17",  # Reputación
    "CU#27": "HU20",  # Disponibilidad y alertas inventario
    "CU#28": "HU13",  # Recibir notificaciones -> Control de sesiones (fallback)
    "CU#29": "HU25",  # Registrar transportista
    "CU#30": "HU29",  # Historial de pedidos
    "CU#31": "HU32",  # Monitorear sistema
    "CU#32": "HU43",  # Carrito de compras
    "CU#33": "HU44",  # Confirmar pedido
    "CU#34": "HU45",  # Historial de compras
    "CU#35": "HU46",  # Calificar productos adquiridos
    "CU#36": "HU14",  # Preferencias iniciales -> Panel general
    "CU#37": "HU13",  # Configurar notificaciones -> Control de sesiones (fallback)
    "CU#38": "HU16",  # Exportar datos personales -> Desactivación de usuarios (fallback)
    "CU#39": "HU58",  # Filtrar por geolocalización cercana -> Definir zona de cobertura
    "CU#40": "HU05",  # Comparar productos -> Visualización de productos
    "CU#41": "HU21",  # Sincronizar inventario -> Alertas de stock
    "CU#42": "HU24",  # Grupo chat pedido -> Notificaciones de mensajes
    "CU#43": "HU26",  # Asignar transportista rating -> Asignación de envíos
    "CU#44": "HU47",  # Cancelar pedido -> Seguimiento de pedido
    "CU#45": "HU48",  # Procesar reembolso -> Cierre de transacción
    "CU#46": "HU31",  # Reporte contabilidad -> Registro de transacciones
    "CU#47": "HU16",  # Banear usuario -> Desactivación de usuarios
    "CU#48": "HU36",  # 2FA -> Copias de seguridad (fallback, seguridad)
    "CU#49": "HU42",  # Soporte humano -> Soporte inicial
    "CU#50": "HU40",  # Consultar AgroBot RF -> Respuestas automáticas
    "CU#51": "HU41",  # AgroBot aprende -> Orientación al usuario
    "CU#52": "HU39",  # AgroBot detecta idioma -> Chatbot IA
    "CU#53": "HU43",  # Código descuento -> Carrito de compras
    "CU#54": "HU49",  # SMS alerta crítica
    "CU#55": "HU50",  # USSD precios
    "CU#56": "HU51",  # Sincronizar offline
    "CU#57": "HU52",  # Múltiples dispositivos
    "CU#58": "HU53",  # Notificar productor sin conexión -> Estado online usuarios
    "CU#59": "HU54",  # PSE
    "CU#60": "HU55",  # Nequi
    "CU#61": "HU56",  # Daviplata
    "CU#62": "HU57",  # Factura CUFE
    "CU#63": "HU58",  # Zona de cobertura
    "CU#64": "HU59",  # Ruta óptima
    "CU#65": "HU60",  # Tracking transportista
    "CU#66": "HU68",  # Auditar cadena de frío -> Cumplir auditoría
}


def best_match(source, candidates, overrides, source_code_field="Codigo"):
    code = source["Codigo"]
    if code in overrides:
        target = next((c for c in candidates if c["Codigo"] == overrides[code]), None)
        if target:
            return target, 1.0
    same_mod = [c for c in candidates if c["Modulo"] == source["Modulo"]]
    if not same_mod:
        return None, 0.0
    scored = [(c, token_score(source["Titulo"], c["Titulo"])) for c in same_mod]
    scored.sort(key=lambda x: -x[1])
    return scored[0]


def build(rf, cu, hu):
    """Calcula las matrices sin tocar el disco (función pura)."""
    rf_cu = []
    for r in rf:
        c, score = best_match(r, cu, RF_CU_OVERRIDES)
        rf_cu.append(
            {
                "RF_Codigo": r["Codigo"],
                "RF_Titulo": r["Titulo"],
                "RF_Modulo": r["Modulo"],
                "CU_Codigo": c["Codigo"] if c else "",
                "CU_Titulo": c["Titulo"] if c else "",
                "Score": round(score, 2),
                "Calidad": "Fuerte" if score >= 0.25 else "Débil",
            }
        )

    cu_hu = []
    for c in cu:
        h, score = best_match(c, hu, CU_HU_OVERRIDES)
        cu_hu.append(
            {
                "CU_Codigo": c["Codigo"],
                "CU_Titulo": c["Titulo"],
                "CU_Modulo": c["Modulo"],
                "HU_Codigo": h["Codigo"] if h else "",
                "HU_Titulo": h["Titulo"] if h else "",
                "Score": round(score, 2),
                "Calidad": "Fuerte" if score >= 0.25 else "Débil",
            }
        )

    # Matriz RF->CU->HU detallada (una fila por RF)
    cu_to_hu = {row["CU_Codigo"]: row for row in cu_hu}
    detalle = []
    for rc in rf_cu:
        ch = cu_to_hu.get(rc["CU_Codigo"], {})
        detalle.append(
            {
                "RF_Codigo": rc["RF_Codigo"],
                "RF_Titulo": rc["RF_Titulo"],
                "RF_Modulo": rc["RF_Modulo"],
                "CU_Codigo": rc["CU_Codigo"],
                "CU_Titulo": rc["CU_Titulo"],
                "HU_Codigo": ch.get("HU_Codigo", ""),
                "HU_Titulo": ch.get("HU_Titulo", ""),
                "Calidad_CU": rc["Calidad"],
                "Calidad_HU": ch.get("Calidad", ""),
            }
        )

    return rf_cu, cu_hu, detalle


def merge_pairs(generated, existing, key_fields):
    """El CSV curado a mano manda: el generador solo añade pares que falten.

    Garantiza que una regeneración nunca borra una relación manual (multi-
    relaciones de M17 ni equivalencias D7) y que el resultado sea idempotente.
    """
    existing_keys = {tuple(row[f] for f in key_fields) for row in existing}
    merged = list(existing)
    for row in generated:
        key = tuple(row[f] for f in key_fields)
        if key not in existing_keys:
            merged.append(row)
            existing_keys.add(key)
    return merged


def merge_single(generated, existing, key):
    """Igual que `merge_pairs` pero con una sola clave (una fila por elemento)."""
    return merge_pairs(generated, existing, (key,))


def write_csv(path, rows, fieldnames):
    """Escribe CSV con CRLF, igual que el formato histórico de los artefactos."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def main():
    rf, cu, hu = load()
    rf_cu, cu_hu, detalle = build(rf, cu, hu)

    # Fusión no destructiva con lo que ya está curado a mano.
    rf_cu = merge_single(rf_cu, read_csv(RF_CU_CSV), "RF_Codigo")
    cu_hu = merge_pairs(cu_hu, read_csv(CU_HU_CSV), ("CU_Codigo", "HU_Codigo"))
    detalle = merge_single(detalle, read_csv(RF_CU_HU_DETAIL_CSV), "RF_Codigo")

    write_csv(
        RF_CU_CSV,
        rf_cu,
        [
            "RF_Codigo",
            "RF_Titulo",
            "RF_Modulo",
            "CU_Codigo",
            "CU_Titulo",
            "Score",
            "Calidad",
        ],
    )
    write_csv(
        CU_HU_CSV,
        cu_hu,
        [
            "CU_Codigo",
            "CU_Titulo",
            "CU_Modulo",
            "HU_Codigo",
            "HU_Titulo",
            "Score",
            "Calidad",
        ],
    )
    write_csv(
        RF_CU_HU_DETAIL_CSV,
        detalle,
        [
            "RF_Codigo",
            "RF_Titulo",
            "RF_Modulo",
            "CU_Codigo",
            "CU_Titulo",
            "HU_Codigo",
            "HU_Titulo",
            "Calidad_CU",
            "Calidad_HU",
        ],
    )

    # Resumen por módulo
    counts = defaultdict(lambda: {"RF": 0, "CU": 0, "HU": 0})
    for r in rf:
        counts[r["Modulo"]]["RF"] += 1
    for c in cu:
        counts[c["Modulo"]]["CU"] += 1
    for h in hu:
        counts[h["Modulo"]]["HU"] += 1

    weak_cu = [r for r in rf_cu if r["Calidad"] == "Débil"]
    weak_hu = [r for r in cu_hu if r["Calidad"] == "Débil"]

    md = []
    md.append("# Matriz de Trazabilidad RF↔CU↔HU — Resumen\n")
    md.append("**Origen:** `scripts/build_traceability_matrix.py` (generación no destructiva)\n")
    md.append(f"**Totales:** {len(rf)} RF, {len(cu)} CU, {len(hu)} HU\n")
    md.append("## Conteos por módulo\n")
    md.append("| Módulo | RF | CU | HU | Observación |")
    md.append("|--------|----|----|----|-------------|")
    for m in sorted(counts):
        c = counts[m]
        obs = ""
        if m == "M17":
            obs = "M17 tiene 1 CU para 9 HU; todos los HU se trazan a CU#66."
        elif c["RF"] > c["CU"]:
            obs = "Más RF que CU; algunos RF comparten CU."
        md.append(f"| {m} | {c['RF']} | {c['CU']} | {c['HU']} | {obs} |")
    md.append("\n## Cobertura\n")
    md.append(
        f"- RF con CU asignado: {sum(1 for r in rf_cu if r['CU_Codigo'])}/{len(rf)}"
    )
    md.append(
        f"- CU con HU asignado: "
        f"{len({c['CU_Codigo'] for c in cu_hu if c['HU_Codigo']})}/{len(cu)}"
    )
    md.append(f"- Relaciones CU→HU totales: {len(cu_hu)}")
    md.append(f"- Relaciones RF→CU débiles: {len(weak_cu)}")
    md.append(f"- Relaciones CU→HU débiles: {len(weak_hu)}")
    md.append("\n## Mapeos débiles RF→CU (requieren validación humana)\n")
    for r in weak_cu:
        md.append(
            f"- **{r['RF_Codigo']}** {r['RF_Titulo']} → **{r['CU_Codigo']}** {r['CU_Titulo']}"
        )
    md.append("\n## Mapeos débiles CU→HU (requieren validación humana)\n")
    for r in weak_hu:
        md.append(
            f"- **{r['CU_Codigo']}** {r['CU_Titulo']} → **{r['HU_Codigo']}** {r['HU_Titulo']}"
        )
    md.append("\n## Archivos generados\n")
    md.append("- `docs/matriz_trazabilidad_rf_cu.csv`")
    md.append("- `docs/matriz_trazabilidad_cu_hu.csv`")
    md.append("- `docs/matriz_trazabilidad_rf_cu_hu_detalle.csv`")
    md.append("- `docs/matriz_trazabilidad_detalle.csv`")

    RESUMEN_MD.write_text("\n".join(md), encoding="utf-8")

    print("RF->CU:", len(rf_cu), "filas")
    print("CU->HU:", len(cu_hu), "filas")
    print("Detalle:", len(detalle), "filas")
    print("Débiles RF->CU:", len(weak_cu))
    print("Débiles CU->HU:", len(weak_hu))


def check():
    """Valida la matriz sin escribir archivos (`--check`)."""
    rf, cu, hu = load()
    failures = []
    expected = {"RF": 68, "CU": 66, "HU": 69}

    # 1) Integridad de la fuente de verdad (detalle.csv)
    for kind, rows in (("RF", rf), ("CU", cu), ("HU", hu)):
        codes = [r["Codigo"] for r in rows]
        duplicates = [c for c, n in Counter(codes).items() if n > 1]
        if duplicates:
            failures.append(f"{kind}: códigos duplicados {duplicates}")
        if len(codes) != expected[kind]:
            failures.append(f"{kind}: {len(codes)} filas, esperado {expected[kind]}")
        numbers = sorted(int(re.sub(r"\D", "", c)) for c in codes)
        missing = [
            i for i in range(1, (numbers[-1] if numbers else 0) + 1) if i not in numbers
        ]
        if missing:
            failures.append(f"{kind}: faltan {missing[:10]}")

    cu_hu = read_csv(CU_HU_CSV)
    rf_cu = read_csv(RF_CU_CSV)
    detalle = read_csv(RF_CU_HU_DETAIL_CSV)

    # 2) Integridad referencial de las matrices derivadas
    cu_codes = {r["Codigo"] for r in cu}
    hu_codes = {r["Codigo"] for r in hu}
    rf_codes = {r["Codigo"] for r in rf}

    unknown_cu = sorted({r["CU_Codigo"] for r in cu_hu if r["CU_Codigo"]} - cu_codes)
    if unknown_cu:
        failures.append(f"cu_hu.csv: CU inexistentes {unknown_cu}")
    unknown_hu = sorted({r["HU_Codigo"] for r in cu_hu if r["HU_Codigo"]} - hu_codes)
    if unknown_hu:
        failures.append(f"cu_hu.csv: HU inexistentes {unknown_hu}")
    duplicated_pairs = [
        pair
        for pair, n in Counter((r["CU_Codigo"], r["HU_Codigo"]) for r in cu_hu).items()
        if n > 1
    ]
    if duplicated_pairs:
        failures.append(f"cu_hu.csv: pares CU→HU duplicados {duplicated_pairs}")

    if len(detalle) != len(rf):
        failures.append(f"rf_cu_hu_detalle.csv: {len(detalle)} filas, esperado {len(rf)}")
    if {r["RF_Codigo"] for r in detalle} != rf_codes:
        failures.append("rf_cu_hu_detalle.csv: los códigos RF no coinciden con detalle.csv")
    unknown_rf = sorted({r["RF_Codigo"] for r in rf_cu} - rf_codes)
    if unknown_rf:
        failures.append(f"rf_cu.csv: RF inexistentes {unknown_rf}")

    # 3) Decisión D7: equivalencias aprobadas y prohibición de invenciones
    related = {r["HU_Codigo"] for r in cu_hu}
    invented = sorted(D7_SIN_EQUIVALENCIA & related)
    if invented:
        failures.append(f"D7: relaciones inventadas para {invented}")

    pairs = {(r["CU_Codigo"], r["HU_Codigo"]) for r in cu_hu}
    missing_d7 = sorted(D7_RELACIONES - pairs)
    if missing_d7:
        failures.append(f"D7: falta la relación aprobada {missing_d7}")

    hu_rows = {r["Codigo"]: r for r in hu}
    for hu_code, official in D7_APROBADAS.items():
        row = hu_rows.get(hu_code, {})
        source = row.get("Fuente Asignacion", "")
        if official not in source:
            failures.append(
                f"D7: {hu_code} no registra la equivalencia oficial {official} "
                f"(Fuente Asignacion: {source!r})"
            )
    hu33 = hu_rows.get("HU33", {})
    if "CU#31" not in hu33.get("Fuente Asignacion", ""):
        failures.append("D7: HU33 no registra la confirmación CU#31")

    # 4) Módulos
    modules = read_csv(MODULES_CSV)
    if len(modules) != 17:
        failures.append(f"Módulos: {len(modules)}, esperado 17")
    module_codes = [r.get("Modulo", "") for r in modules]
    if len(set(module_codes)) != len(module_codes):
        failures.append("Módulos: hay códigos de módulo duplicados")

    # 5) No destructividad: regenerar no debe borrar ni añadir relaciones
    generated_rf_cu, generated_cu_hu, generated_detalle = build(rf, cu, hu)
    merged_cu_hu = merge_pairs(
        generated_cu_hu, cu_hu, ("CU_Codigo", "HU_Codigo")
    )
    merged_rf_cu = merge_single(generated_rf_cu, rf_cu, "RF_Codigo")
    merged_detalle = merge_single(generated_detalle, detalle, "RF_Codigo")

    def as_pairs(rows, fields):
        return {tuple(row[f] for f in fields) for row in rows}

    if as_pairs(merged_cu_hu, ("CU_Codigo", "HU_Codigo")) != as_pairs(
        cu_hu, ("CU_Codigo", "HU_Codigo")
    ):
        failures.append(
            "Generador: una regeneración cambiaría cu_hu.csv; revisa las relaciones "
            "propuestas antes de ejecutarlo"
        )
    if as_pairs(merged_rf_cu, ("RF_Codigo", "CU_Codigo")) != as_pairs(
        rf_cu, ("RF_Codigo", "CU_Codigo")
    ):
        failures.append(
            "Generador: una regeneración cambiaría rf_cu.csv; revisa las relaciones "
            "propuestas antes de ejecutarlo"
        )
    if as_pairs(merged_detalle, ("RF_Codigo", "HU_Codigo")) != as_pairs(
        detalle, ("RF_Codigo", "HU_Codigo")
    ):
        failures.append(
            "Generador: una regeneración cambiaría rf_cu_hu_detalle.csv; revisa las "
            "relaciones propuestas antes de ejecutarlo"
        )

    print("Estado D7")
    print("  aprobadas: HU06→HU14, HU15→HU08, HU04→HU11, HU33→CU#31")
    print("  sin equivalencia (no inventar): HU08, HU28, HU30 de la numeración original")
    print("  bloqueo vigente: numeración oficial v2.0 de HU08, HU11 y HU14 desplazados")
    print(
        f"  relaciones CU→HU: {len(cu_hu)} | HU con CU: {len(related)} | "
        f"HU sin CU: {len(hu_codes - related)}"
    )
    if failures:
        print("\nFALLOS:")
        for failure in failures:
            print(f"  - {failure}")
        raise SystemExit(1)
    print("\nOK: conteos, unicidad, integridad referencial, módulos, D7 y no destructividad.")


if __name__ == "__main__":
    if "--check" in sys.argv[1:]:
        check()
    else:
        main()
