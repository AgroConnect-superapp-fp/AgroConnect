#!/usr/bin/env python3
"""
Cliente ligero de Jira Cloud para AgroConnect.

Usa los endpoints no deprecados de Atlassian:
  - POST /rest/api/3/search/jql
  - GET  /rest/api/3/issue/{key}

Variables de entorno:
  JIRA_INSTANCE_URL  (ej. https://agroconnect.atlassian.net/)
  JIRA_USER_EMAIL
  JIRA_API_KEY
"""

import json
import os
import urllib.error
import urllib.request
from base64 import b64encode
from typing import Any


def _get_auth() -> tuple[str, str]:
    email = os.environ.get("JIRA_USER_EMAIL") or os.environ.get("JIRA_EMAIL")
    token = os.environ.get("JIRA_API_KEY") or os.environ.get("JIRA_API_TOKEN")
    if not email or not token:
        raise RuntimeError("Faltan JIRA_USER_EMAIL/JIRA_API_KEY en el entorno")
    return email, token


def _get_base_url() -> str:
    url = os.environ.get("JIRA_INSTANCE_URL", "").rstrip("/")
    if not url:
        raise RuntimeError("Falta JIRA_INSTANCE_URL en el entorno")
    return url


def _request(method: str, path: str, data: dict | None = None) -> Any:
    email, token = _get_auth()
    base = _get_base_url()
    url = f"{base}{path}"

    headers = {
        "Authorization": f"Basic {b64encode(f'{email}:{token}'.encode()).decode()}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode(errors="replace")
        raise RuntimeError(
            f"Jira API error {exc.code}: {exc.reason}\n{error_body[:500]}"
        ) from exc


def search_jql(
    jql: str,
    fields: list[str] | None = None,
    max_results: int = 100,
    next_page_token: str | None = None,
) -> dict:
    payload = {
        "jql": jql,
        "maxResults": min(max_results, 100),
        "fields": fields
        or ["summary", "status", "issuetype", "description", "created", "updated"],
    }
    if next_page_token:
        payload["nextPageToken"] = next_page_token
    return _request("POST", "/rest/api/3/search/jql", payload)


def get_issue(key: str, fields: list[str] | None = None) -> dict:
    field_param = ",".join(fields) if fields else "*all"
    return _request("GET", f"/rest/api/3/issue/{key}?fields={field_param}")


def get_project(key: str) -> dict:
    return _request("GET", f"/rest/api/3/project/{key}")


def get_all_issues(jql: str, fields: list[str] | None = None) -> list[dict]:
    """Recorre todas las páginas de resultados."""
    issues: list[dict] = []
    token = None
    while True:
        data = search_jql(jql, fields=fields, max_results=100, next_page_token=token)
        batch = data.get("issues", [])
        issues.extend(batch)
        token = data.get("nextPageToken")
        if not token or not batch:
            break
    return issues


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Uso: python jira_client.py search '<JQL>'")
        print("     python jira_client.py issue <KEY>")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "search":
        jql = sys.argv[2] if len(sys.argv) > 2 else "project=SCRUM"
        result = search_jql(jql)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif cmd == "issue":
        key = sys.argv[2]
        result = get_issue(key)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Comando desconocido: {cmd}")
        sys.exit(1)
