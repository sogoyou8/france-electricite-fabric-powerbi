# France Électricité 2024 — cockpit analytique V4

Interface web React + Vite du projet **Databricks & Power BI**, alimentée par les **trois exports Gold** du même jeu public : fact_energie.csv, dim_region.csv, dim_date.csv dans web/public/data/.

**Périmètre réel :** janvier 2024 seulement, 12 régions de France métropolitaine hors Corse, six filières de production. Les 17 856 relevés demi-horaires RTE / ODRÉ ont été préparés avec Databricks / PySpark / Delta Lake puis agrégés en 372 faits région × jour. **Microsoft Fabric n'a pas été utilisé.** Aucune base Neon, aucun backend ni flux temps réel.

## V4 — un seul espace de lecture

La V4 rassemble les cinq vues antérieures dans un **cockpit sur une page**, avec sections accessibles par ancres :

- Indicateurs cohérents : consommation, production des six filières, volume renouvelable, part renouvelable.
- Carte des 12 régions (contours IGN), avec sélection régionale, lecture de la production ou de la consommation et prise en compte d'une filière mise en évidence.
- Courbes quotidiennes production / consommation ; lorsqu'une filière est sélectionnée, sa courbe s'ajoute **sans remplacer** la production totale.
- Mix des six filières cliquable, tableau régional triable et comparaison directe de deux régions sur la **même période**.
- Trois constats descriptifs **calculés sur la sélection** : région en tête sur la période, jour de pointe, première filière ou part de la filière active.
- Tableau journalier et empilement des six filières dans un panneau dépliable, export CSV des faits Gold correspondant aux filtres **région + dates**.
- Traçabilité visible de RTE/ODRÉ jusqu'à Databricks (Bronze logique, Silver, Gold), SQL, Power BI et l'application web. Méthode et limites dépliables.

Les filtres **région et dates** affectent les KPI, les séries et le mix ; la carte et le classement conservent les douze régions pour fournir un référentiel comparatif sur la même période. La **filière** est un *focus analytique* : elle agit sur la carte (en mode production), la courbe, les constats et la comparaison A/B ; elle **ne change pas la définition** de la production totale, de la consommation ou de la part renouvelable. Les CSV exportés contiennent toutes les mesures des six filières pour les jours-régions filtrés.

Aucun écran SaaS à sidebar ni panneaux de cartes arrondies répétitives : l'interface privilégie une barre discrète, des séparateurs fins, une hiérarchie de lecture et une navigation continue.

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
