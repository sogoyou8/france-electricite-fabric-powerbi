-- E4.3 : Indicateurs énergétiques nationaux

SELECT
    ROUND(
        SUM(consommation_mwh) / 1000000, 2
    ) AS consommation_twh,

    ROUND(
        SUM(nucleaire_mwh) / 1000000, 2
    ) AS nucleaire_twh,

    ROUND(
        SUM(
            eolien_mwh
            + solaire_mwh
            + hydraulique_mwh
            + bioenergies_mwh
        ) / 1000000, 2
    ) AS renouvelables_twh,

    ROUND(
        100.0 * SUM(
            eolien_mwh
            + solaire_mwh
            + hydraulique_mwh
            + bioenergies_mwh
        )
        / NULLIF(SUM(
            nucleaire_mwh
            + thermique_mwh
            + eolien_mwh
            + solaire_mwh
            + hydraulique_mwh
            + bioenergies_mwh
        ), 0),
        2
    ) AS part_renouvelables_pct

FROM workspace.default.fact_energie;
