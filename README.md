# 🌌 No Man's Sky — Centre de suivi

Un système complet pour suivre **tout ce qui se passe autour de No Man's Sky** et
**ta propre progression dans le jeu**, en un seul endroit.

**➡️ Site en ligne : https://micka420-collab.github.io/no-man/**

✨ Interface **bilingue français/anglais**, thèmes **sombre/clair**, champ d'étoiles animé,
recherche et filtres dans chaque onglet, **fiches détaillées au clic** sur les objets/vaisseaux,
**compte à rebours des 10 ans du jeu**, **mode hors-ligne (PWA installable)**, suivi personnel
des succès comparé à la communauté mondiale, accessible (clavier, lecteurs d'écran,
`prefers-reduced-motion`). **Optimisée mobile** : barre de navigation basse type application,
feuille « Plus » pour toutes les sections, et **balayage gauche/droite** pour changer d'onglet. **Favoris** (⭐) et **liens directs partageables** vers un objet, vaisseau, créature, recette, expédition ou galaxie précise.

## Ce que ça fait

| Volet | Contenu | Source |
|---|---|---|
| 🏠 **Vue d'ensemble** | Bloc **EN DIRECT** : joueurs en jeu en temps réel (compteur animé), pic 24 h, record absolu, et **flux d'activité de la communauté** (posts FR + EN, vidéos, actus) avec pseudos et horodatages qui défilent | APIs Steam + SteamCharts + Reddit + YouTube |
| 📚 **Guides** | 11 guides pratiques bilingues avec sélecteur : Débuter, Frégates & flotte, Portails & glyphes, Agriculture rentable, Combat spatial & vaisseaux S, Exocraft & véhicules, Construction de base, Multijoueur & coopération, Événement de guerre, Exploration & récompenses, **Mode photo** | Guides rédigés |
| 🗓️ **Expéditions** | Calendrier des **22 expéditions communautaires** (2021→2026) : numéro, dates, thème et statut (terminée / en cours / à venir), bandeau « prochaine expédition », et **rappel dans la Vue d'ensemble** quand une expédition en cours se termine bientôt | Wiki No Man's Sky (API) |
| 🔍 **Recherche globale** | Un champ unique (bouton 🔍 ou touche `/`) qui cherche **dans tout le site d'un coup** : objets, recettes, créatures, vaisseaux, poissons, galaxies, guides et expéditions — résultats groupés, **navigation clavier** (↑/↓ + Entrée), clic direct vers la fiche ou l'onglet | Toutes les données du site |
| 📖 **Base de données** | **plus de 3 500 objets** du jeu (matériaux, technologies, modules, améliorations, constructions, marchandises, curiosités, produits procéduraux, cuisine, divers…) cherchables, avec valeur, groupe, description et icône — bilingue, avec **filtres avancés** (par devise, valeur minimale, tri par valeur ou nom) | Données du jeu via Assistant NMS |
| 🦋 **Faune** | Les **57 archétypes de créatures** du jeu avec **image d'exemple d'espèce en jeu** : ce que chacun permet de récolter (lait, œufs, miel, nectar, graisse…), la méthode, l'objet obtenu avec icône, un lien vers le wiki, et des **filtres** (par récolte, tri A→Z/Z→A) | Données du jeu via Assistant NMS + images du wiki NMS |
| 🧪 **Recettes** | **Toutes les recettes de raffinage (357) et de cuisine (1 300+)** : ingrédients, quantités, résultat et opération, cherchables par ingrédient ou par résultat, avec **filtres** (nombre d'ingrédients, tri par durée), bilingue | Données du jeu via Assistant NMS |
| 🖼️ **Galerie** | Les vaisseaux et créatures **en grand** (images en jeu), en deux sous-onglets ; clic pour ouvrir la fiche et la partager | Images vaisseaux (wiki) + créatures (wiki) |
| ⭐ **Favoris** | Marque objets, vaisseaux, créatures, recettes et galaxies avec l'étoile ☆ et retrouve-les en un clic — enregistré dans ton navigateur | Toi ! |
| ⚔️ **Bulletin de guerre** | **Onglet dédié** : classement en direct des 3 escouades de l'événement communautaire, compte à rebours, objectifs, choix de ton camp, et lien vers le guide de l'événement (aussi résumé dans la Vue d'ensemble) | API officielle de l'Atlas Galactique |
| 🎯 **Défi du jour** | Un défi mondial par jour (48 défis bilingues), série de jours et record | Généré localement |
| 🗺️ **Galaxies** | Carte galactique immersive **façon Galactic Atlas** : galaxie spirale lumineuse (cœur brillant, bras spiraux logarithmiques, voies de poussière, halo/bloom) **qui tourne lentement dans son plan**, zoom, navigation, chemin parcouru, marqueur « je suis ici », **visite guidée** (zoom cinématique vers ta galaxie), **infos au survol** (nom, type, hub), **mini-aperçu unique par galaxie** dans la fiche, avec les **galaxies les plus vivantes** mises en avant (Euclid, Eissentam…) | Rendu maison + hubs communautaires |
| 💎 **Marché** | Classements des objets les plus précieux, guide de pêche complet (qualité/biome/conditions, **avec icônes**), guide des vaisseaux avec **vraies images en jeu**, conseils d'obtention et **guide d'amélioration au max** (emplacements survolimentés, adjacence, classes S/X) | Données Assistant NMS + images du wiki NMS |
| 🛸 **Actus officielles** | Patch notes et annonces Hello Games | [nomanssky.com/news](https://www.nomanssky.com/news/) |
| 📰 **Presse & Steam** | Annonces Steam + couverture presse (PC Gamer, RPS…) | API Steam News |
| 👥 **Communauté** | Top de la semaine, tendances, coordonnées partagées + **communauté française**. Les titres anglophones sont **traduits automatiquement en français** (titre original conservé au survol) | r/NoMansSkyTheGame, r/NMSCoordinateExchange, r/NoMansSkyFrance (RSS) |
| 🏆 **Succès des joueurs** | % de la communauté Steam ayant débloqué chaque succès — pour te situer par rapport aux autres voyageurs | Page Steam des succès globaux |
| 🎬 **Vidéos** | Dernières vidéos de Hello Games et des créateurs communautaires (KhrazeGaming, Beeblebum, Xaine's World) | Flux RSS YouTube |
| 🕰️ **Mises à jour** | Frise chronologique des mises à jour majeures, de la sortie (2016) à The Swarm (2026) | `data/timeline.json` |
| 🧭 **Ma progression** | Checklist interactive de ~35 objectifs du jeu (histoire, quêtes, équipement, bases, exploration, multijoueur) avec pourcentage global | Toi ! |

Les données sont **mises à jour automatiquement toutes les 3 heures** par GitHub Actions
(workflow `update-news.yml`), qui committe les fichiers JSON dans `data/`.

### Crédits des images et données

- **Icônes et données d'objets** : [Assistant for No Man's Sky](https://nmsassistant.com/) (données extraites du jeu, CDN `cdn.nmsassistant.com`).
- **Images des types de vaisseaux** (`assets/ships/`) : captures et rendus issus du [wiki No Man's Sky](https://nomanssky.fandom.com/) (Fandom, CC-BY-SA), redimensionnées et hébergées localement.
- **Images des créatures** (`assets/creatures/`) : miniatures d'exemples d'espèces issues du [wiki No Man's Sky](https://nomanssky.fandom.com/) (Fandom, CC-BY-SA), récupérées via l'API du wiki et hébergées localement.
- No Man's Sky est une marque de **Hello Games**. Ce projet est un outil communautaire non officiel, sans but lucratif.

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
