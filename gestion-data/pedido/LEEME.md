# Pedido a proveedor desde la página de gestión (sin RGP ni Excel)

Desde el 20-nov-2026 el pedido semanal se calcula con estos datos. El RGP ya no se usa para pedir.

## Datos (gestion-data/pedido/)
| Archivo | Qué es | Cómo se actualiza |
|---|---|---|
| piezas.json | Por Código ML: bodega, tipo, días a Full y sus piezas [código, proveedor, factor, estado, marca que decía el RGP] | Pantalla **Piezas** (hoja compartida, clave `fx-gm-piezas`, pendiente → aprobado por Dirección). `cargar_lista.py` revalida el estado de cada pieza |
| lp/*.json, lp/index.json | Listas de precios vigentes (ALESSIA con existencias, ITALIKA con empaque/activo, MRM con equivalencias) | `python3 cargar_lista.py <PROVEEDOR> <archivo.xlsx> [fecha]` |
| reportes.json, reportes_meta.json | Planificación, Stock general y Cargos por stock antiguo de ML | `python3 cargar_reportes.py <carpeta>` cada mañana (7 a. m.) |
| historia.json | Ventas por mes (24 meses + oct-2026) por Código ML | Al cerrar cada mes, agregar el mes desde el reporte de ventas de ML |
| reglas.json | Parámetros, proveedores de la semana, bodegas, inventario que no se cuenta | Pantalla **Reglas** (clave `fx-gm-reglas`) |
| ../sust.json + clave `fx-gm-sust` | Sustitutos confirmados + los aprobados en **Descontinuados** | Pantalla Descontinuados |
| pedido.json | Resultado: renglones por proveedor y archivo, por publicación, no en lista, ALESSIA en 0, verificaciones | `python3 calc_pedido.py <n>` |
| clave `fx-gm-pedido` | Estado por proveedor: por aprobar → aprobado → enviado → cotizado → proforma confirmada → pagado | Pantalla **Aprobación** |

En camino, inventario en bodega y envíos salen del DATA de `panel-67be9943a637.html` (la página de envíos). Todo documento que no esté en la página no se cuenta: hay que subirlo a la página.

## Cómo se corre el pedido
1. `python3 cargar_reportes.py <carpeta de reportes del día>`
2. (si llegó lista nueva) `python3 cargar_lista.py ...`
3. `python3 calc_pedido.py 60` → revisar las verificaciones que imprime (y en la pantalla Cálculo). Si alguna dice FALLA, corregir antes de entregar.
4. Subir DV en gestion-236ef9.html, commit y push a production.
5. Generar los archivos por proveedor desde pedido.json (`lineas`: archivo, proveedor, código, piezas) con las plantillas de C:\FXMOTO\muestras\pd\ y filtrado en los dos sentidos.
6. Angel aprueba en Aprobación o en el chat. Solo entonces se manda (nunca en domingo).

## Reglas que ya trae el cálculo
- **Códigos que el proveedor no surte (Angel 23-nov):** `python3 no_surte.py` antes de calcular. Si un código se pidió en 2 o más pedidos a una bodega y el proveedor no surtió ni cotizó nada, va a `no_surte.json`.
  - ALESSIA: mientras esté en existencia 0 se va al sustituto; si no hay sustituto ya no se pide (sale en ALESSIA en 0 para buscarlo). Cuando ALESSIA vuelve a tener existencia se le pide a ella, salvo que el sustituto sea más barato.
  - Demás proveedores: no se les vuelve a pedir y sale en "no en lista" con motivo "buscar cambio de código". El cambio de código es permanente (se cambia la pieza en Piezas), porque su lista no dice existencia.
  - Al mandar un pedido nuevo, sus renglones y lo cotizado quedan en seguimiento.json; los pedidos 53-58 están en historial_pedidos.json.
- La marca de cada pieza es la de la lista donde aparece su código (error del pedido 59: compuestos de dos proveedores).
- Verificaciones: nada G/XG a Cuernavaca; cada proveedor solo a sus bodegas; ningún "no en lista" que esté en otra lista; compuestos completos; reportes del día; listas con menos de 30 días.
- Envíos de la página: los de fecha anterior al reporte ya salieron; los que ya están ≥90% en pendientes de ML ya están creados; el resto se suma.
- ALESSIA en 0: sustituto confirmado de un proveedor de la semana; si no hay, se pide igual a ALESSIA. ALESSIA con menos existencia: lo que tiene y el resto al sustituto.

## Prueba de arranque (20-nov)
Recálculo del pedido 59 con los datos de hoy: 4,250 publicaciones, 36,897 pz. Contra el cálculo del 19-nov, las diferencias por publicación salen solo de los envíos nuevos de la página (reparto del 20-nov).
