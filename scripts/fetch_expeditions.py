#!/usr/bin/env python3
"""Construit data/expeditions.json : l'historique des expéditions No Man's Sky.

Les expéditions sont des événements communautaires à durée limitée. Ce script
récupère la liste officielle (numéro, titre, dates de début/fin, thème) depuis
le wiki communautaire via son API MediaWiki, et traduit le thème en français.

Source : wiki No Man's Sky (Fandom), page « List of Expeditions ».
"""

import json
import re
import ssl
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from fetch_news import _translate_one
except Exception:  # noqa: BLE001
    def _translate_one(_text):
        return None

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
API = "https://nomanssky.fandom.com/api.php"
USER_AGENT = "nms-tracker/1.0 (expeditions No Man's Sky)"


def fetch_wikitext(page: str) -> str:
    q = urllib.parse.urlencode({
        "action": "parse", "page": page, "prop": "wikitext",
        "format": "json", "formatversion": "2",
    })
    req = urllib.request.Request(f"{API}?{q}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context()) as r:
        return json.loads(r.read().decode("utf-8"))["parse"]["wikitext"]


def strip_markup(text: str) -> str:
    text = unescape(text or "")
    text = re.sub(r"\[\[[^\]|]*\|([^\]]+)\]\]", r"\1", text)   # [[lien|texte]] -> texte
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)             # [[texte]] -> texte
    text = re.sub(r"\[https?://\S+\s([^\]]+)\]", r"\1", text)   # [url texte] -> texte
    text = re.sub(r"'''?", "", text)                             # gras/italique
    text = re.sub(r"<[^>]+>", " ", text)                         # balises HTML
    text = re.sub(r"''\(redux[^)]*\)''", "", text)
    return re.sub(r"\s+", " ", text).strip()


def first_sentence(text: str, cap: int = 180) -> str:
    text = strip_markup(text)
    m = re.match(r"(.+?[.!?])(\s|$)", text)
    s = m.group(1) if m else text
    return (s[:cap].rstrip() + "…") if len(s) > cap else s


def parse_expeditions(wt: str) -> list[dict]:
    out = []
    for block in wt.split("\n|-\n"):
        lines = [l.rstrip() for l in block.split("\n") if l.strip().startswith("|")]
        if not lines:
            continue
        m = re.match(r"^\|\s*(\d+)\b", lines[0])
        if not m:
            continue
        num = int(m.group(1))
        title = ""
        for l in lines:
            t = re.search(r"\[\[Expedition \d+:[^\|\]]*\|([^\]]+)\]\]", l)
            if t:
                title = t.group(1).strip()
                break
        datecells = [l for l in lines if re.search(r"\d{4}-\d{2}-\d{2}", l)]
        start = end = ""
        if datecells:
            d1 = re.findall(r"(\d{4}-\d{2}-\d{2})", datecells[0])
            start = d1[0] if d1 else ""
            if len(datecells) > 1:
                d2 = re.findall(r"(\d{4}-\d{2}-\d{2})", datecells[1])
                end = d2[0] if d2 else ""
        # description = dernière cellule en prose (ni numéro, ni fichier, ni date)
        desc = ""
        for l in reversed(lines):
            body = l[1:].strip()
            if not body or body.startswith("[[File:") or re.match(r"^\d+$", body) \
                    or re.search(r"\d{4}-\d{2}-\d{2}", body) or "[[Expedition" in body:
                continue
            desc = first_sentence(body)
            break
        if title and start:
            out.append({"num": num, "name": title, "start": start, "end": end, "theme_en": desc})
    out.sort(key=lambda x: x["num"])
    return out


def main() -> int:
    now = datetime.now(timezone.utc).isoformat()
    exps = parse_expeditions(fetch_wikitext("List of Expeditions"))
    if not exps:
        print("Aucune expédition analysée", file=sys.stderr)
        return 1

    # Réutilise les traductions FR déjà présentes (cache) pour ne pas retraduire.
    prev = {}
    if (DATA_DIR / "expeditions.json").exists():
        try:
            for e in json.loads((DATA_DIR / "expeditions.json").read_text("utf-8")).get("items", []):
                if e.get("theme_en") and e.get("theme_fr"):
                    prev[e["theme_en"]] = e["theme_fr"]
        except Exception:  # noqa: BLE001
            prev = {}
    for e in exps:
        en = e["theme_en"]
        if en in prev:
            e["theme_fr"] = prev[en]
        else:
            e["theme_fr"] = _translate_one(en) or en

    payload = {
        "updated_at": now,
        "count": len(exps),
        "note": "Historique des expéditions communautaires de No Man's Sky "
        "(événements à durée limitée). Source : wiki No Man's Sky.",
        "items": exps,
    }
    (DATA_DIR / "expeditions.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print(f"expeditions.json écrit : {len(exps)} expéditions "
          f"(de {exps[0]['start']} à {exps[-1]['end']})")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERREUR expéditions : {exc}", file=sys.stderr)
        sys.exit(0 if (DATA_DIR / "expeditions.json").exists() else 1)
