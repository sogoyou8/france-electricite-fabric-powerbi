# France Électricité 2024 — cockpit analytique V4.2

Interface web React + Vite du projet **Databricks & Power BI**, alimentée par les **trois exports Gold** du même jeu public : fact_energie.csv, dim_region.csv, dim_date.csv dans web/public/data/.

**Périmètre réel :** janvier 2024 seulement, 12 régions de France métropolitaine hors Corse, six filières de production. Les 17 856 relevés demi-horaires RTE / ODRÉ ont été préparés avec Databricks / PySpark / Delta Lake puis agrégés en 372 faits région × jour. **Microsoft Fabric n'a pas été utilisé.** Aucune base Neon, aucun backend ni flux temps réel.

## V4.2 — logiciel analytique en trois espaces

La V4.2 remplace le long rapport défilant de V4.1 par un **espace de travail compact** à trois vues accessibles sans changer d'URL :

- **Explorer** : quatre KPI, carte interactive des 12 régions, inspecteur régional avec **une seule liste des six filières**, courbe quotidienne production/consommation et trois constats calculés sur les filtres actifs.
- **Comparer** : classement régional et face-à-face de deux régions distinctes, sur la **même période**. Les volumes sont absolus, sans déduire de flux régionaux.
- **Traçabilité** : chaîne RTE / ODRÉ → Bronze logique → Silver Delta → Gold → SQL / Power BI et Web ; liens vers notebooks, SQL, modèle Power BI et documentation.

La navigation, les filtres de dates et de territoire et l'export CSV restent disponibles dans la barre de commande. Les données journalières et la méthode s'ouvrent dans des **panneaux latéraux contextuels** ; le tableau détail et son graphique empilé n'encombrent plus l'exploration. Sur desktop d'environ **1440 × 900**, l'interface vise un écran sans scroll principal. Sur petites fenêtres et mobiles, le défilement reste autorisé pour préserver la lisibilité.

La sélection de **région + dates** recalcule les KPI, la courbe et les répartitions. La carte et le tableau comparatif conservent les douze régions de la période comme référentiel. Une **filière** est un focus visuel transversal : elle influe sur la carte en mode Production, la courbe, les constats et la comparaison A/B, sans changer la définition du total des six filières ni les colonnes de l'export CSV.

Les chiffres sont ceux du périmètre Gold statique, **pas des mesures en temps réel**. Aucune simulation ni nouvelle source de données n'est introduite par la refonte.

## Installation et tests

```sh
cd web
npm install
npm test
npm run build
npm run dev
```

Configuration Vercel : Root Directory **web**, Framework **Vite**, Build Command **npm run build**, Output Directory **dist**.

Les tests vérifient les 372 faits, les 31 dates et les 12 régions, les KPI du rapport Power BI, les filtres, la cohérence des observations, l'absence de doublons et la carte hors Corse.

## Source, calculs et limites

- **Source énergétique :** RTE / ODRÉ, [éCO2mix régional définitif](https://odre.opendatasoft.com/explore/dataset/eco2mix-regional-cons-def/), janvier 2024.
- **Source géographique :** IGN Admin Express, contours simplifiés via [france-geojson](https://github.com/gregoiredavid/france-geojson). Licence Ouverte 2.0.
- **Conversion :** puissance demi-horaire MW × 0,5 h = MWh ; TWh = MWh / 1 000 000.
- **Production étudiée :** nucléaire + hydraulique + éolien + solaire + bioénergies + thermique.
- **Renouvelables :** hydraulique + éolien + solaire + bioénergies, divisées par la production des six filières pour le pourcentage.
- **Interprétation :** le différentiel production étudiée − consommation **n'est pas** un solde exportateur, ni une preuve d'équilibre à chaque instant. Aucun chiffre 2024 annuel, aucune actualisation en temps réel, aucun ratio par habitant non sourcé.

Les notebooks Databricks, SQL, le modèle Power BI PBIP/TMDL et les mesures DAX restent accessibles depuis le [dépôt principal](https://github.com/sogoyou8/france-electricite-fabric-powerbi). Voir aussi ../LICENSE-DATA.md et ../docs/architecture.md.
