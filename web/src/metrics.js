export const ENERGY_FIELDS = [
  { key: 'nucleaire_mwh', name: 'Nucléaire', color: '#8e8bff' },
  { key: 'hydraulique_mwh', name: 'Hydraulique', color: '#21bdca' },
  { key: 'eolien_mwh', name: 'Éolien', color: '#3f94ff' },
  { key: 'solaire_mwh', name: 'Solaire', color: '#f2be63' },
  { key: 'bioenergies_mwh', name: 'Bioénergies', color: '#75c997' },
  { key: 'thermique_mwh', name: 'Thermique', color: '#ef8b8b' },
];
export const RENEWABLE_KEYS = ['hydraulique_mwh','eolien_mwh','solaire_mwh','bioenergies_mwh'];
export const numericFields = ['nb_demi_heures','consommation_mwh',...ENERGY_FIELDS.map(x=>x.key)];
export const MEASURE_KEYS = ['consommation_mwh',...ENERGY_FIELDS.map(x=>x.key)];
export const SOURCE_URL = 'https://odre.opendatasoft.com/explore/dataset/eco2mix-regional-cons-def/';

export function parseCSV(content) {
  const clean = content.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];
  const [header, ...lines] = clean.split(/\r?\n/);
  const keys = header.split(',');
  return lines.filter(Boolean).map(line => {
    const cols=line.split(',');
    if(cols.length!==keys.length) throw new Error('CSV invalide : nombre de colonnes incorrect.');
    return Object.fromEntries(keys.map((key,i)=>[key,cols[i]]));
  });
}
export function loadGoldFacts(factsCSV, regionsCSV) {
  const regions = parseCSV(regionsCSV);
  const lookup = Object.fromEntries(regions.map(r=>[r.code_insee_region,r.region]));
  const rows = parseCSV(factsCSV).map(raw=>{
    const record = { ...raw, region: lookup[raw.code_insee_region] };
    if (!record.region || !/^2024-01-\d\d$/.test(record.date)) throw new Error('Ligne sans région ou hors janvier 2024.');
    for(const field of numericFields){
      record[field]=Number(record[field]);
      if(!Number.isFinite(record[field])) throw new Error('Valeur non numérique : '+field);
    }
    return record;
  });
  const days=new Set(rows.map(r=>r.date));
  const keys=new Set(rows.map(r=>r.code_insee_region));
  if(rows.length!==372||days.size!==31||keys.size!==12) throw new Error('Export Gold incomplet : 31 jours × 12 régions attendus.');
  return {rows,regions};
}
export function selectFacts(rows, {region='all',start='2024-01-01',end='2024-01-31'}={}){
  return rows.filter(r=>(region==='all'||r.code_insee_region===region)&&r.date>=start&&r.date<=end);
}
export function summarize(rows) {
  const sums=Object.fromEntries(MEASURE_KEYS.map(k=>[k,0]));
  for(const row of rows) for(const k of MEASURE_KEYS) sums[k]+=Number(row[k])||0;
  const nuclear=sums.nucleaire_mwh;
  const renewable=RENEWABLE_KEYS.reduce((s,k)=>s+sums[k],0);
  const thermal=sums.thermique_mwh;
  const production=nuclear+renewable+thermal;
  const consumption=sums.consommation_mwh;
  return {...sums,production_mwh:production,renouvelables_mwh:renewable,part_renouvelables:production>0?renewable/production*100:null,couverture_pct:consumption>0?production/consumption*100:null,ecart_mwh:production-consumption, observations:rows.length};
}
export function byDate(rows){
  const dates=new Map();
  for(const r of rows){
    if(!dates.has(r.date))dates.set(r.date,[]);
    dates.get(r.date).push(r);
  }
  return [...dates].sort(([a],[b])=>a.localeCompare(b)).map(([date,group])=>({date,...summarize(group)}));
}
export function byRegion(rows){
  const grouped = new Map();
  for(const row of rows){
    if(!grouped.has(row.code_insee_region))grouped.set(row.code_insee_region,[]);
    grouped.get(row.code_insee_region).push(row);
  }
  return [...grouped].map(([code, group])=>({code,region:group[0].region,...summarize(group)}));
}
export function energyMix(summary){
  return ENERGY_FIELDS.map(field=>({...field,mwh:summary[field.key],percent:summary.production_mwh?summary[field.key]/summary.production_mwh*100:0}));
}
export function energyToTWh(mwh){return mwh/1_000_000;}
export function frenchNumber(value,digits=2){
  return new Intl.NumberFormat('fr-FR',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
}
export function twh(mwh,digits=2){return frenchNumber(energyToTWh(mwh),digits);}
export function pct(p,digits=1){return p==null?'—':frenchNumber(p,digits)+' %';}
export function rowsCSV(rows){
  const keys=['date','code_insee_region','region',...numericFields];
  const out=[keys.join(';')];
  for(const r of rows)out.push(keys.map(k=>String(r[k]??'').replaceAll(';',',')).join(';'));
  return '\uFEFF'+out.join('\r\n')+'\r\n';
}
