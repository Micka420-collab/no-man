#!/usr/bin/env python3
"""Construit data/market.json : classements des objets les plus précieux du jeu.

Source : données du jeu extraites par le projet communautaire Assistant for
No Man's Sky (app.nmsassistant.com), disponibles en français et en anglais,
icônes servies par leur CDN.

Catégories : matériaux bruts, produits fabriqués, marchandises d'échange,
curiosités, cuisine — top par valeur de base — et le guide de pêche complet
(qualités Légendaire → Camelote avec biomes et conditions).
"""

import json
import ssl
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://app.nmsassistant.com/assets/json"
VER = "?v=0.50.0"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USER_AGENT = "nms-tracker/1.0 (classements No Man's Sky)"

CATALOGUES = {
    "raw": "RawMaterials.lang",
    "products": "Products.lang",
    "trade": "TradeItems.lang",
    "curiosities": "Curiosity.lang",
    "cooking": "Cooking.lang",
}
TOP_N = 12


def fetch_json(path: str):
    url = f"{BASE}/{path}.json{VER}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=40, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


def merge_langs(en_items: list, fr_items: list) -> dict:
    fr_by_id = {x["Id"]: x for x in fr_items}
    merged = {}
    for item in en_items:
        fr = fr_by_id.get(item["Id"], {})
        merged[item["Id"]] = {
            "id": item["Id"],
            "name_en": item.get("Name", ""),
            "name_fr": fr.get("Name") or item.get("Name", ""),
            "value": item.get("BaseValueUnits", 0),
            "currency": item.get("CurrencyType", "Credits"),
            "icon": item.get("CdnUrl", ""),
            "group_en": item.get("Group", ""),
            "group_fr": fr.get("Group") or item.get("Group", ""),
        }
    return merged


def main() -> int:
    now = datetime.now(timezone.utc).isoformat()
    categories = {}
    for key, path in CATALOGUES.items():
        merged = merge_langs(fetch_json(f"en/{path}"), fetch_json(f"fr/{path}"))
        top = sorted(merged.values(), key=lambda x: -x["value"])[:TOP_N]
        categories[key] = top
        print(f"{key} : top {len(top)} (max {top[0]['value']:.0f} {top[0]['currency']})")

    # Poissons : la version FR n'expose pas les noms localisés dans ce fichier,
    # on les récupère via le catalogue Curiosités (les poissons sont des cur###).
    fish_raw = fetch_json("en/Fishing.lang")
    cur_fr = {x["Id"]: x for x in fetch_json("fr/Curiosity.lang")}
    cur_en = {x["Id"]: x for x in fetch_json("en/Curiosity.lang")}
    fish = []
    for f in fish_raw:
        app_id = f.get("AppId", "")
        fr = cur_fr.get(app_id, {})
        en = cur_en.get(app_id, {})
        fish.append(
            {
                "name_en": en.get("Name") or f.get("Name", ""),
                "name_fr": fr.get("Name") or en.get("Name") or f.get("Name", ""),
                "quality": f.get("Quality", ""),
                "size": f.get("Size", ""),
                "time": f.get("TimeKey", "both"),
                "storm": bool(f.get("NeedsStorm")),
                "mission": bool(f.get("RequiresMission")),
                "biomes": f.get("Biomes", []),
                "value": (cur_en.get(app_id) or {}).get("BaseValueUnits", 0),
                "icon": (cur_en.get(app_id) or {}).get("CdnUrl", ""),
            }
        )
    order = {"Legendary": 0, "Epic": 1, "Desirable": 2, "Common": 3, "Junk": 4}
    fish.sort(key=lambda x: (order.get(x["quality"], 9), -x["value"]))
    print(f"poissons : {len(fish)}")

    payload = {"updated_at": now, "categories": categories, "fish": fish}
    (DATA_DIR / "market.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print("market.json écrit")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        # Les anciennes données restent en place en cas d'échec réseau.
        print(f"ERREUR marché : {exc}", file=sys.stderr)
        sys.exit(0 if (DATA_DIR / "market.json").exists() else 1)
