#!/usr/bin/env python3
"""Génère data/galaxies.json : les 255 galaxies de No Man's Sky.

Source des noms : page « Galaxy » du wiki communautaire (liste ordonnée).
Types : règle déterministe documentée par la communauté et vérifiée —
  - Vide (Empty)      : n % 20 ∈ {7, 12}   (26 galaxies)
  - Hostile (Harsh)   : n % 20 ∈ {3, 15}   (26 galaxies)
  - Luxuriante (Lush) : n % 20 ∈ {10, 19}  (25 galaxies)
  - Normale (Norm)    : toutes les autres  (178 galaxies)

Script à lancer une seule fois (données statiques) ; conservé pour
reproductibilité.
"""

import json
import re
import ssl
import urllib.request
from pathlib import Path

WIKI_URL = (
    "https://nomanssky.fandom.com/api.php"
    "?action=parse&page=Galaxy&format=json&prop=wikitext"
)
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def galaxy_type(n: int) -> str:
    m = n % 20
    if m in (7, 12):
        return "empty"
    if m in (3, 15):
        return "harsh"
    if m in (10, 19):
        return "lush"
    return "norm"


def main() -> None:
    req = urllib.request.Request(WIKI_URL, headers={"User-Agent": "nms-tracker/1.0"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=40, context=ctx) as resp:
        wikitext = json.loads(resp.read())["parse"]["wikitext"]["*"]

    section = wikitext[wikitext.find("Known positive galaxies"):]
    names = re.findall(r"<li>\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]\s*</li>", section)
    assert len(names) >= 255, f"seulement {len(names)} galaxies trouvées"
    names = names[:255]
    assert names[0] == "Euclid" and names[9] == "Eissentam", "ordre inattendu"

    galaxies = [
        {"n": i + 1, "name": name, "type": galaxy_type(i + 1)}
        for i, name in enumerate(names)
    ]
    counts = {t: sum(1 for g in galaxies if g["type"] == t) for t in
              ("norm", "empty", "harsh", "lush")}
    assert counts == {"norm": 178, "empty": 26, "harsh": 26, "lush": 25}, counts

    out = DATA_DIR / "galaxies.json"
    out.write_text(
        json.dumps({"count": len(galaxies), "items": galaxies},
                   ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"{out} : {len(galaxies)} galaxies, répartition {counts}")


if __name__ == "__main__":
    main()
