# Recette finale E8 — France Électricité 2024

Date de préparation : 16 octobre 2026.

Cette recette clôture un **projet portfolio Data Analyst sur des données figées de janvier 2024**. Elle distingue explicitement les vérifications automatiques des tests manuels. Une case non cochée ne doit pas être présentée comme validée.

## Données Gold — preuves dans le dépôt

- [x] Contrôle du jeu de démonstration : 372 faits (31 dates × 12 régions).
- [x] Clé jour/région unique dans les CSV Gold ; `nb_demi_heures = 48` pour tous les faits.
- [x] Intégrité des clés date/région et KPI nationaux de référence vérifiés par `scripts/check_repo.py`.
- [x] Copies `data/demo/` et `web/public/data/` cohérentes.
- [ ] Rejeu intégral des notebooks Databricks sur les données brutes RTE : **non requis pour la clôture portfolio**, non confirmé par GitHub Actions.

## Code et publication — vérifications automatisées

- [x] CI Python : `python scripts/check_repo.py` sur la PR de documentation E6.
- [x] CI web : calculs, sélection région/date, carte et données Gold validés par `npm test` sur la PR de documentation E6.
- [x] Sur la PR #6 : `npm ci`, `npm audit --audit-level=high`, `npm test` et `npm run build` réussis ([run GitHub Actions #38851846965](https://github.com/sogoyou8/france-electricite-fabric-powerbi/actions/runs/38851846965)).
- [ ] Après fusion : workflow web sur `main` validé ; [démo Vercel](https://france-electricite-2024-explorer.vercel.app/) toujours accessible.
- [x] Portfolio [Abyss Showcase](https://abyss-public-showcase.vercel.app/projects/france-electricite-2024) déjà publié.

## Power BI Desktop — validation locale requise

Le code source PBIP/TMDL et les 12 mesures DAX existent dans le dépôt ; **cela ne prouve pas que le rapport s'ouvre et s'actualise correctement sur un autre poste**.

Procédure Windows :

1. Ouvrir `powerbi/France_Electricite_2024.pbip` dans Power BI Desktop.
2. Accueil → Transformer les données → Gérer les paramètres → `DataRoot`. Indiquer le chemin absolu du dossier `data\\demo\\`, avec le dernier `\\`.
3. Fermer et appliquer, puis actualiser `fact_energie.csv`, `dim_date.csv`, `dim_region.csv`.
4. Vérifier les 4 pages visibles et les relations du modèle. Vérifier les indicateurs nationaux :
   - Consommation : **48,56 TWh**.
   - Production étudiée : **54,97 TWh**.
   - Renouvelables : **15,00 TWh**, soit **27,28 %**.
   - Taux de couverture : **113,20 %**.
5. Sauvegarder la recette localement et noter une preuve visuelle ou un court résultat daté.

Statut de la validation manuelle :

- [ ] Le PBIP s'ouvre sans erreur.
- [ ] Les trois sources s'actualisent sans erreur.
- [ ] Les 12 mesures DAX et les quatre pages visibles sont cohérentes.
- [ ] La validation est confirmée par l'utilisateur avec une preuve ou un retour précis.

## Périmètre et fin de projet

- **Démontré** : RTE/ODRÉ → Databricks / PySpark / Delta Lake (Bronze CSV logique, Silver, Gold) → SQL → Power BI Desktop et cockpit React/Vite.
- **Non réalisé** : Microsoft Fabric, streaming ou actualisation temps réel, Power BI Service public.
- **Hors clôture** : refonte CSS/React, Playwright complet, Great Expectations, changement de stack, automatisation du workspace Databricks.

**Critère d'arrêt** : CI `main` verte, démo et portfolio accessibles, documentation GitHub cohérente, description du dépôt sans la mention erronée de Microsoft Fabric et recette Power BI confirmée. Ensuite, figer le projet et passer au deuxième projet DATA.
