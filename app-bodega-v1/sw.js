const VERSION="fx-bodega-recepcion-1-2-2";const FILES=["./","./app.css","./azeret-mono-400.woff2","./azeret-mono-500.woff2","./catalog.js","./cuernavaca-data.js","./cuernavaca.html","./edomex-data.js","./edomex.html","./fonts.css","./icon-192.png","./icon-512.png","./icon.svg","./index.html","./logo-fxmoto.png","./manifest.webmanifest","./navigation.js","./offline.js","./device.js","./original.css","./original.js","./outfit-300.woff2","./outfit-400.woff2","./outfit-500.woff2","./outfit-600.woff2","./outfit-700.woff2","./outfit-800.woff2","./sync-config.js","./zxing.min.js"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('fx-bodega')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const STATIC=/\.(woff2|png|svg|ico|webmanifest)$|zxing\.min\.js$|fonts\.css$/;
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(STATIC.test(u.pathname)){e.respondWith(caches.open(VERSION).then(async c=>(await c.match(e.request,{ignoreSearch:true}))||fetch(e.request)));return}
 /* páginas, código y datos: primero internet (máx. 4 s) y si no hay, lo guardado en el teléfono */
 e.respondWith(caches.open(VERSION).then(async c=>{const cached=await c.match(e.request,{ignoreSearch:true});
  const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&r.ok)c.put(e.request,r.clone()).catch(()=>{});return r});
  if(!cached)return net;
  return Promise.race([net.catch(()=>cached),new Promise(ok=>setTimeout(()=>ok(cached),4000))]).then(r=>r||cached)}))});
