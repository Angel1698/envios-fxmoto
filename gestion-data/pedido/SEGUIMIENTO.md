# Seguimiento de pedidos (sesión automática cada 2 horas)

Objetivo: que nunca se pierda qué se pidió, qué cotizó cada proveedor, qué facturó, qué ya llegó y qué falta, y que todo documento termine en la página de envíos. Archivo: `gestion-data/pedido/seguimiento.json` (pantalla Seguimiento de gestion-236ef9.html).

## Estructura
`pedidos[<n>].proveedores[<MARCA>]`:
- `estado`: enviado → cotizado → proforma confirmada → facturado → en camino → llegó parcial → llegó completo (o "por subir (carga masiva)" para ITALIKA).
- `docs`: [{tipo (cotización|proforma|OV|presupuesto|remisión|factura|lista de empaque), numero, archivo (CUERNAVACA | EDOMEX GRANDE-XG | EDOMEX PEQ-MED | EDOMEX), fecha, total, estado (recibida|confirmada|facturada|en camino|llegó), fuente (dónde se encontró), en_pagina (bool), llego (bool), items: [[código, piezas]]}]
- `lineas`: [archivo, código, pedido, cotizado, facturado, llegó] (null = todavía no se sabe).
- `alertas`: [{pedido, marca, tipo, nivel (alta|media), detalle}]

## Lo que hace cada corrida
1. Pedidos abiertos: los de los últimos 21 días que no estén "llegó completo".
2. Busca documentos nuevos de cada proveedor y pedido:
   - WhatsApp MCP: grupos PEDIDOS de cada marca (tabla de JID en claude/WHATSAPP_MCP_CHATS.md). Los archivos que llegan se guardan en la PC (ruta en el mensaje): se copian con device_stage_files.
   - Correo de Angel en el navegador de la app (REFACOM cfdi@mail.facturadigital.com.mx, SAYTO facturas@sayto.com.mx, MRM, Moto Azcapotzalco). Si pide iniciar sesión: no se escribe nada, se anota.
   - Portal CFDI de ALESSIA solo si la sesión ya está abierta.
3. Lee cada documento código por código (PDF con pdftotext, XML CFDI, Excel) y llena `items`, `cotizado`/`facturado` de `lineas`. Guarda el original en C:\FXMOTO\muestras\facturas\<PROVEEDOR>\.
4. Revisa la página de envíos (DATA de panel-67be9943a637.html): si el documento ya está, `en_pagina: true`; si la factura ya se recibió, `llegó` de cada código y `llego: true`.
5. Alertas:
   - proveedor sin cotizar 2 días hábiles después del envío (alta);
   - cotizado/confirmado sin factura después de 5 días hábiles (media);
   - facturado sin llegar después de 5 días hábiles (alta);
   - documento que no está en la página de envíos (alta): se deja nota "PARA CHAT ENVIOS" en la bitácora de la PC (C:\FXMOTO\whatsapp-mcp\sesion\bitacora.md) con número, proveedor, bodega y archivo, para que se suba a Recepción;
   - códigos no surtidos (pedido > cotizado o facturado): se listan; si el mismo código ya no se surtió en el pedido anterior, va a Descontinuados (regla de 2 pedidos sin surtir).
6. Guarda seguimiento.json, commit y push a production del repo envios-fxmoto (solo ese archivo y los originales; nunca tocar all.json ni build.py: eso es del chat de envíos).
7. Solo si hay alertas nuevas de nivel alta, manda a Angel un mensaje corto (SendUserMessage). Si no hay nada nuevo, no escribe.

## Aprobar proformas y mandar mensajes (autorización permanente de Angel, 20-nov)
- **Antes de confirmar, revisa el grupo del proveedor (últimos 3 días).** Si hay una pregunta, aclaración o inconsistencia nuestra sin respuesta (duplicadas, cantidades dobles, precios, faltantes), una alerta abierta de ese proveedor o un documento "reemplazada"/en duda, **no se confirma nada de ese proveedor** (ninguna de sus cotizaciones) y se avisa a Angel; la confirmación queda para él. Tampoco si Angel escribió en el grupo después del último documento. (Regla de Angel 20-nov: se confirmaron cotizaciones SAYTO 289970/289969 a los 90 min de preguntarles por la duplicada 289968/289988.)
- Aprueba proformas, cotizaciones, OV y presupuestos que pasan el cotejo: todos los códigos están en el pedido de esa bodega; cantidades iguales o menores (más solo por redondeo a la caja o empaque, máximo un empaque por código); precios dentro de ±2% de la lista vigente; dirección de envío de la bodega correcta. Mensaje: "<contacto>, confirmamos la proforma <número> (<bodega>). Gracias." y se anota en APROBACION_PEDIDO.md y en seguimiento.json con el cotejo.
- Si no pasa el cotejo (duplicadas, piezas de más, precios distintos, otra bodega): no aprueba; avisa a Angel con su recomendación.
- Puede mandar: acuses de documentos recibidos, confirmaciones que pasan el cotejo, y pedir lo que falta (proforma o cotización después de 2 días hábiles, número de factura, factura, lista de empaque, documento ilegible).
- No puede: hablar de pagos, precios, cancelaciones, reclamos o cambios de pedido; mandar pedidos ni complementos; escribir contraseñas; tocar Mercado Libre ni la base de Motofix; trabajar en domingo o fuera de 9:00 a 19:00.

## Cómo lo usa el cálculo del pedido
`calc_pedido.py` cuenta como en camino los documentos confirmados/facturados/en camino que todavía no están en la página (por código). Si un documento no tiene detalle, cuenta lo pedido en ese archivo y la verificación "En camino del seguimiento con detalle por código" sale en Revisar hasta que se lea el documento.
