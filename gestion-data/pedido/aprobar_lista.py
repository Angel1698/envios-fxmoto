"""Pasa una lista revisada de lp/pendiente/ a vigente y revalida las piezas.
Uso: python3 aprobar_lista.py <PROVEEDOR> "<motivo: qué se revisó a mano>"
Solo para listas que no pasaron la revisión automática y que un agente revisó columna por columna y fila por fila."""
import sys, os, json, glob, shutil, datetime
HERE=os.path.dirname(os.path.abspath(__file__))
def aprobar(m,motivo):
    base=m.replace(' ','_'); src=os.path.join(HERE,'lp','pendiente',base+'.json')
    if not os.path.exists(src): raise SystemExit('No hay lista pendiente de '+m)
    d=json.load(open(src)); IXF=os.path.join(HERE,'lp','index.json'); ix=json.load(open(IXF))
    c=next(x for x in ix['listas'] if x['marca']==m)
    shutil.copy(os.path.join(HERE,c['file']),os.path.join(HERE,'lp','pendiente',base+'_anterior.json'))
    json.dump(d,open(os.path.join(HERE,c['file']),'w'),ensure_ascii=False,separators=(',',':'))
    pl=glob.glob(os.path.join(HERE,'plantillas','pendiente',base+'.*'))
    if pl and c.get('plantilla'):
        ext=os.path.splitext(pl[0])[1]; c['plantilla']='plantillas/'+base+ext; shutil.move(pl[0],os.path.join(HERE,c['plantilla']))
    c.update(fecha=d['fecha'],archivo=d['archivo'],codigos=len(d['rows']),revision=motivo); ix.get('pendientes',{}).pop(m,None)
    ix['actualizado']=datetime.date.today().isoformat(); json.dump(ix,open(IXF,'w'),ensure_ascii=False,separators=(',',':'))
    os.remove(src); r=os.path.join(HERE,'lp','pendiente',base+'_revision.json')
    if os.path.exists(r): os.rename(r,os.path.join(HERE,'lp','pendiente',base+'_revision_aplicada.json'))
    # revalidar piezas
    LP={}; REN={}
    for x in ix['listas']:
        dd=json.load(open(os.path.join(HERE,x['file']))); LP[x['marca']]={r[0] for r in dd['rows']}
        if x['marca']=='MRM': REN=dd.get('equivalencias',{})
    own=lambda k:[q for q in ix['orden'] if k in LP[q] or (q=='MRM' and REN.get(k) in LP[q])]
    P=json.load(open(os.path.join(HERE,'piezas.json'))); st={}
    for v in P['rows'].values():
        for p in v[4]:
            if p[3]=='manual': continue
            o=own(p[0])
            if p[3]=='verificada' and p[1] in o: continue
            decl=p[4] or p[1]
            if decl in o: p[1],p[3]=decl,'ok'
            elif o: p[1],p[3]=o[0],'corregida'
            else: p[1],p[3]=decl,'sin lista'
            st[p[3]]=st.get(p[3],0)+1
    P['actualizado']=datetime.date.today().isoformat(); json.dump(P,open(os.path.join(HERE,'piezas.json'),'w'),ensure_ascii=False,separators=(',',':'))
    print(m,'VIGENTE desde',d['fecha'],'·',motivo,'· piezas',st)
if __name__=='__main__': aprobar(sys.argv[1].upper(),sys.argv[2] if len(sys.argv)>2 else 'revisada a mano')
