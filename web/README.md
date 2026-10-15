# France Électricité 2024 — interface de consultation Vercel

Application web React + Vite, alimentée uniquement par les trois exports Gold qui ont servi au rapport Power BI, et qui sont conservés sous `web/public/data/`. **Aucun backend, aucune base Neon, aucun appel live à RTE.**

## Choix d'interface

La version 2 abandonne le socle standard de dashboard SaaS : pas de sidebar « Explorer », pas de panneaux arrondis répétés, pas de fausses statistiques. Une barre d'outils discrète, une carte géographique interactive réelle et des analyses lisibles composent l'espace de travail.

Navigation : **Synthèse · Territoires · Filières · Chronologie · Méthode**. Les filtres de dates et de régions répercutent la même sélection sur les KPI, la cartographie et les séries temporelles. Export CSV de la sélection.

Les principes de hiérarchie, d'espacement et de clarté des [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) ont été étudiés. Aucun asset, icône ou police propriétaire Apple n'a été copié.

## Installer, tester et compiler

```sh
cd web
npm install
npm test
npm run dev
npm run build
```

Configuration Vercel : Root Directory **web**, Framework **Vite**, Build Command **npm run build**, Output Directory **dist**.

## Données et traçabilité

- Données énergétiques : RTE / ODRÉ éCO2mix régional définitif, **janvier 2024 uniquement**, 12 régions de France métropolitaine **hors Corse**, 372 lignes Gold.
- Contours : IGN Admin Express (Licence Ouverte 2.0) obtenus à partir de [gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson), fichier de régions simplifiées, transformé en tracés SVG simplifiés. Le code INSEE, les noms et les contours proviennent de cette source.
- Conversion : les séries énergétiques sont des sommes en MWh ; les affichages en TWh sont obtenus par division par **1 000 000**.
- La part renouvelable représente hydraulique + éolien + solaire + bioénergies sur la production étudiée (six filières).
- Une différence production – consommation calculée sur ces six filières **ne doit pas être interprétée comme un solde exportateur**.
- Le rapport Power BI PBIP, 12 mesures DAX, notebooks Databricks et SQL restent conservés dans le dépôt. Lire aussi `../LICENSE-DATA.md`.
