-- E4.4 : Exporter la table de faits vers Power BI

SELECT *
FROM workspace.default.fact_energie
ORDER BY date, code_insee_region;
