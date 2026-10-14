-- E4.2 : Consommation mensuelle par région

SELECT
    r.region,
    ROUND(
        SUM(f.consommation_mwh), 2
    ) AS consommation_totale_mwh,
    ROUND(
        SUM(f.nucleaire_mwh), 2
    ) AS production_nucleaire_mwh

FROM workspace.default.fact_energie AS f

INNER JOIN workspace.default.dim_region AS r
    ON f.code_insee_region = r.code_insee_region

GROUP BY r.region

ORDER BY consommation_totale_mwh DESC;
