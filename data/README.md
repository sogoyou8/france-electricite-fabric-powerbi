# Données utilisées

Source officielle : [RTE — Données éCO2mix régionales consolidées et définitives](https://odre.opendatasoft.com/explore/dataset/eco2mix-regional-cons-def/).

Sélectionner **Nature = Données définitives** et **Date/Heure = janvier 2024** ; exporter en CSV avec délimiteur **point-virgule** et nom de colonnes français. Le notebook source attend le nom `eco2mix-regional-cons-def.csv` dans `/Volumes/workspace/default/bronze/`.

Les trois CSV de démonstration `demo/` sont les exports Gold utilisés pour Power BI, à finalité de reproductibilité ; ils ne constituent **pas** des sources brutes. Pour actualiser le PBIP, configurer `DataRoot` sur le dossier absolu `data/demo/`, avec son séparateur de chemin final. Si la source est téléchargée de nouveau, son contenu ou sa date de mise à jour peuvent différer de l'extrait du projet.

Données d'origine sous **Licence Ouverte 2.0**, voir `../LICENSE-DATA.md`.
