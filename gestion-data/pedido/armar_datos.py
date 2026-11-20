"""Arma por primera vez (o refresca) los datos del pedido en gestion-data/pedido/ a partir de las fuentes actuales.
Después de esto el pedido ya no lee el RGP: lee estos JSON y los cambios aprobados en la hoja compartida.
Uso: python3 armar_datos.py  (rutas de fuentes abajo)."""
import pickle, json, os, sys, collections, datetime
HERE=os.path.dirname(os.path.abspath(__file__)); GD=os.path.dirname(HERE)
sys.path.insert(0,GD); import gm_rgp
RGP53='/mnt/user-data/uploads/muestras/envios_fuente/env/rgp53.pkl'
V24='/mnt/user-data/uploads/muestras/envios_fuente/env/v24m.pkl'
OCT='/tmp/claude-0/p59o/calc/oct2026.json'
LPK='/tmp/claude-0/p59o/calc/lp59.pkl'
J=lambda n,o:json.dump(o,open(os.path.join(HERE,n),'w'),ensure_ascii=False,separators=(',',':'))
ORDEN=['ALESSIA','REFACOM','SAYTO','MRM','KINGMOTO','WINMEX','TMMP','MOTO AZCAPOTZALCO','ITALIKA']
def N(s):
    s=str(s or '').strip().upper()
    if s.startswith('W-'): s=s[2:]
    if s.endswith('-EST'): s=s[:-4]
    if s.endswith('.0') and s[:-2].isdigit(): s=s[:-2]
    return s
# ---------------- LISTAS ----------------
L=pickle.load(open(LPK,'rb'));LP,IT,REN,EXA=L['LP'],L['IT'],L['REN'],L['EXA']
FECHAS={'ALESSIA':('2026-11-19','Lista_Master_Alessia_19_Noviembre.xlsx (con existencias)'),'SAYTO':('2026-11-01','Lista SAYTO 01-nov'),'REFACOM':('2026-11-01','Lista REFACOM noviembre'),
 'MRM':('2026-11-01','Lista MRM noviembre'),'MOTO AZCAPOTZALCO':('2026-11-01','Lista Moto Azcapotzalco noviembre'),'KINGMOTO':('2026-11-08','Lista KINGMOTO tienda 8-nov'),
 'WINMEX':('2026-10-23','WINMEX LISTA OCTUBRE 23-oct'),'ITALIKA':('2026-10-01','Lista ITALIKA octubre'),'TMMP':('2026-09-28','Lista TMMP 28-sep')}
idx=[]
for m in ORDEN:
    rows=[]
    for c,v in LP[m].items():
        r=[c,str(v[0] or '')[:90],round(float(v[1] or 0),2)]
        if m=='ALESSIA': r.append(EXA.get(c,0))
        elif m=='ITALIKA': it=IT.get(c,{}); r+= [it.get('mult',1), 1 if it.get('activo',True) else 0]
        rows.append(r)
    cols=['codigo','desc','precio']+(['existencia'] if m=='ALESSIA' else ['empaque','activo'] if m=='ITALIKA' else [])
    J(f'lp/{m.replace(" ","_")}.json',{'marca':m,'fecha':FECHAS[m][0],'archivo':FECHAS[m][1],'cols':cols,'rows':rows,**({'equivalencias':REN} if m=='MRM' else {})})
    idx.append({'marca':m,'fecha':FECHAS[m][0],'archivo':FECHAS[m][1],'codigos':len(rows),'file':f'lp/{m.replace(" ","_")}.json'})
J('lp/index.json',{'actualizado':datetime.date.today().isoformat(),'orden':ORDEN,'listas':idx})
OWN=collections.defaultdict(list)
for m in ORDEN:
    for c in LP[m]: OWN[c].append(m)
def owners(c,m=None):
    c=N(c); o=list(OWN.get(c,[]))
    if 'MRM' not in o and REN.get(c) in LP['MRM']: o.append('MRM')
    return o
print('listas',[(x['marca'],x['codigos']) for x in idx])
# ---------------- PIEZAS ----------------
d=pickle.load(open(RGP53,'rb'))
PD={r[0]:r for r in d['PEDIDOS DIRECTOS'][4:] if r[0]}
COMP=collections.defaultdict(list)
for r in d['PD COMPUESTOS'][3:]:
    if r[0] and r[3]: COMP[r[0]].append((N(r[4]),r[6],float(r[7] or 0)/float(r[3])))
RG={}
for r in d['RGP'][2:]:
    if r and len(r)>34 and r[10]: RG.setdefault(r[10],r)
car=gm_rgp.vigentes()
BYCML=collections.defaultdict(list)
for k,o in car.items():
    if o.get('codml'): BYCML[o['codml']].append(o)
num=lambda x:float(x) if isinstance(x,(int,float)) else (float(x) if str(x or '').replace('.','',1).isdigit() else 0.0)
def resolve(code,decl):
    o=owners(code)
    if decl in o: return decl,'ok'
    if o: return o[0],'corregida'
    return (decl or 'SIN LISTA'),'sin lista'
PZ={};stat=collections.Counter()
for cml in sorted(set(PD)|set(BYCML)):
    p=PD.get(cml); cs=BYCML.get(cml,[])
    o=cs[0] if cs else {}
    tipo=(o.get('tipo') or '').upper()
    decl=(p[4] if p else (RG.get(cml) or [None]*35)[34]) or ''
    decl={'WINMEX ACEITE':'WINMEX'}.get(decl,decl)
    bod=(p[5] if p else '') or o.get('bodega') or ''
    tit=(p[1] if p else '') or o.get('titulo','')
    dhf=num(p[26]) if p else 0
    piezas=[]
    if p:
        codes=[x.strip() for x in str(p[3] or '').split('+') if x.strip()]
        if len(codes)>1 or tipo.startswith('COMPUESTO'):
            cp={c:(mm,f) for c,mm,f in COMP.get(cml,[])}
            for c in codes: mm,f=cp.get(N(c),(None,1.0)); piezas.append([N(c),mm or decl,round(f,4)])
        elif codes: piezas.append([N(codes[0]),decl,round(num(p[6]) or 1,4)])
    elif o:
        codes=[N(o.get(k)) for k in ('c1','c2','c3','c4','c5','c6') if o.get(k)]
        if not codes: continue
        if tipo.startswith('COMPUESTO'): piezas=[[c,decl,1.0] for c in codes]
        else:
            dv=num(o.get('divide'));mu=num(o.get('multiplica'))
            piezas=[[codes[0],decl,round((1/dv if dv else 1)*(mu if mu else 1),4)]]
    if not piezas: continue
    if any(c.upper()=='DESCONTINUADO' for c,_,_ in piezas): est='descontinuado'
    out=[]
    for c,mm,f in piezas:
        m2,e=resolve(c,mm); out.append([c,m2,f,e,mm or '']); stat[e]+=1
    t='C' if len(out)>1 else 'I'
    PZ[cml]=[tit[:100],bod,t,dhf,out,('PD' if p else 'CAR'),o.get('mlm',''),o.get('img','')]
J('piezas.json',{'actualizado':datetime.date.today().isoformat(),'fuente':'Arranque 20-nov-2026: PEDIDOS DIRECTOS y PD COMPUESTOS del RGP (última vez) + Características vigentes (gm_rgp). La marca de cada pieza se valida contra las listas de precios vigentes.',
 'cols':['titulo','bodega','tipo','dias_full','piezas','origen','mlm','img'],'pieza_cols':['codigo','marca','factor','estado','marca_rgp'],'rows':PZ})
print('piezas',len(PZ),stat,collections.Counter(v[2] for v in PZ.values()))
# ---------------- HISTORIA ----------------
V=pickle.load(open(V24,'rb'));hdr=V[0];octd=json.load(open(OCT))
meses=[h for h in hdr[1:25]]
H={}
for r in V[1:]:
    if r[0]: H[r[0]]=[int(x) if isinstance(x,(int,float)) and float(x).is_integer() else (round(x,1) if isinstance(x,(int,float)) else 0) for x in r[1:25]]+[octd.get(r[0],0)]
for k,v in octd.items():
    if k not in H: H[k]=[0]*24+[v]
J('historia.json',{'meses':meses+['OCT 2026'],'fuente':'V24M (oct-2024 a sep-2026) + ventas oct-2026; cada mes se agrega el mes cerrado desde el reporte de ventas de ML','rows':H})
print('historia',len(H))
# ---------------- REGLAS ----------------
REG={'version':1,'actualizado':datetime.date.today().isoformat(),
 'parametros':{'Z':0.84,'revision_dias':7,'seguridad_dias':7,'seguridad_top_dias':10,'pct_top':0.8,'min_meses_6':3,'min_meses_24':12,'unidades_rescate':2,'tope_cobertura_dias':60,'sin_urgencia_dias':30,'italika_max_empaque':500,'empaque_extra_max_dias':30,'envios_cobertura_creado':0.9},
 'proveedores':{m:{'semana':m in ('ALESSIA','REFACOM','SAYTO','MRM','KINGMOTO','WINMEX','TMMP','MOTO AZCAPOTZALCO','ITALIKA'),'bodegas':(['EDOMEX'] if m=='WINMEX' else ['CUERNAVACA','EDOMEX']),'archivo_unico_edomex':m in ('TMMP','ITALIKA')} for m in ORDEN},
 'no_regulares':['MOTOS Y EQUIPOS','MASUDA','NASAKI'],
 'bodega_no_contar':{'C-KINGMOTO-CADENAS':'Cadenas doradas del cambio de KINGMOTO','C-TMMP-260':'Pedido 49, cajas sin abrir','C-TMMP-265':'Pedido 50, cajas sin abrir','C-TMMP-270':'Pedido 51, cajas sin abrir','C-CONTEO-CADENAS-26OCT':'Conteo de cadenas (sin código de proveedor)'},
 'bodega_ajustes':{'E-ALESSIA-251079':{'HOR-024':5,'ESC-026':8,'ESC-043':4,'BPO-009':12,'RIN-053':2,'RIN-A005':1}},
 'placeholders_ml':{'SGMT23067':800},
 'envios_forzar_creado':[],'envios_forzar_no_creado':[],
 'ale0_pedir_igual':True}
J('reglas.json',REG); print('reglas ok')
