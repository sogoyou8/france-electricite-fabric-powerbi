import React, {useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import regionsGeo from './regions-outline.json';
import {
  ENERGY_FIELDS, SOURCE_URL, loadGoldFacts, selectFacts, summarize, byDate, byRegion,
  twh, pct, frenchNumber, rowsCSV, observationsFor
} from './metrics.js';
import './workspace.css';
import './interface-v3.css';
import './interface-v4.css';
import './interface-v4-2.css';
import './interface-v4-3.css';
import './interface-v5.css';
import './interface-v5-1.css';

const REPO='https://github.com/sogoyou8/france-electricite-fabric-powerbi';
const NAV=[['exploration','Explorer'],['comparaison','Comparer'],['tracabilite','Traçabilité']];
const MAP_COLORS=['#e7eef7','#c7dcf4','#9ec3eb','#6f9fd4','#427cb9','#205a9a','#123c74'];
const SHORT_DATE=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',timeZone:'UTC'});
function formatDate(date){return SHORT_DATE.format(new Date(date+'T12:00:00Z'))}
function Arrow({direction='right'}){return <span aria-hidden="true" className="arrow-symbol">{direction==='right'?'↗':'↘'}</span>}
function Export({rows}){
  function download(){
    const blob=new Blob([rowsCSV(rows)],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='france-electricite-2024-selection.csv';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <button className="export-command" type="button" disabled={!rows.length} onClick={download}>Exporter les données <span aria-hidden="true">↓</span></button>;
}
function DateField({label,value,min,max,onChange}){
 return <label className="date-control"><span>{label}</span><input aria-label={label} type="date" value={value} min={min} max={max} onChange={event=>onChange(event.target.value)}/></label>;
}
function StatStrip({data,scopeLabel}){
 const items=[
  ['Consommation',twh(data.consommation_mwh)+' TWh'],
  ['Production étudiée',twh(data.production_mwh)+' TWh'],
  ['Énergies renouvelables',twh(data.renouvelables_mwh)+' TWh'],
  ['Part renouvelable',pct(data.part_renouvelables,2)]
 ];
 return <section aria-label={'Indicateurs — '+scopeLabel} className="stat-strip">{items.map(([name,value])=><div key={name} className="stat-item"><span>{name}</span><strong>{value}</strong></div>)}</section>;
}
function Heading({kicker,children,aside}){
 return <div className="section-heading"><div><div className="section-kicker">{kicker}</div><h2>{children}</h2></div>{aside&&<div className="section-aside">{aside}</div>}</div>;
}
function colorFrom(value,max){
 if(!value||max<=0)return MAP_COLORS[0];
 const index=Math.max(0,Math.min(MAP_COLORS.length-1,Math.floor((value/max)*MAP_COLORS.length)));
 return MAP_COLORS[index];
}
function MapFigure({regionData,selected,onSelect,metric,onMetricChange,activeMetric='production_mwh',metricLabel='',mode='standard'}){
 const regionMap=Object.fromEntries(regionData.map(r=>[r.code,r]));
 const max=Math.max(1,...regionData.map(r=>r[metric]||0));
 const isProduction=metric!=='consommation_mwh';
 return <section className={'geography geography-'+mode}>
   <Heading counter="01" kicker="Lecture du territoire"
     aside={<div className="plain-switch" aria-label="Indicateur cartographique">{[['production_mwh','Production'],['consommation_mwh','Consommation']].map(([value,label])=><button key={value} aria-pressed={activeMetric===value} onClick={()=>onMetricChange(value)} className={activeMetric===value?'is-current':''}>{label}</button>)}</div>}>
     {metricLabel||(isProduction?'Production par région':'Consommation par région')}
   </Heading>
   <div className="map-subtitle">Période filtrée · volumes agrégés (TWh)</div>
   <div className="map-layout">
    <svg className="france-map" viewBox={regionsGeo.viewBox} role="group" aria-label="Carte interactive des douze régions : choisissez une région pour afficher ses données">
     {regionsGeo.regions.map(region=>{
       const item=regionMap[region.code];
       const val=item?.[metric]||0;
       const active=selected===region.code;
       return <g key={region.code} className={active?'map-area is-selected':'map-area'}>
        <path d={region.d} fill={colorFrom(val,max)} fillRule="evenodd" stroke="#ffffff" strokeWidth={active?2.4:1.3} strokeLinejoin="round"
         tabIndex={0} role="button" aria-pressed={active} aria-label={region.name+' : '+twh(val,2)+' TWh'}
         onClick={()=>onSelect(active?'all':region.code)}
         onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(active?'all':region.code)}}}>
         <title>{region.name} — {twh(val,2)} TWh</title>
        </path>
        {region.short&&<text className={'map-label '+(val/max>.62?'map-label-on-dark':'')} x={region.center[0]} y={region.center[1]} textAnchor="middle" dominantBaseline="middle">{region.short}</text>}
        {active&&<circle className="selected-dot" cx={region.center[0]} cy={region.center[1]+12} r="3.4"/>}
       </g>
     })}
    </svg>
    <div className="map-scale"><div className="map-gradient" aria-hidden="true">{MAP_COLORS.map(c=><span key={c} style={{background:c}}/>)}</div><div className="map-scale-text"><span>0 TWh</span><span>{twh(max,2)} TWh</span></div></div>
   </div>
   <div className="map-instruction">Sélectionnez une région sur la carte pour afficher ses résultats.</div>
 </section>;
}
function SourceList({summary,compact=false,selectedKey='all',onSelect}){
 const max=Math.max(1,...ENERGY_FIELDS.map(f=>summary[f.key]||0));
 return <div className={compact?'source-list compact':'source-list'}>{ENERGY_FIELDS.map(f=>{
 const value=summary[f.key]||0;
 return <div key={f.key} className={"source-line"+(selectedKey===f.key?" is-focused":"")}>
  {onSelect?<button type="button" className="source-name source-button" aria-pressed={selectedKey===f.key} onClick={()=>onSelect(selectedKey===f.key?"all":f.key)}><i style={{background:f.color}}/>{f.name}</button>:<span className="source-name"><i style={{background:f.color}}/>{f.name}</span>}
  <span className="source-track"><span style={{width:(value/max*100)+'%',background:f.color}}/></span>
  <strong>{twh(value,2)}</strong><small>TWh</small>
 </div>})}</div>;
}
function TerritoryInspector({summary,selected,regions,onReset,focusKey='all',onFocusChange,heading='Lecture régionale'}){
 const scope=regions.find(r=>r.code_insee_region===selected);
 return <aside className="territory-inspector" aria-label="Détail du territoire">
   <Heading counter="02" kicker={heading} aside={scope?<button className="plain-link" onClick={onReset}>Effacer la sélection ×</button>:null}>{scope?.region||'La France, en détail'}</Heading>
   <div className="inspector-description">{scope?'Résultats agrégés de la région sélectionnée':'Les six filières électriques de notre périmètre RTE.'}</div>
   {scope&&<div className="inspector-figures inspector-figures-region">
    <div><span>Production</span><strong>{twh(summary.production_mwh,2)}</strong><small>TWh</small></div>
    <div><span>Consommation</span><strong>{twh(summary.consommation_mwh,2)}</strong><small>TWh</small></div>
    <div><span>Renouvelable</span><strong>{pct(summary.part_renouvelables,1)}</strong></div>
   </div>}
   <div className="rule"/>
   <div className="inspector-subheading">Production par filière <span>TWh</span></div>
   <SourceList summary={summary} selectedKey={focusKey} onSelect={onFocusChange}/>
   <div className="inspector-footnote">Six filières étudiées · part renouvelable rapportée à leur production cumulée.</div>
 </aside>;
}
function LineChart({series,large=false,focusKey='all'}){
 const [index,setIndex]=useState(null);
 const W=1150,H=large?360:180,left=49,right=17,top=18,bottom=25;
 const values=series.flatMap(r=>[r.production_mwh,r.consommation_mwh]).map(v=>v/1e6);
 const max=Math.max(.2,...values)*1.1,iw=W-left-right,ih=H-top-bottom;
 const x=i=>left+(series.length<=1?iw/2:i/(series.length-1)*iw),y=v=>top+ih-(v/1e6)/max*ih;
 const path=key=>series.map((r,i)=>(i===0?'M':'L')+x(i).toFixed(1)+' '+y(r[key]).toFixed(1)).join(' ');
 const chosen=index===null?null:series[index];
 const focus=ENERGY_FIELDS.find(f=>f.key===focusKey);
 return <div className="curve-wrap"><svg className={large?'curve-plot curve-large':'curve-plot'} viewBox={'0 0 '+W+' '+H} role="img" aria-label="Consommation et production électriques quotidiennes en TWh">
   {Array.from({length:5},(_,i)=>{const v=max*i/4;return <g key={i}><line x1={left} x2={W-right} y1={top+ih*(1-i/4)} y2={top+ih*(1-i/4)} stroke="#dfe3e8" strokeWidth="1"/><text x={left-10} y={top+ih*(1-i/4)+4} fill="#7c8793" textAnchor="end" fontSize="12">{frenchNumber(v,1)}</text></g>})}
   {series.length>0&&<><path d={path('production_mwh')} stroke="#286ec2" fill="none" strokeWidth="2.4" vectorEffect="non-scaling-stroke"/><path d={path('consommation_mwh')} stroke="#e37b68" fill="none" strokeWidth="2.2" vectorEffect="non-scaling-stroke"/>{focus&&<path d={path(focus.key)} stroke={focus.color} fill="none" strokeWidth="3" strokeDasharray="7 4" vectorEffect="non-scaling-stroke"/>}</>}
   {series.length===1&&<g aria-hidden="true"><circle cx={x(0)} cy={y(series[0].production_mwh)} r="5" fill="#286ec2" stroke="#fff" strokeWidth="1.5"/><circle cx={x(0)} cy={y(series[0].consommation_mwh)} r="5" fill="#e37b68" stroke="#fff" strokeWidth="1.5"/>{focus&&<circle cx={x(0)} cy={y(series[0][focus.key])} r="5" fill={focus.color} stroke="#fff" strokeWidth="1.5"/>}</g>}
   {series.filter((_,i)=>i%Math.max(1,Math.ceil(series.length/7))===0||i===series.length-1).map(r=><text key={r.date} x={x(series.indexOf(r))} y={H-8} fontSize="12" fill="#85909d" textAnchor="middle">{formatDate(r.date)}</text>)}
   {chosen&&<g><line x1={x(index)} x2={x(index)} y1={top} y2={top+ih} stroke="#6b7481" strokeDasharray="4 5"/><circle cx={x(index)} cy={y(chosen.production_mwh)} r="4" fill="#286ec2"/><circle cx={x(index)} cy={y(chosen.consommation_mwh)} r="4" fill="#e37b68"/>{focus&&<circle cx={x(index)} cy={y(chosen[focus.key])} r="4" fill={focus.color}/>}</g>}
   <rect x={left} y={top} width={iw} height={ih} fill="transparent" onMouseMove={e=>{if(!series.length)return;const box=e.currentTarget.getBoundingClientRect();const f=(e.clientX-box.left)/box.width;setIndex(Math.max(0,Math.min(series.length-1,Math.round(f*(series.length-1)))));}} onMouseLeave={()=>setIndex(null)}/>
  </svg>{chosen&&<div className="curve-tooltip"><strong>{formatDate(chosen.date)}</strong><span>Production · {twh(chosen.production_mwh,3)} TWh</span><span>Consommation · {twh(chosen.consommation_mwh,3)} TWh</span>{focus&&<span>{focus.name} · {twh(chosen[focus.key],3)} TWh</span>}</div>}</div>;
}
function TrendSection({daily,large=false,focusKey='all'}){
 const periodCaption=daily.length?(daily.length===1?formatDate(daily[0].date):formatDate(daily[0].date)+' – '+formatDate(daily[daily.length-1].date))+' 2024':'Aucune donnée';
 return <section className="time-series">
   <Heading counter={large?'01':'03'} kicker="Série temporelle" aside={<div className="line-legend"><span><i className="legend-production"/>Production étudiée</span><span><i className="legend-consumption"/>Consommation</span>{ENERGY_FIELDS.filter(f=>f.key===focusKey).map(f=><span key={f.key}><i style={{background:f.color}}/>{f.name}</span>)}</div>}>
    Production et consommation au fil des jours
   </Heading>
   <div className="chart-unit">TWh par jour · {periodCaption}</div>
   <LineChart series={daily} large={large} focusKey={focusKey}/>
 </section>;
}
function RegionTable({allRegions,selected,onSelect,focusKey='all'}){
 const [order,setOrder]=useState('production_mwh');
 const focus=ENERGY_FIELDS.find(f=>f.key===focusKey);
 const activeOrder=['production_mwh','consommation_mwh','renouvelables_mwh',focusKey].includes(order)?order:'production_mwh';
 const rows=[...allRegions].sort((a,b)=>b[activeOrder]-a[activeOrder]);
 return <section className="ranking"><Heading counter="02" kicker="Comparaison"
  aside={<label className="table-sort">Classer par <select value={activeOrder} onChange={e=>setOrder(e.target.value)}><option value="production_mwh">Production</option><option value="consommation_mwh">Consommation</option><option value="renouvelables_mwh">Renouvelables</option>{focus&&<option value={focus.key}>{focus.name}</option>}</select></label>}>Les régions en chiffres</Heading>
 <div className="table-viewport" role="region" aria-label="Classement des régions" tabIndex={0}><table><thead><tr><th>Région</th><th>Production (TWh)</th><th>Consommation (TWh)</th><th>Renouvelables (%)</th>{focus&&<th>{focus.name} (TWh)</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.code} className={selected===r.code?'is-selected':''} onClick={()=>onSelect(r.code)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(r.code)}}} tabIndex={0} aria-label={'Sélectionner '+r.region}><th>{r.region}</th><td>{twh(r.production_mwh)}</td><td>{twh(r.consommation_mwh)}</td><td>{pct(r.part_renouvelables)}</td>{focus&&<td>{twh(r[focus.key])}</td>}</tr>)}</tbody></table></div>
 </section>;
}
function StackedChart({daily,focusKey='all'}){
 const W=1000,H=295,left=44,right=24,top=24,bottom=35;
 const width=W-left-right,height=H-top-bottom;
 const max=Math.max(1,...daily.map(r=>r.production_mwh))/1e6*1.08;
 const barWidth=daily.length?Math.min(22,width/daily.length*.72):20;
 return <svg className="stacked-chart" viewBox={'0 0 '+W+' '+H} aria-label="Production électrique quotidienne par filière, en TWh" role="img">
  {Array.from({length:5},(_,i)=><g key={i}><line x1={left} x2={W-right} y1={top+height*(1-i/4)} y2={top+height*(1-i/4)} stroke="#dce2ea"/><text x={left-9} y={top+height*(1-i/4)+3} fill="#7f8994" fontSize="11" textAnchor="end">{frenchNumber(max*i/4,1)}</text></g>)}
  {daily.map((r,i)=>{let y=top+height;const cx=left+(i+.5)*width/Math.max(daily.length,1);return <g key={r.date}>{ENERGY_FIELDS.map(f=>{const h=(r[f.key]/1e6)/max*height;y-=h;return <rect key={f.key} x={cx-barWidth/2} y={y} width={barWidth} height={Math.max(0,h)} fill={f.color} opacity={focusKey==='all'||focusKey===f.key?1:.24}><title>{formatDate(r.date)} — {f.name} : {twh(r[f.key],3)} TWh</title></rect>})}{(i%Math.max(1,Math.ceil(daily.length/8))===0||i===daily.length-1)&&<text x={cx} y={H-9} fontSize="11" textAnchor="middle" fill="#778390">{formatDate(r.date)}</text>}</g>})}
 </svg>;
}
function Methodology(){
 return <article className="methodology"><Heading counter="05" kicker="Transparence">Méthode et sources</Heading><p className="method-intro">Cette interface explore les données énergétiques françaises du 1ᵉʳ au 31 janvier 2024, agrégées depuis les relevés régionaux définitifs de RTE / ODRÉ. Les chiffres sont figés : il ne s’agit pas d’un flux en temps réel.</p>
 <div className="method-steps">
  <section><span>01</span><div><h3>Données publiques</h3><p>ÉCO2mix régional définitif ; 12 régions de France métropolitaine, hors Corse, selon le périmètre effectivement couvert dans le projet. Relevés toutes les 30 minutes.</p><a href={SOURCE_URL} target="_blank" rel="noreferrer">Source officielle RTE ↗</a></div></section>
  <section><span>02</span><div><h3>Databricks et PySpark</h3><p>17 856 relevés demi-horaires lus depuis un CSV (Bronze logique, non persisté en Delta), nettoyés en Silver Delta, puis agrégés en 372 lignes Gold (31 jours × 12 régions). Les trois exports Gold servent aussi au modèle Power BI.</p><a href={REPO+'/tree/main/notebooks'} target="_blank" rel="noreferrer">Notebooks ↗</a></div></section>
  <section><span>03</span><div><h3>Définitions des indicateurs</h3><p>Production étudiée = nucléaire + hydraulique + éolien + solaire + thermique + bioénergies. Renouvelables = hydraulique + éolien + solaire + bioénergies. Les puissances demi-horaires ont été converties en MWh avant agrégation.</p><a href={REPO+'/tree/main/powerbi'} target="_blank" rel="noreferrer">Modèle Power BI ↗</a></div></section>
  <section><span>04</span><div><h3>Limites</h3><p>La différence entre production étudiée et consommation ne représente pas un solde net d’exportation. Les échanges, le pompage et les mécanismes d’équilibrage ne font pas partie de ce calcul.</p></div></section>
 </div>
 <p className="legal-note">Données : RTE / ODRÉ, Licence Ouverte 2.0. Contours géographiques : IGN Admin Express, via france-geojson (Licence Ouverte 2.0).</p></article>
}

function InsightStrip({items}){
 return <section className="insights-strip" aria-label="Constats calculés sur la sélection">
  <div className="insights-intro"><span className="section-kicker">Lecture des données</span><strong>Ce que montre la sélection</strong><small>Constats recalculés, sans prédiction</small></div>
  {items.map(item=><div className="insight-item" key={item.id}><span>{item.label}</span><strong>{item.id==='peak'&&item.value!=='—'?formatDate(item.value):item.value}</strong><small>{item.detail}</small></div>)}
 </section>;
}
function MixExplorer({summary,focusKey,onFocusChange}){
 const focus=ENERGY_FIELDS.find(f=>f.key===focusKey);
 return <section className="mix-explorer" id="filieres">
  <Heading kicker="Structure de production" aside={<button className="plain-link" type="button" disabled={!focus} onClick={()=>onFocusChange('all')}>Toutes les filières {focus?'×':''}</button>}>Le mix des six filières</Heading>
  <p className="panel-intro">Choisissez une filière : la carte en mode Production, la courbe et les comparaisons s'adaptent. La consommation et les totaux restent inchangés.</p>
  <div className="strip-mix" role="group" aria-label="Sélectionner une filière">
   {ENERGY_FIELDS.map(f=><button type="button" key={f.key} className={focusKey===f.key?'mix-segment active':'mix-segment'} style={{width:(summary.production_mwh?summary[f.key]/summary.production_mwh*100:0)+'%',background:f.color,opacity:focusKey==='all'||focusKey===f.key?1:.28}} title={f.name+' : '+twh(summary[f.key],2)+' TWh'} aria-label={f.name+' : '+twh(summary[f.key],2)+' TWh'} aria-pressed={focusKey===f.key} onClick={()=>onFocusChange(focusKey===f.key?'all':f.key)}/>)}
  </div>
  <SourceList summary={summary} selectedKey={focusKey} onSelect={onFocusChange}/>
  <p className="scope-note">{focus?'Filière active : '+focus.name+'. Les indicateurs globaux restent calculés sur les six filières.':'Production étudiée : six filières. Sélectionnez une source pour explorer son empreinte géographique et temporelle.'}</p>
 </section>;
}
function ComparePanel({regions,focusKey,firstCode,secondCode,onFirst,onSecond}){
 const focus=ENERGY_FIELDS.find(f=>f.key===focusKey);
 const key=focus?.key||'production_mwh';
 const a=regions.find(r=>r.code===firstCode);
 const b=regions.find(r=>r.code===secondCode);
 const valid=a&&b&&a.code!==b.code;
 const difference=valid?a[key]-b[key]:null;
 const comparisonMetrics=[
  {key, label:focus?'Production · '+focus.name:'Production étudiée',type:'twh'},
  {key:'consommation_mwh',label:'Consommation',type:'twh'},
  {key:'part_renouvelables',label:'Part renouvelable',type:'percent'}
 ];
 return <section className="compare-panel" aria-label="Comparaison de deux régions">
  <div className="compare-title"><span className="section-kicker">Face à face</span><h3>Comparer deux territoires</h3><p>{focus?'Production de '+focus.name.toLowerCase():'Production étudiée, six filières'} · période commune</p></div>
  <div className="compare-selectors">
   <label>Région A<select aria-label="Première région à comparer" value={firstCode} onChange={e=>onFirst(e.target.value)}>{regions.map(r=><option key={r.code} value={r.code}>{r.region}</option>)}</select></label>
   <span aria-hidden="true" className="compare-vs">vs</span>
   <label>Région B<select aria-label="Seconde région à comparer" value={secondCode} onChange={e=>onSecond(e.target.value)}>{regions.map(r=><option key={r.code} value={r.code}>{r.region}</option>)}</select></label>
  </div>
  {valid?<div className="compare-values"><div><span>A</span><strong>{twh(a[key],2)} <small>TWh</small></strong></div><div><span>B</span><strong>{twh(b[key],2)} <small>TWh</small></strong></div><div><span>Écart A − B</span><strong>{difference>0?'+':''}{twh(difference,2)} <small>TWh</small></strong></div></div>:<p className="compare-empty">Sélectionnez deux régions différentes pour calculer l'écart.</p>}
  {valid&&<div className="compare-breakdown" aria-label="Indicateurs comparés entre deux régions">
   <div className="compare-breakdown-title"><span>Lecture croisée</span><span className="compare-key"><i className="compare-color-a"/> A <i className="compare-color-b"/> B</span></div>
   {comparisonMetrics.map(metric=>{
    const valueA=a[metric.key]||0,valueB=b[metric.key]||0,maxValue=Math.max(valueA,valueB,1);
    const formatted=value=>metric.type==='percent'?pct(value,1):twh(value,2)+' TWh';
    return <div className="compare-metric" key={metric.key}>
     <strong>{metric.label}</strong>
     <div className="compare-pair">
      <div className="compare-meter"><span className="compare-meter-label">A</span><span className="compare-meter-track"><span className="compare-meter-fill a" style={{width:valueA/maxValue*100+'%'}}/></span><small>{formatted(valueA)}</small></div>
      <div className="compare-meter"><span className="compare-meter-label">B</span><span className="compare-meter-track"><span className="compare-meter-fill b" style={{width:valueB/maxValue*100+'%'}}/></span><small>{formatted(valueB)}</small></div>
     </div>
    </div>;
   })}
  </div>}
  <p className="scope-note">Volumes absolus, sans normalisation par population ou superficie. Les écarts ne mesurent pas des échanges entre régions.</p>
 </section>;
}
function DetailData({daily,focusKey,observations}){
 const focus=ENERGY_FIELDS.find(f=>f.key===focusKey);
 return <details open className="disclosure-block" id="donnees">
  <summary><span><strong>Données journalières</strong><small>{daily.length} jour(s) dans la sélection · tableau et décomposition</small></span><span aria-hidden="true">+</span></summary>
  <div className="disclosure-content">
   <div className="table-viewport" role="region" aria-label="Tableau de données journalières" tabIndex={0}><table className="daily-table"><thead><tr><th>Date</th><th>Production étudiée (TWh)</th><th>Consommation (TWh)</th><th>Renouvelables (TWh)</th>{focus&&<th>{focus.name} (TWh)</th>}</tr></thead><tbody>{daily.map(r=><tr key={r.date}><th>{formatDate(r.date)}</th><td>{twh(r.production_mwh,3)}</td><td>{twh(r.consommation_mwh,3)}</td><td>{twh(r.renouvelables_mwh,3)}</td>{focus&&<td>{twh(r[focus.key],3)}</td>}</tr>)}</tbody></table></div>
   <div className="detail-stack"><h3>Évolution quotidienne des six filières</h3><StackedChart daily={daily} focusKey={focusKey}/></div>
   <p className="scope-note">Le CSV exporté contient les mesures Gold par jour et région, pour les six filières, même lorsqu'une filière est mise en évidence à l'écran.</p>
  </div>
 </details>;
}
function DataLineage(){
 return <section className="lineage" id="tracabilite">
  <div className="lineage-heading"><div><span className="section-kicker">Projet DATA · de la source à l'analyse</span><h2>Une chaîne de données reproductible</h2></div><a href={REPO} target="_blank" rel="noreferrer">Dépôt et livrables ↗</a></div>
  <div className="lineage-flow" aria-label="Chaîne de traitement du projet">
   <div><span>01 · Source</span><strong>RTE / ODRÉ</strong><small>17 856 relevés · 30 min</small></div>
   <div><span>02 · Bronze logique</span><strong>CSV brut</strong><small>Lecture dans Databricks</small></div>
   <div><span>03 · Silver</span><strong>PySpark · Delta</strong><small>Nettoyage et contrôles</small></div>
   <div><span>04 · Gold</span><strong>372 jours-régions</strong><small>Faits + deux dimensions</small></div>
   <div><span>05 · Restitution</span><strong>Power BI + Web</strong><small>SQL · DAX · React</small></div>
  </div>
  <p className="scope-note">Technologies réellement utilisées : Databricks Free Edition, PySpark, Delta Lake, SQL, Power BI (PBIP / TMDL / DAX) et React. Microsoft Fabric n'a pas été utilisé.</p>
  <div className="lineage-links"><a href={REPO+'/tree/main/notebooks'} target="_blank" rel="noreferrer">Notebooks ↗</a><a href={REPO+'/tree/main/sql'} target="_blank" rel="noreferrer">Requêtes SQL ↗</a><a href={REPO+'/tree/main/powerbi'} target="_blank" rel="noreferrer">Rapport Power BI ↗</a><a href={REPO+'/blob/main/docs/architecture.md'} target="_blank" rel="noreferrer">Architecture ↗</a></div>

 </section>;
}

/* V5 — a recruiter-first analytical showcase. All metrics use the same Gold facts. */
function V5Mix({summary,focusKey,onSelect}){
 const total=summary.production_mwh;
 const focus=ENERGY_FIELDS.find(field=>field.key===focusKey);
 return <section className="v5-mix" aria-label="Mix électrique interactif">
  <div className="v5-panel-title">
   <div><span className="v5-kicker">Six filières</span><h2>Mix de production</h2></div>
   {focus&&<button type="button" className="v5-subtle-action" onClick={()=>onSelect('all')}>Effacer ×</button>}
  </div>
  <div className="v5-mix-strip" role="group" aria-label="Sélectionner une filière énergétique">
   {ENERGY_FIELDS.map(field=><button
    type="button" key={field.key} title={field.name+' · '+twh(summary[field.key],2)+' TWh'}
    style={{flexGrow:Math.max(summary[field.key]/(total||1)*100,0.2),background:field.color,opacity:focusKey==='all'||focusKey===field.key?1:.28}}
    onClick={()=>onSelect(focusKey===field.key?'all':field.key)}
    aria-pressed={focusKey===field.key}
    aria-label={'Afficher '+field.name+' dans la carte et la courbe'}
   />)}
  </div>
  <div className="v5-mix-list">
   {ENERGY_FIELDS.map(field=>{
    const fraction=total?summary[field.key]/total*100:0;
    return <button type="button" key={field.key}
     className={'v5-mix-row'+(focusKey===field.key?' is-selected':'')}
     aria-pressed={focusKey===field.key}
     onClick={()=>onSelect(focusKey===field.key?'all':field.key)}>
     <span className="v5-mix-name"><i style={{background:field.color}}/>{field.name}</span>
     <span className="v5-mix-bar"><span style={{width:fraction+'%',background:field.color}}/></span>
     <strong>{twh(summary[field.key],2)} <small>TWh</small></strong>
     <span className="v5-mix-pct">{frenchNumber(fraction,1)} %</span>
    </button>;
   })}
  </div>
  <div className="v5-panel-hint">{focus?focus.name+' · mis en évidence sur la carte et la courbe':'Sélectionnez une filière pour l’isoler visuellement'}</div>
 </section>;
}
function V5Compare({regions,focusKey,firstCode,secondCode,onFirst,onSecond,onDetails}){
 const source=ENERGY_FIELDS.find(f=>f.key===focusKey);
 const key=source?.key||'production_mwh';
 const a=regions.find(r=>r.code===firstCode);
 const b=regions.find(r=>r.code===secondCode);
 const valid=Boolean(a&&b&&a.code!==b.code);
 const valueA=valid?a[key]:0,valueB=valid?b[key]:0;
 const max=Math.max(valueA,valueB,1);
 const diff=valueA-valueB;
 return <section className="v5-compare" aria-label="Comparer deux régions">
  <div className="v5-panel-title">
   <div><span className="v5-kicker">Même période · deux régions</span><h2>Face à face</h2></div>
   <button className="v5-subtle-action" type="button" onClick={onDetails}>12 régions ↗</button>
  </div>
  <div className="v5-compare-select">
   <label><span>Région A</span><select aria-label="Première région" value={firstCode} onChange={e=>onFirst(e.target.value)}>{regions.map(r=><option key={r.code} value={r.code}>{r.region}</option>)}</select></label>
   <span className="v5-vs" aria-hidden="true">vs</span>
   <label><span>Région B</span><select aria-label="Deuxième région" value={secondCode} onChange={e=>onSecond(e.target.value)}>{regions.map(r=><option key={r.code} value={r.code}>{r.region}</option>)}</select></label>
  </div>
  {valid?<div className="v5-compare-data">
    <div className="v5-compare-amounts"><div><small>A</small><strong>{twh(valueA,2)} <span>TWh</span></strong></div><div><small>B</small><strong>{twh(valueB,2)} <span>TWh</span></strong></div><div><small>Écart A − B</small><strong className="v5-diff">{diff>0?'+':''}{twh(diff,2)} <span>TWh</span></strong></div></div>
    <div className="v5-paired-bars" aria-label="Volumes relatifs">
     <span className="v5-paired-bar"><span style={{width:100*valueA/max+'%',background:'#376fc3'}}/></span>
     <span className="v5-paired-bar"><span style={{width:100*valueB/max+'%',background:'#48acb8'}}/></span>
    </div>
   </div>:<p className="v5-no-compare">Sélectionnez deux régions distinctes.</p>}
  <div className="v5-panel-hint">{source?'Production '+source.name.toLowerCase():'Production des six filières'} · volumes comparables</div>
 </section>;
}
function V5Pipeline({onOpen}){
 const stages=[{title:'RTE / ODRÉ',meta:'17 856 relevés'},{title:'Databricks',meta:'PySpark · Delta'},{title:'Gold / SQL',meta:'372 jours-régions'},{title:'Power BI + Web',meta:'Restitution'}];
 return <section className="v5-pipeline" aria-label="Chaîne de traitement des données">
  <span className="v5-pipeline-label">Du brut à l'analyse</span>
  <div className="v5-pipeline-stages">{stages.map((stage,i)=><React.Fragment key={stage.title}>
   {i>0&&<span className="v5-pipeline-arrow" aria-hidden="true">→</span>}
   <div className="v5-pipeline-stage"><strong>{stage.title}</strong><small>{stage.meta}</small></div>
  </React.Fragment>)}</div>
  <button type="button" className="v5-subtle-action v5-pipeline-action" onClick={onOpen}>Voir la chaîne ↗</button>
 </section>;
}
function App(){
 const [data,setData]=useState(null),[error,setError]=useState('');
 const [drawer,setDrawer]=useState('');
 const [scope,setScope]=useState('all'),[mapMetric,setMapMetric]=useState('production_mwh'),[focusKey,setFocusKey]=useState('all');
 const [start,setStart]=useState('2024-01-01'),[end,setEnd]=useState('2024-01-31');
 const [compareA,setCompareA]=useState(''),[compareB,setCompareB]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  Promise.all(['fact_energie.csv','dim_region.csv','dim_date.csv'].map(file=>fetch('/data/'+file,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('Le fichier '+file+' est indisponible.');return r.text()})))
    .then(([facts,regions,dates])=>setData(loadGoldFacts(facts,regions,dates)))
    .catch(e=>{if(e.name!=='AbortError')setError(e.message)});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  if(!drawer)return undefined;
  const onKey=event=>{if(event.key==='Escape')setDrawer('')};
  document.addEventListener('keydown',onKey);
  return()=>document.removeEventListener('keydown',onKey);
 },[drawer]);
 const all=data?.rows||[];
 const periodFacts=useMemo(()=>selectFacts(all,{start,end}),[all,start,end]);
 const selected=useMemo(()=>selectFacts(periodFacts,{region:scope}),[periodFacts,scope]);
 const totals=useMemo(()=>summarize(selected),[selected]);
 const allRegionSummaries=useMemo(()=>byRegion(periodFacts),[periodFacts]);
 const daily=useMemo(()=>byDate(selected),[selected]);
 const focus=ENERGY_FIELDS.find(f=>f.key===focusKey);
 const mapField=mapMetric==='production_mwh'&&focus?focus.key:mapMetric;
 const mapLabel=mapMetric==='consommation_mwh'?'Consommation par région':focus?'Production '+focus.name.toLowerCase()+' par région':'Production par région';
 const name=scope==='all'?'France · 12 régions':(data?.regions.find(r=>r.code_insee_region===scope)?.region||'Région');
 const sortedRegions=useMemo(()=>[...allRegionSummaries].sort((a,b)=>b.production_mwh-a.production_mwh),[allRegionSummaries]);
 const firstCode=compareA||sortedRegions[0]?.code||'';
 const secondCode=compareB||sortedRegions.find(r=>r.code!==firstCode)?.code||'';
 const chooseFirst=code=>{setCompareA(code);if(code===secondCode)setCompareB(sortedRegions.find(r=>r.code!==code)?.code||'')};
 const chooseSecond=code=>{setCompareB(code);if(code===firstCode)setCompareA(sortedRegions.find(r=>r.code!==code)?.code||'')};
 const reset=()=>{setScope('all');setStart('2024-01-01');setEnd('2024-01-31');setFocusKey('all');setMapMetric('production_mwh');setCompareA('');setCompareB('')};
 const activeFilters=scope!=='all'||start!=='2024-01-01'||end!=='2024-01-31'||focusKey!=='all';
 const peak=useMemo(()=>[...daily].sort((a,b)=>b.production_mwh-a.production_mwh)[0]||null,[daily]);
 return <div className="workspace-shell cockpit-v4 cockpit-v42 cockpit-v5">
  <header className="work-toolbar v5-header">
   <div className="v5-brand"><strong>France <span>/</span> Électricité</strong><small>Projet DATA · janvier 2024</small></div>
   <span className="v5-stack">Databricks <i/> SQL <i/> Power BI <i/> React</span>
   <div className="v5-header-actions">
    <a href={REPO} target="_blank" rel="noreferrer">GitHub ↗</a>
    <a href={REPO+'/tree/main/powerbi'} target="_blank" rel="noreferrer">Modèle Power BI ↗</a>
    <button className="v5-header-data" type="button" onClick={()=>setDrawer('donnees')}>Données ↓</button>
    <Export rows={selected}/>
   </div>
  </header>
  <main className="work-body v5-body">
   {error?<div role="alert" className="load-status"><h1>Chargement impossible</h1><p>{error}</p></div>:!data?<div role="status" className="load-status">Chargement du jeu Gold…</div>:<>
    <section className="v5-hero">
     <div className="v5-hero-copy">
      <span className="v5-kicker">Janvier 2024 · 12 régions · 6 filières</span>
      <h1>L’électricité française, décryptée.</h1>
     </div>
     <div className="v5-controls">
      <label className="v5-region-control"><span>Territoire</span><select aria-label="Territoire étudié" value={scope} onChange={e=>setScope(e.target.value)}><option value="all">France · 12 régions</option>{data.regions.map(r=><option key={r.code_insee_region} value={r.code_insee_region}>{r.region}</option>)}</select></label>
      <div className="v5-date-controls"><DateField label="Du" value={start} min="2024-01-01" max={end} onChange={setStart}/><DateField label="Au" value={end} min={start} max="2024-01-31" onChange={setEnd}/></div>
      {activeFilters&&<button type="button" className="v5-reset" onClick={reset} title="Réinitialiser les filtres">↺ <span>Effacer</span></button>}
     </div>
    </section>
    <StatStrip data={totals} scopeLabel={name}/>
    <div className="v5-main">
     <div className="v5-map">
      <MapFigure regionData={allRegionSummaries} selected={scope} onSelect={setScope} metric={mapField} activeMetric={mapMetric} metricLabel={mapLabel} onMetricChange={setMapMetric}/>
     </div>
     <V5Mix summary={totals} focusKey={focusKey} onSelect={setFocusKey}/>
    </div>
    <div className="v5-lower">
     <div className="v5-trend">
      <TrendSection daily={daily} focusKey={focusKey}/>
      {peak&&<span className="v5-peak" title="Maximum journalier de la production étudiée dans la sélection">Pic {formatDate(peak.date)} · {twh(peak.production_mwh,3)} TWh</span>}
     </div>
     <V5Compare regions={sortedRegions} focusKey={focusKey} firstCode={firstCode} secondCode={secondCode} onFirst={chooseFirst} onSecond={chooseSecond} onDetails={()=>setDrawer('regions')}/>
    </div>
    <V5Pipeline onOpen={()=>setDrawer('pipeline')}/>
    <footer className="v5-footer">
     <span>Données RTE / ODRÉ · janvier 2024 uniquement · 12 régions hors Corse</span>
     <div><button type="button" onClick={()=>setDrawer('methode')}>Méthode et limites ↗</button><span aria-hidden="true">·</span><button type="button" onClick={()=>setDrawer('donnees')}>Données détaillées ↗</button></div>
    </footer>
   </>}
  </main>
  {drawer&&data&&<div className="drawer-layer">
   <button type="button" className="drawer-backdrop" aria-label="Fermer le panneau" onClick={()=>setDrawer('')}/>
   <aside className="data-drawer" role="dialog" aria-modal="true" aria-label={{donnees:'Données journalières',methode:'Méthode et limites',regions:'Comparaison des régions',pipeline:'Chaîne des données'}[drawer]}>
    <div className="drawer-header"><div><span className="v5-kicker">France Électricité · 2024</span><h2>{{donnees:'Données Gold',methode:'Méthode & limites',regions:'Les 12 régions',pipeline:'Chaîne DATA'}[drawer]}</h2></div><button type="button" className="drawer-close" autoFocus onClick={()=>setDrawer('')} aria-label="Fermer le panneau">✕</button></div>
    <div className="drawer-content">
     {drawer==='donnees'&&<DetailData daily={daily} focusKey={focusKey}/>}
     {drawer==='methode'&&<Methodology/>}
     {drawer==='regions'&&<><p className="v5-drawer-intro">Sélectionnez une région pour actualiser tous les indicateurs du cockpit.</p><RegionTable allRegions={allRegionSummaries} selected={scope} onSelect={code=>{setScope(code);setDrawer('')}} focusKey={focusKey}/></>}
     {drawer==='pipeline'&&<DataLineage/>}
    </div>
   </aside>
  </div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
