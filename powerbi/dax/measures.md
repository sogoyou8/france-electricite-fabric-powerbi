# France Électricité 2024 — Mesures DAX originales

**Source :** export PBIP fourni, fichiers `France_Electricite_2024.SemanticModel/definition/tables/*.tmdl`.

Ce document retranscrit les mesures DAX enregistrées dans le modèle Power BI. Les formules sont conservées sans correction ni réécriture. Il ne s'agit pas d'un compte rendu d'exécution indépendant.

**Inventaire : 12 mesures DAX définies, plus 1 emplacement de mesure vide.**

## Consommation totale (TWh)

Table de rattachement : `fact_energie`.

```dax
Consommation totale (TWh) =
SUM(fact_energie[consommation_mwh]) / 1000000
```

## Production nucléaire (TWh)

Table de rattachement : `fact_energie`.

```dax
Production nucléaire (TWh) =
SUM(fact_energie[nucleaire_mwh]) / 1000000
```

## Production renouvelable (TWh)

Table de rattachement : `fact_energie`.

```dax
Production renouvelable (TWh) =
(
    SUM(fact_energie[eolien_mwh])
    + SUM(fact_energie[solaire_mwh])
    + SUM(fact_energie[hydraulique_mwh])
    + SUM(fact_energie[bioenergies_mwh])
) / 1000000
```

## Part renouvelables (%)

Table de rattachement : `fact_energie`.

```dax
Part renouvelables (%) =
VAR ProductionTotale =
    [Production nucléaire (TWh)]
    + [Production renouvelable (TWh)]
    + SUM(fact_energie[thermique_mwh]) / 1000000
RETURN
    DIVIDE(
        [Production renouvelable (TWh)],
        ProductionTotale
    )
```

## Production totale (TWh)

Table de rattachement : `dim_date`.

```dax
Production totale (TWh) =
DIVIDE(
    SUM(fact_energie[nucleaire_mwh])
    + SUM(fact_energie[eolien_mwh])
    + SUM(fact_energie[solaire_mwh])
    + SUM(fact_energie[hydraulique_mwh])
    + SUM(fact_energie[bioenergies_mwh])
    + SUM(fact_energie[thermique_mwh]),
    1000000
)
```

## Taux de couverture (%)

Table de rattachement : `dim_date`.

```dax
Taux de couverture (%) =
DIVIDE(
    [Production totale (TWh)],
    [Consommation totale (TWh)]
)
```

## Production éolienne (TWh)

Table de rattachement : `dim_date`.

```dax
Production éolienne (TWh) =
DIVIDE(
    SUM(fact_energie[eolien_mwh]),
    1000000
)
```

## Production solaire (TWh)

Table de rattachement : `dim_date`.

```dax
Production solaire (TWh) =
DIVIDE(
    SUM(fact_energie[solaire_mwh]),
    1000000
)
```

## Production hydraulique (TWh)

Table de rattachement : `dim_date`.

```dax
Production hydraulique (TWh) =
DIVIDE(
    SUM(fact_energie[hydraulique_mwh]),
    1000000
)
```

## Production bioénergies (TWh)

Table de rattachement : `dim_date`.

```dax
Production bioénergies (TWh) =
DIVIDE(
    SUM(fact_energie[bioenergies_mwh]),
    1000000
)
```

## Écart contrôle renouvelables (TWh)

Table de rattachement : `dim_date`.

```dax
Écart contrôle renouvelables (TWh) =
[Production renouvelable (TWh)]
- (
    [Production hydraulique (TWh)]
    + [Production éolienne (TWh)]
    + [Production solaire (TWh)]
    + [Production bioénergies (TWh)]
)
```

## Production thermique (TWh)

Table de rattachement : `dim_date`.

```dax
Production thermique (TWh) =
DIVIDE(
    SUM(fact_energie[thermique_mwh]),
    1000000
)
```

## Audit et réserves

- **Mesure vide** : une mesure `Mesure` sans expression apparaît dans `dim_date`. Elle peut être supprimée après vérification dans Power BI.
- **Classement** : les mesures d'E6 sont actuellement rangées sous `dim_date`, même lorsqu'elles portent sur la production. Le calcul fonctionne mais une table dédiée aux mesures serait plus lisible.
- **Sources Power Query locales** : les trois tables importent des CSV à partir de chemins absolus Windows dans le profil utilisateur. Pour publier un dépôt reproductible, ajouter les CSV exportés s'ils sont redistribuables, ou expliquer comment régénérer ces fichiers et reconfigurer leurs chemins.
- **Contrôle numérique** : l'écart renouvelables est affiché à quatre décimales sur le rapport ; cette correspondance atteste une cohérence au niveau de précision affiché, sans remplacer un contrôle des lignes sources.
- **Sécurité et partage** : éviter d'inclure les caches `.pbi`, fichiers de configuration locale et métadonnées `.git` dans un paquet d'archive public. Les scripts DAX ci-dessus ne contiennent pas de chemin local.

## Modèle de données

- `fact_energie[date]` → `dim_date[date]`.
- `fact_energie[code_insee_region]` → `dim_region[code_insee_region]`.
- Une relation supplémentaire vers une table de dates automatique locale apparaît dans le modèle.

## Reproduction

Power BI Desktop (projet `France_Electricite_2024.pbip`) ; données importées depuis `fact_energie.csv`, `dim_date.csv` et `dim_region.csv`, produites à partir des notebooks Databricks Free Edition (fichier source distinct).
