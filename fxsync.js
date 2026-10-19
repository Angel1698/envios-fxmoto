/* FXMoto · avance compartido entre teléfonos (palomitas, cajas y observaciones).
   Guarda cada cambio en la hoja de Google configurada en sync-config.js y trae lo que marcan los demás.
   Si no hay dirección configurada o no hay internet, la página sigue funcionando solo en este teléfono. */
(function(){
  const URL_ = (window.FX_SYNC_URL || '').trim();
  const ON = /^https:\/\/|^http:\/\/(localhost|127\.)/.test(URL_);
  const LS = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : v }catch(_){ return d } },
    set(k, v){ try{ localStorage.setItem(k, v) }catch(_){} }
  };
  let dev = LS.get('fx-dev', '');
  if(!dev){ dev = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); LS.set('fx-dev', dev) }
  const cache = {}, snap = {}, L = {};
  let Q; try{ Q = JSON.parse(LS.get('fx-q', '[]')) }catch(_){ Q = [] }
  const saveQ = () => LS.set('fx-q', JSON.stringify(Q));
  const cur = k => parseInt(LS.get('fx-c-' + k, '1'), 10) || 1;
  const setCur = (k, n) => LS.set('fx-c-' + k, String(n));
  const S = v => v === undefined ? undefined : JSON.stringify(v);
  let pushing = false, pulling = false, lastOk = 0, online = true, tPush = null;

  function load(k){
    if(cache[k]) return cache[k];
    let o; try{ o = JSON.parse(LS.get(k, '{}')) || {} }catch(_){ o = {} }
    cache[k] = o; snap[k] = {};
    for(const i in o) snap[k][i] = S(o[i]);
    if(ON && LS.get('fx-seed-' + k, '') !== '1'){
      for(const i in o) Q.push({k, i, v: snap[k][i], seed: 1});
      LS.set('fx-seed-' + k, '1'); saveQ(); later();
    }
    if(ON) setTimeout(pull, 60);
    return o;
  }
  function set(k, v){
    cache[k] = v; LS.set(k, JSON.stringify(v));
    if(!ON) return;
    const old = snap[k] || (snap[k] = {});
    const ids = new Set([...Object.keys(old), ...Object.keys(v)]);
    for(const i of ids){
      const n = S(v[i]);
      if(n !== old[i]){
        Q = Q.filter(c => !(c.k === k && c.i === i));
        Q.push({k, i, v: n === undefined ? null : n});
        if(n === undefined) delete old[i]; else old[i] = n;
      }
    }
    saveQ(); later();
  }
  function later(){ clearTimeout(tPush); tPush = setTimeout(push, 350) }

  async function push(){
    if(!ON || pushing || !Q.length) return;
    pushing = true;
    const batch = Q.slice(0, 200);
    try{
      const r = await fetch(URL_, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({dev, who: LS.get('fx-who', ''), ch: batch})});
      const j = await r.json();
      if(!j.ok) throw new Error(j.error || 'error');
      Q = Q.filter(c => !batch.includes(c)); saveQ();
      online = true; lastOk = Date.now();
    }catch(_){ online = false }
    pushing = false; badge();
    if(Q.length && online) later(); else if(online) pull();
  }

  async function pull(){
    if(!ON || pulling) return;
    const ks = Object.keys(cache);
    if(!ks.length) return;
    pulling = true;
    const since = Math.min(...ks.map(cur));
    try{
      const r = await fetch(URL_ + (URL_.includes('?') ? '&' : '?') + 'since=' + since + '&keys=' + encodeURIComponent(ks.join(',')));
      const j = await r.json();
      if(!j.ok) throw new Error(j.error || 'error');
      const changed = new Set();
      for(const [n, k, i, v, d] of j.ch){
        if(!cache[k] || n <= cur(k) || d === dev) continue;
        if(Q.some(c => c.k === k && c.i === i)) continue;
        const o = cache[k];
        if(v == null || v === ''){ if(i in o){ delete o[i]; delete snap[k][i]; changed.add(k) } }
        else if(snap[k][i] !== v){ try{ o[i] = JSON.parse(v); snap[k][i] = v; changed.add(k) }catch(_){} }
      }
      for(const k of ks) setCur(k, j.cur);
      for(const k of changed){ LS.set(k, JSON.stringify(cache[k])); (L[k] || []).forEach(f => { try{ f() }catch(e){ console.error(e) } }) }
      online = true; lastOk = Date.now();
    }catch(_){ online = false }
    pulling = false; badge();
  }

  let pill = null;
  function badge(){
    if(!ON) return;
    if(!pill){
      pill = document.createElement('div'); pill.className = 'fxsync'; pill.setAttribute('role', 'status');
      document.body.appendChild(pill);
    }
    const n = Q.length;
    if(!online){ pill.dataset.s = 'off'; pill.textContent = 'Sin conexión' + (n ? ' · ' + n + ' por enviar' : '') }
    else if(n){ pill.dataset.s = 'wait'; pill.textContent = 'Enviando ' + n + '…' }
    else { pill.dataset.s = 'ok'; pill.textContent = 'Compartido con todos · al día' }
  }
  const st = document.createElement('style');
  st.textContent = '.fxsync{position:fixed;left:10px;bottom:10px;z-index:9999;font:600 12px/1 system-ui,sans-serif;padding:7px 10px;border-radius:999px;background:#E3F4E8;color:#17643A;box-shadow:0 2px 8px rgba(0,0,0,.15);pointer-events:none}.fxsync[data-s=wait]{background:#FFF1D6;color:#8A4B00}.fxsync[data-s=off]{background:#FDE4E4;color:#A51B1B}@media print{.fxsync{display:none}}';
  document.head.appendChild(st);

  function tick(){ if(document.visibilityState === 'visible'){ if(Q.length) push(); else pull() } }
  if(ON){
    setInterval(tick, 6000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('online', () => { online = true; push(); pull() });
    window.addEventListener('load', () => { badge(); push(); pull() });
  }

  window.FXS = {
    get: load, set,
    on(keys, fn){ (Array.isArray(keys) ? keys : [keys]).forEach(k => (L[k] = L[k] || []).push(fn)) },
    reset(){ for(const k in L) delete L[k] },
    now(){ push(); pull() }
  };
})();
