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
