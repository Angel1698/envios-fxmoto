/* Installation identity. No IMEI, contacts or phone number are read. */
window.FXDevice=(()=>{
 let device;
 const hex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x.toString(16).padStart(2,'0')).join('');
 const ready=(async()=>{
  if(window.Capacitor?.isNativePlatform())device=await Capacitor.registerPlugin('NativeSync').identity();
  else{try{device=JSON.parse(localStorage.getItem('fx-capture-device-v1'));}catch(_){}if(!device){device={id:hex(16),key:hex(32),name:'Navegador '+(/Android/.test(navigator.userAgent)?'Android':/iPhone|iPad/.test(navigator.userAgent)?'iPhone':'computadora')};localStorage.setItem('fx-capture-device-v1',JSON.stringify(device));}}
  return device;
 })();
 ready.catch(()=>{});
 return {ready,current:()=>device,other:owner=>!!owner&&owner.dispositivo!==device?.id,
  remember:id=>localStorage.setItem('fx-capture-owned-'+id,device.id),
  owns:id=>localStorage.getItem('fx-capture-owned-'+id)===device?.id,
  async claim(id,cred){await ready;if(!navigator.onLine){if(this.owns(id))return;throw Error('Conéctate para reservar esta captura antes de trabajar sin señal.');}let result;if(window.FXAPP?.reserve)result=await FXAPP.reserve(id);else{const r=await fetch(SYNC(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({tipo:'reservar',id,...cred,dispositivo:device})});result=await r.json();if(!result.ok)throw Error(result.error||'No se pudo reservar la captura.');}this.remember(id);return result;},
  async rename(name){await ready;name=String(name||'').trim().slice(0,80);if(!name)throw Error('Escribe un nombre para este equipo.');device.name=name;if(window.Capacitor?.isNativePlatform())await Capacitor.registerPlugin('NativeSync').rename({name});else localStorage.setItem('fx-capture-device-v1',JSON.stringify(device));}
 };
})();
