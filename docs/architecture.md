# Architecture et limites analytiques

## Flux de données

1. **RTE / ODRE** : CSV demi-horaire de janvier 2024, filtré sur les données définitives.
2. **Bronze logique** : `spark.read.csv` conserve les valeurs en texte pour l'inspection ; **aucune table Bronze persistée** n'a été créée dans les notebooks.
3. **Silver** : vérification des vides, typage et normalisation, table Delta `workspace.default.silver_energie`.
4. **Gold** : 372 couples région-jour, trois tables Delta et contrôles d'intégrité.
5. **SQL** : jointures, KPI et extraction vers CSV.
6. **Power BI Desktop** : modèle en étoile (dim_date et dim_region filtrent fact_energie), 12 mesures DAX et 4 pages interactives.
7. **React / Vite** : import des mêmes CSV Gold dans un cockpit web statique (carte, 4 KPI, mix de production, série quotidienne, comparaison A/B). La palette « Données » affiche les faits journaliers, le classement, la méthode et la chaîne DATA.

### Schéma en étoile

```mermaid
erDiagram
  DIM_DATE ||--o{ FACT_ENERGIE : date
  DIM_REGION ||--o{ FACT_ENERGIE : code_insee_region
```

### Conversion MW en MWh

Les valeurs du CSV représentent des puissances demi-horaires. Par pas de 30 minutes, l'énergie est `MW × 0,5 h`. Pour une journée complète : `Σ(MW) × 0,5` = MWh, puis `MWh / 1e6` = TWh.

## Validation réalisée

- `fact_energie` : 372 lignes, 31 jours, 12 régions, 48 pas par couple date-région, aucun doublon observé dans les exports du projet.
- Les clés date/région sont présentes dans les dimensions.
- Somme des quatre filières renouvelables = total renouvelable, à quatre décimales TWh affichées.
- Les mesures DAX et relations sont extraites du modèle TMDL original ; la mesure d'essai vide n'était pas référencée par les visuels et a été retirée du projet versionné.

## Surfaces de démonstration

- [Cockpit web interactif V5.7](https://france-electricite-2024-explorer.vercel.app/) — lecture rapide pour le public, données Gold figées et export CSV ; **pas de streaming ni de backend analytique**.
- [Projet dans Abyss Showcase](https://abyss-public-showcase.vercel.app/projects/france-electricite-2024) — quatre captures : national, exploration régionale, graphique Gold, comparaison A/B.
- [Rapport Power BI Desktop](../powerbi/France_Electricite_2024.pbip) — fichier source PBIP/TMDL, à actualiser sur les CSV locaux de `data/demo/`.

Les deux surfaces (Power BI et React) représentent des **livrables distincts** utilisant les mêmes exports Gold ; elles ne prouvent pas l'usage de Microsoft Fabric.

## Réserves à déclarer

- Pas de ré-exécution indépendante des notebooks dans Databricks durant cet audit ; seul leur code a été inspecté.
- Le contrôle de 48 enregistrements par jour/région ne prouve pas à lui seul l'absence de valeurs de mesure manquantes ou de doublons horaires compensés.
- SQL E4.3 additionne plusieurs colonnes ; des `NULL` peuvent influencer certaines sommes. Sur l'export Gold de démonstration, les sept valeurs de mesure sont renseignées.
- Le ratio de production / consommation est un ratio **sur volumes mensuels agrégés** et ne représente pas la couverture heure par heure ou les exportations.
- La part renouvelable porte sur la production des six filières étudiées, **pas la part des renouvelables dans la consommation**.
- Le projet Power BI PBIP modifié (paramètre `DataRoot`) nécessite une validation d'ouverture et d'actualisation dans Power BI Desktop sur Windows.
