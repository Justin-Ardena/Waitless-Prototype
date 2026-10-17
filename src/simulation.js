// Simulated GPS/LoRaWAN movement and approaching-vehicle alerts

setInterval(()=>{if(!S.sim)return;set(s=>{const t=now(),toasts=[...s.toasts];const vs=s.vehicles.map(v=>{let n={...v};if(s.link&&!v.mute){n.lastAt=t;if(v.status==='On Route'){n.p=v.p+v.dir*.02;if(n.p>=1){n.p=1;n.dir=-1}if(n.p<=0){n.p=0;n.dir=1}}}return n});
const watch=s.watch.map(w=>{const v=vs.find(x=>x.id===w.vid);if(!w.fired&&v&&!info(v).stale&&Math.abs(v.p-w.p)<.08){toasts.unshift({id:'n'+t+w.vid,msg:`${v.unit} is approaching ${w.pn}.`});return{...w,fired:true}}return w});
return{...s,vehicles:vs,watch,toasts:toasts.slice(0,4)}})},1500);
