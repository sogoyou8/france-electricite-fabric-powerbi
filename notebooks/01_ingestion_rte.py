# Databricks notebook source

# E2 — Lecture des données brutes RTE

chemin = "/Volumes/workspace/default/bronze/eco2mix-regional-cons-def.csv"

df_bronze = spark.read.csv(
    chemin,
    header=True,
    sep=";",
    inferSchema=False
)

print("Nombre de lignes :", df_bronze.count())
print("Nombre de colonnes :", len(df_bronze.columns))

display(df_bronze.limit(5))


# COMMAND ----------


from pyspark.sql import functions as F

controle = df_bronze.agg(
    F.min("Date").alias("Première date"),
    F.max("Date").alias("Dernière date"),
    F.countDistinct("Région").alias("Régions"),
    F.countDistinct(
        F.struct("Code INSEE région", "Date", "Heure")
    ).alias("Observations uniques")
)

display(controle)
