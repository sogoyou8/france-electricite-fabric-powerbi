# Databricks notebook source

from pyspark.sql import functions as F

# E3.8.1 — Préparer la table de faits Gold

silver = spark.read.table(
    "workspace.default.silver_energie"
)

# Mesures électriques à agréger
mesures = [
    "consommation_mw",
    "nucleaire_mw",
    "eolien_mw",
    "solaire_mw",
    "hydraulique_mw",
    "thermique_mw",
    "bioenergies_mw"
]

# Regrouper par jour et par région
aggregations = [
    F.count("*").alias("nb_demi_heures")
]

for colonne in mesures:
    nouveau_nom = colonne.replace("_mw", "_mwh")

    aggregations.append(
        (F.sum(F.col(colonne)) * 0.5).alias(nouveau_nom)
    )

fact_energie = (
    silver.groupBy("date", "code_insee_region")
    .agg(*aggregations)
)

# Contrôles
print("Lignes Gold :", fact_energie.count())
print("Colonnes Gold :", len(fact_energie.columns))

print(
    "Jours distincts :",
    fact_energie.select("date").distinct().count()
)

print(
    "Régions distinctes :",
    fact_energie.select(
        "code_insee_region"
    ).distinct().count()
)

print(
    "Jours/régions incomplets :",
    fact_energie.filter(
        F.col("nb_demi_heures") != 48
    ).count()
)

display(fact_energie.orderBy("date", "code_insee_region").limit(10))


# COMMAND ----------


# E3.8.2 — Validation de la table Gold

lignes = fact_energie.count()
jours = fact_energie.select("date").distinct().count()
regions = fact_energie.select(
    "code_insee_region"
).distinct().count()

incomplets = fact_energie.filter(
    F.col("nb_demi_heures") != 48
).count()

doublons = lignes - fact_energie.select(
    "date", "code_insee_region"
).distinct().count()

print("Lignes :", lignes)
print("Jours :", jours)
print("Régions :", regions)
print("Journées incomplètes :", incomplets)
print("Doublons :", doublons)

assert lignes == 372
assert jours == 31
assert regions == 12
assert incomplets == 0
assert doublons == 0

print("VALIDATION GOLD : OK")


# COMMAND ----------


# E3.8.3 — Enregistrement de fact_energie

# 1. Créer la table Delta Gold
fact_energie.writeTo(
    "workspace.default.fact_energie"
).createOrReplace()

# 2. Relire la table enregistrée
fact_gold = spark.read.table(
    "workspace.default.fact_energie"
)

# 3. Vérifier son contenu
print("Table fact_energie créée !")
print("Lignes :", fact_gold.count())
print("Colonnes :", len(fact_gold.columns))

# 4. Vérifier son format
spark.sql("""
    DESCRIBE DETAIL workspace.default.fact_energie
""").select("name", "format").show()


# COMMAND ----------


from pyspark.sql import functions as F

# E3.8.4 — Création de dim_date

fact_gold = spark.read.table(
    "workspace.default.fact_energie"
)

# 1. Construire la dimension calendrier
dim_date = (
    fact_gold
    .select("date")
    .distinct()
    .withColumn("annee", F.year("date"))
    .withColumn("trimestre", F.quarter("date"))
    .withColumn("mois", F.month("date"))
    .withColumn("jour", F.dayofmonth("date"))
    .withColumn(
        "jour_semaine",
        ((F.dayofweek("date") + 5) % 7) + 1
    )
)

# 2. Contrôler la dimension
print("Nombre de dates :", dim_date.count())

assert dim_date.count() == 31

# 3. Enregistrer la table Delta
dim_date.writeTo(
    "workspace.default.dim_date"
).createOrReplace()

print("Table dim_date créée !")

# 4. Afficher les premières dates
display(dim_date.orderBy("date").limit(10))


# COMMAND ----------


from pyspark.sql import functions as F

# E3.8.5 — Création de dim_region

# 1. Charger les données Silver
silver = spark.read.table(
    "workspace.default.silver_energie"
)

# 2. Extraire les régions uniques
dim_region = (
    silver
    .select("code_insee_region", "region")
    .distinct()
    .orderBy("code_insee_region")
)

# 3. Vérifier les données
nb_regions = dim_region.count()

nb_codes = dim_region.select(
    "code_insee_region"
).distinct().count()

nb_noms = dim_region.select(
    "region"
).distinct().count()

valeurs_nulles = dim_region.filter(
    F.col("code_insee_region").isNull()
    | F.col("region").isNull()
).count()

print("Régions :", nb_regions)
print("Codes INSEE uniques :", nb_codes)
print("Noms uniques :", nb_noms)
print("Valeurs nulles :", valeurs_nulles)

assert nb_regions == 12
assert nb_codes == 12
assert nb_noms == 12
assert valeurs_nulles == 0

# 4. Enregistrer la dimension
dim_region.writeTo(
    "workspace.default.dim_region"
).createOrReplace()

print("Table dim_region créée !")

# 5. Afficher les régions
display(dim_region)


# COMMAND ----------


# E3.9 — Validation finale Gold

from pyspark.sql import functions as F

fact = spark.read.table("workspace.default.fact_energie")
dates = spark.read.table("workspace.default.dim_date")
regions = spark.read.table("workspace.default.dim_region")

# Vérifier le nombre d'enregistrements
print("Faits :", fact.count())
print("Dates :", dates.count())
print("Régions :", regions.count())

# Vérifier l'unicité des dimensions
assert dates.count() == dates.select("date").distinct().count()
assert regions.count() == regions.select(
    "code_insee_region"
).distinct().count()

# Détecter les références absentes
sans_date = fact.join(
    dates.select("date"),
    "date",
    "left_anti"
).count()

sans_region = fact.join(
    regions.select("code_insee_region"),
    "code_insee_region",
    "left_anti"
).count()

print("Faits sans date :", sans_date)
print("Faits sans région :", sans_region)

assert fact.count() == 372
assert dates.count() == 31
assert regions.count() == 12
assert sans_date == 0
assert sans_region == 0

print("VALIDATION FINALE GOLD : OK")
