"""Agrega un mes cerrado a gestion-data/pedido/historia.json (ventas por mes de la página, fuente única para pedido y reparto).
Regla de Angel (25-nov-2026): cada último día de mes o el día 1 del mes siguiente se baja el reporte de Planificación de Full;
su columna "Unidades vendidas" (últimos 30 días) es la venta del mes. Si el reporte es del día 28 o después, cuenta para ese mes;
si es del día 1 o 2, cuenta para el mes anterior. Se agrega el mes al final y sale el más viejo (siempre 25 meses).
Uso: python3 ventas_mes.py "Reporte de Planificacion - 30-11-2026.xlsx" [--mes "NOV 2026"] [--forzar]"""
import json, os, re, sys, argparse, unicodedata, datetime as dt
import openpyxl
HERE = os.path.dirname(os.path.abspath(__file__))
MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
def norm(s): return unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower().strip()

def leer(p):
    ws = openpyxl.load_workbook(p, read_only=True, data_only=True).worksheets[0]
    filas = list(ws.iter_rows(values_only=True)); fecha = None
    for r in filas[:10]:
        for x in r:
            m = re.search(r'Descargado el (\d+) de (\w+)', str(x or ''))
            if m: fecha = (int(m.group(1)), MESL.index(norm(m.group(2))) + 1)
    for i, r in enumerate(filas[:40]):
        t = [norm(x) for x in r]
        if any('codigo ml' in x for x in t) and any('unidades vendidas' in x for x in t):
            cc = next(k for k, x in enumerate(t) if 'codigo ml' in x); cu = next(k for k, x in enumerate(t) if 'unidades vendidas' in x)
            V = {}
            for r2 in filas[i + 1:]:
                if r2[cc]: V[str(r2[cc]).strip()] = float(r2[cu] or 0)
            return V, fecha
    raise SystemExit('No encontré las columnas Código ML y Unidades vendidas en el reporte.')

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('reporte'); ap.add_argument('--mes', default=''); ap.add_argument('--anio', type=int, default=0); ap.add_argument('--forzar', action='store_true')
    A = ap.parse_args(); V, f = leer(A.reporte)
    if A.mes: mes = A.mes.upper()
    else:
        if not f: raise SystemExit('No encontré la fecha de descarga en el reporte: usa --mes "NOV 2026".')
        d, m = f; y = A.anio or dt.date.today().year
        if d <= 2: m -= 1
        elif d < 28: raise SystemExit('El reporte es del día %d: debe ser del último día del mes o del día 1. Usa --mes si de todos modos quieres cargarlo.' % d)
        if m == 0: m, y = 12, y - 1
        mes = '%s %d' % (MES[m - 1], y)
    p = os.path.join(HERE, 'historia.json'); H = json.load(open(p, encoding='utf-8'))
    if mes in H['meses'] and not A.forzar: raise SystemExit('%s ya está cargado (usa --forzar para reemplazarlo).' % mes)
    if mes in H['meses']:
        k = H['meses'].index(mes)
        for c in set(H['rows']) | set(V): H['rows'].setdefault(c, [0] * len(H['meses']))[k] = V.get(c, 0)
    else:
        H['meses'] = H['meses'][1:] + [mes]
        for c in list(H['rows']): H['rows'][c] = H['rows'][c][1:] + [V.get(c, 0)]
        for c in V:
            if c not in H['rows']: H['rows'][c] = [0] * (len(H['meses']) - 1) + [V[c]]
    H['fuente'] = re.sub(r'\. Desde NOV 2026.*$', '', H['fuente']) + '. Desde NOV 2026 cada mes se agrega con ventas_mes.py (último: %s, %s)' % (mes, os.path.basename(A.reporte))
    json.dump(H, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('Cargado %s: %d Códigos ML con venta, %d u. Meses: %s a %s.' % (mes, sum(1 for v in V.values() if v > 0), sum(V.values()), H['meses'][0], H['meses'][-1]))

if __name__ == '__main__': main()
