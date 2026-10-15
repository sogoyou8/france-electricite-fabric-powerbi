# France Électricité 2024 — one-page DATA showcase V5

L'application React + Vite présente le travail du projet **Databricks / PySpark / SQL / Power BI** sur une **seule surface analytique**, lisible en un coup d'œil par un recruteur. Les données restent celles des **trois exports Gold** : `fact_energie.csv`, `dim_region.csv`, `dim_date.csv` dans `web/public/data/`.

**Périmètre réel :** janvier 2024 uniquement ; 12 régions métropolitaines hors Corse ; six filières. 17 856 relevés demi-horaires RTE / ODRÉ ingérés dans Databricks, transformés en Silver Delta puis agrégés en 372 faits jour × région. **Microsoft Fabric n'a pas été utilisé.** Aucun streaming, backend ou temps réel.

## V5 — un seul regard, toutes les visualisations essentielles

Le cockpit affiche ensemble : **4 KPI**, carte interactive des **12 régions**, mix des **6 filières**, courbe quotidienne production/consommation, **comparaison A/B**, bandeau de la chaîne DATA. Il ne comporte **aucune navigation entre espaces Explorer/Comparer/Traçabilité**. Le détail est présenté uniquement sur demande, dans un panneau latéral :

- **Données :** détail quotidien, graphique empilé et export CSV filtré ;
- **Régions :** classement complet, triable, sélection rapide ;
- **Méthode :** définitions, limites et licences ;
- **Chaîne :** RTE/ODRÉ → Databricks → Silver/Gold → Power BI + React et liens vers preuves GitHub.

Les filtres **région et dates** recalculent les KPI, la chronologie et le mix. La carte et la comparaison A/B gardent toutes les régions de la période commune pour éviter les comparaisons incohérentes. La filière active est un **focus visuel** qui affecte la carte en mode production, la courbe et les volumes A/B ; elle ne modifie pas les totaux nationaux ni les champs exportés.

Le layout privilégie une **vue desktop 1440 × 900 sans scrolling principal**. Sur des fenêtres plus petites ou mobiles, le scrolling reste autorisé pour préserver la lisibilité et le fonctionnement.

Les comparaisons sont des **volumes absolus** : un différentiel entre régions ne mesure pas les échanges électriques. La production étudiée (six filières) et les parts renouvelables sont conformes aux définitions Gold du rapport Power BI.

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
