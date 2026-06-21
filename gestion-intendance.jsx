import { useState, useEffect, useRef } from 'react';

// ─── Tokens ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'gestion-v8';
const PAPER  = '#F4EFE4';
const CARD   = '#FBF8F1';
const INK    = '#2B2824';
const LINE   = '#D9D0C0';
const MUTED  = '#8A8070';
const WARN   = '#B5482A';
const OK     = '#5C7A4A';
const BLUE   = '#2F5D6B';
const AMBER  = '#C2914A';
const PALETTE= ['#2F5D6B','#B5482A','#5C7A4A','#C2914A','#6B5B7E','#7A6248','#3F6B4F','#8B3A4A'];
const FALLBACK_CAT = { label:'Autre', color:'#9C9488' };

// ─── Constantes planning ──────────────────────────────────────────────────
const JOURS   = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
const JOURS_S = ['L','Ma','Me','J','V'];
const MOTIFS  = ['Maladie','Congé annuel','Congé exceptionnel','Formation','ASA','Autre'];

// ─── Constantes registre ──────────────────────────────────────────────────
const SOURCES = ['Département','Rectorat','Agent','Incohérence interne','Autre'];
const sourceColor = s => s==='Département'?WARN:s==='Rectorat'?BLUE:s==='Agent'?'#3F6B4F':s==='Incohérence interne'?AMBER:MUTED;
const NATURES_DEF = ['Salle de classe','Laboratoire','CDI','Cuisine','Atelier','Bureau'];
const STATUTS_INSP = ['non_observe','non_satisfaisant','satisfaisant'];
const statutLabel = s => s==='satisfaisant'?'Satisfaisant':s==='non_satisfaisant'?'Non satisfaisant':'Non observé';
const statutColor = s => s==='satisfaisant'?OK:s==='non_satisfaisant'?WARN:MUTED;

// ─── Données par défaut ───────────────────────────────────────────────────
const DEF_FONCTIONS = [
  {id:'f1',label:'Chef de cuisine',      color:'#C2914A'},
  {id:'f2',label:'Second de cuisine',    color:'#B5482A'},
  {id:'f3',label:"Agent de cuisine",     color:'#7A6248'},
  {id:'f4',label:"Agent d'entretien",    color:'#5C7A4A'},
  {id:'f5',label:'Agent de maintenance', color:'#2F5D6B'},
  {id:'f6',label:'Assistante de gestion',color:'#6B5B7E'},
];
const DEF_AGENTS = [
  {id:'a1',nom:'Dupont', prenom:'Marie',  fonctionId:'f1',taux:100,note:''},
  {id:'a2',nom:'Martin', prenom:'Julien', fonctionId:'f2',taux:100,note:''},
  {id:'a3',nom:'Leroy',  prenom:'Pascale',fonctionId:'f4',taux:100,note:''},
  {id:'a4',nom:'Schymik',prenom:'',       fonctionId:'f5',taux:100,note:''},
];
const makeGabarit = (agents) => {
  const g={};
  agents.forEach(a=>JOURS.forEach((_,ji)=>{g[`${a.id}_${ji}`]={debut:'07h30',fin:'15h30',repos:false};}));
  return g;
};

const DEF_CATEGORIES = [
  {id:'rh',          label:'RH',                    color:'#5C7A4A'},
  {id:'securite',    label:'Sécurité',               color:'#B5482A'},
  {id:'budget',      label:'Budget & finances',      color:'#2F5D6B'},
  {id:'restauration',label:'Restauration',           color:'#C2914A'},
  {id:'pilotage',    label:'Pilotage & vie scolaire', color:'#6B5B7E'},
];
const DEF_PERIODS = [
  {id:'p1',label:'Période 1',range:'1 sept → 17 oct 2026', startDate:'2026-09-01'},
  {id:'p2',label:'Période 2',range:'2 nov → 18 déc 2026',  startDate:'2026-11-02'},
  {id:'p3',label:'Période 3',range:'4 janv → 19 fév 2027', startDate:'2027-01-04'},
  {id:'p4',label:'Période 4',range:'8 mars → 16 avr 2027', startDate:'2027-03-08'},
  {id:'p5',label:'Période 5',range:'3 mai → 2 juil 2027',  startDate:'2027-05-03'},
];
const DEF_TASKS = [
  {id:'t1', title:'Titres de recettes mensuels',       categoryId:'budget',      periodIds:['p1','p2','p3','p4','p5'],responsable:'',note:'Chaque mois',           subtasks:['Édition des titres dans GFC','Transmission au comptable'],docNote:''},
  {id:'t2', title:'Exercice incendie n°1',             categoryId:'securite',    periodIds:['p1'],                    responsable:'',note:'Rentrée',                subtasks:['Information préalable des personnels','Déclenchement et chronométrage','Rédaction du compte rendu','Mise à jour du registre de sécurité'],docNote:''},
  {id:'t3', title:'Exercice incendie n°2',             categoryId:'securite',    periodIds:['p3'],                    responsable:'',note:'',                       subtasks:[],docNote:''},
  {id:'t4', title:'Exercice incendie n°3',             categoryId:'securite',    periodIds:['p4'],                    responsable:'',note:'',                       subtasks:[],docNote:''},
  {id:'t5', title:'Commission de sécurité',            categoryId:'securite',    periodIds:['p2'],                    responsable:'',note:'À confirmer avec UT-DB', subtasks:['Demande de passage à la préfecture','Préparation du registre de sécurité','Communication à Mme Saint-Ouin',"Rédaction du projet d'acte"],docNote:"Modèle de courrier préfecture :\n\nMadame/Monsieur le Préfet,\nJ'ai l'honneur de solliciter le passage de la commission de sécurité au Collège Jehan Froissart, 59920 Quiévrechain.\n\nVeuillez agréer..."},
  {id:'t6', title:'Campagne entretiens professionnels',categoryId:'rh',          periodIds:['p2'],                    responsable:'',note:'',                       subtasks:['Convocations individuelles','Préparation des fiches de poste','Conduite des entretiens',"Saisie dans l'application RH"],docNote:''},
  {id:'t7', title:'Préparation budget primitif',       categoryId:'budget',      periodIds:['p2'],                    responsable:'',note:'',                       subtasks:['Analyse des besoins par service','Rédaction du projet de budget (MEX)',"Présentation au chef d'établissement",'Communication au CA'],docNote:''},
  {id:'t8', title:'Vote budget primitif (CA)',         categoryId:'budget',      periodIds:['p2'],                    responsable:'',note:'',                       subtasks:['Convocation des membres du CA','Préparation des documents budgétaires',"Transmission du budget voté à l'agent comptable"],docNote:''},
  {id:'t9', title:'Décision budgétaire modificative',  categoryId:'budget',      periodIds:['p4','p5'],               responsable:'',note:'',                       subtasks:['Édition MEX de la DBM','Validation ordonnateur','Transmission comptable'],docNote:''},
  {id:'t10',title:'Préparation compte financier',      categoryId:'budget',      periodIds:['p3','p4'],               responsable:'',note:'Rapport de gestion',     subtasks:["Arrêté des comptes",'Rédaction du rapport de gestion',"Transmission à l'agence comptable"],docNote:''},
  {id:'t11',title:'Vote compte financier (CA)',        categoryId:'budget',      periodIds:['p4'],                    responsable:'',note:'',                       subtasks:['Préparation du dossier CA','Présentation aux membres'],docNote:''},
  {id:'t12',title:'Enquête effectifs de rentrée',      categoryId:'pilotage',    periodIds:['p1'],                    responsable:'',note:'',                       subtasks:["Collecte des données élèves","Saisie dans l'application académique"],docNote:''},
  {id:'t13',title:'Inventaire annuel',                 categoryId:'restauration',periodIds:['p5'],                    responsable:'',note:'',                       subtasks:['Relevé des stocks','Saisie dans WebGerest','Transmission au comptable'],docNote:''},
];
const DEF_SUIVI_CATS = ['Hygiène','Menus','Ponctualité','Relationnel','Technique','Organisation'];

// ─── Helpers ──────────────────────────────────────────────────────────────
const pad2     = n => String(n).padStart(2,'0');
const uid      = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const daysUntil= d => { if(!d) return null; return Math.ceil((new Date(d)-new Date(new Date().setHours(0,0,0,0)))/86400000); };
const subKey   = (tid,pid,i) => `sub_${tid}_${pid}_${i}`;
const tdKey    = (tid,pid)   => `${tid}_${pid}`;
const isoWeek  = (date) => {
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  const day=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-day);
  const y=d.getUTCFullYear();
  const w=Math.ceil(((d-new Date(Date.UTC(y,0,1)))/86400000+1)/7);
  return `${y}-W${pad2(w)}`;
};
const weekLabel= (isoW) => {
  const [y,wStr]=isoW.split('-W');
  const d=new Date(parseInt(y),0,1+(parseInt(wStr)-1)*7);
  const day=d.getDay()||7; d.setDate(d.getDate()-day+1);
  const fin=new Date(d); fin.setDate(fin.getDate()+4);
  const fmt=x=>`${pad2(x.getDate())}/${pad2(x.getMonth()+1)}`;
  return `Semaine du ${fmt(d)} au ${fmt(fin)} ${fin.getFullYear()}`;
};
const todayWeek= ()=>isoWeek(new Date());
const toMin    = s => { if(!s) return 0; const c=s.replace('h',':').replace('H',':'); const [h,m]=c.split(':').map(Number); return (isNaN(h)?0:h)*60+(isNaN(m)?0:m); };
const minToH   = m => { if(m===0) return '0h00'; const s=m<0?'-':''; const a=Math.abs(m); return `${s}${Math.floor(a/60)}h${pad2(a%60)}`; };
const fmtDate  = iso => { if(!iso) return '—'; return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); };
const agentLabel = a => a?`${a.prenom?a.prenom+' ':''}${a.nom}`.trim():'—';

// ─── Micro-composants ─────────────────────────────────────────────────────
const Lbl = ({c}) => <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{color:MUTED}}>{c}</div>;
const Inp = ({value,onChange,placeholder='',type='text',className='',style={}}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    className={`px-2 py-1.5 rounded border text-sm bg-white w-full ${className}`} style={{borderColor:LINE,...style}}/>
);
const Pill=({done,total,color})=>{ const pct=Math.round(done/total*100),all=done===total; return(
  <div className="flex items-center gap-1 mt-0.5">
    <div style={{width:36,height:4,borderRadius:2,backgroundColor:LINE,overflow:'hidden'}}>
      <div style={{width:`${pct}%`,height:'100%',backgroundColor:all?OK:color,borderRadius:2,transition:'width .3s'}}></div>
    </div>
    <span style={{fontSize:'0.6rem',color:all?OK:MUTED}}>{done}/{total}</span>
  </div>);};
const Btn = ({onClick,children,variant='ghost',className='',style={}}) => {
  const base = "px-3 py-1.5 text-sm rounded border";
  const v = variant==='dark'?{backgroundColor:INK,color:PAPER,borderColor:INK}:variant==='line'?{borderColor:INK}:{borderColor:LINE};
  return <button onClick={onClick} className={`${base} ${className}`} style={{...v,...style}}>{children}</button>;
};
const Empty = ({children}) => <p className="text-sm py-6 text-center" style={{color:MUTED}}>{children}</p>;

// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── État global ──────────────────────────────────────────────────────────
  const [tab,    setTab]    = useState('alertes'); // alertes|calendrier|planning|registre|agents|inspections|salles
  const [loaded, setLoaded] = useState(false);
  const [modal,  setModal]  = useState(null);
  const [docModal,setDocModal]= useState(null);

  // ── Calendrier ───────────────────────────────────────────────────────────
  const [categories,  setCategories]  = useState(DEF_CATEGORIES);
  const [periods,     setPeriods]     = useState(DEF_PERIODS);
  const [tasks,       setTasks]       = useState(DEF_TASKS);
  const [calSt,       setCalSt]       = useState({});
  const [calView,     setCalView]     = useState('edition');
  const [activeCats,  setActiveCats]  = useState(null);
  const [showCats,    setShowCats]    = useState(false);
  const [showPers,    setShowPers]    = useState(false);
  const [expanded,    setExpanded]    = useState({});
  const [printMode,   setPrintMode]   = useState('period');
  const [printFilter, setPrintFilter] = useState(null);

  // ── Planning / Agents (communs) ─────────────────────────────────────────
  const [fonctions, setFonctions] = useState(DEF_FONCTIONS);
  const [agents,    setAgents]    = useState(DEF_AGENTS);
  const [gabarit,   setGabarit]   = useState(()=>makeGabarit(DEF_AGENTS));
  const [ecarts,    setEcarts]    = useState({});
  const [semaine,   setSemaine]   = useState(todayWeek);
  const [planView,  setPlanView]  = useState('planning');
  const [filtAgent, setFiltAgent] = useState(null);

  // ── Registre de suivi (consignes) ───────────────────────────────────────
  const [regEntries, setRegEntries] = useState([]);
  const [regSearch,  setRegSearch]  = useState('');
  const [regFiltSrc, setRegFiltSrc] = useState('');
  const [regDraft,   setRegDraft]   = useState({source:'',personne:'',date:'',fait:'',contexte:''});

  // ── Suivi agents (points +/-) ───────────────────────────────────────────
  const [suiviCats,   setSuiviCats]   = useState(DEF_SUIVI_CATS);
  const [agentEntries,setAgentEntries]= useState([]);
  const [curAgentId,  setCurAgentId]  = useState(null);
  const [suiviFiltType,setSuiviFiltType] = useState('');
  const [suiviSearch, setSuiviSearch] = useState('');
  const [suiviDraft,  setSuiviDraft]  = useState({type:'plus',categorie:'',date:'',fait:''});
  const [suiviCatDraftName, setSuiviCatDraftName] = useState('');

  // ── Inspections ──────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [inspections,setInspections]=useState([]);
  const [inspView,  setInspView]  = useState('list');
  const [curTplId,  setCurTplId]  = useState(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newTplName, setNewTplName] = useState('');
  const [newInsp,   setNewInsp]   = useState({templateId:'',lieu:'',agent:'',date:'',heure:'',comment:'',results:{},comments:{},itemPhotos:{},freePhotos:[],signature:''});
  const [curInspId, setCurInspId] = useState(null);
  const sigPadRef = useRef(null);
  const sigCtxRef = useRef(null);
  const sigDrawing = useRef(false);
  const sigHasDrawing = useRef(false);

  // ── Salles / locaux ──────────────────────────────────────────────────────
  const [salles,  setSalles]  = useState([]);
  const [natures, setNatures] = useState(NATURES_DEF);
  const [salleDraft, setSalleDraft] = useState(null);
  const [newNature, setNewNature] = useState('');
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomVal, setNewCustomVal] = useState('');
  const [openSalleId, setOpenSalleId] = useState(null);

  // ── Persistence ───────────────────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      try {
        const r=await window.storage.get(STORAGE_KEY);
        if(r?.value){
          const d=JSON.parse(r.value);
          if(d.categories)   setCategories(d.categories);
          if(d.periods)      setPeriods(d.periods);
          if(d.tasks)        setTasks(d.tasks);
          if(d.calSt)        setCalSt(d.calSt);
          if(d.fonctions)    setFonctions(d.fonctions);
          if(d.agents)       setAgents(d.agents);
          if(d.gabarit)      setGabarit(d.gabarit);
          if(d.ecarts)       setEcarts(d.ecarts);
          if(d.regEntries)   setRegEntries(d.regEntries);
          if(d.suiviCats)    setSuiviCats(d.suiviCats);
          if(d.agentEntries) setAgentEntries(d.agentEntries);
          if(d.templates)    setTemplates(d.templates);
          if(d.inspections)  setInspections(d.inspections);
          if(d.salles)       setSalles(d.salles);
          if(d.natures)      setNatures(d.natures);
        }
      }catch(e){}
      setLoaded(true);
    })();
  },[]);
  useEffect(()=>{
    if(!loaded) return;
    (async()=>{ try{ await window.storage.set(STORAGE_KEY,JSON.stringify({
      categories,periods,tasks,calSt,fonctions,agents,gabarit,ecarts,
      regEntries,suiviCats,agentEntries,templates,inspections,salles,natures
    })); }catch(e){} })();
  },[categories,periods,tasks,calSt,fonctions,agents,gabarit,ecarts,regEntries,suiviCats,agentEntries,templates,inspections,salles,natures,loaded]);

  // ══════════════════════════════════════════════════════════════════════════
  //  CALENDRIER – logique
  // ══════════════════════════════════════════════════════════════════════════
  const catLookup   = id=>categories.find(c=>c.id===id)||FALLBACK_CAT;
  const visCats     = activeCats===null?categories.map(c=>c.id):activeCats;
  const togCatFilt  = id=>setActiveCats(p=>{ const b=p===null?categories.map(c=>c.id):p; return b.includes(id)?b.filter(c=>c!==id):[...b,id]; });
  const togTaskSt   = (tid,pid)=>{ const k=tdKey(tid,pid); setCalSt(p=>{ const n={...p}; n[k]==='fait'?delete n[k]:(n[k]='fait'); return n; }); };
  const togSubSt    = (tid,pid,i)=>{ const k=subKey(tid,pid,i); setCalSt(p=>{ const n={...p}; n[k]==='fait'?delete n[k]:(n[k]='fait'); return n; }); };
  const getSubComp  = (task,pid)=>{ const s=task.subtasks||[]; if(!s.length) return null; return {done:s.filter((_,i)=>calSt[subKey(task.id,pid,i)]==='fait').length,total:s.length}; };
  const isTaskDone  = (task,pid)=>{ const s=task.subtasks||[]; if(!s.length) return calSt[tdKey(task.id,pid)]==='fait'; const c=getSubComp(task,pid); return c&&c.done===c.total; };
  const perAlert    = p=>{ const d=daysUntil(p.startDate); return d!==null&&d>=0&&d<=21; };
  const upAlerts    = periods.filter(p=>perAlert(p)&&tasks.some(t=>t.periodIds.includes(p.id)&&!isTaskDone(t,p.id)));
  const visTasks    = tasks.filter(t=>visCats.includes(t.categoryId)||!categories.find(c=>c.id===t.categoryId));

  const openNewTask     = ()=>setModal({type:'task',eid:null,draft:{title:'',categoryId:categories[0]?.id||'',periodIds:[],responsable:'',note:'',subtasks:[],docNote:''},newSub:''});
  const openEditTask    = t =>setModal({type:'task',eid:t.id,draft:{...t,subtasks:[...(t.subtasks||[])],docNote:t.docNote||''},newSub:''});
  const openNewCat      = ()=>setModal({type:'cat',eid:null,draft:{label:'',color:PALETTE[0]}});
  const openEditCat     = c =>setModal({type:'cat',eid:c.id,draft:{...c}});
  const openNewPer      = ()=>setModal({type:'per',eid:null,draft:{label:'',range:'',startDate:''}});
  const openEditPer     = p =>setModal({type:'per',eid:p.id,draft:{...p}});
  const togPerDraft     = pid=>setModal(m=>({...m,draft:{...m.draft,periodIds:m.draft.periodIds.includes(pid)?m.draft.periodIds.filter(x=>x!==pid):[...m.draft.periodIds,pid]}}));
  const addSub          = ()=>{ const v=modal.newSub.trim(); if(!v) return; setModal(m=>({...m,draft:{...m.draft,subtasks:[...m.draft.subtasks,v]},newSub:''})); };
  const remSub          = i =>setModal(m=>({...m,draft:{...m.draft,subtasks:m.draft.subtasks.filter((_,j)=>j!==i)}}));
  const updSub          = (i,v)=>setModal(m=>({...m,draft:{...m.draft,subtasks:m.draft.subtasks.map((s,j)=>j===i?v:s)}}));

  // ══════════════════════════════════════════════════════════════════════════
  //  PLANNING – logique
  // ══════════════════════════════════════════════════════════════════════════
  const fnLookup   = id=>fonctions.find(f=>f.id===id)||{label:'—',color:MUTED};
  const agentLookup= id=>agents.find(a=>a.id===id)||null;
  const getEcart   = (aid,w,ji)=>ecarts?.[aid]?.[w]?.[ji]||{type:'normal',motif:'',minutes:0};
  const setEcart   = (aid,w,ji,field,val)=>{
    setEcarts(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      if(!n[aid]) n[aid]={}; if(!n[aid][w]) n[aid][w]={}; if(!n[aid][w][ji]) n[aid][w][ji]={type:'normal',motif:'',minutes:0};
      n[aid][w][ji][field]=val;
      if(field==='type'&&val==='normal') n[aid][w][ji]={type:'normal',motif:'',minutes:0};
      return n;
    });
  };
  const getTheo    = aid=>JOURS.reduce((acc,_,ji)=>{ const g=gabarit[`${aid}_${ji}`]||{}; return g.repos?acc:acc+Math.max(0,toMin(g.fin)-toMin(g.debut)); },0);
  const getReel    = (aid,w)=>JOURS.reduce((acc,_,ji)=>{ const g=gabarit[`${aid}_${ji}`]||{}; const e=getEcart(aid,w,ji); if(g.repos||e.type==='absence') return acc; const b=Math.max(0,toMin(g.fin)-toMin(g.debut)); return e.type==='hsup'?acc+b+(e.minutes||0):e.type==='recup'?acc+b-(e.minutes||0):acc+b; },0);
  const getSolde   = aid=>{ let hs=0,rc=0; Object.keys(ecarts[aid]||{}).forEach(w=>Object.values(ecarts[aid][w]||{}).forEach(e=>{ if(e.type==='hsup') hs+=(e.minutes||0); if(e.type==='recup') rc+=(e.minutes||0); })); return {hsup:hs,recup:rc,solde:hs-rc}; };
  const getHisto   = aid=>Object.keys(ecarts[aid]||{}).sort().reverse().map(w=>({ week:w, days:JOURS.map((j,ji)=>({j,ji,e:getEcart(aid,w,ji)})).filter(x=>x.e.type!=='normal') })).filter(r=>r.days.length>0);
  const prevWeek   = ()=>{ const [y,w]=semaine.split('-W').map(Number); const d=new Date(y,0,1+(w-1)*7); d.setDate(d.getDate()-7); setSemaine(isoWeek(d)); };
  const nextWeek   = ()=>{ const [y,w]=semaine.split('-W').map(Number); const d=new Date(y,0,1+(w-1)*7); d.setDate(d.getDate()+7); setSemaine(isoWeek(d)); };

  const openNewAgent = ()=>setModal({type:'agent',eid:null,draft:{nom:'',prenom:'',fonctionId:fonctions[0]?.id||'',taux:100,note:''}});
  const openEditAgent= a=>setModal({type:'agent',eid:a.id,draft:{...a}});
  const openGabarit  = a=>setModal({type:'gabarit',aid:a.id,aLabel:`${a.prenom} ${a.nom}`,draft:JOURS.map((_,ji)=>({...(gabarit[`${a.id}_${ji}`]||{debut:'',fin:'',repos:false})}))});
  const openNewFn    = ()=>setModal({type:'fn',eid:null,draft:{label:'',color:PALETTE[0]}});
  const openEditFn   = f=>setModal({type:'fn',eid:f.id,draft:{...f}});

  // ── HEURES SUP — seuil d'alerte (en minutes) pour l'onglet Alertes ───────
  const HS_ALERT_THRESHOLD = 600; // 10h
  const hsAlerts = agents.map(a=>({a,...getSolde(a.id)})).filter(x=>x.solde>=HS_ALERT_THRESHOLD);

  // ══════════════════════════════════════════════════════════════════════════
  //  REGISTRE DE SUIVI – logique
  // ══════════════════════════════════════════════════════════════════════════
  const addRegEntry = ()=>{
    if(!regDraft.fait.trim()) return;
    const iso = regDraft.date ? new Date(regDraft.date+'T12:00:00').toISOString() : new Date().toISOString();
    setRegEntries(p=>[{id:uid(),source:regDraft.source,personne:regDraft.personne,date:iso,fait:regDraft.fait,contexte:regDraft.contexte},...p]);
    setRegDraft({source:'',personne:'',date:'',fait:'',contexte:''});
  };
  const delRegEntry = id=>setRegEntries(p=>p.filter(e=>e.id!==id));
  const visRegEntries = regEntries.filter(e=>{
    const matchSrc = !regFiltSrc || e.source===regFiltSrc;
    const s = regSearch.toLowerCase();
    const matchSearch = !s || (e.personne+' '+e.fait+' '+e.contexte).toLowerCase().includes(s);
    return matchSrc && matchSearch;
  }).sort((a,b)=>new Date(b.date)-new Date(a.date));

  // ══════════════════════════════════════════════════════════════════════════
  //  SUIVI AGENTS (points +/-) – logique
  // ══════════════════════════════════════════════════════════════════════════
  const addSuiviCat = name=>{ const v=name.trim(); if(!v||suiviCats.includes(v)) return; setSuiviCats(p=>[...p,v]); };
  const addAgentEntry = ()=>{
    if(!curAgentId || !suiviDraft.fait.trim()) return;
    const iso = suiviDraft.date ? new Date(suiviDraft.date+'T12:00:00').toISOString() : new Date().toISOString();
    setAgentEntries(p=>[...p,{id:uid(),agentId:curAgentId,date:iso,type:suiviDraft.type,categorie:suiviDraft.categorie,fait:suiviDraft.fait}]);
    setSuiviDraft({type:'plus',categorie:'',date:'',fait:''});
  };
  const delAgentEntry = id=>setAgentEntries(p=>p.filter(e=>e.id!==id));
  const agentEntriesFor = aid=>agentEntries.filter(e=>e.agentId===aid);
  const visAgentEntries = (()=>{
    const all = agentEntriesFor(curAgentId);
    const s = suiviSearch.toLowerCase();
    return all.filter(e=>(!suiviFiltType||e.type===suiviFiltType)&&(!s||(e.fait+' '+e.categorie).toLowerCase().includes(s)))
      .sort((a,b)=>new Date(b.date)-new Date(a.date));
  })();

  // ══════════════════════════════════════════════════════════════════════════
  //  INSPECTIONS – logique
  // ══════════════════════════════════════════════════════════════════════════
  const tplLookup = id=>templates.find(t=>t.id===id);
  const addTemplate = ()=>{ const v=newTplName.trim(); if(!v) return; const tpl={id:uid(),name:v,items:[]}; setTemplates(p=>[...p,tpl]); setNewTplName(''); setCurTplId(tpl.id); setInspView('tplEdit'); };
  const delTemplate = id=>setTemplates(p=>p.filter(t=>t.id!==id));
  const addTplItem = ()=>{ const v=newItemLabel.trim(); if(!v||!curTplId) return; setTemplates(p=>p.map(t=>t.id===curTplId?{...t,items:[...t.items,{id:uid(),label:v}]}:t)); setNewItemLabel(''); };
  const delTplItem = iid=>setTemplates(p=>p.map(t=>t.id===curTplId?{...t,items:t.items.filter(i=>i.id!==iid)}:t));

  const startNewInsp = tid=>{
    const tpl = tplLookup(tid);
    const results={}, comments={};
    (tpl?.items||[]).forEach(it=>{ results[it.id]='non_observe'; comments[it.id]=''; });
    setNewInsp({templateId:tid,lieu:'',agent:'',date:'',heure:'',comment:'',results,comments,itemPhotos:{},freePhotos:[],signature:''});
  };
  const fileToDataUrl = file=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
  const addItemPhotos = async (itemId, files)=>{
    const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
    setNewInsp(p=>({...p,itemPhotos:{...p.itemPhotos,[itemId]:[...(p.itemPhotos[itemId]||[]),...urls]}}));
  };
  const addFreePhotos = async files=>{
    const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
    setNewInsp(p=>({...p,freePhotos:[...p.freePhotos,...urls]}));
  };
  const removeItemPhoto = (itemId,i)=>setNewInsp(p=>({...p,itemPhotos:{...p.itemPhotos,[itemId]:p.itemPhotos[itemId].filter((_,j)=>j!==i)}}));
  const removeFreePhoto = i=>setNewInsp(p=>({...p,freePhotos:p.freePhotos.filter((_,j)=>j!==i)}));

  // Pad de signature
  useEffect(()=>{
    if(inspView!=='new'||!sigPadRef.current) return;
    const c = sigPadRef.current; const ctx=c.getContext('2d');
    ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle=INK;
    sigCtxRef.current = ctx;
    const pos = e=>{ const r=c.getBoundingClientRect(); const t=e.touches?e.touches[0]:e;
      return {x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height)}; };
    const start = e=>{ sigDrawing.current=true; sigHasDrawing.current=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); };
    const move  = e=>{ if(!sigDrawing.current) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); };
    const end   = ()=>{ sigDrawing.current=false; };
    c.addEventListener('mousedown',start); c.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
    c.addEventListener('touchstart',start,{passive:false}); c.addEventListener('touchmove',move,{passive:false}); c.addEventListener('touchend',end);
    return ()=>{ c.removeEventListener('mousedown',start); c.removeEventListener('mousemove',move); window.removeEventListener('mouseup',end);
      c.removeEventListener('touchstart',start); c.removeEventListener('touchmove',move); c.removeEventListener('touchend',end); };
  },[inspView]);
  const clearSignature = ()=>{ if(!sigCtxRef.current) return; sigCtxRef.current.clearRect(0,0,sigPadRef.current.width,sigPadRef.current.height); sigHasDrawing.current=false; };

  const saveInspection = ()=>{
    if(!newInsp.templateId){ alert("Choisis un modèle d'inspection."); return; }
    const sig = sigHasDrawing.current && sigPadRef.current ? sigPadRef.current.toDataURL() : '';
    const insp = {
      id:uid(), templateId:newInsp.templateId, templateName:tplLookup(newInsp.templateId)?.name||'',
      lieu:newInsp.lieu, agent:newInsp.agent,
      date: newInsp.date || new Date().toISOString().slice(0,10), heure:newInsp.heure,
      comment:newInsp.comment, results:newInsp.results, comments:newInsp.comments,
      itemPhotos:newInsp.itemPhotos, freePhotos:newInsp.freePhotos, signature:sig,
      items: (tplLookup(newInsp.templateId)?.items||[]).map(it=>({id:it.id,label:it.label})),
      createdAt: new Date().toISOString(),
    };
    setInspections(p=>[insp,...p]);
    clearSignature();
    setNewInsp({templateId:'',lieu:'',agent:'',date:'',heure:'',comment:'',results:{},comments:{},itemPhotos:{},freePhotos:[],signature:''});
    setInspView('list');
  };
  const delInspection = id=>setInspections(p=>p.filter(i=>i.id!==id));

  // ══════════════════════════════════════════════════════════════════════════
  //  SALLES / LOCAUX – logique
  // ══════════════════════════════════════════════════════════════════════════
  const blankSalle = ()=>({id:null,numero:'',nature:'',vpi:'',surface:'',vpiNumero:'',vpiDate:'',ordiNombre:'',ordiDate:'',velo:0,custom:[],historique:[]});
  const openNewSalle = ()=>{ setSalleDraft(blankSalle()); setNewCustomKey(''); setNewCustomVal(''); };
  const openEditSalle = s=>{ setSalleDraft({...s,custom:s.custom?[...s.custom]:[]}); setNewCustomKey(''); setNewCustomVal(''); };
  const cancelSalle = ()=>setSalleDraft(null);
  const addCustomField = ()=>{ if(!newCustomKey.trim()) return; setSalleDraft(p=>({...p,custom:[...p.custom,{key:newCustomKey.trim(),value:newCustomVal.trim()}]})); setNewCustomKey(''); setNewCustomVal(''); };
  const remCustomField = i=>setSalleDraft(p=>({...p,custom:p.custom.filter((_,j)=>j!==i)}));
  const addNature = ()=>{ const v=newNature.trim(); if(!v||natures.includes(v)) return; setNatures(p=>[...p,v]); setSalleDraft(p=>p?{...p,nature:v}:p); setNewNature(''); };
  const saveSalle = ()=>{
    if(!salleDraft.numero.trim()||!salleDraft.nature){ alert("Indique au moins un numéro/nom et une nature pour la salle."); return; }
    const previous = salleDraft.id ? salles.find(s=>s.id===salleDraft.id) : null;
    const salle = {...salleDraft, id: salleDraft.id||uid()};
    if(previous){
      const champsSuivis = [['vpi','Modèle de VPI'],['vpiNumero','Numéro de VPI'],['vpiDate',"Date d'installation VPI"],['ordiNombre',"Nombre d'ordinateurs"],['ordiDate',"Date d'installation ordinateurs"]];
      const histo = [...(previous.historique||[])];
      champsSuivis.forEach(([champ,label])=>{
        const avant=previous[champ]||'', apres=salle[champ]||'';
        if(avant!==apres) histo.push({date:new Date().toISOString(),champ:label,avant:avant||'—',apres:apres||'—'});
      });
      salle.historique = histo;
    }
    setSalles(p=> previous ? p.map(s=>s.id===salle.id?salle:s) : [...p,salle]);
    setSalleDraft(null);
  };
  const delSalle = id=>setSalles(p=>p.filter(s=>s.id!==id));

  // ══════════════════════════════════════════════════════════════════════════
  //  EXPORT / IMPORT
  // ══════════════════════════════════════════════════════════════════════════
  const exportData = async ()=>{
    const data = {categories,periods,tasks,calSt,fonctions,agents,gabarit,ecarts,regEntries,suiviCats,agentEntries,templates,inspections,salles,natures};
    const json = JSON.stringify({exportedAt:new Date().toISOString(),data},null,2);
    const filename = `sauvegarde-froissart-${new Date().toISOString().slice(0,10)}.json`;
    if(window.showSaveFilePicker){
      try{
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{description:'Sauvegarde JSON', accept:{'application/json':['.json']}}]
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      }catch(e){ if(e?.name==='AbortError') return; /* sinon on bascule sur le téléchargement classique */ }
    }
    const blob = new Blob([json],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const importData = async file=>{
    try{
      const text = await file.text();
      const parsed = JSON.parse(text);
      const d = parsed.data||parsed;
      if(!window.confirm('Importer cette sauvegarde va remplacer les données actuelles. Continuer ?')) return;
      if(d.categories)   setCategories(d.categories);
      if(d.periods)      setPeriods(d.periods);
      if(d.tasks)        setTasks(d.tasks);
      if(d.calSt)        setCalSt(d.calSt);
      if(d.fonctions)    setFonctions(d.fonctions);
      if(d.agents)       setAgents(d.agents);
      if(d.gabarit)      setGabarit(d.gabarit);
      if(d.ecarts)       setEcarts(d.ecarts);
      if(d.regEntries)   setRegEntries(d.regEntries);
      if(d.suiviCats)    setSuiviCats(d.suiviCats);
      if(d.agentEntries) setAgentEntries(d.agentEntries);
      if(d.templates)    setTemplates(d.templates);
      if(d.inspections)  setInspections(d.inspections);
      if(d.salles)       setSalles(d.salles);
      if(d.natures)      setNatures(d.natures);
      window.alert('Sauvegarde importée avec succès.');
    }catch(e){ window.alert("Le fichier sélectionné n'est pas une sauvegarde valide."); }
  };

  // ── Save modal ────────────────────────────────────────────────────────────
  const closeModal = ()=>setModal(null);
  const saveModal  = ()=>{
    if(!modal) return;
    const {type,eid,draft}=modal;
    if(type==='task'){
      if(!draft.title.trim()) return;
      eid?setTasks(p=>p.map(t=>t.id===eid?{...draft,id:eid}:t)):setTasks(p=>[...p,{...draft,id:'t'+Date.now()}]);
    } else if(type==='cat'){
      if(!draft.label.trim()) return;
      eid?setCategories(p=>p.map(c=>c.id===eid?{...draft,id:eid}:c)):setCategories(p=>[...p,{...draft,id:'c'+Date.now()}]);
    } else if(type==='per'){
      if(!draft.label.trim()) return;
      eid?setPeriods(p=>p.map(x=>x.id===eid?{...draft,id:eid}:x)):setPeriods(p=>[...p,{...draft,id:'pe'+Date.now()}]);
    } else if(type==='agent'){
      if(!draft.nom.trim()) return;
      if(eid){ setAgents(p=>p.map(a=>a.id===eid?{...draft,id:eid}:a)); }
      else { const nid='a'+Date.now(); setAgents(p=>[...p,{...draft,id:nid}]); setGabarit(prev=>{ const n={...prev}; JOURS.forEach((_,ji)=>{n[`${nid}_${ji}`]={debut:'07h30',fin:'15h30',repos:false};}); return n; }); }
    } else if(type==='gabarit'){
      const aid=modal.aid; setGabarit(prev=>{ const n={...prev}; modal.draft.forEach((g,ji)=>{n[`${aid}_${ji}`]=g;}); return n; });
    } else if(type==='fn'){
      if(!draft.label.trim()) return;
      eid?setFonctions(p=>p.map(f=>f.id===eid?{...draft,id:eid}:f)):setFonctions(p=>[...p,{...draft,id:'f'+Date.now()}]);
    }
    closeModal();
  };
  const deleteModal = ()=>{
    if(!modal) return;
    const {type,eid}=modal;
    if(type==='task') setTasks(p=>p.filter(t=>t.id!==eid));
    else if(type==='cat') setCategories(p=>p.filter(c=>c.id!==eid));
    else if(type==='per'){ setPeriods(p=>p.filter(x=>x.id!==eid)); setTasks(p=>p.map(t=>({...t,periodIds:t.periodIds.filter(pid=>pid!==eid)}))); }
    else if(type==='agent'){ setAgents(p=>p.filter(a=>a.id!==eid)); setEcarts(prev=>{const n={...prev};delete n[eid];return n;}); }
    else if(type==='fn') setFonctions(p=>p.filter(f=>f.id!==eid));
    closeModal();
  };

  // ── Impression planning ───────────────────────────────────────────────────
  const PrintPlanning = ()=>(
    <div>
      <div className="mb-3 pb-2" style={{borderBottom:`2px solid ${INK}`}}>
        <h2 className="font-serif text-xl">Planning de service</h2>
        <p className="text-xs" style={{color:MUTED}}>Collège Jehan Froissart — Quiévrechain — {weekLabel(semaine)}</p>
      </div>
      <table className="w-full border-collapse" style={{fontSize:'0.72rem'}}>
        <thead><tr style={{backgroundColor:'#f0ece4'}}>
          <th className="text-left p-2 border" style={{borderColor:LINE,width:150}}>Agent</th>
          {JOURS.map(j=><th key={j} className="text-center p-2 border" style={{borderColor:LINE}}>{j}</th>)}
          <th className="text-center p-2 border" style={{borderColor:LINE,width:65}}>Total</th>
        </tr></thead>
        <tbody>{agents.map(a=>{
          const fn=fnLookup(a.fonctionId); const reel=getReel(a.id,semaine);
          return(<tr key={a.id}>
            <td className="p-2 border align-top" style={{borderColor:LINE,borderLeft:`3px solid ${fn.color}`}}>
              <div className="font-medium">{a.prenom} {a.nom}</div>
              <div style={{color:fn.color,fontSize:'0.65rem'}}>{fn.label}</div>
            </td>
            {JOURS.map((_,ji)=>{ const g=gabarit[`${a.id}_${ji}`]||{}; const e=getEcart(a.id,semaine,ji);
              return(<td key={ji} className="p-2 border text-center align-top" style={{borderColor:LINE,backgroundColor:g.repos?'#F4EFE4':e.type==='absence'?'#FDF0EC':e.type==='hsup'?'#EBF4EE':e.type==='recup'?'#EEF2F8':'transparent'}}>
                {g.repos?<span style={{color:MUTED,fontStyle:'italic'}}>Repos</span>
                :e.type==='absence'?<><div style={{color:WARN,fontWeight:600}}>Absent</div>{e.motif&&<div style={{color:MUTED,fontSize:'0.6rem'}}>{e.motif}</div>}</>
                :<><div className="font-medium">{g.debut} – {g.fin}</div>
                  {e.type==='hsup'&&<div style={{color:OK,fontSize:'0.65rem'}}>+{minToH(e.minutes||0)} HS</div>}
                  {e.type==='recup'&&<div style={{color:'#2F5D6B',fontSize:'0.65rem'}}>Récup {minToH(e.minutes||0)}</div>}</>}
              </td>); })}
            <td className="p-2 border text-center font-medium" style={{borderColor:LINE}}>{minToH(reel)}</td>
          </tr>);
        })}</tbody>
      </table>
      <p className="text-xs mt-3" style={{color:MUTED}}>Collège Jehan Froissart — Intendance</p>
    </div>
  );

  // ── Calendrier print helpers ──────────────────────────────────────────────
  const PSubs = ({t,cat})=>(
    <ul className="list-none space-y-1 mt-1">{(t.subtasks||[]).map((s,i)=>(
      <li key={i} className="flex items-start gap-1.5">
        <span style={{display:'inline-block',width:11,height:11,border:`1px solid ${cat.color}`,borderRadius:2,flexShrink:0,marginTop:2}}></span>
        <span>{s}</span>
      </li>))}</ul>);

  const printByCat=()=>{
    const cats=printFilter?categories.filter(c=>c.id===printFilter):categories;
    return cats.map(cat=>{ const ct=tasks.filter(t=>t.categoryId===cat.id); if(!ct.length) return null;
      return(<div key={cat.id} className="mb-5" style={{pageBreakInside:'avoid'}}>
        <div className="font-serif text-base font-bold mb-2 pb-1" style={{borderBottom:`2px solid ${cat.color}`,color:cat.color}}>{cat.label}</div>
        <table className="w-full border-collapse" style={{fontSize:'0.72rem'}}>
          <thead><tr style={{backgroundColor:'#f0ece4'}}>
            <th className="text-left p-1.5 border" style={{borderColor:LINE,width:180}}>Échéance</th>
            {periods.map(p=><th key={p.id} className="text-left p-1.5 border align-top" style={{borderColor:LINE}}>
              <div style={{fontSize:'0.62rem'}} className="font-mono uppercase tracking-wide">{p.label}</div>
              <div style={{color:MUTED,fontSize:'0.58rem'}}>{p.range}</div>
            </th>)}
          </tr></thead>
          <tbody>{ct.map(t=>(<tr key={t.id}>
            <td className="p-1.5 border align-top" style={{borderColor:LINE,borderLeft:`3px solid ${cat.color}`}}>
              <div className="font-medium">{t.title}</div>
              {t.responsable&&<div style={{color:MUTED}}>{t.responsable}</div>}
              {t.note&&<div style={{color:MUTED,fontStyle:'italic'}}>{t.note}</div>}
            </td>
            {periods.map(p=>{ const active=t.periodIds.includes(p.id);
              return(<td key={p.id} className="p-1.5 border align-top" style={{borderColor:LINE}}>
                {active&&(t.subtasks||[]).length>0?<PSubs t={t} cat={cat}/>:active?<span style={{color:cat.color}}>●</span>:''}
              </td>);
            })}
          </tr>))}</tbody>
        </table>
      </div>);
    });
  };

  const printByPer=()=>{
    const pers=printFilter?periods.filter(p=>p.id===printFilter):periods;
    return pers.map(per=>{ const pt=tasks.filter(t=>t.periodIds.includes(per.id)); if(!pt.length) return null;
      return(<div key={per.id} className="mb-7" style={{pageBreakInside:'avoid'}}>
        <div className="mb-2 pb-1" style={{borderBottom:`2px solid ${INK}`}}>
          <span className="font-serif text-base font-bold">{per.label}</span>
          <span className="text-xs ml-2" style={{color:MUTED}}>{per.range}</span>
        </div>
        {categories.map(cat=>{ const items=pt.filter(t=>t.categoryId===cat.id); if(!items.length) return null;
          return(<div key={cat.id} className="mb-3">
            <div className="font-mono uppercase tracking-widest mb-1" style={{color:cat.color,fontSize:'0.65rem'}}>{cat.label}</div>
            <table className="w-full border-collapse" style={{fontSize:'0.72rem'}}>
              <thead><tr style={{backgroundColor:'#f0ece4'}}>
                <th className="text-left p-1.5 border font-medium" style={{borderColor:LINE,width:180}}>Échéance</th>
                <th className="text-left p-1.5 border font-medium" style={{borderColor:LINE}}>Actions</th>
                <th className="text-left p-1.5 border font-medium" style={{borderColor:LINE,width:90}}>Responsable</th>
                <th className="p-1.5 border font-medium" style={{borderColor:LINE,width:32}}>✓</th>
              </tr></thead>
              <tbody>{items.map(t=>(<tr key={t.id}>
                <td className="p-1.5 border align-top" style={{borderColor:LINE,borderLeft:`3px solid ${cat.color}`}}>
                  <div className="font-medium">{t.title}</div>
                  {t.note&&<div style={{color:MUTED,fontStyle:'italic'}}>{t.note}</div>}
                </td>
                <td className="p-1.5 border align-top" style={{borderColor:LINE}}>
                  {(t.subtasks||[]).length>0?<PSubs t={t} cat={cat}/>:'—'}
                </td>
                <td className="p-1.5 border align-top" style={{borderColor:LINE,color:MUTED}}>{t.responsable||''}</td>
                <td className="p-1.5 border text-center" style={{borderColor:LINE}}>
                  <span style={{display:'inline-block',width:14,height:14,border:`1px solid ${LINE}`,borderRadius:2}}></span>
                </td>
              </tr>))}</tbody>
            </table>
          </div>);
        })}
      </div>);
    });
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{backgroundColor:PAPER,color:INK,minHeight:'100vh'}} className="font-sans p-4 sm:p-6">
      <style>{`
        @media print{.no-print{display:none!important;}body,.print-area{background:white!important;}@page{size:A4 landscape;margin:12mm;}}
        input,textarea,select{font-family:inherit;}
      `}</style>
      <div className="max-w-5xl mx-auto print-area">

        {/* TITRE */}
        <div className="flex items-start justify-between no-print mb-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl mb-0.5">Espace de gestion — Intendance</h1>
            <p className="text-sm" style={{color:MUTED}}>Collège Jehan Froissart · Quiévrechain</p>
          </div>
          <div className="flex gap-2">
            <Btn onClick={exportData}>⬇ Exporter</Btn>
            <label className="px-3 py-1.5 text-sm rounded border cursor-pointer" style={{borderColor:LINE}}>
              ⬆ Importer
              <input type="file" accept="application/json" className="hidden" onChange={e=>{ if(e.target.files[0]) importData(e.target.files[0]); e.target.value=''; }}/>
            </label>
          </div>
        </div>

        {/* ONGLETS PRINCIPAUX */}
        <div className="flex gap-1.5 mb-5 no-print flex-wrap" style={{borderBottom:`1px solid ${LINE}`,paddingBottom:8}}>
          {[['alertes',`⚠ Alertes${(upAlerts.length+hsAlerts.length)>0?` (${upAlerts.length+hsAlerts.length})`:''}`],['calendrier','📅 Calendrier'],['planning','👥 Planning'],['registre','📋 Registre'],['agents','🗂 Suivi agents'],['inspections','🔍 Inspections'],['salles','🏫 Salles']].map(([v,lbl])=>(
            <button key={v} onClick={()=>setTab(v)}
              className="px-3 py-2 text-xs sm:text-sm font-mono uppercase tracking-wide rounded-t"
              style={tab===v?{backgroundColor:INK,color:PAPER,border:`1px solid ${INK}`,borderBottom:'none',marginBottom:-1}:{color:MUTED,border:`1px solid transparent`}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ════════════ ONGLET ALERTES ════════════ */}
        {tab==='alertes'&&(<div className="no-print">
          <h2 className="font-serif text-xl mb-4">Vue d'ensemble</h2>

          <div className="mb-3 text-xs font-mono uppercase tracking-wide" style={{color:MUTED}}>Échéances calendrier — moins de 3 semaines</div>
          {upAlerts.length===0?<Empty>Aucune échéance critique pour le moment.</Empty>:(
            <div className="mb-6 space-y-2">
              {upAlerts.map(p=>{ const days=daysUntil(p.startDate); const pend=tasks.filter(t=>t.periodIds.includes(p.id)&&!isTaskDone(t,p.id));
                return(<div key={p.id} className="p-3 rounded" style={{backgroundColor:'#FDF0EC',border:`1px solid ${WARN}`}}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{color:WARN}}>{p.label} <span style={{color:MUTED,fontWeight:400}}>· dans {days}j</span></span>
                    <button onClick={()=>{setTab('calendrier');setCalView('edition');}} className="text-xs underline" style={{color:MUTED}}>Voir au calendrier</button>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">{pend.map(t=>(
                    <li key={t.id} className="text-xs" style={{color:INK}}>· {t.title}{t.responsable&&<span style={{color:MUTED}}> — {t.responsable}</span>}</li>
                  ))}</ul>
                </div>); })}
            </div>
          )}

          <div className="mb-3 text-xs font-mono uppercase tracking-wide" style={{color:MUTED}}>Heures supplémentaires — solde ≥ {minToH(HS_ALERT_THRESHOLD)}</div>
          {hsAlerts.length===0?<Empty>Aucun agent au-dessus du seuil d'alerte.</Empty>:(
            <div className="space-y-2">
              {hsAlerts.map(({a,hsup,recup,solde})=>{ const fn=fnLookup(a.fonctionId);
                return(<div key={a.id} className="p-3 rounded flex items-center justify-between" style={{backgroundColor:'#EBF4EE',border:`1px solid ${OK}`}}>
                  <div>
                    <span className="text-sm font-medium">{a.prenom} {a.nom}</span>
                    <span className="text-xs ml-2" style={{color:fn.color}}>{fn.label}</span>
                  </div>
                  <div className="text-xs" style={{color:MUTED}}>
                    HS <strong style={{color:OK}}>{minToH(hsup)}</strong> · Récup <strong style={{color:BLUE}}>{minToH(recup)}</strong> · Solde <strong style={{color:OK}}>+{minToH(solde)}</strong>
                    <button onClick={()=>{setTab('planning');setFiltAgent(a.id);setPlanView('historique');}} className="ml-2 underline">Historique</button>
                  </div>
                </div>); })}
            </div>
          )}
        </div>)}

        {/* ════════════ ONGLET CALENDRIER ════════════ */}
        {tab==='calendrier'&&(<>
          {upAlerts.length>0&&(<div className="no-print mb-4 p-3 rounded" style={{backgroundColor:'#FDF0EC',border:`1px solid ${WARN}`}}>
            <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{color:WARN}}>⚠ Périodes à venir — moins de 3 semaines</div>
            <div className="flex flex-wrap gap-2">
              {upAlerts.map(p=>{ const days=daysUntil(p.startDate); const pend=tasks.filter(t=>t.periodIds.includes(p.id)&&!isTaskDone(t,p.id));
                return(<div key={p.id} className="text-xs px-2 py-1 rounded" style={{backgroundColor:'#FAE0D8',color:WARN}}>
                  <span className="font-medium">{p.label}</span>
                  <span style={{color:MUTED}}> · dans {days}j · {pend.length} tâche{pend.length>1?'s':''} en attente</span>
                </div>); })}
            </div>
          </div>)}

          <div className="flex gap-2 mb-4 no-print">
            {[['edition','Édition'],['impression','Impression']].map(([v,lbl])=>(
              <button key={v} onClick={()=>setCalView(v)}
                className="px-3 py-1.5 text-sm font-mono uppercase tracking-wide rounded border"
                style={calView===v?{backgroundColor:INK,color:PAPER,borderColor:INK}:{borderColor:LINE}}>{lbl}</button>
            ))}
          </div>

          {calView==='edition'&&(<>
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map(cat=>(<button key={cat.id} onClick={()=>togCatFilt(cat.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wide border"
                style={{borderColor:cat.color,opacity:visCats.includes(cat.id)?1:0.35}}>
                <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor:cat.color}}></span>{cat.label}
              </button>))}
            </div>
            <div className="flex gap-3 mb-4">
              <button onClick={()=>setShowCats(s=>!s)} className="text-xs underline" style={{color:MUTED}}>{showCats?'Masquer':'Gérer'} les catégories</button>
              <span style={{color:LINE}}>•</span>
              <button onClick={()=>setShowPers(s=>!s)} className="text-xs underline" style={{color:MUTED}}>{showPers?'Masquer':'Gérer'} les périodes</button>
            </div>
            {showCats&&(<div className="mb-4 p-3 rounded" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.map(cat=>(<button key={cat.id} onClick={()=>openEditCat(cat)} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs border" style={{borderColor:cat.color}}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor:cat.color}}></span>{cat.label}
                </button>))}
              </div>
              <button onClick={openNewCat} className="text-xs underline font-mono uppercase tracking-wide">+ Nouvelle catégorie</button>
            </div>)}
            {showPers&&(<div className="mb-4 p-3 rounded" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
              <div className="flex flex-wrap gap-2 mb-2">
                {periods.map(p=>{ const al=perAlert(p); return(
                  <button key={p.id} onClick={()=>openEditPer(p)} className="px-2 py-1 rounded text-xs border" style={{borderColor:al?WARN:LINE}}>
                    {al&&<span style={{color:WARN}}>⚠ </span>}{p.label} <span style={{color:MUTED}}>· {p.range}</span>
                  </button>); })}
              </div>
              <button onClick={openNewPer} className="text-xs underline font-mono uppercase tracking-wide">+ Nouvelle période</button>
            </div>)}

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div style={{minWidth:`${240+periods.length*100}px`}}>
                <div className="grid" style={{gridTemplateColumns:`240px repeat(${periods.length},1fr)`}}>
                  <div></div>
                  {periods.map(p=>{ const al=perAlert(p); const days=daysUntil(p.startDate); return(
                    <div key={p.id} className="text-center pb-2 px-1">
                      <div className="font-mono text-xs uppercase tracking-widest" style={{color:al?WARN:INK}}>{p.label}</div>
                      <div className="text-xs" style={{color:MUTED}}>{p.range}</div>
                      {al&&<div style={{fontSize:'0.6rem',color:WARN}}>dans {days}j</div>}
                    </div>); })}
                </div>
                {visTasks.map(task=>{ const cat=catLookup(task.categoryId); const exp=expanded[task.id]; const hasSubs=(task.subtasks||[]).length>0; const hasDoc=!!(task.docNote&&task.docNote.trim());
                  return(<div key={task.id} style={{borderTop:`1px solid ${LINE}`}}>
                    <div className="grid items-center" style={{gridTemplateColumns:`240px repeat(${periods.length},1fr)`}}>
                      <div className="flex items-start py-2.5 pr-2 gap-1">
                        {hasSubs?<button onClick={()=>setExpanded(p=>({...p,[task.id]:!p[task.id]}))} className="mt-0.5 text-xs shrink-0 w-4 text-center" style={{color:MUTED}}>{exp?'▾':'▸'}</button>:<span className="w-4 shrink-0"></span>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1">
                            <button onClick={()=>openEditTask(task)} className="text-left text-sm leading-snug">
                              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{backgroundColor:cat.color}}></span>{task.title}
                            </button>
                            {hasDoc&&<button onClick={()=>setDocModal({task})} className="shrink-0 mt-0.5" style={{fontSize:'0.7rem',color:'#2F5D6B'}}>📎</button>}
                          </div>
                          {task.responsable&&<div className="text-xs" style={{color:MUTED}}>{task.responsable}</div>}
                          {task.note&&<div className="text-xs italic" style={{color:MUTED}}>{task.note}</div>}
                        </div>
                      </div>
                      {periods.map(p=>{ const active=task.periodIds.includes(p.id); if(!active) return <div key={p.id} className="flex justify-center"><div className="w-4 h-4"></div></div>;
                        const comp=getSubComp(task,p.id); const done=isTaskDone(task,p.id); const alert=perAlert(p)&&!done;
                        return(<div key={p.id} className="flex flex-col items-center py-1">
                          {hasSubs?(<>
                            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{borderColor:done?OK:alert?WARN:cat.color,backgroundColor:done?OK:'transparent'}}>
                              {done&&<span style={{color:CARD,fontSize:'0.55rem',fontWeight:'bold'}}>✓</span>}
                            </div>
                            {comp&&<Pill done={comp.done} total={comp.total} color={alert?WARN:cat.color}/>}
                          </>):(
                            <button onClick={()=>togTaskSt(task.id,p.id)} className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{borderColor:done?OK:alert?WARN:cat.color,backgroundColor:done?OK:'transparent'}}>
                              {done&&<span style={{color:CARD,fontSize:'0.55rem',fontWeight:'bold'}}>✓</span>}
                            </button>
                          )}
                        </div>); })}
                    </div>
                    {exp&&hasSubs&&(<div style={{borderTop:`1px dashed ${LINE}`}}>
                      {(task.subtasks||[]).map((s,i)=>(<div key={i} className="grid items-center" style={{gridTemplateColumns:`240px repeat(${periods.length},1fr)`,backgroundColor:'#F9F5EE'}}>
                        <div className="flex items-center gap-1.5 py-1.5 pl-9 pr-2">
                          <span style={{color:cat.color,fontSize:'0.7rem'}}>›</span>
                          <span className="text-xs" style={{color:MUTED}}>{s}</span>
                        </div>
                        {periods.map(p=>{ const active=task.periodIds.includes(p.id); if(!active) return <div key={p.id}></div>;
                          const done=calSt[subKey(task.id,p.id,i)]==='fait';
                          return(<div key={p.id} className="flex justify-center">
                            <button onClick={()=>togSubSt(task.id,p.id,i)} className="w-3 h-3 rounded border" style={{borderColor:done?OK:cat.color,backgroundColor:done?OK:'transparent'}}></button>
                          </div>); })}
                      </div>))}
                    </div>)}
                  </div>); })}
              </div>
            </div>
            <button onClick={openNewTask} className="mt-5 px-3 py-1.5 text-sm font-mono uppercase tracking-wide rounded border no-print" style={{borderColor:INK}}>+ Ajouter une échéance</button>
          </>)}

          {calView==='impression'&&(<>
            <div className="no-print mb-4 p-3 rounded flex flex-wrap gap-4 items-start" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
              <div><Lbl c="Organiser par"/>
                <div className="flex gap-2">
                  {[['cat','Catégorie'],['period','Période']].map(([val,lbl])=>(
                    <button key={val} onClick={()=>{setPrintMode(val);setPrintFilter(null);}}
                      className="px-3 py-1.5 text-xs font-mono uppercase tracking-wide rounded border"
                      style={printMode===val?{backgroundColor:INK,color:PAPER,borderColor:INK}:{borderColor:LINE}}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div><Lbl c={`Filtrer ${printMode==='cat'?'catégorie':'période'}`}/>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={()=>setPrintFilter(null)} className="px-2 py-1 rounded text-xs border" style={printFilter===null?{backgroundColor:INK,color:PAPER,borderColor:INK}:{borderColor:LINE}}>Tout</button>
                  {(printMode==='cat'?categories:periods).map(item=>(
                    <button key={item.id} onClick={()=>setPrintFilter(item.id)} className="px-2 py-1 rounded text-xs border"
                      style={printFilter===item.id?{backgroundColor:printMode==='cat'?item.color:INK,borderColor:printMode==='cat'?item.color:INK,color:PAPER}:{borderColor:LINE}}>{item.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <button onClick={()=>window.print()} className="px-3 py-1.5 text-sm font-mono uppercase tracking-wide rounded border" style={{borderColor:INK}}>Imprimer / PDF</button>
              </div>
            </div>
            <div className="mb-4"><h2 className="font-serif text-xl">Calendrier annuel du service</h2><p className="text-xs" style={{color:MUTED}}>Collège Jehan Froissart — Quiévrechain — Intendance</p></div>
            {printMode==='cat'?printByCat():printByPer()}
          </>)}
        </>)}

        {/* ════════════ ONGLET PLANNING ════════════ */}
        {tab==='planning'&&(<>
          <div className="flex flex-wrap gap-2 mb-5 no-print" style={{borderBottom:`1px solid ${LINE}`,paddingBottom:8}}>
            {[['planning','📋 Saisie'],['compteurs','📊 Compteurs'],['historique','🗂 Historique'],['impression','🖨 Impression']].map(([v,lbl])=>(
              <button key={v} onClick={()=>setPlanView(v)}
                className="px-3 py-1.5 text-sm font-mono uppercase tracking-wide rounded-t"
                style={planView===v?{backgroundColor:INK,color:PAPER,border:`1px solid ${INK}`,borderBottom:'none',marginBottom:-1}:{color:MUTED,border:`1px solid transparent`}}>{lbl}</button>
            ))}
          </div>

          {planView==='planning'&&(<>
            <div className="flex flex-wrap gap-4 mb-4">
              <div><Lbl c="Fonctions"/>
                <div className="flex flex-wrap gap-1.5">
                  {fonctions.map(f=>(<button key={f.id} onClick={()=>openEditFn(f)} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs border" style={{borderColor:f.color}}>
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor:f.color}}></span>{f.label}
                  </button>))}
                  <button onClick={openNewFn} className="px-2 py-1 rounded text-xs border" style={{borderColor:LINE,color:MUTED}}>+ Ajouter</button>
                </div>
              </div>
              <div className="flex items-end"><button onClick={openNewAgent} className="px-3 py-1.5 text-sm font-mono uppercase tracking-wide rounded border" style={{borderColor:INK}}>+ Ajouter un agent</button></div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <button onClick={prevWeek} className="w-7 h-7 rounded-full border flex items-center justify-center" style={{borderColor:LINE}}>‹</button>
              <span className="text-sm font-medium">{weekLabel(semaine)}</span>
              <button onClick={nextWeek} className="w-7 h-7 rounded-full border flex items-center justify-center" style={{borderColor:LINE}}>›</button>
              <button onClick={()=>setSemaine(todayWeek())} className="text-xs underline" style={{color:MUTED}}>Aujourd'hui</button>
            </div>

            <div className="flex flex-wrap gap-3 mb-3">
              {[['normal','Normal',LINE],['absence','Absence',WARN],['hsup','Heure sup.',OK],['recup','Récupération','#2F5D6B']].map(([t,lbl,c])=>(
                <div key={t} className="flex items-center gap-1.5 text-xs">
                  <span className="inline-block w-3 h-3 rounded" style={{backgroundColor:t==='absence'?'#FDF0EC':t==='hsup'?'#EBF4EE':t==='recup'?'#EEF2F8':'#F4EFE4',border:`1px solid ${c}`}}></span>
                  <span style={{color:MUTED}}>{lbl}</span>
                </div>))}
            </div>

            {agents.length===0?<p className="text-sm py-8 text-center" style={{color:MUTED}}>Aucun agent. Ajoutez des agents pour commencer.</p>
            :agents.map(agent=>{ const fn=fnLookup(agent.fonctionId); const reel=getReel(agent.id,semaine); const theo=getTheo(agent.id); const diff=reel-theo;
              return(<div key={agent.id} className="mb-5 rounded" style={{border:`1px solid ${LINE}`,overflow:'hidden'}}>
                <div className="flex items-center gap-3 px-3 py-2" style={{backgroundColor:CARD,borderBottom:`1px solid ${LINE}`,borderLeft:`4px solid ${fn.color}`}}>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{agent.prenom} {agent.nom}</span>
                    <span className="text-xs ml-2" style={{color:fn.color}}>{fn.label}</span>
                    {agent.taux!==100&&<span className="text-xs ml-1" style={{color:MUTED}}>{agent.taux}%</span>}
                  </div>
                  <div className="text-xs" style={{color:MUTED}}>
                    Théo: <strong>{minToH(theo)}</strong> · Réel: <strong>{minToH(reel)}</strong>
                    {diff!==0&&<span style={{color:diff>0?OK:WARN,marginLeft:4}}>({diff>0?'+':''}{minToH(diff)})</span>}
                  </div>
                  <button onClick={()=>openGabarit(agent)} className="text-xs underline no-print" style={{color:MUTED}}>Gabarit</button>
                  <button onClick={()=>openEditAgent(agent)} className="text-xs underline no-print" style={{color:MUTED}}>Modifier</button>
                </div>
                <div className="grid" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
                  {JOURS.map((_,ji)=>{ const g=gabarit[`${agent.id}_${ji}`]||{}; const e=getEcart(agent.id,semaine,ji); const repos=g.repos;
                    return(<div key={ji} className="p-2" style={{backgroundColor:repos?'#F4EFE4':e.type==='absence'?'#FDF0EC':e.type==='hsup'?'#EBF4EE':e.type==='recup'?'#EEF2F8':'transparent',borderRight:ji<4?`1px solid ${LINE}`:'none'}}>
                      <div className="font-mono text-xs uppercase tracking-widest mb-1.5 text-center" style={{color:INK}}>{JOURS_S[ji]}</div>
                      {repos?<div className="text-center text-xs" style={{color:MUTED,fontStyle:'italic'}}>Repos</div>
                      :<>
                        <div className="text-center text-xs mb-1.5" style={{color:e.type==='absence'?MUTED:INK,textDecoration:e.type==='absence'?'line-through':'none'}}>{g.debut} – {g.fin}</div>
                        <select value={e.type} onChange={ev=>setEcart(agent.id,semaine,ji,'type',ev.target.value)}
                          className="w-full text-xs rounded border px-1 py-0.5 mb-1"
                          style={{borderColor:e.type==='normal'?LINE:e.type==='absence'?WARN:e.type==='hsup'?OK:'#2F5D6B',backgroundColor:'white'}}>
                          <option value="normal">Normal</option>
                          <option value="absence">Absence</option>
                          <option value="hsup">Heure sup.</option>
                          <option value="recup">Récupération</option>
                        </select>
                        {e.type==='absence'&&<select value={e.motif||''} onChange={ev=>setEcart(agent.id,semaine,ji,'motif',ev.target.value)}
                          className="w-full text-xs rounded border px-1 py-0.5" style={{borderColor:WARN,backgroundColor:'white'}}>
                          <option value="">Motif…</option>
                          {MOTIFS.map(m=><option key={m} value={m}>{m}</option>)}
                        </select>}
                        {(e.type==='hsup'||e.type==='recup')&&<div>
                          <div className="text-xs mb-0.5" style={{color:MUTED}}>Durée (min)</div>
                          <input type="number" min="0" step="15" value={e.minutes||0} onChange={ev=>setEcart(agent.id,semaine,ji,'minutes',parseInt(ev.target.value)||0)}
                            className="w-full text-xs rounded border px-1 py-0.5" style={{borderColor:e.type==='hsup'?OK:'#2F5D6B',backgroundColor:'white'}}/>
                          <div className="text-xs mt-0.5 text-center" style={{color:e.type==='hsup'?OK:'#2F5D6B'}}>= {minToH(e.minutes||0)}</div>
                        </div>}
                      </>}
                    </div>); })}
                </div>
              </div>); })}
          </>)}

          {planView==='compteurs'&&(<>
            <h2 className="font-serif text-lg mb-3">Soldes individuels</h2>
            <table className="w-full border-collapse text-sm" style={{minWidth:480}}>
              <thead><tr style={{backgroundColor:'#f0ece4'}}>
                <th className="text-left p-2 border" style={{borderColor:LINE}}>Agent</th>
                <th className="text-left p-2 border" style={{borderColor:LINE}}>Fonction</th>
                <th className="text-right p-2 border" style={{borderColor:LINE}}>HS acquises</th>
                <th className="text-right p-2 border" style={{borderColor:LINE}}>Récup prises</th>
                <th className="text-right p-2 border font-bold" style={{borderColor:LINE}}>Solde</th>
                <th className="text-center p-2 border" style={{borderColor:LINE}}>Actions</th>
              </tr></thead>
              <tbody>{agents.map(a=>{ const fn=fnLookup(a.fonctionId); const {hsup,recup,solde}=getSolde(a.id); return(
                <tr key={a.id}>
                  <td className="p-2 border font-medium" style={{borderColor:LINE,borderLeft:`3px solid ${fn.color}`}}>{a.prenom} {a.nom}</td>
                  <td className="p-2 border text-xs" style={{borderColor:LINE,color:fn.color}}>{fn.label}</td>
                  <td className="p-2 border text-right" style={{borderColor:LINE,color:OK}}>{minToH(hsup)}</td>
                  <td className="p-2 border text-right" style={{borderColor:LINE,color:'#2F5D6B'}}>{minToH(recup)}</td>
                  <td className="p-2 border text-right font-bold" style={{borderColor:LINE,color:solde>0?OK:solde<0?WARN:INK}}>{solde>0?'+':''}{minToH(solde)}</td>
                  <td className="p-2 border text-center" style={{borderColor:LINE}}>
                    <button onClick={()=>{setFiltAgent(a.id);setPlanView('historique');}} className="text-xs underline" style={{color:MUTED}}>Historique</button>
                  </td>
                </tr>); })}</tbody>
            </table>
            <p className="text-xs mt-3" style={{color:MUTED}}>Solde = HS acquises − récupérations prises.</p>
          </>)}

          {planView==='historique'&&(<>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-serif text-lg">Historique des écarts</h2>
              <select value={filtAgent||''} onChange={e=>setFiltAgent(e.target.value||null)} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}>
                <option value="">Tous les agents</option>
                {agents.map(a=><option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
            </div>
            {(filtAgent?agents.filter(a=>a.id===filtAgent):agents).map(agent=>{ const fn=fnLookup(agent.fonctionId); const histo=getHisto(agent.id); if(!histo.length) return null; const {hsup,recup,solde}=getSolde(agent.id);
              return(<div key={agent.id} className="mb-6">
                <div className="flex items-center gap-2 mb-2 pb-1" style={{borderBottom:`2px solid ${fn.color}`}}>
                  <span className="font-serif text-base font-bold">{agent.prenom} {agent.nom}</span>
                  <span className="text-xs" style={{color:fn.color}}>{fn.label}</span>
                  <span className="ml-auto text-xs" style={{color:MUTED}}>
                    HS: <strong style={{color:OK}}>{minToH(hsup)}</strong> · Récup: <strong style={{color:'#2F5D6B'}}>{minToH(recup)}</strong> · Solde: <strong style={{color:solde>=0?OK:WARN}}>{solde>0?'+':''}{minToH(solde)}</strong>
                  </span>
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead><tr style={{backgroundColor:'#f0ece4'}}>
                    <th className="text-left p-1.5 border" style={{borderColor:LINE}}>Semaine</th>
                    <th className="text-left p-1.5 border" style={{borderColor:LINE}}>Jour</th>
                    <th className="text-left p-1.5 border" style={{borderColor:LINE}}>Type</th>
                    <th className="text-left p-1.5 border" style={{borderColor:LINE}}>Détail</th>
                  </tr></thead>
                  <tbody>{histo.map(({week,days})=>days.map(({j,e},di)=>(
                    <tr key={`${week}_${di}`}>
                      {di===0&&<td className="p-1.5 border align-top font-mono" rowSpan={days.length} style={{borderColor:LINE}}>{weekLabel(week)}</td>}
                      <td className="p-1.5 border" style={{borderColor:LINE}}>{j}</td>
                      <td className="p-1.5 border font-medium" style={{borderColor:LINE,color:e.type==='absence'?WARN:e.type==='hsup'?OK:'#2F5D6B'}}>
                        {e.type==='absence'?'Absence':e.type==='hsup'?'Heure sup.':'Récupération'}
                      </td>
                      <td className="p-1.5 border" style={{borderColor:LINE,color:MUTED}}>{e.type==='absence'?e.motif||'—':minToH(e.minutes||0)}</td>
                    </tr>)))}</tbody>
                </table>
              </div>); })}
            {(filtAgent?agents.filter(a=>a.id===filtAgent):agents).every(a=>getHisto(a.id).length===0)&&
              <p className="text-sm py-6 text-center" style={{color:MUTED}}>Aucun écart enregistré.</p>}
          </>)}

          {planView==='impression'&&(<>
            <div className="flex items-center gap-3 mb-4 no-print">
              <button onClick={prevWeek} className="w-7 h-7 rounded-full border flex items-center justify-center" style={{borderColor:LINE}}>‹</button>
              <span className="text-sm font-medium">{weekLabel(semaine)}</span>
              <button onClick={nextWeek} className="w-7 h-7 rounded-full border flex items-center justify-center" style={{borderColor:LINE}}>›</button>
              <button onClick={()=>window.print()} className="ml-4 px-3 py-1.5 text-sm font-mono uppercase tracking-wide rounded border" style={{borderColor:INK}}>Imprimer / PDF</button>
            </div>
            <PrintPlanning/>
          </>)}
        </>)}

        {/* ════════════ ONGLET REGISTRE ════════════ */}
        {tab==='registre'&&(<div className="no-print">
          <div className="mb-4 p-3 rounded" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
            <div className="flex flex-wrap gap-2 mb-2">
              <select value={regDraft.source} onChange={e=>setRegDraft(d=>({...d,source:e.target.value}))} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,flex:1,minWidth:140}}>
                <option value="">Source</option>
                {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <Inp value={regDraft.personne} onChange={e=>setRegDraft(d=>({...d,personne:e.target.value}))} placeholder="Nom / service(s) concerné(s)" className="" style={{flex:2,minWidth:180}}/>
              <input type="date" value={regDraft.date} onChange={e=>setRegDraft(d=>({...d,date:e.target.value}))} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,width:160}}/>
            </div>
            <textarea value={regDraft.fait} onChange={e=>setRegDraft(d=>({...d,fait:e.target.value}))} placeholder="Ce qui a été dit / décidé…" rows={2} className="w-full px-2 py-1.5 rounded border text-sm bg-white resize-y" style={{borderColor:LINE}}/>
            <div className="flex gap-2 mt-2">
              <Inp value={regDraft.contexte} onChange={e=>setRegDraft(d=>({...d,contexte:e.target.value}))} placeholder="Contexte (réunion, mail, oral…)"/>
              <Btn onClick={addRegEntry} variant="dark" className="whitespace-nowrap">+ Ajouter</Btn>
            </div>
          </div>

          <div className="flex gap-2 items-center mb-4">
            <Inp value={regSearch} onChange={e=>setRegSearch(e.target.value)} placeholder="Rechercher une personne, un mot-clé…"/>
            <select value={regFiltSrc} onChange={e=>setRegFiltSrc(e.target.value)} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,width:200}}>
              <option value="">Toutes sources</option>
              {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {visRegEntries.length===0?<Empty>Aucune entrée pour l'instant.</Empty>:(
            <div className="space-y-2">{visRegEntries.map(e=>(
              <div key={e.id} className="p-3 rounded" style={{backgroundColor:CARD,border:`1px solid ${LINE}`,borderLeft:`3px solid ${sourceColor(e.source)}`}}>
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.source&&<span className="text-xs px-2 py-0.5 rounded font-mono uppercase" style={{backgroundColor:PAPER,color:sourceColor(e.source)}}>{e.source}</span>}
                    {e.personne&&<span className="text-xs" style={{color:MUTED}}>{e.personne}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{color:MUTED}}>{fmtDate(e.date)}</span>
                    <button onClick={()=>delRegEntry(e.id)} className="text-xs" style={{color:WARN}}>Supprimer</button>
                  </div>
                </div>
                <p className="text-sm">{e.fait}</p>
                {e.contexte&&<p className="text-xs mt-1 italic" style={{color:MUTED}}>{e.contexte}</p>}
              </div>
            ))}</div>
          )}
        </div>)}

        {/* ════════════ ONGLET SUIVI AGENTS ════════════ */}
        {tab==='agents'&&(<div className="no-print">
          <div className="flex flex-wrap gap-1.5 mb-5">
            {agents.map(a=>(<button key={a.id} onClick={()=>setCurAgentId(a.id)}
              className="px-2.5 py-1 rounded-full text-xs border" style={curAgentId===a.id?{backgroundColor:INK,color:PAPER,borderColor:INK}:{borderColor:LINE}}>{agentLabel(a)}</button>))}
            {agents.length===0&&<span className="text-xs" style={{color:MUTED}}>Aucun agent — ajoutez-en un dans l'onglet Planning.</span>}
          </div>

          {!curAgentId?<Empty>Choisis un agent ci-dessus pour consulter ou compléter son dossier.</Empty>:(()=>{
            const agent = agentLookup(curAgentId); const fn = fnLookup(agent?.fonctionId);
            const all = agentEntriesFor(curAgentId);
            const nbPlus = all.filter(e=>e.type==='plus').length, nbMinus = all.filter(e=>e.type==='minus').length;
            return(<>
              <div className="flex items-center gap-2 mb-4">
                <span className="font-serif text-lg">{agentLabel(agent)}</span>
                <span className="text-xs" style={{color:fn.color}}>{fn.label}</span>
              </div>
              <div className="flex gap-3 mb-5">
                <div className="flex-1 rounded p-3 text-center" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
                  <div className="text-xs mb-1" style={{color:MUTED}}>Points positifs</div>
                  <div className="text-2xl font-medium" style={{color:OK}}>{nbPlus}</div>
                </div>
                <div className="flex-1 rounded p-3 text-center" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
                  <div className="text-xs mb-1" style={{color:MUTED}}>Points négatifs</div>
                  <div className="text-2xl font-medium" style={{color:WARN}}>{nbMinus}</div>
                </div>
              </div>

              <div className="mb-5 p-3 rounded" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
                <div className="flex flex-wrap gap-2 mb-2">
                  <select value={suiviDraft.type} onChange={e=>setSuiviDraft(d=>({...d,type:e.target.value}))} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,width:140}}>
                    <option value="plus">+ Positif</option>
                    <option value="minus">− Négatif</option>
                  </select>
                  <select value={suiviDraft.categorie} onChange={e=>setSuiviDraft(d=>({...d,categorie:e.target.value}))} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,flex:1,minWidth:140}}>
                    <option value="">Catégorie…</option>
                    {suiviCats.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="date" value={suiviDraft.date} onChange={e=>setSuiviDraft(d=>({...d,date:e.target.value}))} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,width:160}}/>
                </div>
                <div className="flex gap-2 mb-2">
                  <Inp value={suiviCatDraftName} onChange={e=>setSuiviCatDraftName(e.target.value)} placeholder="Nouvelle catégorie (ex: menus, hygiène…)"/>
                  <Btn onClick={()=>{addSuiviCat(suiviCatDraftName);setSuiviCatDraftName('');}} className="whitespace-nowrap">+ Créer</Btn>
                </div>
                <textarea value={suiviDraft.fait} onChange={e=>setSuiviDraft(d=>({...d,fait:e.target.value}))} placeholder="Fait observé : quoi, comment…" rows={2} className="w-full px-2 py-1.5 rounded border text-sm bg-white resize-y" style={{borderColor:LINE}}/>
                <div className="flex justify-end mt-2"><Btn onClick={addAgentEntry} variant="dark">+ Ajouter au dossier</Btn></div>
              </div>

              <div className="flex gap-2 items-center mb-4">
                <select value={suiviFiltType} onChange={e=>setSuiviFiltType(e.target.value)} className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,width:140}}>
                  <option value="">Tout</option>
                  <option value="plus">Positifs</option>
                  <option value="minus">Négatifs</option>
                </select>
                <Inp value={suiviSearch} onChange={e=>setSuiviSearch(e.target.value)} placeholder="Filtrer par catégorie ou mot-clé…"/>
              </div>

              {visAgentEntries.length===0?<Empty>Aucune entrée pour cet agent.</Empty>:(
                <div className="space-y-2">{visAgentEntries.map(e=>(
                  <div key={e.id} className="p-3 rounded" style={{backgroundColor:CARD,border:`1px solid ${LINE}`,borderLeft:`3px solid ${e.type==='plus'?OK:WARN}`}}>
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded font-mono uppercase" style={{backgroundColor:PAPER,color:e.type==='plus'?OK:WARN}}>{e.type==='plus'?'+ Positif':'− Négatif'}</span>
                        {e.categorie&&<span className="text-xs" style={{color:MUTED}}>{e.categorie}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{color:MUTED}}>{fmtDate(e.date)}</span>
                        <button onClick={()=>delAgentEntry(e.id)} className="text-xs" style={{color:WARN}}>Supprimer</button>
                      </div>
                    </div>
                    <p className="text-sm">{e.fait}</p>
                  </div>
                ))}</div>
              )}
            </>);
          })()}
        </div>)}

        {/* ════════════ ONGLET INSPECTIONS ════════════ */}
        {tab==='inspections'&&(<div className="no-print">
          <div className="flex flex-wrap gap-2 mb-5">
            {[['list','Inspections réalisées'],['new','Nouvelle inspection'],['templates','Modèles']].map(([v,lbl])=>(
              <Btn key={v} onClick={()=>{ setInspView(v); if(v==='new') startNewInsp(newInsp.templateId); }} variant={inspView===v||(inspView==='tplEdit'&&v==='templates')||(inspView==='detail'&&v==='list')?'dark':'ghost'}>{lbl}</Btn>
            ))}
          </div>

          {inspView==='list'&&(<>
            {inspections.length===0?<Empty>Aucune inspection enregistrée.</Empty>:(
              <div className="space-y-2">{inspections.map(insp=>(
                <div key={insp.id} className="p-3 rounded flex items-center justify-between gap-2" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
                  <div>
                    <div className="text-sm font-medium">{insp.templateName} — {insp.lieu||'Lieu non précisé'}</div>
                    <div className="text-xs" style={{color:MUTED}}>{fmtDate(insp.date)} {insp.heure} · {insp.agent||'—'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>{setCurInspId(insp.id);setInspView('detail');}} className="text-xs underline" style={{color:MUTED}}>Voir</button>
                    <button onClick={()=>delInspection(insp.id)} className="text-xs" style={{color:WARN}}>Supprimer</button>
                  </div>
                </div>
              ))}</div>
            )}
          </>)}

          {inspView==='new'&&(<>
            <select value={newInsp.templateId} onChange={e=>startNewInsp(e.target.value)} className="w-full mb-2 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}>
              <option value="">Choisir un modèle</option>
              {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {templates.length===0&&<p className="text-xs mb-3" style={{color:MUTED}}>Crée d'abord un modèle dans l'onglet « Modèles ».</p>}
            <div className="flex gap-2 mb-2">
              <select value={newInsp.lieu} onChange={e=>setNewInsp(p=>({...p,lieu:e.target.value}))} className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}>
                <option value="">Lieu / salle</option>
                {salles.map(s=><option key={s.id} value={s.numero}>{s.numero}{s.nature?' — '+s.nature:''}</option>)}
              </select>
              <select value={newInsp.agent} onChange={e=>setNewInsp(p=>({...p,agent:e.target.value}))} className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}>
                <option value="">Agent en charge</option>
                {agents.map(a=><option key={a.id} value={agentLabel(a)}>{agentLabel(a)}</option>)}
              </select>
            </div>
            <p className="text-xs mb-2" style={{color:MUTED}}>Agent ou salle manquant ? Crée-le dans l'onglet <strong>Planning</strong> ou <strong>Salles</strong>.</p>
            <div className="flex gap-2 mb-3">
              <input type="date" value={newInsp.date} onChange={e=>setNewInsp(p=>({...p,date:e.target.value}))} className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}/>
              <input type="time" value={newInsp.heure} onChange={e=>setNewInsp(p=>({...p,heure:e.target.value}))} className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}/>
            </div>

            {(tplLookup(newInsp.templateId)?.items||[]).map(it=>(
              <div key={it.id} className="rounded p-3 mb-2" style={{border:`1px solid ${LINE}`}}>
                <p className="text-sm font-medium mb-2">{it.label}</p>
                <div className="flex gap-4 mb-2 flex-wrap">
                  {STATUTS_INSP.map(s=>(
                    <label key={s} className="text-xs flex items-center gap-1.5">
                      <input type="radio" name={`item-${it.id}`} checked={newInsp.results[it.id]===s} onChange={()=>setNewInsp(p=>({...p,results:{...p.results,[it.id]:s}}))}/>{statutLabel(s)}
                    </label>
                  ))}
                </div>
                <Inp value={newInsp.comments[it.id]||''} onChange={e=>setNewInsp(p=>({...p,comments:{...p.comments,[it.id]:e.target.value}}))} placeholder="Commentaire (optionnel)" className="mb-2"/>
                <p className="text-xs mb-1" style={{color:MUTED}}>Photo</p>
                <input type="file" accept="image/*" capture="environment" multiple onChange={e=>{ if(e.target.files.length) addItemPhotos(it.id,e.target.files); e.target.value=''; }} className="text-xs"/>
                <div className="flex gap-1.5 flex-wrap mt-1.5">{(newInsp.itemPhotos[it.id]||[]).map((url,i)=>(
                  <div key={i} className="relative"><img src={url} className="w-12 h-12 object-cover rounded" style={{border:`1px solid ${LINE}`}}/>
                    <button onClick={()=>removeItemPhoto(it.id,i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs" style={{backgroundColor:CARD,boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>✕</button>
                  </div>))}</div>
              </div>
            ))}

            <div className="mb-3">
              <p className="text-xs mb-1" style={{color:MUTED}}>Photos libres (lieu, contexte général…)</p>
              <input type="file" accept="image/*" capture="environment" multiple onChange={e=>{ if(e.target.files.length) addFreePhotos(e.target.files); e.target.value=''; }} className="text-xs"/>
              <div className="flex gap-1.5 flex-wrap mt-1.5">{newInsp.freePhotos.map((url,i)=>(
                <div key={i} className="relative"><img src={url} className="w-12 h-12 object-cover rounded" style={{border:`1px solid ${LINE}`}}/>
                  <button onClick={()=>removeFreePhoto(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs" style={{backgroundColor:CARD,boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>✕</button>
                </div>))}</div>
            </div>

            <textarea value={newInsp.comment} onChange={e=>setNewInsp(p=>({...p,comment:e.target.value}))} placeholder="Commentaire général…" rows={2} className="w-full mb-3 px-2 py-1.5 rounded border text-sm bg-white resize-y" style={{borderColor:LINE}}/>

            <p className="text-xs mb-1" style={{color:MUTED}}>Signature de l'agent</p>
            <canvas ref={sigPadRef} width={600} height={150} className="w-full rounded mb-1.5" style={{height:150,border:`1px solid ${LINE}`,touchAction:'none',backgroundColor:'white'}}/>
            <Btn onClick={clearSignature} className="mb-4">Effacer la signature</Btn>

            <div className="flex justify-end"><Btn onClick={saveInspection} variant="dark">✓ Enregistrer l'inspection</Btn></div>
          </>)}

          {inspView==='templates'&&(<>
            <div className="flex gap-2 mb-4">
              <Inp value={newTplName} onChange={e=>setNewTplName(e.target.value)} placeholder="Nom du modèle (ex: Salle de classe, Local cuisine…)"/>
              <Btn onClick={addTemplate} variant="dark" className="whitespace-nowrap">+ Créer le modèle</Btn>
            </div>
            {templates.length===0?<Empty>Aucun modèle. Crée-en un ci-dessus.</Empty>:(
              <div className="space-y-2">{templates.map(t=>(
                <div key={t.id} className="p-3 rounded flex items-center justify-between" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
                  <div><div className="text-sm font-medium">{t.name}</div><div className="text-xs" style={{color:MUTED}}>{t.items.length} point(s) de contrôle</div></div>
                  <div className="flex gap-2">
                    <button onClick={()=>{setCurTplId(t.id);setInspView('tplEdit');}} className="text-xs underline" style={{color:MUTED}}>Modifier</button>
                    <button onClick={()=>delTemplate(t.id)} className="text-xs" style={{color:WARN}}>Supprimer</button>
                  </div>
                </div>
              ))}</div>
            )}
          </>)}

          {inspView==='tplEdit'&&(()=>{ const tpl=tplLookup(curTplId); if(!tpl) return null; return(<>
            <button onClick={()=>setInspView('templates')} className="text-xs underline mb-3" style={{color:MUTED}}>← Retour aux modèles</button>
            <h3 className="font-serif text-lg mb-3">{tpl.name}</h3>
            <div className="flex gap-2 mb-3">
              <Inp value={newItemLabel} onChange={e=>setNewItemLabel(e.target.value)} placeholder="Intitulé du point de contrôle (ex: propreté des paillasses)"/>
              <Btn onClick={addTplItem} variant="dark" className="whitespace-nowrap">+ Ajouter</Btn>
            </div>
            {tpl.items.length===0?<p className="text-sm" style={{color:MUTED}}>Aucun point de contrôle pour l'instant.</p>:(
              <div>{tpl.items.map((it,i)=>(
                <div key={it.id} className="flex justify-between items-center py-2" style={{borderBottom:`1px solid ${LINE}`}}>
                  <span className="text-sm">{i+1}. {it.label}</span>
                  <button onClick={()=>delTplItem(it.id)} className="text-xs" style={{color:WARN}}>Retirer</button>
                </div>
              ))}</div>
            )}
          </>); })()}

          {inspView==='detail'&&(()=>{ const insp=inspections.find(i=>i.id===curInspId); if(!insp) return null; return(<>
            <div className="flex justify-between items-center mb-4">
              <button onClick={()=>setInspView('list')} className="text-xs underline" style={{color:MUTED}}>← Retour à la liste</button>
              <Btn onClick={()=>window.print()}>🖨 Imprimer / PDF</Btn>
            </div>
            <div className="mb-4 pb-2" style={{borderBottom:`2px solid ${INK}`}}>
              <h2 className="font-serif text-xl">{insp.templateName}</h2>
              <p className="text-xs" style={{color:MUTED}}>{insp.lieu||'—'} · {fmtDate(insp.date)} {insp.heure} · {insp.agent||'—'}</p>
            </div>
            {insp.items.map(it=>(
              <div key={it.id} className="mb-3 p-3 rounded" style={{border:`1px solid ${LINE}`}}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{it.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{color:statutColor(insp.results[it.id]),backgroundColor:PAPER}}>{statutLabel(insp.results[it.id])}</span>
                </div>
                {insp.comments[it.id]&&<p className="text-xs mt-1" style={{color:MUTED}}>{insp.comments[it.id]}</p>}
                <div className="flex gap-1.5 flex-wrap mt-2">{(insp.itemPhotos[it.id]||[]).map((url,i)=><img key={i} src={url} className="w-14 h-14 object-cover rounded" style={{border:`1px solid ${LINE}`}}/>)}</div>
              </div>
            ))}
            {insp.freePhotos?.length>0&&(<div className="mb-3"><p className="text-xs mb-1" style={{color:MUTED}}>Photos libres</p>
              <div className="flex gap-1.5 flex-wrap">{insp.freePhotos.map((url,i)=><img key={i} src={url} className="w-14 h-14 object-cover rounded" style={{border:`1px solid ${LINE}`}}/>)}</div>
            </div>)}
            {insp.comment&&<p className="text-sm mb-3"><strong>Commentaire général : </strong>{insp.comment}</p>}
            {insp.signature&&(<div><p className="text-xs mb-1" style={{color:MUTED}}>Signature</p><img src={insp.signature} className="rounded" style={{border:`1px solid ${LINE}`,maxWidth:300}}/></div>)}
          </>); })()}
        </div>)}

        {/* ════════════ ONGLET SALLES / LOCAUX ════════════ */}
        {tab==='salles'&&(<div className="no-print">
          {!salleDraft?(
            <Btn onClick={openNewSalle} variant="dark" className="mb-4">+ Nouvelle salle</Btn>
          ):(
            <div className="rounded p-4 mb-5" style={{border:`1px solid ${LINE}`,backgroundColor:CARD}}>
              {salleDraft.id&&<div className="flex items-center justify-between mb-3 px-3 py-1.5 rounded text-xs" style={{backgroundColor:PAPER}}>
                <span>Modification de <strong>{salleDraft.numero}</strong></span>
                <button onClick={cancelSalle} className="underline" style={{color:MUTED}}>Annuler</button>
              </div>}
              <div className="flex gap-2 mb-2">
                <Inp value={salleDraft.numero} onChange={e=>setSalleDraft(p=>({...p,numero:e.target.value}))} placeholder="Numéro / nom (ex: B12)"/>
                <select value={salleDraft.nature} onChange={e=>setSalleDraft(p=>({...p,nature:e.target.value}))} className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}>
                  <option value="">Nature</option>
                  {natures.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mb-2">
                <Inp value={newNature} onChange={e=>setNewNature(e.target.value)} placeholder="Nouvelle nature (ex: Internat, Gymnase…)"/>
                <Btn onClick={addNature} className="whitespace-nowrap">+ Créer la nature</Btn>
              </div>
              <div className="flex gap-2 mb-2">
                <Inp value={salleDraft.vpi} onChange={e=>setSalleDraft(p=>({...p,vpi:e.target.value}))} placeholder="Modèle de VPI"/>
                <input type="number" value={salleDraft.surface} onChange={e=>setSalleDraft(p=>({...p,surface:e.target.value}))} placeholder="Surface (m²)" className="px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE,width:140}}/>
              </div>
              <div className="flex gap-2 mb-2">
                <Inp value={salleDraft.vpiNumero} onChange={e=>setSalleDraft(p=>({...p,vpiNumero:e.target.value}))} placeholder="Numéro de VPI"/>
                <input type="date" value={salleDraft.vpiDate} onChange={e=>setSalleDraft(p=>({...p,vpiDate:e.target.value}))} className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}/>
              </div>
              <div className="flex gap-2 mb-2 items-center">
                <input type="number" min="0" value={salleDraft.ordiNombre} onChange={e=>setSalleDraft(p=>({...p,ordiNombre:e.target.value}))} placeholder="Nombre d'ordinateurs" className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}/>
                <input type="date" value={salleDraft.ordiDate} onChange={e=>setSalleDraft(p=>({...p,ordiDate:e.target.value}))} className="flex-1 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}/>
                <label className="text-xs whitespace-nowrap flex items-center gap-1.5">Vélos pupitre
                  <input type="number" min="0" value={salleDraft.velo} onChange={e=>setSalleDraft(p=>({...p,velo:parseInt(e.target.value)||0}))} className="w-16 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}/>
                </label>
              </div>
              {salleDraft.custom.length>0&&<div className="mb-2">{salleDraft.custom.map((f,i)=>(
                <div key={i} className="flex justify-between items-center text-xs py-1">
                  <span>{f.key} : {f.value}</span>
                  <button onClick={()=>remCustomField(i)} className="text-xs" style={{color:WARN}}>Retirer</button>
                </div>
              ))}</div>}
              <div className="flex gap-2 mb-3">
                <Inp value={newCustomKey} onChange={e=>setNewCustomKey(e.target.value)} placeholder="Champ libre (ex: nombre de places)"/>
                <Inp value={newCustomVal} onChange={e=>setNewCustomVal(e.target.value)} placeholder="Valeur"/>
                <Btn onClick={addCustomField}>+</Btn>
              </div>
              <div className="flex justify-end"><Btn onClick={saveSalle} variant="dark">{salleDraft.id?'Mettre à jour la salle':'Enregistrer la salle'}</Btn></div>
            </div>
          )}

          {salles.length===0?<Empty>Aucune salle enregistrée.</Empty>:(
            <div className="space-y-2">{salles.map(s=>(
              <div key={s.id} className="p-3 rounded" style={{backgroundColor:CARD,border:`1px solid ${LINE}`}}>
                <div onClick={()=>setOpenSalleId(p=>p===s.id?null:s.id)} className="cursor-pointer">
                  <p className="text-sm font-medium">{s.numero}{s.nature?' — '+s.nature:''}</p>
                  <p className="text-xs" style={{color:MUTED}}>Toucher pour voir le détail</p>
                </div>
                {openSalleId===s.id&&(<div className="mt-2 pt-2" style={{borderTop:`1px solid ${LINE}`}}>
                  <p className="text-xs mb-1"><strong>Nature :</strong> {s.nature||'—'}</p>
                  <p className="text-xs mb-1"><strong>Surface :</strong> {s.surface?s.surface+' m²':'—'}</p>
                  <p className="text-xs mb-1"><strong>VPI :</strong> {s.vpi||'—'}{s.vpiNumero?` (n° ${s.vpiNumero})`:''}{s.vpiDate?` — installé le ${fmtDate(s.vpiDate)}`:''}</p>
                  <p className="text-xs mb-1"><strong>Ordinateurs :</strong> {s.ordiNombre||'—'}{s.ordiDate?` — installés le ${fmtDate(s.ordiDate)}`:''}</p>
                  <p className="text-xs mb-1"><strong>Vélos pupitre :</strong> {s.velo||0}</p>
                  {(s.custom||[]).map((f,i)=><p key={i} className="text-xs mb-1"><strong>{f.key} :</strong> {f.value}</p>)}
                  {s.historique?.length>0&&(<>
                    <p className="text-xs mt-2 mb-1"><strong>Historique des changements :</strong></p>
                    {[...s.historique].reverse().map((h,i)=><p key={i} className="text-xs" style={{color:MUTED}}>{fmtDate(h.date)} — {h.champ} : {h.avant} → {h.apres}</p>)}
                  </>)}
                  <div className="flex gap-2 mt-2">
                    <Btn onClick={()=>openEditSalle(s)}>Modifier</Btn>
                    <Btn onClick={()=>delSalle(s.id)}>Supprimer</Btn>
                  </div>
                </div>)}
              </div>
            ))}</div>
          )}
        </div>)}

        {/* ════════════ MODALES (Calendrier / Planning) ════════════ */}
        {modal&&(<div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{backgroundColor:'rgba(43,40,36,0.4)'}}>
          <div className="w-full max-w-lg rounded p-4 sm:p-5 max-h-screen overflow-y-auto" style={{backgroundColor:CARD}}>

            {modal.type==='task'&&(<>
              <h2 className="font-serif text-lg mb-3">{modal.eid?'Modifier':'Nouvelle'} échéance</h2>
              <Lbl c="Intitulé"/><Inp value={modal.draft.title} onChange={e=>setModal(m=>({...m,draft:{...m.draft,title:e.target.value}}))} className="mb-3"/>
              <Lbl c="Catégorie"/>
              <div className="flex flex-wrap gap-1.5 mb-3">{categories.map(cat=>(
                <button key={cat.id} onClick={()=>setModal(m=>({...m,draft:{...m.draft,categoryId:cat.id}}))}
                  className="px-2 py-1 rounded text-xs font-mono uppercase tracking-wide border"
                  style={modal.draft.categoryId===cat.id?{backgroundColor:cat.color,borderColor:cat.color,color:CARD}:{borderColor:cat.color}}>{cat.label}</button>
              ))}</div>
              <Lbl c="Périodes"/>
              <div className="flex flex-wrap gap-1.5 mb-3">{periods.map(p=>(
                <button key={p.id} onClick={()=>togPerDraft(p.id)} className="px-2 py-1 rounded text-xs font-mono uppercase border"
                  style={modal.draft.periodIds.includes(p.id)?{backgroundColor:INK,color:PAPER,borderColor:INK}:{borderColor:LINE}}>{p.label}</button>
              ))}</div>
              <Lbl c="Responsable"/><Inp value={modal.draft.responsable} onChange={e=>setModal(m=>({...m,draft:{...m.draft,responsable:e.target.value}}))} className="mb-3"/>
              <Lbl c="Note"/><Inp value={modal.draft.note} onChange={e=>setModal(m=>({...m,draft:{...m.draft,note:e.target.value}}))} className="mb-3"/>
              <Lbl c="Sous-tâches"/>
              <div className="mb-2 space-y-1">{(modal.draft.subtasks||[]).map((s,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <span style={{color:catLookup(modal.draft.categoryId).color,flexShrink:0}}>›</span>
                  <input value={s} onChange={e=>updSub(i,e.target.value)} className="flex-1 px-2 py-1 rounded border text-xs bg-white" style={{borderColor:LINE}}/>
                  <button onClick={()=>remSub(i)} className="text-xs" style={{color:WARN}}>✕</button>
                </div>))}</div>
              <div className="flex gap-2 mb-4">
                <input value={modal.newSub} onChange={e=>setModal(m=>({...m,newSub:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addSub()} placeholder="Nouvelle sous-tâche… (Entrée)" className="flex-1 px-2 py-1 rounded border text-xs bg-white" style={{borderColor:LINE}}/>
                <button onClick={addSub} className="px-2 py-1 text-xs rounded border" style={{borderColor:LINE}}>+ Ajouter</button>
              </div>
              <Lbl c="📎 Note / modèle de document"/>
              <textarea value={modal.draft.docNote||''} onChange={e=>setModal(m=>({...m,draft:{...m.draft,docNote:e.target.value}}))}
                placeholder="Modèle de courrier, procédure…" rows={3} className="w-full mb-4 px-2 py-1.5 rounded border text-xs bg-white resize-y" style={{borderColor:LINE}}/>
            </>)}

            {modal.type==='cat'&&(<>
              <h2 className="font-serif text-lg mb-3">{modal.eid?'Modifier':'Nouvelle'} catégorie</h2>
              <Lbl c="Nom"/><Inp value={modal.draft.label} onChange={e=>setModal(m=>({...m,draft:{...m.draft,label:e.target.value}}))} className="mb-3"/>
              <Lbl c="Couleur"/>
              <div className="flex flex-wrap gap-2 mb-4">{PALETTE.map(c=><button key={c} onClick={()=>setModal(m=>({...m,draft:{...m.draft,color:c}}))} className="w-6 h-6 rounded-full border-2" style={{backgroundColor:c,borderColor:modal.draft.color===c?INK:'transparent'}}></button>)}</div>
            </>)}

            {modal.type==='per'&&(<>
              <h2 className="font-serif text-lg mb-3">{modal.eid?'Modifier':'Nouvelle'} période</h2>
              <Lbl c="Nom"/><Inp value={modal.draft.label} onChange={e=>setModal(m=>({...m,draft:{...m.draft,label:e.target.value}}))} className="mb-3"/>
              <Lbl c="Dates affichées"/><Inp value={modal.draft.range} onChange={e=>setModal(m=>({...m,draft:{...m.draft,range:e.target.value}}))} className="mb-3"/>
              <Lbl c="Date de début — alertes (AAAA-MM-JJ)"/><Inp value={modal.draft.startDate||''} onChange={e=>setModal(m=>({...m,draft:{...m.draft,startDate:e.target.value}}))} placeholder="2026-11-02" className="mb-4"/>
            </>)}

            {modal.type==='agent'&&(<>
              <h2 className="font-serif text-lg mb-3">{modal.eid?'Modifier':'Nouvel'} agent</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><Lbl c="Nom"/><Inp value={modal.draft.nom} onChange={e=>setModal(m=>({...m,draft:{...m.draft,nom:e.target.value}}))}/></div>
                <div><Lbl c="Prénom"/><Inp value={modal.draft.prenom} onChange={e=>setModal(m=>({...m,draft:{...m.draft,prenom:e.target.value}}))}/></div>
              </div>
              <Lbl c="Fonction"/>
              <div className="flex flex-wrap gap-1.5 mb-3">{fonctions.map(f=>(
                <button key={f.id} onClick={()=>setModal(m=>({...m,draft:{...m.draft,fonctionId:f.id}}))}
                  className="px-2 py-1 rounded text-xs font-mono uppercase border"
                  style={modal.draft.fonctionId===f.id?{backgroundColor:f.color,borderColor:f.color,color:CARD}:{borderColor:f.color}}>{f.label}</button>
              ))}</div>
              <Lbl c="Taux d'emploi (%)"/>
              <input type="number" min="10" max="100" step="10" value={modal.draft.taux} onChange={e=>setModal(m=>({...m,draft:{...m.draft,taux:parseInt(e.target.value)||100}}))} className="w-24 mb-3 px-2 py-1.5 rounded border text-sm bg-white" style={{borderColor:LINE}}/>
              <Lbl c="Note"/><Inp value={modal.draft.note||''} onChange={e=>setModal(m=>({...m,draft:{...m.draft,note:e.target.value}}))} className="mb-4"/>
            </>)}

            {modal.type==='gabarit'&&(<>
              <h2 className="font-serif text-lg mb-1">Gabarit — {modal.aLabel}</h2>
              <p className="text-xs mb-3" style={{color:MUTED}}>Horaire théorique hebdomadaire. Base de calcul pour les compteurs.</p>
              {JOURS.map((jour,ji)=>{ const g=modal.draft[ji]||{debut:'',fin:'',repos:false}; return(
                <div key={ji} className="flex items-center gap-3 mb-2">
                  <div className="w-16 text-sm font-medium">{jour}</div>
                  <label className="flex items-center gap-1.5 text-xs" style={{color:MUTED}}>
                    <input type="checkbox" checked={g.repos||false} onChange={e=>setModal(m=>{const d=[...m.draft];d[ji]={...d[ji],repos:e.target.checked};return{...m,draft:d};})}/>Repos
                  </label>
                  {!g.repos&&(<>
                    <input value={g.debut||''} onChange={e=>setModal(m=>{const d=[...m.draft];d[ji]={...d[ji],debut:e.target.value};return{...m,draft:d};})} placeholder="07h30" className="w-20 px-2 py-1.5 rounded border text-sm bg-white text-center" style={{borderColor:LINE}}/>
                    <span style={{color:MUTED}}>–</span>
                    <input value={g.fin||''} onChange={e=>setModal(m=>{const d=[...m.draft];d[ji]={...d[ji],fin:e.target.value};return{...m,draft:d};})} placeholder="15h30" className="w-20 px-2 py-1.5 rounded border text-sm bg-white text-center" style={{borderColor:LINE}}/>
                    <span className="text-xs" style={{color:MUTED}}>= {minToH(Math.max(0,toMin(g.fin)-toMin(g.debut)))}</span>
                  </>)}
                </div>); })}
              <div className="mt-1 mb-4 text-xs" style={{color:MUTED}}>
                Total théo : <strong>{minToH(modal.draft.reduce((acc,g)=>!g.repos?acc+Math.max(0,toMin(g.fin)-toMin(g.debut)):acc,0))}</strong>/semaine
              </div>
            </>)}

            {modal.type==='fn'&&(<>
              <h2 className="font-serif text-lg mb-3">{modal.eid?'Modifier':'Nouvelle'} fonction</h2>
              <Lbl c="Libellé"/><Inp value={modal.draft.label} onChange={e=>setModal(m=>({...m,draft:{...m.draft,label:e.target.value}}))} className="mb-3"/>
              <Lbl c="Couleur"/>
              <div className="flex flex-wrap gap-2 mb-4">{PALETTE.map(c=><button key={c} onClick={()=>setModal(m=>({...m,draft:{...m.draft,color:c}}))} className="w-6 h-6 rounded-full border-2" style={{backgroundColor:c,borderColor:modal.draft.color===c?INK:'transparent'}}></button>)}</div>
            </>)}

            <div className="flex justify-between items-center">
              {modal.eid&&modal.type!=='gabarit'?<button onClick={deleteModal} className="text-xs underline" style={{color:WARN}}>Supprimer</button>:<span></span>}
              <div className="flex gap-2">
                <button onClick={closeModal} className="px-3 py-1.5 text-sm rounded border" style={{borderColor:LINE}}>Annuler</button>
                <button onClick={saveModal} className="px-3 py-1.5 text-sm rounded" style={{backgroundColor:INK,color:PAPER}}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>)}

        {/* Modale note/doc */}
        {docModal&&(<div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{backgroundColor:'rgba(43,40,36,0.4)'}}>
          <div className="w-full max-w-xl rounded p-4 sm:p-5 max-h-screen overflow-y-auto" style={{backgroundColor:CARD}}>
            <div className="flex items-start justify-between mb-3">
              <div><h2 className="font-serif text-lg">📎 {docModal.task.title}</h2><p className="text-xs mt-0.5" style={{color:MUTED}}>Note / modèle de document</p></div>
              <button onClick={()=>setDocModal(null)} className="text-sm ml-4" style={{color:MUTED}}>✕</button>
            </div>
            <pre className="text-xs rounded p-3 whitespace-pre-wrap" style={{backgroundColor:PAPER,border:`1px solid ${LINE}`,color:INK,fontFamily:'inherit',lineHeight:'1.6'}}>{docModal.task.docNote}</pre>
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={()=>navigator.clipboard?.writeText(docModal.task.docNote)} className="px-3 py-1.5 text-xs rounded border" style={{borderColor:LINE}}>Copier</button>
              <button onClick={()=>{setDocModal(null);openEditTask(docModal.task);}} className="px-3 py-1.5 text-xs rounded border" style={{borderColor:LINE}}>Modifier</button>
              <button onClick={()=>setDocModal(null)} className="px-3 py-1.5 text-xs rounded" style={{backgroundColor:INK,color:PAPER}}>Fermer</button>
            </div>
          </div>
        </div>)}

        <p className="text-xs mt-6 no-print" style={{color:MUTED}}>
          Collège Jehan Froissart · Quiévrechain — Intendance · Données stockées localement, pensez à exporter régulièrement.
        </p>
      </div>
    </div>
  );
}
