function extractData(html){
 const anchor=html.indexOf('const DATA=');if(anchor<0)throw Error('No se encontró el catálogo de la página.');
 const start=html.indexOf('{',anchor);let depth=0,quoted=false,escaped=false;
 for(let i=start;i<html.length;i++){const c=html[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(html.slice(start,i+1));}
 throw Error('El catálogo está incompleto.');
}
function scopeCatalog(all,arrival,bod){return {...all,...arrival,facturas:Object.fromEntries(Object.entries(all.facturas).filter(([,f])=>f.bod===bod)),envios:Object.fromEntries(Object.entries(all.envios).filter(([,e])=>e.bod===bod)),envmeta:all.envmeta,imgs:all.imgs,blogos:all.blogos,links:{},llinks:{},alerts:[]};}
