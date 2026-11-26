"""Carga una lista de precios nueva y la REVISA antes de usarla en el pedido (regla de Angel 20-nov).

Uso: python3 cargar_lista.py <PROVEEDOR> <archivo.xlsx|xlsm> [AAAA-MM-DD]
     python3 aprobar_lista.py <PROVEEDOR> "<qué se revisó>"   (solo después de revisar a mano una lista que no pasó)

1. Lee la lista nueva con el mismo acomodo de la vigente (hoja, fila de encabezados, columna de código y de cantidad).
2. Revisión de columnas y filas contra la vigente: encabezados iguales columna por columna; código y cantidad en el mismo lugar;
   ningún precio vacío o en 0; conserva ≥85% de los códigos; filas sin cambio mayor a 20%; cambio de precio razonable
   (mediana ≤15% y menos de 30% de los códigos con cambio mayor a 25%); cuántos códigos de nuestras publicaciones dejan de venir.
3. Si todo pasa queda VIGENTE y se revalidan las piezas. Si algo falla queda en lp/pendiente/ con su reporte y el pedido
   sigue con la lista vigente (la última que pasó la revisión).
"""
import sys, os, json, re, datetime, shutil, statistics, openpyxl, warnings
warnings.filterwarnings('ignore')
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
def N(s):
    s=str(s or '').strip().upper()
    if s.startswith('W-'): s=s[2:]
    if s.endswith('-EST'): s=s[:-4]
    if s.endswith('.0') and s[:-2].isdigit(): s=s[:-2]
    return s
def num(x):
    if isinstance(x,(int,float)) and not isinstance(x,bool): return float(x)
    try: return float(str(x).replace('$','').replace(',','').strip())
    except Exception: return None
def hoja(wb,h): return wb[h] if isinstance(h,str) else wb.worksheets[h]
def leer(fn,c):
    wb=openpyxl.load_workbook(fn,read_only=True,data_only=True)
    try: ws=hoja(wb,c['hoja'] if c['hoja'] is not None else 0)
    except Exception: return None,None,'no existe la hoja '+str(c['hoja'])
    rows=list(ws.iter_rows(values_only=True)); hr=c['fila_encabezado']; head=[str(x or '').strip() for x in (rows[hr-1] if len(rows)>=hr else [])]
    low=[re.sub(r'\s+','',h.lower()) for h in head]   # 26-nov: la Lista Master de ALESSIA trae "N O M B R E" espaciado
    pc=next((j for j,t in enumerate(low) if re.search(r'precio|p\.? ?unit|costo|distribuidor|mayorista',t)),None)
    dc=next((j for j,t in enumerate(low) if re.search(r'descrip|nombre|producto',t)),None)
    ec=next((j for j,t in enumerate(low) if re.search(r'existen|stock|disponib',t)),None)
    out={}
    # 26-nov: la Lista Master .xlsm de ALESSIA no trae columna de existencia: son dos columnas, "Alessia" (bodega) y "Vesta" (almacén Vesta), que se suman
    ae=[j for j,t in enumerate(low) if t in ('alessia','vesta')] if ec is None else []
    for r in rows[hr:]:
        cc=c['col_codigo']-1
        if cc>=len(r): continue
        k=N(r[cc])
        if not k: continue
        out[k]=[k,str(r[dc] or '')[:90] if dc is not None and dc<len(r) else '',num(r[pc]) if pc is not None and pc<len(r) else None,(num(r[ec]) or 0) if ec is not None and ec<len(r) else (sum((num(r[j]) or 0) for j in ae if j<len(r)) if ae else None)]
    return head,out,None

if __name__=='__main__':
    m=sys.argv[1].upper(); fn=sys.argv[2]; fecha=sys.argv[3] if len(sys.argv)>3 else datetime.date.today().isoformat()
    ix=json.load(open(os.path.join(HERE,'lp','index.json'))); c=next(x for x in ix['listas'] if x['marca']==m)
    vig=json.load(open(os.path.join(HERE,c['file']))); old={r[0]:r for r in vig['rows']}
    rep={'marca':m,'archivo':os.path.basename(fn),'fecha':fecha,'revisado':datetime.datetime.now().isoformat(timespec='minutes'),'checks':[]}
    def chk(nombre,ok,detalle): rep['checks'].append([nombre,bool(ok),detalle])
    if c.get('plantilla'):
        oh,_,_=leer(os.path.join(HERE,c['plantilla']),c); head,new,e=leer(fn,c)
        if e: chk('Hoja de la lista',False,e); new={}; head=[]
        else:
            dif=[f'col {j+1}: "{a}" → "{b}"' for j,(a,b) in enumerate(zip(oh,head)) if a!=b]+([f'{len(head)} columnas (antes {len(oh)})'] if len(head)!=len(oh) else [])
            chk('Encabezados iguales columna por columna',not dif,'; '.join(dif[:6]) or 'iguales')
            hc=lambda j:head[j-1] if len(head)>=j else ''
            chk('Columna de código y de cantidad en el mismo lugar',len(head)>=max(c['col_codigo'],c['col_cantidad']),f"código col {c['col_codigo']} «{hc(c['col_codigo'])}», cantidad col {c['col_cantidad']} «{hc(c['col_cantidad'])}»")
    else:
        wb=openpyxl.load_workbook(fn,read_only=True,data_only=True); new={}
        for ws in wb.worksheets:
            for r in ws.iter_rows(values_only=True):
                if r and len(r)>2 and r[0] and num(r[2]): new[N(r[0])]=[N(r[0]),str(r[1] or '')[:90],num(r[2]),None]
        chk('Lectura',bool(new),f'{len(new)} códigos')
    P0=json.load(open(os.path.join(HERE,'piezas.json')))['rows']; usados0={p[0] for v in P0.values() for p in v[4] if p[1]==m}
    sinp=[k for k,r in new.items() if not r[2]]; malos=[k for k in sinp if k in old or k in usados0]
    chk('Precios: ninguno vacío o en 0 en códigos que ya venían o que usamos (y menos de 2% en total)',not malos and len(sinp)<=0.02*max(1,len(new)),f'{len(malos)} de los que usamos o ya venían sin precio: {malos[:6]}; {len(sinp)} sin precio en total' if sinp else 'todos con precio')
    kept=len(set(old)&set(new))/max(1,len(old)); chk('Conserva al menos 85% de los códigos',kept>=0.85,f'{kept:.0%} ({len(set(old)-set(new))} ya no vienen, {len(set(new)-set(old))} nuevos)')
    var=len(new)/max(1,len(old))-1; chk('Número de filas sin cambio mayor a 20%',abs(var)<=0.20,f'{len(new)} códigos (antes {len(old)}, {var:+.0%})')
    ch=[(new[k][2]/old[k][2]-1) for k in set(old)&set(new) if new[k][2] and old[k][2]]
    med=statistics.median(ch) if ch else 0; big=sum(1 for x in ch if abs(x)>0.25)/max(1,len(ch))
    chk('Cambio de precio razonable',abs(med)<=0.15 and big<0.30,f'mediana {med:+.1%}; {big:.0%} cambian más de 25%')
    P=json.load(open(os.path.join(HERE,'piezas.json')))['rows']; usados={p[0] for v in P.values() for p in v[4] if p[1]==m}
    fuera=sorted((usados&set(old))-set(new)); rep['codigos_que_dejan_de_venir']=fuera[:400]
    chk('Códigos de nuestras publicaciones que dejan de venir',True,f'{len(fuera)} (pasan a Descontinuados): {fuera[:8]}')
    ok=all(x[1] for x in rep['checks']); rep['resultado']='VIGENTE' if ok else 'PENDIENTE: no pasó la revisión; se sigue pidiendo con la lista vigente'
    for d in ('lp/pendiente','plantillas/pendiente'): os.makedirs(os.path.join(HERE,d),exist_ok=True)
    rows=[]
    for k,r in new.items():
        row=[k,r[1],round(r[2] or 0,2)]
        if m=='ALESSIA': row.append(r[3] or 0)
        if m=='ITALIKA': o=old.get(k); row+= [o[3] if o else 1, o[4] if o else 1]
        rows.append(row)
    base=m.replace(' ','_')
    json.dump({'marca':m,'fecha':fecha,'archivo':os.path.basename(fn),'cols':vig['cols'],'rows':rows,**({'equivalencias':vig['equivalencias']} if 'equivalencias' in vig else {})},open(os.path.join(HERE,'lp','pendiente',base+'.json'),'w'),ensure_ascii=False,separators=(',',':'))
    shutil.copy(fn,os.path.join(HERE,'plantillas','pendiente',base+os.path.splitext(fn)[1].lower()))
    json.dump(rep,open(os.path.join(HERE,'lp','pendiente',base+'_revision.json'),'w'),ensure_ascii=False,indent=0)
    for x in rep['checks']: print('OK ' if x[1] else 'FALLA',x[0],'·',x[2])
    print(rep['resultado'])
    ix=json.load(open(os.path.join(HERE,'lp','index.json'))); ix.setdefault('pendientes',{})[m]={k:rep[k] for k in ('archivo','fecha','revisado','checks','resultado')}
    json.dump(ix,open(os.path.join(HERE,'lp','index.json'),'w'),ensure_ascii=False,separators=(',',':'))
    if ok:
        import aprobar_lista; aprobar_lista.aprobar(m,'Revisión automática OK '+rep['revisado'])
