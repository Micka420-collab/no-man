#!/usr/bin/env python3
"""Construit data/recipes.json : toutes les recettes de raffinage et de cuisine.

- Raffineur (Refinery) : ~357 recettes (portable, moyen, grand raffineur).
- Nutriment (NutrientProcessor) : ~1300 recettes de cuisine.

Le fichier est normalisé pour rester léger : les objets (entrées/sorties) sont
stockés une seule fois dans un dictionnaire `items` (nom FR/EN + icône), et
chaque recette n'y fait que référence par identifiant. Les noms d'opérations
sont traduits une fois en français au moment de la construction.

Source : projet communautaire Assistant for No Man's Sky
(app.nmsassistant.com), FR + EN.
"""

import json
import re
import ssl
import sys
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from fetch_news import _translate_one  # réutilise le traducteur EN→FR
except Exception:  # noqa: BLE001
    def _translate_one(_text):  # repli : pas de traduction
        return None

BASE = "https://app.nmsassistant.com/assets/json"
VER = "?v=0.50.0"
ASSETS_IMG = "https://app.nmsassistant.com/assets/images/"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USER_AGENT = "nms-tracker/1.0 (recettes No Man's Sky)"

# Catalogues à indexer pour résoudre les identifiants d'objets.
ITEM_CATS = [
    "RawMaterials.lang", "Products.lang", "Curiosity.lang", "Cooking.lang",
    "TradeItems.lang", "Others.lang", "ConstructedTechnology.lang",
    "Technology.lang", "TechnologyModule.lang",
]


def fetch(path: str):
    req = urllib.request.Request(f"{BASE}/{path}.json{VER}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=45, context=ssl.create_default_context()) as resp:
        return json.loads(resp.read().decode("utf-8"))


def clean(text: str) -> str:
    text = unescape(text or "")
    text = re.sub(r"<[^>]*>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def icon_url(item: dict) -> str:
    cdn = item.get("CdnUrl")
    if cdn:
        return cdn
    icon = item.get("Icon")
    return ASSETS_IMG + icon if icon else ""


def build_item_index() -> dict:
    idx: dict[str, dict] = {}
    for lang, key in (("en", "en"), ("fr", "fr")):
        for cat in ITEM_CATS:
            try:
                for it in fetch(f"{lang}/{cat}"):
                    rec = idx.setdefault(it["Id"], {})
                    rec[key] = clean(it.get("Name", ""))
                    if "icon" not in rec:
                        rec["icon"] = icon_url(it)
            except Exception:  # noqa: BLE001
                continue
    return idx


# Préfixes d'opération à retirer, avec leur libellé FR/EN.
OP_PREFIX = {
    "Requested Operation:": ("Opération", "Operation"),
    "Processor Setting:": ("Réglage", "Setting"),
}


def split_op(op: str):
    for pref, (fr, en) in OP_PREFIX.items():
        if op.startswith(pref):
            return op[len(pref):].strip(), fr, en
    return op.strip(), "Opération", "Operation"


def main() -> int:
    now = datetime.now(timezone.utc).isoformat()
    idx = build_item_index()
    refinery = fetch("en/Refinery.lang")
    nutrient = fetch("en/NutrientProcessor.lang")

    used_ids: set[str] = set()

    def convert(recipes: list) -> list:
        out = []
        for r in recipes:
            inputs = [[i["Id"], i.get("Quantity", 1)] for i in r.get("Inputs", [])]
            outp = r.get("Output", {})
            for i in inputs:
                used_ids.add(i[0])
            used_ids.add(outp.get("Id", ""))
            op_name, _pf_fr, _pf_en = split_op(r.get("Operation", ""))
            out.append({
                "id": r.get("Id", ""),               # identifiant stable (ref##, nut##)
                "i": inputs,
                "o": [outp.get("Id", ""), outp.get("Quantity", 1)],
                "op": op_name,
                "t": r.get("Time", ""),
            })
        return out

    ref = convert(refinery)
    cook = convert(nutrient)

    # Traduction unique des noms d'opérations (best-effort, avec cache local).
    prev = {}
    if (DATA_DIR / "recipes.json").exists():
        try:
            old = json.loads((DATA_DIR / "recipes.json").read_text("utf-8"))
            prev = old.get("op_fr", {})
        except Exception:  # noqa: BLE001
            prev = {}
    ops = sorted({r["op"] for r in ref + cook})
    op_fr = {}
    for op in ops:
        if op in prev and prev[op]:
            op_fr[op] = prev[op]
            continue
        fr = _translate_one(op)
        op_fr[op] = fr or op
    print(f"opérations traduites : {sum(1 for o in ops if op_fr.get(o) != o)}/{len(ops)}")

    # Dictionnaire d'objets réduit aux identifiants réellement utilisés.
    items = {}
    for iid in used_ids:
        if not iid:
            continue
        rec = idx.get(iid, {})
        items[iid] = {
            "fr": rec.get("fr") or rec.get("en") or iid,
            "en": rec.get("en") or rec.get("fr") or iid,
            "icon": rec.get("icon", ""),
        }

    payload = {
        "updated_at": now,
        "note": "Recettes de raffinage et de cuisine de No Man's Sky. "
        "Cherche par ingrédient ou par résultat.",
        "op_fr": op_fr,
        "items": items,
        "refiner": ref,
        "cooking": cook,
    }
    (DATA_DIR / "recipes.json").write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    icons = sum(1 for v in items.values() if v["icon"])
    print(f"recipes.json écrit : {len(ref)} raffinage + {len(cook)} cuisine, "
          f"{len(items)} objets ({icons} avec icône)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERREUR recettes : {exc}", file=sys.stderr)
        sys.exit(0 if (DATA_DIR / "recipes.json").exists() else 1)
