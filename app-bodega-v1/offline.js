/* Cola persistente, aislada de la prueba y de las páginas existentes. */
window.FXAPP=(()=>{
 const BOD=ISO.key, VERSION=1;let db,busy=false,sequence=0,lastError='',arrivalError='',progress={},pendingSaves=0;
 const ready=new Promise((resolve,reject)=>{const q=indexedDB.open('fx-bodega-operativa-v1',1);q.onupgradeneeded=()=>{for(const name of ['ops','receipts','meta','progress'])q.result.createObjectStore(name,{keyPath:'id'});};q.onsuccess=()=>{db=q.result;resolve();};q.onerror=()=>reject(q.error);});
 const get=async(store,id)=>{await ready;return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});};
 const all=async store=>{await ready;return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});};
 const commit=async changes=>{await ready;return new Promise((resolve,reject)=>{const tx=db.transaction([...new Set(changes.map(x=>x[0]))],'readwrite');for(const [s,id,v]of changes){const o=tx.objectStore(s);v===undefined?o.delete(id):o.put({...v,id});}tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('No se pudo guardar en el dispositivo.'));tx.onerror=()=>reject(tx.error);});};
 const clone=o=>JSON.parse(JSON.stringify(o));
 const readEpoch=new Map();const nextRead=id=>{const n=(readEpoch.get(id)||0)+1;readEpoch.set(id,n);return n;};
 const uuid=()=>crypto.randomUUID().replace(/-/g,'');
 const user=()=>{try{return JSON.parse(localStorage.getItem('fx-app-lu-'+BOD)||'null');}catch(_){return null;}};
 const can=action=>{const u=user();if(!u||!(u.puede||[]).includes(action))throw Error('Tu usuario no puede '+action+' llegadas.');return u;};
 async function network(accion,fields={},credentials){await window.FXDevice?.ready;if(!navigator.onLine)throw Error('Sin conexión. El trabajo sigue guardado en el dispositivo.');const u=credentials||user();if(!u)throw Error('Inicia sesión con internet antes de salir a recibir.');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);try{const request={tipo:'app',version:VERSION,accion,bod:BOD,usuario:u.usuario,clave:u.clave,dispositivo:window.FXDevice?.current(),...fields};let j;if(window.FXBackground?.enabled&&typeof FXBackground.read==='function'&&['llegadas','detalle'].includes(accion)){j=await FXBackground.read(request);}else{const r=await fetch(window.FX_SYNC_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},signal:controller.signal,body:JSON.stringify(request)});if(!r.ok)throw Error('No responde el servidor ('+r.status+').');j=await r.json();}if(!j.ok){const e=Error(j.error||'El servidor rechazó la operación.');e.code=j.code||'SERVIDOR';throw e;}if(accion==='sesion'&&(j.version!==VERSION||!j.nombre||!Array.isArray(j.puede))){const e=Error('El servidor aún no tiene la actualización de la app. Usa la página actual hasta que oficina la active.');e.code='VERSION';throw e;}return j;}finally{clearTimeout(timer);}}
 async function queue(){return (await all('ops')).filter(x=>x.bod===BOD).sort((a,b)=>a.time-b.time||a.sequence-b.sequence);}
 async function status(){const q=await queue(),el=document.getElementById('app-status');if(!el)return;el.dataset.state=arrivalError||lastError||q.some(x=>x.error)?'error':'';el.textContent=pendingSaves?'Guardando en el dispositivo…':(arrivalError?arrivalError:(lastError?lastError+(q.length?' · '+q.length+' por enviar':''):''))|| (q.length?`${q.length} operaciones guardadas · ${busy?'sincronizando':'pendientes de enviar'}`:'Sin operaciones pendientes en este dispositivo');}
 function labelError(e){lastError=e?.name==='AbortError'?'Sin confirmación del servidor. El trabajo sigue guardado; se comprobará con el mismo identificador.':(/fetch|network|Failed|Load failed/i.test(e?.message||'')?'Sin conexión al servidor. El trabajo sigue guardado.':e?.message||'Sin conexión al servidor. El trabajo sigue guardado.');status();}
 function applyCatalog(c){const em=DATA.envmeta;Object.assign(DATA,c);Object.keys(em).forEach(k=>delete em[k]);Object.assign(em,c.envmeta);DATA.envmeta=em;}
 async function refreshCatalog(){if((await queue()).length||pendingSaves)throw Error('Primero sincroniza el trabajo pendiente para actualizar documentos.');const base=new URL('../',location.href);const arrival=BOD==='CUERNAVACA'?'llegadas-cvc-f4b30d.html':'llegadas-edomex-a05adb.html';const read=async name=>{const r=await fetch(new URL(name,base),{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('No se pudo actualizar la página. Conservamos la copia anterior.');return extractData(await r.text());};const [p,a]=await Promise.all([read('panel-67be9943a637.html'),read(arrival)]);const c=scopeCatalog(p,a,BOD);await commit([['meta','catalog-'+BOD,{value:c,at:new Date().toISOString()}]]);applyCatalog(c);return c;}
 async function session(o){const credentials={usuario:o.usuario,clave:o.clave};const r=await network('sesion',{},credentials);await commit([['meta','validated-'+BOD,{at:Date.now(),usuario:o.usuario}]]);lastError='';await refreshCatalog().catch(()=>{});return r;}
 async function reserve(id){await window.FXDevice?.ready;if((await queue()).some(o=>o.receipt===id&&o.action==='llegada')){window.FXDevice?.remember(id);return {ok:true};}const r=await network('reservar',{id});window.FXDevice?.remember(id);return r;}
 async function mutateRecord(r,action,data){await window.FXDevice?.ready;
  if(action==='llegada'){const id=data.id;r={id,bod:BOD,prov:data.prov,doc:data.doc,pedido:data.pedido,cot:data.cot,fact:data.fact,bultos:data.bultos,tbultos:data.tbultos,hora:data.hora,recibio:user().nombre,modo:data.modo,cajas:data.cajas,tarimas:data.tarimas,bolsas:data.bolsas,obs:data.obs||'',estado:data.borrador?'En captura':'Por autorizar',_local:true,_boxes:[],_photos:[]};}
  if(!r)throw Error('Descarga primero esta llegada con internet para trabajar sin conexión.');if(r.estado==='Cancelada')throw Error('Esta llegada está cancelada. No se puede seguir capturando.');
  if(window.FXDevice){if(FXDevice.other(r.captura))throw Error('Captura en uso por '+r.captura.nombre+' · '+r.captura.equipo+'. Solo ese equipo puede modificarla.');if(action==='llegada'){const d=FXDevice.current();r.captura={usuario:user().usuario,nombre:user().nombre,equipo:d.name,dispositivo:d.id};FXDevice.remember(data.id);}else if(r.estado==='En captura'&&!FXDevice.owns(data.id))await FXDevice.claim(data.id);}
  if(action==='caja'){
   const same=r._boxes.find(x=>x.pedido===data.pedido&&x.alm===data.alm&&Number(x.caja)===Number(data.caja));
   if(same&&!data.forzar)throw Error('La caja '+data.caja+' de ese pedido y almacén ya se registró');
   r._boxes.push({cid:data.cliente,pedido:String(data.pedido),alm:String(data.alm),total:+data.total,caja:+data.caja,mini:data.mini||'',foto:'',quien:user().nombre});
  }else if(action==='foto'){r._photos.push({fid:data.cliente,clase:data.clase,n:+data.n,url:'',mini:data.mini||''});}
  else if(action==='caja_editar'){const c=r._boxes.find(x=>x.cid===data.cid);if(!c)throw Error('No se encontró la caja local.');Object.assign(c,{pedido:String(data.pedido),alm:String(data.alm),total:+data.total,caja:+data.caja});}
  else if(action==='caja_borrar'){r._boxes=r._boxes.filter(x=>x.cid!==data.cid);}
  else if(action==='foto_borrar'){r._photos=r._photos.filter(x=>x.fid!==data.fid);}
  else if(action==='cerrar'){r.estado='Por autorizar';r.obs=[r.obs,data.obs].filter(Boolean).join(' · ');r.pend=data.sinLista?'No vino lista de empaque':'';}
  else if(action==='cancelar')r.estado='Cancelada';
  r._pending=true;return r;
 }
 let localWrites=Promise.resolve();
 function serial(fn){const p=localWrites.then(fn);localWrites=p.catch(()=>{});return p;}
 async function post(o){
  if(o.tipo==='login')return session(o);
  if(o.tipo==='autorizar'){
   can('autorizar');if((await queue()).some(x=>x.receipt===o.id))throw Error('Primero sincroniza todas las operaciones de esta llegada.');
   const datos=clean(o),id=uuid();const r=await network('autorizar',{operacion:id,datos});await refresh(o.id);return r;
  }
  can('registrar');
  return serial(async()=>{const datos=clean(o),action=o.tipo;if(action==='llegada')datos.id='LA'+uuid();
   if(['caja','foto'].includes(action)&&!datos.cliente)datos.cliente=uuid();
   let record=await get('receipts',datos.id);if(action==='caja'&&record?._boxes?.some(x=>x.cid===datos.cliente))return {ok:true,id:datos.id,caja:record._boxes.find(x=>x.cid===datos.cliente)};if(action==='foto'&&record?._photos?.some(x=>x.fid===datos.cliente))return {ok:true,id:datos.id,foto:record._photos.find(x=>x.fid===datos.cliente)};record=await mutateRecord(record,action,datos);
   const op={id:uuid(),bod:BOD,who:user().usuario,action,data:datos,receipt:datos.id,time:Date.now(),sequence:++sequence};
   nextRead(record.id);await commit([['receipts',record.id,record],['ops',op.id,op]]);if(nativeBackground())try{await FXBackground.enqueue(op);}catch(e){labelError(e);}await status();drain();
   return{ok:true,id:record.id,local:true,caja:action==='caja'?record._boxes.at(-1):undefined,foto:action==='foto'?record._photos.at(-1):undefined};
  });
 }
 function clean(o){const x=clone(o);for(const k of ['usuario','clave','bod','tipo','_fxAppId'])delete x[k];return x;}
 async function refresh(id){const q=await queue();if(q.some(x=>x.receipt===id))return;const epoch=nextRead(id),d=await network('detalle',{id});await serial(async()=>{if(readEpoch.get(id)!==epoch||(await queue()).some(x=>x.receipt===id))return;const old=await get('receipts',id);if(old)await commit([['receipts',id,{...old,captura:d.captura,estado:d.estado||old.estado,_boxes:d.cajas,_photos:d.fotos,_pending:false,_detailCached:true}]]);});}
 async function arrivals(){const pending=await queue();let rows=(await all('receipts')).filter(r=>r.bod===BOD);
  try{const epochs=new Map(readEpoch);const j=await network('llegadas');if(!Array.isArray(j.llegadas))throw Error('El servidor no devolvió la lista de llegadas.');await serial(async()=>{const pending=await queue();const writes=[];for(const r of j.llegadas){const old=await get('receipts',r.id);if((readEpoch.get(r.id)||0)!==(epochs.get(r.id)||0))continue;if(!pending.some(x=>x.receipt===r.id)){nextRead(r.id);writes.push(['receipts',r.id,{...r,_boxes:old?._boxes||[],_photos:old?._photos||[],_detailCached:!!old?._detailCached}]);}}if(writes.length)await commit(writes);});for(const old of rows){if(old.estado==='En captura'&&!j.llegadas.some(x=>x.id===old.id)&&!(await queue()).some(x=>x.receipt===old.id))await detail(old.id).catch(()=>{});}lastError='';arrivalError='';rows=(await all('receipts')).filter(r=>r.bod===BOD);}catch(e){arrivalError='No se pudo actualizar Recepción: '+(e.message||'sin respuesta del servidor');labelError(e);if(!rows.length)throw Error(arrivalError+' · Tus llegadas pueden seguir guardadas en el servidor. Pulsa Volver a cargar.');}
  return rows.filter(r=>r.estado!=='Cancelada');
 }
 async function detail(id){let r=await get('receipts',id);if(navigator.onLine){const epoch=nextRead(id);try{const d=await network('detalle',{id});if(!r)throw Error('Abre primero la lista de llegadas.');await serial(async()=>{const latest=await get('receipts',id);if(readEpoch.get(id)!==epoch){r=latest;return;}if((await queue()).some(x=>x.receipt===id)){r=latest;if(d.estado&&d.estado!=='En captura'){r={...latest,estado:d.estado};await commit([['receipts',id,r]]);}return;}r={...latest,captura:d.captura,estado:d.estado||latest.estado,_boxes:d.cajas,_photos:d.fotos,_detailCached:true};await commit([['receipts',id,r]]);});}catch(e){labelError(e);}}
  if(!r||(!r._local&&!r._detailCached))throw Error('Esta captura no se descargó todavía. Ábrela con internet antes de salir.');return{ok:true,captura:r.captura,estado:r.estado,cajas:r._boxes||[],fotos:r._photos||[]};
 }
 const nativeBackground=()=>!!window.FXBackground?.enabled&&!!window.FXSession?.remembered(BOD);
 async function nativeDrain(){
  let q=await queue();const changed=new Set();
  // Reconcile confirmations before re-enqueueing; keep every unconfirmed operation.
  for(const item of await FXBackground.statuses()){
   if(item.bod!==BOD||item.who!==user().usuario)continue;
   const op=q.find(o=>o.id===item.id);
   if(item.state==='confirmed'){if(op){await commit([['ops',op.id,undefined]]);if(op.receipt)changed.add(op.receipt);}await FXBackground.acknowledge(item.id);}
   else if(op&&item.state==='error'){await commit([['ops',op.id,{...op,error:item.result.error||'Operación rechazada por el servidor',errorCode:item.result.code,serverRejected:true}]]);lastError=item.result.error;}
   else if(op&&item.result?.error)lastError=item.result.error;
  }
  q=await queue();for(const op of q){if(op.who!==user().usuario){lastError='Hay operaciones pendientes de otro usuario.';continue;}await FXBackground.enqueue(op);}
  if(q.length)await FXBackground.schedule();else lastError='';
  for(const id of changed)await refresh(id).catch(()=>{});
 }
 async function drain(){if(busy||!user())return;busy=true;await status();try{if(nativeBackground()){await nativeDrain();return;}await network('sesion');for(const op of await queue()){
   if(op.error){lastError=op.error;break;}if(op.who!==user().usuario){lastError='Hay operaciones pendientes de otro usuario. Inicia sesión con quien las capturó.';break;}
   try{const result=await network(op.action,{operacion:op.id,datos:op.data});if(result.operacion!==op.id)throw Error('No se recibió la confirmación de esta operación.');await commit([['ops',op.id,undefined]]);lastError='';if(op.receipt)await refresh(op.receipt).catch(()=>{});}catch(e){if(e.code){await commit([['ops',op.id,{...op,error:e.message,errorCode:e.code}]]);}labelError(e);break;}
  }}catch(e){labelError(e);}finally{busy=false;status();}}
 async function logout(){if((await queue()).length||pendingSaves)throw Error('Hay trabajo pendiente. Sincroniza o descarga un respaldo antes de cambiar de usuario.');localStorage.removeItem('fx-app-lu-'+BOD);}
 function progressGet(k){return clone(progress[k]||{});}
 function progressSet(k,v){const old=clone(progress[k]||{}),next=clone(v);pendingSaves++;progress[k]=next;status();serial(async()=>{can('registrar');const changes=[];for(const id of new Set([...Object.keys(old),...Object.keys(next)])){if(JSON.stringify(old[id])!==JSON.stringify(next[id]))changes.push({k,i:id,v:id in next?JSON.stringify(next[id]):null});}if(!changes.length)return;const op={id:uuid(),bod:BOD,who:user().usuario,action:'avance',data:{cambios:changes},time:Date.now(),sequence:++sequence};await commit([['progress',k,{value:next,bod:BOD}],['ops',op.id,op]]);}).then(()=>drain()).catch(e=>{progress[k]=old;labelError(e);alert('No se pudo guardar el avance: '+e.message);}).finally(()=>{pendingSaves--;status();});}
 async function pullProgress(){const j=await network('avance_leer');await serial(async()=>{const ops=await queue(),localKeys=new Set(ops.filter(o=>o.action==='avance').flatMap(o=>o.data.cambios.map(c=>c.k)));const writes=[];for(const [k,v]of Object.entries(j.values||{})){if(localKeys.has(k))continue;progress[k]=v;writes.push(['progress',k,{value:v,bod:BOD}]);}if(writes.length)await commit(writes);});}
 async function init(){await ready;await window.FXDevice?.ready;const catalog=await get('meta','catalog-'+BOD);if(catalog)applyCatalog(catalog.value);for(const p of await all('progress'))if(p.bod===BOD)progress[p.id]=p.value;await status();if('serviceWorker'in navigator){await navigator.serviceWorker.register('./sw.js');}setInterval(()=>{if(document.visibilityState==='visible'&&user())drain();},15000);addEventListener('online',()=>drain());}
 async function backup(){const payload={format:'fx-bodega-backup-v1',bod:BOD,created:new Date().toISOString(),ops:await queue(),receipts:(await all('receipts')).filter(x=>x.bod===BOD),progress:(await all('progress')).filter(x=>x.bod===BOD)};const url=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='FXMOTO-'+BOD+'-respaldo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 return {arrivalStatus:()=>({error:arrivalError}),init,reserve,post,arrivals,detail,queue,drain,user,logout,progressGet,progressSet,pullProgress,refreshCatalog,backup,status};
})();
