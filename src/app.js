// Display Views selector, demo controls, app shell

const MODES=[['all','All Views',['c','o','p']],['c','Commuter Only',['c']],['o','Cooperative Only',['o']],['p','PAO Only',['p']],['co','Commuter + Cooperative',['c','o']],['cp','Commuter + PAO',['c','p']],['op','Cooperative + PAO',['o','p']]];

const TITLE={c:'Commuter App',o:'Cooperative Dashboard',p:'PAO Mobile Dashboard'},COMP={c:Commuter,o:Coop,p:PAO};

function Demo(){const s=useS(),first=id=>s.vehicles.find(v=>v.id===id)||s.vehicles[0];
const A=(l,f)=>h('button',{onClick:()=>set(f)},l);
return h('div',{className:'c',style:{margin:'0 12px'}},h('div',{className:'row'},h('b',null,'Demo controls'),
A(s.sim?'Pause movement':'Start movement',x=>({...x,sim:!x.sim})),
A('Vehicle out of service',x=>{const v=x.vehicles.find(v=>v.status==='On Route');return v?{...x,vehicles:x.vehicles.map(y=>y.id===v.id?{...y,status:'Out of Service'}:y),alerts:[{id:'a'+now(),type:'Out of Service',vehicleId:v.id,msg:v.unit+' is Out of Service.',sev:'High',at:now(),status:'Open'},...x.alerts]}:x}),
A('Raise demand',x=>({...x,demand:x.demand.map((d,i)=>i===1?{...d,count:d.count+20,level:'High',at:now()}:d),alerts:[{id:'a'+now(),type:'High Demand',msg:'High passenger demand at SM City pickup.',sev:'High',at:now(),status:'Open'},...x.alerts]})),
A('Heavy traffic',x=>({...x,traffic:x.traffic.map((t,i)=>i===0?{...t,level:'Heavy',at:now(),src:'Simulated'}:t)})),
A('Limited seats',x=>{const v=x.vehicles.find(v=>v.status==='On Route');return v?{...x,vehicles:x.vehicles.map(y=>y.id===v.id?{...y,avail:3,seatSrc:'Simulated'}:y)}:x}),
A(s.link?'Cut LoRaWAN link':'Restore link',x=>({...x,link:!x.link})),
A('PAO sample report',x=>({...x,obs:[{id:'o'+now(),type:'Jeepney Shortage',loc:'Mandurriao',sev:'High',desc:'Few units arriving, long wait.',at:now()},...x.obs]})),
A('Reset demo data',x=>confirm('Reset all demo data?')?seed():x),
h('button',{className:'x',onClick:()=>{if(confirm('Clear local data and start fresh?')){try{localStorage.removeItem(K)}catch(e){}S=seed();save();subs.forEach(c=>c())}}},'Clear local data')),
h('div',{className:'mu'},'Simulated flow: GPS device → LoRaWAN → gateway → network server → WaitLess → interfaces. No hardware is connected, data is not verified live information, and it is stored only in this browser.'))}

function App(){const s=useS(),[open,setO]=useState(false),m=MODES.find(x=>x[0]===s.mode)||MODES[0],vis=m[2];
return h('div',null,h('header',null,h('span',{className:'logo'},'W'),h('div',{className:'brand'},h('b',null,'WaitLess'),h('small',null,'Modernized Jeepney Info System')),h('span',{className:'tag d'},'DEMO MODE'),h('span',{className:'tag'},'LOCAL DATA'),h('span',{className:'tag'},s.link?'Simulated link: connected':'Simulated link: down'),h('span',{className:'sp'}),
h('button',{onClick:()=>set(x=>({...x,phone:x.phone===false}))},'Device frames: '+(s.phone===false?'Off':'On')),h('button',{onClick:()=>set(x=>({...x,mode:'all'}))},'Reset Layout'),
h('div',{className:'dd'},h('button',{'aria-haspopup':'menu','aria-expanded':open,onClick:()=>setO(!open),onKeyDown:e=>e.key==='Escape'&&setO(false)},'Display Views ▾'),open&&h('div',{className:'menu',role:'menu'},MODES.map(o=>h('button',{key:o[0],role:'menuitem',onClick:()=>{set(x=>({...x,mode:o[0]}));setO(false)}},(o[0]===s.mode?'✓ ':'   ')+o[1]))))),
h('div',{className:'mu',style:{padding:'6px 14px'}},'Your Ride, Closer Than You Think. · Showing: '+m[1]+' · Simulated data stored in this browser only.'),
h(Demo),
h('div',{className:'grid',style:s.phone!==false?{}:{gridTemplateColumns:`repeat(auto-fit,minmax(${vis.length>2?'320px':'360px'},1fr))`},className:'grid'+(s.phone!==false?' fr':'')},['c','o','p'].map(k=>{const C=COMP[k];return h('div',{key:k,className:s.phone!==false&&k==='o'?'devm':'',style:{display:vis.includes(k)?'block':'none'}},h('section',{key:k,className:'panel'+(s.phone!==false?(k==='o'?' mon':' ph'):''),style:{display:vis.includes(k)?'block':'none'},'aria-label':TITLE[k]},h('h2',null,h('span',{className:'ico'},{c:'📱',o:'🖥️',p:'📍'}[k]),h('span',null,TITLE[k],h('small',null,{c:'For passengers',o:'Fleet operations',p:'Field monitoring'}[k])),h('span',{className:'tag live'},'SIMULATED')),h(C)))}),s.second&&vis.includes('o')&&h(SecondScreen)))}
