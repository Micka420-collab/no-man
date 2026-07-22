#!/usr/bin/env python3
"""Construit data/catalogue.json : la base de données d'objets de No Man's Sky.

Une encyclopédie interrogeable de plusieurs milliers d'objets du jeu, en
français et en anglais, regroupés par famille : matériaux, produits,
technologies, modules, technologies construites, marchandises, curiosités,
cuisine et objets divers. Chaque objet expose nom, groupe, description
nettoyée, valeur de base, devise et icône (CDN AssistantNMS).

Source : données du jeu extraites par le projet communautaire Assistant for
No Man's Sky (app.nmsassistant.com), disponibles FR + EN.
"""

import json
import re
import ssl
import sys
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

BASE = "https://app.nmsassistant.com/assets/json"
VER = "?v=0.50.0"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USER_AGENT = "nms-tracker/1.0 (catalogue No Man's Sky)"

# clé d'affichage -> (icône, fichier .lang, cap d'objets pour rester léger)
# Caps retirés : on référence désormais TOUT le contenu du jeu.
CATEGORIES = [
    ("raw", "🪨", "RawMaterials.lang", None),
    ("products", "⚗️", "Products.lang", None),
    ("tech", "🔧", "Technology.lang", None),
    ("modules", "🧩", "TechnologyModule.lang", None),
    ("upgrades", "⚡", "UpgradeModules.lang", None),
    ("built", "🏗️", "ConstructedTechnology.lang", None),
    ("buildings", "🏛️", "Buildings.lang", None),
    ("trade", "📦", "TradeItems.lang", None),
    ("curiosities", "💎", "Curiosity.lang", None),
    ("procprod", "🌀", "ProceduralProducts.lang", None),
    ("cooking", "🍳", "Cooking.lang", None),
    ("others", "🧿", "Others.lang", None),
]


def fetch(path: str):
    url = f"{BASE}/{path}.json{VER}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=45, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


ASSETS_IMG = "https://app.nmsassistant.com/assets/images/"


def icon_url(item: dict) -> str:
    cdn = item.get("CdnUrl")
    if cdn:
        return cdn
    icon = item.get("Icon")
    return ASSETS_IMG + icon if icon else ""


def clean_text(text: str) -> str:
    """Nettoie le balisage du jeu : balises <COLOR>…<>, jetons vides <> et
    marqueurs de gabarit %NAME% laissés dans les données extraites."""
    text = unescape(text or "")
    text = re.sub(r"<[^>]*>", "", text)          # <CATALYST>…, et le jeton vide <>
    text = re.sub(r"%[A-Z_]+%", "…", text)         # gabarits %NAME%, %AMOUNT%…
    return re.sub(r"\s+", " ", text).strip()


# alias rétrocompatible
clean_desc = clean_text


def merge_category(name: str, path: str, cap) -> list[dict]:
    en_items = fetch(f"en/{path}")
    try:
        fr_by_id = {x["Id"]: x for x in fetch(f"fr/{path}")}
    except Exception:  # noqa: BLE001
        fr_by_id = {}
    out = []
    for item in en_items:
        fr = fr_by_id.get(item.get("Id"), {})
        currency = item.get("CurrencyType", "Credits")
        out.append(
            {
                "id": item.get("Id", ""),
                "name_en": clean_text(item.get("Name", "")),
                "name_fr": clean_text(fr.get("Name") or item.get("Name", "")),
                "group_en": clean_text(item.get("Group", "")),
                "group_fr": clean_text(fr.get("Group") or item.get("Group", "")),
                "desc_en": clean_text(item.get("Description", ""))[:280],
                "desc_fr": clean_text(fr.get("Description") or item.get("Description", ""))[:280],
                "value": item.get("BaseValueUnits", 0),
                # "None" est une sentinelle sans unité : on la normalise en null.
                "currency": currency if currency and currency != "None" else None,
                "icon": icon_url(item),
            }
        )
    # objets nommés seulement, triés par valeur décroissante
    out = [x for x in out if x["name_en"]]
    out.sort(key=lambda x: -(x["value"] or 0))
    if cap:
        out = out[:cap]
    return out


def main() -> int:
    now = datetime.now(timezone.utc).isoformat()
    categories = {}
    total = 0
    for name, icon, path, cap in CATEGORIES:
        try:
            items = merge_category(name, path, cap)
        except Exception as exc:  # noqa: BLE001
            print(f"ERREUR {name} : {exc}", file=sys.stderr)
            continue
        categories[name] = {"icon": icon, "items": items}
        total += len(items)
        print(f"{name} : {len(items)} objets")

    if not categories:
        print("Aucune catégorie récupérée", file=sys.stderr)
        return 1

    payload = {"updated_at": now, "total": total, "categories": categories}
    (DATA_DIR / "catalogue.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print(f"catalogue.json écrit : {total} objets au total")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERREUR catalogue : {exc}", file=sys.stderr)
        sys.exit(0 if (DATA_DIR / "catalogue.json").exists() else 1)
