import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import map from '../src/regions-outline.json' with {type:'json'};
import {loadGoldFacts, selectFacts, byRegion, summarize, twh} from '../src/metrics.js';
async function source(){
 const [fact,regions]=await Promise.all(['fact_energie.csv','dim_region.csv'].map(name=>readFile(new URL('../public/data/'+name,import.meta.url),'utf8')));
 return loadGoldFacts(fact,regions);
}
test('geographic boundaries use exactly the 12 Gold region codes, never Corsica', async ()=>{
 const {rows,regions}=await source();
 assert.equal(map.regions.length,12);
 const mapCodes=new Set(map.regions.map(x=>x.code));
 assert.deepEqual([...mapCodes].sort(),regions.map(x=>x.code_insee_region).sort());
 assert.ok(!mapCodes.has('94'));
 for(const region of map.regions){
  assert.ok(region.d.startsWith('M'));
  assert.ok(region.d.endsWith('Z'));
  assert.ok(region.center.every(Number.isFinite));
  assert.ok(region.name.length>3);
 }
 assert.equal(byRegion(rows).length,12);
});
test('all regional map values are derived from Gold rows, no placeholders', async ()=>{
 const {rows}=await source();
 const selected=selectFacts(rows,{start:'2024-01-01',end:'2024-01-31'});
 const byR=byRegion(selected);
 const totals=summarize(selected);
 const sumByRegion=byR.reduce((sum,r)=>sum+r.production_mwh,0);
 assert.ok(Math.abs(sumByRegion-totals.production_mwh)<.01);
 assert.equal(twh(totals.production_mwh),'54,97');
 assert.equal(twh(totals.consommation_mwh),'48,56');
 assert.equal(byR.length,12);
});
