#!/usr/bin/env python3
"""Construit data/creatures.json : la faune de No Man's Sky et sa récolte.

No Man's Sky ne possède pas de liste figée d'espèces (elles sont générées de
façon procédurale), mais le jeu repose sur des **archétypes de créatures**
(antilope, prédateur bipède, méduse, calmar terrestre…). Pour chacun, on
indique ce qu'il est possible de récolter (lait, œufs, miel, nectar, graisse…),
la méthode de récolte, l'objet obtenu (nom + icône) et un **exemple d'espèce
réelle** documentée sur le wiki communautaire.

Source : projet communautaire Assistant for No Man's Sky
(app.nmsassistant.com, fichier CreatureHarvest, FR + EN).
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
ASSETS_IMG = "https://app.nmsassistant.com/assets/images/"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USER_AGENT = "nms-tracker/1.0 (faune No Man's Sky)"

# Noms lisibles des archétypes de créatures (FR / EN). Ce sont des libellés
# descriptifs des catégories internes du jeu, pas des noms d'espèces inventés :
# chaque fiche renvoie vers un exemple d'espèce réelle sur le wiki.
NAMES = {
    "ANTELOPE": ("Antilope", "Antelope"),
    "TWOLEGANTELOPE": ("Antilope bipède", "Two-legged antelope"),
    "ROBOTANTELOPE": ("Antilope mécanique", "Robotic antelope"),
    "BIRD": ("Oiseau", "Bird"),
    "BUTTERFLY": ("Papillon", "Butterfly"),
    "LARGEBUTTERFLY": ("Grand papillon", "Large butterfly"),
    "FLYINGSNAKE": ("Serpent volant", "Flying snake"),
    "FLYINGLIZARD": ("Lézard volant", "Flying lizard"),
    "FLYINGBEETLE": ("Scarabée volant", "Flying beetle"),
    "PROTOFLYER": ("Créature volante primitive", "Proto-flyer"),
    "DIPLO": ("Diplodocus", "Diplo (long-neck)"),
    "TRICERATOPS": ("Tricératops", "Triceratops"),
    "TREX": ("Prédateur bipède (T-Rex)", "Bipedal predator (T-Rex)"),
    "RODENT": ("Rongeur", "Rodent"),
    "COW": ("Bovin", "Cow"),
    "BONECOW": ("Bovin osseux", "Bone cow"),
    "SIXLEGCOW": ("Bovin à six pattes", "Six-legged cow"),
    "SWIMCOW": ("Bovin aquatique", "Aquatic cow"),
    "CAT": ("Félin", "Cat"),
    "BONECAT": ("Félin osseux", "Bone cat"),
    "SIXLEGCAT": ("Félin à six pattes", "Six-legged cat"),
    "PLANTCAT": ("Félin végétal", "Plant cat"),
    "STRIDER": ("Échassier", "Strider"),
    "STRIDERGLOW": ("Échassier luminescent", "Glowing strider"),
    "SHARK": ("Requin", "Shark"),
    "GRUNT": ("Grogneur", "Grunt"),
    "BLOB": ("Créature gélatineuse", "Blob"),
    "SPIDER": ("Araignée", "Spider"),
    "FLOATSPIDER": ("Araignée flottante", "Floating spider"),
    "SWIMRODENT": ("Rongeur aquatique", "Aquatic rodent"),
    "JELLYFISH": ("Méduse", "Jellyfish"),
    "CRAB": ("Crabe", "Crab"),
    "HERMITCRAB": ("Bernard-l'ermite", "Hermit crab"),
    "PRAWN": ("Crevette géante", "Prawn"),
    "ROCKCREATURE": ("Créature de roche", "Rock creature"),
    "WEIRDCRYSTAL": ("Créature de cristal", "Crystal creature"),
    "MOLE": ("Taupe", "Mole"),
    "ARTHROPOD": ("Arthropode", "Arthropod"),
    "WALKINGBUILDING": ("Créature-édifice ambulante", "Walking building creature"),
    "PURPLE_WEIRD": ("Créature anormale", "Anomalous creature"),
    "PROTOROLLER": ("Rouleur primitif", "Proto-roller"),
    "WEIRDROLL": ("Rouleur anormal", "Anomalous roller"),
    "WEIRDFLOAT": ("Flotteur anormal", "Anomalous floater"),
    "DRILL": ("Foreuse vivante", "Living drill"),
    "PLOUGH": ("Laboureur", "Plough creature"),
    "PROTODIGGER": ("Fouisseur primitif", "Proto-digger"),
    "FIEND": ("Titan des abysses", "Abyssal fiend"),
    "LAND_SQUID": ("Calmar terrestre", "Land squid"),
    "SQUID": ("Calmar", "Squid"),
    "FISH": ("Poisson", "Fish"),
    "DEEPFISH": ("Poisson des abysses", "Deep-sea fish"),
    "DEEPFISHLARGE": ("Grand poisson des abysses", "Large deep-sea fish"),
    "DEEPFISHFLOCK": ("Banc de poissons des abysses", "Deep-sea fish shoal"),
    "MANTA": ("Raie", "Manta"),
    "MANTAGLOW": ("Raie luminescente", "Glowing manta"),
    "SEAHORSE": ("Hippocampe", "Seahorse"),
    "SEAHORSEGLOW": ("Hippocampe luminescent", "Glowing seahorse"),
}

# Emoji d'ambiance par archétype (repli sur 🐾).
EMOJI = {
    "BIRD": "🐦", "BUTTERFLY": "🦋", "LARGEBUTTERFLY": "🦋", "FLYINGBEETLE": "🪲",
    "TREX": "🦖", "DIPLO": "🦕", "TRICERATOPS": "🦕", "SHARK": "🦈", "CRAB": "🦀",
    "HERMITCRAB": "🦀", "PRAWN": "🦐", "JELLYFISH": "🪼", "SQUID": "🦑",
    "LAND_SQUID": "🦑", "FISH": "🐟", "DEEPFISH": "🐟", "DEEPFISHLARGE": "🐠",
    "DEEPFISHFLOCK": "🐠", "SEAHORSE": "🐡", "SEAHORSEGLOW": "🐡", "MANTA": "🐟",
    "MANTAGLOW": "🐟", "SPIDER": "🕷️", "FLOATSPIDER": "🕷️", "COW": "🐄",
    "BONECOW": "🐄", "SIXLEGCOW": "🐄", "SWIMCOW": "🐄", "CAT": "🐈", "BONECAT": "🐈",
    "SIXLEGCAT": "🐈", "PLANTCAT": "🐈", "RODENT": "🐀", "SWIMRODENT": "🐀",
    "MOLE": "🦔", "ANTELOPE": "🦌", "TWOLEGANTELOPE": "🦌", "ROBOTANTELOPE": "🤖",
    "FLYINGSNAKE": "🐍", "FLYINGLIZARD": "🦎", "FIEND": "👹", "FISH ": "🐟",
}


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


ASSETS_CRE = Path(__file__).resolve().parent.parent / "assets" / "creatures"
FANDOM_API = "https://nomanssky.fandom.com/api.php"


def wiki_title(url: str) -> str:
    """Titre de page wiki (segment final, tirets bas conservés) depuis l'URL."""
    return url.rstrip("/").rsplit("/", 1)[-1] if url else ""


def fetch_creature_image(wiki: str, ctype: str) -> str:
    """Télécharge une image d'exemple d'espèce depuis le wiki (miniature 320px,
    servie en webp par le CDN Wikia) vers assets/creatures/<type>.webp.

    Mise en cache : si le fichier existe déjà, on ne re-télécharge pas.
    Renvoie le chemin relatif utilisable dans le site, ou "".
    """
    if not wiki:
        return ""
    ASSETS_CRE.mkdir(parents=True, exist_ok=True)
    dest = ASSETS_CRE / f"{ctype.lower()}.webp"
    rel = f"assets/creatures/{ctype.lower()}.webp"
    if dest.exists() and dest.stat().st_size > 0:
        return rel
    title = wiki_title(wiki)
    if not title:
        return ""
    try:
        q = urllib.parse.urlencode({
            "action": "query", "titles": title, "prop": "pageimages",
            "format": "json", "piprop": "thumbnail", "pithumbsize": "320",
        })
        req = urllib.request.Request(f"{FANDOM_API}?{q}", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context()) as r:
            data = json.loads(r.read().decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        thumb = ""
        for p in pages.values():
            thumb = (p.get("thumbnail") or {}).get("source", "")
            if thumb:
                break
        if not thumb:
            return ""
        ireq = urllib.request.Request(thumb, headers={"User-Agent": "Mozilla/5.0", "Accept": "image/webp,*/*"})
        with urllib.request.urlopen(ireq, timeout=30, context=ssl.create_default_context()) as r:
            blob = r.read()
        if len(blob) < 500:
            return ""
        dest.write_bytes(blob)
        return rel
    except Exception:  # noqa: BLE001
        return ""


def item_index() -> dict:
    """Index ItemId -> {name_fr, name_en, icon} pour résoudre les récoltes."""
    idx = {}
    for lang, key in (("en", "name_en"), ("fr", "name_fr")):
        for cat in ("Cooking.lang", "RawMaterials.lang", "Products.lang", "Curiosity.lang"):
            try:
                for it in fetch(f"{lang}/{cat}"):
                    rec = idx.setdefault(it["Id"], {})
                    rec[key] = clean(it.get("Name", ""))
                    if "icon" not in rec:
                        rec["icon"] = icon_url(it)
            except Exception:  # noqa: BLE001
                continue
    return idx


def main() -> int:
    now = datetime.now(timezone.utc).isoformat()
    harv_en = fetch("en/CreatureHarvest.lang")
    try:
        harv_fr = fetch("fr/CreatureHarvest.lang")
    except Exception:  # noqa: BLE001
        harv_fr = []
    items = item_index()

    by_type: dict[str, dict] = {}
    for i, h in enumerate(harv_en):
        ctype = h.get("CreatureType", "")
        if not ctype:
            continue
        fr = harv_fr[i] if i < len(harv_fr) else {}
        name_fr, name_en = NAMES.get(ctype, (ctype.title(), ctype.title()))
        wiki = h.get("WikiLink", "")
        example = wiki.rstrip("/").rsplit("/", 1)[-1].replace("_", " ") if wiki else ""
        entry = by_type.setdefault(
            ctype,
            {
                "type": ctype,
                "name_fr": name_fr,
                "name_en": name_en,
                "emoji": EMOJI.get(ctype, "🐾"),
                "example": example,
                "wiki": wiki,
                "harvests": [],
            },
        )
        if wiki and not entry["wiki"]:
            entry["wiki"] = wiki
            entry["example"] = example
        it = items.get(h.get("ItemId", ""), {})
        method_en = clean(h.get("Description", "")) or ("Feed / interact")
        method_fr = clean(fr.get("Description", "")) or ("Nourrir / interagir")
        entry["harvests"].append(
            {
                "method_fr": method_fr,
                "method_en": method_en,
                "item_fr": it.get("name_fr", ""),
                "item_en": it.get("name_en", ""),
                "icon": it.get("icon", ""),
            }
        )

    # Image d'exemple d'espèce (téléchargée et mise en cache localement).
    with_img = 0
    for c in by_type.values():
        c["image"] = fetch_creature_image(c.get("wiki", ""), c["type"])
        if c["image"]:
            with_img += 1
    print(f"images de faune : {with_img}/{len(by_type)}")

    creatures = sorted(by_type.values(), key=lambda c: c["name_fr"])
    payload = {
        "updated_at": now,
        "count": len(creatures),
        "note": "Archétypes de faune de No Man's Sky et leur récolte. Les espèces "
        "sont générées de façon procédurale : chaque fiche renvoie vers un "
        "exemple d'espèce réelle documentée sur le wiki communautaire.",
        "creatures": creatures,
    }
    (DATA_DIR / "creatures.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    print(f"creatures.json écrit : {len(creatures)} archétypes de faune")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERREUR faune : {exc}", file=sys.stderr)
        sys.exit(0 if (DATA_DIR / "creatures.json").exists() else 1)
