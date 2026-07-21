# 🌌 No Man's Sky — Centre de suivi

Un système complet pour suivre **tout ce qui se passe autour de No Man's Sky** et
**ta propre progression dans le jeu**, en un seul endroit.

## Ce que ça fait

| Volet | Contenu | Source |
|---|---|---|
| 🛸 **Actus officielles** | Patch notes et annonces Hello Games | [nomanssky.com/news](https://www.nomanssky.com/news/) |
| 📰 **Presse & Steam** | Annonces Steam + couverture presse (PC Gamer, RPS…) | API Steam News |
| 👥 **Communauté** | Posts les plus populaires de la semaine + tendances du moment | r/NoMansSkyTheGame (RSS) |
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
├── data/
│   ├── news.json                  # Actualités Steam (auto)
│   ├── official.json              # Articles nomanssky.com (auto)
│   ├── community.json             # Posts Reddit (auto)
│   └── progress.json              # Définition des objectifs de progression
├── scripts/
│   └── fetch_news.py              # Script de collecte (stdlib Python uniquement)
└── .github/workflows/
    └── update-news.yml            # Mise à jour automatique toutes les 6 h
```
