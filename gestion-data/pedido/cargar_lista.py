"""Carga una lista de precios nueva de un proveedor a gestion-data/pedido/lp/<PROVEEDOR>.json y revalida las piezas.
Uso: python3 cargar_lista.py <PROVEEDOR> <archivo.xlsx> [AAAA-MM-DD]
Detecta la fila de encabezados (código / descripción / precio / existencia / empaque). Revisa el resultado antes de publicar:
imprime cuántos códigos entraron, cuántos salieron contra la lista anterior y ejemplos."""
import sys, os, json, re, datetime, openpyxl, warnings
warnings.filterwarnings('ignore')
HERE=os.path.dirname(os.path.abspath(__file__))
m,fn=sys.argv[1].upper(),sys.argv[2]; fecha=sys.argv[3] if len(sys.argv)>3 else datetime.date.today().isoformat()
def N(s):
    s=str(s or '').strip().upper()
    if s.startswith('W-'): s=s[2:]
    if s.endswith('-EST'): s=s[:-4]
    if s.endswith('.0') and s[:-2].isdigit(): s=s[:-2]
    return s
def num(x):
    if isinstance(x,(int,float)): return float(x)
    try: return float(str(x).replace('$','').replace(',','').strip())
    except: return None
KEY={'codigo':r'^(c[oó]digo|clave|no\.? ?parte|sku|art[ií]culo|modelo|parte)','desc':r'(descrip|nombre|producto)','precio':r'(precio|p\.? ?unit|costo|importe|distribuidor|lista)','existencia':r'(existen|stock|disponib|inventario)','empaque':r'(empaque|m[uú]ltiplo|pzas? x|piezas por)'}
wb=openpyxl.load_workbook(fn,read_only=True,data_only=True); best=None
for ws in wb.worksheets:
    rows=list(ws.iter_rows(values_only=True))
    for i,r in enumerate(rows[:40]):
        h=[str(x or '').strip().lower() for x in r]; col={}
        for k,pat in KEY.items():
            for j,t in enumerate(h):
                if t and re.search(pat,t) and j not in col.values() and k not in col: col[k]=j
        if 'codigo' in col and 'precio' in col and (best is None or len(col)>len(best[2])): best=(ws.title,i,col,rows)
if not best: raise SystemExit('No encontré encabezados de código y precio. Revisa el archivo.')
title,i,col,rows=best; out={}
for r in rows[i+1:]:
    c=N(r[col['codigo']]) if col['codigo']<len(r) else ''
    p=num(r[col['precio']]) if col['precio']<len(r) else None
    if not c or p is None: continue
    row=[c,str(r[col['desc']] or '')[:90] if 'desc' in col else '',round(p,2)]
    if m=='ALESSIA': row.append(num(r[col['existencia']]) or 0 if 'existencia' in col else 0)
    if m=='ITALIKA': row+= [int(num(r[col['empaque']]) or 1) if 'empaque' in col else 1,1]
    out[c]=row
f=os.path.join(HERE,'lp',m.replace(' ','_')+'.json'); old=json.load(open(f)) if os.path.exists(f) else {'rows':[],'cols':['codigo','desc','precio']}
oc={r[0] for r in old['rows']}; nc=set(out)
d={'marca':m,'fecha':fecha,'archivo':os.path.basename(fn),'cols':old['cols'],'rows':list(out.values())}
if 'equivalencias' in old: d['equivalencias']=old['equivalencias']
json.dump(d,open(f,'w'),ensure_ascii=False,separators=(',',':'))
ix=json.load(open(os.path.join(HERE,'lp','index.json')))
for x in ix['listas']:
    if x['marca']==m: x.update(fecha=fecha,archivo=os.path.basename(fn),codigos=len(out))
ix['actualizado']=datetime.date.today().isoformat(); json.dump(ix,open(os.path.join(HERE,'lp','index.json'),'w'),ensure_ascii=False,separators=(',',':'))
print(f'{m}: hoja "{title}", encabezado fila {i+1}, columnas {col}. {len(out)} códigos; nuevos {len(nc-oc)}, ya no vienen {len(oc-nc)}. Ej.: {list(out.values())[:3]}')
# revalidar piezas contra todas las listas
LP={}; REN={}
for x in ix['listas']:
    dd=json.load(open(os.path.join(HERE,x['file']))); LP[x['marca']]={r[0] for r in dd['rows']}; REN.update(dd.get('equivalencias',{}) if x['marca']=='MRM' else {})
own=lambda c:[k for k in ix['orden'] if c in LP[k] or (k=='MRM' and REN.get(c) in LP[k])]
P=json.load(open(os.path.join(HERE,'piezas.json'))); st={'ok':0,'corregida':0,'sin lista':0}
for v in P['rows'].values():
    for p in v[4]:
        if p[3]=='manual': continue
        o=own(p[0]); decl=p[4] or p[1]
        if decl in o: p[1],p[3]=decl,'ok'
        elif o: p[1],p[3]=o[0],'corregida'
        else: p[1],p[3]=decl,'sin lista'
        st[p[3]]+=1
P['actualizado']=datetime.date.today().isoformat(); json.dump(P,open(os.path.join(HERE,'piezas.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('piezas revalidadas',st)
