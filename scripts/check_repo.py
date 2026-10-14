from pathlib import Path
import csv, json, re, ast

ROOT=Path(__file__).resolve().parents[1]
required=[
 'notebooks/00_setup_energie.py','notebooks/01_ingestion_rte.py','notebooks/02_transformation_silver.py','notebooks/03_transformation_gold.py',
 'sql/01_gold_joins.sql','sql/02_monthly_consumption_by_region.sql','sql/03_national_kpis.sql',
 'sql/04_export_fact_energie.sql','sql/05_export_dim_date.sql','sql/06_export_dim_region.sql',
 'powerbi/France_Electricite_2024.pbip','powerbi/France_Electricite_2024.Report/definition.pbir',
 'powerbi/dax/measures.md','powerbi/France_Electricite_2024.SemanticModel/definition/expressions.tmdl',
 'docs/images/01_vue_ensemble.png','docs/images/02_consommation.png','docs/images/03_evolution_energetique.png','docs/images/04_analyse_regionale.png',
 'data/demo/fact_energie.csv','data/demo/dim_date.csv','data/demo/dim_region.csv'
]
for n in required: assert (ROOT/n).is_file(), f'Missing {n}'
for p in (ROOT/'notebooks').glob('*.py'): ast.parse(p.read_text(encoding='utf-8'))
for p in ROOT.rglob('*.json'):
  if '.git' in p.parts: continue
  json.loads(p.read_text(encoding='utf-8-sig'))
for p in ROOT.rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(ROOT).as_posix()
  assert p.suffix.lower() not in ('.pbix','.zip','.parquet','.pem','.key'),f'Forbidden {rel}'
  assert p.name not in ('cache.abf','localSettings.json'),f'Local cache {rel}'
  if p.suffix.lower() in ('.tmdl','.py','.sql','.md','.yml','.yaml','.pbip','.pbir'):
    content=p.read_text(encoding='utf-8-sig')
    assert not re.search(r'C:\\Users\\',content,re.I),f'User local path in {rel}'

sem=ROOT/'powerbi/France_Electricite_2024.SemanticModel/definition'
measures=[]
for p in (sem/'tables').glob('*.tmdl'):
  measures.extend(re.findall(r'^\s*measure\s+(\S[^\n]*)$', p.read_text(encoding='utf-8'),re.M))
assert len(measures)==12, f'Expected 12 DAX measures, got {len(measures)}'
assert not any(m=='Mesure' for m in measures)
assert 'expression DataRoot' in (sem/'expressions.tmdl').read_text(encoding='utf-8')
for name in ['fact_energie','dim_date','dim_region']:
  assert 'File.Contents(DataRoot &' in (sem/'tables'/f'{name}.tmdl').read_text(encoding='utf-8')

def rows(n):
  with (ROOT/'data/demo'/n).open(newline='',encoding='utf-8-sig') as fp:
    return list(csv.DictReader(fp))
facts,dates,regions=rows('fact_energie.csv'),rows('dim_date.csv'),rows('dim_region.csv')
assert len(facts)==372 and len(dates)==31 and len(regions)==12
assert len({(r['date'],r['code_insee_region']) for r in facts})==372
assert set(r['nb_demi_heures'] for r in facts)=={'48'}
assert {r['date'] for r in facts}=={r['date'] for r in dates}
assert {r['code_insee_region'] for r in facts}=={r['code_insee_region'] for r in regions}
num=['consommation_mwh','nucleaire_mwh','eolien_mwh','solaire_mwh','hydraulique_mwh','thermique_mwh','bioenergies_mwh']
totals={k:sum(float(r[k]) for r in facts)/1e6 for k in num}
assert abs(totals['consommation_mwh']-48.557944)<1e-8
assert abs(totals['nucleaire_mwh']-35.921983)<1e-8
for p in (ROOT/'docs/images').glob('*.png'):
  import struct
  with p.open('rb') as fd: header=fd.read(24)
  assert header[:8]==b'\x89PNG\r\n\x1a\n'
  assert struct.unpack('>II',header[16:24])==(2880,1620),p
print('OK — 4 notebooks, 6 SQL, 12 mesures DAX, JSON/TMDL, 4 images, 3 CSV et totaux contrôlés.')
print('KPI:',{k:round(v,4) for k,v in totals.items()})
