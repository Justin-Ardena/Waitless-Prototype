// Shared store: localStorage persistence + subscription (useS/set)

let S=(()=>{try{const j=JSON.parse(localStorage.getItem(K));if(j&&j.v===2&&Array.isArray(j.vehicles)&&Array.isArray(j.routes))return j}catch(e){}return seed()})();

const subs=new Set();

const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};

const set=f=>{S=f({...S});save();subs.forEach(s=>s())};

const useS=()=>useSyncExternalStore(c=>(subs.add(c),()=>subs.delete(c)),()=>S);

window.addEventListener('storage',e=>{if(e.key===K){try{S=JSON.parse(e.newValue);subs.forEach(s=>s())}catch(x){}}});
