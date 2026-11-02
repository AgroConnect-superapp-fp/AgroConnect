#!/usr/bin/env python3
"""
Construye la matriz detallada RF->CU->HU a partir del CSV de trazabilidad refinado.
Genera:
  - docs/matriz_trazabilidad_rf_cu_hu_detalle.csv (filas RF-CU-HU)
  - docs/matriz_trazabilidad_rf_cu.csv (RF->CU)
  - docs/matriz_trazabilidad_cu_hu.csv (CU->HU)
  - docs/matriz_trazabilidad_resumen_v2.md
"""

import csv
import json
import pathlib
import re
from collections import defaultdict, Counter

ROOT = pathlib.Path(
    "/home/fabian/Documents/Proyectos de Programación/Proyecto_Formativo_ADSO_SENA/AgroConnect"
)
DETAIL_CSV = ROOT / "docs" / "matriz_trazabilidad_detalle.csv"


def load():
    rows = list(csv.DictReader(DETAIL_CSV.read_text().splitlines()))
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


def main():
    rf, cu, hu = load()

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

    # Guardar CSVs
    def write_csv(path, rows, fieldnames):
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)

    write_csv(
        ROOT / "docs/matriz_trazabilidad_rf_cu.csv",
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
        ROOT / "docs/matriz_trazabilidad_cu_hu.csv",
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
        ROOT / "docs/matriz_trazabilidad_rf_cu_hu_detalle.csv",
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
    md.append(f"**Generado:** {__import__('datetime').datetime.now().isoformat()}\n")
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
        f"- CU con HU asignado: {sum(1 for c in cu_hu if c['HU_Codigo'])}/{len(cu)}"
    )
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

    (ROOT / "docs/matriz_trazabilidad_resumen_v2.md").write_text(
        "\n".join(md), encoding="utf-8"
    )

    print("RF->CU:", len(rf_cu), "filas")
    print("CU->HU:", len(cu_hu), "filas")
    print("Detalle:", len(detalle), "filas")
    print("Débiles RF->CU:", len(weak_cu))
    print("Débiles CU->HU:", len(weak_hu))


if __name__ == "__main__":
    main()
