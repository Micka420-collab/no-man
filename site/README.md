# Atlas Terminal — implementation

Production implementation of the `Atlas Terminal v2` design exported from Claude Design (the
`.dc.html` prototype and its `support.js` live in that handoff bundle, which is not part of this
repo). React 19 + TypeScript + Vite; three.js powers the two workshop viewers and is code-split so
it only downloads when a workshop is opened.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
npm run preview   # serve dist/
```

`vite.config.ts` uses `base: './'`, so `dist/` can be served from any path — a domain root,
a GitHub Pages project subpath, or a plain static host — without rebuilding.

## Layout

```
public/data/*.json          the 22 fetched datasets + 2 generated ones (same names as data/ in the no-man repo)
scripts/build-workshop-data.mjs  regenerates workshop.json + substances.json from data/catalogue.json
public/assets/creatures/    57 creature webp
public/assets/ships/        10 starship webp
src/lib/store.tsx           app state, data loading, shared item/market lookups
src/lib/sprite.ts           procedural galaxy sprite (background + galaxy map)
src/lib/meshes.ts           three.js models for the 10 starships and 8 multi-tools
src/data/catalogue.ts       what the game data doesn't model: family grouping, glyphs, 3D anchors, stat weights
src/i18n/                   FR/EN copy deck + navigation
src/components/             shell (rail, topbar, ticker, bottom nav), ⌘K palette, detail sheet, canvases, workshop bench
src/sections/               one file per screen
```

Item icons come from the Assistant NMS CDN URLs already present in `market.json` / `recipes.json`;
substances without an icon fall back to a generated SVG crystal tinted by family colour.

## Sections

Accueil (live panel + 10-year countdown) · En direct (player curve, community feeds, achievements) ·
Ma progression · Vaisseaux (gallery + upgrade workshop) · Faune (57 archetypes) · Galaxies
(interactive 255-star spiral) · Éléments (periodic table) · Multi-outil (workshop) · Expéditions ·
Bulletin de guerre · Mises à jour · Guides & Wiki · Base de données · Recettes · Portail (glyph decoder).

## Workshops (Vaisseaux · Multi-outil)

Both benches share `components/Workshop.tsx` and `components/Viewer3D.tsx`:

- **Real-time 3D** — PBR models lit by a generated room environment (`PMREMGenerator` +
  `RoomEnvironment`), ACES tone mapping, soft-shadow contact plane, `UnrealBloomPass` on the emissive
  parts, and panel-line edges. Drag to orbit, ±/reset buttons, `Ctrl`/`⌘` + wheel to zoom, and a
  `SOLIDE / HOLO` switch that keeps the prototype's wireframe look. The part of the model a
  technology belongs to (engine, wing, barrel, scope, hyperdrive core…) pulses while it is installed.
- **Inventory handling like the game** — click a fitted technology to pick it up, click another cell
  to place it, and it swaps with whatever is there; `Esc` cancels, `Suppr` removes, and the detail
  strip carries a Remove button. This is what makes supercharged slots and adjacency clusters
  something you actually arrange rather than just observe.
- **Icons** — the real item icon is shown wherever a technology appears (slot grid, catalogue rows,
  module cards, detail strip), with a drawn family glyph as the offline fallback so a missing image
  never renders broken. Icon URLs are *read* from the data, never synthesised from the id: 128 of
  692 items in the dataset have an icon whose number differs from their id, so building URLs by hand
  would show wrong icons.
- **The game's own item data** — technology names, in-game descriptions, prices, currencies, module
  classes and the real item icons all come from `public/data/workshop.json`, generated from
  `data/catalogue.json` in the source repo (the community Assistant NMS dataset). Multi-tool family
  names and colours come from `multitool.json`, which declares its own. Nothing in the catalogue is
  hand-written: `src/data/catalogue.ts` only carries what the game data does not model — family
  grouping, UI glyph, 3D anchor, and which stat a family drives.
- **Classes read, not inferred** — a module's class comes from the data, taken from the explicit
  "C-Class …" labels in the catalogue's `modules` category where they exist and from the
  60 / 140 / 300 / 480 price ladder otherwise. The generator fails the build rather than fall back
  to guessing from list order.
- **In-game rules** — per-class slot counts, a contiguous supercharged cluster (×1.5), orthogonal
  adjacency bonuses (+5% each), and the 3-modules-per-family overload that shuts the family down.
- **Live estimate + technical sheet** — stat bars show the archetype's base profile plus the computed
  bonus window, and a sheet gives slots used, supercharged used, adjacency links, build cost and —
  for starships — the resulting hyperdrive range in light years.

Prices are the game's own values (60 / 140 / 300 / 480 for C→S, ~280–320 for the X "suspicious"
variants), so a build's cost is exact. The cost is kept per currency: most modules are bought with
nanites (⬡) but the Neutron Cannon family is priced in units (u), and adding the two together would
be meaningless. Bonus percentages stay community-observed ranges and are labelled as estimates:
every module rolls random stats inside its class window and the exact tables are unpublished.

The 3D models are original stylised builds in the game's visual language — Hello Games' own meshes
are proprietary and are not used.

## Persistence

Stored per device in `localStorage`: `atlas-terminal-favs` (database favourites),
`atlas-terminal-progress` (checklist), `atlas-terminal-mt` / `atlas-terminal-ship` (workshop builds
keyed by type + class), `atlas-terminal-settings`.

## Ambience settings

The prototype exposed three authoring props. Since there is no design-tool inspector here, they are
read from the query string and remembered on the device:

| Query param | Values | Default |
|---|---|---|
| `motion` | `vivant` \| `calme` | `vivant` |
| `stars` | `1500`–`9000` | `5200` |
| `ticker` | `1` \| `0` | `1` |

`prefers-reduced-motion: reduce` always forces the calm path (no animation loops).

## Data refresh

`public/data/` tracks `data/` in the [Micka420-collab/no-man](https://github.com/Micka420-collab/no-man)
repo — the same files the live site loads. To refresh:

```bash
cd site/public/data
for f in stats stats_history timeline expeditions ships creatures galaxies galaxy_hubs \
         elements market community news official videos achievements challenges \
         progress guide missions recipes multitool war; do
  curl -sO "https://raw.githubusercontent.com/Micka420-collab/no-man/main/data/$f.json"
done
```

`workshop.json` and `substances.json` are generated, not fetched — `data/catalogue.json` is 2.7 MB
and far too much to ship to the browser, so they project out only what the site renders (165
technologies and upgrade modules, 72 substances), keeping the game's names, descriptions, prices,
currencies and icon URLs:

```bash
cd site
node scripts/build-workshop-data.mjs            # downloads the catalogue
node scripts/build-workshop-data.mjs path.json  # or reads a local copy
```

The starship family id lists live at the top of that script; multi-tool families and the substance
list are read from `multitool.json` and `elements.json`, so those need no editing.

## Deploying to GitHub Pages

`.github/workflows/deploy-site.yml` (repo root) builds `site/` and publishes `site/dist` to Pages.
**This is the live deployment**: it runs on every push to `main`, and also after each run of the
data-update workflow ("Mise à jour des actualités NMS") — a `workflow_run` trigger is required
because commits pushed with the default `GITHUB_TOKEN` never fire `push` workflows. The old
`deploy-pages.yml`, which served the historical single-file root `index.html`, has been removed;
that `index.html` stays in git, it is simply no longer what Pages serves.

Data freshness: before each build the workflow copies the root `data/*.json` (updated every 3 h)
into `site/public/data/` and regenerates `workshop.json` + `substances.json` from the fresh
catalogue, so the deployed app always ships current numbers. The app is a full PWA (manifest +
service worker): installable, works offline, data network-first / shell cache-first.

Unofficial community tool. Not affiliated with Hello Games; game item icons are served from the
community Assistant NMS CDN, and the hologram meshes are original stylised silhouettes rather than
game assets.
