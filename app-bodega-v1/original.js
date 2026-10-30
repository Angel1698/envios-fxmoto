const fmt=n=>(Math.round(n*10)/10).toLocaleString('es-MX');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get:k=>FXAPP.progressGet(k),set:(k,v)=>FXAPP.progressSet(k,v)};
const ADMIN=MODE==='admin';
const IM=i=>i==null?null:(typeof i==='string'?i:DATA.imgs[i]);
function img(i,alt,big){const s=IM(i);const b=big||(typeof i==='string'?i:'');return s?`<button type="button" class="zbtn" data-big="${esc(b)}" data-small="${esc(s)}" data-alt="${esc(alt)}" aria-label="Ver foto en grande"><img class="thumb" src="${esc(s)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer"><span class="zic" aria-hidden="true">⤢</span></button>`:`<div class="ph">Sin foto</div>`}
function openZoom(b){let o=document.getElementById('zoom');if(!o){o=document.createElement('div');o.id='zoom';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.innerHTML='<button type="button" class="zclose" aria-label="Cerrar">✕ Cerrar</button><img alt=""><div class="zcap"></div>';document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target.tagName!=='IMG')closeZoom()})}
 const im=o.querySelector('img');im.onerror=()=>{if(im.src!==b.dataset.small){im.src=b.dataset.small;o.querySelector('.zcap').textContent=b.dataset.alt+' · (sin conexión a la foto original, se muestra la miniatura)'}};
 im.src=b.dataset.big||b.dataset.small;im.alt=b.dataset.alt;o.querySelector('.zcap').textContent=b.dataset.alt;o.hidden=false;document.body.classList.add('zopen');o.querySelector('.zclose').focus()}
function closeZoom(){const o=document.getElementById('zoom');if(o){o.hidden=true;o.querySelector('img').removeAttribute('src')}document.body.classList.remove('zopen')}
document.addEventListener('click',e=>{const b=e.target.closest('.zbtn');if(b){e.preventDefault();openZoom(b)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeZoom()});
const EM=DATA.envmeta;
const BRANDS=[['MOTO AZCAPOTZALCO',/azcapotzalco|marfer/i],['ALESSIA',/alessia/i],['REFACOM',/refacom/i],['SAYTO',/sayto/i],['MRM',/\bmrm\b|roda/i],['KINGMOTO',/king ?moto/i],['TMMP',/tmmp/i],['WINMEX',/winmex/i],['ITALIKA',/italika/i]];
function blogo(s){s=String(s||'');for(const [k,r] of BRANDS)if(r.test(s))return DATA.blogos&&DATA.blogos[k]?`<img class="blogo" src="${DATA.blogos[k]}" alt="${k}">`:'';return ''}
const EORD=Object.keys(EM).sort((a,b)=>(a.startsWith('S')?0:1)-(b.startsWith('S')?0:1)||a.localeCompare(b));
const ord=e=>EORD.indexOf(e);
const THIS=new Set(DATA.week?DATA.week.envs:['241','242','243','276','277','278','279','280']);
const phase=e=>e.startsWith('S')?'prev':(THIS.has(e)?'now':'later');
const PCLS={prev:'c-next',now:'c-now',later:'c-later'};
const big=t=>t==='Grande'||t==='Extragrande';
const elabel=e=>e.startsWith('S')?`Ya salió · ${EM[e].dia.replace(' (ya salió)','')} · ${EM[e].dest}`:`Envío ${e} · ${EM[e].dia}`;
const bodName=b=>b==='G'?'grandes':'medianos';
function link(kind,key){return kind==='r'?'#resumen':`#${kind}-${key}`}
const isoUrl=k=>DATA.links&&DATA.links[k]?BASE+DATA.links[k]:null;
/* ---------- tipos de publicación ---------- */
const TPC={C:'tc',P:'tp',S:'ts',I:'ti'};
const TPG={C:'Compuestos',P:'Individual por',S:'Individual sobre',I:'Individuales'};
const tpTitle=(t,n)=>t==='C'?'COMPUESTO':t==='P'?'INDIVIDUAL POR '+n:t==='S'?'INDIVIDUAL SOBRE '+n:'INDIVIDUAL';
const tpShort=(t,n)=>t==='C'?'Compuesto':t==='P'?'Por '+n:t==='S'?'Sobre '+n:'';
function tpHelp(t,n,k){return t==='C'?`Se arma con ${k} piezas distintas. Junta todas las piezas antes de etiquetar.`:t==='P'?`Cada unidad lleva ${n} piezas.`:t==='S'?`Cada pieza del proveedor rinde ${n} unidades.`:''}
const tband=(t,n,txt)=>`<div class="tband ${TPC[t]}"><b>${tpTitle(t,n)}</b><span>${txt}</span></div>`;
/* ---------- factura ---------- */
function itemBod(i){const g=i.dest.filter(d=>d.cml&&big(d.tam)).reduce((s,d)=>s+d.pz,0),m=i.dest.filter(d=>d.cml&&!big(d.tam)).reduce((s,d)=>s+d.pz,0);
 const sg=i.dest.filter(d=>d.env.startsWith('S')).reduce((a,d)=>{if(EM[d.env].size==='G')a[0]+=d.pz;else a[1]+=d.pz;return a},[0,0]);
 const G=g+sg[0],M=m+sg[1];return {bod:(G||M)?(G>=M?'G':'M'):(big(i.tam0)?'G':'M'),mixed:G>0&&M>0}}
function dsize(d){return EM[d.env]?EM[d.env].size:'M'}
function aggDest(i){const m={};i.dest.forEach(d=>{const k=d.env+'|'+dsize(d)+'|'+(d.tp||'I')+'|'+(d.nf||1);(m[k]=m[k]||{env:d.env,sz:dsize(d),pz:0,tp:d.tp||'I',nf:d.nf||1,w:d.w||[]}).pz+=d.pz});return Object.values(m).sort((a,b)=>ord(a.env)-ord(b.env))}
function itemTp(i){const s=new Set(i.dest.map(d=>d.tp||'I'));return s.has('C')?'C':s.has('P')?'P':s.has('S')?'S':'I'}
const cjParse=(F,c)=>{if(typeof F==='string')F=DATA.facturas[F];const m=String(c||'').match(/^([A-Z]) (\d+)(?:-(\d+))?$/);if(!m||!F||!F.cajas||!F.cajas.groups[m[1]])return null;const G=F.cajas.groups[m[1]];return {g:m[1],a:+m[2],b:m[3]?+m[3]:+m[2],n:G.n,alm:G.alm||''}};
const almTxt=p=>p.alm?'Almacén '+p.alm:'almacén por confirmar';
const cjFmt=(F,c)=>{const p=cjParse(F,c);if(!p)return 'Caja '+c;return `Grupo ${p.g} · ${almTxt(p)} · caja${p.a===p.b?'':'s'} ${p.a===p.b?p.a:p.a+' a '+p.b} de ${p.n}`};
const cjShort=(F,c)=>{const p=cjParse(F,c);if(!p)return 'Caja '+c;return `${p.alm?'Alm '+p.alm:'Grupo '+p.g} · ${p.a===p.b?p.a:p.a+'-'+p.b}/${p.n}`};
const cjItemFmt=(F,i)=>{if(typeof F==='string')F=DATA.facturas[F];if(!F.cajas||!F.cajas.globalNumbering)return cjFmt(F,i.caja);const B=F.cajas.blocks.filter(b=>b.code===i.code);if(!B.length)return cjFmt(F,i.caja);return B.map(b=>{const G=F.cajas.groups[b.g],rack=b.rack||(G&&G.alm)||'';return (F.cajas.singleSequence?'':`Grupo ${b.g} · `)+(rack?`Rack 1 ${rack} · `:'')+(b.a===b.b?`caja ${b.a}`:`cajas ${b.a} a ${b.b}`)+(B.length>1&&b.pz>0?` (${fmt(b.pz)} pz)`:'')}).join('; ')};
const cjItemOrder=(F,a,b)=>{const first=i=>F.cajas.blocks.filter(x=>x.code===i.code).sort((x,y)=>(F.cajas.singleSequence?0:x.g.localeCompare(y.g))||x.a-y.a)[0];const x=first(a),y=first(b);return (!x)-(!y)||(x&&y?((F.cajas.singleSequence?0:x.g.localeCompare(y.g))||x.a-y.a):0)||a.code.localeCompare(b.code)};
const bxName=(b,F)=>{const G=F&&F.cajas&&F.cajas.groups[b.g];const al=G&&G.alm?`Almacén ${G.alm} · `:'';return al+(b.a===b.b?`Caja ${b.a}`:`Cajas ${b.a} a ${b.b}`)+(G?` de ${G.n}`:'')};
const bxN=b=>b.b-b.a+1;
function bxState(F,b){const i=F.items.find(x=>x.code===b.code);if(!i)return {st:'na',i:null,go:0,stay:0,envs:[]};const go=i.qty-i.stay;const envs=[...new Set(i.dest.map(d=>d.env))].sort((a,c)=>ord(a)-ord(c));return {st:i.stay>=i.qty?'queda':i.stay>0?'mixta':'va',i,go,stay:i.stay,envs}}
function boxSummary(F){const C=F.cajas;if(C.globalNumbering)return `<div class="bxsum"><b>${C.total} bultos documentados en total.</b><p class="mini">${esc(C.src)}</p></div>`;let va=0,qd=0,mx=0,pva=0,pqd=0;C.blocks.forEach(b=>{const s=bxState(F,b);const n=bxN(b);if(s.st==='va'){va+=n;pva+=b.pz}else if(s.st==='queda'){qd+=n;pqd+=b.pz}else{mx+=n;pva+=s.go;pqd+=s.stay}});
 const tot=Object.values(C.groups).reduce((s,g)=>s+g.n,0);const qb=C.blocks.filter(b=>bxState(F,b).st==='queda').map(b=>bxName(b,F)+' ('+b.code+')');
 return `<div class="bxsum"><div class="bxk"><b>${tot}</b><span>cajas en ${Object.keys(C.groups).length} grupos</span></div><div class="bxk va"><b>${va}</b><span>van completas a envío</span></div>${mx?`<div class="bxk mx"><b>${mx}</b><span>se abren: parte a envío, parte se queda</span></div>`:''}<div class="bxk qd"><b>${qd}</b><span>se quedan cerradas en bodega</span></div>
  <p class="mini">${qb.length?'<b>No abras</b> '+esc(qb.join(', '))+': se quedan completas en bodega. ':''}Cada grupo es un almacén de ALESSIA y trae su propia numeración. En la etiqueta de ALESSIA de cada caja busca el almacén (abajo, por ejemplo ALMACEN-100) y el número de caja (por ejemplo 19/25). Así sabes de qué grupo es. ${C.src?esc(C.src)+'.':''}</p></div>`}
function boxList(F,bl,bdone){const C=F.cajas;const edo=F.bod==='EDOMEX';
 return Object.keys(C.groups).sort().map(g=>{const r=bl.filter(b=>b.g===g).sort((x,y)=>x.a-y.a);if(!r.length)return '';const G=C.groups[g];
  return `<div class="group"><h2>Grupo ${g} · ${G.alm?'Almacén '+esc(G.alm):'almacén por confirmar'} · ${G.n} cajas</h2><span class="mono">${esc(G.desc||'')}</span></div><div class="bxl">${r.map(b=>{const s=bxState(F,b);const i=s.i;const k=b.g+b.a;
   const dst=s.st==='queda'?`<span class="bxs qd">Se queda en bodega · no abrir</span>`:s.st==='mixta'?`<span class="bxs mx">Abrir: ${fmt(s.go)} pz a ${s.envs.map(e=>e.startsWith('S')?'ya salió':'envío '+e).join(', ')} · ${fmt(s.stay)} pz se quedan</span>`:`<span class="bxs va">Toda va a ${s.envs.map(e=>e.startsWith('S')?'envío que ya salió':'envío '+e).join(', ')}</span>`;
   return `<article class="bx ${s.st}${bdone[k]?' done':''}">${i?img(i.img,i.desc,i.big):''}<div class="bxb"><div class="bxh"><span class="bxn">${bxName(b,F)}</span><span class="mono">${bxN(b)} caja${bxN(b)>1?'s':''}</span></div>
    <div><span class="code">${esc(b.code)}</span> <span class="mono">· ${b.pz>0?fmt(b.pz)+' pz':(()=>{const sb=C.blocks.filter(x=>x.code===b.code&&x.g===b.g).sort((x,y)=>x.a-y.a);return (i?fmt(i.qty-(C.blocks.filter(x=>x.code===b.code&&x.pz>0).reduce((s,x)=>s+x.pz,0)))+' pz entre ':'pz entre ')+(sb.length>1?'las cajas '+sb.map(x=>x.a).join(', '):'esta caja')})()}</span></div>${b.pz>0?'':`<div class="mini" style="color:#8A4B00">La lista de empaque no dice cuántas piezas trae cada caja. Cuéntalas al abrir.</div>`}<div class="desc">${esc(i?i.desc:'')}</div>${dst}
    <label class="tick"><input type="checkbox" data-bx="${k}" ${bdone[k]?'checked':''}> Caja revisada</label></div></article>`}).join('')}</div>`}).join('')}
function renderFactura(key,root){
 const F=DATA.facturas[key];let OB;const edo=F.bod==='EDOMEX';const KEY='fx-f-'+key;let done=store.get(KEY);
 const items=F.items;let all=0,stay=0;const tot={};
 items.forEach(i=>{all+=i.qty;stay+=i.stay;i.envs=new Set();i.dest.forEach(d=>{tot[d.env]=(tot[d.env]||0)+d.pz;i.envs.add(d.env)});if(i.stay>0)i.envs.add('queda');Object.assign(i,itemBod(i));i.tp=itemTp(i)});
 const envs=Object.keys(tot).sort((a,b)=>ord(a)-ord(b));
 const nT=t=>items.filter(i=>i.tp===t).length;
 root.innerHTML=`<div class="docHead"><div><div class="eyebrow">${F.tipo_documento==='REMISION'?'Remisión':'Factura'} · ${edo?'Edo. Méx.':'Cuernavaca'}</div><h1><span class="pedtag">Pedido ${esc(F.pedido)}</span> ${blogo(F.title)}${esc(F.title)}</h1></div>
  <div class="meta"><span>Nuestro pedido <b>${esc(F.pedido)}</b></span>${F.doc?`<span><b>${esc(F.doc)}</b></span>`:''}<span>${F.encamino?"Estado":"Llegó"} <b>${esc(F.llego)}</b></span>${F.bultos?`<span><b>${esc(F.bultos)}</b></span>`:''}${F.recibio?`<span>Recibió <b>${esc(F.recibio)}</b></span>`:''}<span><b>${fmt(all)}</b> piezas</span></div></div>
  ${parcialNote([key])}
  ${ADMIN?shareBar('f',key,'Pedido '+F.pedido+' · '+F.title):''}
  ${obsPanel()}
  <div class="sbar"><input type="search" class="q" placeholder="Buscar código o descripción" aria-label="Buscar código"></div><div class="tools"><label class="sel">Ordenar <select class="so"><option value="env">Por envío más próximo</option><option value="code">Por código</option><option value="caja">Por caja</option><option value="qmax">Más piezas primero</option><option value="qmin">Menos piezas primero</option></select></label>
  <div class="seg sg"><button data-s="all" aria-pressed="true">Todos</button><button data-s="pend" aria-pressed="false">Pendientes</button><button data-s="done" aria-pressed="false">Separados</button></div>${F.cajas?'<div class="seg vw"><button data-v="caja" aria-pressed="true">Por caja</button><button data-v="code" aria-pressed="false">Por código</button></div>':''}<span class="mono cnt"></span></div>
  ${F.cajas?boxSummary(F):''}
  ${noVino(F)}
  ${typeChips(nT)}
  <div class="bar">${envs.map(e=>`<span style="width:${tot[e]/all*100}%;background:var(--${phase(e)==='now'?'now':phase(e)==='later'?'later':'next'});border-right:2px solid var(--bg)"></span>`).join('')}<span style="width:${stay/all*100}%;background:var(--stay)"></span></div>
  <div class="legend fl"><button class="chip" data-f="all" aria-pressed="true">Todo <span class="n">${items.length} códigos · ${fmt(all)} pz</span></button>${envs.map(e=>`<button class="chip ${PCLS[phase(e)]}" data-f="${e}" aria-pressed="false">${elabel(e)} <span class="n">${fmt(tot[e])} pz</span></button>`).join('')}${stay>0?`<button class="chip c-stay" data-f="queda" aria-pressed="false">Se queda en bodega <span class="n">${fmt(stay)} pz</span></button>`:''}</div>
  <div class="lst"></div>`;
 let filt='all',show='all',tfil='all',view=F.cajas&&!F.cajas.globalNumbering?'caja':'code';const q=root.querySelector('.q'),so=root.querySelector('.so'),lst=root.querySelector('.lst');const BK=KEY+'-bx';let bdone=store.get(BK);
 if(F.cajas&&F.cajas.globalNumbering)so.value='caja';const vw=root.querySelector('.vw');if(vw)vw.onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;view=b.dataset.v;vw.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};
 root.querySelector('.fl').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;filt=b.dataset.f;root.querySelectorAll('.fl [data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};
 root.querySelector('.sg').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;show=b.dataset.s;root.querySelectorAll('.sg button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};
 root.querySelector('.tl').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;tfil=b.dataset.t;root.querySelectorAll('.tl [data-t]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};
 q.oninput=draw;so.onchange=draw;
 const first=i=>Math.min(...i.dest.map(d=>ord(d.env)),999);
 function card(i){
  const rows=aggDest(i).map(d=>`<div class="row ${PCLS[phase(d.env)]}"><span class="lbl">${d.env.startsWith('S')?'Ya salió':'Envío '+d.env}</span><span class="det">${d.tp!=='I'?`<span class="ttag ${TPC[d.tp]}">${tpShort(d.tp,d.nf)}</span>`:''}${d.env.startsWith('S')?EM[d.env].dia.replace(' (ya salió)','')+' · '+EM[d.env].dest:EM[d.env].dia}${edo&&i.mixed?' · '+bodName(d.sz):''}${d.tp==='C'&&d.w.length?' · se junta con '+esc(d.w.join(' + ')):''}</span><span class="pz">${fmt(d.pz)} pz</span></div>`).join('')
   +(i.stay>0?`<div class="row c-stay"><span class="lbl">Se queda en bodega</span><span class="det">${edo?bodName(i.bod):''}</span><span class="pz">${fmt(i.stay)} pz</span></div>`:'');
  let band='';
  if(i.tp!=='I'){const d=i.dest.find(x=>x.tp===i.tp);const w=[...new Set(i.dest.filter(x=>x.tp==='C').flatMap(x=>x.w||[]))];
   band=tband(i.tp,d.nf,i.tp==='C'?(w.length?`Esta pieza se junta con ${esc(w.join(' + '))} para armar el producto.`:'Se arma con otras piezas.'):tpHelp(i.tp,d.nf))}
  return `<article class="card${i.tp!=='I'?' sp '+TPC[i.tp]:''}${done[i.code]?' done':''}">${band}${img(i.img,i.desc,i.big)}<div style="min-width:0">
   <div class="top"><span class="code">${esc(i.code)}</span><span class="qty">${fmt(i.qty)} <small>${F.recepcion_documental?"documentadas":(DATA.facturas[key]&&DATA.facturas[key].encamino?"facturadas":"llegaron")}</small></span></div>
   ${edo?`<div class="bodtag ${i.bod==='G'?'bg':'bm'}">Bodega asignada: ${i.mixed?'grandes y medianos':bodName(i.bod)}</div>`:''}${i.caja?`<div class="bodtag bc">${esc(cjItemFmt(F,i))}</div>`:''}
   <div class="desc">${esc(i.desc)}</div>${pcLine(F,i)}<div class="rows">${rows}</div>
   ${obsView(OB.get(i.code))}<div class="cfoot"><label class="tick"><input type="checkbox" data-c="${esc(i.code)}" ${F.encamino?'disabled':''} ${done[i.code]?'checked':''}> ${F.encamino?'Pendiente de recepción':'Ya separado'}</label>${obsBtn(i.code,i.code+' · '+i.desc)}</div></div></article>`}
 function draw(){
  const s=q.value.trim().toUpperCase();const o=so.value;
  const cmp=(x,y)=>o==='code'?x.code.localeCompare(y.code):o==='caja'?(x.caja||'~').localeCompare(y.caja||'~',undefined,{numeric:true}):o==='qmax'?y.qty-x.qty:o==='qmin'?x.qty-y.qty:(first(x)-first(y)||x.code.localeCompare(y.code));
  const list=items.filter(i=>(filt==='all'||i.envs.has(filt))&&(tfil==='all'||i.tp===tfil)&&(show==='all'||(show==='done')===!!done[i.code])&&(!s||i.code.toUpperCase().includes(s)||String(i.desc).toUpperCase().includes(s)||String(i.caja).toUpperCase()===s));
  if(F.cajas&&F.cajas.globalNumbering){root.querySelector('.cnt').textContent=`${list.length} de ${items.length} códigos`;lst.innerHTML='<div class="list">'+list.sort((a,b)=>cjItemOrder(F,a,b)).map(card).join('')+'</div>';return}if(view==='caja'){const ok=new Set(list.map(i=>i.code));const bl=F.cajas.blocks.filter(b=>ok.has(b.code));root.querySelector('.cnt').textContent=`${bl.length} de ${F.cajas.blocks.length} grupos de cajas`;lst.innerHTML=boxList(F,bl,bdone)||'<p>No hay cajas con ese filtro.</p>';return}
  root.querySelector('.cnt').textContent=`${list.length} de ${items.length} códigos`;
  const sp=list.filter(i=>i.tp!=='I'),ind=list.filter(i=>i.tp==='I');let h='';
  if(sp.length)h+=`<section class="spblock"><div class="sphead"><h2>Revisar primero</h2><span>Compuestos e individuales por / sobre de esta factura</span></div>`+['C','P','S'].map(t=>{const l=sp.filter(i=>i.tp===t).sort(cmp);if(!l.length)return '';
    return `<div class="group tg ${TPC[t]}"><h2>${TPG[t]}</h2><span class="mono">${l.length} códigos · ${fmt(l.reduce((s,i)=>s+i.qty,0))} pz</span></div><div class="list">${l.map(card).join('')}</div>`}).join('')+`</section>`;
  const groups=edo?[['G','Bodega de grandes y extragrandes'],['M','Bodega de pequeños y medianos']]:[[null,sp.length?'Individuales':'']];
  h+=groups.map(([b,t])=>{const l=ind.filter(i=>!b||i.bod===b).sort(cmp);if(!l.length)return '';
    return (t?`<div class="group"><h2>${t}${b&&sp.length?' · individuales':''}</h2><span class="mono">${l.length} códigos · ${fmt(l.reduce((s,i)=>s+i.qty,0))} pz</span></div>`:'')+`<div class="list">${l.map(card).join('')}</div>`}).join('');
  lst.innerHTML=h||'<p>No hay códigos con ese filtro.</p>';
 }
 lst.onchange=e=>{const x=e.target.dataset.bx;if(x){bdone[x]=e.target.checked;store.set(BK,bdone);e.target.closest('.bx').classList.toggle('done',e.target.checked);return}
  const c=e.target.dataset.c;if(!c)return;done[c]=e.target.checked;store.set(KEY,done);if(show!=='all')draw();else e.target.closest('.card').classList.toggle('done',e.target.checked)};
 OB=setupObs(root,'fx-o-f-'+key,()=>`Factura ${F.title} · pedido ${F.pedido}`,()=>{const d=items.filter(i=>done[i.code]).length;return `Avance: ${d} de ${items.length} códigos separados`},new Set(items.map(i=>i.code)),()=>draw());
 draw();
}
function typeChips(nT){const t=['C','P','S'].filter(x=>nT(x));if(!t.length)return '<div class="tl" hidden></div>';
 return `<div class="legend tl"><button class="chip" data-t="all" aria-pressed="true">Todos</button>${t.map(x=>`<button class="chip k-${TPC[x]}" data-t="${x}" aria-pressed="false">${TPG[x]} <span class="n">${nT(x)}</span></button>`).join('')}<button class="chip" data-t="I" aria-pressed="false">Individuales <span class="n">${nT('I')}</span></button></div>`}
/* ---------- envío ---------- */
const ftitle=fk=>DATA.facturas[fk]?`Pedido ${DATA.facturas[fk].pedido} · ${DATA.facturas[fk].title}`:fk;
const fab=fk=>DATA.facturas[fk]?DATA.facturas[fk].ab:'';
const cjn=e=>{const m=String(e.comps[0].caja||'').match(/(\d+)/);return m?+m[1]:9999};
function renderEnvio(num,root,sec){
 const E=DATA.envios[num];const m=EM[num];let OB;const KEY='fx-e-'+num;let done=store.get(KEY);let show='all',dfil='all',tfil='all';
 const env=sec?E.lines.filter(e=>e.comps.some(c=>c.fk===sec)):E.lines;
 const docs=E.fo.filter(f=>env.some(e=>e.fk===f||e.comps.some(c=>c.fk===f)));
 const uOf=f=>env.filter(e=>e.fk===f).reduce((s,e)=>s+e.u,0);
 const tot=env.reduce((s,e)=>s+e.u,0);const pal=['--accent','--later','--stay','--now','--next','--ink'];const colr=d=>pal[docs.indexOf(d)%6];
 const edo=E.bod==='EDOMEX';const nT=t=>env.filter(e=>e.tp===t).length;
 const bxOf=(e,f)=>{const c=e.comps.find(c=>c.fk===f&&c.caja);return c?cjParse(f,c.caja):null};
 const boxSort=(f,ls)=>{const F=DATA.facturas[f];if(!F||!F.cajas)return ls;return ls.slice().sort((a,b)=>{const x=bxOf(a,f),y=bxOf(b,f);if(!x||!y)return (!x)-(!y)||a.no-b.no;return x.g.localeCompare(y.g)||x.a-y.a||a.no-b.no})};
 const scopes=sec?[{fk:sec,name:ftitle(sec),short:fab(sec),lines:boxSort(sec,env.filter(e=>e.fk===sec))}]
  :[{name:`Todo el envío ${num}`,short:'',lines:env}].concat(docs.length>1?docs.map(f=>({fk:f,name:ftitle(f),short:fab(f),lines:boxSort(f,env.filter(e=>e.fk===f))})).filter(s=>s.lines.length):[]);
 (sec?[sec]:docs).forEach(f=>{const FF=DATA.facturas[f];if(!FF||!FF.cajas)return;Object.keys(FF.cajas.groups).sort().forEach(g=>{const ls=boxSort(f,env.filter(e=>{const p=bxOf(e,f);return e.fk===f&&p&&p.g===g}));const G=FF.cajas.groups[g];if(ls.length){const at=scopes.reduce((x,S,i)=>S.fk===f||(S.grp&&S.grp.f===f)?i:x,-1);scopes.splice(at+1,0,{name:`${ftitle(f)} · Grupo ${g} · ${G.alm?'Almacén '+G.alm:'almacén por confirmar'} (${G.n} cajas)`,short:fab(f)+g,lines:ls,grp:{f,g,n:G.n,alm:G.alm||''}})}})});
 // Las etiquetas sin caja confirmada también deben poder descargarse por sección.
 (sec?[sec]:docs).forEach(f=>{const FF=DATA.facturas[f];if(!FF||!FF.cajas)return;const ls=env.filter(e=>e.fk===f&&!bxOf(e,f));if(!ls.length)return;const at=scopes.reduce((x,S,i)=>S.fk===f||(S.grp&&S.grp.f===f)?i:x,-1);scopes.splice(at+1,0,{fk:f,name:`${ftitle(f)} · Sin caja confirmada`,short:fab(f)+' PEND',lines:ls,unlocated:true})});
 scopes.forEach(s=>s.n=s.lines.reduce((x,e)=>x+e.u,0));
 root.innerHTML=`<div class="docHead"><div><div class="eyebrow">Envío a Full · ${edo?'Edo. Méx. · bodega de '+(m.size==='G'?'grandes':'medianos'):'Cuernavaca'}</div><h1>Envío ${num} · ${m.dia}</h1>${sec?`<div class="sechead">Solo esta sección: ${blogo(ftitle(sec))}<b>${esc(ftitle(sec))}</b></div>`:''}</div>
  <div class="meta"><span>Destino <b>${m.dest}</b>${edo?(m.size==='G'?' (grande / extragrande)':' (pequeño / mediano)'):''}</span><span><b>${fmt(tot)}</b> unidades ML${!sec&&m.meta?' de '+fmt(m.meta):''}</span></div></div>
  <div class="prog2"><div class="ptxt"><span><b class="dn">0</b> de <b>${env.length}</b> publicaciones surtidas</span><span><b class="du">0</b> de <b>${fmt(tot)}</b> unidades surtidas</span><b class="dp">0%</b></div><div class="pbar" role="progressbar" aria-label="Avance de surtido" aria-valuemin="0" aria-valuemax="100"><i class="dpi"></i></div></div>
  ${ADMIN?shareBar('e',num,'Envío '+num+' · '+m.dia+' · '+m.dest)+sectionLinks(num,docs,env):''}
  <div class="sbar"><div class="stk"><span class="stt"><b>Envío ${num}</b> · ${esc(m.dia)} · ${esc(m.dest)}${sec?` · <b>Sección ${esc(ftitle(sec))}</b>`:''}</span><span class="stsel"></span><span class="stprog mono"></span><span class="stgrp"></span></div><input type="search" class="q" placeholder="Buscar Código ML, código de proveedor, caja o #" aria-label="Buscar código"></div><div class="tools"><label class="sel">Ordenar <select class="so"><option value="fact">Por número de etiqueta</option><option value="caja">Por caja</option><option value="code">Por código de proveedor</option><option value="cml">Por Código ML</option><option value="qmax">Más unidades primero</option><option value="qmin">Menos unidades primero</option></select></label>
  <div class="seg sg"><button data-s="all" aria-pressed="true">Todos</button><button data-s="pend" aria-pressed="false">Pendientes</button><button data-s="done" aria-pressed="false">Surtidos</button></div><span class="mono cnt"></span></div>
  ${obsPanel()}
  ${ADMIN?labelsPanel(num,scopes):''}
  ${typeChips(nT)}
  ${!sec&&docs.length>1?`<div class="bar">${docs.map(d=>`<span style="width:${uOf(d)/tot*100}%;background:var(${colr(d)})"></span>`).join('')}</div>
  <div class="legend dl"><button class="chip" data-d="all" aria-pressed="true">Todas las facturas <span class="n">${fmt(tot)} u</span></button>${docs.map(d=>`<button class="chip" data-d="${esc(d)}" aria-pressed="false"><span style="width:10px;height:10px;border-radius:3px;background:var(${colr(d)})"></span>${blogo(ftitle(d))}${esc(ftitle(d))} <span class="n">${fmt(uOf(d))} u</span></button>`).join('')}</div>`:'<div class="dl" hidden></div>'}
  <div class="lst"></div>`;
 const q=root.querySelector('.q'),so=root.querySelector('.so'),lst=root.querySelector('.lst');
 root.querySelector('.dl').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;dfil=b.dataset.d;root.querySelectorAll('.dl [data-d]').forEach(x=>x.setAttribute('aria-pressed',x===b));const FD=DATA.facturas[dfil];so.value=FD&&FD.cajas?'caja':(sec&&DATA.facturas[sec]&&DATA.facturas[sec].cajas?'caja':'fact');draw()};
 root.querySelector('.sg').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;show=b.dataset.s;root.querySelectorAll('.sg button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};
 root.querySelector('.tl').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;tfil=b.dataset.t;root.querySelectorAll('.tl [data-t]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};
 q.oninput=draw;so.onchange=draw;if(sec&&DATA.facturas[sec]&&DATA.facturas[sec].cajas)so.value='caja';
 const id=e=>e.cml+'|'+e.comps.map(c=>c.code).join('+');const cc=e=>{const f=sec||(dfil!=='all'?dfil:null);return (f&&e.comps.find(c=>c.fk===f))||e.comps[0]};const cj=e=>cc(e).caja||'~';const cjk=e=>{const c=cc(e);return c.caja?c.fk+'|'+c.caja:'~'};
 const C={fact:(a,b)=>a.no-b.no,caja:(a,b)=>cjk(a).localeCompare(cjk(b),undefined,{numeric:true})||cc(a).code.localeCompare(cc(b).code),code:(a,b)=>a.comps[0].code.localeCompare(b.comps[0].code),cml:(a,b)=>a.cml.localeCompare(b.cml),qmax:(a,b)=>b.u-a.u,qmin:(a,b)=>a.u-b.u};
 const count=()=>{const d=env.filter(e=>done[id(e)]);const u=d.reduce((s,e)=>s+e.u,0);const p=tot?Math.floor(u/tot*100):0;root.querySelector('.dn').textContent=d.length;root.querySelector('.du').textContent=fmt(u);root.querySelector('.dp').textContent=p+'%';const pi=root.querySelector('.dpi');pi.style.width=p+'%';pi.parentNode.setAttribute('aria-valuenow',p);pi.classList.toggle('ok',p>=100)};
const fsn=f=>ftitle(f).replace(/^Pedido [^·]+·\s*/,'');
const xnote=e=>{const fks=[...new Set(e.comps.map(c=>c.fk))];if(e.tp!=='C'||fks.length<2)return '';
 if(!sec)return `<div class="xnote"><b>Compuesto de ${fks.length} facturas.</b> Cada pieza se saca de su factura (${fks.map(f=>esc(fsn(f))).join(' y ')}). Junta las piezas y pon una sola etiqueta por juego.</div>`;
 const mine=fks.includes(sec),others=fks.filter(f=>f!==sec).map(f=>esc(fsn(f))).join(' y ');
 return `<div class="xnote"><b>Ojo: este compuesto también aparece en la sección ${others}.</b> Aquí solo saca la pieza de ${esc(fsn(sec))}; la otra se saca en la sección ${others}. No saques nada dos veces. ${e.fk===sec?'Aquí se juntan las piezas y se pone la etiqueta.':'Lleva tu pieza a la sección '+esc(fsn(e.fk))+': ahí se juntan y se etiqueta.'}</div>`};
 const sourceRows=e=>{
  const source=c=>{const other=sec&&c.fk!==sec;return `<div class="shipment-source${other?' dim':''}"><b class="source-code mono">${esc(c.code)}</b><span class="source-detail">${c.caja?esc(cjItemFmt(c.fk,c))+' · ':''}${blogo(ftitle(c.fk))}${esc(ftitle(c.fk))}${other?`<br><b class="nohere">NO la saques aquí: se saca en la sección ${esc(fsn(c.fk))}</b>`:''}</span><b class="source-pz">${fmt(c.pz)} pz</b></div>`};
  if(e.tp!=='C')return shipmentSources(e.comps).map(source).join('');
  return shipmentComponents(e).map((g,ix)=>`<div class="shipment-component"><div class="component-head"><b>Pieza ${ix+1}</b><span>${fmt(g.pz/e.u)} por unidad ML</span><b>${fmt(g.pz)} pz en total</b></div>${g.sources.map(source).join('')}</div>`).join('');
 };

 const card=e=>{const sp=e.tp!=='I';const pz=e.comps.reduce((s,c)=>s+c.pz,0);
  return `<article class="card${sp?' sp '+TPC[e.tp]:''}${done[id(e)]?' done':''}">${sp?tband(e.tp,e.nf,tpHelp(e.tp,e.nf,shipmentComponents(e).length)):''}${img(e.img,e.tit,e.big)}<div style="min-width:0">
   <div class="top"><span class="code"><span class="no">#${e.no}</span>${e.cml}</span><span class="qty">${fmt(e.u)} <small>u. ML${e.tp==='P'||e.tp==='S'?' = '+fmt(pz)+' pz':''}</small></span></div>
   <div class="desc">${esc(e.tit)}</div>
   <div class="rows">${sourceRows(e)}</div>
   ${xnote(e)}
   ${obsView(OB.get(id(e)))}<div class="cfoot"><label class="tick"><input type="checkbox" data-k="${esc(id(e))}" ${done[id(e)]?'checked':''}> Surtido</label>${obsBtn(id(e),'#'+e.no+' '+e.cml+' · '+e.comps.map(c=>c.code).join(' + '))}</div></div></article>`};
 function draw(){
  const s=q.value.trim().toUpperCase();const sn=s.replace(/^#/,'');
  const rows=env.filter(e=>(dfil==='all'||e.comps.some(c=>c.fk===dfil))&&(tfil==='all'||e.tp===tfil)&&(show==='all'||(show==='done')===!!done[id(e)])&&(!s||e.cml.includes(s)||String(e.no)===sn||e.comps.some(c=>c.code.toUpperCase().includes(s)||String(c.caja).toUpperCase()===s)||String(e.tit).toUpperCase().includes(s))).sort(C[so.value]);
  root.querySelector('.cnt').textContent=`${rows.length} de ${env.length} publicaciones`;
  const sp=rows.filter(e=>e.tp!=='I'),ind=rows.filter(e=>e.tp==='I');let h='';
  const byBox=so.value==='caja'&&rows.some(e=>cc(e).caja);
  if(sp.length&&!byBox)h+=`<section class="spblock"><div class="sphead"><h2>Revisar primero</h2><span>Compuestos e individuales por / sobre</span></div>`+['C','P','S'].map(t=>{const r=sp.filter(e=>e.tp===t);if(!r.length)return '';
    return `<div class="group tg ${TPC[t]}"><h2>${TPG[t]}</h2><span class="mono">${r.length} publicaciones · ${fmt(r.reduce((x,e)=>x+e.u,0))} u</span></div><div class="list">${r.map(card).join('')}</div>`}).join('')+`</section>`;
  if(byBox){const gs=[];rows.forEach(e=>{const c=cc(e);const p=c.caja?cjParse(c.fk,c.caja):null;const gk=p?c.fk+'|'+p.g:'~'+c.fk;let G=gs.find(x=>x.k===gk);if(!G){G={k:gk,f:c.fk,p,bx:[]};gs.push(G)}const bk=cj(e);let b=G.bx.find(x=>x.c===bk);if(!b){b={c:bk,r:[]};G.bx.push(b)}b.r.push(e)});gs.sort((x,y)=>(!!y.p-!!x.p));
   h+=gs.map(G=>{const all=G.bx.flatMap(b=>b.r);const FF=DATA.facturas[G.f];const GD=G.p&&FF.cajas.groups[G.p.g];
    const head=G.p?`<div class="ggrp"><div class="group"><h2>${blogo(ftitle(G.f))}${esc(fsn(G.f))} · Grupo ${G.p.g} · ${esc(almTxt(G.p))} · ${FF.cajas.globalNumbering?'numeración global de '+G.p.n+' bultos':G.p.n+' cajas'}</h2><span class="mono">${all.length} publicaciones · ${fmt(all.reduce((x,e)=>x+e.u,0))} u${GD&&GD.desc?' · '+esc(GD.desc):''}</span></div>`:`<div class="ggrp"><div class="group"><h2>${blogo(ftitle(G.f))}${esc(fsn(G.f))} · sin lista de cajas</h2><span class="mono">${all.length} publicaciones · ${fmt(all.reduce((x,e)=>x+e.u,0))} u</span></div>`;
    return head+G.bx.map(b=>{const p=cjParse(G.f,b.c);if(!p)return `<div class="list">${b.r.map(card).join('')}</div>`;return `<div class="group sub"><h2>${p?(p.a===p.b?'Caja '+p.a:'Cajas '+p.a+' a '+p.b)+' de '+p.n+(p.alm?' · Almacén '+esc(p.alm):''):esc(b.c==='~'?'Sin caja':b.c)}</h2><span class="mono">${b.r.length} publicaciones · ${fmt(b.r.reduce((x,e)=>x+e.u,0))} u</span></div><div class="list">${b.r.map(card).join('')}</div>`}).join('')+'</div>'}).join('')}
  else if(ind.length){
   if(so.value==='fact'&&!sec&&docs.length>1)h+=docs.map(d=>{const r=ind.filter(e=>e.fk===d);if(!r.length)return '';return `<div class="group"><h2>${blogo(ftitle(d))}${esc(ftitle(d))}</h2><span class="mono">${r.length} publicaciones · ${fmt(r.reduce((x,e)=>x+e.u,0))} u</span></div><div class="list">${r.map(card).join('')}</div>`}).join('');
   else if(so.value==='caja'){const gs=[];ind.forEach(e=>{const k=e.fk+'|'+cj(e);let g=gs.find(x=>x.k===k);if(!g){g={k,f:e.fk,c:cj(e),r:[]};gs.push(g)}g.r.push(e)});
    h+=gs.map(g=>`<div class="group"><h2>${g.c==='~'?blogo(ftitle(g.f))+esc(fsn(g.f))+' · sin caja':esc(cjFmt(g.f,g.c))+' · '+esc(fsn(g.f))}</h2><span class="mono">${g.r.length} publicaciones · ${fmt(g.r.reduce((x,e)=>x+e.u,0))} u</span></div><div class="list">${g.r.map(card).join('')}</div>`).join('')}
   else h+=`<div class="group"><h2>Individuales</h2><span class="mono">${ind.length} publicaciones · ${fmt(ind.reduce((x,e)=>x+e.u,0))} u</span></div><div class="list">${ind.map(card).join('')}</div>`}
  lst.innerHTML=h||'<p>No hay publicaciones con ese filtro.</p>';
 }
 lst.onchange=e=>{const k=e.target.dataset.k;if(!k)return;done[k]=e.target.checked;store.set(KEY,done);count();if(show!=='all')draw();else e.target.closest('.card').classList.toggle('done',e.target.checked)};
 OB=setupObs(root,'fx-o-e-'+num,()=>`Envío ${num} · ${m.dia} · ${m.dest}${sec?' · solo '+DATA.facturas[sec].title:''}`,()=>{const d=env.filter(e=>done[id(e)]);const u=d.reduce((s,e)=>s+e.u,0);return `Avance: ${d.length} de ${env.length} publicaciones · ${fmt(u)} de ${fmt(tot)} unidades (${tot?Math.floor(u/tot*100):0}%)`},new Set(env.map(id)),()=>draw());
 const SOL={fact:'por número de etiqueta',caja:'por caja',code:'por código de proveedor',cml:'por Código ML',qmax:'más unidades primero',qmin:'menos unidades primero'};
 const stUpd=()=>{const t=root.querySelector('.stsel');if(!t)return;t.textContent=(sec?'':(dfil==='all'?'Todas las facturas':'Factura '+fsn(dfil)))+(sec?'':' · ')+'Orden '+SOL[so.value]+(show==='pend'?' · solo pendientes':show==='done'?' · solo surtidos':'');
  root.querySelector('.stprog').textContent=root.querySelector('.dn').textContent+' de '+env.length+' surtidas · '+root.querySelector('.dp').textContent};
 const stGrp=()=>{const g=root.querySelector('.stgrp');if(!g||!root.isConnected)return;const lim=root.querySelector('.sbar').getBoundingClientRect().bottom+4;let cur='',sub='';
  root.querySelectorAll('.lst .ggrp>.group h2, .lst .group.sub h2, .lst > .group h2, .lst .spblock .sphead h2').forEach(h=>{if(h.getBoundingClientRect().top<lim){if(h.closest('.group.sub'))sub=h.textContent;else{cur=h.textContent;sub=''}}});
  g.textContent=cur?('Estás en: '+cur+(sub?' › '+sub:'')):'';g.hidden=!cur};
 window.addEventListener('scroll',stGrp,{passive:true});
 const _draw=draw;draw=function(){_draw();stUpd();stGrp()};const _count=count;
 root.addEventListener('change',()=>setTimeout(stUpd,0));root.addEventListener('click',()=>setTimeout(stUpd,0));
 count();draw();setupLabels(root,num,scopes);
}
function sectionLinks(num,docs,env){
 const rows=[{k:'e:'+num,name:`Todo el envío ${num}`,lines:env,f:null}].concat(docs.map(f=>({k:`e:${num}|${f}`,name:ftitle(f),f,lines:env.filter(e=>e.comps.some(c=>c.fk===f))})));
 return `<details class="secs"><summary><span class="ltitle">Links para almacén</span><span class="mono">envío completo o una sola factura</span></summary><div class="tbl"><table style="min-width:640px"><thead><tr><th>Qué ven</th><th style="text-align:right">Publicaciones</th><th style="text-align:right">Unidades</th><th>Link</th></tr></thead><tbody>${rows.map(r=>{const url=isoUrl(r.k);const t=`Envío ${num} · ${EM[num].dia} · ${EM[num].dest}${r.f?' · solo '+DATA.facturas[r.f].title:''}`;
  return `<tr><td>${r.f?blogo(ftitle(r.f))+esc(r.name)+` <span class="mono">(${esc(fab(r.f))})</span>`:'<b>'+esc(r.name)+'</b>'}</td><td class="n">${r.lines.length}</td><td class="n">${fmt(r.lines.reduce((s,e)=>s+e.u,0))}</td><td style="white-space:nowrap">${url?`<button class="btn cp" data-url="${esc(url)}">Copiar link</button> <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(t+'\n'+url)}">WhatsApp</a> <a class="btn" target="_blank" rel="noopener" href="${esc(url)}">Abrir</a>`:'—'}</td></tr>`}).join('')}</tbody></table></div><p class="mini">Cada link muestra solo ese envío (o solo esa factura dentro del envío), sin menú ni acceso a otros envíos.</p></details>`}
/* ---------- etiquetas ---------- */
const C128=["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];
function c128(s){const v=[104];for(const ch of String(s)){const c=ch.charCodeAt(0)-32;v.push(c<0||c>94?0:c)}let sum=104;for(let i=1;i<v.length;i++)sum+=v[i]*i;v.push(sum%103,106);return v.map(x=>C128[x]).join('')}
function barPath(s,x0,y0,h,mod){const p=c128(s);let x=x0,d='';for(let i=0;i<p.length;i++){const w=+p[i]*mod;if(i%2===0)d+=`M${x} ${y0}h${w}v${h}h-${w}z`;x+=w}return d}
const trunc=(s,n)=>{s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s};
function wrapT(t,max,lines){const w=String(t||'').split(/\s+/).filter(Boolean);const out=[];let cur='';for(const x of w){if((cur+' '+x).trim().length<=max)cur=(cur+' '+x).trim();else{out.push(cur);cur=x;if(out.length===lines)break}}if(out.length<lines&&cur)out.push(cur);
 const used=out.join(' ').length;if(used<String(t||'').trim().length&&out.length)out[out.length-1]=trunc(out[out.length-1]+' ',max);return out.slice(0,lines)}
// View-only grouping: keep the original reservation rows and progress IDs intact.
function shipmentSources(comps){
 const groups=new Map();
 for(const c of comps){
  const key=JSON.stringify(Object.keys(c).filter(k=>k!=='pz').sort().map(k=>[k,c[k]]));
  if(!groups.has(key))groups.set(key,{...c,pz:0});
  groups.get(key).pz+=Number(c.pz);
 }
 return [...groups.values()];
}
function shipmentComponents(e){
 const groups=new Map();
 for(const c of e.comps){
  const key=String(c.sust&&/^en lugar de\s+/i.test(c.sust)?c.sust.replace(/^en lugar de\s+/i,''):c.code).trim().toUpperCase();
  if(!groups.has(key))groups.set(key,{code:key,pz:0,sources:[]});
  const g=groups.get(key);g.pz+=Number(c.pz);g.sources.push(c);
 }
 return [...groups.values()].map(g=>({...g,sources:shipmentSources(g.sources)}));
}

function typeLine(e){const c=e.comps[0];
 if(e.tp==='I'&&e.nf===1&&e.comps.length>1&&e.comps.reduce((s,c)=>s+c.pz,0)===e.u)return {rev:1,text:'INDIVIDUAL · 1 PZ POR UNIDAD'};
 if(e.tp==='C')return {rev:1,text:`COMPUESTO · ${shipmentComponents(e).length} PIEZAS`};
 if(e.tp==='P')return {rev:1,text:`POR ${e.nf} · ${e.nf} PZ POR UNIDAD`};
 if(e.tp==='S')return {rev:1,text:`SOBRE ${e.nf} · 1 PZ = ${e.nf} UNIDADES`};
 const F=DATA.facturas[e.fk];return {rev:0,text:trunc((F?F.title:'')+(c.caja?' · '+cjShort(e.fk,c.caja):''),38)}}
const zEsc=s=>Array.from(new TextEncoder().encode(String(s||''))).map(b=>b<128&&/[A-Za-z0-9 ]/.test(String.fromCharCode(b))?String.fromCharCode(b):'_'+b.toString(16).toUpperCase().padStart(2,'0')).join('');
function zplSeg(g){const e=g.e;const w=String(e.u).length;const tl=typeLine(e);const T=wrapT(e.tit,38,2).join(' ');const sku=e.sku||e.comps.map(c=>c.code).join(' + ');
 return `^XA
^CI28
^PW400
^LL200
^LH0,0
^FO24,12^A0N,26,26^FD${e.no}^FS
^FO25,12^A0N,26,26^FD${e.no}^FS
^FO24,44^A0N,18,18^FH^FD${zEsc(fab(e.fk))}^FS
^FO24,66^A0N,${w>2?17:20},${w>2?17:20}^SN${String(g.from).padStart(w,'0')},1,Y^FS
^FO${30+w*(w>2?9:11)},66^A0N,${w>2?17:20},${w>2?17:20}^FDde ${e.u}^FS
^FO112,10^BY2^BCN,52,N,N^FD${e.cml}^FS
^FO112,66^A0N,24,24^FB268,1,0,C^FD${e.cml}^FS
^FO113,66^A0N,24,24^FB268,1,0,C^FD${e.cml}^FS
^FO24,96^A0N,17,17^FB364,2,0,L^FH^FD${zEsc(T)}^FS
^FO24,136^A0N,15,15^FB364,1,0,L^FH^FDSKU: ${zEsc(trunc(sku,38))}^FS
${tl.rev?`^FO8,156^GB384,38,38^FS
^FO8,164^A0N,24,24^FR^FB384,1,0,C^FH^FD${zEsc(tl.text)}^FS`:`^FO24,164^A0N,20,20^FB364,1,0,L^FH^FD${zEsc(tl.text)}^FS`}
^PQ${g.to-g.from+1},0,1,Y
^XZ`}
function sepInfo(num,scope,i,nl,n,st){return [`ENVÍO ${num} · ${EM[num].dest}`,trunc(scope.name,44),`LOTE ${i+1} DE ${nl} · ${fmt(n)} ETIQUETAS`,`Etiquetas ${fmt(st)} a ${fmt(st+n-1)}`]}
function zplSep(L){return `^XA
^CI28
^PW400
^LL200
^LH0,0
^FO0,14^A0N,30,30^FB400,1,0,C^FH^FD${zEsc(L[0])}^FS
^FO10,56^A0N,22,22^FB380,2,0,C^FH^FD${zEsc(L[1])}^FS
^FO8,112^GB384,40,40^FS
^FO8,122^A0N,22,22^FR^FB384,1,0,C^FH^FD${zEsc(L[2])}^FS
^FO0,166^A0N,20,20^FB400,1,0,C^FH^FD${zEsc(L[3])}^FS
^XZ`}
const SVGF='font-family="Arial Narrow,Arial,Helvetica,sans-serif"';
function labelSVG(e,sn,ref){const w=String(e.u).length;const tl=typeLine(e);const T=wrapT(e.tit,38,2);const sku=e.sku||e.comps.map(c=>c.code).join(' + ');
 return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" fill="#fff"/><g ${SVGF} fill="#000" dominant-baseline="hanging">
<text x="24" y="12" font-size="29" font-weight="700">${e.no}</text><text x="24" y="44" font-size="19" font-weight="700">${esc(fab(e.fk))}</text><text x="24" y="66" font-size="${w>2?18:21}">${String(sn).padStart(w,'0')} de ${e.u}</text>
${ref?`<use href="#bc-${e.cml}"/>`:`<path d="${barPath(e.cml,112,10,52,2)}"/>`}
<text x="246" y="66" font-size="26" font-weight="700" text-anchor="middle">${e.cml}</text>
${T.map((t,i)=>`<text x="24" y="${96+i*19}" font-size="19">${esc(t)}</text>`).join('')}
<text x="24" y="136" font-size="16">SKU: ${esc(trunc(sku,38))}</text>
${tl.rev?`<rect x="8" y="156" width="384" height="38"/><text x="200" y="163" font-size="25" font-weight="700" fill="#fff" text-anchor="middle">${esc(tl.text)}</text>`:`<text x="24" y="164" font-size="21">${esc(tl.text)}</text>`}
</g></svg>`}
function sepSVG(L){return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" fill="#fff"/><g ${SVGF} fill="#000" dominant-baseline="hanging" text-anchor="middle">
<text x="200" y="14" font-size="29" font-weight="700">${esc(L[0])}</text>${wrapT(L[1],34,2).map((t,i)=>`<text x="200" y="${56+i*24}" font-size="23">${esc(t)}</text>`).join('')}
<rect x="8" y="112" width="384" height="40"/><text x="200" y="122" font-size="23" font-weight="700" fill="#fff">${esc(L[2])}</text><text x="200" y="166" font-size="21">${esc(L[3])}</text></g></svg>`}
function lots(lines,k){const out=[];let cur=[],n=0;
 for(const e of lines){let left=e.u,from=1;while(left>0){const take=k?Math.min(left,k-n):left;cur.push({e,from,to:from+take-1});n+=take;from+=take;left-=take;if(k&&n>=k){out.push(cur);cur=[];n=0}}}
 if(cur.length)out.push(cur);return out}
const lotN=l=>l.reduce((s,g)=>s+g.to-g.from+1,0);
function labelsPanel(num,scopes){const S=scopes[0];
 return `<details class="labs"><summary><span class="ltitle">Imprimir etiquetas</span><span class="mono">${fmt(S.n)} etiquetas · por lotes de 50 o 100</span></summary><div class="lbody">
  ${scopes.length>1?`<label class="sel">Qué imprimir <select class="lsc">${scopes.map((s,i)=>`<option value="${i}">${s.grp?'\u00a0\u00a0\u00a0↳ ':''}${esc(s.grp?s.name.replace(/^.*? · (Grupo )/,'$1'):s.name)}${s.short?' ('+esc(s.short)+')':''} · ${fmt(s.n)} etiquetas</option>`).join('')}</select></label>`:`<div><b>${esc(S.name)}</b> <span class="mono">· ${fmt(S.n)} etiquetas</span></div>`}
  <div class="lrow lrng" hidden><span class="mini">Cajas del grupo:</span><label class="sel">de la <input type="number" class="lra" min="1" step="1" inputmode="numeric"></label><label class="sel">a la <input type="number" class="lrb" min="1" step="1" inputmode="numeric"></label><span class="mini lrn"></span><button class="btn lrall" type="button">Grupo completo</button></div><div class="lrbx"></div>
  <div class="lrow"><span class="mini">Dividir en lotes de</span><div class="seg lseg"><button data-k="0" aria-pressed="false">Sin dividir</button><button data-k="50" aria-pressed="false">50</button><button data-k="100" aria-pressed="true">100</button></div><label class="sel">Otro <input type="number" class="lk" min="1" step="1" inputmode="numeric" placeholder="Ej. 30"></label><label class="tick" style="margin:0"><input type="checkbox" class="lsep" checked> Etiqueta separadora al inicio de cada lote</label></div>
  <div class="lots"></div><div class="lmsg mini" role="status"></div><div class="lprev"></div>
  <p class="mini">Imprimir abre la ventana de impresión del navegador: elige la impresora de etiquetas, tamaño 2 x 1 pulgadas (50.8 x 25.4 mm) y márgenes en cero. Descargar ZPL da el archivo en el mismo formato de la plantilla full, para mandarlo directo a la impresora.</p></div></details>`}
function setupLabels(root,num,scopes){const P=root.querySelector('.labs');if(!P)return;let sci=0,k=100,L=[],ra=0,rb=0;
 const rng=P.querySelector('.lrng'),iA=P.querySelector('.lra'),iB=P.querySelector('.lrb'),rbx=P.querySelector('.lrbx');
 const bxL=(e,G)=>{const c=e.comps.find(c=>c.fk===G.f&&c.caja);return c?cjParse(G.f,c.caja):null};
 const cur=()=>{const S=scopes[sci];const G=S.grp;if(!G||!ra||!rb||(ra===1&&rb===G.n))return S;const lo=Math.min(ra,rb),hi=Math.max(ra,rb);
  const ls=S.lines.filter(e=>{const p=bxL(e,G);return p&&p.b>=lo&&p.a<=hi});return {name:S.name.replace(/ \(\d+ cajas\)$/,'')+` · caja${lo===hi?' '+lo:'s '+lo+' a '+hi} de ${G.n}`,short:S.short+lo+(hi!==lo?'-'+hi:''),lines:ls,n:ls.reduce((x,e)=>x+e.u,0)}};
 function setRng(){const G=scopes[sci].grp;rng.hidden=!G;rbx.innerHTML='';if(!G){ra=rb=0;return}iA.max=iB.max=G.n;if(!ra){ra=1;rb=G.n}iA.value=ra;iB.value=rb;
  const S=cur();P.querySelector('.lrn').textContent=`de ${G.n} · ${fmt(S.n!=null?S.n:scopes[sci].n)} etiquetas`;
  const blocks=[];scopes[sci].lines.forEach(e=>{const p=bxL(e,G);if(p&&!blocks.some(b=>b.a===p.a&&b.b===p.b))blocks.push(p)});blocks.sort((x,y)=>x.a-y.a);
  rbx.innerHTML=`<div class="chips bxch"><span class="mini">Caja por caja:</span>${blocks.map(b=>`<button type="button" class="chip${ra===b.a&&rb===b.b?' sel':''}" data-ra="${b.a}" data-rb="${b.b}">${b.a===b.b?'Caja '+b.a:'Cajas '+b.a+'–'+b.b}</button>`).join('')}</div>${blocks.some(b=>b.a!==b.b)?'<p class="mini">Cuando un mismo producto viene repartido en varias cajas (por ejemplo cajas 1–8), sus etiquetas salen juntas aunque elijas solo una de esas cajas.</p>':''}`}
 rbx.onclick=ev=>{const b=ev.target.closest('[data-ra]');if(!b)return;ra=+b.dataset.ra;rb=+b.dataset.rb;setRng();drawLots()};
 iA.oninput=iB.oninput=()=>{const G=scopes[sci].grp;const a=parseInt(iA.value,10),b=parseInt(iB.value,10);if(a>0&&b>0&&a<=G.n&&b<=G.n){ra=a;rb=b;setRng();drawLots()}};
 P.querySelector('.lrall').onclick=()=>{const G=scopes[sci].grp;ra=1;rb=G.n;setRng();drawLots()};
 const lotsEl=P.querySelector('.lots'),prev=P.querySelector('.lprev'),msg=P.querySelector('.lmsg'),sep=P.querySelector('.lsep');
 const starts=()=>{let s=1;return L.map(l=>{const a=s;s+=lotN(l);return a})};
 function drawLots(){L=lots(cur().lines,k);const st=starts();prev.innerHTML='';msg.textContent='';
  lotsEl.innerHTML=L.map((l,i)=>{const n=lotN(l);const a=l[0].e.no,b=l[l.length-1].e.no;return `<div class="lot"><div><b>Lote ${i+1}</b> <span class="mono">· etiquetas ${fmt(st[i])} a ${fmt(st[i]+n-1)} · #${a}${b!==a?' a #'+b:''} · ${fmt(n)} etiq.</span></div><div class="lbtn"><button class="btn" data-a="ver" data-i="${i}">Ver</button><button class="btn pri" data-a="imp" data-i="${i}">Imprimir</button><button class="btn" data-a="zpl" data-i="${i}">Descargar ZPL</button><button class="btn" data-a="cpz" data-i="${i}">Copiar ZPL</button></div></div>`}).join('')||'<p class="mini" style="padding:8px">Sin etiquetas.</p>'}
 const sepL=i=>sepInfo(num,cur(),i,L.length,lotN(L[i]),starts()[i]);
 const zplLot=i=>(sep.checked?zplSep(sepL(i))+'\n':'')+L[i].map(zplSeg).join('\n');
 const fname=i=>`Etiquetas_Envio${num}${cur().short?'_'+cur().short.replace(/\s+/g,''):''}_lote${i+1}de${L.length}.zpl`;
 const sl=P.querySelector('.lsc');if(sl)sl.onchange=()=>{sci=+sl.value;ra=rb=0;setRng();drawLots()};
 P.querySelector('.lseg').onclick=ev=>{const b=ev.target.closest('[data-k]');if(!b)return;k=+b.dataset.k;P.querySelector('.lk').value='';P.querySelectorAll('.lseg button').forEach(x=>x.setAttribute('aria-pressed',x===b));drawLots()};
 P.querySelector('.lk').oninput=ev=>{const v=parseInt(ev.target.value,10);if(v>0){k=v;P.querySelectorAll('.lseg button').forEach(x=>x.setAttribute('aria-pressed','false'));drawLots()}};
 lotsEl.onclick=async ev=>{const b=ev.target.closest('[data-a]');if(!b)return;const i=+b.dataset.i;const a=b.dataset.a;
  if(a==='ver'){const items=[];if(sep.checked)items.push(sepSVG(sepL(i)));for(const g of L[i]){for(let s=g.from;s<=g.to&&items.length<40;s++)items.push(labelSVG(g.e,s,false));if(items.length>=40)break}
   const n=lotN(L[i])+(sep.checked?1:0);prev.innerHTML=`<div class="group" style="grid-column:1/-1;margin:0"><h3>Vista previa · lote ${i+1}</h3><span class="mono">${n>40?'primeras 40 de '+fmt(n):fmt(n)+' etiquetas'}</span></div>`+items.map(x=>`<div class="lp">${x}</div>`).join('');prev.scrollIntoView({block:'nearest',behavior:'smooth'})}
  else if(a==='imp')printLot(L[i],sep.checked?sepL(i):null,msg);
  else if(a==='zpl'){await saveText(fname(i),zplLot(i));msg.textContent=`Lote ${i+1}: archivo ZPL generado.`}
  else if(a==='cpz'){try{await navigator.clipboard.writeText(zplLot(i));msg.textContent=`Lote ${i+1}: ZPL copiado.`}catch(_){msg.textContent='No se pudo copiar; usa Descargar ZPL.'}}};
 setRng();drawLots()}
function printLot(lot,sepL,msg){const pa=document.getElementById('printArea');if(!pa)return;
 const codes=[...new Set(lot.map(g=>g.e.cml))];
 let h=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${codes.map(c=>`<path id="bc-${c}" d="${barPath(c,112,10,52,2)}"/>`).join('')}</defs></svg>`;
 if(sepL)h+=`<div class="pl">${sepSVG(sepL)}</div>`;
 lot.forEach(g=>{for(let s=g.from;s<=g.to;s++)h+=`<div class="pl">${labelSVG(g.e,s,true)}</div>`});
 pa.innerHTML=h;const st=document.createElement('style');st.textContent='@page{size:50.8mm 25.4mm;margin:0}';document.head.appendChild(st);document.body.classList.add('plab');
 const clean=()=>{document.body.classList.remove('plab');st.remove();pa.innerHTML='';removeEventListener('afterprint',clean)};addEventListener('afterprint',clean);
 setTimeout(()=>{try{window.print()}catch(_){clean();if(msg)msg.textContent='Esta vista no permite imprimir; abre el link del envío o usa Descargar ZPL.'}},60)}
async function saveText(name,text){
 try{if(window.claude&&window.claude.use){const dl=await window.claude.use('downloads');if(dl){try{await dl.save({filename:name.replace(/\.zpl$/,'.txt'),data:text});return}catch(e){if(e&&e.code==='declined')return}}}}catch(_){}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
/* ---------- aviso de factura incompleta ---------- */
function parcialNote(keys){return keys.filter(k=>DATA.facturas[k]&&DATA.facturas[k].parcial).map(k=>{const F=DATA.facturas[k];
 return `<div class="note warn"><b>${F.encamino?'En camino':'Factura incompleta'} · ${esc(F.title)}.</b> ${esc(F.parcial)}${F.obsr&&F.obsr.length?`<div class="mini" style="margin-top:4px">Recepción: ${esc(F.obsr.join(' '))}</div>`:''}</div>`}).join('')}
/* ---------- observaciones ---------- */
const OREAS=['Dañado','Color o modelo distinto','Falta pieza','Sobra pieza','Código o etiqueta no coincide','Otro'];
const obsBtn=(id,label)=>`<button type="button" class="btn obtn" data-oid="${esc(id)}" data-olabel="${esc(label)}">Observación</button>`;
const obsView=o=>o?`<div class="obsv"><b>${esc(o.r)}</b>${o.t?': '+esc(o.t):''}</div>`:'';
function obsPanel(){return `<details class="obsp"><summary><span class="ltitle">Observaciones</span><span class="ocount mono">sin observaciones</span></summary><div class="lbody">
 <p class="mini" style="margin:0">Anota daños, piezas que faltan o sobran, colores o modelos distintos a lo pedido. Usa el botón <b>Observación</b> de cada producto, o agrega una general (por ejemplo, una caja abierta).</p>
 <div class="olist"></div>
 <div class="lrow"><button type="button" class="btn ogen">Agregar observación general</button></div>
 <div class="lrow"><label class="sel">Quién anota <input type="text" class="owho" autocomplete="name" placeholder="Tu nombre"></label><button type="button" class="btn wa osend">Enviar a oficina por WhatsApp</button><button type="button" class="btn ocopy">Copiar texto</button><span class="mini omsg" role="status"></span></div></div></details>`}
function setupObs(root,key,titleFn,progFn,valid,redraw){
 let O=store.get(key);const P=root.querySelector('.obsp');
 const mine=()=>Object.entries(O).filter(([k])=>valid.has(k)||k.startsWith('g:')).sort((a,b)=>a[1].ts-b[1].ts);
 const who=P.querySelector('.owho');try{who.value=localStorage.getItem('fx-who')||''}catch(_){}
 who.oninput=()=>{try{localStorage.setItem('fx-who',who.value)}catch(_){}};
 function list(){const L=mine();P.querySelector('.ocount').textContent=L.length?`${L.length} anotada${L.length>1?'s':''}`:'sin observaciones';P.classList.toggle('has',L.length>0);
  P.querySelector('.olist').innerHTML=L.length?L.map(([k,o])=>`<div class="orow"><div><b>${esc(o.r)}</b> · <span class="mono">${esc(o.label)}</span>${o.t?`<div>${esc(o.t)}</div>`:''}</div><button type="button" class="btn" data-oed="${esc(k)}">Editar</button></div>`).join(''):''}
 function text(){const L=mine();const d=new Date();
  return [`OBSERVACIONES · ${titleFn()}`,`Anotó: ${who.value.trim()||'(sin nombre)'} · ${d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}`,progFn(),'',...L.map(([k,o],i)=>`${i+1}. ${o.label} — ${o.r}${o.t?': '+o.t:''}`)].join('\n')}
 function edit(id,label){const o=O[id]||{};const dl=dialog(`<h2>Observación</h2><div class="mono" style="margin:4px 0 10px">${esc(label)}</div>
   <div class="legend oreas">${OREAS.map(r=>`<button type="button" class="chip" data-r="${esc(r)}" aria-pressed="${o.r===r}">${esc(r)}</button>`).join('')}</div>
   <label class="mini" style="display:block;margin-top:10px">Detalle (qué pasó, cuántas piezas, qué color llegó…)</label><textarea class="otxt" rows="4">${esc(o.t||'')}</textarea>
   <div class="lrow" style="margin-top:10px"><button type="button" class="btn pri osave">Guardar</button>${O[id]?'<button type="button" class="btn odel">Borrar</button>':''}<button type="button" class="btn ocancel">Cancelar</button><span class="mini oerr" role="status"></span></div>`);
  let r=o.r||'';dl.querySelector('.oreas').onclick=e=>{const b=e.target.closest('[data-r]');if(!b)return;r=b.dataset.r;dl.querySelectorAll('.oreas [data-r]').forEach(x=>x.setAttribute('aria-pressed',x===b))};
  dl.querySelector('.osave').onclick=()=>{const t=dl.querySelector('.otxt').value.trim();if(!r&&!t){dl.querySelector('.oerr').textContent='Elige un motivo o escribe el detalle.';return}
   O[id]={r:r||'Otro',t,label,ts:o.ts||Date.now()};store.set(key,O);closeDialog();list();redraw()};
  const del=dl.querySelector('.odel');if(del)del.onclick=()=>{delete O[id];store.set(key,O);closeDialog();list();redraw()};
  dl.querySelector('.ocancel').onclick=closeDialog;setTimeout(()=>dl.querySelector('.otxt').focus(),50)}
 root.addEventListener('click',e=>{const b=e.target.closest('.obtn');if(b){edit(b.dataset.oid,b.dataset.olabel);return}
  const ed=e.target.closest('[data-oed]');if(ed){const k=ed.dataset.oed;edit(k,O[k].label);return}});
 P.querySelector('.ogen').onclick=()=>edit('g:'+Date.now(),'General');
 P.querySelector('.osend').onclick=()=>{if(!mine().length){P.querySelector('.omsg').textContent='Todavía no hay observaciones.';return}window.open('https://wa.me/?text='+encodeURIComponent(text()),'_blank','noopener')};
 P.querySelector('.ocopy').onclick=async()=>{try{await navigator.clipboard.writeText(text());P.querySelector('.omsg').textContent='Texto copiado.'}catch(_){P.querySelector('.omsg').textContent='No se pudo copiar.'}};
 list();return {get:id=>O[id]}}
/* ---------- ventanas ---------- */
function dialog(html){let o=document.getElementById('dlg');if(!o){o=document.createElement('div');o.id='dlg';o.className='dlgwrap';o.innerHTML='<div class="dlg" role="dialog" aria-modal="true"></div>';document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target===o)closeDialog()})}
 o.querySelector('.dlg').innerHTML=html;o.hidden=false;document.body.classList.add('zopen');return o.querySelector('.dlg')}
function closeDialog(){const o=document.getElementById('dlg');if(o){o.hidden=true;o.querySelector('.dlg').innerHTML=''}document.body.classList.remove('zopen')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDialog()});
/* ---------- ayuda ---------- */
const HELP=`<h2>Cómo usar esta página</h2>
<p>Aquí está lo que tienes que surtir. Cada tarjeta es una publicación de Mercado Libre (envío) o un código del proveedor (factura). El link solo muestra tu envío, tu factura o tu parte de una factura.</p>
<h3>Paso a paso para surtir un envío</h3>
<ol>
<li><b>Empieza por el recuadro “Revisar primero”.</b> Ahí están los compuestos y los individuales por y sobre, que se arman distinto.</li>
<li><b>Busca el código</b> en la barra de arriba: Código ML, código del proveedor, número de caja o número de etiqueta (#12). Solo se quedan en pantalla los que coinciden.</li>
<li><b>Toma exactamente las piezas que dice cada renglón</b>, de la factura y la caja que indica. No tomes la caja completa.</li>
<li><b>Pega una etiqueta por cada unidad.</b> El número grande de la etiqueta es el mismo # de la tarjeta.</li>
<li><b>Marca “Surtido”.</b> Arriba ves cuántas publicaciones y unidades llevas y el porcentaje de avance. Con el botón <b>Pendientes</b> ves solo lo que falta.</li>
</ol>
<p class="mini">Las palomitas y las observaciones se guardan en este celular o computadora. Si cambias de equipo no aparecen.</p>
<h3>Los tres tipos especiales</h3>
<div class="htype tc"><b>COMPUESTO</b> (naranja): una unidad se arma con dos o más piezas distintas, por ejemplo un juego de rin delantero y trasero o una caja de velocidades con sus engranes. Junta todas las piezas del juego y pon <b>una sola etiqueta por juego</b>. Si una pieza viene de otra factura, la tarjeta lo indica.</div>
<div class="htype tp"><b>INDIVIDUAL POR</b> (azul): cada unidad lleva varias piezas iguales. “Por 10” quiere decir 10 piezas en cada unidad; si dice 5 unidades, son 50 piezas y 5 etiquetas.</div>
<div class="htype ts"><b>INDIVIDUAL SOBRE</b> (verde): una pieza del proveedor alcanza para varias unidades. “Sobre 2” quiere decir que un par se separa en 2 unidades (por ejemplo, un par de direccionales). Separa y etiqueta cada unidad.</div>
<p><b>Individual</b> (sin color): una pieza es una unidad.</p>
<h3>¿Por qué solo se toman unas piezas de una factura?</h3>
<p>Lo que llega no se va todo a Full. Se manda solo lo que se va a vender en los próximos días; el resto se queda en bodega o se aparta para los siguientes envíos. Por eso cada renglón dice cuántas piezas tomar y la factura marca en morado lo que <b>se queda en bodega</b>.</p>
<h3>¿Por qué un envío usa varias facturas?</h3>
<p>Un envío se arma con lo que llegó de distintos proveedores y días. Cada renglón dice de qué factura y caja sale. Si te pasaron el link de una sola factura, solo ves lo que te toca de ella.</p>
<h3>Observaciones</h3>
<p>Si algo llega dañado, falta o sobra, o el proveedor mandó otro color o modelo, presiona <b>Observación</b> en esa tarjeta, elige el motivo y escribe el detalle. Para algo que no es de un producto (por ejemplo, una caja abierta) usa <b>Agregar observación general</b>. Al terminar, abre <b>Observaciones</b> arriba, escribe tu nombre y presiona <b>Enviar a oficina por WhatsApp</b>.</p>

<h3>Fotos</h3>
<p>Toca la foto para verla en grande y revisar detalles (color, modelo, conector).</p>
<p>Si tienes dudas, anótalo en observaciones o pregúntale a tu encargado.</p>`;
function openHelp(){const d=dialog(HELP+`<div class="lrow" style="margin-top:14px"><button type="button" class="btn pri hok">Entendido</button></div>`);d.classList.add('help');
 d.querySelector('.hok').onclick=()=>{try{localStorage.setItem('fx-help-v1','1')}catch(_){}closeDialog()};d.scrollTop=0}
function addHelpBtn(){if(document.querySelector('.helpfab'))return;const b=document.createElement('button');b.type='button';b.className='helpfab';b.textContent='Ayuda';b.onclick=openHelp;document.body.appendChild(b)}

/* ---------- resumen ---------- */
function track(F){const t={};let qM=0,qG=0;F.items.forEach(i=>{const b=itemBod(i);i.dest.forEach(d=>t[d.env]=(t[d.env]||0)+d.pz);if(i.stay>0){if(b.bod==='G')qG+=i.stay;else qM+=i.stay}});return {t,qM,qG}}
function renderResumen(root){
 const W=(DATA.week?DATA.week.envs:['241','242','243','276','277','278','279','280']).filter(n=>DATA.envios[n]);
 const rowsE=W.map(n=>{const E=DATA.envios[n]||{lines:[]};const m=EM[n];const a=E.lines.reduce((s,l)=>s+l.u,0);
   const byf={};E.lines.forEach(l=>{const fk=l.comps[0].fk;byf[fk]=(byf[fk]||0)+l.u});
   const st=a>=m.meta?'Armado':`Falta ${fmt(m.meta-a)}`;const nc=E.lines.filter(l=>l.tp!=='I').length;
   return `<tr><td class="mono"><b><a href="${link('e',n)}">${n}</a></b></td><td>${m.dia}</td><td>${m.bod==='EDOMEX'?'Edo. Méx. · '+(m.size==='G'?'grandes':'medianos')+' · '+m.dest:'Cuernavaca'}</td><td class="n">${fmt(m.meta)}</td><td class="n">${fmt(a)}</td><td><div class="prog"><i style="width:${Math.min(100,a/m.meta*100)}%"></i></div></td><td><span class="status ${a>=m.meta?'c-now':'c-later'}">${st}</span>${nc?` <span class="ttag tc">${nc} ${nc===1?"especial":"especiales"}</span>`:''}</td><td>${Object.entries(byf).sort((x,y)=>y[1]-x[1]).map(([f,u])=>`<span style="white-space:nowrap">${blogo(ftitle(f))}<a href="${link('f',f)}">${esc(ftitle(f))}</a> (${fmt(u)})</span>`).join(' · ')}</td></tr>`});
 const arm=W.reduce((s,n)=>s+(DATA.envios[n]?DATA.envios[n].lines.reduce((x,l)=>x+l.u,0):0),0),meta=W.reduce((s,n)=>s+EM[n].meta,0);
 const NX=Object.keys(DATA.envios).filter(n=>!W.includes(n)).sort();
 const keys=Object.keys(DATA.facturas).filter(k=>!DATA.facturas[k].encamino);
 const arr=keys.map(k=>{const F=DATA.facturas[k];const edo=F.bod==='EDOMEX';const {t,qM,qG}=track(F);const all=F.items.reduce((s,i)=>s+i.qty,0);
   let sal=0,sem=0,esp=0,med=0,gra=0;Object.entries(t).forEach(([e,v])=>{const p=phase(e);if(p==='prev')sal+=v;else if(p==='now')sem+=v;else esp+=v;if(EM[e].size==='G')gra+=v;else med+=v});
   const q=qM+qG;
   const chips=Object.keys(t).sort((a,b)=>ord(a)-ord(b)).map(e=>`<span class="status ${PCLS[phase(e)]}" style="margin:0 4px 4px 0">${e.startsWith('S')?'Sáb 10 · '+EM[e].dest:'Envío '+e}${edo?' · '+(EM[e].size==='G'?'G':'M'):''} · ${fmt(t[e])}</span>`).join('')+(q>0?`<span class="status c-stay" style="margin:0 4px 4px 0">Bodega${edo?' · M '+fmt(qM)+' · G '+fmt(qG):''} · ${fmt(q)}</span>`:'');
   return {k,F,html:`<tr><td style="white-space:nowrap">${esc(F.llego)}</td><td>${edo?'Edo. Méx.':'Cuernavaca'}</td><td><span class="status c-next">Pedido ${esc(F.pedido)}</span></td><td>${blogo(F.title)}<a href="${link('f',k)}">${esc(F.title)}</a>${F.doc||F.bultos?`<div class="mono" style="color:var(--muted)">${esc([F.doc,F.bultos].filter(Boolean).join(' · '))}</div>`:''}</td><td class="n">${fmt(all)}</td><td class="n">${sal?fmt(sal):'—'}</td><td class="n">${sem?fmt(sem):'—'}</td><td class="n">${esp?fmt(esp):'—'}</td><td class="n">${q?fmt(q):'—'}</td><td class="n">${edo?fmt(med+qM):'—'}</td><td class="n">${edo?fmt(gra+qG):'—'}</td><td style="min-width:260px">${chips}</td></tr>`}});
 const DO=d=>{const x=String(d).match(/(\d+)/);return x?+x[1]:0};
 arr.sort((a,b)=>DO(a.F.llego)-DO(b.F.llego));
 root.innerHTML=`<div class="docHead"><div><div class="eyebrow">Envíos a Full · ${esc(DATA.week?DATA.week.label:'')}</div><h1>Cómo vamos esta semana</h1></div>
  <div class="meta"><span>Actualizado <b>${DATA.updated}</b></span><span>Meta <b>${fmt(meta)} u.</b></span><span>Armado <b>${fmt(arm)} u. (${Math.round(arm/meta*100)}%)</b></span></div></div>
  <div class="share"><button class="btn xls" data-xk="r" data-xkey="resumen">Exportar a Excel</button><span class="mini">Esta vista es solo para oficina. Al almacén compártele el link de cada envío o factura.</span></div>
  ${alertsBlock(true)}
  <div class="tbl"><table><thead><tr><th>Envío</th><th>Día</th><th>Bodega / destino</th><th style="text-align:right">Meta</th><th style="text-align:right">Armado</th><th>Avance</th><th>Estado</th><th>De qué facturas sale (u. ML)</th></tr></thead><tbody>${rowsE.join('')}</tbody></table></div>
  <h2 style="margin-top:22px">Siguientes envíos (ya apartados)</h2>
  <div class="legend" style="margin-top:8px">${NX.map(n=>`<a class="chip c-later" href="${link('e',n)}">Envío ${n} · ${EM[n].dia} · ${EM[n].dest} <span class="n">${fmt(DATA.envios[n].lines.reduce((s,l)=>s+l.u,0))} u</span></a>`).join('')}</div>
  <h2 style="margin-top:22px">Ya llegó</h2>
  <div class="tbl" style="margin-top:8px"><table style="min-width:1250px"><thead><tr><th>Llegó</th><th>Bodega</th><th>Pedido</th><th>Proveedor · documento</th><th style="text-align:right">Piezas</th><th style="text-align:right">Ya salió</th><th style="text-align:right">Envíos de esta semana</th><th style="text-align:right">En espera (siguientes)</th><th style="text-align:right">Se queda en bodega</th><th style="text-align:right">Bodega medianos</th><th style="text-align:right">Bodega grandes</th><th>Reparto por envío (piezas)</th></tr></thead><tbody>${arr.map(a=>a.html).join('')}
   <tr><td>Mar 07 oct</td><td>Cuernavaca</td><td><span class="status c-next">Pedido 53</span></td><td>${blogo('KINGMOTO')}KINGMOTO · cotización 29782</td><td class="n">785</td><td class="n">762</td><td class="n">—</td><td class="n">—</td><td class="n">23</td><td class="n">—</td><td class="n">—</td><td><span class="status c-next">Vie 09 · envío 239 · 762</span><span class="status c-stay">Bodega · 23</span></td></tr>
   <tr><td>Antes del 10</td><td>Edo. Méx.</td><td><span class="status c-next">Pedido 53</span></td><td>${blogo('Azcapotzalco')}Moto Azcapotzalco · G-163424</td><td class="n">33</td><td class="n">33</td><td class="n">—</td><td class="n">—</td><td class="n">—</td><td class="n">16</td><td class="n">17</td><td><span class="status c-next">Sáb 10 · MXRC03 · 16</span><span class="status c-next">Sáb 10 · MXCD05 · 17</span></td></tr></tbody></table></div>
  <h2 style="margin-top:22px">Falta por llegar</h2>
  <div class="tbl" style="margin-top:8px"><table style="min-width:640px"><thead><tr><th>Pedido</th><th>Bodega</th><th>Proveedor · documento</th><th style="text-align:right">Piezas</th><th>Cómo va</th></tr></thead><tbody>${DATA.pend.map(r=>`<tr><td><span class="status ${r[0]==='53'?'c-next':'c-later'}">Pedido ${r[0]}</span></td><td>${r[1]}</td><td>${blogo(r[2])}${r[2]}</td><td class="n">${r[3]==null?'—':fmt(r[3])}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div>
  <div class="note" style="border-left-color:var(--stay)"><b>Se queda en bodega:</b> cada factura lo marca en morado y por bodega. Eso no sale en ningún envío.</div>`;
}
/* ---------- listas ---------- */
let _EF=null;function envsOf(fk){if(!fk)return '';if(!_EF){_EF={};for(const k of Object.keys(DATA.envios).sort())for(const l of DATA.envios[k].lines)for(const c of l.comps)(_EF[c.fk]=_EF[c.fk]||new Set()).add(k)}
 const es=[...(_EF[fk]||[])];return es.length?` <span class="envto">→ ${es.map(k=>`<a class="envlk" href="${link('e',k)}">Envío ${k}</a>`).join(' ')}</span>`:` <span class="envto none">→ sin envío asignado</span>`}
function pedStatus(){
 const P=DATA.peds;const g={};P.forEach(r=>{const k=r[0]+'|'+r[1]+'|'+r[2];(g[k]=g[k]||[]).push(r)});
 const peds=[...new Set(P.map(r=>r[0]))];
 return peds.map(p=>{const bods=[...new Set(P.filter(r=>r[0]===p).map(r=>r[1]))];
  const docsAll=P.filter(r=>r[0]===p);const ok=docsAll.filter(r=>r[5]).length;
  return `<div class="group"><h2><span class="pedtag">Pedido ${p}</span> ${ok} de ${docsAll.length} documentos llegaron</h2></div>`+bods.map(b=>{
   const keys=Object.keys(g).filter(k=>k.startsWith(p+'|'+b+'|'));
   const rows=keys.map(k=>{const L=g[k];const n=L.length,ll=L.filter(r=>r[5]).length;const exp=L.reduce((s,r)=>s+(r[4]||0),0),got=L.filter(r=>r[5]).reduce((s,r)=>s+(r[4]||0),0);
     const part=L.some(r=>r[7]);const st=ll===n&&!part?['Completo','c-now']:ll>0?['Parcial','c-later']:['Sin llegar','c-stay'];
     const det=L.map(r=>r[5]?`<div class="dl ${r[7]?'dpar':'dok'}">${r[7]?'◐':'✓'} ${r[6]?`<a href="${link('f',r[6])}">${esc(r[3])}</a>`:esc(r[3])} <span class="mono">· ${fmt(r[4])} pz · llegó ${esc(r[5])}</span>${envsOf(r[6])}</div>`:`<div class="dl dpen">◻ ${r[6]?`<a href="${link('f',r[6])}">${esc(r[3])}</a>`:esc(r[3])} <span class="mono">· ${r[4]==null?'—':fmt(r[4])+' pz'} · ${r[6]?'en camino (facturado)':'pendiente'}</span></div>`).join('');
     return {st,html:`<tr><td style="white-space:nowrap">${blogo(L[0][2])}<b>${esc(L[0][2])}</b></td><td class="n">${ll} / ${n}</td><td class="n">${exp?fmt(got)+' / '+fmt(exp):'—'}</td><td style="min-width:90px"><div class="prog"><i style="width:${exp?got/exp*100:0}%"></i></div></td><td><span class="status ${st[1]}">${st[0]}</span></td><td>${det}</td></tr>`}});
   const order={'Sin llegar':0,'Parcial':1,'Completo':2};rows.sort((a,b)=>order[a.st[0]]-order[b.st[0]]);
   return `<h3 style="margin:12px 0 6px">${b}</h3><div class="tbl"><table style="min-width:760px"><thead><tr><th>Marca</th><th style="text-align:right">Documentos</th><th style="text-align:right">Piezas llegadas</th><th>Avance</th><th>Estado</th><th>Documentos</th></tr></thead><tbody>${rows.map(r=>r.html).join('')}</tbody></table></div>`}).join('')}).join('');
}
function renderFacturas(root){
 const ks=Object.keys(DATA.facturas);
 root.innerHTML=`<div class="docHead"><div><div class="eyebrow">Recepción</div><h1>Cómo van llegando los pedidos</h1></div><div class="regbtns">${['CUERNAVACA','EDOMEX'].filter(b=>(DATA.llinks||{})[b]).map(b=>`<a class="btn pri" target="_blank" rel="noopener" href="${esc(DATA.llinks[b])}">Registro recepción · ${b==='EDOMEX'?'Edo. Méx.':'Cuernavaca'}</a>`).join('')}</div></div>`+alertsBlock(false)+llegadasAdmin()+cmpTable()+pedStatus()+
  `<div class="group" style="margin-top:26px"><h2>Facturas que llegaron (detalle por producto)</h2></div>`+['CUERNAVACA','EDOMEX'].map(b=>`<h3 style="margin:10px 0 6px">${b==='EDOMEX'?'Edo. Méx.':'Cuernavaca'}</h3><div class="legend">${ks.filter(k=>DATA.facturas[k].bod===b&&!DATA.facturas[k].encamino).map(k=>{const F=DATA.facturas[k];return `<a class="chip" href="${link('f',k)}"><span class="pedtag sm">Pedido ${esc(F.pedido)}</span> ${blogo(F.title)}${esc(F.title)} · ${esc(F.llego)} <span class="n">${fmt(F.items.reduce((s,i)=>s+i.qty,0))} pz</span></a>`}).join('')}</div>`).join('');
 loadLlegadasAdmin(root);
}
function envSummary(k){const E=DATA.envios[k],M=EM[k];const fx={};let tu=0;const tc={C:0,P:0,S:0,I:0};
 for(const l of E.lines){tu+=l.u;tc[l.tp]=(tc[l.tp]||0)+1;const seen=new Set();for(const c of l.comps){const f=fx[c.fk]=fx[c.fk]||{pubs:0,u:0,pz:0,shared:0};f.pz+=c.pz;if(!seen.has(c.fk)){seen.add(c.fk);f.pubs++;f.u+=l.u;if(new Set(l.comps.map(x=>x.fk)).size>1)f.shared++}}}
 const br={};for(const fk in fx){const t=DATA.facturas[fk]?DATA.facturas[fk].title:fk;const b=t.split(' · ')[0];(br[b]=br[b]||{u:0,pz:0,pubs:0,fs:[]}).fs.push(fk);br[b].u+=fx[fk].u;br[b].pz+=fx[fk].pz;br[b].pubs+=fx[fk].pubs}
 const bs=Object.keys(br).sort((a,b)=>br[b].u-br[a].u);const sh=Object.values(fx).some(f=>f.shared);
 const rows=bs.map(b=>`<tr class="bsum"><td>${blogo(b)}<b>${esc(b)}</b></td><td class="n">${br[b].pubs}</td><td class="n">${fmt(br[b].u)}</td><td class="n">${fmt(br[b].pz)}</td></tr>`+br[b].fs.sort((x,y)=>fx[y].u-fx[x].u).map(fk=>{const F=DATA.facturas[fk]||{};const num=(F.title||fk).split(' · ').slice(1).join(' · ');return `<tr class="fsub"><td><a href="${link('f',fk)}">${esc(num||fk)}</a> <span class="mini">· Pedido ${esc(F.pedido||'')}${F.doc?' · '+esc(F.doc):''}</span>${fx[fk].shared?` <span class="mini">· ${fx[fk].shared} comp. compartidos</span>`:''}</td><td class="n">${fx[fk].pubs}</td><td class="n">${fmt(fx[fk].u)}</td><td class="n">${fmt(fx[fk].pz)}</td></tr>`}).join('')).join('');
 const esp=(tc.C||0)+(tc.P||0)+(tc.S||0);
 return `<div class="eyebrow">${M.bod==='EDOMEX'?'Edo. Méx.':'Cuernavaca'}${M.size?' · '+(M.size==='G'?'grandes':'pequeños y medianos'):''}</div><h2 style="margin:2px 0 6px">Envío ${k}</h2>
 <div class="esmeta"><span><b>${esc(M.dia)}</b></span><span>Destino <b>${esc(M.dest)}</b></span><span><b>${fmt(tu)}</b> u${M.meta?` de meta ${fmt(M.meta)}`:''}</span><span><b>${E.lines.length}</b> publicaciones</span>${esp?`<span><b>${esp}</b> especiales (${tc.C||0} comp. · ${tc.P||0} por · ${tc.S||0} sobre)</span>`:''}</div>
 <div class="tbl"><table class="estab"><thead><tr><th>Marca / factura</th><th style="text-align:right">Publ.</th><th style="text-align:right">u. ML</th><th style="text-align:right">Piezas</th></tr></thead><tbody>${rows}</tbody></table></div>
 ${sh?'<p class="mini">Un compuesto con piezas de dos facturas cuenta en las dos.</p>':''}
 <a class="btn primary" href="${link('e',k)}">Abrir envío ${k}</a>`}
function renderEnvios(root){
 const ks=Object.keys(DATA.envios).sort();let sel=ks.find(k=>phase(k)==='now')||ks[0];
 root.innerHTML=`<div class="docHead"><div><div class="eyebrow">Envíos a Full</div><h1>Envíos</h1></div><div class="meta">Toca un envío para ver de qué facturas se compone.</div></div><div class="elay"><div>`+['CUERNAVACA','EDOMEX'].map(b=>`<div class="group"><h2>${b==='EDOMEX'?'Edo. Méx.':'Cuernavaca'}</h2></div><div class="legend">${ks.filter(k=>EM[k].bod===b).map(k=>{const nc=DATA.envios[k].lines.filter(l=>l.tp!=='I').length;return `<a class="chip ${PCLS[phase(k)]}" data-k="${k}" href="${link('e',k)}">Envío ${k} · ${EM[k].dia} · ${EM[k].dest} <span class="n">${fmt(DATA.envios[k].lines.reduce((s,l)=>s+l.u,0))} u</span>${nc?` <span class="ttag tc">${nc} esp.</span>`:''}</a>`}).join('')}</div>`).join('')+`</div><aside class="eside"></aside></div>`;
 const side=root.querySelector('.eside');
 const show=k=>{sel=k;side.innerHTML=envSummary(k);root.querySelectorAll('.chip[data-k]').forEach(c=>c.classList.toggle('sel',c.dataset.k===k))};
 root.querySelectorAll('.chip[data-k]').forEach(c=>c.onclick=e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();show(c.dataset.k);if(innerWidth<900)side.scrollIntoView({behavior:'smooth',block:'start'})});
 show(sel);
}
/* ---------- pedido contra lo que llegó ---------- */
function pcLine(F,i){const c=F.cmp&&F.cmp.it&&F.cmp.it[i.code];if(!c)return '';const [p,k]=c;const dif=i.qty-p;
 return `<div class="pcl"><span>Pedido <b>${p?fmt(p):'—'}</b></span>${k!=null?`<span>Cotizado <b>${fmt(k)}</b></span>`:''}<span>${F.recepcion_documental?"Remisión":(F.encamino?"Facturado":"Llegó")} <b>${fmt(i.qty)}</b></span>${p&&dif!==0?`<span class="${dif<0?'neg':'pos'}">${dif<0?'Faltan '+fmt(-dif):'De más '+fmt(dif)}</span>`:''}</div>`}
function noVino(F){const L=F.cmp&&F.cmp.nv;if(!L||!L.length)return '';
 return `<details class="nvp"><summary><b>${L.length} código${L.length>1?'s':''} del pedido ${F.encamino?'no facturados':'no vinieron'}</b> <span class="mono">${fmt(L.reduce((s,r)=>s+r[2],0))} pz pedidas</span></summary><div class="tbl"><table><thead><tr><th>Código</th><th>Descripción</th><th style="text-align:right">Pedido</th><th style="text-align:right">Cotizado</th></tr></thead><tbody>${L.map(r=>`<tr><td class="mono">${esc(r[0])}</td><td>${esc(r[1])}</td><td class="n">${fmt(r[2])}</td><td class="n">${r[3]==null?'—':fmt(r[3])}</td></tr>`).join('')}</tbody></table></div></details>`}
function cmpTable(){const ks=Object.keys(DATA.facturas).filter(k=>!DATA.facturas[k].encamino&&DATA.facturas[k].cmp&&DATA.facturas[k].cmp.r);if(!ks.length)return '';
 return `<div class="group" style="margin-top:22px"><h2>Pedido contra lo que llegó</h2><span class="mono">últimas llegadas</span></div><div class="tbl"><table style="min-width:900px"><thead><tr><th>Llegó</th><th>Bodega</th><th>Proveedor · documento</th><th style="text-align:right">Pedido</th><th style="text-align:right">Cotizado</th><th style="text-align:right">Llegó</th><th style="text-align:right">% surtido</th><th style="text-align:right">No vinieron</th><th>Nota</th></tr></thead><tbody>${ks.map(k=>{const F=DATA.facturas[k],r=F.cmp.r;
  return `<tr><td style="white-space:nowrap">${esc(F.llego)}</td><td>${F.bod==='EDOMEX'?'Edo. Méx.':'Cuernavaca'}</td><td>${blogo(F.title)}<a href="${link('f',k)}">${esc(F.title)}</a> <span class="pedtag sm">Pedido ${esc(F.pedido)}</span></td><td class="n">${r.p?fmt(r.p):'—'}</td><td class="n">${r.k?fmt(r.k):'—'}</td><td class="n">${fmt(r.f)}</td><td class="n">${r.p?Math.round(r.f/r.p*100)+'%':'—'}</td><td class="n">${r.nv?r.nv+' cód.':'—'}</td><td class="mini">${esc(r.nota||'')}</td></tr>`}).join('')}</tbody></table></div>`}
/* ---------- alertas (solo recepción y resumen) ---------- */
function alertsBlock(compact){const A=DATA.alerts||[];if(!A.length)return '';
 const L=compact?A.filter(a=>a.lvl==='alta'):A;
 const one=a=>`<div class="alrt ${a.lvl}"><div><span class="atag">${a.lvl==='alta'?'Atender':'Pendiente'}</span> <b>${esc(a.t)}</b> <span class="mini">· ${a.bod==='EDOMEX'?'Edo. Méx.':a.bod==='CUERNAVACA'?'Cuernavaca':esc(a.bod||'')}</span></div><div class="ax">${esc(a.x)}</div>${a.url?`<a class="btn" href="${esc(a.url)}">${esc(a.linktext||'Ver evidencia')}</a>`:''}${a.wa?`<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(a.wa)}">${esc(a.wal||'Mandar mensaje por WhatsApp')}</a>`:''}</div>`;
 return `<section class="alrts"><div class="group"><h2>Alertas de llegadas y facturas</h2><span class="mono">${A.length} abiertas${compact&&L.length<A.length?' · aquí solo las urgentes; todas en Recepción':''}</span></div>${L.map(one).join('')}${compact&&L.length<A.length?`<a class="btn" href="#facturas">Ver todas en Recepción</a>`:''}</section>`}
/* ---------- llegadas registradas por almacén ---------- */
const SYNC=()=>String(window.FX_SYNC_URL||'').trim();
async function getLlegadas(bod){return FXAPP.arrivals(bod)}
async function postSync(o){return FXAPP.post(o)}
const fdt=v=>{v=String(v||'');if(/^\d{4}-\d\d-\d\dT/.test(v)){const d=new Date(v);if(!isNaN(d))return d.toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}return v.replace('T',' ')};
const lstat=e=>e==='Autorizada'?'c-now':e==='Autorizada con diferencias'?'c-later':'c-stay';
function llegadasAdmin(){const L=DATA.llinks||{};
 return `<div class="group" style="margin-top:22px"><h2>Llegadas registradas por almacén</h2><span class="mono">las captura el almacén en su link</span></div>
 <div class="share">${['CUERNAVACA','EDOMEX'].map(b=>L[b]?`<span class="mini"><b>Link de registro ${b==='EDOMEX'?'Edo. Méx.':'Cuernavaca'}:</b></span><a class="wa btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Registro de llegadas '+(b==='EDOMEX'?'Edo. Méx.':'Cuernavaca')+'\n'+L[b])}">WhatsApp</a><button class="btn cp" data-url="${esc(L[b])}">Copiar link</button><a class="btn" target="_blank" rel="noopener" href="${esc(L[b])}">Abrir</a>`:'').join('')}</div>
 <div class="llad"><p class="mini">Cargando llegadas…</p></div>`}
function llConteo(x){const c=x.conteo,f=x.nfotos||{};let h='';
 if(c&&x.modo==='cajas'){const fal=c.grupos.reduce((s,g)=>s+g.nf,0);h+=`<div><b>${fmt(c.n)}</b> cajas contadas de ${esc(x.cajas||x.bultos)}${+x.cajas&&c.n<+x.cajas?` · <b style="color:var(--accent)">faltan ${fmt(+x.cajas-c.n)}</b>`:''}</div>`+c.grupos.map(g=>`<div class="mini">Pedido ${esc(g.p)} · alm ${esc(g.a)}: ${g.n} de ${g.t}${g.nf?` · faltan ${g.faltan.join(', ')}${g.nf>g.faltan.length?'…':''}`:''}</div>`).join('');if(f.lista)h+=`<div class="mini">Lista de empaque: ${f.lista} hoja(s)</div>`}
 if(x.modo==='tarimas')h+=`<div class="mini">Tarimas: ${f.tarima_paq||0} etiq. paquetería · ${f.tarima_prov||0} etiq. proveedor de ${esc(x.tarimas)}</div>`;
 if(f.documentos)h+=`<div class="mini">Hojas DOCUMENTOS: ${f.documentos}</div>`;
 if(x.carpeta)h+=`<div><a href="${esc(x.carpeta)}" target="_blank" rel="noopener">Carpeta de fotos</a></div>`;
 return h}
async function loadLlegadasAdmin(root){const box=root.querySelector('.llad');if(!box)return;
 if(!SYNC()){box.innerHTML='<p class="mini">Esta copia de la página no está conectada a la hoja de Google; las llegadas registradas se ven en la versión publicada.</p>';return}
 try{const L=(await getLlegadas('')).slice().reverse();
  box.innerHTML=L.length?`<div class="tbl"><table style="min-width:1000px"><thead><tr><th>Llegó</th><th>Bodega</th><th>Proveedor</th><th>Documentos</th><th style="text-align:right">Bultos</th><th>Recibió</th><th>Estado</th><th>Conteo y fotos</th><th>Observaciones</th></tr></thead><tbody>${L.map(x=>`<tr><td style="white-space:nowrap">${esc(fdt(x.hora||x.reg))}</td><td>${x.bod==='EDOMEX'?'Edo. Méx.':'Cuernavaca'}</td><td>${blogo(x.prov)}${esc(x.prov)}</td><td>${esc([x.doc,x.pedido&&'Pedido '+x.pedido,x.cot&&'Cot. '+x.cot,x.fact&&'Fact. '+x.fact].filter(Boolean).join(' · '))}</td><td class="n">${esc(x.bultos)} ${esc(x.tbultos)}</td><td>${esc(x.recibio)}</td><td><span class="status ${x.estado==='En captura'?'c-stay':lstat(x.estado)}">${esc(x.estado)}</span>${x.pend?`<div class="mini" style="color:var(--later);font-weight:600">Falta: ${esc(x.pend)}</div>`:''}${x.autorizo?`<div class="mini">${esc(x.autorizo)} · ${esc(fdt(x.fautoriza))}${x.contados?' · contó '+esc(x.contados):''}</div>`:''}${x.dif?`<div class="mini"><b>Diferencias:</b> ${esc(x.dif)}</div>`:''}</td><td>${llConteo(x)}<div>${x.fotos.map((f,i)=>`<a href="${esc(f)}" target="_blank" rel="noopener">Papel ${i+1}</a>`).join(' ')}${x.firma?` <a href="${esc(x.firma)}" target="_blank" rel="noopener">Firma</a>`:''}</div></td><td class="mini">${esc(x.obs)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="mini">Todavía no hay llegadas registradas.</p>'}
 catch(e){box.innerHTML=`<p class="mini">No se pudieron leer las llegadas (${esc(e.message)}). Revisa la conexión y recarga.</p>`}}
/* pantalla del almacén: registrar y autorizar llegadas (diseño Motofix, celular primero) */
function shrink(file,max=1600,q=.72){return new Promise((ok,ko)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q))};im.onerror=ko;im.src=fr.result};fr.onerror=ko;fr.readAsDataURL(file)})}
function sigPad(cv){const x=cv.getContext('2d');let on=false,used=false;const fit=()=>{const r=cv.getBoundingClientRect();cv.width=r.width*2;cv.height=r.height*2;x.scale(2,2);x.lineWidth=2.2;x.lineCap='round';x.strokeStyle='#111'};fit();
 const pt=e=>{const r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]};
 cv.addEventListener('pointerdown',e=>{on=true;used=true;cv.setPointerCapture(e.pointerId);x.beginPath();x.moveTo(...pt(e))});
 cv.addEventListener('pointermove',e=>{if(!on)return;x.lineTo(...pt(e));x.stroke()});
 const end=()=>on=false;cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
 return {clear(){x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,cv.width,cv.height);fit();used=false},empty:()=>!used,data:()=>cv.toDataURL('image/png')}}
const nowLocal=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};
/* reglas por marca: ALESSIA se cuenta caja por caja con foto; SAYTO, MRM y REFACOM llegan por tarima y se fotografían sus dos etiquetas */
const RL_CAJAS=['ALESSIA'],RL_TARIMAS=['SAYTO','MRM','REFACOM'];
const rlModo=(prov,tar)=>RL_CAJAS.includes(prov)?'cajas':RL_TARIMAS.includes(prov)&&tar>0?'tarimas':'normal';
const RL_COL=[['#E0242E','#FDE7E8'],['#1D4FB8','#E4ECFF'],['#15803D','#E3F4E8'],['#B2480A','#FFEDD8'],['#6D28D9','#EFE6FA'],['#0E7490','#DDF4F8'],['#A16207','#FEF3C7'],['#BE185D','#FCE7F3']];
const rlId=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const RL_ICO={cam:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 box:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
 pal:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 6h18v4H3zM3 14h18v4H3z"/><path d="M6 10v4M12 10v4M18 10v4"/></svg>',
 bag:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
 ok:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
 back:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
 doc:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>'};
/* cola de subida: guarda en el teléfono (IndexedDB) lo que falta subir, para no perder nada si se cae el internet */
const RLQ=(()=>{let db=null,mem=[],busy=false,subs=[];
 const open=()=>new Promise(ok=>{try{const r=indexedDB.open('fx-app-fotos',1);r.onupgradeneeded=()=>r.result.createObjectStore('q',{keyPath:'k'});r.onsuccess=()=>{db=r.result;ok()};r.onerror=()=>ok()}catch(_){ok()}});
 const ready=open();
 const all=async()=>{await ready;if(!db)return mem.slice();return new Promise(ok=>{try{const t=db.transaction('q').objectStore('q').getAll();t.onsuccess=()=>ok(t.result.sort((a,b)=>a.t-b.t));t.onerror=()=>ok([])}catch(_){ok([])}})};
 const put=async it=>{await ready;if(!db){mem=mem.filter(x=>x.k!==it.k);mem.push(it);return}await new Promise(ok=>{try{const t=db.transaction('q','readwrite');t.objectStore('q').put(it);t.oncomplete=ok;t.onerror=ok}catch(_){mem.push(it);ok()}})};
 const del=async k=>{await ready;mem=mem.filter(x=>x.k!==k);if(!db)return;await new Promise(ok=>{try{const t=db.transaction('q','readwrite');t.objectStore('q').delete(k);t.oncomplete=ok;t.onerror=ok}catch(_){ok()}})};
 const emit=(it,st,res)=>subs.forEach(f=>{try{f(it,st,res)}catch(_){}});
 async function run(){if(busy)return;busy=true;try{for(;;){const L=await all();const it=L.find(x=>!x.err);if(!it)break;emit(it,'sending');
   try{const r=await postSync(it.body);await del(it.k);emit(it,'ok',r)}
   catch(e){if(/Failed to fetch|NetworkError|network|Load failed|timeout/i.test(e.message)){emit(it,'wait');await new Promise(r=>setTimeout(r,6000));continue}
    it.err=e.message;await put(it);emit(it,'error',e.message)}}}finally{busy=false}}
 addEventListener('online',()=>run());
 return {add:async(k,body)=>{await put({k,t:Date.now(),body});run()},all,del,retry:async k=>{const L=await all();const it=L.find(x=>x.k===k);if(it){delete it.err;await put(it);run()}},on:f=>subs.push(f),run}})();
async function getDetalle(id){return FXAPP.detail(id)}
function renderLlegadas(bod,root){
 const SK='fx-app-lu-'+bod,CK='fx-app-cap-'+bod;
 const ls={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}},set(k,v){try{v?localStorage.setItem(k,JSON.stringify(v)):localStorage.removeItem(k)}catch(_){}}};
 const bn=bod==='EDOMEX'?'Edo. Méx.':'Cuernavaca';let U=ls.get(SK);
 document.body.classList.add('rlbody');
 const logo=p=>{const k=Object.keys(DATA.blogos||{}).find(x=>x===p);return k?`<img src="${DATA.blogos[k]}" alt="${esc(p)}">`:`<b>${esc(p)}</b>`};
 const top=(t,sub,step,steps,back)=>`<header class="rl-top">${back?`<button class="rl-back" data-go="${back}" aria-label="Regresar">${RL_ICO.back}</button>`:'<span class="rl-fx">FX</span>'}<div><h1>${t}</h1><p>${sub}</p></div></header>${steps?`<div class="rl-steps">${Array.from({length:steps},(_,i)=>`<i class="${i<step?'on':''}"></i>`).join('')}</div>`:''}`;
 const shell=(h,foot)=>{root.innerHTML=`<div class="rl">${h}</div>${foot?`<div class="rl-foot">${foot}</div>`:''}`;window.scrollTo(0,0)};
 const toast=t=>{let d=document.querySelector('.rl-toast');if(!d){d=document.createElement('div');d.className='rl-toast';document.body.appendChild(d)}d.textContent=t;d.classList.add('on');clearTimeout(d._t);d._t=setTimeout(()=>d.classList.remove('on'),2600)};
 if(!SYNC()){shell(top('Registro de llegadas','Almacén '+bn)+'<div class="rl-note warn"><b>Esta página no está conectada.</b> Avisa a oficina; por ahora anota la llegada en papel.</div>');return}
 /* ---------- entrar ---------- */
 if(!U){shell(top('Registro de llegadas','Almacén '+bn)+`<form class="rl-card rl-form lin" autocomplete="off"><p class="rl-mini">Solo el personal autorizado de ${bn} puede registrar o autorizar llegadas. Entra con el usuario y la clave que te dio oficina.</p><label>Usuario<input name="u" required autocapitalize="words"></label><label>Clave<input name="c" type="password" inputmode="numeric" required></label><button class="rl-btn pri" type="submit">Entrar</button><p class="rl-mini lm" role="status"></p></form>`);
  const f=root.querySelector('.lin');f.onsubmit=async e=>{e.preventDefault();const m=f.querySelector('.lm');m.textContent='Revisando…';
   try{const r=await postSync({tipo:'login',bod,usuario:f.u.value.trim(),clave:f.c.value.trim()});ls.set(SK,{usuario:f.u.value.trim(),clave:f.c.value.trim(),nombre:r.nombre,puede:r.puede});renderLlegadas(bod,root)}catch(err){m.textContent=err.message}};return}
 const canR=U.puede.includes('registrar'),canA=U.puede.includes('autorizar');const cred={usuario:U.usuario,clave:U.clave,bod};
 const fail=err=>{if(/clave|baja|usuarios/i.test(err.message)){ls.set(SK,null);setTimeout(()=>renderLlegadas(bod,root),2500)}return err.message};
 const EX=(DATA.esperadas||[]).filter(r=>r.bod===bod);const PROV=DATA.provs||[];
 let N=null; /* llegada nueva en preparación */
 let C=ls.get(CK); /* captura en curso: {id,prov,modo,cajas,tarimas,bolsas,doc,grupos:[{p,a,t}],g:índice} */
 const saveC=()=>ls.set(CK,C);
 /* capture-sync-v2 */
 let view='home',checking=false;
 const checkCapture=async()=>{
  if(!C||checking)return true;checking=true;const id=C.id;
  try{const d=await getDetalle(id);if(window.FXDevice?.other(d.captura)){C=null;saveC();B=[];F=[];detOk=false;toast('Captura en uso por '+d.captura.nombre+' · '+d.captura.equipo);return false;}if(C&&C.id===id&&d.estado&&d.estado!=='En captura'){
   C=null;saveC();B=[];F=[];detOk=false;
   toast(d.estado==='Cancelada'?'Esta captura fue cancelada en otro equipo.':'Esta captura ya fue cerrada.');return false;
  }return true;}finally{checking=false;}
 };
 if(window._fxCaptureTimer)clearInterval(window._fxCaptureTimer);
 window._fxCaptureTimer=setInterval(async()=>{if(document.visibilityState==='hidden'||!document.body.classList.contains('rlbody')||!navigator.onLine||!root.isConnected||!C)return;try{if(!await checkCapture())home();}catch(_){}},15000);
 let B=[],F=[],detOk=false; /* cajas y fotos de la captura (servidor + pendientes) */
 RLQ.on((it,st,res)=>{const b=it.body;const L=b.tipo==='caja'?B:b.tipo==='foto'?F:null;if(!L)return;const x=L.find(z=>z.k===it.k);if(!x)return;
  if(st==='ok'){x.st='ok';if(b.tipo==='caja'&&res&&res.caja){x.url=res.caja.foto}if(b.tipo==='foto'&&res&&res.foto)x.url=res.foto.url}
  else if(st==='error'){x.st='err';x.err=res;if(/ya se registró/.test(res||''))x.dupsrv=true}else x.st=st;
  if(window._rlRefresh)window._rlRefresh()});
 /* ---------- inicio ---------- */
 async function home(){await window.FXDevice?.ready;
  view="home";try{await checkCapture();}catch(_){}
  shell(top('Registro de llegadas',`Almacén ${bn} · ${esc(U.nombre)}`)+
   `${C?`<button class="rl-card rl-resume" data-go="cap"><span class="rl-dot"></span><div><b>Captura en curso · ${esc(C.prov)}</b><span class="rl-mini">${C.modo==='cajas'?'Conteo de cajas':'Fotos de tarimas'} · toca para seguir</span></div>${RL_ICO.back.replace('m15 5-7 7 7 7','m9 5 7 7-7 7')}</button>${canR?`<button class="rl-btn" data-cancel="${esc(C.id)}" aria-label="Cancelar captura en curso">✕ Cancelar captura</button>`:''}`:''}
   ${canR?'<button class="rl-btn pri big" data-go="nueva">Registrar llegada</button>':''}
   <h2 class="rl-h">${canA?'Por autorizar y anteriores':'Llegadas registradas'}</h2><div class="rl-list"><p class="rl-mini">Cargando…</p></div>
   <button class="rl-link" data-go="salir">Salir (${esc(U.nombre)})</button>`);
  const lst=root.querySelector('.rl-list');
  try{const L=(await getLlegadas(bod)).slice().reverse();
   lst.innerHTML=L.length?L.map(x=>{const cap=x.estado==='En captura',blocked=window.FXDevice?.other(x.captura);const est=cap?'c-stay':lstat(x.estado);
    return `<article class="rl-card rl-item"><div class="rl-ih"><span class="rl-lg">${logo(x.prov)}</span><span class="status ${est}">${esc(x.estado)}</span></div>
    <b>${esc(x.prov)} · ${esc(x.doc||x.fact||x.cot||'sin documento')}</b>
    <span class="rl-mini">Llegó ${esc(fdt(x.hora))} · ${esc(x.bultos)} ${esc(x.tbultos)} · recibió ${esc(x.recibio)}${x.pedido?' · pedido '+esc(x.pedido):''}</span>
    ${x.pend?`<span class="rl-pend">Falta: ${esc(x.pend)}</span>`:''}${x.autorizo?`<span class="rl-mini">Autorizó ${esc(x.autorizo)} · ${esc(fdt(x.fautoriza))}${x.dif?' · '+esc(x.dif):''}</span>`:''}
    ${cap&&x.captura?`<span class="rl-mini">Capturando: ${esc(x.captura.nombre)} · ${esc(x.captura.equipo)}${blocked?' · Solo consulta desde este equipo':''}</span>`:''}<div class="rl-acts">${cap&&!blocked&&canR&&(!C||C.id!==x.id)?`<button class="rl-btn sm" data-tomar="${esc(x.id)}">Seguir esta captura</button>`:''}${cap&&!blocked&&canR?`<button class="rl-btn sm" data-cancel="${esc(x.id)}">Cancelar captura</button>`:''}${/DOCUMENTOS/.test(x.pend||'')&&canR&&!blocked?`<button class="rl-btn sm" data-docs="${esc(x.id)}" data-prov="${esc(x.prov)}">Subir hojas de DOCUMENTOS</button>`:''}${!cap&&!x.autorizo&&canA?`<button class="rl-btn sm pri aut" data-id="${esc(x.id)}" data-b="${esc(x.bultos)}">Autorizar llegada</button>`:''}</div></article>`}).join(''):'<p class="rl-mini">No hay llegadas registradas.</p>';
   window._rlList=L}
  catch(e){lst.innerHTML=`<p class="rl-mini">No se pudieron leer las llegadas (${esc(e.message)}).</p>`}}
 root.onclick=async e=>{const g=e.target.closest('[data-go]');
  if(g){const v=g.dataset.go;if(v==='salir'){FXAPP.logout().then(()=>{ls.set(SK,null);location.hash='#recepcion';route()}).catch(e=>alert(e.message));return}if(v==='home')return home();if(v==='nueva'){N={hora:nowLocal(),fotos:[],cajas:0,tarimas:0,bolsas:0};return paso1()}if(v==='p1')return paso1();if(v==='p2')return paso2();if(v==='cap')return captura();if(v==='res')return resumen();return}
  const t=e.target.closest('[data-tomar]');if(t){const x=(window._rlList||[]).find(z=>z.id===t.dataset.tomar);if(!x)return;if(C&&!confirm('Ya hay otra captura abierta en este teléfono. ¿Cambiar a esta?'))return;
   try{await window.FXDevice?.claim(x.id,cred);}catch(e){toast(e.message);return;}C={id:x.id,prov:x.prov,modo:x.modo||rlModo(x.prov,+x.tarimas||0),cajas:+x.cajas||+x.bultos||0,tarimas:+x.tarimas||0,bolsas:+x.bolsas||0,doc:x.doc||x.fact||'',grupos:[],g:-1};saveC();B=[];F=[];detOk=false;return captura()}
  const d=e.target.closest('[data-docs]');if(d)return docsRefacom(d.dataset.docs,d.dataset.prov);
  const k=e.target.closest('[data-cancel]');if(k){const id=k.dataset.cancel;if(!confirm('¿Cancelar esta captura? Deja de aparecer en la lista (en la hoja queda como "Cancelada").'))return;k.disabled=true;
   try{await window.FXDevice?.claim(id,cred);await postSync({tipo:'cancelar',...cred,id});if(C&&C.id===id){C=null;saveC()}const q=(await RLQ.all()).filter(x=>x.body.id===id);for(const x of q)await RLQ.del(x.k);toast('Captura cancelada');home()}catch(err){k.disabled=false;toast('No se canceló: '+fail(err))}return}
  const a=e.target.closest('.aut');if(a)return autorizar(a)};
 /* ---------- paso 1: proveedor ---------- */
 function paso1(){shell(top('Registrar llegada',`Almacén ${bn} · paso 1 de 3`,1,3,'home')+
   `<div class="rl-card rl-bod">${RL_ICO.box}<div><b>Bodega ${bn}</b><span class="rl-mini">fija por tu usuario</span></div></div>
   <h2 class="rl-h">¿De qué proveedor?</h2><div class="rl-logos">${PROV.map(p=>`<button class="rl-logo${N.prov===p?' on':''}" data-p="${esc(p)}">${logo(p)}${(DATA.blogos||{})[p]?`<span>${esc(p)}</span>`:''}</button>`).join('')}<button class="rl-logo${N.prov==='Otro'?' on':''}" data-p="Otro"><b>Otro</b><span>no está en la lista</span></button></div>`);
  root.querySelectorAll('.rl-logo').forEach(b=>b.onclick=()=>{N.prov=b.dataset.p;if(N.provPrev!==N.prov){N.doc=null;N.pedido=N.cot=N.fact=''}N.provPrev=N.prov;paso2()})}
 /* ---------- paso 2: papeles, fotos y bultos ---------- */
 function paso2(){const L=EX.filter(r=>r.prov===N.prov);
  shell(top(`${esc(N.prov)} · ${bn}`,'paso 2 de 3 · papeles, fotos y bultos',2,3,'p1')+
   `<h2 class="rl-h">¿Qué documento llegó?</h2><div class="rl-docs">${L.map((r,i)=>`<button class="rl-chip${N.doc===i?' on':''}" data-d="${i}">${esc(r.doc)}${r.pz?` <small>${fmt(r.pz)} pz</small>`:''}</button>`).join('')}<button class="rl-chip${N.doc==='otro'?' on':''}" data-d="otro">Otro / no está en la lista</button></div>
   <div class="rl-card rl-form"><label class="rl-fl">Pedido FXMoto<input name="pedido" inputmode="numeric" placeholder="53, 54, 55…" value="${esc(N.pedido||'')}"></label><label class="rl-fl">Cotización<input name="cot" placeholder="si lo trae" value="${esc(N.cot||'')}"></label><label class="rl-fl">Factura o remisión<input name="fact" placeholder="si lo trae" value="${esc(N.fact||'')}"></label><label class="rl-fl">Hora real de llegada<input name="hora" type="datetime-local" value="${esc(N.hora)}"></label></div>
   <h2 class="rl-h">Fotos de los papeles</h2><p class="rl-mini">Factura, remisión o guía.${N.prov==='ALESSIA'?' La lista de empaque se fotografía al cerrar el conteo.':''}</p>
   <div class="rl-tiles">${N.fotos.map((d,i)=>`<figure class="rl-tile ph"><img src="${d}" alt="Papel ${i+1}"><button data-rm="${i}" aria-label="Quitar">×</button></figure>`).join('')}<label class="rl-tile add">${RL_ICO.cam}<span>Tomar foto</span><input type="file" accept="image/*" capture="environment" multiple hidden></label></div>
   <h2 class="rl-h">¿Cuántos bultos llegaron?</h2>
   ${[['cajas','Cajas',RL_ICO.box],['tarimas','Tarimas',RL_ICO.pal],['bolsas','Bolsas',RL_ICO.bag]].map(([k,t,ic])=>`<div class="rl-card rl-step">${ic}<b>${t}</b><button data-m="${k}" aria-label="Menos">−</button><input data-n="${k}" inputmode="numeric" value="${N[k]||0}" aria-label="${t}"><button class="pl" data-p2="${k}" aria-label="Más">+</button></div>`).join('')}
   <label class="rl-card rl-form rl-fl">Observaciones (cajas abiertas, golpeadas, mojadas)<textarea name="obs" rows="2">${esc(N.obs||'')}</textarea></label>
   <p class="rl-mini rl-modo"></p><p class="rl-err" role="alert"></p>`,
   `<button class="rl-btn pri big nx">Siguiente</button>`);
  const R=root,f=n=>R.querySelector(`[name=${n}]`);
  const modoTxt=()=>{const m=rlModo(N.prov,N.tarimas);R.querySelector('.rl-modo').innerHTML=m==='cajas'?'<b>Siguiente:</b> contar caja por caja con foto de cada etiqueta.':m==='tarimas'?`<b>Siguiente:</b> foto de las dos etiquetas de cada tarima (paquetería y ${esc(N.prov)}).${N.prov==='REFACOM'?' Después, las hojas de la caja DOCUMENTOS.':''}`:'<b>Siguiente:</b> revisar y firmar.'};
  const sync=()=>{['pedido','cot','fact','hora','obs'].forEach(k=>N[k]=f(k).value)};
  R.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{sync();const v=b.dataset.d;N.doc=v==='otro'?'otro':+v;const r=L[N.doc];if(r){if(r.pedido)N.pedido=r.pedido;if(r.cot)N.cot=r.cot;if(r.fact)N.fact=r.fact}paso2()});
  R.querySelectorAll('[data-m],[data-p2]').forEach(b=>b.onclick=()=>{const k=b.dataset.m||b.dataset.p2;N[k]=Math.max(0,(+N[k]||0)+(b.dataset.m?-1:1));R.querySelector(`[data-n=${k}]`).value=N[k];modoTxt()});
  R.querySelectorAll('[data-n]').forEach(i=>i.oninput=()=>{N[i.dataset.n]=Math.max(0,parseInt(i.value,10)||0);modoTxt()});
  R.querySelector('.rl-tiles input').onchange=async ev=>{sync();for(const fl of ev.target.files)if(N.fotos.length<12)try{N.fotos.push(await shrink(fl))}catch(_){toast('Una foto no se pudo leer')}paso2()};
  R.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{sync();N.fotos.splice(+b.dataset.rm,1);paso2()});
  modoTxt();
  R.querySelector('.nx').onclick=async()=>{sync();const er=R.querySelector('.rl-err');
   if(N.doc==null){er.textContent='Elige qué documento llegó (o "Otro").';return}
   if(!N.fotos.length){er.textContent='Falta la foto de los papeles.';return}
   const tot=(+N.cajas||0)+(+N.tarimas||0)+(+N.bolsas||0);if(!tot){er.textContent='Anota cuántos bultos llegaron.';return}
   const m=rlModo(N.prov,N.tarimas);if(m==='normal')return paso3();
   const btn=R.querySelector('.nx');btn.disabled=true;btn.textContent='Abriendo captura…';
   try{const r=await postSync(cuerpo(true,m));C={id:r.id,prov:N.prov,modo:m,cajas:+N.cajas,tarimas:+N.tarimas,bolsas:+N.bolsas,doc:docTxt(),grupos:[],g:-1};saveC();B=[];F=[];detOk=true;N=null;captura()}
   catch(err){er.textContent='No se guardó: '+fail(err);btn.disabled=false;btn.textContent='Siguiente'}}}
 const docTxt=()=>{const r=EX.filter(x=>x.prov===N.prov)[N.doc];return r?r.doc:N.doc==='otro'?'Otro':''};
 const cuerpo=(borr,m,firma)=>({tipo:'llegada',...cred,prov:N.prov,doc:docTxt(),pedido:N.pedido,cot:N.cot,fact:N.fact,bultos:String((+N.cajas||0)+(+N.tarimas||0)+(+N.bolsas||0)),tbultos:(()=>{const L=[['cajas',N.cajas],['tarimas',N.tarimas],['bolsas',N.bolsas]].filter(x=>+x[1]>0);return L.length===1?(+L[0][1]===1?L[0][0].replace(/s$/,''):L[0][0]):'('+L.map(x=>x[1]+' '+x[0]).join(' + ')+')'})(),cajas:N.cajas,tarimas:N.tarimas,bolsas:N.bolsas,hora:String(N.hora||'').replace('T',' '),obs:N.obs||'',fotos:N.fotos,firma:firma||'',modo:m,borrador:borr});
 /* ---------- paso 3 (marcas sin conteo): revisar y firmar ---------- */
 function paso3(){shell(top('Revisar y firmar',`${esc(N.prov)} · paso 3 de 3`,3,3,'p2')+resumenN()+`<div class="rl-card rl-form"><label class="rl-fl">Firma de ${esc(U.nombre)}<canvas class="rl-sig" aria-label="Firma"></canvas></label><button class="rl-link sclr" type="button">Borrar firma</button></div><p class="rl-err" role="alert"></p>`,`<button class="rl-btn pri big ok">Registrar llegada</button>`);
  const sig=sigPad(root.querySelector('.rl-sig'));root.querySelector('.sclr').onclick=()=>sig.clear();
  root.querySelector('.ok').onclick=async ev=>{const b=ev.currentTarget,er=root.querySelector('.rl-err');if(sig.empty()){er.textContent='Falta la firma.';return}b.disabled=true;b.textContent='Enviando…';
   try{const r=await postSync(cuerpo(false,'normal',sig.data()));listo({id:r.id,prov:N.prov,doc:docTxt(),bultos:(+N.cajas||0)+(+N.tarimas||0)+(+N.bolsas||0),fotos:N.fotos.length,pend:N.prov==='REFACOM'});N=null}
   catch(err){er.textContent='No se guardó: '+fail(err);b.disabled=false;b.textContent='Registrar llegada'}}}
 const resumenN=()=>`<div class="rl-card rl-sum">${[['Proveedor',esc(N.prov)],['Bodega',bn],['Papeles',esc([docTxt(),N.pedido&&'pedido '+N.pedido].filter(Boolean).join(' · '))],['Bultos',esc([N.cajas&&N.cajas+' cajas',N.tarimas&&N.tarimas+' tarimas',N.bolsas&&N.bolsas+' bolsas'].filter(Boolean).join(' · '))],['Fotos',N.fotos.length],['Llegó',esc(fdt(String(N.hora).replace(' ','T')))]].map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
 function listo(o){if(C&&o.id===C.id){C=null;saveC()}shell(top('Llegada guardada',`Almacén ${bn}`,3,3)+`<div class="rl-done"><span>${RL_ICO.ok}</span><h2>${esc(o.prov)} · ${esc(o.doc||'')}</h2><p class="status c-later">Guardada en el dispositivo. Consulta el estado de sincronización antes de pedir autorización.</p></div>
   ${o.pend?`<div class="rl-note warn"><b>Falta un paso de REFACOM:</b> busca en las tarimas la caja que dice <b>DOCUMENTOS</b> y toma foto de cada hoja. Sin eso la llegada queda pendiente.<button class="rl-btn sm pri" data-docs="${esc(o.id)}" data-prov="REFACOM">Subir hojas ahora</button></div>`:''}
   ${o.txt||''}<div class="rl-note">Deja los bultos en la zona de llegadas. Oficina liga la factura y avisa a qué envío va cada caja.</div>`,`<button class="rl-btn big" data-go="home">Listo</button>`)}
 /* ---------- captura: carga lo que ya está en el servidor y lo que falta subir ---------- */
 async function cargar(){const q=(await RLQ.all()).filter(x=>x.body.id===C.id);
  if(!detOk){try{const d=await getDetalle(C.id);B=d.cajas.map(c=>({k:c.cid,cid:c.cid,p:String(c.pedido),a:String(c.alm),t:c.total,c:c.caja,mini:c.mini,url:c.foto,st:'ok'}));F=d.fotos.map(f=>({k:f.fid,fid:f.fid,clase:f.clase,n:f.n,url:f.url,st:'ok'}));detOk=true}catch(e){toast('Sin conexión: se muestran solo las cajas de este teléfono')}}
  q.forEach(it=>{const b=it.body;if(b.tipo==='caja'&&!B.some(x=>x.k===it.k))B.push({k:it.k,p:b.pedido,a:b.alm,t:+b.total,c:+b.caja,mini:b.mini,st:it.err?'err':'wait',err:it.err,dupsrv:/ya se registró/.test(it.err||'')});if(b.tipo==='foto'&&!F.some(x=>x.k===it.k))F.push({k:it.k,clase:b.clase,n:+b.n,mini:b.mini,st:it.err?'err':'wait',err:it.err})});
  if(C.modo==='cajas'&&!C.grupos.length){const seen={};B.forEach(x=>{const key=x.p+'|'+x.a;if(!seen[key]){seen[key]=1;C.grupos.push({p:x.p,a:x.a,t:x.t})}});if(C.grupos.length)C.g=C.grupos.length-1;saveC()}}
 async function captura(){if(C)try{await window.FXDevice?.claim(C.id,cred);}catch(e){toast(e.message);return home();}try{if(!await checkCapture())return home();}catch(_){}if(!C)return home();view='capture';detOk=false;shell(top(esc(C.prov),'Cargando captura…',0,0,'home'));cargar().then(()=>C.modo==='cajas'?cajas():tarimas())}
 const gKey=g=>g.p+'|'+g.a;const gCol=i=>RL_COL[i%RL_COL.length];
 const subiendo=()=>{const w=B.filter(x=>x.st!=='ok'&&x.st!=='err').length+F.filter(x=>x.st!=='ok'&&x.st!=='err').length,er=B.filter(x=>x.st==='err').length+F.filter(x=>x.st==='err').length;return (w?`<span class="rl-up">${w} guardando…</span>`:'<span class="rl-up ok">guardado en el dispositivo</span>')+(er?` <span class="rl-up err">${er} con error · revisa el resumen</span>`:'')};
 /* ---------- captura de cajas (ALESSIA) ---------- */
 function cajas(foto){const G=C.grupos[C.g];const tot=C.cajas||0;const n=B.length;
  const band=G?(()=>{const [fg,bg]=gCol(C.g);const k=B.filter(x=>x.p===G.p&&x.a===G.a).length;return `<button class="rl-band" style="--g:${fg};--gb:${bg}" data-grp><span class="rl-mini">Etiqueta que estás capturando · toca para cambiar</span><span class="rl-bandrow"><span><small>Pedido</small><b>${esc(G.p)}</b></span><span><small>Almacén</small><b>${esc(G.a)}</b></span><span><small>Llevas</small><b>${k} de ${G.t}</b></span></span></button>`})():'';
  shell(top(`${esc(C.prov)} · conteo de cajas`,`${esc(C.doc||'')} · ${esc(U.nombre)}`,0,0,'home')+
   `<div class="rl-prog"><div><b>${n}</b> de ${tot||'?'} cajas${C.cajasChofer!=null?` <span class="rl-over">el chofer declaró ${C.cajasChofer}</span>`:''}</div>${subiendo()}<span class="rl-bar"><i style="width:${tot?Math.min(100,n/tot*100):0}%"></i></span></div>
   ${G?band+gbar()+`<div class="rl-card rl-capt">
     <label class="rl-shot${foto?' has':''}">${foto?`<img src="${foto.mini}" alt="Foto de la etiqueta">`:`${RL_ICO.cam}<b>1. Foto de la etiqueta</b><span class="rl-mini">obligatoria</span>`}<input type="file" accept="image/*" capture="environment" hidden></label>
     <label class="rl-num"><span>2. Número de caja</span><span class="rl-numrow"><input class="cnum" inputmode="numeric" pattern="[0-9]*" placeholder="—" aria-label="Número de caja"><em>de ${G.t}</em></span></label>
     <p class="rl-err" role="alert"></p></div>`:`<div class="rl-card rl-note">Escribe los datos de la etiqueta de la primera caja.</div>`}
   <h2 class="rl-h">Últimas cajas</h2><div class="rl-last">${B.slice(-6).reverse().map(x=>boxRow(x)).join('')||'<p class="rl-mini">Todavía no hay cajas.</p>'}</div>`,
   G?`<button class="rl-btn big" data-go="res">Resumen</button><button class="rl-btn pri big gu">Guardar caja</button>`:`<button class="rl-btn big" data-go="res">Resumen</button>`);
  window._rlRefresh=()=>{const p=root.querySelector('.rl-prog');if(p){p.querySelector('.rl-up')&&(p.querySelectorAll('.rl-up').forEach(z=>z.remove()),p.querySelector('div').insertAdjacentHTML('afterend',subiendo()))}const l=root.querySelector('.rl-last');if(l)l.innerHTML=B.slice(-6).reverse().map(x=>boxRow(x)).join('')};
  if(!G){grupo(true);return}
  root.querySelector('[data-grp]').onclick=()=>grupo(false);
  root.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{C.g=+b.dataset.sw;saveC();cajas(foto)});
  root.querySelector('[data-new=alm]').onclick=()=>grupo(false,'alm',foto);root.querySelector('[data-new=ped]').onclick=()=>grupo(false,'ped',foto);
  const inp=root.querySelector('.cnum'),er=root.querySelector('.rl-err');
  root.querySelector('.rl-shot input').onchange=async ev=>{const fl=ev.target.files[0];if(!fl)return;try{const full=await shrink(fl,1400,.7),mini=await shrink(fl,240,.55);cajas({full,mini})}catch(_){toast('No se pudo leer la foto')}};
  if(foto)setTimeout(()=>inp.focus(),60);
  inp.onkeydown=e=>{if(e.key==='Enter')root.querySelector('.gu').click()};
  root.querySelector('.gu').onclick=async()=>{const c=parseInt(inp.value,10);er.textContent='';
   if(!foto){er.textContent='Primero toma la foto de la etiqueta.';return}
   if(!(c>0)){er.textContent='Escribe el número de caja.';inp.focus();return}
   if(c>G.t){er.innerHTML=`La caja ${c} no existe en este grupo (solo tiene ${G.t}). <b>Revisa la etiqueta:</b> seguramente es de otro pedido o de otro almacén.`;return}
   const dup=B.find(x=>x.p===G.p&&x.a===G.a&&x.c===c);
   if(dup){repetida(dup,{p:G.p,a:G.a,t:G.t,c,foto});return}
   const pasa=tot&&n>=tot;if(pasa){if(C.cajasChofer==null)C.cajasChofer=tot;C.cajas=n+1;saveC()}
   await guardarCaja({p:G.p,a:G.a,t:G.t,c,foto});if(!C)return;if(pasa)toast(`Caja ${c} guardada · el chofer declaró ${C.cajasChofer}; van ${n+1}`);cajas()}}
 const gbar=()=>`<div class="rl-gbar">${C.grupos.length>1?`<div class="rl-gchips">${C.grupos.map((g,i)=>{const [fg]=gCol(i);return `<button class="rl-gchip${i===C.g?' on':''}" data-sw="${i}" style="--g:${fg}"><i></i>${esc(g.p)} · ${esc(g.a)} <small>${B.filter(x=>x.p===g.p&&x.a===g.a).length}/${g.t}</small></button>`}).join('')}</div>`:''}
   <div class="rl-gnew"><button class="rl-btn" data-new="alm">+ Otro almacén</button><button class="rl-btn" data-new="ped">+ Otro pedido</button></div></div>`;
 async function guardarCaja(o){try{if(!await checkCapture())return home();}catch(_){}const k=rlId('C');const x={k,p:o.p,a:o.a,t:o.t,c:o.c,mini:o.foto.mini,st:'wait'};B.push(x);
  await RLQ.add(k,{tipo:'caja',...cred,id:C.id,cliente:k,pedido:o.p,alm:o.a,total:o.t,caja:o.c,foto:o.foto.full,mini:o.foto.mini,forzar:!!o.forzar});
  if(navigator.vibrate)try{navigator.vibrate(30)}catch(_){}toast(`Caja ${o.c} de ${o.t} guardada`)}
 const boxRow=x=>{const gi=C.grupos.findIndex(g=>g.p===x.p&&g.a===x.a);const [fg]=gCol(Math.max(0,gi));
  return `<div class="rl-box"><span class="rl-thumb">${x.mini?`<img src="${x.mini}" alt="">`:RL_ICO.box}</span><div><b>Caja ${x.c} <small>de ${x.t}</small></b><span class="rl-mini"><i class="rl-gdot" style="background:${fg}"></i>Pedido ${esc(x.p)} · Alm ${esc(x.a)}</span>${x.st==='err'?`<span class="rl-errs">${esc(x.err||'error')}</span>`:''}</div><span class="rl-st ${x.st}">${x.st==='ok'?'guardada':x.st==='err'?'error':'guardando'}</span></div>`};
 /* elegir o crear el grupo (pedido + almacén + total que trae la etiqueta) */
 function grupo(first,modo,foto){const G0=C.grupos[C.g];const d=dialog(`<div class="rl rl-dlg"><h2>${first?'Datos de la etiqueta':modo==='alm'?`Otro almacén del pedido ${esc(G0?G0.p:'')}`:modo==='ped'?'Otro pedido':'¿De qué grupo es la caja?'}</h2>
   ${modo?`<p class="rl-mini">${modo==='alm'?'Escribe el almacén (abajo en la etiqueta, por ejemplo ALMACEN-300) y el total de cajas de ese almacén (el número después de la diagonal).':'Escribe el número de pedido que trae la etiqueta, su almacén y el total de cajas (el número después de la diagonal).'}</p>`:C.grupos.length?`<div class="rl-glist">${C.grupos.map((g,i)=>{const [fg,bg]=gCol(i);return `<button class="rl-gopt${i===C.g?' on':''}" data-i="${i}" style="--g:${fg};--gb:${bg}"><b>Pedido ${esc(g.p)}</b><span>Almacén ${esc(g.a)} · ${g.t} cajas · llevas ${B.filter(x=>x.p===g.p&&x.a===g.a).length}</span></button>`}).join('')}</div><h3 class="rl-h">Otro pedido o almacén</h3>`:'<p class="rl-mini">Cópialos de la etiqueta de ALESSIA: el pedido, el almacén (abajo, por ejemplo ALMACEN-200) y el total de cajas (el número después de la diagonal, por ejemplo 54/<b>100</b>).</p>'}
   <form class="rl-form ng" autocomplete="off"><label class="rl-fl">Pedido (PEDIDO(S) de la etiqueta)<input name="p" inputmode="numeric" required value="${esc(modo==='alm'&&G0?G0.p:modo==='ped'||C.grupos.length?'':(C.doc||'').replace(/\D/g,'').slice(0,8))}"></label>
   <label class="rl-fl">Almacén<select name="a" required><option value="">Elige…</option>${['100','200','300','400','500','600','700','800'].map(a=>`<option>${a}</option>`).join('')}<option value="otro">Otro</option></select></label><input name="ao" placeholder="Escribe el almacén" hidden>
   <label class="rl-fl">Total de cajas de ese almacén (número después de la diagonal)<input name="t" inputmode="numeric" required></label>
   <p class="rl-err" role="alert"></p><div class="rl-acts"><button class="rl-btn pri" type="submit">Usar estos datos</button>${first&&!C.grupos.length?'':'<button class="rl-btn" type="button" data-x>Cancelar</button>'}</div></form></div>`);
  d.querySelectorAll('.rl-gopt').forEach(b=>b.onclick=()=>{C.g=+b.dataset.i;saveC();closeDialog();cajas()});
  const f=d.querySelector('.ng');f.a.onchange=()=>{f.ao.hidden=f.a.value!=='otro'};const x=d.querySelector('[data-x]');if(x)x.onclick=closeDialog;
  setTimeout(()=>{try{(modo==='alm'?f.a:f.p).focus()}catch(_){}},80);
  f.onsubmit=ev=>{ev.preventDefault();const p=f.p.value.trim().toUpperCase(),a=(f.a.value==='otro'?f.ao.value:f.a.value).trim().toUpperCase(),t=parseInt(f.t.value,10),er=f.querySelector('.rl-err');
   if(!p||!a||!(t>0)){er.textContent='Llena pedido, almacén y total.';return}
   const i=C.grupos.findIndex(g=>g.p===p&&g.a===a);
   if(i>=0){if(C.grupos[i].t!==t&&!confirm(`Ese pedido y almacén ya tenían ${C.grupos[i].t} cajas. ¿Cambiar el total a ${t}?`))return;C.grupos[i].t=t;C.g=i}else{C.grupos.push({p,a,t});C.g=C.grupos.length-1}
   saveC();closeDialog();cajas(foto);toast(i>=0?`Capturando pedido ${p} · almacén ${a}`:`Nuevo grupo: pedido ${p} · almacén ${a}`)}}
 /* caja repetida: se ven las dos fotos para decidir */
 function repetida(dup,o){const d=dialog(`<div class="rl rl-dlg"><h2>La caja ${o.c} ya se registró</h2><p class="rl-mini">Pedido ${esc(o.p)} · almacén ${esc(o.a)}. Compara las dos etiquetas: si la nueva es de otro pedido o almacén, cámbialo.</p>
   <div class="rl-pair"><figure><img src="${dup.mini||''}" alt="Foto anterior"><figcaption>Antes</figcaption></figure><figure><img src="${o.foto.mini}" alt="Foto nueva"><figcaption>Ahora</figcaption></figure></div>
   <div class="rl-col"><button class="rl-btn pri" data-r="grp">Es de otro pedido o almacén</button><button class="rl-btn" data-r="num">Me equivoqué de número</button><button class="rl-btn" data-r="same">Es la misma caja: no guardar</button><button class="rl-link" data-r="both">Son dos cajas distintas con el mismo número: guardar las dos</button></div></div>`);
  d.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{const r=b.dataset.r;closeDialog();
   if(r==='same'){toast('No se guardó la repetida');cajas();return}
   if(r==='num'){cajas(o.foto);return}
   if(r==='both'){await guardarCaja({...o,forzar:true});cajas();return}
   C._pend=o;grupoParaPendiente()})}
 function grupoParaPendiente(){const o=C._pend;grupo(false);const d=document.getElementById('dlg');
  const fin=async()=>{const G=C.grupos[C.g];delete C._pend;if(!G)return;if(o.c>G.t){toast(`La caja ${o.c} tampoco cabe en ese grupo`);cajas(o.foto);return}if(B.some(x=>x.p===G.p&&x.a===G.a&&x.c===o.c)){toast('También está repetida en ese grupo');cajas(o.foto);return}await guardarCaja({p:G.p,a:G.a,t:G.t,c:o.c,foto:o.foto});cajas()};
  d.querySelectorAll('.rl-gopt').forEach(b=>b.onclick=()=>{C.g=+b.dataset.i;saveC();closeDialog();fin()});
  const f=d.querySelector('.ng');const sub=f.onsubmit;f.onsubmit=ev=>{sub(ev);if(!document.getElementById('dlg')||document.getElementById('dlg').hidden)fin()}}
 /* ---------- resumen: faltantes por grupo, repetidas, lista de empaque y cierre ---------- */
 function resumen(){if(!C)return home();if(C.modo!=='cajas')return tarimas();
  const tot=C.cajas||0,n=B.length;
  const grs=C.grupos.map((g,i)=>{const L=B.filter(x=>x.p===g.p&&x.a===g.a);const have=new Set(L.map(x=>x.c));const miss=[];for(let c=1;c<=g.t;c++)if(!have.has(c))miss.push(c);const dups=L.length-have.size;return {g,i,L,miss,dups}});
  const lst=F.filter(x=>x.clase==='lista');const errs=B.filter(x=>x.st==='err');
  const peds=[...new Set(C.grupos.map(g=>g.p))];const faltT=grs.reduce((s,x)=>s+x.miss.length,0),dupT=grs.reduce((s,x)=>s+x.dups,0);
  shell(top('Resumen del conteo',`${esc(C.prov)} · ${esc(C.doc||'')}`,0,0,'cap')+
   `<div class="rl-card rl-sum"><div><span>Cajas que dijo el chofer</span><b>${C.cajasChofer!=null?`${C.cajasChofer} <small class="rl-mini">corregido a ${tot}</small>`:tot}</b></div><div><span>Cajas capturadas</span><b>${n}</b></div><div><span>Diferencia</span><b class="${n<tot?'neg':n>tot?'pos':''}">${n===tot?'cuadra':n<tot?`faltan ${tot-n}`:`sobran ${n-tot}`}</b></div><div><span>Pedidos que llegaron</span><b>${peds.length}</b></div><div><span>Almacenes</span><b>${grs.length}</b></div><div><span>Números sin capturar según etiquetas</span><b class="${faltT?'neg':''}">${faltT}</b></div><div><span>Cajas repetidas</span><b class="${dupT?'pos':''}">${dupT}</b></div></div>
   ${errs.length?`<div class="rl-note warn"><b>${errs.length} caja(s) no se subieron.</b> ${errs.map(x=>`Caja ${x.c} (${esc(x.err||'')})`).join(' · ')}<div class="rl-acts"><button class="rl-btn sm" data-retry>Reintentar</button></div></div>`:''}
   ${peds.map(p=>{const G=grs.filter(x=>x.g.p===p);const cap=G.reduce((s,x)=>s+x.L.length,0),esp=G.reduce((s,x)=>s+x.g.t,0),fal=G.reduce((s,x)=>s+x.miss.length,0);return `<section class="rl-ped"><header><h2>Pedido ${esc(p)}</h2><span>${cap} de ${esp} cajas · ${G.length} ${G.length>1?'almacenes':'almacén'}${fal?` · <b>faltan ${fal}</b>`:''}</span></header>${G.map(({g,i,L,miss,dups})=>{const [fg,bg]=gCol(i);return `<section class="rl-card rl-grp" style="--g:${fg};--gb:${bg}"><header><b>Almacén ${esc(g.a)}</b><span>${L.length} de ${g.t}</span></header>
    <div class="rl-grid">${Array.from({length:g.t},(_,k)=>{const c=k+1;const has=L.filter(x=>x.c===c);return `<button class="${has.length>1?'dup':has.length?'on':''}" data-gi="${i}" data-c="${c}" aria-label="Caja ${c}${has.length?' capturada':' falta'}">${c}</button>`}).join('')}</div>
    ${miss.length?`<p class="rl-miss"><b>Faltan ${miss.length}:</b> ${miss.join(', ')}</p>`:'<p class="rl-okline">Completo</p>'}${dups?`<p class="rl-miss"><b>${dups} repetida(s)</b> · tócalas para revisar</p>`:''}</section>`}).join('')}</section>`}).join('')}
   <p class="rl-mini">Si de un almacén no bajó ninguna caja, aquí no aparece: lo ves en la diferencia contra lo que dijo el chofer.</p>
   <h2 class="rl-h">Lista de empaque</h2><p class="rl-mini">ALESSIA la manda con la mercancía. Toma foto de <b>todas</b> las hojas, completas y legibles.</p>
   <div class="rl-tiles">${lst.map(x=>`<figure class="rl-tile ph">${x.mini?`<img src="${x.mini}" alt="Hoja ${x.n}">`:`<a href="${esc(x.url||'#')}" target="_blank" rel="noopener">Hoja ${x.n}</a>`}<figcaption>${x.n}</figcaption></figure>`).join('')}<label class="rl-tile add">${RL_ICO.doc}<span>Foto de hoja ${lst.length+1}</span><input type="file" accept="image/*" capture="environment" multiple hidden></label></div>
   <label class="rl-check"><input type="checkbox" class="sinl"${C.sinLista?' checked':''}> No vino lista de empaque (se avisa a oficina)</label>
   <label class="rl-card rl-form rl-fl">Observaciones del conteo<textarea class="cobs" rows="2">${esc(C.obs||'')}</textarea></label>
   <div class="rl-card rl-form"><label class="rl-fl">Firma de ${esc(U.nombre)} para cerrar<canvas class="rl-sig" aria-label="Firma"></canvas></label><button class="rl-link sclr" type="button">Borrar firma</button></div><p class="rl-err" role="alert"></p>`,
   `<button class="rl-btn big" data-go="cap">Seguir contando</button><button class="rl-btn pri big cl">Cerrar llegada</button>`);
  window._rlRefresh=null;
  const sig=sigPad(root.querySelector('.rl-sig'));root.querySelector('.sclr').onclick=()=>sig.clear();
  root.querySelector('.sinl').onchange=e=>{C.sinLista=e.target.checked;saveC()};root.querySelector('.cobs').oninput=e=>{C.obs=e.target.value;saveC()};
  const rt=root.querySelector('[data-retry]');if(rt)rt.onclick=async()=>{for(const x of errs)await RLQ.retry(x.k);errs.forEach(x=>x.st='wait');resumen()};
  root.querySelector('.rl-tiles input').onchange=async ev=>{let n0=lst.length;for(const fl of ev.target.files){try{const full=await shrink(fl,1800,.75),mini=await shrink(fl,240,.55);const k=rlId('F');n0++;F.push({k,clase:'lista',n:n0,mini,st:'wait'});await RLQ.add(k,{tipo:'foto',...cred,id:C.id,cliente:k,clase:'lista',n:n0,foto:full})}catch(_){toast('Una foto no se pudo leer')}}resumen()};
  root.querySelectorAll('.rl-grid button').forEach(b=>b.onclick=()=>{const g=C.grupos[+b.dataset.gi],c=+b.dataset.c;const L=B.filter(x=>x.p===g.p&&x.a===g.a&&x.c===c);if(!L.length){toast(`La caja ${c} no se ha capturado`);return}verCajas(L)});
  root.querySelector('.cl').onclick=async ev=>{const b=ev.currentTarget,er=root.querySelector('.rl-err');er.textContent='';
   const pend=(await RLQ.all()).filter(x=>x.body.id===C.id);if(pend.length){er.textContent=`Todavía faltan ${pend.length} foto(s) por subir. Espera a que diga "guardado en el dispositivo" (necesitas internet).`;return}
   if(!B.length){er.textContent='No hay cajas capturadas.';return}
   if(!F.some(x=>x.clase==='lista')&&!C.sinLista){er.textContent='Falta la foto de la lista de empaque (o marca que no vino).';return}
   if(sig.empty()){er.textContent='Falta la firma.';return}
   const faltan=grs.reduce((s,x)=>s+x.miss.length,0);const txt=[C.cajasChofer!=null?`El chofer declaró ${C.cajasChofer} cajas; se corrigió a ${tot}`:'',n!==tot?`Declaradas: ${tot} cajas · capturadas: ${n}`:'',dupT?`${dupT} caja(s) repetida(s)`:'',faltan?grs.filter(x=>x.miss.length).map(x=>`Faltan del pedido ${x.g.p} alm ${x.g.a}: ${x.miss.join(', ')}`).join(' · '):''].filter(Boolean).join(' · ');
   if(!confirm(`¿Cerrar la llegada?${txt?'\n\n'+txt:''}`))return;
   b.disabled=true;b.textContent='Cerrando…';
   try{await postSync({tipo:'cerrar',...cred,id:C.id,firma:sig.data(),obs:[C.obs,txt].filter(Boolean).join(' · '),sinLista:!!C.sinLista,cajas:C.cajasChofer!=null?tot:''});const o={id:C.id,prov:C.prov,doc:C.doc,txt:`<div class="rl-card rl-sum"><div><span>Cajas capturadas</span><b>${n} de ${tot}</b></div><div><span>Pedidos · almacenes</span><b>${peds.length} · ${grs.length}</b></div>${grs.map(x=>`<div><span>Pedido ${esc(x.g.p)} · alm ${esc(x.g.a)}</span><b>${x.L.length} de ${x.g.t}${x.miss.length?` · faltan ${x.miss.length}`:''}${x.dups?` · ${x.dups} repetida(s)`:''}</b></div>`).join('')}</div>`};listo(o)}
   catch(err){er.textContent='No se cerró: '+fail(err);b.disabled=false;b.textContent='Cerrar llegada'}}}
 function verCajas(L){const d=dialog(`<div class="rl rl-dlg"><h2>${L.length>1?'Cajas repetidas':'Caja '+L[0].c}</h2>${L.map(x=>`<div class="rl-vc" data-k="${esc(x.k)}"><img src="${x.mini||''}" alt="">${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener" class="rl-mini">Ver foto completa</a>`:''}
   <form class="rl-form ed"><div class="rl-row3"><label class="rl-fl">Pedido<input name="p" value="${esc(x.p)}"></label><label class="rl-fl">Almacén<input name="a" value="${esc(x.a)}"></label><label class="rl-fl">Caja<input name="c" inputmode="numeric" value="${x.c}"></label><label class="rl-fl">Total<input name="t" inputmode="numeric" value="${x.t}"></label></div>
   <div class="rl-acts"><button class="rl-btn sm pri" type="submit">Corregir</button><button class="rl-btn sm" type="button" data-del>Borrar caja</button></div><p class="rl-err"></p></form></div>`).join('')}<button class="rl-btn" data-x>Cerrar</button></div>`);
  d.querySelector('[data-x]').onclick=()=>{closeDialog();resumen()};
  d.querySelectorAll('.rl-vc').forEach(v=>{const x=B.find(z=>z.k===v.dataset.k);const f=v.querySelector('form'),er=v.querySelector('.rl-err');
   const ready=()=>{if(x.st!=='ok'){er.textContent='Esta caja todavía se está subiendo; espera un momento.';return false}return true};
   f.onsubmit=async ev=>{ev.preventDefault();if(!ready())return;const p=f.p.value.trim().toUpperCase(),a=f.a.value.trim().toUpperCase(),c=parseInt(f.c.value,10),t=parseInt(f.t.value,10);if(!(c>0&&t>0&&c<=t)){er.textContent='Revisa caja y total.';return}
    try{await postSync({tipo:'caja_editar',...cred,id:C.id,cid:x.cid||x.k,base:{pedido:x.p,alm:x.a,caja:x.c,total:x.t},pedido:p,alm:a,caja:c,total:t});Object.assign(x,{p,a,c,t});if(!C.grupos.some(g=>g.p===p&&g.a===a)){C.grupos.push({p,a,t});saveC()}toast('Caja corregida');closeDialog();resumen()}catch(err){er.textContent=fail(err)}};
   v.querySelector('[data-del]').onclick=async()=>{if(!ready())return;if(!confirm(`¿Borrar la caja ${x.c}?`))return;try{await postSync({tipo:'caja_borrar',...cred,id:C.id,cid:x.cid||x.k,base:{pedido:x.p,alm:x.a,caja:x.c,total:x.t}});B=B.filter(z=>z!==x);toast('Caja borrada');closeDialog();resumen()}catch(err){er.textContent=fail(err)}}})}
 /* ---------- tarimas: etiqueta de paquetería y del proveedor de cada tarima ---------- */
 function tarimas(){const n=C.tarimas||0;const has=(cl,i)=>F.filter(x=>x.clase===cl&&x.n===i);const done=Array.from({length:n},(_,k)=>has('tarima_paq',k+1).length&&has('tarima_prov',k+1).length).filter(Boolean).length;
  const tile=(cl,i,t)=>{const L=has(cl,i);const x=L[L.length-1];return `<label class="rl-tile${x?' ph':' add'}">${x?(x.mini?`<img src="${x.mini}" alt="">`:`<span class="rl-okic">${RL_ICO.ok}</span>`):RL_ICO.cam}<span>${t}</span>${x&&x.st!=='ok'?`<em class="rl-st ${x.st}">${x.st==='err'?'error':'guardando'}</em>`:''}<input type="file" accept="image/*" capture="environment" hidden data-cl="${cl}" data-i="${i}"></label>`};
  const docs=F.filter(x=>x.clase==='documentos');
  shell(top(`${esc(C.prov)} · fotos de tarimas`,`${esc(C.doc||'')} · ${esc(U.nombre)}`,0,0,'home')+
   `<div class="rl-prog"><div><b>${done}</b> de ${n} tarimas con sus dos fotos</div>${subiendo()}<span class="rl-bar"><i style="width:${n?done/n*100:0}%"></i></span></div>
   ${Array.from({length:n},(_,k)=>`<section class="rl-card rl-tar"><header><b>Tarima ${k+1}</b>${has('tarima_paq',k+1).length&&has('tarima_prov',k+1).length?`<span class="rl-okline">${RL_ICO.ok} lista</span>`:''}</header><div class="rl-tiles two">${tile('tarima_paq',k+1,'Etiqueta de la paquetería')}${tile('tarima_prov',k+1,'Etiqueta de '+esc(C.prov))}</div></section>`).join('')}
   ${C.prov==='REFACOM'?`<h2 class="rl-h">Hojas de la caja DOCUMENTOS</h2><p class="rl-mini">Busca en las tarimas la caja que dice <b>DOCUMENTOS</b> y toma foto de cada hoja. Si todavía no la encuentras, puedes cerrar y subirlas después desde el inicio: la llegada queda pendiente hasta que las subas.</p><div class="rl-tiles">${docs.map(x=>`<figure class="rl-tile ph">${x.mini?`<img src="${x.mini}" alt="Hoja ${x.n}">`:''}<figcaption>${x.n}</figcaption></figure>`).join('')}<label class="rl-tile add">${RL_ICO.doc}<span>Foto de hoja ${docs.length+1}</span><input type="file" accept="image/*" capture="environment" multiple hidden data-docs></label></div>`:''}
   <label class="rl-card rl-form rl-fl">Observaciones<textarea class="cobs" rows="2">${esc(C.obs||'')}</textarea></label>
   <div class="rl-card rl-form"><label class="rl-fl">Firma de ${esc(U.nombre)} para cerrar<canvas class="rl-sig" aria-label="Firma"></canvas></label><button class="rl-link sclr" type="button">Borrar firma</button></div><p class="rl-err" role="alert"></p>`,
   `<button class="rl-btn pri big cl">Cerrar llegada</button>`);
  const sig=sigPad(root.querySelector('.rl-sig'));
  window._rlRefresh=()=>{if(!root.querySelector('.rl-tar'))return;if(!sig.empty()){const p=root.querySelector('.rl-prog');p.querySelectorAll('.rl-up').forEach(z=>z.remove());p.querySelector('div').insertAdjacentHTML('afterend',subiendo());return}const y=scrollY;tarimas();scrollTo(0,y)};root.querySelector('.sclr').onclick=()=>sig.clear();root.querySelector('.cobs').oninput=e=>{C.obs=e.target.value;saveC()};
  root.querySelectorAll('input[data-cl]').forEach(i=>i.onchange=async ev=>{const fl=ev.target.files[0];if(!fl)return;try{const full=await shrink(fl,1600,.72),mini=await shrink(fl,240,.55);const k=rlId('F');F.push({k,clase:i.dataset.cl,n:+i.dataset.i,mini,st:'wait'});await RLQ.add(k,{tipo:'foto',...cred,id:C.id,cliente:k,clase:i.dataset.cl,n:+i.dataset.i,foto:full});const y=scrollY;tarimas();scrollTo(0,y)}catch(_){toast('No se pudo leer la foto')}});
  const di=root.querySelector('input[data-docs]');if(di)di.onchange=async ev=>{let n0=docs.length;for(const fl of ev.target.files){try{const full=await shrink(fl,1800,.75),mini=await shrink(fl,240,.55);const k=rlId('F');n0++;F.push({k,clase:'documentos',n:n0,mini,st:'wait'});await RLQ.add(k,{tipo:'foto',...cred,id:C.id,cliente:k,clase:'documentos',n:n0,foto:full})}catch(_){toast('Una foto no se pudo leer')}}const y=scrollY;tarimas();scrollTo(0,y)};
  root.querySelector('.cl').onclick=async ev=>{const b=ev.currentTarget,er=root.querySelector('.rl-err');er.textContent='';
   for(let i=1;i<=n;i++){if(!has('tarima_paq',i).length){er.textContent=`Falta la etiqueta de paquetería de la tarima ${i}.`;return}if(!has('tarima_prov',i).length){er.textContent=`Falta la etiqueta de ${C.prov} de la tarima ${i}.`;return}}
   const pend=(await RLQ.all()).filter(x=>x.body.id===C.id);if(pend.length){er.textContent=`Todavía faltan ${pend.length} foto(s) por subir. Espera a que diga "guardado en el dispositivo".`;return}
   if(sig.empty()){er.textContent='Falta la firma.';return}
   b.disabled=true;b.textContent='Cerrando…';
   try{await postSync({tipo:'cerrar',...cred,id:C.id,firma:sig.data(),obs:C.obs||''});listo({id:C.id,prov:C.prov,doc:C.doc,pend:C.prov==='REFACOM'&&!docs.length})}
   catch(err){er.textContent='No se cerró: '+fail(err);b.disabled=false;b.textContent='Cerrar llegada'}}}
 /* ---------- REFACOM: subir después las hojas de la caja DOCUMENTOS ---------- */
 function docsRefacom(id,prov){closeDialog();let H=[];const draw=()=>{shell(top('Hojas de la caja DOCUMENTOS',`${esc(prov)} · ${esc(U.nombre)}`,0,0,'home')+
   `<div class="rl-note">Busca en las tarimas la caja que dice <b>DOCUMENTOS</b>. Adentro viene un bonche de hojas: toma una foto de <b>cada hoja</b>, completa y legible.</div>
   <div class="rl-tiles">${H.map((x,i)=>`<figure class="rl-tile ph"><img src="${x.mini}" alt="Hoja ${i+1}"><figcaption>${i+1}</figcaption>${x.st!=='ok'?`<em class="rl-st ${x.st}">${x.st==='err'?'error':'guardando'}</em>`:''}</figure>`).join('')}<label class="rl-tile add">${RL_ICO.doc}<span>Foto de hoja ${H.length+1}</span><input type="file" accept="image/*" capture="environment" multiple hidden></label></div><p class="rl-err" role="alert"></p>`,
   `<button class="rl-btn pri big fin">Listo</button>`);
  root.querySelector('input').onchange=async ev=>{for(const fl of ev.target.files){try{const full=await shrink(fl,1800,.75),mini=await shrink(fl,240,.55);const k=rlId('F');const x={k,mini,st:'wait'};H.push(x);await RLQ.add(k,{tipo:'foto',...cred,id,cliente:k,clase:'documentos',n:H.length,foto:full})}catch(_){toast('Una foto no se pudo leer')}}draw()};
  root.querySelector('.fin').onclick=async()=>{const er=root.querySelector('.rl-err');if(!H.length){er.textContent='Toma al menos la foto de una hoja.';return}const pend=(await RLQ.all()).filter(x=>x.body.id===id);if(pend.length){er.textContent=`Faltan ${pend.length} foto(s) por subir; espera un momento.`;return}toast('Hojas guardadas en el dispositivo');home()}};
  window._rlRefresh=null;RLQ.on((it,st)=>{const x=H.find(z=>z.k===it.k);if(x){x.st=st==='ok'?'ok':st==='error'?'err':'wait';if(root.querySelector('.fin'))draw()}});draw()}
 /* ---------- autorizar (encargado) ---------- */
 function autorizar(b){const d=dialog(`<div class="rl rl-dlg"><h2>Autorizar llegada</h2><p class="rl-mini">Cuenta los bultos y revisa que coincidan con lo registrado (${esc(b.dataset.b)}). Autoriza: <b>${esc(U.nombre)}</b>.</p><form class="rl-form aform"><label class="rl-fl">Bultos contados<input name="c" type="number" min="0" inputmode="numeric" required value="${esc(b.dataset.b)}"></label><label class="rl-fl">Diferencias (vacío si todo está bien)<textarea name="d" rows="2"></textarea></label><label class="rl-fl">Firma<canvas class="rl-sig"></canvas></label><div class="rl-acts"><button class="rl-btn pri" type="submit">Autorizar</button><button class="rl-btn" type="button" data-x>Cancelar</button></div><p class="rl-err am"></p></form></div>`);
  const s2=sigPad(d.querySelector('.rl-sig'));const f=d.querySelector('form');d.querySelector('[data-x]').onclick=closeDialog;
  f.onsubmit=async ev=>{ev.preventDefault();if(s2.empty()){d.querySelector('.am').textContent='Falta la firma.';return}const dif=f.d.value.trim()||(+f.c.value!==+b.dataset.b?`Se contaron ${f.c.value} bultos; se registraron ${b.dataset.b}`:'');
   d.querySelector('.am').textContent='Enviando…';try{await postSync({tipo:'autorizar',...cred,id:b.dataset.id,dif,contados:f.c.value,firma:s2.data()});closeDialog();home()}catch(err){d.querySelector('.am').textContent='No se guardó: '+fail(err)}}}
 RLQ.run();
 home();
}
/* ---------- compartir (solo oficina) ---------- */
function shareBar(kind,key,title){const url=isoUrl(kind+':'+key);
 return `<div class="share"><button class="btn xls" data-xk="${kind}" data-xkey="${esc(key)}">Exportar a Excel</button>${url?`<span class="mini"><b>Link para almacén</b> (solo ${kind==='e'?'este envío':'esta factura'}):</span><a class="wa btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(title+'\n'+url)}">WhatsApp</a><button class="btn cp" data-url="${esc(url)}">Copiar link</button><a class="btn" target="_blank" rel="noopener" href="${esc(url)}">Abrir</a>`:''}</div>`}
document.addEventListener('click',async e=>{const b=e.target.closest('.cp');if(!b)return;const t=b.textContent;try{await navigator.clipboard.writeText(b.dataset.url);b.textContent='Link copiado'}catch(_){b.textContent='No se pudo copiar'}setTimeout(()=>b.textContent=t,2000)});
/* ---------- navegación ---------- */
