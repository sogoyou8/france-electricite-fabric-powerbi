import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadGoldFacts,selectFacts,summarize,byDate,byRegion,energyMix,rowsCSV,observationsFor} from '../src/metrics.js';
const demo=async()=>{
 const [f,r,d]=await Promise.all(['fact_energie.csv','dim_region.csv','dim_date.csv'].map(name=>readFile(new URL('../public/data/'+name,import.meta.url),'utf8')));
 return loadGoldFacts(f,r,d);
};
test('the published Gold dataset covers 12 regions and 31 complete days',async()=>{
 const {rows,regions,dates}=await demo();
 assert.equal(rows.length,372);assert.equal(regions.length,12);assert.equal(dates.length,31);
 assert.equal(byDate(rows).length,31);assert.equal(byRegion(rows).length,12);
 assert.ok(rows.every(r=>r.nb_demi_heures===48));
});
test('web metrics reproduce the Jan 2024 Power BI KPI totals',async()=>{
 const {rows}=await demo();
 const m=summarize(rows);
 assert.ok(Math.abs(m.consommation_mwh/1e6-48.557944)<1e-6);
 assert.ok(Math.abs(m.production_mwh/1e6-54.9698635)<1e-6);
 assert.ok(Math.abs(m.part_renouvelables-27.2821134)<0.0001);
 assert.ok(Math.abs(m.couverture_pct-113.20467666)<0.0001);
 assert.ok(Math.abs(energyMix(m).reduce((s,x)=>s+x.mwh,0)-m.production_mwh)<0.0001);
});
test('region and date filters affect every KPI consistently',async()=>{
 const {rows}=await demo();
 const selected=selectFacts(rows,{region:'11',start:'2024-01-01',end:'2024-01-10'});
 assert.equal(selected.length,10);
 assert.ok(summarize(selected).consommation_mwh<summarize(rows).consommation_mwh);
 assert.equal(byDate(selected).length,10);
 assert.equal(byRegion(selected).length,1);
 assert.ok(rowsCSV(selected).startsWith('\uFEFFdate;'));
});


test('V4 cross-filtering preserves six-filiere KPIs and compares all regions on the same period',async()=>{
 const {rows,regions}=await demo();
 const period=selectFacts(rows,{start:'2024-01-10',end:'2024-01-12'});
 const regional=selectFacts(period,{region:regions[0].code_insee_region});
 assert.equal(period.length,36);
 assert.equal(regional.length,3);
 assert.equal(byRegion(period).length,12);
 assert.equal(byDate(regional).length,3);
 const base=summarize(regional);
 const observations=observationsFor(period,regional,'eolien_mwh');
 assert.equal(observations.length,3);
 assert.equal(observations[0].value,[...byRegion(period)].sort((a,b)=>b.eolien_mwh-a.eolien_mwh)[0].region);
 assert.equal(observations[1].value,[...byDate(regional)].sort((a,b)=>b.eolien_mwh-a.eolien_mwh)[0].date);
 assert.equal(observations[2].label,'Poids dans le mix · sélection');
 assert.ok(base.eolien_mwh<=base.production_mwh);
 assert.equal(summarize(regional).production_mwh,base.production_mwh);
 assert.ok(rowsCSV(regional).includes('nucleaire_mwh;'));
 assert.ok(rowsCSV(regional).includes('eolien_mwh;'));
});
test('Gold quality rejects duplicate day-region rows and a mismatched date dimension',async()=>{
 const [f,r,d]=await Promise.all(['fact_energie.csv','dim_region.csv','dim_date.csv'].map(name=>readFile(new URL('../public/data/'+name,import.meta.url),'utf8')));
 const lines=f.trim().split(/\r?\n/);
 lines[2]=lines[1];
 assert.throws(()=>loadGoldFacts(lines.join('\n'),r,d),/doublonné/);
 assert.throws(()=>loadGoldFacts(f,r,d.trim().split(/\r?\n/).slice(0,-1).join('\n')),/Dimension date incohérente/);
});
