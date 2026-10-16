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
- [x] Après fusion : [workflow web sur `main` réussi (run #38852061790)](https://github.com/sogoyou8/france-electricite-fabric-powerbi/actions/runs/38852061790), [contrôles portfolio réussis (run #38852061678)](https://github.com/sogoyou8/france-electricite-fabric-powerbi/actions/runs/38852061678) ; [démo Vercel](https://france-electricite-2024-explorer.vercel.app/) et [page Abyss Showcase](https://abyss-public-showcase.vercel.app/projects/france-electricite-2024) accessibles publiquement (HTTP 200 le 16 octobre 2026).
- [x] Portfolio [Abyss Showcase](https://abyss-public-showcase.vercel.app/projects/france-electricite-2024) déjà publié.

## Power BI Desktop — validation locale requise

Le code source PBIP/TMDL et les 12 mesures DAX existent dans le dépôt. L'ouverture du projet sous Windows et l'affichage du rapport ont été vérifiés visuellement le **16 octobre 2026** ; la **confirmation explicite d'une actualisation complète des trois CSV sans erreur** reste à obtenir. Les captures ne prouvent pas à elles seules l'exécution de l'ensemble des mesures DAX.

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

Statut de la validation manuelle — preuves visuelles reçues le **16 octobre 2026** :

- [x] Le fichier `France_Electricite_2024.pbip` s'ouvre dans Power BI Desktop sous Windows depuis un dossier extrait (un premier essai directement depuis le ZIP échouait : `definition.pbir` indisponible dans le dossier temporaire).
- [x] Les tables `fact_energie`, `dim_date` et `dim_region` figurent dans le volet Données ; les visuels affichent des valeurs non vides.
- [x] Les quatre pages de rapport sont visibles : `Vue d'ensemble`, `Consommation`, `Évolution énergétique` et `Analyse régionale`. La page masquée `Contrôle E6` a également été affichée pour la recette.
- [x] Les valeurs de référence montrées sur les captures concordent : consommation **48,56 TWh**, nucléaire **35,92 TWh**, renouvelables **15,00 TWh**, part renouvelable **27,28 %**, production totale **54,97 TWh**, couverture **113,20 %** et écart de contrôle **0,0000**.
- [x] L'utilisateur a fourni des captures des cinq pages montrant l'ouverture et les principaux visuels. Ces captures ont été examinées dans la conversation ; elles ne sont pas versionnées dans ce dépôt.
- [ ] L'utilisateur confirme explicitement qu'après réglage de `DataRoot`, l'actualisation de `fact_energie.csv`, `dim_date.csv` et `dim_region.csv` s'est terminée **sans erreur**. Les captures seules ne permettent pas de garantir cette étape.
- [ ] Vérification exhaustive des **12 mesures DAX** dans Power BI Desktop (hors contrôles de valeurs visibles déjà notés). Cette exhaustivité n'est pas requise pour la recette portfolio, mais ne doit pas être déclarée effectuée.

## Périmètre et fin de projet

- **Démontré** : RTE/ODRÉ → Databricks / PySpark / Delta Lake (Bronze CSV logique, Silver, Gold) → SQL → Power BI Desktop et cockpit React/Vite.
- **Non réalisé** : Microsoft Fabric, streaming ou actualisation temps réel, Power BI Service public.
- **Hors clôture** : refonte CSS/React, Playwright complet, Great Expectations, changement de stack, automatisation du workspace Databricks.

**Critère d'arrêt** : CI `main` verte, démo et portfolio accessibles, documentation GitHub cohérente, description du dépôt sans la mention erronée de Microsoft Fabric et recette Power BI confirmée. Les quatre premiers critères ont été vérifiés le **16 octobre 2026**, y compris la description GitHub désormais conforme à la stack réelle. **Dernier critère en attente : confirmation explicite de l'actualisation locale des trois CSV sans erreur.** Ensuite, figer le projet et passer au deuxième projet DATA.
