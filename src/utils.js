// Helpers: React shortcut, storage key, time formatting

const h=React.createElement,{useState,useSyncExternalStore}=React,K='waitless-demo-v1',now=()=>Date.now();

const ago=t=>{const s=Math.round((now()-t)/1000);return s<60?s+'s ago':Math.round(s/60)+'m ago'};

const PK=(a)=>a.map(([n,p])=>({n,p}));
