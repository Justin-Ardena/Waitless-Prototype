// Route geometry, vehicle status, ETA with traffic, fares

const rt=(s,id)=>s.routes.find(r=>r.id===id);

const plen=r=>r.pts.slice(1).reduce((a,q,i)=>a+Math.hypot(q[0]-r.pts[i][0],q[1]-r.pts[i][1]),0);

function pos(r,p){if(!r)return null;const L=plen(r);let d=Math.max(0,Math.min(1,p))*L;for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=l||i==r.pts.length-1){const k=l?Math.min(1,d/l):0;return[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]}d-=l}}

const SPEED=6;

function info(v){const stale=now()-v.lastAt>8000,seat=v.avail==null?'Unknown':v.avail===0?'Full':v.avail<=8?'Limited Seats':'Seats Available';
const label=stale?'Stale Data':v.status;const col=stale?'gr':v.status==='Out of Service'?'er':v.status==='At Terminal'?'pr':'ok';
return{stale,seat,label,col,seatCol:seat==='Unknown'?'gr':seat==='Full'?'er':seat==='Limited Seats'?'wa':'ok'}}

const TF={Heavy:2,Moderate:1.4,Light:1};

function tfac(s,rid){const L=s.traffic.filter(t=>t.routeId===rid).map(t=>t.level);const lv=L.includes('Heavy')?'Heavy':L.includes('Moderate')?'Moderate':L.includes('Light')?'Light':null;return{lv,f:lv?TF[lv]:1}}

function etaInfo(s,v,pk){const r=rt(s,v.routeId);if(!r||!pk||info(v).stale||v.status==='Out of Service'||v.p==null)return null;const m=Math.abs(pk.p-v.p)*plen(r)/SPEED/6,t=tfac(s,r.id);return{base:m,adj:m*t.f,lv:t.lv,f:t.f}}

const fm=m=>m<1?'<1 min':Math.round(m)+' min';

function eta(s,v,pk){const e=etaInfo(s,v,pk);if(!e)return'ETA unavailable';return'Simulated ETA: '+fm(e.adj)+(e.lv&&e.f>1?` — due to ${e.lv.toLowerCase()} traffic congestion (+${fm(e.adj-e.base)}; ${fm(e.base)} without traffic)`:e.lv?' — light traffic, no delay':' — no traffic report')}

const FD={base:15,km:4,per:2.5,disc:20};

const fareFor=(s,r,a,b)=>{const F=s.fare||FD,km=Math.abs(b-a)*plen(r)*0.1,f=F.base+Math.max(0,km-F.km)*F.per;return{km,reg:Math.round(f),dis:Math.round(f*(1-F.disc/100))}};
