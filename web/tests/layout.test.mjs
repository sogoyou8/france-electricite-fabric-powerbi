import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../src/interface-v5-5.css',import.meta.url),'utf8');
const main=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');
const legacy=await readFile(new URL('../src/interface-v4-2.css',import.meta.url),'utf8');

test('V5.5 explicitly supersedes the old 770px-height scrolling breakpoint',()=>{
 assert.match(legacy,/@media\s*\(max-width:1070px\),\s*\(max-height:770px\)/);
 assert.match(css,/@media\s*\(min-width:1160px\)\s*and\s*\(min-height:620px\)/);
 // Two root classes make the new selector more specific than .cockpit-v42.
 assert.match(css,/\.cockpit-v42\.cockpit-v5\s*\{[\s\S]*?height:100dvh;[\s\S]*?min-height:0;[\s\S]*?overflow:hidden;/);
 assert.match(css,/\.cockpit-v42\.cockpit-v5 \.v5-body\s*\{[\s\S]*?display:grid;[\s\S]*?min-height:0;[\s\S]*?overflow:hidden;/);
 assert.match(css,/\.cockpit-v42\.cockpit-v5 \.v5-map \.map-layout\s*\{[\s\S]*?min-height:0;/);
 assert.match(css,/\.cockpit-v42\.cockpit-v5 \.v5-mix-list\s*\{[\s\S]*?min-height:0;/);
 assert.match(css,/clamp\(180px,24vh,192px\)/);
 assert.match(css,/50px 58px minmax\(0,1fr\) 180px 33px 22px/);
});

test('shorter and narrower screens still allow natural scrolling',()=>{
 assert.match(css,/@media\s*\(min-width:1160px\)\s*and\s*\(max-height:619px\)/);
 assert.match(css,/@media\s*\(max-width:1159px\)/);
 assert.match(css,/\.cockpit-v42\.cockpit-v5\s*\{height:auto;min-height:100dvh;max-height:none;overflow:visible\}/);
});

test('V5.4 numeric axis precision is retained and original safe map frame restored',()=>{
 assert.match(main,/axisTickLabels\(max\)/);
 assert.match(main,/const V53_MAP_VIEWBOX='55 8 650 580'/);
 assert.match(main,/import '\.\/interface-v5-5\.css'/);
 assert.match(main,/function V52DataDrawer\(/);
});


const compact=await readFile(new URL('../src/interface-v5-6.css',import.meta.url),'utf8');
test('V5.6 preserves the recruiter-first one screen by assigning just four rows',()=>{
 assert.match(main,/cockpit-v5 v56-cockpit/);
 assert.match(main,/L’électricité française<\/h1>/);
 assert.doesNotMatch(main,/<V5Pipeline\b/);
 assert.doesNotMatch(main,/<footer className="v5-footer"/);
 assert.match(compact,/\.cockpit-v42\.cockpit-v5\.v56-cockpit \.v5-body/);
 assert.match(compact,/grid-template-rows:\s*clamp\(50px,8vh,68px\)\s*clamp\(58px,9vh,74px\)\s*minmax\(0,1fr\)\s*clamp\(236px,calc\(24vh \+ 56px\),248px\)/);
 assert.match(compact,/grid-template-rows:\s*50px 58px minmax\(0,1fr\) 236px/);
});
test('Floating toolbar workspace keeps source and methodology available',()=>{
 assert.match(main,/function DataCommandPanel/);
 assert.match(main,/role="dialog" aria-modal="true"/);
 assert.match(main,/role="tablist"/);
 assert.match(main,/aria-expanded=\{Boolean\(drawer\)\}/);
 assert.match(main,/event\.key==='Escape'/);
 assert.match(main,/event\.key==='Tab'/);
 assert.match(main,/active==='donnees'&&<V52DataDrawer/);
 assert.match(main,/active==='regions'&&/);
 assert.match(main,/active==='pipeline'&&<DataLineage\/>/);
 assert.match(main,/active==='methode'&&<Methodology\/>/);
 assert.match(compact,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(compact,/\.v56-command-body/);
});
