
import React, {useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ENERGY_FIELDS,SOURCE_URL,loadGoldFacts,selectFacts,summarize,byDate,byRegion,energyMix,twh,pct,frenchNumber,rowsCSV} from './metrics.js';
import './style.css';

const REPO='https://github.com/sogoyou8/france-electricite-fabric-powerbi';
const nav=[
  ['overview','Vue d’ensemble','grid'],
  ['consumption','Consommation','trend'],
  ['production','Mix énergétique','layers'],
  ['regions','Analyse régionale','map'],
  ['method','Méthodologie','book'],
];
const icons={
 grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 trend:'M3 17l6-6 4 4 8-9M16 6h5v5',
 layers:'M12 3 2 9l10 6 10-6-10-6ZM2 13l10 6 10-6M2 17l10 6 10-6',
 map:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15',
 book:'M4 4h14a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2V6a2 2 0 0 1 2-2ZM6 8h10M6 12h9',
 filter:'M3 5h18M6 12h12M10 19h4',
 reset:'M3 12a9 9 0 1 0 3-7M3 4v6h6',
 download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
 arrow:'M4 12h16m-6-6 6 6-6 6',
 external:'M14 4h6v6m0-6-9 9M20 14v6H4V4h6',
 info:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 10v6M12 6h.01',
 bolt:'m13 2-9 12h7l-1 8 10-12h-7l1-8',
 calendar:'M8 2v4m8-4v4M3 9h18M3 5h18v16H3z',
 chevron:'m6 9 6 6 6-6',
 menu:'M3 6h18M3 12h18M3 18h18',
 close:'M4 4l16 16M20 4L4 20'
};
function Icon({name,size=18}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]||icons.grid}/></svg>;
}
function dateLabel(date,withMonth=true){
 const day=Number(date?.slice(-2)||1);
 return withMonth?day+' janv.':String(day).padStart(2,'0');
}
function Legend({items}){
 return <div className="legend">{items.map(item=><span className="legend-item" key={item.name}><i style={{background:item.color}}/>{item.name}</span>)}</div>;
}
function Card({children,className='',...props}){return <section className={'surface '+className} {...props}>{children}</section>;}
function SectionTitle({eyebrow,title,aside}){return <div className="section-head"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{aside}</div>;}
function Metric({label,value,unit,detail,accent,icon}){
 return <Card className="metric-card"><div className="metric-top"><span>{label}</span><span className={'metric-symbol '+(accent||'')}><Icon name={icon||'trend'} size={17}/></span></div><div className="metric-number">{value}<small>{unit}</small></div><p>{detail}</p></Card>;
}
function TrendChart({series,expanded=false}){
 const [hovered,setHovered]=useState(null);
 const WIDTH=850,HEIGHT=expanded?316:243,left=54,right=18,top=20,bottom=41;
 const max=Math.max(0.1,...series.map(x=>Math.max(x.production_mwh,x.consommation_mwh)/1e6))*1.14;
 const innerW=WIDTH-left-right,innerH=HEIGHT-top-bottom;
 const x=i=>left+(series.length>1?(i/(series.length-1))*innerW:innerW/2);
 const y=value=>top+innerH-Math.max(0,value/1e6)/max*innerH;
 const mkPath=(key)=>series.map((p,i)=>(i?'L':'M')+x(i).toFixed(2)+' '+y(p[key]).toFixed(2)).join(' ');
 const ticks=[0,.25,.5,.75,1];
 const h=hovered!=null?series[hovered]:null;
 return <div className={'chart-area '+(expanded?'chart-expanded':'')}>
    <div className="chart-legend"><Legend items={[{name:'Consommation',color:'#4c9aff'},{name:'Production',color:'#a39aff'}]}/><span className="unit-note">Énergie • TWh / jour</span></div>
    <div className="graph-wrap">
     <svg className="trend-plot" viewBox={'0 0 '+WIDTH+' '+HEIGHT} role="img" aria-label="Évolution quotidienne de la consommation et de la production électrique, en TWh">
      <defs><linearGradient id="areaCons" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3188ff" stopOpacity=".25"/><stop offset="100%" stopColor="#3188ff" stopOpacity="0"/></linearGradient></defs>
      {ticks.map(f=><g key={f}><line x1={left} x2={WIDTH-right} y1={top+innerH*(1-f)} y2={top+innerH*(1-f)} stroke="#33415b" strokeOpacity=".58" strokeDasharray="4 7"/><text x={left-12} y={top+innerH*(1-f)+5} fill="#7c8ba7" fontSize="12" textAnchor="end">{(max*f).toFixed(1).replace('.',',')}</text></g>)}
      {series.length>1&&<path d={mkPath('consommation_mwh')+' L '+x(series.length-1)+' '+(top+innerH)+' L '+x(0)+' '+(top+innerH)+' Z'} fill="url(#areaCons)"/>}
      {series.length>0&&<><path d={mkPath('production_mwh')} fill="none" stroke="#a39aff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><path d={mkPath('consommation_mwh')} fill="none" stroke="#4897ff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/></>}
      {series.filter((_,i)=>i%Math.max(1,Math.ceil(series.length/7))===0||i===series.length-1).map(p=><text key={p.date} x={x(series.indexOf(p))} y={HEIGHT-10} fontSize="12" fill="#8a98b2" textAnchor="middle">{dateLabel(p.date)}</text>)}
      {h&&<g><line x1={x(hovered)} x2={x(hovered)} y1={top} y2={top+innerH} stroke="#90a4ce" strokeDasharray="3 5"/><circle cx={x(hovered)} cy={y(h.consommation_mwh)} r="5" fill="#4897ff" stroke="#10182a" strokeWidth="3"/><circle cx={x(hovered)} cy={y(h.production_mwh)} r="5" fill="#a39aff" stroke="#10182a" strokeWidth="3"/></g>}
      <rect x={left} y={top} width={innerW} height={innerH} fill="transparent" onMouseMove={e=>{const rect=e.currentTarget.getBoundingClientRect();const fraction=(e.clientX-rect.left)/rect.width;setHovered(Math.max(0,Math.min(series.length-1,Math.round(fraction*(series.length-1)))));}} onMouseLeave={()=>setHovered(null)}/>
     </svg>
     {h&&<div className="chart-tooltip"><strong>{dateLabel(h.date)}</strong><span>Consommation <b>{twh(h.consommation_mwh,3)} TWh</b></span><span>Production <b>{twh(h.production_mwh,3)} TWh</b></span></div>}
    </div>
 </div>;
}
function MixChart({summary,expanded=false}){
 const slices=energyMix(summary),total=summary.production_mwh;
 let cumulative=0;
 const circumference=2*Math.PI*76;
 return <div className={'mix-layout '+(expanded?'mix-expanded':'')}>
  <div className="donut-wrap"><svg viewBox="0 0 220 220" className="donut" role="img" aria-label="Répartition des six filières électriques">
   <circle cx="110" cy="110" r="76" fill="none" stroke="#223049" strokeWidth="25"/>
   {slices.map(slice=>{const length=total?slice.mwh/total*circumference:0;const start=cumulative;cumulative+=length;return <circle key={slice.key} cx="110" cy="110" r="76" fill="none" stroke={slice.color} strokeWidth="25" strokeDasharray={length+' '+(circumference-length)} strokeDashoffset={-start} transform="rotate(-90 110 110)"/>;})}
   <text x="110" y="105" textAnchor="middle" fill="#f3f6ff" fontSize="30" fontWeight="700">{twh(total)}</text><text x="110" y="129" textAnchor="middle" fill="#8c9ab4" fontSize="12">TWh produits</text>
  </svg></div>
  <div className="mix-legend">{slices.map(s=><div className="mix-line" key={s.key}><div className="mix-name"><i style={{background:s.color}}/>{s.name}</div><div className="mix-value">{twh(s.mwh)} <span>TWh</span><strong>{pct(s.percent,1)}</strong></div></div>)}</div>
 </div>;
}
function RegionChart({regions,kind='consommation_mwh',limit=12,onChoose}){
 const sorted=[...regions].sort((a,b)=>b[kind]-a[kind]),list=sorted.slice(0,limit),max=Math.max(...list.map(r=>r[kind]),1);
 return <div className="regions-bars">{list.map((r,i)=><button key={r.code} className="region-row" onClick={()=>onChoose(r.code)} title={'Filtrer : '+r.region}>
  <span className="region-rank">{String(i+1).padStart(2,'0')}</span>
  <span className="region-name">{r.region}</span>
  <span className="region-track"><span style={{width:Math.max(1,r[kind]/max*100)+'%'}}/></span>
  <span className="region-value">{twh(r[kind],2)}</span>
 </button>)}{!list.length&&<p className="empty">Aucune région sur cette période.</p>}</div>;
}
function Insight({title,children}){return <div className="insight"><span className="insight-dot"/><div><strong>{title}</strong><p>{children}</p></div></div>;}
function DownloadButton({rows}){
 const download=()=>{
  const csv=rowsCSV(rows),blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='france-electricite-2024-selection.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return <button onClick={download} className="button button-soft"><Icon name="download" size={16}/>Exporter le CSV</button>;
}
function App(){
 const [dataset,setDataset]=useState(null),[error,setError]=useState(null),[view,setView]=useState('overview'),[menuOpen,setMenuOpen]=useState(false);
 const [region,setRegion]=useState('all'),[start,setStart]=useState('2024-01-01'),[end,setEnd]=useState('2024-01-31'),[rankMetric,setRankMetric]=useState('consommation_mwh');
 useEffect(()=>{
  const controller=new AbortController();
  Promise.all(['fact_energie.csv','dim_region.csv'].map(name=>fetch(import.meta.env.BASE_URL+'data/'+name,{signal:controller.signal}).then(resp=>{if(!resp.ok)throw new Error('Export manquant : '+name);return resp.text();})))
   .then(([facts,regions])=>setDataset(loadGoldFacts(facts,regions)))
   .catch(e=>{if(e.name!=='AbortError')setError(e.message)});
  return()=>controller.abort();
 },[]);
 const facts=dataset?.rows||[];
 const selected=useMemo(()=>selectFacts(facts,{region,start,end}),[facts,region,start,end]);
 const summary=useMemo(()=>summarize(selected),[selected]);
 const dates=useMemo(()=>byDate(selected),[selected]);
 const regional=useMemo(()=>byRegion(selected),[selected]);
 const allRegions=dataset?.regions||[];
 const reset=()=>{setRegion('all');setStart('2024-01-01');setEnd('2024-01-31');};
 const switchView=v=>{setView(v);setMenuOpen(false);};
 const title=nav.find(x=>x[0]===view)?.[1]||'Vue d’ensemble';
 const chooseRegion=code=>{setRegion(code);setView('regions');};
 const peak=dates.reduce((best,day)=>!best||day.consommation_mwh>best.consommation_mwh?day:best,null);
 const normalized=summary.consommation_mwh>0?summary.production_mwh/summary.consommation_mwh:0;
 return <div className="app-shell">
  {menuOpen&&<button aria-label="Fermer le menu" className="mobile-overlay" onClick={()=>setMenuOpen(false)}/>}
  <aside className={'sidebar '+(menuOpen?'sidebar-open':'')}>
   <div className="brand"><div className="brand-mark"><Icon name="bolt" size={22}/></div><div><div className="brand-word">ÉLECTRICITÉ<span> / FRANCE</span></div><div className="brand-sub">DATA EXPLORER · 2024</div></div></div>
   <div className="side-divider"/>
   <div className="side-section-label">EXPLORATION</div>
   <nav aria-label="Navigation principale" className="side-nav">{nav.map(([id,label,icon])=><button key={id} onClick={()=>switchView(id)} aria-current={view===id?'page':undefined} className={'side-link '+(view===id?'active':'')}><Icon name={icon} size={19}/><span>{label}</span>{view===id&&<i/>}</button>)}</nav>
   <div className="sidebar-bottom"><div className="data-origin"><span className="data-state"><b/></span><strong>Jeu de données vérifié</strong><small>RTE / éCO2mix · janvier 2024</small><small>372 observations Gold</small></div><a className="github-side" href={REPO} target="_blank" rel="noreferrer"><span>Code source GitHub</span><Icon name="external" size={16}/></a></div>
  </aside>
  <main className="workspace">
   <header className="topbar"><div className="breadcrumb"><button className="menu-trigger" onClick={()=>setMenuOpen(true)} aria-label="Ouvrir le menu"><Icon name="menu"/></button><span>ABYSS / DATA LAB</span><Icon name="chevron" size={14}/><strong>{title}</strong></div><div className="top-right"><span className="top-dataset"><span className="live-dot"/>DATASET CERTIFIÉ • EXPORT GOLD</span><a href={REPO} target="_blank" rel="noreferrer" className="top-github">GitHub <Icon name="external" size={15}/></a></div></header>
   <div className="work-scroll">
    <div className="hero-block"><div><div className="eyebrow"><span className="eyebrow-line"/>ANALYSE ÉNERGÉTIQUE · FRANCE MÉTROPOLITAINE</div><h1>{view==='overview'?<>La France, <em>en énergie.</em></>:title}</h1><p>{view==='method'?'Comprendre les sources, les calculs et les limites de cette étude.':'Explorez la consommation et la production électrique régionales. Une analyse réelle construite avec Databricks, SQL et Power BI.'}</p></div><div className="hero-period"><Icon name="calendar" size={18}/><span>PÉRIODE ÉTUDIÉE<strong>01 — 31 JANVIER 2024</strong></span></div></div>
    <div className="filterbar"><div className="filter-label"><Icon name="filter" size={16}/> FILTRES</div><label>Région<select value={region} onChange={e=>setRegion(e.target.value)}><option value="all">Toutes les régions (12)</option>{allRegions.map(r=><option value={r.code_insee_region} key={r.code_insee_region}>{r.region}</option>)}</select></label><label>Du<input type="date" value={start} min="2024-01-01" max={end} onChange={e=>setStart(e.target.value)}/></label><label>Au<input type="date" value={end} min={start} max="2024-01-31" onChange={e=>setEnd(e.target.value)}/></label><button onClick={reset} className="reset-btn" aria-label="Réinitialiser les filtres" title="Réinitialiser les filtres"><Icon name="reset" size={17}/></button><DownloadButton rows={selected}/></div>
    {error?<Card className="error-card"><h2>Données indisponibles</h2><p>{error}</p><a href={REPO}>Consulter la source GitHub</a></Card>:!dataset?<div className="loader"><span className="loading-circle"/>Chargement des exports Gold RTE…</div>:<>
      {view==='overview'&&<>
       <div className="metrics-grid">
        <Metric label="Consommation totale" value={twh(summary.consommation_mwh)} unit="TWh" detail="Énergie consommée sur la période" icon="trend" accent="blue"/>
        <Metric label="Production étudiée" value={twh(summary.production_mwh)} unit="TWh" detail="Somme des six filières retenues" icon="bolt" accent="violet"/>
        <Metric label="Part renouvelable" value={pct(summary.part_renouvelables,2)} detail="Hydro · éolien · solaire · bioénergies" icon="layers" accent="cyan"/>
        <Metric label="Ratio production / conso." value={pct(summary.couverture_pct,2)} detail="Indicateur agrégé, non instantané" icon="map" accent="green"/>
       </div>
       <div className="dashboard-grid">
        <Card className="trend-card"><SectionTitle eyebrow="01 / ÉVOLUTION" title="La dynamique énergétique" aside={<span className="subtle-pill">{dates.length} jours</span>}/><TrendChart series={dates}/></Card>
        <Card className="mix-card"><SectionTitle eyebrow="02 / PRODUCTION" title="Le mix énergétique" aside={<span className="subtle-pill">6 filières</span>}/><MixChart summary={summary}/></Card>
       </div>
       <div className="dashboard-bottom"><Card className="bottom-region"><SectionTitle eyebrow="03 / TERRITOIRES" title="Consommation par région" aside={<button className="text-button" onClick={()=>switchView('regions')}>Voir les régions <Icon name="arrow" size={14}/></button>}/><RegionChart regions={regional} kind="consommation_mwh" limit={5} onChoose={chooseRegion}/></Card><Card className="bottom-note"><SectionTitle eyebrow="LECTURE / MÉTIER" title="À retenir"/><Insight title={pct(summary.part_renouvelables,1)+' de renouvelables'}>Sur la production étudiée, pour la sélection en cours.</Insight><Insight title={normalized>=1?'Production supérieure à la consommation':'Consommation supérieure à la production'}>Le ratio agrégé ne mesure ni les échanges, ni l'équilibre électrique instantané.</Insight><button className="text-button method-link" onClick={()=>switchView('method')}>Voir la méthodologie <Icon name="arrow" size={14}/></button></Card></div>
      </>}
      {view==='consumption'&&<>
        <div className="metrics-grid metrics-three">
         <Metric label="Consommation" value={twh(summary.consommation_mwh)} unit="TWh" detail="Périmètre sélectionné" accent="blue"/>
         <Metric label="Moyenne quotidienne" value={twh(summary.consommation_mwh/Math.max(dates.length,1),3)} unit="TWh" detail="Sur les jours sélectionnés" icon="calendar" accent="cyan"/>
         <Metric label="Pic journalier" value={peak?twh(peak.consommation_mwh,3):'—'} unit="TWh" detail={peak?'Le '+dateLabel(peak.date):'Aucune donnée'} icon="trend" accent="violet"/>
        </div>
        <div className="page-grid"><Card className="wide-card"><SectionTitle eyebrow="CONSOMMATION / 2024-01" title="Courbes quotidiennes"/><TrendChart series={dates} expanded/></Card><Card className="ranking-card"><SectionTitle eyebrow="CLASSEMENT" title="Régions consommatrices"/><RegionChart regions={regional} kind="consommation_mwh" onChoose={chooseRegion}/></Card></div>
      </>}
      {view==='production'&&<>
       <div className="metrics-grid metrics-three"><Metric label="Production étudiée" value={twh(summary.production_mwh)} unit="TWh" detail="Nucléaire, thermique et renouvelables" accent="violet" icon="bolt"/><Metric label="Production nucléaire" value={twh(summary.nucleaire_mwh)} unit="TWh" detail="Six filières au total" accent="blue" icon="layers"/><Metric label="Production renouvelable" value={twh(summary.renouvelables_mwh)} unit="TWh" detail={pct(summary.part_renouvelables,2)+' de la production'} accent="cyan" icon="trend"/></div>
       <div className="page-grid"><Card className="wide-card"><SectionTitle eyebrow="SOURCES / ÉNERGIE" title="Répartition de la production"/><MixChart summary={summary} expanded/></Card><Card className="ranking-card"><SectionTitle eyebrow="CLASSEMENT" title="Régions productrices"/><RegionChart regions={regional} kind="production_mwh" onChoose={chooseRegion}/></Card></div>
      </>}
      {view==='regions'&&<>
       <div className="metrics-grid metrics-three"><Metric label="Régions dans la sélection" value={String(regional.length).padStart(2,'0')} detail="France métropolitaine : 12 au total" accent="blue" icon="map"/><Metric label="Consommation régionale" value={twh(summary.consommation_mwh)} unit="TWh" detail="Total de la sélection" accent="cyan"/><Metric label="Production régionale" value={twh(summary.production_mwh)} unit="TWh" detail="Total des six filières" accent="violet"/></div>
       <div className="page-grid"><Card className="wide-card"><SectionTitle eyebrow="COMPARAISON / RÉGIONS" title="Les territoires en chiffres" aside={<select className="sort-select" aria-label="Classer les régions" value={rankMetric} onChange={e=>setRankMetric(e.target.value)}><option value="consommation_mwh">Trier : consommation</option><option value="production_mwh">Trier : production</option><option value="renouvelables_mwh">Trier : renouvelables</option></select>}/><RegionChart regions={regional} kind={rankMetric} onChoose={chooseRegion}/></Card><Card className="ranking-card region-details"><SectionTitle eyebrow="STRUCTURE / FILIÈRES" title="Production de la sélection"/><MixChart summary={summary}/><div className="region-helper"><Icon name="info" size={16}/> Cliquez sur une région pour isoler son profil.</div></Card></div>
      </>}
      {view==='method'&&<>
        <div className="method-grid">
         <Card className="method-card"><div className="method-idx">01 / SOURCE</div><h2>RTE · éCO2mix</h2><p>Données régionales consolidées et définitives, du 1er au 31 janvier 2024. Douze régions métropolitaines, mesures à la demi-heure.</p><a className="text-button" target="_blank" rel="noreferrer" href={SOURCE_URL}>Consulter les données RTE <Icon name="external" size={15}/></a></Card>
         <Card className="method-card"><div className="method-idx">02 / TRANSFORMATION</div><h2>Databricks + PySpark</h2><p>17 856 relevés bruts → typage/nettoyage Silver → 372 agrégations Gold par jour et par région, avec deux tables de dimensions.</p><a className="text-button" target="_blank" rel="noreferrer" href={REPO+'/tree/main/notebooks'}>Voir les notebooks <Icon name="external" size={15}/></a></Card>
         <Card className="method-card"><div className="method-idx">03 / ANALYSE</div><h2>SQL + Power BI</h2><p>Six filières, consommation, production, part renouvelable, comparaison régionale. Le rapport Power BI original et ses douze mesures DAX sont publiés sur GitHub.</p><a className="text-button" target="_blank" rel="noreferrer" href={REPO+'/tree/main/powerbi'}>Voir le modèle BI <Icon name="external" size={15}/></a></Card>
        </div>
        <Card className="formula-card"><SectionTitle eyebrow="TRANSPARENCE" title="Définitions des indicateurs"/><div className="formula-grid"><div><strong>Énergie journalière</strong><code>MWh = Σ (MW × 0,5 h)</code><span>Conversion des puissances demi-horaires, dans Databricks.</span></div><div><strong>Part renouvelable</strong><code>(Hydro + Éolien + Solaire + Bio) ÷ Production</code><span>Part dans les six filières étudiées.</span></div><div><strong>Ratio production / conso.</strong><code>Production ÷ Consommation × 100</code><span>Ratio agrégé : pas un équilibre instantané.</span></div></div></Card>
        <div className="notice"><Icon name="info" size={19}/><p><strong>Limite de l'étude.</strong> Les échanges transfrontaliers, le pompage et d'autres mécanismes d'équilibrage ne sont pas analysés ici. Les données de l'application proviennent des exports Gold figés, et non d'une connexion temps réel à RTE. Données d'origine sous Licence Ouverte 2.0.</p></div>
      </>}
      <div className="footer-note"><span>RTE / ODRE · éCO2mix régionales · Janvier 2024</span><span>Projet Data Analyst · Databricks → Power BI → Vercel</span><a href={REPO} target="_blank" rel="noreferrer">Méthodes et sources <Icon name="external" size={12}/></a></div>
     </>}
   </div>
  </main>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
