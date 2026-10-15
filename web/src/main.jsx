import React, {useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import regionsGeo from './regions-outline.json';
import {
  ENERGY_FIELDS, SOURCE_URL, loadGoldFacts, selectFacts, summarize, byDate, byRegion,
  twh, pct, frenchNumber, rowsCSV
} from './metrics.js';
import './workspace.css';

const REPO='https://github.com/sogoyou8/france-electricite-fabric-powerbi';
const NAV=[['overview','Synthèse'],['territories','Territoires'],['sources','Filières'],['timeline','Chronologie'],['method','Méthode']];
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
function Heading({counter,kicker,children,aside}){
 return <div className="section-heading"><div><div className="section-kicker">{counter&&<span>{counter} / </span>}{kicker}</div><h2>{children}</h2></div>{aside&&<div className="section-aside">{aside}</div>}</div>;
}
function colorFrom(value,max){
 if(!value||max<=0)return MAP_COLORS[0];
 const index=Math.max(0,Math.min(MAP_COLORS.length-1,Math.floor((value/max)*MAP_COLORS.length)));
 return MAP_COLORS[index];
}
function MapFigure({regionData,selected,onSelect,metric,onMetricChange,mode='standard'}){
 const regionMap=Object.fromEntries(regionData.map(r=>[r.code,r]));
 const max=Math.max(1,...regionData.map(r=>r[metric]||0));
 const isProduction=metric==='production_mwh';
 return <section className={'geography geography-'+mode}>
   <Heading counter="01" kicker="Lecture du territoire"
     aside={<div className="plain-switch" aria-label="Indicateur cartographique">{[['production_mwh','Production'],['consommation_mwh','Consommation']].map(([value,label])=><button key={value} aria-pressed={metric===value} onClick={()=>onMetricChange(value)} className={metric===value?'is-current':''}>{label}</button>)}</div>}>
     {isProduction?'Production par région':'Consommation par région'}
   </Heading>
   <div className="map-subtitle">Janvier 2024 · données agrégées (TWh)</div>
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
function SourceList({summary,compact=false}){
 const max=Math.max(1,...ENERGY_FIELDS.map(f=>summary[f.key]||0));
 return <div className={compact?'source-list compact':'source-list'}>{ENERGY_FIELDS.map(f=>{
 const value=summary[f.key]||0;
 return <div key={f.key} className="source-line">
  <span className="source-name"><i style={{background:f.color}}/>{f.name}</span>
  <span className="source-track"><span style={{width:(value/max*100)+'%',background:f.color}}/></span>
  <strong>{twh(value,2)}</strong><small>TWh</small>
 </div>})}</div>;
}
function TerritoryInspector({summary,selected,regions,onReset,heading='Lecture régionale'}){
 const scope=regions.find(r=>r.code_insee_region===selected);
 return <aside className="territory-inspector" aria-label="Détail du territoire">
   <Heading counter="02" kicker={heading} aside={scope?<button className="plain-link" onClick={onReset}>Effacer la sélection ×</button>:null}>{scope?.region||'La France, en détail'}</Heading>
   <div className="inspector-description">{scope?'Résultats agrégés de la région sélectionnée':'Les six filières électriques de notre périmètre RTE.'}</div>
   <div className="inspector-figures">
    <div><span>Production</span><strong>{twh(summary.production_mwh,2)}</strong><small>TWh</small></div>
    <div><span>Consommation</span><strong>{twh(summary.consommation_mwh,2)}</strong><small>TWh</small></div>
    <div><span>Renouvelable</span><strong>{pct(summary.part_renouvelables,1)}</strong></div>
   </div>
   <div className="rule"/>
   <div className="inspector-subheading">Production par filière <span>TWh</span></div>
   <SourceList summary={summary}/>
   <div className="inspector-footnote">Six filières étudiées · part renouvelable rapportée à leur production cumulée.</div>
 </aside>;
}
function LineChart({series,large=false}){
 const [index,setIndex]=useState(null);
 const W=1150,H=large?360:224,left=49,right=17,top=22,bottom=33;
 const values=series.flatMap(r=>[r.production_mwh,r.consommation_mwh]).map(v=>v/1e6);
 const max=Math.max(.2,...values)*1.1,iw=W-left-right,ih=H-top-bottom;
 const x=i=>left+(series.length<=1?iw/2:i/(series.length-1)*iw),y=v=>top+ih-(v/1e6)/max*ih;
 const path=key=>series.map((r,i)=>(i===0?'M':'L')+x(i).toFixed(1)+' '+y(r[key]).toFixed(1)).join(' ');
 const chosen=index===null?null:series[index];
 return <div className="curve-wrap"><svg className={large?'curve-plot curve-large':'curve-plot'} viewBox={'0 0 '+W+' '+H} role="img" aria-label="Consommation et production électriques quotidiennes en TWh">
   {Array.from({length:5},(_,i)=>{const v=max*i/4;return <g key={i}><line x1={left} x2={W-right} y1={top+ih*(1-i/4)} y2={top+ih*(1-i/4)} stroke="#dfe3e8" strokeWidth="1"/><text x={left-10} y={top+ih*(1-i/4)+4} fill="#7c8793" textAnchor="end" fontSize="12">{frenchNumber(v,1)}</text></g>})}
   {series.length>0&&<><path d={path('production_mwh')} stroke="#286ec2" fill="none" strokeWidth="2.4" vectorEffect="non-scaling-stroke"/><path d={path('consommation_mwh')} stroke="#e37b68" fill="none" strokeWidth="2.2" vectorEffect="non-scaling-stroke"/></>}
   {series.filter((_,i)=>i%Math.max(1,Math.ceil(series.length/7))===0||i===series.length-1).map(r=><text key={r.date} x={x(series.indexOf(r))} y={H-8} fontSize="12" fill="#85909d" textAnchor="middle">{formatDate(r.date)}</text>)}
   {chosen&&<g><line x1={x(index)} x2={x(index)} y1={top} y2={top+ih} stroke="#6b7481" strokeDasharray="4 5"/><circle cx={x(index)} cy={y(chosen.production_mwh)} r="4" fill="#286ec2"/><circle cx={x(index)} cy={y(chosen.consommation_mwh)} r="4" fill="#e37b68"/></g>}
   <rect x={left} y={top} width={iw} height={ih} fill="transparent" onMouseMove={e=>{if(!series.length)return;const box=e.currentTarget.getBoundingClientRect();const f=(e.clientX-box.left)/box.width;setIndex(Math.max(0,Math.min(series.length-1,Math.round(f*(series.length-1)))));}} onMouseLeave={()=>setIndex(null)}/>
  </svg>{chosen&&<div className="curve-tooltip"><strong>{formatDate(chosen.date)}</strong><span>Production · {twh(chosen.production_mwh,3)} TWh</span><span>Consommation · {twh(chosen.consommation_mwh,3)} TWh</span></div>}</div>;
}
function TrendSection({daily,large=false}){
 return <section className="time-series">
   <Heading counter={large?'01':'03'} kicker="Série temporelle" aside={<div className="line-legend"><span><i className="legend-production"/>Production étudiée</span><span><i className="legend-consumption"/>Consommation</span></div>}>
    Production et consommation au fil des jours
   </Heading>
   <div className="chart-unit">TWh par jour · 01–31 janvier 2024</div>
   <LineChart series={daily} large={large}/>
 </section>;
}
function RegionTable({allRegions,selected,onSelect}){
 const [order,setOrder]=useState('production_mwh');
 const rows=[...allRegions].sort((a,b)=>b[order]-a[order]);
 return <section className="ranking"><Heading counter="02" kicker="Comparaison"
  aside={<label className="table-sort">Classer par <select value={order} onChange={e=>setOrder(e.target.value)}><option value="production_mwh">Production</option><option value="consommation_mwh">Consommation</option><option value="renouvelables_mwh">Renouvelables</option></select></label>}>Les régions en chiffres</Heading>
 <table><thead><tr><th>Région</th><th>Production (TWh)</th><th>Consommation (TWh)</th><th>Renouvelables (%)</th></tr></thead><tbody>{rows.map(r=><tr key={r.code} className={selected===r.code?'is-selected':''} onClick={()=>onSelect(r.code)} onKeyDown={e=>{if(e.key==='Enter')onSelect(r.code)}} tabIndex={0} aria-label={'Sélectionner '+r.region}><th>{r.region}</th><td>{twh(r.production_mwh)}</td><td>{twh(r.consommation_mwh)}</td><td>{pct(r.part_renouvelables)}</td></tr>)}</tbody></table>
 </section>;
}
function StackedChart({daily}){
 const W=1000,H=295,left=44,right=24,top=24,bottom=35;
 const width=W-left-right,height=H-top-bottom;
 const max=Math.max(1,...daily.map(r=>r.production_mwh))/1e6*1.08;
 const barWidth=daily.length?Math.min(22,width/daily.length*.72):20;
 return <svg className="stacked-chart" viewBox={'0 0 '+W+' '+H} aria-label="Production électrique quotidienne par filière, en TWh" role="img">
  {Array.from({length:5},(_,i)=><g key={i}><line x1={left} x2={W-right} y1={top+height*(1-i/4)} y2={top+height*(1-i/4)} stroke="#dce2ea"/><text x={left-9} y={top+height*(1-i/4)+3} fill="#7f8994" fontSize="11" textAnchor="end">{frenchNumber(max*i/4,1)}</text></g>)}
  {daily.map((r,i)=>{let y=top+height;const cx=left+(i+.5)*width/Math.max(daily.length,1);return <g key={r.date}>{ENERGY_FIELDS.map(f=>{const h=(r[f.key]/1e6)/max*height;y-=h;return <rect key={f.key} x={cx-barWidth/2} y={y} width={barWidth} height={Math.max(0,h)} fill={f.color}><title>{formatDate(r.date)} — {f.name} : {twh(r[f.key],3)} TWh</title></rect>})}{(i%Math.max(1,Math.ceil(daily.length/8))===0||i===daily.length-1)&&<text x={cx} y={H-9} fontSize="11" textAnchor="middle" fill="#778390">{formatDate(r.date)}</text>}</g>})}
 </svg>;
}
function Methodology(){
 return <article className="methodology"><Heading counter="05" kicker="Transparence">Méthode et sources</Heading><p className="method-intro">Cette interface explore les données énergétiques françaises du 1ᵉʳ au 31 janvier 2024, agrégées depuis les relevés régionaux définitifs de RTE / ODRÉ. Les chiffres sont figés : il ne s’agit pas d’un flux en temps réel.</p>
 <div className="method-steps">
  <section><span>01</span><div><h3>Données publiques</h3><p>ÉCO2mix régional définitif ; 12 régions de France métropolitaine, hors Corse, selon le périmètre effectivement couvert dans le projet. Relevés toutes les 30 minutes.</p><a href={SOURCE_URL} target="_blank" rel="noreferrer">Source officielle RTE ↗</a></div></section>
  <section><span>02</span><div><h3>Databricks et PySpark</h3><p>17 856 observations importées en Bronze, nettoyées en Silver, puis transformées en 372 lignes Gold (31 jours × 12 régions). Les trois exports Gold alimentent également Power BI.</p><a href={REPO+'/tree/main/notebooks'} target="_blank" rel="noreferrer">Notebooks ↗</a></div></section>
  <section><span>03</span><div><h3>Définitions des indicateurs</h3><p>Production étudiée = nucléaire + hydraulique + éolien + solaire + thermique + bioénergies. Renouvelables = hydraulique + éolien + solaire + bioénergies. Les puissances demi-horaires ont été converties en MWh avant agrégation.</p><a href={REPO+'/tree/main/powerbi'} target="_blank" rel="noreferrer">Modèle Power BI ↗</a></div></section>
  <section><span>04</span><div><h3>Limites</h3><p>La différence entre production étudiée et consommation ne représente pas un solde net d’exportation. Les échanges, le pompage et les mécanismes d’équilibrage ne font pas partie de ce calcul.</p></div></section>
 </div>
 <p className="legal-note">Données : RTE / ODRÉ, Licence Ouverte 2.0. Contours géographiques : IGN Admin Express, via france-geojson (Licence Ouverte 2.0).</p></article>
}
function App(){
 const [data,setData]=useState(null),[error,setError]=useState('');
 const [tab,setTab]=useState('overview'),[scope,setScope]=useState('all'),[mapMetric,setMapMetric]=useState('production_mwh');
 const [start,setStart]=useState('2024-01-01'),[end,setEnd]=useState('2024-01-31');
 useEffect(()=>{
  const controller=new AbortController();
  Promise.all(['fact_energie.csv','dim_region.csv'].map(file=>fetch('/data/'+file,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('Le fichier '+file+' est indisponible.');return r.text()})))
    .then(([facts,regions])=>setData(loadGoldFacts(facts,regions)))
    .catch(e=>{if(e.name!=='AbortError')setError(e.message)});
  return()=>controller.abort();
 },[]);
 const all=data?.rows||[];
 const periodFacts=useMemo(()=>selectFacts(all,{start,end}),[all,start,end]);
 const selected=useMemo(()=>selectFacts(all,{region:scope,start,end}),[all,scope,start,end]);
 const totals=useMemo(()=>summarize(selected),[selected]);
 const allRegionSummaries=useMemo(()=>byRegion(periodFacts),[periodFacts]);
 const daily=useMemo(()=>byDate(selected),[selected]);
 const name=scope==='all'?'France — 12 régions':(data?.regions.find(r=>r.code_insee_region===scope)?.region||'Région');
 const reset=()=>{setScope('all');setStart('2024-01-01');setEnd('2024-01-31')};
 const navigate=name=>{setTab(name);window.scrollTo({top:0,behavior:'smooth'})};
 return <div className="workspace-shell">
  <header className="work-toolbar">
    <div className="work-ident"><strong>France <span>/</span> Électricité</strong><small>Étude · janvier 2024</small></div>
    <nav className="work-nav" aria-label="Navigation analytique">{NAV.map(([key,label])=><button type="button" className={tab===key?'current':''} key={key} aria-current={tab===key?'page':undefined} onClick={()=>navigate(key)}>{label}</button>)}</nav>
    <div className="toolbar-actions">
      <div className="toolbar-dates"><DateField label="Du" value={start} min="2024-01-01" max={end} onChange={setStart}/><DateField label="Au" value={end} min={start} max="2024-01-31" onChange={setEnd}/></div>
      <Export rows={selected}/>
    </div>
  </header>
  <main className="work-body">
   {error?<div role="alert" className="load-status"><h1>Chargement impossible</h1><p>{error}</p></div>:!data?<div role="status" className="load-status">Préparation des données RTE…</div>:<>
     {tab!=='method'&&<div className="context-strip">
      <div><span className="subtle-eyebrow">RTE / éCO2mix • 2024</span><h1>{tab==='overview'?'L’électricité, territoire par territoire.':NAV.find(([k])=>k===tab)?.[1]}</h1></div>
      <div className="context-scope"><label>Zone étudiée <select value={scope} onChange={e=>setScope(e.target.value)}><option value="all">France · 12 régions</option>{data.regions.map(r=><option key={r.code_insee_region} value={r.code_insee_region}>{r.region}</option>)}</select></label><button onClick={reset}>Réinitialiser</button></div>
     </div>}
     {tab!=='method'&&<StatStrip data={totals} scopeLabel={name}/>}
     {tab==='overview'&&<div className="overview"><div className="main-split"><MapFigure regionData={allRegionSummaries} selected={scope} onSelect={setScope} metric={mapMetric} onMetricChange={setMapMetric}/><TerritoryInspector summary={totals} selected={scope} regions={data.regions} onReset={()=>setScope('all')}/></div><TrendSection daily={daily}/></div>}
     {tab==='territories'&&<div className="territories-view"><div className="main-split"><MapFigure regionData={allRegionSummaries} selected={scope} onSelect={setScope} metric={mapMetric} onMetricChange={setMapMetric}/><TerritoryInspector summary={totals} selected={scope} regions={data.regions} onReset={()=>setScope('all')}/></div><RegionTable allRegions={allRegionSummaries} selected={scope} onSelect={setScope}/></div>}
     {tab==='sources'&&<div className="sources-view"><div className="sources-intro"><Heading counter="01" kicker="Structure de la production">De quoi est composée notre électricité ?</Heading><p>Six filières, calculées sur le périmètre de données sélectionné. Les couleurs identifient les sources et ne représentent pas une échelle de performance.</p></div><div className="sources-layout"><div><h3>Part dans la production étudiée</h3><div className="strip-mix">{ENERGY_FIELDS.map(f=><div key={f.key} style={{width:(totals.production_mwh?totals[f.key]/totals.production_mwh*100:0)+'%',background:f.color}}><title>{f.name} — {twh(totals[f.key],2)} TWh</title></div>)}</div><SourceList summary={totals}/></div><aside className="sources-highlight"><span>Production totale</span><strong>{twh(totals.production_mwh)}</strong><small>TWh</small><span>Renouvelables</span><strong>{pct(totals.part_renouvelables,2)}</strong></aside></div><section className="time-series"><Heading counter="02" kicker="Évolution des filières">Production quotidienne par source</Heading><StackedChart daily={daily}/></section></div>}
     {tab==='timeline'&&<div className="timeline-view"><TrendSection daily={daily} large/><section className="timeline-table"><Heading counter="02" kicker="Données journalières">Mesures de la période</Heading><table><thead><tr><th>Jour</th><th>Production (TWh)</th><th>Consommation (TWh)</th><th>Écart étudié (TWh)</th></tr></thead><tbody>{daily.map(d=><tr key={d.date}><th>{formatDate(d.date)}</th><td>{twh(d.production_mwh,3)}</td><td>{twh(d.consommation_mwh,3)}</td><td>{twh(d.production_mwh-d.consommation_mwh,3)}</td></tr>)}</tbody></table></section></div>}
     {tab==='method'&&<Methodology/>}
     <footer className="workspace-footer"><span>RTE / ODRÉ · éCO2mix · janvier 2024 · {selected.length} jours-régions affichés</span><span><a href={regionsGeo.source} target="_blank" rel="noreferrer">Cartographie IGN / france-geojson</a><span aria-hidden="true"> · </span><a href={REPO} target="_blank" rel="noreferrer">Code et Power BI ↗</a></span></footer>
   </>}
  </main>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
