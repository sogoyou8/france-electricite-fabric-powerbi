import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadGoldFacts,selectFacts,summarize,byDate,byRegion,energyMix,rowsCSV} from '../src/metrics.js';
const demo=async()=>{
 const [f,r]=await Promise.all(['fact_energie.csv','dim_region.csv'].map(name=>readFile(new URL('../public/data/'+name,import.meta.url),'utf8')));
 return loadGoldFacts(f,r);
};
test('the published Gold dataset covers 12 regions and 31 complete days',async()=>{
 const {rows,regions}=await demo();
 assert.equal(rows.length,372);assert.equal(regions.length,12);
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
