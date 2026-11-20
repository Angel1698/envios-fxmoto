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

## Lo que nunca hace
No escribe a proveedores ni al personal, no confirma cotizaciones ni proformas (eso lo autoriza Angel en el chat), no escribe contraseñas, no toca Mercado Libre ni la base de Motofix, no trabaja en domingo.

## Cómo lo usa el cálculo del pedido
`calc_pedido.py` cuenta como en camino los documentos confirmados/facturados/en camino que todavía no están en la página (por código). Si un documento no tiene detalle, cuenta lo pedido en ese archivo y la verificación "En camino del seguimiento con detalle por código" sale en Revisar hasta que se lea el documento.
