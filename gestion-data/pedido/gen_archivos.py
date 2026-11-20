"""Genera los archivos de pedido por proveedor y bodega desde pedido.json, con la lista de precios vigente (plantilla) de cada proveedor.
Uso: python3 gen_archivos.py <fecha dd-mm-aaaa>   → gestion-data/pedido/archivos/<pedido>/...
Cada archivo se vuelve a abrir y se verifica en los dos sentidos: renglones visibles = códigos con cantidad > 0, ninguno oculto con
cantidad, ninguna cantidad vacía o en 0 visible, y que códigos y piezas sean iguales a pedido.json. Si algo falla, el archivo no se publica."""
import json, os, sys, shutil, collections, re, openpyxl
from openpyxl.utils import get_column_letter as CL
from openpyxl.worksheet.filters import FilterColumn, CustomFilters, CustomFilter
HERE=os.path.dirname(os.path.abspath(__file__))
FECHA=sys.argv[1] if len(sys.argv)>1 else __import__('datetime').date.today().strftime('%d-%m-%Y')
def N(s):
    s=str(s or '').strip().upper()
    if s.startswith('W-'): s=s[2:]
    if s.endswith('-EST'): s=s[:-4]
    if s.endswith('.0') and s[:-2].isdigit(): s=s[:-2]
    return s
P=json.load(open(os.path.join(HERE,'pedido.json'))); ix={x['marca']:x for x in json.load(open(os.path.join(HERE,'lp','index.json')))['listas']}
PEDN=re.sub(r'[^0-9A-Za-z]+','-',str(P['pedido'])).strip('-')
OUT=os.path.join(HERE,'archivos',PEDN); shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT)
REN=json.load(open(os.path.join(HERE,'lp','MRM.json'))).get('equivalencias',{})
by=collections.defaultdict(dict)
for l in P['lineas']: by[(l[1],l[0])][l[2]]=by[(l[1],l[0])].get(l[2],0)+l[3]
RES=[]
for (m,arch),items in sorted(by.items()):
    c=ix[m]; ext='.xlsm' if (c['plantilla'] or '').endswith('.xlsm') else '.xlsx'
    name=f"{c['prefijo']} {P['pedido']} {arch} {FECHA}{ext}"; dst=os.path.join(OUT,name); err=[]
    if not c['plantilla']:
        wb=openpyxl.Workbook(); ws=wb.active; ws.title='Hoja1'; ws.append(['CODIGO','CANTIDAD'])
        for k,q in sorted(items.items()): ws.append([k,q])
        ws.auto_filter.ref=f'A1:B{len(items)+1}'; wb.save(dst); hr,cc,qc,sh=1,1,2,0
    else:
        shutil.copy(os.path.join(HERE,c['plantilla']),dst)
        wb=openpyxl.load_workbook(dst,keep_vba=(ext=='.xlsm')); sh=c['hoja']
        ws=wb[sh] if isinstance(sh,str) else wb.worksheets[sh]; cc,qc,hr=c['col_codigo'],c['col_cantidad'],c['fila_encabezado']
        mr,mc=ws.max_row,ws.max_column; pend=dict(items)
        for r in range(hr+1,mr+1):
            ws.row_dimensions[r].hidden=False
            k=N(ws.cell(r,cc).value)
            if m=='MRM' and k not in pend and REN.get(k) in pend: k=REN[k]
            if k in pend: ws.cell(r,qc).value=pend.pop(k)
            elif isinstance(ws.cell(r,qc).value,(int,float)): ws.cell(r,qc).value=None
        if pend: err.append(f'{len(pend)} códigos no están en la plantilla: {list(pend)[:6]}')
        for r in range(hr+1,mr+1):
            v=ws.cell(r,qc).value; ws.row_dimensions[r].hidden=not (isinstance(v,(int,float)) and not isinstance(v,bool) and v>0)
        ws.auto_filter.ref=f'A{hr}:{CL(mc)}{mr}'
        ws.auto_filter.filterColumn=[FilterColumn(colId=qc-1,customFilters=CustomFilters(customFilter=[CustomFilter(operator='greaterThan',val='0')]))]
        wb.active=wb.worksheets.index(ws)
        for o in wb.worksheets: o.sheet_view.tabSelected=(o is ws)
        wb.save(dst)
    # verificación (archivo vuelto a abrir)
    wb=openpyxl.load_workbook(dst,read_only=False); ws=wb[sh] if isinstance(sh,str) else wb.worksheets[sh]; got={}
    for r in range(hr+1,ws.max_row+1):
        v=ws.cell(r,qc).value; vis=not ws.row_dimensions[r].hidden; has=isinstance(v,(int,float)) and not isinstance(v,bool) and v>0
        if has and not vis: err.append(f'fila {r} con cantidad oculta')
        if vis and not has: err.append(f'fila {r} visible sin cantidad')
        if has: k=N(ws.cell(r,cc).value); got[k]=got.get(k,0)+v
    want={(REN.get(k,k) if m=='MRM' and k not in got else k):q for k,q in items.items()}
    if sum(got.values())!=sum(items.values()) or len(got)!=len(items): err.append(f'archivo {len(got)} códigos/{sum(got.values())} pz vs cálculo {len(items)}/{sum(items.values())}')
    ok=not err
    if not ok: os.remove(dst)
    RES.append({'marca':m,'archivo':arch,'nombre':name if ok else None,'codigos':len(items),'piezas':sum(items.values()),'ok':ok,'errores':err[:8]})
    print('OK ' if ok else 'FALLA',name,len(items),sum(items.values()),'; '.join(err[:3]))
json.dump({'pedido':P['pedido'],'fecha':FECHA,'carpeta':f'archivos/{PEDN}','archivos':RES},open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=0)
print('archivos',sum(r['ok'] for r in RES),'de',len(RES))
