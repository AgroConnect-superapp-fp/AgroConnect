#!/usr/bin/env python3
"""
Actualiza la propiedad de módulo (SUB-SISTEMA/Modulo) de todas las páginas CU/HU
en Notion según la asignación refinada en el CSV de trazabilidad.

Uso:
    python3 scripts/update_notion_modules.py
"""

import csv
import json
import os
import pathlib
import re
import time
import urllib.request
import urllib.error
from collections import Counter

ROOT = pathlib.Path(
    "/home/fabian/Documents/Proyectos de Programación/Proyecto_Formativo_ADSO_SENA/AgroConnect"
)
DETAIL_CSV = ROOT / "docs" / "matriz_trazabilidad_detalle.csv"
CU_JSON = ROOT / "docs" / "notion_cu_pages.json"
HU_JSON = ROOT / "docs" / "notion_hu_pages.json"

TOKEN = os.environ.get("NOTION_AGROCONNECT_TOKEN")
if not TOKEN:
    raise SystemExit("Falta NOTION_AGROCONNECT_TOKEN")

# Nombres exactos de las opciones select en Notion (obtenidos del schema de la DB)
MODULE_NAMES = {
    "M01": "M01 — Gestión de Inicio y Panel General",
    "M02": "M02 — Gestión de Usuarios y Perfiles",
    "M03": "M03 — Marketplace Agropecuario",
    "M04": "M04 — Gestión de Inventarios",
    "M05": "M05 — Comunicación Interna",
    "M06": "M06 — Gestión Logística",
    "M07": "M07 — Gestión de Pedidos",
    "M08": "M08 — Pagos y Transacciones",
    "M09": "M09 — Panel Administrativo",
    "M10": "M10 — Seguridad y Control",
    "M11": "M11 — Soporte y Ayuda",
    "M12": "M12 — IA AgroBot (Subsistema 12)",
    "M13": "M13 — Gestión de Compras",
    "M14": "M14 — Multicanal y Operación Offline",
    "M15": "M15 — Pagos Locales Colombianos",
    "M16": "M16 — Geolocalización Rural",
    "M17": "M17 — Productos Perecederos",
}

OVERRIDES = {
    "CU#02": "M02",
    "CU#03": "M04",
    "CU#15": "M09",
    "CU#22": "M02",
    "CU#35": "M13",
    "CU#37": "M02",
    "CU#39": "M16",
    "HU02": "M02",
    "HU04": "M04",
    "HU12": "M02",
    "HU13": "M02",
    "HU46": "M13",
}


def notion_request(path, method="GET", data=None):
    url = f"https://api.notion.com/v1{path}"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode(errors="replace")[:500]}


def load_detail():
    rows = list(csv.DictReader(DETAIL_CSV.read_text().splitlines()))
    for r in rows:
        code = r["Codigo"]
        if code in OVERRIDES:
            r["Modulo"] = OVERRIDES[code]
    return rows


def build_module_map(rows):
    return {r["Codigo"]: r["Modulo"] for r in rows if r["Tipo"] in ("CU", "HU")}


def parse_code(title):
    m = re.match(r"(CU#\d+|HU\d+)", title)
    return m.group(1) if m else None


def patch_page(page_id, property_name, module_code):
    module_name = MODULE_NAMES[module_code]
    data = {"properties": {property_name: {"select": {"name": module_name}}}}
    return notion_request(f"/pages/{page_id}", "PATCH", data)


def main():
    detail = load_detail()
    module_map = build_module_map(detail)

    cu_pages = json.loads(CU_JSON.read_text())
    hu_pages = json.loads(HU_JSON.read_text())

    updates = []
    errors = []

    for page in cu_pages:
        code = parse_code(page["title"])
        if not code:
            continue
        target = module_map.get(code)
        if not target:
            errors.append(f"No hay módulo para {code}")
            continue
        current = page.get("module")
        if current != MODULE_NAMES[target]:
            res = patch_page(page["page_id"], "SUB-SISTEMA", target)
            if "error" in res:
                errors.append(f"{code} -> {target}: {res}")
            else:
                updates.append(f"{code}: {current} -> {target}")
            time.sleep(0.15)

    for page in hu_pages:
        code = parse_code(page["title"])
        if not code:
            continue
        target = module_map.get(code)
        if not target:
            errors.append(f"No hay módulo para {code}")
            continue
        current = page.get("module")
        if current != MODULE_NAMES[target]:
            res = patch_page(page["page_id"], "Modulo", target)
            if "error" in res:
                errors.append(f"{code} -> {target}: {res}")
            else:
                updates.append(f"{code}: {current} -> {target}")
            time.sleep(0.15)

    print(f"Actualizaciones: {len(updates)}")
    print(f"Errores: {len(errors)}")
    if errors:
        for e in errors[:20]:
            print("ERR", e)
    # Guardar log
    log_path = ROOT / "docs" / "notion_module_updates.log"
    log_path.write_text("\n".join(updates + [""] + errors), encoding="utf-8")
    print(f"Log guardado en {log_path}")


if __name__ == "__main__":
    main()
