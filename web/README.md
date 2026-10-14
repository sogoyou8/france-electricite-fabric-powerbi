# France Électricité 2024 — Démonstration interactive Vercel

Application web React + Vite, alimentée par les mêmes **trois exports Gold** que le rapport Power BI livré avec ce dépôt. Aucun serveur SQL, Neon, Microsoft Fabric ni clé API.

## Développement

Dans le dossier `web/` :

```sh
npm install
npm test
npm run dev
npm run build
```

Pour Vercel, sélectionner le dossier racine **web**, framework **Vite**, commande de compilation **npm run build**, sortie **dist**. Le site lit statiquement `public/data/fact_energie.csv` et `public/data/dim_region.csv`.

## Fidélité et limites

- Source RTE / ODRE : éCO2mix régionales consolidées et définitives, du 1er au 31 janvier 2024, 12 régions métropolitaines.
- Exports Gold : 372 lignes « jour × région ». Les sommes reproduisent les indicateurs de l'étude ; le site ne réexécute pas le pipeline Databricks en direct.
- Filtrage **en lecture seule**, sans compte ni stockage de données personnelles.
- Puissances originales intégrées dans Databricks en MWh (pas demi-horaire × 0,5 h), puis totalisées en TWh en divisant par 1 000 000.
- Le ratio production étudiée / consommation n'est pas un taux de couverture instantané, ni une mesure du solde import-export de la France.
- Données sous **Licence Ouverte / Etalab 2.0**, attribution : voir `../LICENSE-DATA.md`.
- Le rapport Power BI PBIP, le code Databricks, SQL et les 12 mesures DAX restent publiés dans le même dépôt GitHub.
