# Códigos que el proveedor no surte: pedidos en 2 o más pedidos (con entrega o cotización de ese proveedor a esa bodega) y 0 piezas surtidas o cotizadas.
# Regla de Angel 23-nov-2026. Lee historial_pedidos.json (pedidos 53-58), seguimiento.json (59 en adelante: pedido y cotizado)
# y las facturas de la página de envíos (DATA de panel-67be9943a637.html). Escribe no_surte.json, que usa calc_pedido.py.
import json,os,re,collections,datetime
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.abspath(os.path.join(HERE,'..','..'))
L=lambda p:json.load(open(os.path.join(HERE,p),encoding='utf-8'))
def norm(prov,c):
    c=str(c).strip().upper()
    if prov in('KINGMOTO','MOTO AZCAPOTZALCO'): c='-'.join(c.split('-')[:2])   # colores y "-EST" son el mismo código
    return c
bodn=lambda b:'CUERNAVACA' if str(b).upper().startswith('CUER') else 'EDOMEX'
PM={'MRM (RODA)':'MRM','MAZ':'MOTO AZCAPOTZALCO','MOTO AZCAPOTZALCO':'MOTO AZCAPOTZALCO','MOTOAZCAPO':'MOTO AZCAPOTZALCO','WINMEX ACEITE':'WINMEX'}
H=L('historial_pedidos.json'); SEG=L('seguimiento.json')['pedidos']
ORD=collections.defaultdict(lambda: collections.defaultdict(float)); GOT=collections.defaultdict(lambda: collections.defaultdict(float)); DOCS=set()
for p,prov,bod,c,q in H['rows']:
    prov=PM.get(prov.upper(),prov.upper()); ORD[(prov,bod,norm(prov,c))][str(p)]+=q
t=open(os.path.join(REPO,'panel-67be9943a637.html'),encoding='utf-8').read()
m=re.search(r'const DATA\s*=\s*',t); D,_=json.JSONDecoder().raw_decode(t[t.index('{',m.start()):])
for k,f in D['facturas'].items():
    pm=re.match(r'^(\d{2,3})\b',str(f.get('pedido','')))
    if not pm: continue
    p=pm.group(1); prov=f['title'].split(' · ')[0]; prov=PM.get(prov.upper(),PM.get(prov,prov.upper())); bod=bodn(f['bod'])
    for it in f['items']:
        q=it.get('qty') or 0
        if q>0 and not it.get('falta'): GOT[(prov,bod,norm(prov,it['code']))][p]+=q; DOCS.add((p,prov,bod))
HP={str(x[0]) for x in H['rows']}
for p,P in SEG.items():
    if p in HP: continue   # 53-58 ya vienen del historial y de las facturas
    for prov,v in P['proveedores'].items():
        for l in v.get('lineas',[]):
            if l[2]: ORD[(prov,bodn(l[0]),norm(prov,l[1]))][p]+=l[2]
        cot=collections.defaultdict(float); has=False
        if any(l[3] is not None for l in v.get('lineas',[])):
            for l in v['lineas']:
                if l[3] is not None: has=True; cot[(bodn(l[0]),norm(prov,l[1]))]+=l[3] or 0
        else:
            for d in v.get('docs',[]):
                if d.get('estado')=='reemplazada' or not d.get('items'): continue
                has=True
                for c,q in d['items']: cot[(bodn(d.get('archivo','')),norm(prov,c))]+=q
        if has:
            for b in {bodn(l[0]) for l in v.get('lineas',[])}: DOCS.add((p,prov,b))
            for (b,c),q in cot.items():
                if q>0: GOT[(prov,b,c)][p]+=q
rows=[]
for (prov,bod,c),od in sorted(ORD.items()):
    ev=[p for p in sorted(od) if (p,prov,bod) in DOCS]
    if len(ev)>=2 and sum(GOT[(prov,bod,c)].values())==0:
        rows.append([prov,bod,c,', '.join(ev),sum(od[p] for p in ev)])
json.dump({'actualizado':datetime.date.today().isoformat(),'regla':'2 o más pedidos sin surtir ni cotizar en esa bodega. ALESSIA: sustituto mientras esté en 0 (si vuelve a tener y es más barata que el sustituto, se regresa). Demás proveedores: cambio de código permanente.',
  'cols':['marca','bodega','codigo','pedidos','piezas_pedidas'],'rows':rows},open(os.path.join(HERE,'no_surte.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('no surte',len(rows),collections.Counter(r[0] for r in rows))
