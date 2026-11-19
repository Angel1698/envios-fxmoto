"""Características del RGP vigentes = rgp.json + registro compartido (hoja de Google de la página de envíos).

Uso desde cualquier sesión (pedidos, reparto, envíos a Full, reparaciones de la página):

    import sys; sys.path.insert(0, '<repo envios-fxmoto>/gestion-data')
    import gm_rgp
    car = gm_rgp.vigentes()              # {numero_producto: {...campos...}} con los cambios aprobados aplicados
    pend = gm_rgp.pendientes()           # cambios que esperan aprobación de Dirección
    gm_rgp.registrar(clave, campo, nuevo, motivo, quien='Claude (sesión X)')   # queda pendiente
    gm_rgp.registrar(..., aprobado=True) # solo cuando Angel lo autorizó en el chat

Nunca edites rgp.json a mano para un cambio puntual: regístralo aquí para que quede quién, cuándo y por qué.
"""
import json, os, time, random, string, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KEY = 'fx-gm-rgp'


def _url():
    txt = open(os.path.join(HERE, '..', 'sync-config.js'), encoding='utf-8').read()
    return txt.split("FX_SYNC_URL = '")[1].split("'")[0]


def registro():
    """Todos los cambios registrados (dict id -> cambio), leídos de la hoja compartida."""
    with urllib.request.urlopen(_url() + '?since=0&keys=' + KEY, timeout=60) as r:
        j = json.load(r)
    if not j.get('ok'):
        raise RuntimeError(j)
    out = {}
    for n, k, i, v, d in j['ch']:
        if k != KEY:
            continue
        if v in (None, ''):
            out.pop(i, None)
        else:
            out[i] = json.loads(v)
    return out


def base():
    d = json.load(open(os.path.join(HERE, 'rgp.json'), encoding='utf-8'))
    C = d['cols']
    res = {}
    for row in d['rows']:
        o = dict(zip(C, row))
        res.setdefault(o['num'], o)
    return res


def vigentes():
    car = base()
    for i, c in sorted(registro().items(), key=lambda x: str(x[1].get('fecha'))):
        if c.get('estado') != 'aprobado':
            continue
        k = c.get('clave') or c.get('mlm')
        if c.get('tipo') == 'alta':
            car[k] = dict(c.get('datos') or {}, mlm=c.get('mlm'), num=k)
        elif k in car:
            car[k][c['campo']] = c['despues']
    return car


def pendientes():
    return {i: c for i, c in registro().items() if c.get('estado') == 'pendiente'}


def registrar(clave, campo, nuevo, motivo, quien, aprobado=False):
    car = base()
    o = car.get(clave) or {}
    now = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    cid = 'c' + format(int(time.time() * 1000), 'x') + ''.join(random.choices(string.ascii_lowercase, k=4)) + campo
    ch = {'tipo': 'cambio', 'clave': clave, 'mlm': o.get('mlm', ''), 'codml': o.get('codml', ''), 'campo': campo,
          'antes': str(o.get(campo, '')), 'despues': str(nuevo), 'motivo': motivo, 'por': quien, 'fecha': now,
          'estado': 'aprobado' if aprobado else 'pendiente'}
    if aprobado:
        ch.update(revisadoPor='Angel (autorizado en chat)', revisadoFecha=now)
    body = json.dumps({'dev': 'claude', 'who': quien, 'ch': [{'k': KEY, 'i': cid, 'v': json.dumps(ch, ensure_ascii=False)}]}).encode()
    req = urllib.request.Request(_url(), data=body, headers={'Content-Type': 'text/plain;charset=utf-8'})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.load(r)
    if not j.get('ok'):
        raise RuntimeError(j)
    return cid
