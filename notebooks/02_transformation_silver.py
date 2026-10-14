# Databricks notebook source

# E3.1 — Analyse des données Bronze

chemin = "/Volumes/workspace/default/bronze/eco2mix-regional-cons-def.csv"

df_bronze = spark.read.csv(
    chemin,
    header=True,
    sep=";",
    inferSchema=False
)

print("Nombre de lignes :", df_bronze.count())
print("Nombre de colonnes :", len(df_bronze.columns))

print("\nListe des colonnes :")
for numero, colonne in enumerate(df_bronze.columns, start=1):
    print(f"{numero}. {colonne}")

print("\nAperçu des données :")
display(df_bronze.limit(5))


# COMMAND ----------


from pyspark.sql import functions as F

# Contrôler les 32 colonnes
expressions = []

for i, nom in enumerate(df_bronze.columns):
    colonne = F.col(f"`{nom}`")
    manquant = (
        colonne.isNull()
        | F.lower(F.trim(colonne)).isin("", "null", "nan")
    )

    expressions.append(
        F.sum(F.when(manquant, 1).otherwise(0)).alias(f"c{i}")
    )

resultats = df_bronze.agg(*expressions).first()

# Construire le rapport de qualité
rapport = [
    (nom, int(resultats[f"c{i}"]))
    for i, nom in enumerate(df_bronze.columns)
]

df_qualite = spark.createDataFrame(
    rapport,
    ["Colonne", "Valeurs_manquantes"]
)

display(
    df_qualite.orderBy(
        F.desc("Valeurs_manquantes")
    )
)


# COMMAND ----------


# E3.3 — Vérifier le TCH nucléaire par région

controle_regions = (
    df_bronze.groupBy("Région")
    .agg(
        F.count("*").alias("Lignes"),
        F.sum(
            F.when(
                F.col("TCH Nucléaire (%)").isNull()
                | (F.lower(F.trim(F.col("TCH Nucléaire (%)"))) == "null"),
                1
            ).otherwise(0)
        ).alias("TCH manquants"),
        F.max(
            F.col("Nucléaire (MW)").cast("double")
        ).alias("Production max MW")
    )
    .orderBy("Région")
)

display(controle_regions)


# COMMAND ----------


from pyspark.sql import functions as F

# 1. Supprimer la colonne entièrement vide
df_silver = df_bronze.drop("Column 30")

# 2. Convertir la date au véritable format Date
df_silver = df_silver.withColumn(
    "Date",
    F.to_date(F.col("Date"), "yyyy-MM-dd")
)

# 3. Identifier les colonnes numériques
colonnes_texte = [
    "Code INSEE région",
    "Région",
    "Nature",
    "Date",
    "Heure",
    "Date - Heure"
]

colonnes_numeriques = [
    c for c in df_silver.columns
    if c not in colonnes_texte
]

# 4. Convertir les mesures en nombres
for c in colonnes_numeriques:
    df_silver = df_silver.withColumn(
        c,
        F.expr(f"try_cast(`{c}` AS DOUBLE)")
    )

# 5. Vérifier la nouvelle structure
print("Lignes :", df_silver.count())
print("Colonnes :", len(df_silver.columns))
print("Colonnes numériques :", len(colonnes_numeriques))

df_silver.printSchema()

display(
    df_silver.select(
        "Région",
        "Date",
        "Consommation (MW)",
        "Nucléaire (MW)",
        "TCH Nucléaire (%)"
    ).limit(5)
)


# COMMAND ----------


# E3.5 — Contrôle qualité après conversion

from pyspark.sql import functions as F

print("Lignes :", df_silver.count())
print("Colonnes :", len(df_silver.columns))

print(
    "Colonnes numériques :",
    sum(t == "double" for _, t in df_silver.dtypes)
)

# Vérifier les conversions numériques incorrectes
controles = []

for i, c in enumerate(colonnes_numeriques):
    brut = F.col(f"`{c}`")

    valeur_presente = (
        brut.isNotNull()
        & ~F.lower(F.trim(brut)).isin("", "null", "nan")
    )

    conversion = F.expr(f"try_cast(`{c}` AS DOUBLE)")

    controles.append(
        F.sum(
            F.when(
                valeur_presente & conversion.isNull(), 1
            ).otherwise(0)
        ).alias(f"c{i}")
    )

resultat = df_bronze.agg(*controles).first()

rapport = [
    (c, int(resultat[f"c{i}"]))
    for i, c in enumerate(colonnes_numeriques)
]

df_controle = spark.createDataFrame(
    rapport,
    ["Colonne", "Conversions_invalides"]
)

display(
    df_controle.orderBy(F.desc("Conversions_invalides"))
)

print(
    "Total conversions invalides :",
    sum(x[1] for x in rapport)
)


# COMMAND ----------


# E3.6 — Normalisation des noms de colonnes

import re
import unicodedata
from pyspark.sql import functions as F

def normaliser_nom(nom):
    nom = nom.replace("(MW)", " mw")
    nom = nom.replace("(%)", " pct")
    nom = unicodedata.normalize("NFKD", nom)
    nom = "".join(
        c for c in nom
        if not unicodedata.combining(c)
    )
    return re.sub(
        r"[^a-z0-9]+", "_", nom.lower()
    ).strip("_")

nouveaux_noms = [
    normaliser_nom(c) for c in df_silver.columns
]

assert len(nouveaux_noms) == len(set(nouveaux_noms)), \
    "Noms de colonnes en doublon"

df_silver_final = df_silver.toDF(*nouveaux_noms)

# Derniers contrôles
print("Lignes :", df_silver_final.count())
print("Colonnes :", len(df_silver_final.columns))
print("Dates invalides :",
      df_silver_final.filter(F.col("date").isNull()).count())
print("Régions :",
      df_silver_final.select("region").distinct().count())

print("\nNouvelles colonnes :")
df_silver_final.printSchema()


# COMMAND ----------


from pyspark.sql import functions as F

# 1. Convertir la date et l'heure
df_silver_final = df_silver_final.withColumn(
    "date_heure",
    F.to_timestamp(
        F.concat_ws(
            " ",
            F.col("date").cast("string"),
            F.col("heure")
        ),
        "yyyy-MM-dd HH:mm"
    )
)

# 2. Vérifier les horodatages
dates_invalides = df_silver_final.filter(
    F.col("date_heure").isNull()
).count()

print("Horodatages invalides :", dates_invalides)

assert dates_invalides == 0, "Dates à corriger"

# 3. Enregistrer la table Delta
df_silver_final.writeTo(
    "workspace.default.silver_energie"
).createOrReplace()

# 4. Vérifier la table enregistrée
table_silver = spark.read.table(
    "workspace.default.silver_energie"
)

print("Table Silver créée !")
print("Lignes :", table_silver.count())
print("Colonnes :", len(table_silver.columns))

display(table_silver.limit(5))


# COMMAND ----------


# E3.7 — Validation de la table Silver

table = spark.read.table(
    "workspace.default.silver_energie"
)

print("Lignes :", table.count())
print("Colonnes :", len(table.columns))

# Vérifier le format de stockage
details = spark.sql("""
    DESCRIBE DETAIL workspace.default.silver_energie
""")

display(
    details.select("name", "format", "numFiles")
)
