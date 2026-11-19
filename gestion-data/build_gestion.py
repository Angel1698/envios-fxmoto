import pickle, json, openpyxl, collections
r=pickle.load(open('/mnt/user-data/uploads/muestras/envios_fuente/env/rgp53.pkl','rb'))
bod={a:b for a,b,*_ in r['BODEGA'] if a}
car=r['CARACTERISTICAS']; hdr=car[0]
def cl(v):
    if v is None: return ''
    if isinstance(v,float) and v.is_integer(): v=int(v)
    return str(v).strip()
rows=[]
for t in car[1:]:
    if not t or not t[2]: continue
    row=[cl(x) for x in t[:20]]+[bod.get(cl(t[2]),'')]
    rows.append(row)
cols=['num','codml','mlm','titulo','sku','c1','c2','c3','c4','c5','c6','tipo','divide','multiplica','kit','desc','log','lognueva','pasillo','obs','bodega']
with open('rgp.json','w') as f: json.dump({'cols':cols,'fuente':'RGP NUEVO 05-10-26 · hojas CARACTERISTICAS y BODEGA','rows':rows},f,ensure_ascii=False,separators=(',',':'))
print('rgp',len(rows), collections.Counter(x[11] for x in rows).most_common(8))
# sustitutos
st=pickle.load(open('/tmp/claude-0/s3/c9/status952i.pkl','rb'))
wb=openpyxl.load_workbook('/mnt/user-data/outputs/Sustitutos_por_marca_18nov.xlsx',read_only=True)
det=[[cl(x) for x in t] for t in list(wb['Detalle 529'].iter_rows(values_only=True))[1:] if t[0]]
wb2=openpyxl.load_workbook('/mnt/user-data/outputs/59 POR MARCA/PEDIDO_59_RESUMEN_18-11-2026.xlsx',read_only=True)
rep=[[cl(x) for x in t] for t in list(wb2['Sustitutos para reparto'].iter_rows(values_only=True))[1:] if t[0]]
sin=[[cl(x) for x in t] for t in list(wb2['ALESSIA en 0 sin sustituto'].iter_rows(values_only=True))[1:] if t[0]]
REG={'REFACOM','SAYTO','MRM','KINGMOTO','WINMEX','TMMP','MOTO AZCAPOTZALCO','ITALIKA'}
for d in det: d.append(st.get(d[0],''))
json.dump({'fuente':'Sustitutos confirmados 18-nov (529) · Pedido 59 hojas "Sustitutos para reparto" y "ALESSIA en 0 sin sustituto"',
 'det_cols':['ale','titulo','marca','codigo','venta','semana','estado'],'det':det,
 'rep_cols':['bodped','marca','codigo','pz','ale','codml','uml','bodpub','nota'],'rep':rep,
 'sin_cols':['bod','codml','titulo','ale','vmes','uml','motivo'],'sin':sin},open('sust.json','w'),ensure_ascii=False,separators=(',',':'))
print('sust',len(det),len(rep),len(sin))
wa=openpyxl.load_workbook('/mnt/user-data/uploads/muestras/ACTIVOS_EMPRESA_16-11-2026.xlsx',read_only=True)
sku={t[0]:cl(t[5]) for t in list(wa['ACTIVOS EMPRESA'].iter_rows(values_only=True))[1:] if t[0]}
wo=openpyxl.load_workbook('/mnt/user-data/uploads/muestras/OPINIONES_ACTIVOS_EMPRESA_16-11-2026.xlsx',read_only=True)
L=list(wo['LISTA'].iter_rows(values_only=True))
act=[]
for t in L[1:]:
    if not t[0]: continue
    N=lambda x:(lambda v:int(v) if v==int(v) else round(v,2))(float(x) if isinstance(x,(int,float)) or (isinstance(x,str) and x.replace('.','',1).isdigit()) else 0)
    act.append([cl(t[0]),cl(t[1]),cl(t[2]),cl(t[3]),cl(t[4]),cl(t[5]),cl(t[6]),N(t[7]),N(t[8]),round(N(t[9])),N(t[10]),N(t[11]),cl(t[13]),sku.get(t[0],'')])
json.dump({'fuente':'ACTIVOS_EMPRESA_16-11-2026.xlsx y OPINIONES_ACTIVOS_EMPRESA_16-11-2026.xlsx (hoja LISTA)',
 'cols':['mlm','codml','origen','titulo','bodega','tam','clasif','opin','u30','d30','u6m','meses','sug','sku'],'rows':act},open('activos.json','w'),ensure_ascii=False,separators=(',',':'))
print('act',len(act), collections.Counter(a[2] for a in act), collections.Counter(a[12] for a in act))
# imagenes
R=r['RGP']; img={}; imgml={}
for t in R[2:]:
    if t[1] and t[14]:
        u=str(t[14]).strip(); img[cl(t[1])]=u
        if t[10] and cl(t[10]) not in imgml: imgml[cl(t[10])]=u
def short(u): return u.replace('https://http2.mlstatic.com/','')
for f,key in [('rgp.json','mlm'),('activos.json','mlm')]:
    d=json.load(open(f)); i=d['cols'].index(key); j=d['cols'].index('codml')
    d['cols'].append('img'); n=0
    for row in d['rows']:
        u=img.get(row[i]) or imgml.get(row[j],''); row.append(short(u) if u else ''); n+=bool(u)
    json.dump(d,open(f,'w'),ensure_ascii=False,separators=(',',':')); print(f,'con foto',n,len(d['rows']))
d=json.load(open('sust.json'))
# det: por codigo alessia -> imagen de alguna publicacion con c1 = codigo
car_c1={}
for t in car[1:]:
    if t and t[5] and t[2]:
        u=img.get(cl(t[2]))
        if u and cl(t[5]) not in car_c1: car_c1[cl(t[5])]=u
for row in d['det']: u=car_c1.get(row[0],''); row.append(short(u) if u else '')
for row in d['rep']: u=imgml.get(row[5],''); row.append(short(u) if u else '')
for row in d['sin']: u=imgml.get(row[1],''); row.append(short(u) if u else '')
d['det_cols'].append('img');d['rep_cols'].append('img');d['sin_cols'].append('img')
json.dump(d,open('sust.json','w'),ensure_ascii=False,separators=(',',':'))
print('sust fotos',sum(1 for x in d['det'] if x[-1]),sum(1 for x in d['rep'] if x[-1]),sum(1 for x in d['sin'] if x[-1]))
