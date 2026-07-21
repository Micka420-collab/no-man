#!/usr/bin/env python3
"""Récupère les actualités No Man's Sky et le pouls de la communauté.

Sources :
  - Steam News API (annonces officielles + presse, appid 275850)
  - Site officiel nomanssky.com/news (patch notes Hello Games)
  - Reddit r/NoMansSkyTheGame via RSS (posts populaires de la semaine + tendances)

Écrit les résultats dans data/news.json, data/official.json et data/community.json.
Utilise uniquement la bibliothèque standard Python (aucune dépendance).
"""

import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

APPID_NMS = 275850
STEAM_NEWS_URL = (
    "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/"
    f"?appid={APPID_NMS}&count=30&maxlength=600&format=json"
)
OFFICIAL_NEWS_URL = "https://www.nomanssky.com/news/"
REDDIT_TOP_RSS = "https://www.reddit.com/r/NoMansSkyTheGame/top.rss?t=week&limit=25"
REDDIT_HOT_RSS = "https://www.reddit.com/r/NoMansSkyTheGame/hot.rss?limit=25"

ATOM_NS = {"a": "http://www.w3.org/2005/Atom"}
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USER_AGENT = "nms-tracker/1.0 (suivi personnel des actualites No Man's Sky)"


def fetch(url: str, retries: int = 3) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    ctx = ssl.create_default_context()
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < retries - 1:
                time.sleep(10 * (attempt + 1))
                continue
            raise
    raise RuntimeError("unreachable")


def clean_text(text: str) -> str:
    """Nettoie le BBCode/HTML des extraits."""
    text = unescape(text)
    text = re.sub(r"\[img\].*?\[/img\]", "", text, flags=re.S)
    text = re.sub(r"\[/?[a-zA-Z0-9=*_ \"./:#-]+\]", "", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"https?://\S+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_steam_news() -> list[dict]:
    payload = json.loads(fetch(STEAM_NEWS_URL).decode("utf-8"))
    items = payload.get("appnews", {}).get("newsitems", [])
    news = []
    for item in items:
        author = item.get("author", "").lower().replace(" ", "")
        news.append(
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "date": datetime.fromtimestamp(
                    item.get("date", 0), tz=timezone.utc
                ).isoformat(),
                "source": item.get("feedlabel", "Steam"),
                "excerpt": clean_text(item.get("contents", ""))[:400],
                "is_official": item.get("feedname", "")
                == "steam_community_announcements"
                and author == "hellogames",
            }
        )
    return news


def fetch_official_news() -> list[dict]:
    html = fetch(OFFICIAL_NEWS_URL).decode("utf-8", errors="replace")
    articles = []
    pattern = re.compile(
        r'<a href="(/20\d{2}/\d{2}/[^"]+)" title="([^"]+)"', re.S
    )
    seen = set()
    for m in pattern.finditer(html):
        path, title = m.group(1), unescape(m.group(2))
        if path in seen:
            continue
        seen.add(path)
        year, month = path.strip("/").split("/")[0:2]
        # Extrait : le texte avant le lien "View Article" correspondant
        excerpt = ""
        view = re.search(
            r'([^<>]{40,600})<a class="view-article[^"]*" href="' + re.escape(path),
            html,
        )
        if view:
            excerpt = clean_text(view.group(1))[:400]
        articles.append(
            {
                "title": title,
                "url": f"https://www.nomanssky.com{path}",
                "date": f"{year}-{month}",
                "excerpt": excerpt,
            }
        )
    return articles


def parse_reddit_rss(raw: bytes) -> list[dict]:
    root = ET.fromstring(raw)
    posts = []
    for entry in root.findall("a:entry", ATOM_NS):
        title = entry.findtext("a:title", "", ATOM_NS)
        link = entry.find("a:link", ATOM_NS)
        updated = entry.findtext("a:updated", "", ATOM_NS)
        author = entry.find("a:author/a:name", ATOM_NS)
        posts.append(
            {
                "title": unescape(title),
                "url": link.get("href", "") if link is not None else "",
                "date": updated,
                "author": author.text if author is not None else "",
            }
        )
    return posts


def write_json(name: str, payload: dict) -> None:
    (DATA_DIR / name).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()
    failures = []

    try:
        news = fetch_steam_news()
        write_json("news.json", {"updated_at": now, "items": news})
        print(f"news.json : {len(news)} actualités Steam")
    except Exception as exc:  # noqa: BLE001
        print(f"ERREUR Steam News : {exc}", file=sys.stderr)
        failures.append("steam")

    try:
        official = fetch_official_news()
        write_json("official.json", {"updated_at": now, "items": official})
        print(f"official.json : {len(official)} articles nomanssky.com")
    except Exception as exc:  # noqa: BLE001
        print(f"ERREUR site officiel : {exc}", file=sys.stderr)
        failures.append("official")

    try:
        community = {
            "updated_at": now,
            "top_week": parse_reddit_rss(fetch(REDDIT_TOP_RSS)),
            "hot": parse_reddit_rss(fetch(REDDIT_HOT_RSS)),
        }
        write_json("community.json", community)
        print(
            f"community.json : {len(community['top_week'])} posts top semaine, "
            f"{len(community['hot'])} posts tendance"
        )
    except Exception as exc:  # noqa: BLE001
        # Reddit limite parfois les requêtes anonymes : on conserve les
        # anciennes données plutôt que d'écraser avec du vide.
        print(f"AVERTISSEMENT Reddit : {exc}", file=sys.stderr)
        if not (DATA_DIR / "community.json").exists():
            write_json(
                "community.json", {"updated_at": now, "top_week": [], "hot": []}
            )

    # Échec seulement si TOUTES les sources principales sont tombées
    return 1 if len(failures) >= 2 else 0


if __name__ == "__main__":
    sys.exit(main())
