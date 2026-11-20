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
for i,r in enumerate(ws.iter_rows(values_only=True)):
    if i==2: desc=str(r[1] or '')
    if i<9 or not r or len(r)<21 or not r[1]: continue
    PL[r[1]]=[str(r[3] or ''),str(r[5] or '')[:90],r[9] or '',r[11] or '',n(r[13]),n(r[14]),n(r[15]),n(r[16]),(n(r[17]) if r[17] not in ('-',None) else 0),r[19] or '',str(r[20] or '')[:160]]
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
