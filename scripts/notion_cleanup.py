#!/usr/bin/env python3
"""
Aplica limpieza de bases de Casos de Uso e Historias de Usuario en Notion.

Usa los planes generados en:
  - /tmp/cu_cleanup_plan.json
  - /tmp/hu_cleanup_plan.json

Acciones:
  - Estandariza títulos de CU de "CU # NN" a "CU#NN".
  - Elimina entradas de módulo/vacías/duplicadas.
"""

import json
import os
import sys
import time
from pathlib import Path

import requests

NOTION_AGROCONNECT_TOKEN = os.environ.get("NOTION_AGROCONNECT_TOKEN")
if not NOTION_AGROCONNECT_TOKEN:
    raise RuntimeError("Falta NOTION_AGROCONNECT_TOKEN en el entorno")

HEADERS = {
    "Authorization": f"Bearer {NOTION_AGROCONNECT_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}
BASE_URL = "https://api.notion.com/v1"


def notion_patch(page_id: str, payload: dict) -> dict:
    url = f"{BASE_URL}/pages/{page_id}"
    for attempt in range(5):
        resp = requests.patch(url, headers=HEADERS, json=payload, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 429:
            wait = 2**attempt
            print(f"  Rate limit para {page_id}, esperando {wait}s...")
            time.sleep(wait)
            continue
        resp.raise_for_status()
    raise RuntimeError(f"No se pudo actualizar {page_id}")


def update_cu_title(page_id: str, new_title: str) -> None:
    payload = {
        "properties": {
            "NOMBRE DEL MÓDULO / CASO DE USO": {
                "title": [{"text": {"content": new_title}}]
            }
        }
    }
    notion_patch(page_id, payload)


def trash_page(page_id: str) -> None:
    notion_patch(page_id, {"in_trash": True})


def load_plan(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    cu_plan = load_plan("/tmp/cu_cleanup_plan.json")
    hu_plan = load_plan("/tmp/hu_cleanup_plan.json")

    # CU updates
    updates = [a for a in cu_plan["actions"] if a["action"] == "update_title"]
    cu_deletes = cu_plan.get("delete_page_ids", [])

    print(f"Actualizando {len(updates)} títulos de CU...")
    for i, action in enumerate(updates, 1):
        page_id = action["page_id"]
        new_title = action["new_title"]
        print(f"  [{i}/{len(updates)}] {page_id} -> {new_title}")
        update_cu_title(page_id, new_title)
        time.sleep(0.2)

    print(f"\nEliminando {len(cu_deletes)} entradas de CU...")
    for i, page_id in enumerate(cu_deletes, 1):
        print(f"  [{i}/{len(cu_deletes)}] {page_id}")
        trash_page(page_id)
        time.sleep(0.2)

    hu_deletes = hu_plan.get("actions", {}).get("delete", [])
    print(f"\nEliminando {len(hu_deletes)} entradas de HU...")
    for i, action in enumerate(hu_deletes, 1):
        page_id = action["page_id"]
        print(f"  [{i}/{len(hu_deletes)}] {page_id}")
        trash_page(page_id)
        time.sleep(0.2)

    print("\nLimpieza completada.")


if __name__ == "__main__":
    main()
