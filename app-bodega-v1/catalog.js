function extractData(html){
 const anchor=html.indexOf('const DATA=');if(anchor<0)throw Error('No se encontró el catálogo de la página.');
 const start=html.indexOf('{',anchor);let depth=0,quoted=false,escaped=false;
 for(let i=start;i<html.length;i++){const c=html[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(html.slice(start,i+1));}
 throw Error('El catálogo está incompleto.');
}
function slimCatalog(c){const lim=new Date(Date.now()-15*864e5).toISOString().slice(0,10);const em=c.envmeta||{};
 const env={};for(const [k,e] of Object.entries(c.envios||{})){if(em[k]&&em[k].fecha&&em[k].fecha<lim)continue;env[k]={...e,lines:e.lines.map(l=>l.big&&l.big===l.img?{...l,big:undefined}:l)};}
 const fac={};for(const [k,f] of Object.entries(c.facturas||{}))fac[k]={...f,items:(f.items||[]).map(i=>i.big&&i.big===i.img?{...i,big:undefined}:i)};
 return {...c,envios:env,facturas:fac};}
function scopeCatalog(all,arrival,bod){return slimCatalog({...all,...arrival,facturas:Object.fromEntries(Object.entries(all.facturas).filter(([,f])=>f.bod===bod)),envios:Object.fromEntries(Object.entries(all.envios).filter(([,e])=>e.bod===bod)),envmeta:all.envmeta,imgs:all.imgs,blogos:all.blogos,links:{},llinks:{},alerts:[]});}
