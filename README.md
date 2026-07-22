# 🌌 No Man's Sky — Centre de suivi

Un système complet pour suivre **tout ce qui se passe autour de No Man's Sky** et
**ta propre progression dans le jeu**, en un seul endroit.

**➡️ Site en ligne : https://micka420-collab.github.io/no-man/**

✨ Interface **bilingue français/anglais**, thèmes **sombre/clair**, champ d'étoiles animé,
recherche et filtres dans chaque onglet, suivi personnel des succès comparé à la communauté
mondiale, installable comme application (PWA), accessible (clavier, lecteurs d'écran,
`prefers-reduced-motion`).

## Ce que ça fait

| Volet | Contenu | Source |
|---|---|---|
| 🏠 **Vue d'ensemble** | Bloc **EN DIRECT** : joueurs en jeu en temps réel (compteur animé), pic 24 h, record absolu, et **flux d'activité de la communauté** (posts FR + EN, vidéos, actus) avec pseudos et horodatages qui défilent | APIs Steam + SteamCharts + Reddit + YouTube |
| 📖 **Base de données** | ~2 000 objets du jeu (matériaux, technologies, modules, curiosités, cuisine…) cherchables, avec valeur, groupe, description et icône — bilingue | Données du jeu via Assistant NMS |
| ⚔️ **Bulletin de guerre** | Classement en direct des 3 escouades de l'événement communautaire, compte à rebours, choix de ton camp | API officielle de l'Atlas Galactique |
| 🎯 **Défi du jour** | Un défi mondial par jour (48 défis bilingues), série de jours et record | Généré localement |
| 🗺️ **Galaxies** | Carte galactique immersive interactive des 255 galaxies (zoom, navigation, nébuleuses, chemin parcouru, marqueur « je suis ici ») | Wiki communautaire (généré une fois) |
| 💎 **Marché** | Classements des objets les plus précieux, guide de pêche complet (qualité/biome/conditions), guide des vaisseaux | Données du jeu via Assistant NMS |
| ⚔️ **Bulletin de guerre** | Classement en direct des 3 escouades de l'événement communautaire, compte à rebours, choix de ton camp | API officielle de l'Atlas Galactique |
| 🎯 **Défi du jour** | Un défi mondial par jour (48 défis bilingues), série de jours et record | Généré localement |
| 🗺️ **Galaxies** | Carte interactive en spirale des 255 galaxies avec types, recherche et marqueur « je suis ici » | Wiki communautaire (généré une fois) |
| 💎 **Marché** | Classements des objets les plus précieux, guide de pêche complet (qualité/biome/conditions), guide des vaisseaux | Données du jeu via Assistant NMS |
| 🛸 **Actus officielles** | Patch notes et annonces Hello Games | [nomanssky.com/news](https://www.nomanssky.com/news/) |
| 📰 **Presse & Steam** | Annonces Steam + couverture presse (PC Gamer, RPS…) | API Steam News |
| 👥 **Communauté** | Top de la semaine, tendances, coordonnées partagées + **communauté française** | r/NoMansSkyTheGame, r/NMSCoordinateExchange, r/NoMansSkyFrance (RSS) |
| 🏆 **Succès des joueurs** | % de la communauté Steam ayant débloqué chaque succès — pour te situer par rapport aux autres voyageurs | Page Steam des succès globaux |
| 🎬 **Vidéos** | Dernières vidéos de Hello Games et des créateurs communautaires (KhrazeGaming, Beeblebum, Xaine's World) | Flux RSS YouTube |
| 🕰️ **Mises à jour** | Frise chronologique des mises à jour majeures, de la sortie (2016) à The Swarm (2026) | `data/timeline.json` |
| 🧭 **Ma progression** | Checklist interactive de ~35 objectifs du jeu (histoire, quêtes, équipement, bases, exploration, multijoueur) avec pourcentage global | Toi ! |

Les données sont **mises à jour automatiquement toutes les 6 heures** par GitHub Actions
(workflow `update-news.yml`), qui committe les fichiers JSON dans `data/`.

## Voir le tableau de bord

### Option 1 — GitHub Pages (recommandé)

1. Va dans **Settings → Pages** du dépôt.
2. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Le tableau de bord sera accessible à `https://micka420-collab.github.io/no-man/`.

### Option 2 — En local

```bash
git clone https://github.com/micka420-collab/no-man.git
cd no-man
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

## Mettre à jour les actualités manuellement

```bash
python3 scripts/fetch_news.py
```

Aucune dépendance requise (bibliothèque standard Python uniquement). Tu peux aussi
déclencher le workflow depuis l'onglet **Actions** → « Mise à jour des actualités NMS »
→ **Run workflow**.

## Ta progression

- Coche les objectifs accomplis dans l'onglet **Ma progression** — c'est sauvegardé
  automatiquement dans ton navigateur (localStorage).
- **Exporter / Importer** : boutons en bas de l'onglet pour sauvegarder ta progression
  dans un fichier `nms-progression.json` et la restaurer sur un autre appareil.
- Pour personnaliser la liste des objectifs, édite `data/progress.json`
  (les cases cochées sont conservées tant que les `id` ne changent pas).

## Structure du projet

```
├── index.html                     # Tableau de bord (HTML/CSS/JS, aucune dépendance)
├── favicon.svg                    # Icône du site
├── manifest.webmanifest           # Manifeste PWA (site installable)
├── data/
│   ├── news.json                  # Actualités Steam (auto)
│   ├── official.json              # Articles nomanssky.com (auto)
│   ├── community.json             # Posts Reddit : top, tendances, coordonnées (auto)
│   ├── stats.json                 # Joueurs en ligne, avis, prix (auto)
│   ├── stats_history.json         # Historique des relevés de joueurs (auto)
│   ├── achievements.json          # Succès globaux de la communauté Steam (auto)
│   ├── videos.json                # Dernières vidéos YouTube (auto)
│   ├── timeline.json              # Frise des mises à jour majeures 2016→2026
│   └── progress.json              # Définition des objectifs de progression
├── scripts/
│   └── fetch_news.py              # Script de collecte (stdlib Python uniquement)
└── .github/workflows/
    └── update-news.yml            # Mise à jour automatique toutes les 6 h
```
