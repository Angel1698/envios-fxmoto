"""Carga los reportes de Mercado Libre del día a gestion-data/pedido/reportes.json.
Uso: python3 cargar_reportes.py <carpeta con los 3 reportes>  (toma el más reciente de cada tipo por fecha de archivo)
  - Reporte de Planificacion*.xlsx  - stock_general_full*.xlsx  - *Cargos_por_stock_antiguo*.xlsx"""
import openpyxl, json, os, sys, glob, warnings, datetime, re
warnings.filterwarnings('ignore')
HERE=os.path.dirname(os.path.abspath(__file__))
R=sys.argv[1] if len(sys.argv)>1 else '/mnt/user-data/uploads/muestras/reportes_ml/'
def last(pat):
    fs=sorted(glob.glob(os.path.join(R,pat)),key=os.path.getmtime)
    if not fs: raise SystemExit('Falta reporte: '+pat)
    return fs[-1]
def n(x):
    if x is None: return 0.0
    if isinstance(x,(int,float)): return float(x)
    try: return float(str(x).replace('$','').replace(',','').strip())
    except: return 0.0
fp,fs,fc=last('Reporte de Planificacion*.xlsx'),last('stock_general_full*.xlsx'),last('*Cargos_por_stock_antiguo*.xlsx')
wb=openpyxl.load_workbook(fp,read_only=True,data_only=True);ws=wb.worksheets[0];PL={};desc=''
# 26-nov-2026: ML cambió el formato (sin "Fecha límite", "Nivel de stock" en lugar de "Urgencia de envío"); las columnas se ubican por encabezado
H=None
for i,r in enumerate(ws.iter_rows(values_only=True)):
    if i==2: desc=str(r[1] or '')
    if H is None:
        if r and r[1]=='Código ML':
            hs=[str(x or '').lower() for x in r]
            def col(*keys):
                for k in keys:
                    for j,h in enumerate(hs):
                        if k in h: return j
                raise SystemExit('Planificación: no encuentro la columna '+keys[0])
            H=dict(sku=col('sku'),tit=col('producto'),tam=col('tamaño'),est=col('estrella','clasificación de p'),v30=col('unidades vendidas'),apt=col('aptas'),pend=col('pendiente','en camino'),mini=col('mínimas'),sug=col('sugeridas'),urg=col('urgencia de envío','nivel de stock'),obs=col('observaciones'))
        continue
    if not r or not r[1]: continue
    g=lambda k:r[H[k]] if H[k]<len(r) else None
    PL[r[1]]=[str(g('sku') or ''),str(g('tit') or '')[:90],g('tam') or '',g('est') or '',n(g('v30')),n(g('apt')),n(g('pend')),n(g('mini')),(n(g('sug')) if g('sug') not in ('-',None) else 0),g('urg') or '',str(g('obs') or '')[:160]]
wb=openpyxl.load_workbook(fs,read_only=True,data_only=True)
IMP={};DES={};SPROM={}
for i,r in enumerate(wb['Para impulsar ventas'].iter_rows(values_only=True)):
    if i<7 or not r[1]: continue
    IMP[r[1]]=[n(r[8]),n(r[9]),n(r[11])]
for i,r in enumerate(wb['Para evitar descarte'].iter_rows(values_only=True)):
    if i<8 or not r[1]: continue
    DES[r[1]]=sum(n(x) for x in r[7:])
for i,r in enumerate(wb['Buena calidad'].iter_rows(values_only=True)):
    if i<8 or not r[1]: continue
    SPROM[r[1]]=n(r[9])
for k,v in IMP.items(): SPROM.setdefault(k,v[2])
wb=openpyxl.load_workbook(fc,read_only=True,data_only=True);CAR={}
for i,r in enumerate(wb.worksheets[0].iter_rows(values_only=True)):
    if i<2 or not r[0]: continue
    c=CAR.setdefault(r[0],[0.0,0.0,'']);c[0]+=n(r[13]);c[1]+=n(r[15]);c[2]=str(r[7] or '')
mt=lambda f:datetime.datetime.fromtimestamp(os.path.getmtime(f)).isoformat(timespec='minutes')
out={'cargado':datetime.datetime.now().isoformat(timespec='minutes'),
 'archivos':{'planificacion':[os.path.basename(fp),mt(fp),desc],'stock_general':[os.path.basename(fs),mt(fs)],'cargos':[os.path.basename(fc),mt(fc)]},
 'pl_cols':['sku','titulo','tam','estrella','v30','aptas','pend','minimo','sug','urg','obs'],'PL':PL,'IMP_cols':['aptas','v30','sprom'],'IMP':IMP,'DES':DES,'SPROM':SPROM,'CAR_cols':['u','cargo','antig'],'CAR':CAR}
json.dump(out,open(os.path.join(HERE,'reportes.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('reportes',desc,len(PL),len(IMP),len(DES),len(CAR))
import collections
urg=collections.Counter(v[9] or '-' for v in PL.values())
meta={'cargado':out['cargado'],'archivos':out['archivos'],'publicaciones':len(PL),'urgencia':dict(urg.most_common()),
 'v30':round(sum(v[4] for v in PL.values())),'aptas':round(sum(v[5] for v in PL.values())),'pendientes':round(sum(v[6] for v in PL.values())),
 'en_cero_con_venta':sum(1 for v in PL.values() if v[4]>0 and v[5]+v[6]<=0),'impulsar':len(IMP),'descarte':len(DES),'cargo_antiguo':len(CAR),'cargo_total':round(sum(v[1] for v in CAR.values()))}
json.dump(meta,open(os.path.join(HERE,'reportes_meta.json'),'w'),ensure_ascii=False,indent=0)
print(meta['urgencia'])
