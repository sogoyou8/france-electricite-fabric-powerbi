# France Électricité 2024 — cockpit analytique V5.7

L'application React + Vite présente le travail du projet **Databricks / PySpark / SQL / Power BI** sur une **seule surface analytique**, lisible en un coup d'œil par un recruteur. Les données restent celles des **trois exports Gold** : `fact_energie.csv`, `dim_region.csv`, `dim_date.csv` dans `web/public/data/`.

**Périmètre réel :** janvier 2024 uniquement ; 12 régions métropolitaines hors Corse ; six filières. 17 856 relevés demi-horaires RTE / ODRÉ ingérés dans Databricks, transformés en Silver Delta puis agrégés en 372 faits jour × région. **Microsoft Fabric n'a pas été utilisé.** Aucun streaming, backend ou temps réel.

- **[Démonstration en ligne V5.7](https://france-electricite-2024-explorer.vercel.app/)** : cockpit interactif publié.
- **[Présentation dans Abyss Showcase](https://abyss-public-showcase.vercel.app/projects/france-electricite-2024)** : quatre vues distinctes du même projet DATA.
- **[README technique principal](../README.md)** : chiffres contrôlés, provenance des données, notebooks, SQL, modèle Power BI et limites.

## Fonctionnement actuel — V5.7

Le cockpit affiche ensemble : **4 KPI**, carte interactive des **12 régions**, mix des **6 filières**, courbe quotidienne production/consommation, **comparaison A/B**. Il ne comporte **aucune navigation entre espaces Explorer/Comparer/Traçabilité**. Le détail est présenté uniquement sur demande, dans un espace flottant accessible depuis la barre d'outils :

- **Données :** détail quotidien, graphique empilé et export CSV filtré ;
- **Régions :** classement complet, triable, sélection rapide ;
- **Méthode :** définitions, limites et licences ;
- **Chaîne :** RTE/ODRÉ → Databricks → Silver/Gold → Power BI + React et liens vers preuves GitHub.

Les filtres **région et dates** recalculent les KPI, la chronologie et le mix. La carte et la comparaison A/B gardent toutes les régions de la période commune pour éviter les comparaisons incohérentes. La filière active est un **focus visuel** qui affecte la carte en mode production, la courbe et les volumes A/B ; elle ne modifie pas les totaux nationaux ni les champs exportés.

Le layout privilégie une **vue desktop 1440 × 900 sans scrolling principal**. Sur des fenêtres plus petites ou mobiles, le scrolling reste autorisé pour préserver la lisibilité et le fonctionnement.

Les comparaisons sont des **volumes absolus** : un différentiel entre régions ne mesure pas les échanges électriques. La production étudiée (six filières) et les parts renouvelables sont conformes aux définitions Gold du rapport Power BI.

### V5.5 — stabilité du cockpit à hauteur réduite

- La disposition mono-écran est conservée sur les fenêtres desktop d'au moins 1160 px de large et 620 px de hauteur CSS, même quand les barres du navigateur réduisent le viewport.
- Les anciennes règles V4.2 qui réactivent le défilement sous 770 px sont neutralisées pour V5 ; la carte et le mix restent dans leur zone.
- La carte reprend le cadrage sûr de V5.3 (55 8 650 580) et les noms régionaux restent lisibles.
- Les axes numériques adaptatifs de V5.4, le panneau Gold Tableau/Graphique et les exports sont conservés.
- Sur mobile, tablette ou fenêtre plus basse que 620 px, le défilement reste volontaire.

Les tests de régression statiques complètent la vérification des données et la compilation ; la recette visuelle reste nécessaire.

### V5.6 — mise en page et panneau flottant

Le bandeau « Du brut à l'analyse » et le pied de page du cockpit ont été retirés. Leur hauteur est réaffectée à **Série temporelle** et **Comparaison A/B**, sans défilement desktop dans les dimensions prises en charge par V5.5. Le titre principal devient « L’électricité française ».

Le bouton **Données** de la barre supérieure ouvre une *palette de données* flottante au lieu du drawer latéral. Elle propose quatre vues réunies sous une seule interaction : **Données Gold** (Tableau / Graphique), **12 régions**, **Chaîne DATA** (preuves Databricks, Gold, SQL et Power BI) et **Méthode**. Fermeture par Échap, par clic à l'extérieur ou par la commande de fermeture ; navigation clavier accessible et animation désactivée si réduction des mouvements demandée. L'export CSV est distinct et reste accessible en permanence.

Cette refonte ne change ni les trois fichiers Gold, ni les calculs, ni le périmètre janvier 2024.

### V5.7 — finitions de lisibilité

La bande des quatre KPI conserve une hauteur suffisante, y compris lorsque Chrome réduit la hauteur disponible (80–88 px sur desktop compatible, avec une taille typographique et un interligne ajustés). Les quatre visuels du cockpit restent répartis sur un écran.

Le panneau flottant **Données** supprime le sous-en-tête redondant : l'onglet actif identifie directement le contenu, tandis que la vue Gold affiche la période et le choix Tableau/Graphique. Les quatre sections, la navigation clavier et les méthodes restent accessibles.

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
