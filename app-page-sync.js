/* Reparación 14-nov-2026: en celular el buscador quedaba aplastado junto al resumen del envío (no se veía lo que se escribe). El resumen va en su propio renglón y el buscador + Escanear abajo, a todo lo ancho. */
(()=>{if(document.getElementById('fx-sbar-fix'))return;const s=document.createElement('style');s.id='fx-sbar-fix';s.textContent='.sbar{flex-wrap:wrap!important}.sbar>.stk{flex:1 1 100%!important;min-width:100%!important;margin-bottom:2px}.sbar>input.q{flex:1 1 140px!important;min-width:0!important;width:auto!important}.sbar>.fxscan{flex:0 0 auto}';(document.head||document.documentElement).appendChild(s);})();
/* Reparación 18-nov-2026 (reporte de Paola y Yuri):
   1) En la vista de factura, cada renglón "Envío N" muestra a qué Código ML va (sirve para compuestos, "sobre" y "por").
   2) En la vista de envío, cada pieza muestra "Separado en la factura" cuando ya se palomeó "Ya separado" en la página de esa factura. */
(()=>{
 if(window.__fxRep18)return;window.__fxRep18=true;
 const css='.fxcml{font-weight:700;color:var(--ink,#111)}.fxsep{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;font-size:11.5px;font-weight:700;background:#DDF1E3;color:#1F7A3E;white-space:nowrap}';
 const st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
 const getIso=()=>{try{return ISO}catch(e){return null}};
 const getData=()=>{try{return DATA}catch(e){return null}};
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const sget=k=>{try{if(typeof store!=='undefined'&&store.get)return store.get(k)||{};if(window.FXS)return window.FXS.get(k)||{}}catch(e){}return {}};
 function factura(D,iso){
  const F=D.facturas&&D.facturas[iso.key];if(!F||!F.items)return;
  const byCode={};F.items.forEach(i=>{(byCode[i.code]=byCode[i.code]||[]).push(i)});
  document.querySelectorAll('article.card').forEach(card=>{
   const ce=card.querySelector('.top .code');if(!ce)return;const its=byCode[ce.textContent.trim()];if(!its)return;
   const dest=its.flatMap(i=>i.dest||[]);
   card.querySelectorAll('.rows .row').forEach(row=>{
    if(row.querySelector('.fxcml'))return;const lb=row.querySelector('.lbl');if(!lb)return;
    const m=lb.textContent.match(/^Env[ií]o\s+(\S+)/);if(!m)return;const env=m[1];
    const sp=!!row.querySelector('.ttag');
    let ds=dest.filter(d=>d.env===env&&((d.tp||'I')!=='I')===sp);if(!ds.length)ds=dest.filter(d=>d.env===env);
    const cmls=[...new Set(ds.map(d=>d.cml).filter(Boolean))];if(!cmls.length)return;
    const det=row.querySelector('.det')||row;const x=document.createElement('span');x.className='fxcml';
    x.innerHTML=' · Código ML: '+cmls.map(esc).join(', ');det.appendChild(x);
   });
  });
 }
 function envio(D,iso){
  const E=D.envios&&D.envios[iso.key];if(!E||!E.lines)return;
  const cache={};const isDone=(fk,code)=>{if(!fk)return false;cache[fk]=cache[fk]||sget('fx-f-'+fk);return !!cache[fk][code]};
  document.querySelectorAll('article.card').forEach(card=>{
   const cb=card.querySelector('input[type=checkbox][data-k]');if(!cb)return;
   const [cml,codes]=String(cb.dataset.k).split('|');
   const ln=E.lines.find(l=>l.cml===cml&&(!codes||l.comps.map(c=>c.code).join('+')===codes))||E.lines.find(l=>l.cml===cml);if(!ln)return;
   ln.comps.forEach(c=>{
    if(!isDone(c.fk,c.code))return;
    const els=[...card.querySelectorAll('.source-code,.rows .row .lbl')].filter(el=>el.textContent.replace(/^Pieza \d+:\s*/,'').trim()===c.code);
    els.forEach(el=>{if(el.parentNode.querySelector('.fxsep'))return;const t=document.createElement('span');t.className='fxsep';t.textContent='Separado en la factura';el.insertAdjacentElement('afterend',t)});
   });
  });
 }
 let tm=null;
 function run(){tm=null;const iso=getIso(),D=getData();if(!iso||!D)return;try{if(iso.k==='f')factura(D,iso);else if(iso.k==='e')envio(D,iso)}catch(e){console.error('fx-rep18',e)}}
 const kick=()=>{if(!tm)tm=setTimeout(run,120)};
 const start=()=>{new MutationObserver(kick).observe(document.body,{childList:true,subtree:true});kick()};
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();
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
/* Reparación 24-nov-2026 (reporte de Yuri y Angel, etiquetas):
   1) "SOBRE n" (pieza individual que el proveedor vende en paquete): la leyenda decía "1 PZ = n UNIDADES" y confundía;
      ahora dice cuántas piezas se toman por etiqueta (según la instrucción del SKU, normalmente 1).
      "POR n" queda como "TOMAR n PZ POR ETIQUETA".
   2) Sustitutos: en la etiqueta el SKU sale con el código de la pieza que se surte (sustituto), no con el código original. */
(()=>{
 if(window.__fxRep24)return;window.__fxRep24=true;
 const AB={ALESSIA:'ALM',REFACOM:'MTM',ITALIKA:'ITK',MRM:'MRM',KINGMOTO:'KM',TMMP:'TMMP',MAZ:'MAM',SAYTO:'SYM'};
 const tomar=e=>{const m=String(e.sku||'').match(/TOMA[RN]?\s+(?:SOLO\s+)?(\d+)\s*PZ/i);return m?+m[1]:1};
 const has=(s,c)=>(' '+s.toUpperCase()+' ').includes(' '+String(c).toUpperCase()+' ');
 function skuReal(e){
  let s=String(e.sku||'').trim();const cs=e.comps||[];
  if(!s)return cs.map(c=>c.code).join(' + ');
  for(const c of cs){
   if(has(s,c.code))continue;
   const m=String(c.sust||'').match(/^en lugar de\s+(.+)$/i);
   if(m&&has(s,m[1].trim())){s=(' '+s+' ').replace(' '+m[1].trim()+' ',' '+c.code+' ').trim();continue}
   if(cs.length===1){const t=s.split(/\s+/);if(t.length>=3){const sup=String(c.fk||'').split('-')[1]||'';if(AB[sup])t[1]=AB[sup];t[2]=c.code;s=t.join(' ')}}
  }
  return s;
 }
 const fix=e=>e?Object.assign({},e,{sku:skuReal(e)}):e;
 try{
  if(typeof typeLine==='function'){const o=typeLine;window.typeLine=function(e){
   if(e&&e.tp==='S'){const n=tomar(e);return {rev:1,text:`INDIVIDUAL · TOMAR ${n} PZ`}}
   if(e&&e.tp==='P')return {rev:1,text:`TOMAR ${e.nf} PZ POR ETIQUETA`};
   return o.apply(this,arguments)}}
  if(typeof zplSeg==='function'){const o=zplSeg;window.zplSeg=function(g){return o.call(this,Object.assign({},g,{e:fix(g.e)}))}}
  if(typeof labelSVG==='function'){const o=labelSVG;window.labelSVG=function(e,sn,ref){return o.call(this,fix(e),sn,ref)}}
 }catch(err){console.error('fx rep24',err)}
})();
