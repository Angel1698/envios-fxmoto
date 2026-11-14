/* Reparación 14-nov-2026: en celular el buscador quedaba aplastado junto al resumen del envío (no se veía lo que se escribe). El resumen va en su propio renglón y el buscador + Escanear abajo, a todo lo ancho. */
(()=>{if(document.getElementById('fx-sbar-fix'))return;const s=document.createElement('style');s.id='fx-sbar-fix';s.textContent='.sbar{flex-wrap:wrap!important}.sbar>.stk{flex:1 1 100%!important;min-width:100%!important;margin-bottom:2px}.sbar>input.q{flex:1 1 140px!important;min-width:0!important;width:auto!important}.sbar>.fxscan{flex:0 0 auto}';(document.head||document.documentElement).appendChild(s);})();
/* Puente de la página existente al mismo avance compartido de la app. */
(()=>{
 if(window.__fxAppPageSync)return;window.__fxAppPageSync=true;
 function connect(){
  if(typeof store==='undefined'||!window.FXS)return;
  let button;
  function changed(){if(document.body.classList.contains('rlbody'))return;if(!button){button=document.createElement('button');button.type='button';button.className='btn';button.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9998';button.textContent='Hay avance nuevo · actualizar vista';button.onclick=()=>{button.remove();button=null;if(typeof route==='function')route();};document.body.appendChild(button);}}
  const watched=new Set();store.get=k=>{const value=window.FXS.get(k);if(!watched.has(k)){watched.add(k);window.FXS.on(k,changed);}return value;};store.set=(k,v)=>window.FXS.set(k,v);
  if(typeof route==='function'&&!document.body.classList.contains('rlbody'))route();
 }
 if(window.FXS){connect();return;}
 const script=document.createElement('script');script.src='fxsync.js';script.onload=connect;script.onerror=()=>console.error('No se pudo conectar el avance compartido.');document.head.appendChild(script);
})();
