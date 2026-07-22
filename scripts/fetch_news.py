#!/usr/bin/env python3
"""Récupère les actualités No Man's Sky, les statistiques et le pouls de la communauté.

Sources :
  - Steam News API (annonces officielles + presse, appid 275850)
  - Site officiel nomanssky.com/news (patch notes Hello Games)
  - Reddit r/NoMansSkyTheGame + r/NMSCoordinateExchange via RSS
  - API Steam : joueurs en ligne, avis, prix/promotions
  - Page Steam des succès globaux (en français) : progression de la communauté
  - Flux RSS YouTube : chaîne officielle Hello Games + créateurs communautaires

Écrit les résultats dans data/*.json.
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
STEAM_PLAYERS_URL = (
    "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/"
    f"?appid={APPID_NMS}"
)
STEAM_REVIEWS_URL = (
    f"https://store.steampowered.com/appreviews/{APPID_NMS}"
    "?json=1&num_per_page=0&language=all&purchase_type=all"
)
STEAM_PRICE_URL = (
    f"https://store.steampowered.com/api/appdetails?appids={APPID_NMS}"
    "&cc=fr&filters=price_overview"
)
STEAM_ACHIEVEMENTS_URL_FR = (
    f"https://steamcommunity.com/stats/{APPID_NMS}/achievements/?l=french"
)
STEAM_ACHIEVEMENTS_URL_EN = (
    f"https://steamcommunity.com/stats/{APPID_NMS}/achievements/?l=english"
)
OFFICIAL_NEWS_URL = "https://www.nomanssky.com/news/"
REDDIT_TOP_RSS = "https://www.reddit.com/r/NoMansSkyTheGame/top.rss?t=week&limit=25"
REDDIT_HOT_RSS = "https://www.reddit.com/r/NoMansSkyTheGame/hot.rss?limit=25"
REDDIT_COORDS_RSS = (
    "https://www.reddit.com/r/NMSCoordinateExchange/top.rss?t=week&limit=20"
)
REDDIT_FR_RSS = "https://www.reddit.com/r/NoMansSkyFrance/hot.rss?limit=25"
STEAMCHARTS_URL = f"https://steamcharts.com/app/{APPID_NMS}"

ATLAS_POI_URL = "https://galacticatlas.nomanssky.com/assets/json/poi.json"
ATLAS_API_URL = "https://galacticatlas-api.nomanssky.com/api"

YOUTUBE_CHANNELS = [
    ("Hello Games", "UCGKx5XhGuf09VERiw_QIemA"),
    ("KhrazeGaming", "UCFXUSG_393wZJaRTErU6Pjw"),
    ("Beeblebum", "UCiPxIIYapAryopmQshBtQUw"),
    ("Xaine's World", "UCzTB8EBVJWkzJi2sQjdBv9g"),
]
YOUTUBE_FEED = "https://www.youtube.com/feeds/videos.xml?channel_id={}"

ATOM_NS = {
    "a": "http://www.w3.org/2005/Atom",
    "media": "http://search.yahoo.com/mrss/",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USER_AGENT = "nms-tracker/1.0 (suivi personnel des actualites No Man's Sky)"
HISTORY_MAX_POINTS = 2000


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


def write_json(name: str, payload) -> None:
    (DATA_DIR / name).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def read_json(name: str, default):
    path = DATA_DIR / name
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return default


# ---------------------------------------------------------------- actualités


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
    articles = []
    seen = set()
    for page in range(1, 4):
        url = OFFICIAL_NEWS_URL if page == 1 else f"{OFFICIAL_NEWS_URL}page/{page}/"
        try:
            html = fetch(url).decode("utf-8", errors="replace")
        except urllib.error.HTTPError:
            break
        pattern = re.compile(r'<a href="(/20\d{2}/\d{2}/[^"]+)" title="([^"]+)"')
        for m in pattern.finditer(html):
            path, title = m.group(1), unescape(m.group(2))
            if path in seen:
                continue
            seen.add(path)
            year, month = path.strip("/").split("/")[0:2]
            excerpt = ""
            view = re.search(
                r'([^<>]{40,600})<a class="view-article[^"]*" href="'
                + re.escape(path),
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


# ---------------------------------------------------------------- communauté


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


def fetch_community() -> dict:
    community = {"top_week": [], "hot": [], "coordinates": [], "french": []}
    community["top_week"] = parse_reddit_rss(fetch(REDDIT_TOP_RSS))
    time.sleep(3)
    community["hot"] = parse_reddit_rss(fetch(REDDIT_HOT_RSS))
    time.sleep(3)
    community["coordinates"] = parse_reddit_rss(fetch(REDDIT_COORDS_RSS))
    time.sleep(3)
    try:
        community["french"] = parse_reddit_rss(fetch(REDDIT_FR_RSS))
    except Exception as exc:  # noqa: BLE001
        print(f"AVERTISSEMENT communauté FR : {exc}", file=sys.stderr)
    return community


# ---------------------------------------------------------------- statistiques


def fetch_stats() -> dict:
    stats = {}

    players = json.loads(fetch(STEAM_PLAYERS_URL).decode("utf-8"))
    stats["player_count"] = players.get("response", {}).get("player_count", 0)

    reviews = json.loads(fetch(STEAM_REVIEWS_URL).decode("utf-8"))
    summary = reviews.get("query_summary", {})
    total = summary.get("total_reviews", 0)
    positive = summary.get("total_positive", 0)
    stats["reviews"] = {
        "total": total,
        "positive": positive,
        "percent_positive": round(positive / total * 100, 1) if total else 0,
        "score_desc": summary.get("review_score_desc", ""),
    }

    price = json.loads(fetch(STEAM_PRICE_URL).decode("utf-8"))
    overview = (
        price.get(str(APPID_NMS), {}).get("data", {}).get("price_overview", {})
    )
    if isinstance(overview, dict) and overview:
        stats["price"] = {
            "final": overview.get("final_formatted", ""),
            "initial": overview.get("initial_formatted", ""),
            "discount_percent": overview.get("discount_percent", 0),
        }

    # Pics de fréquentation (SteamCharts) : pointe sur 24 h et record absolu.
    try:
        html = fetch(STEAMCHARTS_URL).decode("utf-8", errors="replace")
        nums = re.findall(
            r'<span class="num">([\d,]+)</span>\s*<br>\s*([^<]+)', html
        )
        for value, label in nums:
            val = int(value.replace(",", ""))
            key = label.strip().lower()
            if "24-hour peak" in key:
                stats["peak_24h"] = val
            elif "all-time peak" in key:
                stats["peak_all"] = val
    except Exception as exc:  # noqa: BLE001
        print(f"AVERTISSEMENT SteamCharts : {exc}", file=sys.stderr)
    return stats


def append_history(player_count: int, now: str) -> None:
    history = read_json("stats_history.json", {"points": []})
    history["points"].append({"t": now, "players": player_count})
    history["points"] = history["points"][-HISTORY_MAX_POINTS:]
    write_json("stats_history.json", history)


def _parse_achievements_page(html: str) -> list[dict]:
    pattern = re.compile(
        r'<div class="achievePercent">([\d.]+)%</div>\s*'
        r'<div class="achieveTxt">\s*<h3>([^<]*)</h3>\s*<h5>([^<]*)</h5>',
        re.S,
    )
    return [
        {
            "percent": float(m.group(1)),
            "name": unescape(m.group(2)).strip(),
            "desc": unescape(m.group(3)).strip(),
        }
        for m in pattern.finditer(html)
    ]


def fetch_achievements() -> list[dict]:
    """Scrape la page Steam des succès globaux, en français et en anglais.

    Les deux pages listent les succès dans le même ordre (tri par % global
    décroissant), ce qui permet de fusionner les traductions par position.
    """
    achievements = _parse_achievements_page(
        fetch(STEAM_ACHIEVEMENTS_URL_FR).decode("utf-8", errors="replace")
    )
    try:
        english = _parse_achievements_page(
            fetch(STEAM_ACHIEVEMENTS_URL_EN).decode("utf-8", errors="replace")
        )
    except Exception:  # noqa: BLE001
        english = []
    if len(english) == len(achievements):
        for ach, en in zip(achievements, english):
            ach["name_en"] = en["name"]
            ach["desc_en"] = en["desc"]
    return achievements


# ---------------------------------------------------------------- effort de guerre


def fetch_war() -> dict:
    """Récupère l'état de l'événement communautaire depuis l'Atlas Galactique.

    Le POI « countermeasures » du fichier poi.json décrit l'événement en cours
    (index de mission, date de fin) ; l'API mission fournit la progression en
    direct des trois factions. Si le POI disparaît, l'événement est terminé.
    """
    pois = json.loads(fetch(ATLAS_POI_URL).decode("utf-8", errors="replace"))
    cm = next((p for p in pois if p.get("id") == "countermeasures"), None)
    if cm is None:
        return {"event": None}
    comp = next(
        (
            c
            for c in cm.get("content", [])
            if c.get("componentName") == "CountermeasuresProgressContent"
        ),
        None,
    )
    if comp is None:
        return {"event": None}
    mission_index = comp.get("missionIndex")
    progress = json.loads(
        fetch(f"{ATLAS_API_URL}/mission/{mission_index}?platform=merged").decode(
            "utf-8"
        )
    )
    return {
        "event": {
            "id": cm.get("id"),
            "name": cm.get("name", ""),
            "title": comp.get("title", ""),
            "end_time": comp.get("endTime", ""),
        },
        "progress": progress,
    }


# ---------------------------------------------------------------- vidéos


def fetch_videos() -> list[dict]:
    videos = []
    for channel_name, channel_id in YOUTUBE_CHANNELS:
        try:
            root = ET.fromstring(fetch(YOUTUBE_FEED.format(channel_id)))
        except Exception as exc:  # noqa: BLE001
            print(f"AVERTISSEMENT YouTube ({channel_name}) : {exc}", file=sys.stderr)
            continue
        official_channel = channel_id == YOUTUBE_CHANNELS[0][1]
        for entry in root.findall("a:entry", ATOM_NS):
            title = entry.findtext("a:title", "", ATOM_NS)
            # Les créateurs communautaires couvrent d'autres jeux : on ne garde
            # que leurs vidéos No Man's Sky (la chaîne officielle passe entière).
            if not official_channel and not re.search(
                r"no man'?s sky|\bnms\b", title, re.I
            ):
                continue
            link = entry.find("a:link", ATOM_NS)
            published = entry.findtext("a:published", "", ATOM_NS)
            thumb = entry.find("a:group/media:thumbnail", ATOM_NS)
            if thumb is None:
                thumb = entry.find("media:group/media:thumbnail", ATOM_NS)
            stats_el = entry.find("media:group/media:community/media:statistics", ATOM_NS)
            videos.append(
                {
                    "title": unescape(title),
                    "url": link.get("href", "") if link is not None else "",
                    "date": published,
                    "channel": channel_name,
                    "thumbnail": thumb.get("url", "") if thumb is not None else "",
                    "views": int(stats_el.get("views", 0)) if stats_el is not None else 0,
                }
            )
    videos.sort(key=lambda v: v["date"], reverse=True)
    return videos[:40]


# ---------------------------------------------------------------- main


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()
    failures = []

    def step(label, fn):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001
            print(f"ERREUR {label} : {exc}", file=sys.stderr)
            failures.append(label)
            return None

    news = step("Steam News", fetch_steam_news)
    if news is not None:
        write_json("news.json", {"updated_at": now, "items": news})
        print(f"news.json : {len(news)} actualités Steam")

    official = step("site officiel", fetch_official_news)
    if official is not None:
        write_json("official.json", {"updated_at": now, "items": official})
        print(f"official.json : {len(official)} articles nomanssky.com")

    community = step("Reddit", fetch_community)
    if community is not None:
        community["updated_at"] = now
        write_json("community.json", community)
        print(
            f"community.json : {len(community['top_week'])} top semaine, "
            f"{len(community['hot'])} tendances, "
            f"{len(community['coordinates'])} coordonnées"
        )

    stats = step("statistiques Steam", fetch_stats)
    if stats is not None:
        stats["updated_at"] = now
        write_json("stats.json", stats)
        append_history(stats["player_count"], now)
        print(
            f"stats.json : {stats['player_count']} joueurs en ligne, "
            f"{stats['reviews']['percent_positive']}% d'avis positifs"
        )

    achievements = step("succès Steam", fetch_achievements)
    if achievements:
        write_json("achievements.json", {"updated_at": now, "items": achievements})
        print(f"achievements.json : {len(achievements)} succès communautaires")

    videos = step("YouTube", fetch_videos)
    if videos:
        write_json("videos.json", {"updated_at": now, "items": videos})
        print(f"videos.json : {len(videos)} vidéos")

    war = step("effort de guerre", fetch_war)
    if war is not None:
        war["updated_at"] = now
        write_json("war.json", war)
        if war.get("event"):
            teams = (war.get("progress") or {}).get("teamTotals", [])
            print(
                f"war.json : {war['event']['name']}, "
                f"{len(teams)} factions, fin {war['event']['end_time']}"
            )
        else:
            print("war.json : aucun événement en cours")

    # Échec global seulement si la majorité des sources sont tombées
    return 1 if len(failures) >= 3 else 0


if __name__ == "__main__":
    sys.exit(main())
