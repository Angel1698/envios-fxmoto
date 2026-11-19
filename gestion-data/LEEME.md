# Gestión (gestion-236ef9.html): reglas para todas las sesiones

Pantallas: #rgp (Características del RGP), #sustitutos, #activos. Las fotos salen del LINK IMAGEN del RGP (mlstatic).

## Dónde vive cada dato
- gestion-data/rgp.json: CARACTERISTICAS + BODEGA del RGP NUEVO 05-10-26 (base). Llave = NUMERO DE PRODUCTO.
- Hoja compartida (la misma de las palomitas, sync-config.js), clave fx-gm-rgp: registro de cambios y altas (quién, cuándo, antes, después, motivo, estado pendiente/aprobado/rechazado).
- gestion-data/sust.json: sustitutos confirmados + hoja "Sustitutos para reparto" y "ALESSIA en 0 sin sustituto" del último pedido.
- gestion-data/activos.json: ACTIVOS_EMPRESA y OPINIONES_ACTIVOS_EMPRESA.

## Reglas
1. Cualquier sesión que necesite características (pedido, reparto, envíos, página) usa gm_rgp.vigentes(); nunca un RGP viejo ni un pickle.
2. Un cambio de características se registra con gm_rgp.registrar(...): queda pendiente. Solo se marca aprobado si Angel lo autorizó en el chat. Nunca se edita rgp.json a mano para un cambio puntual.
3. Cuando un pedido nuevo genere su resumen (Sustitutos para reparto / ALESSIA en 0), la sesión de pedidos regenera sust.json con build_gestion.py, sube DV en la página y hace commit el mismo día.
4. Los envíos y repartos asignan la pieza del sustituto a la publicación de "Sustitutos para reparto"; el código de la publicación no se cambia.
5. Consolidación: cada noche la tarea programada aplica los cambios aprobados a rgp.json (deja el registro intacto) y publica.
6. Aprobar desde la página: el equipo de Angel se marca abriendo gestion-236ef9.html#direccion una vez. No es un candado de seguridad (la página no tiene usuarios); el candado real llega con Motofix.
