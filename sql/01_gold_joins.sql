-- E4.1 : Relier nos trois tables Gold

SELECT
    f.date,
    r.region,
    ROUND(f.consommation_mwh, 2) AS consommation_mwh,
    ROUND(f.nucleaire_mwh, 2) AS nucleaire_mwh

FROM workspace.default.fact_energie AS f

INNER JOIN workspace.default.dim_region AS r
    ON f.code_insee_region = r.code_insee_region

INNER JOIN workspace.default.dim_date AS d
    ON f.date = d.date

ORDER BY f.date, r.region
LIMIT 10;
