#!/usr/bin/env python3
"""
Normaliza la propiedad "Tipo" de las 69 HU al estándar MoSCoW.
Aprobado por el Product Owner el 2026-10-03 (docs/propuesta-normalizacion-moscow.md).

Mapeo:
  Esencial  -> Esencial (Must Have)
  Ideal     -> Deseable (Could Have)
  Opcional  -> Opcional (Won't Have por ahora)
  (los valores ya conformes no se tocan)

Uso:
    set -a; source .env; set +a
    python3 scripts/normalize_moscow.py
"""

import json
import os
import pathlib
import time
import urllib.error
import urllib.request
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG = ROOT / "docs" / "notion_hu_priority_updates.md"
DATABASE_ID = "e7bbdc33-f294-82b0-83e7-01212a00b3ba"

TOKEN = os.environ.get("NOTION_AGROCONNECT_TOKEN")
if not TOKEN:
    raise SystemExit("Falta NOTION_AGROCONNECT_TOKEN (usa: set -a; source .env; set +a)")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

MAPEO = {
    "Esencial": "Esencial (Must Have)",
    "Ideal": "Deseable (Could Have)",
    "Opcional": "Opcional (Won't Have por ahora)",
}


def request(method: str, path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        f"https://api.notion.com/v1{path}", data=data, headers=HEADERS, method=method
    )
    for intento in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 429:
                time.sleep(2 + intento)
                continue
            raise
    raise RuntimeError("Rate limit persistente de Notion")


def query_all_hus() -> list[dict]:
    results: list[dict] = []
    cursor = None
    while True:
        payload: dict = {"page_size": 100}
        if cursor:
            payload["start_cursor"] = cursor
        data = request("POST", f"/databases/{DATABASE_ID}/query", payload)
        results.extend(data.get("results", []))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return results


def main() -> None:
    hus = query_all_hus()
    print(f"HU encontradas: {len(hus)}")

    conteo_antes: Counter = Counter()
    lineas_log: list[str] = []
    cambios = 0

    for hu in hus:
        props = hu.get("properties", {})
        tipo = (props.get("Tipo") or {}).get("select") or {}
        actual = tipo.get("name") or "SIN TIPO"
        conteo_antes[actual] += 1

        nuevo = MAPEO.get(actual)
        if not nuevo:
            continue

        titulo = "".join(
            t.get("plain_text", "")
            for t in (props.get("Historia de Usuario") or {}).get("title", [])
        )
        request("PATCH", f"/pages/{hu['id']}", {"properties": {"Tipo": {"select": {"name": nuevo}}}})
        cambios += 1
        lineas_log.append(f"{titulo}: {actual} -> {nuevo}")
        print(f"  {titulo}: {actual} -> {nuevo}")
        time.sleep(0.35)

    print(f"\nCambios aplicados: {cambios}")
    print("Conteo antes:", dict(conteo_antes))

    with open(LOG, "a", encoding="utf-8") as log:
        log.write(f"\n=== Normalizacion MoSCoW {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
        log.write("\n".join(lineas_log) + "\n")
    print(f"Log de auditoria: {LOG}")


if __name__ == "__main__":
    main()
