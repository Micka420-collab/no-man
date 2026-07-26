# Atlas Terminal — implementation

Production implementation of the `Atlas Terminal v2` design (see `../project/Atlas Terminal v2.dc.html`
and the handoff bundle at the repo root). React 19 + TypeScript + Vite, no runtime dependencies
beyond React.

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
public/data/*.json          the 21 datasets, fetched at runtime (same names as data/ in the no-man repo)
public/assets/creatures/    57 creature webp
public/assets/ships/        10 starship webp
src/lib/store.tsx           app state, data loading, shared item/market lookups
src/lib/{sprite,models}.ts  procedural galaxy sprite · wireframe hologram meshes
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

The JSON under `public/data/` is a snapshot from the handoff bundle. To refresh, copy the files from
`data/` in the [Micka420-collab/no-man](https://github.com/Micka420-collab/no-man) repo over
`public/data/`, and `assets/` over `public/assets/` — no code changes needed.

Unofficial community tool. Not affiliated with Hello Games; game item icons are served from the
community Assistant NMS CDN, and the hologram meshes are original stylised silhouettes rather than
game assets.
