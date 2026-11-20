"""Cálculo del pedido semanal a proveedor desde los datos de la página de gestión (sin RGP ni Excel).

Lee (todo dentro del repo envios-fxmoto):
  gestion-data/pedido/reportes.json   reportes de ML del día (cargar_reportes.py)
  gestion-data/pedido/piezas.json     piezas por Código ML (código, proveedor, factor) + cambios aprobados (hoja compartida, clave fx-gm-piezas)
  gestion-data/pedido/lp/*.json       listas de precios vigentes
  gestion-data/pedido/historia.json   ventas por mes (24 meses)
  gestion-data/pedido/reglas.json     parámetros + cambios aprobados (clave fx-gm-reglas)
  gestion-data/sust.json              sustitutos confirmados + aprobados en la página (clave fx-gm-sust)
  panel-67be9943a637.html             DATA de la página de envíos: en camino, bodega, envíos
  Características vigentes (gm_rgp.vigentes)
Escribe gestion-data/pedido/pedido.json (lo que muestran las pantallas Cálculo, Descontinuados y Aprobación).
Uso: python3 calc_pedido.py <número de pedido> [--sin-hoja]   (--sin-hoja: no lee cambios de la hoja compartida)
"""
import json, os, sys, re, math, statistics, collections, datetime, urllib.request
HERE=os.path.dirname(os.path.abspath(__file__)); GD=os.path.dirname(HERE); REPO=os.path.dirname(GD)
sys.path.insert(0,GD); import gm_rgp
PEDIDO=sys.argv[1] if len(sys.argv)>1 and not sys.argv[1].startswith('--') else '?'
SIN_HOJA='--sin-hoja' in sys.argv
L=lambda p:json.load(open(os.path.join(HERE,p),encoding='utf-8'))
def N(s):
    s=str(s or '').strip().upper()
    if s.startswith('W-'): s=s[2:]
    if s.endswith('-EST'): s=s[:-4]
    if s.endswith('.0') and s[:-2].isdigit(): s=s[:-2]
    return s
num=lambda x: float(x) if isinstance(x,(int,float)) else 0.0

# ---------- hoja compartida (cambios aprobados) ----------
def hoja(key):
    if SIN_HOJA: return {}
    try:
        with urllib.request.urlopen(gm_rgp._url()+'?since=0&keys='+key,timeout=60) as r: j=json.load(r)
        out={}
        for n_,k,i,v,d in j.get('ch',[]):
            if k!=key: continue
            if v in (None,''): out.pop(i,None)
            else: out[i]=json.loads(v)
        return out
    except Exception as e:
        print('AVISO: no se pudo leer la hoja compartida',key,e); return {}
aprob=lambda key:[c for c in sorted(hoja(key).values(),key=lambda c:str(c.get('fecha'))) if c.get('estado')=='aprobado']

# ---------- reglas ----------
REG=L('reglas.json')
for c in aprob('fx-gm-reglas'):
    try: val=json.loads(c['despues'])
    except Exception: val=c['despues']
    sec,_,k=c['campo'].partition('.')
    if k: REG.setdefault(sec,{})[k]=val
    else: REG[sec]=val
P_=REG['parametros']
Z,REV,SEGG,SEGA,PCT,MIN6,MIN24,UPR,TOPE,SINURG=(P_['Z'],P_['revision_dias'],P_['seguridad_dias'],P_['seguridad_top_dias'],P_['pct_top'],P_['min_meses_6'],P_['min_meses_24'],P_['unidades_rescate'],P_['tope_cobertura_dias'],P_['sin_urgencia_dias'])
PROV=REG['proveedores']; SEMANA={m for m,v in PROV.items() if v.get('semana')}

# ---------- listas ----------
LIX=L('lp/index.json'); ORDEN=LIX['orden']; LP={}; LPMETA={}; EXA={}; IT={}; REN={}
for x in LIX['listas']:
    d=L(x['file']); m=d['marca']; ci=d['cols']
    LP[m]={r[0]:(r[1],r[2]) for r in d['rows']}; LPMETA[m]=(d['fecha'],d['archivo'],len(d['rows']))
    if m=='ALESSIA': EXA={r[0]:r[ci.index('existencia')] for r in d['rows']}
    if m=='ITALIKA': IT={r[0]:{'mult':r[ci.index('empaque')] or 1,'activo':bool(r[ci.index('activo')])} for r in d['rows']}
    if m=='MRM': REN=d.get('equivalencias',{})
def code(m,c):
    c=N(c)
    if m=='MRM': c=REN.get(c,c)
    return c
def owners(c):
    return [m for m in ORDEN if code(m,c) in LP[m]]

# ---------- reportes ----------
RP=L('reportes.json'); PC=RP['pl_cols']
PL={k:dict(zip(PC,v)) for k,v in RP['PL'].items()}
for c,u in REG.get('placeholders_ml',{}).items():
    if c in PL:
        PL[c]['pend']=max(0,PL[c]['pend']-u)
        if PL[c]['urg']=='Excedente': PL[c]['urg']='-'
IMP=RP['IMP']; DES=RP['DES']; SPROM=RP['SPROM']; CARGO={k:{'u':v[0]} for k,v in RP['CAR'].items()}
FREP=RP['archivos']['planificacion'][1][:10]

# ---------- piezas (+ cambios aprobados) ----------
PZ=L('piezas.json')['rows']
PZLOG=[]
for c in aprob('fx-gm-piezas'):
    cml=c.get('cml')
    try: nuevo=json.loads(c['despues'])
    except Exception: continue
    if cml in PZ: PZ[cml][4]=[[N(p[0]),p[1],float(p[2] or 1),'manual',p[1]] for p in nuevo]
    else: PZ[cml]=[c.get('titulo',''),c.get('bodega',''),'C' if len(nuevo)>1 else 'I',0,[[N(p[0]),p[1],float(p[2] or 1),'manual',p[1]] for p in nuevo],'PAGINA','','']
    if c.get('bodega'): PZ[cml][1]=c['bodega']
    PZ[cml][2]='C' if len(PZ[cml][4])>1 else 'I'; PZLOG.append(cml)
# validar marca de cada pieza contra las listas (regla 20-nov): la marca es la de la lista donde aparece el código
MARCAFIX=[]
for cml,v in PZ.items():
    for p in v[4]:
        c,m=p[0],p[1]
        if m in LP and code(m,c) in LP[m]: continue
        o=owners(c)
        if o and m!=o[0]: MARCAFIX.append((cml,c,m,o[0])); p[1]=o[0]

# ---------- características vigentes ----------
CAR=gm_rgp.vigentes(); CARx={}
for o in CAR.values():
    if o.get('codml'): CARx.setdefault(o['codml'],o)

# ---------- DATA de la página de envíos ----------
txt=open(os.path.join(REPO,'panel-67be9943a637.html'),encoding='utf-8').read()
i0=txt.index('const DATA=')+len('const DATA='); D,_=json.JSONDecoder().raw_decode(txt[i0:])
hoy=datetime.date.today().isoformat()
sent=collections.defaultdict(float); SENTSRC=collections.defaultdict(float); ENVLOG=[]
fmin=FREP if FREP[:4].isdigit() else hoy   # envíos con fecha anterior al reporte ya salieron: están en Full o en pendientes
for e,E in D['envios'].items():
    em=D.get('envmeta',{}).get(e,{}); f=em.get('fecha','')
    tot=sum(l['u'] for l in E['lines'])
    if not tot: continue
    cov=sum(min(l['u'],(PL.get(l['cml']) or {}).get('pend',0)) for l in E['lines'])
    if e in REG.get('envios_forzar_creado',[]): est='creado (regla)'
    elif e in REG.get('envios_forzar_no_creado',[]): est='no creado (regla)'
    elif not f or f<fmin: continue
    elif tot>=50 and cov>=P_['envios_cobertura_creado']*tot: est='creado (ya en pendientes de ML)'
    else: est='no creado (se suma)'
    ENVLOG.append([e,E.get('bod'),f,round(tot),round(cov),est])
    if est.startswith('no creado'):
        for l in E['lines']: sent[l['cml']]+=l['u']; SENTSRC['envío '+e]+=l['u']

# ---------- historia ----------
H=L('historia.json')['rows']
def serie(cml):
    h=H.get(cml)
    if not h: return [0.0]*23
    return [num(h[24])]+[num(x) for x in reversed(h[:24])][:22]
TF=collections.defaultdict(list)
for cml,v in PZ.items():
    if v[3]: TF[(v[4][0][1],v[1])].append(v[3])
TFm={k:statistics.median(x) for k,x in TF.items()}

# ---------- necesidad por Código ML ----------
rows=[]
for cml,v in PZ.items():
    p=PL.get(cml,{}); v30=p.get('v30',0.0)
    vv=[v30]+serie(cml)
    c6=sum(1 for x in vv[:6] if x>0); c24=sum(1 for x in vv[:24] if x>0)
    prim=-1
    for k in range(23,-1,-1):
        if vv[k]>0: prim=k;break
    nuevo=(0<=prim<=1) or ('1 mes de ventas' in str(p.get('obs','')).lower())
    mes=max(vv[0],0.5*vv[0]+0.3*vv[1]+0.2*vv[2])
    if nuevo and prim>=0: mes=max(vv[0],(vv[0]+vv[1])/(prim+1))
    sp=SPROM.get(cml,0.0); cens=False   # sin dato de stock promedio = 0 (igual que el pedido 59)
    if not nuevo and c6>=MIN6 and sp is not None and sp<1 and p.get('aptas',0)<=0:
        alt=statistics.median(vv[1:6])
        if alt>mes: cens=alt
    sx=sum(vv[:6]); sxx=sum(x*x for x in vv[:6]); sdm=math.sqrt(max((sxx-sx*sx/6)/5,mes))
    marca=v[4][0][1]; bod=v[1] or ('EDOMEX' if p.get('tam') in ('Grande','Extragrande') else 'CUERNAVACA')
    tf=v[3] or TFm.get((marca,bod),12)
    ap=p.get('aptas',0)
    rows.append(dict(cml=cml,piezas=v[4],tipo=v[2],marca=marca,bod=bod,v30=v30,c6=c6,c24=c24,nuevo=nuevo,d=mes/30,sdm=sdm,tf=tf,cens=cens,
        const=all(x>0 for x in vv[:6]) or all(x>0 for x in vv[:3]),aptas=ap,pend=p.get('pend',0),sent=sent[cml],full=ap+p.get('pend',0)+sent[cml],
        est=str(p.get('estrella','')).upper() in ('SÍ','SI','ESTRELLA'),minML=p.get('minimo',0),sug=p.get('sug',0),obs=str(p.get('obs','')),urg=p.get('urg',''),
        sprom=sp if sp is not None else 0,inpl=bool(p),tit=p.get('titulo','') or v[0],tam=p.get('tam',''),img=v[7]))
ds=sorted((x['d'] for x in rows),reverse=True); tot=sum(ds); acc=0; umb=0
for x in ds:
    acc+=x
    if acc>=PCT*tot: umb=x;break
for x in rows:
    if x['cens'] and x['cens']/30>=umb:
        m_=x['cens']; x['d']=m_/30; x['sdm']=max(x['sdm'],math.sqrt(m_)); x['cens']=True
    else: x['cens']=False
def bloquea(o):
    s=o.lower()
    return 'no puedes enviar stock' in s or 'te sugerimos no reponer' in s or ('categor' in s and 'incorrecta' in s) or 'hasta que lo reactives' in s or 'dejaste de ofrecer full' in s or 'prohibid' in s
OUT=[]; WHY=collections.Counter(); WHYP=[]
for x in rows:
    cml=x['cml']; mot=''; car=CARx.get(cml)
    if not x['inpl']: mot='No está en planificación'
    elif bloquea(x['obs']): mot='Bloqueado por Mercado Libre'
    elif any(p[0]=='DESCONTINUADO' for p in x['piezas']) or str(x['marca']).upper()=='DESCONTINUADO': mot='Descontinuado'
    elif car is not None:
        t=str(car.get('tipo') or '').upper(); log=str(car.get('lognueva') or '').upper()
        if 'DSC' in t and 'CHAMARRA' in str(car.get('titulo') or '').upper(): mot='No reabastecer (chamarra)'
        elif any(k in log for k in ('SALIO DE FULL','SACADO DE FULL','QUITA DE FULL')) or log.startswith('COLECTA'): mot='Salió de Full / colecta'
    if not mot and not x['est'] and cml in IMP and x['v30']==0: mot='Impulsar ventas sin ventas en 30 días'
    if not mot and not x['est'] and not x['nuevo'] and CARGO.get(cml,{}).get('u',0)>0 and x['c6']<MIN6: mot='Con cargo por stock antiguo'
    if not mot and cml in DES and x['aptas']>0: mot='Para evitar descarte (ML) con aptas en Full'
    if not mot and str(x['urg']).lower()=='excedente': mot='Excedente (ML)'
    if not mot and str(x['urg']).lower()=='sin urgencia' and (x['aptas']+x['pend'])>=x['d']*SINURG: mot=f'ML: sin urgencia y aptas + pendientes cubren ≥{SINURG} días'
    if mot: WHY[mot]+=1; WHYP.append((x,mot)); continue
    if x['est']: clase='ESTRELLA'
    elif x['nuevo']: clase='NUEVO'
    elif x['c6']>=MIN6 or (x['sprom']<1 and x['c6']>=1): clase='REGULAR'
    elif x['c24']>=MIN24 and x['full']<=0: clase='RESCATE'
    else: m_=f'Venta en menos de {MIN6} de 6 meses'; WHY[m_]+=1; WHYP.append((x,m_)); continue
    if clase=='RESCATE': uml=UPR; s=UPR; h=0
    else:
        seg=SEGA if (x['d']>=umb and x['d']>0) else SEGG; h=x['tf']+REV+seg
        s=x['d']*h+Z*x['sdm']/math.sqrt(30)*math.sqrt(h)
        if not x['nuevo'] and not x['est']: s=min(s,max(int(x['d']*TOPE),1))
        if x['est']: s=max(s,x['minML']+x['d']*(x['tf']+REV))
        uml=max(0,math.ceil(s-x['full']-1e-9))
    if uml<=0: WHY['Full ya alcanza']+=1; WHYP.append((x,'Full ya alcanza')); continue
    x.update(clase=clase,uml=uml,obj=s,h=h,top=x['d']>=umb); OUT.append(x)

# ---------- en camino y bodega (página de envíos) ----------
EC=collections.defaultdict(float); ECSRC=[]
for k,f in D['facturas'].items():
    if f.get('encamino') in (True,'True'):
        m=k.split('-')[1]
        for i in f['items']:
            q=(i.get('qty') or 0)-sum(x.get('pz',0) for x in i.get('dest',[]))
            if q>0: EC[(f['bod'],N(i['code']))]+=q; ECSRC.append([f['bod'],m,k,N(i['code']),q])
# documentos del seguimiento de pedidos que todavía no están en la página de envíos (cotización/proforma/OV confirmada, factura sin subir)
SEG=json.load(open(os.path.join(HERE,'seguimiento.json'),encoding='utf-8')) if os.path.exists(os.path.join(HERE,'seguimiento.json')) else {'pedidos':{}}
TXTF=' '.join([k+' '+json.dumps({kk:vv for kk,vv in f.items() if kk not in ('items',)},ensure_ascii=False) for k,f in D['facturas'].items()])
SEGEC=[]; SEGSIN=[]; YA=set()
for pn,pp in SEG['pedidos'].items():
    for m_,pv in pp['proveedores'].items():
        for doc in pv.get('docs',[]):
            if doc.get('estado') not in ('confirmada','facturada','en camino') or doc.get('llego') or doc.get('en_pagina'): continue
            if doc.get('numero') and doc['numero'].lstrip('0') in TXTF: continue   # ya está en la página: se cuenta desde DATA
            bod_=('CUERNAVACA' if doc.get('archivo','').startswith('CUERNAVACA') else 'EDOMEX')
            items=doc.get('items') or []
            if not items:   # sin detalle todavía: se cuenta lo pedido en ese archivo y se marca para revisar
                ka=(pn,m_,doc.get('archivo'))
                items=[] if ka in YA else [[l[1],l[2]] for l in pv['lineas'] if l[0]==doc.get('archivo')]; YA.add(ka)
                SEGSIN.append(f"{m_} {doc.get('tipo')} {doc.get('numero')} (pedido {pn})")
            for c_,q_ in items:
                if q_>0: EC[(bod_,N(c_))]+=q_; ECSRC.append([bod_,m_,f"seguimiento {pn} {doc.get('tipo')} {doc.get('numero')}",N(c_),q_]); SEGEC.append(q_)
NC=REG.get('bodega_no_contar',{}); AJ=REG.get('bodega_ajustes',{})
BOD=collections.defaultdict(float); BSRC=[]; NOCU=[]
for k,f in D['facturas'].items():
    if f.get('encamino') in (True,'True'): continue
    for i in f['items']:
        s=(i.get('stay',0) or 0)-AJ.get(k,{}).get(i['code'],0)
        if s<=0: continue
        if k in NC: NOCU.append([f['bod'],k,N(i['code']),s,NC[k]]); continue
        BOD[(f['bod'],N(i['code']))]+=s; BSRC.append([f['bod'],k,N(i['code']),s])

# ---------- sustitutos ----------
SU=json.load(open(os.path.join(GD,'sust.json'),encoding='utf-8')); dc=SU['det_cols']
SUBM={}
for r in SU['det']:
    o=dict(zip(dc,r))
    if o.get('codigo') and o.get('estado') in ('CON','CONF','AUTO','LIDER',''): SUBM[N(o['ale'])]=(o['marca'],N(o['codigo']),'confirmado')
for c in aprob('fx-gm-sust'):
    if c.get('codigo') and c.get('sust_marca') and c.get('sust_codigo'): SUBM[N(c['codigo'])]=(c['sust_marca'],N(c['sust_codigo']),'página')

# ---------- piezas de proveedor ----------
DEM=collections.defaultdict(float); SRC=collections.defaultdict(list); NOLP=[]; ALE0=[]; SUBLOG=[]
def put(o,bod,c,m,q,orig=None):
    k=(bod,m,c); DEM[k]+=q*o['uml']; SRC[k].append([o['cml'],o['uml'],o['d']*q,o['tam'],q,orig])
for o in OUT:
    for c0,m,f,est,mr in o['piezas']:
        c=code(m,c0)
        if m not in LP or c not in LP[m]:
            ot=[b for b in owners(c0) if b!=m]
            NOLP.append([o['bod'],o['cml'],o['tit'],m,c0,o['v30'],round(o['d']*30,1),o['aptas'],o['tipo'],('Sin proveedor en lista' if m not in LP else 'Código ya no aparece en la lista vigente'),','.join(ot),o['img']])
            continue
        if m not in SEMANA: NOLP.append([o['bod'],o['cml'],o['tit'],m,c0,o['v30'],round(o['d']*30,1),o['aptas'],o['tipo'],'Proveedor que no se pide esta semana','',o['img']]); continue
        bod=o['bod']
        if m=='ALESSIA' and EXA.get(c,0)<=0:
            s=SUBM.get(c); done=False
            if s and s[0] in SEMANA:
                sb,sc=s[0],code(s[0],s[1])
                if sc in LP.get(sb,{}):
                    b2=bod
                    if 'CUERNAVACA' not in PROV.get(sb,{}).get('bodegas',[]) and bod=='CUERNAVACA':
                        b2=None if o['tam'] in ('Grande','Extragrande') else 'EDOMEX'
                    if b2:
                        put(o,b2,sc,sb,f,orig=c); SUBLOG.append([b2,c,sb,sc,f*o['uml'],o['cml'],bod]); done=True
            if not done:
                ALE0.append([o['bod'],o['cml'],o['tit'],c,f*o['uml'],'ALESSIA en 0 y sin sustituto que se pueda pedir',o['img']])
                if REG.get('ale0_pedir_igual',True): put(o,bod,c,'ALESSIA',f)
            continue
        put(o,bod,c,m,f)

# ---------- empaques y pedido ----------
PACK={}
for c,v in IT.items():
    if v['mult']>1: PACK[('ITALIKA',c)]=(v['mult'],'Múltiplo lista ITALIKA')
for c,v in LP.get('KINGMOTO',{}).items():
    mm=re.search(r'(?:paquete|caja|bolsa)\s*(?:de\s*)?(\d+)\s*pz|(\d+)\s*pzs?\s*(?:x\s*)?caja',str(v[0]),re.I)
    if mm: PACK[('KINGMOTO',c)]=(int(mm.group(1) or mm.group(2)),'Descripción KINGMOTO')
PED={}; NOTE={}; EXCL=[]; DED={}
for k,v in DEM.items():
    bod,m,c=k
    if bod not in PROV.get(m,{}).get('bodegas',['CUERNAVACA','EDOMEX']): EXCL.append([bod,m,c,round(v,2),f'{m} no entrega en {bod}']); continue
    if m=='ITALIKA' and not IT.get(c,{}).get('activo',True): EXCL.append([bod,m,c,round(v,2),'ITALIKA: código inactivo en la lista']); continue
    ec_=EC.get((bod,c),0); bo=BOD.get((bod,c),0)
    n=v-ec_-bo; DED[k]=(round(min(ec_,v),2),round(min(bo,max(0,v-ec_)),2))
    if n<=1e-9: continue
    n=math.ceil(n-1e-9); pk=PACK.get((m,c))
    if pk and pk[0]>1:
        P2=pk[0]; price=(LP[m].get(c) or ('',0))[1] or 0
        if m=='ITALIKA' and price*P2>P_['italika_max_empaque']: EXCL.append([bod,m,c,n,f'Empaque de {P2} cuesta ${price*P2:,.0f} (> ${P_["italika_max_empaque"]})']); continue
        order=math.ceil(n/P2)*P2; extra=order-n; vdc=sum(s[2] for s in SRC[k])
        PED[k]=order
        if extra: NOTE[k]=f'Redondeado a empaque de {P2}' if (vdc>0 and extra/vdc<=P_['empaque_extra_max_dias']) else f'Empaque de {P2}: lo extra ({extra}) pasa de {P_["empaque_extra_max_dias"]} días de venta'
    else: PED[k]=n
    if any(s[5] for s in SRC[k]): NOTE[k]=(NOTE.get(k,'')+' · ' if k in NOTE else '')+'Sustituto de ALESSIA '+', '.join(sorted({s[5] for s in SRC[k] if s[5]}))
# ALESSIA con menos existencia que lo necesario: lo que tiene a ALESSIA, el resto al sustituto
SPLIT=[]
for c in sorted({k[2] for k in PED if k[1]=='ALESSIA'}):
    ks=sorted([k for k in PED if k[1]=='ALESSIA' and k[2]==c],key=lambda k:-sum(x[2] for x in SRC[k]))
    tot=sum(PED[k] for k in ks); ex=EXA.get(c,0)
    if not (0<ex<tot): continue
    left=ex
    for k in ks:
        keep=min(PED[k],int(left)); left-=keep; rest=PED[k]-keep
        if rest<=0: continue
        s=SUBM.get(c); k2=None
        if s and s[0] in SEMANA and code(s[0],s[1]) in LP.get(s[0],{}):
            b2=k[0]
            if 'CUERNAVACA' not in PROV.get(s[0],{}).get('bodegas',[]) and b2=='CUERNAVACA': b2='EDOMEX'
            k2=(b2,s[0],code(s[0],s[1])); PED[k2]=PED.get(k2,0)+rest; fr=rest/PED[k]
            SRC[k2]=SRC.get(k2,[])+[[x[0],x[1]*fr,x[2]*fr,x[3],x[4],c] for x in SRC[k]]; DED.setdefault(k2,(0,0))
            NOTE[k2]=(NOTE.get(k2,'')+' · ' if k2 in NOTE else '')+f'Sustituto de ALESSIA {c}: ALESSIA tiene {ex:g} de {tot}'
            if keep>0: PED[k]=keep; NOTE[k]=(NOTE.get(k,'')+' · ' if k in NOTE else '')+f'ALESSIA solo tiene {ex:g}: el resto ({rest}) va a {s[0]} {k2[2]}'
            else: del PED[k]
        SPLIT.append([k[0],c,keep,rest,(k2[1]+' '+k2[2]) if k2 else ''])
def size(k):
    g=mm=0
    for s in SRC.get(k,[]):
        if s[3] in ('Grande','Extragrande'): g+=s[1]
        else: mm+=s[1]
    return 'GRANDE-XG' if g>mm else 'PEQ-MED'
def archivo(k):
    b,m,c=k
    return b if (b=='CUERNAVACA' or PROV.get(m,{}).get('archivo_unico_edomex')) else 'EDOMEX '+size(k)

# ---------- verificaciones ----------
CHK=[]
gx=[k for k in PED if k[0]=='CUERNAVACA' and size(k)=='GRANDE-XG']
CHK.append(['Nada grande/extragrande para Cuernavaca',not gx,f'{len(gx)} renglones' if gx else 'OK'])
wb=[k for k in PED if k[0] not in PROV.get(k[1],{}).get('bodegas',['CUERNAVACA','EDOMEX'])]
CHK.append(['Cada proveedor solo a las bodegas donde entrega',not wb,f'{len(wb)} renglones' if wb else 'OK'])
otra=[r for r in NOLP if r[10]]
CHK.append(['Ningún código "no en lista" está en otra lista vigente',not otra,('; '.join(f'{r[4]} ({r[3]}→{r[10]})' for r in otra[:12])) if otra else 'OK'])
inc=[]
for o in OUT:
    if o['tipo']!='C': continue
    falt=[r[4] for r in NOLP if r[1]==o['cml'] and r[0]==o['bod']]
    if falt and len(falt)<len(o['piezas']): inc.append(f"{o['cml']} (falta {', '.join(falt)})")
CHK.append(['Compuestos completos (ninguna pieza pedida sin la otra)',not inc,('; '.join(inc[:15])+(f' y {len(inc)-15} más' if len(inc)>15 else '')) if inc else 'OK'])
CHK.append([f'Reportes de ML del día ({FREP})',FREP==hoy,RP['archivos']['planificacion'][2]])
vie=[f'{m} {LPMETA[m][0]}' for m in SEMANA if m in LPMETA and (datetime.date.today()-datetime.date.fromisoformat(LPMETA[m][0])).days>30]
CHK.append(['Listas de precios con menos de 30 días',not vie,('Pedir lista nueva: '+', '.join(vie)) if vie else 'OK'])
CHK.append(['En camino del seguimiento con detalle por código',not SEGSIN,('Sin detalle, se contó lo pedido: '+'; '.join(SEGSIN[:10])) if SEGSIN else f'{round(sum(SEGEC))} pz de documentos aún no subidos a la página'])
CHK.append(['Marca de piezas corregida contra listas',True,f'{len(MARCAFIX)} piezas tomadas de la lista donde sí aparecen' if MARCAFIX else 'OK'])

# ---------- salida ----------
lineas=[]
for k,q in sorted(PED.items(),key=lambda x:(archivo(x[0]),x[0][1],x[0][2])):
    b,m,c=k; pr=(LP[m].get(c) or ('',0))[1] or 0
    lineas.append([archivo(k),m,c,q,(LP[m].get(c) or ('',''))[0],pr,round(pr*q,2),NOTE.get(k,''),sorted({s[0] for s in SRC.get(k,[])}),DED.get(k,(0,0))[0],DED.get(k,(0,0))[1],b])
res=collections.defaultdict(lambda:[0,0,0.0])
for l in lineas: r=res[(l[1],l[0])]; r[0]+=1; r[1]+=l[3]; r[2]+=l[6]
por_pub=[[o['bod'],o['cml'],o['tit'],o['clase'],o['urg'],o['v30'],round(o['d']*30,1),o['aptas'],o['pend'],o['sent'],round(o['obj'],1),o['uml'],' + '.join(f"{p[1]} {p[0]}×{p[2]:g}" for p in o['piezas']),o['tam'],o['img']] for o in OUT]
nopid=[[x['bod'],x['cml'],x['tit'],m_,x['v30'],x['aptas'],x['img']] for x,m_ in WHYP if x['v30']>0 and m_!='Full ya alcanza']
out={'pedido':PEDIDO,'calculado':datetime.datetime.now().isoformat(timespec='minutes'),'reportes':RP['archivos'],
 'listas':{m:list(v) for m,v in LPMETA.items()},'reglas_version':REG.get('version'),'piezas_cambios':len(PZLOG),
 'resumen_cols':['marca','archivo','codigos','piezas','importe'],'resumen':[[m,a,v[0],v[1],round(v[2],2)] for (m,a),v in sorted(res.items())],
 'lineas_cols':['archivo','marca','codigo','pz','desc','precio','importe','nota','codml','encamino','bodega','bod'],'lineas':lineas,
 'pub_cols':['bod','codml','titulo','clase','urg','v30','vmes','aptas','pend','envios','objetivo','uml','piezas','tam','img'],'pubs':por_pub,
 'nolp_cols':['bod','codml','titulo','marca','codigo','v30','vmes','aptas','tipo','motivo','en_otra_lista','img'],'nolp':NOLP,
 'ale0_cols':['bod','codml','titulo','codigo','uml','motivo','img'],'ale0':ALE0,
 'sust_cols':['bod','ale','marca','codigo','pz','codml','bodpub'],'sust':SUBLOG,'split':SPLIT,
 'excl_cols':['bod','marca','codigo','pz','motivo'],'excl':EXCL,
 'nopid_cols':['bod','codml','titulo','motivo','v30','aptas','img'],'nopid':nopid,'por_que':dict(WHY),
 'envios_cols':['envio','bod','fecha','u','en_pendientes_ml','estado'],'envios':ENVLOG,'encamino_cols':['bod','marca','documento','codigo','pz'],'encamino':ECSRC,
 'marcafix':MARCAFIX,'checks':CHK}
json.dump(out,open(os.path.join(HERE,'pedido.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('pubs',len(OUT),'renglones',len(lineas),'pz',sum(PED.values()),'importe',round(sum(l[6] for l in lineas)))
for (m,a),v in sorted(res.items()): print(' ',a,m,v[0],v[1],round(v[2]))
print('nolp',len(NOLP),'ale0',len(ALE0),'marcafix',len(MARCAFIX))
for c in CHK: print(' ','OK ' if c[1] else 'FALLA',c[0],'·',c[2][:160])
