# LottoX · entorno de pruebas

Simulación completa de la plataforma LottoGE para probar el **rediseño** (la propuesta del 29/10/2026): la **página principal aprobada** (con su login y sus denuncias), el **panel del superadministrador**, el **panel del operador** y los **6 fronts de venta** de Sevenlot, todo conectado entre sí. Usa los colores y la temática aprobados de la página principal (blanco, azul marino, coral, Plus Jakarta Sans y bolitas de lotería en movimiento). No es la plataforma real y no habla con api.lottoge.net. Un servidor simulado corre en el navegador, con una base de datos de ejemplo, así que todo se puede usar y repetir cuantas veces haga falta sin tocar nada de producción.

## Cómo levantarlo (localhost)

Necesitas Node 20 o más reciente.

```bash
cd plataforma
npm install
npm run dev
```

Abre **http://localhost:5173**: sale la página principal de LottoGE. Toca *Iniciar sesión* y entra con uno de los dos usuarios. `npm run dev` copia la página principal (`../landing/sencilla/front`) y los fronts de venta del kit (`../kit/02 Fronts de venta`) a `public/`, los conecta y arranca el panel.

### Usuarios de prueba

| Usuario | Correo | Contraseña | Entra a |
|---|---|---|---|
| Superadministrador | `admin@lottoge.net` | `Admin2026!` | Panel de la plataforma: empresas, rifas, denuncias, cobros |
| Operador de rifas (Rifas Mérida) | `operador@rifasmerida.ejemplo` | `Prueba2026!` | Panel del operador: ventas, rifas, clientes, mensajería, ajustes |

*Cerrar sesión* (menú de la cuenta, arriba a la derecha) vuelve al login de la página principal. Con `--host` también se abre desde el teléfono, en la misma red Wi-Fi, usando la IP que muestra la consola.

`npm run build` genera `dist/`, una versión estática que funciona en cualquier servidor (`npx vite preview`, `python3 -m http.server`, etc.).

- **Cliente de prueba:** cédula **31689392** (Jean Franco Sánchez Suárez). La taquilla, el verificador, el bot y los fronts la reconocen y autocompletan sus datos.
- **Datos:** se guardan en el navegador (localStorage). Para volver a la base de ejemplo: barra morada › *Herramientas de prueba* › *Reiniciar datos*.
- **Página de venta del operador:** `http://localhost:5173/fronts/` abre la plantilla y la rifa publicadas en *Ajustes › Sitio web*.
- **Página principal:** `http://localhost:5173/pagina-principal/` (también se abre sola desde la raíz cuando no hay sesión).

## Cómo se conecta todo

- **Página principal → login → panel.** El login de la página principal valida el correo y la contraseña contra el servidor simulado y lleva a cada usuario a su panel. Sin sesión, el panel manda de vuelta a la página principal.
- **Denuncias.** Lo que se envía en *Denuncias* de la página principal llega al superadministrador (*Denuncias*), con su número de referencia, para revisarla, anotarla y resolverla.
- **Rifas activas.** La lista de la página principal muestra las rifas en venta de las empresas activas. Las de Rifas Mérida abren su front de venta.
- **Rifas nuevas.** Cuando el operador envía una rifa, queda *En revisión* hasta que el superadministrador la aprueba o la rechaza con motivo (*Rifas › Supervisor de rifas*).
- **Edición por el superadministrador.** Cada edición pide un motivo y muestra los cambios campo por campo (antes → después) antes de guardar. Si la rifa ya tiene boletos vendidos o reservados, la cantidad de números queda bloqueada; un cambio de precio solo aplica a las compras nuevas; si cambia la fecha, la original queda guardada. El operador ve un aviso en su rifa con lo que se cambió y por qué, y la página de venta muestra los datos nuevos.
- **Extensiones de fecha.** El operador pide más tiempo desde el detalle de una rifa en venta; el superadministrador la aprueba y la fecha del sorteo cambia, guardando la original.
- **Ver como operador.** Desde *Empresas › Rifas Mérida › Ver su panel*, el superadministrador entra al panel del operador con una franja para volver.
- **Notas de versión.** Las que publica el superadministrador le salen al operador en su Inicio.

## Panel del superadministrador

| Sección | Pantallas |
|---|---|
| Inicio | Resumen (accesos rápidos, cifras, ventas del mes por empresa, *Pendiente de ti*) · Sala situacional (en vivo, con pausa; cédulas y teléfonos enmascarados; alertas) · Actividad (bitácora de toda la plataforma) |
| Empresas | Pendientes, activas, suspendidas y rechazadas; búsqueda por nombre, RIF, RUN/LOT o correo; aprobar, rechazar o suspender con motivo; reactivar; cambiar plan; documentos que faltan |
| Rifas | Supervisor de rifas (revisión con requisitos, aprobar o rechazar) · **Editar rifa**: cualquier rifa en venta o esperando aprobación, de cualquier empresa, con todos sus datos (título, premios, lotería, fecha, cierre, precio, números, descripción, reglas, promociones, imágenes y solvencia) · Extensiones de fecha |
| Denuncias | Las de la página principal: revisión, notas, resolver o descartar con motivo |
| Facturación | Cobros (mantenimiento y licencias, registrar pago) · Planes (los mismos precios de la página principal) |
| Ajustes | Plataforma (un solo nombre y contacto, reglas generales) · Loterías · Usuarios · Notas de versión · Seguridad |

## Panel del operador

Navegación de la propuesta: 6 secciones arriba (en el teléfono, una barra abajo con Inicio, Vender, Pagos, Mensajes y Más), buscador global **Ctrl K** (clientes, cédulas, boletos, órdenes LG-…, rifas y pantallas), la tasa vigente siempre visible, ayuda (?) con guías y recorrido a pedido, notificaciones y cuenta (con tema claro u oscuro).

| Sección | Pantallas |
|---|---|
| Inicio | Resumen (cifras en US$ y Bs con la tasa de cada venta, gráfico de 30 días, 90 días y año, *Pendiente de ti*, últimas ventas, rifas en venta) · Actividad (bitácora) |
| Rifas | Todas las rifas (lista o tarjetas, filtros por estado que suman el total) · Nueva rifa (4 pasos, errores por campo, cierre automático, borrador, requisitos de CONALOT) · Ganadores por reportar (busca el boleto ganador, evidencia, aviso a participantes) · Detalle (Configuración de solo lectura, Promociones, Boletos con exportación) |
| Ventas | Pagos por verificar (panel lateral con comprobante, monto en US$ y Bs con la tasa aplicada; aprobar sin comprobante pide confirmación y queda en la Actividad; rechazo con motivo; abonos) · Taquilla (4 pasos, leyenda accesible, "Ir al número", al azar 1/2/5/10, promociones, abono, recibo para imprimir o mandar por WhatsApp) · Verificador · Reportes (moneda de reporte, barras por método, detalle con referencia, Excel) |
| Clientes | Clientes (segmentos con saldo, nuevos e inactivos; selección y "Enviar campaña"; Excel) · Influencers (comisión en %, bancos venezolanos, pago de comisiones) |
| Mensajería | Bandeja (3 columnas, respuestas rápidas, asignar, archivar, abrir el pago del cliente) · Resumen · Campañas de WhatsApp y correo (audiencia por segmento, consentimiento, programar) · Automatizaciones · Historial con motivo del fallo · Contactos · Agentes · Bot (con prueba en vivo que consulta el verificador) · Conexión |
| Ajustes | Empresa · Usuarios (roles en español, invitación por correo) · Cajas · Métodos de pago (iconos del catálogo, validaciones) · Monedas y tasas (una tasa vigente, historial, sin duplicados) · Pasarelas (AvilaPay y ChinChin por pasos) · **Sitio web (los 6 fronts de venta)** · Dominios (registros DNS, verificación) · Seguridad |

### Los fronts de venta dentro del panel

En **Ajustes › Sitio web** eliges una de las 6 plantillas (Estándar, Minimalista, Vibrante, Neón, Pop y Experimental), el color de la marca y los textos. Ves la vista previa real en teléfono o en computadora y publicas. Los fronts no son copias: son los del kit, conectados al mismo servidor simulado con `public/sandbox/conexion.js`, que cumple el mismo contrato que `conexion.ejemplo.js`. Por eso:

- una compra hecha en el front aparece al momento en *Ventas › Pagos por verificar* (también si está abierto en otra pestaña);
- al aprobarla se asignan los números, se envía la confirmación por correo y el front la muestra en *Mis boletos*;
- un cambio de tasa, de método de pago o de plantilla se ve en el front al recargar;
- **Pago Móvil al instante** solo aparece en el front cuando una pasarela queda *Activa* en *Ajustes › Pasarelas*. Desde ese momento entrega los números sin revisión. Una referencia que termina en 0 simula que el banco no encontró el pago.

### Herramientas de prueba (barra morada)

Simulan lo que en producción hacen otros: un atajo para responder una rifa en revisión sin cambiar de usuario, un mensaje entrante de WhatsApp, los recordatorios de pago, el vencimiento de pagos de rifas cerradas (a las 48 h en producción) y el reinicio de los datos.

## Reglas que aplica el servidor simulado

- Una sola tasa Bs/US$ vigente; cada venta guarda la suya y los reportes convierten con la tasa de cada venta. Una tasa que cambia más de 25 % pide revisión.
- Una moneda por código (no se repiten VES ni USD); validación de moneda por método (Zelle en US$, Binance en USDT…) y ningún dato de prueba visible para el comprador.
- Pago Móvil al instante: aprobado al momento por la pasarela. Métodos manuales: boletos reservados hasta que el operador aprueba. Si el comprador eligió al azar, no ve números hasta la aprobación.
- No se aprueba un pago sin referencia ni comprobante sin confirmación explícita, y queda registrado.
- Una rifa en revisión, en venta o cerrada no se edita (solo se editan borradores y rechazadas). Al pasar la fecha del sorteo queda en *Falta ganador*.
- Campañas por WhatsApp solo a quien dio su consentimiento; el embudo enviados → entregados → leídos → fallidos siempre cuadra con el historial.

## Rutas del servidor que usan los fronts

El servidor simulado responde las mismas rutas que `conexion.ejemplo.js` del kit, con el sobre `{ status, data }`. Ver `public/sandbox/api.js`, función `http()`.

| Ruta | Estado en api.lottoge.net |
|---|---|
| `GET /raffles/{id}` | observado |
| `GET /exchange-rate/current` | observado |
| `GET /companies/{id}/service-fee-public` | observado |
| `GET /payment-methods/active?companyId=` | observado |
| `GET /platform/client-lookup/{cedula}` | observado |
| `GET /raffles/{id}/taken` | por confirmar |
| `POST /orders` | por confirmar |
| `POST /orders/{id}/verify` (Pago Móvil al instante) | por confirmar |
| `POST /orders/{id}/receipt` (comprobante) | por confirmar |
| `GET /orders?cedula=&raffleId=` (Mis boletos) | por confirmar |

El panel usa directamente las funciones de `window.LottoAPI`. Al integrarlo con el código real, cada una se cambia por su llamada al API de LottoX. Sus nombres dicen qué hace cada una: `approveOrder`, `rejectOrder`, `sellCounter`, `setRate`, `reportWinner`, etc.

## Hallazgos para la integración real

1. **Los fronts siempre muestran 2º y 3er premio.** Con premio único, el entorno los oculta desde la conexión. Conviene corregirlo en el núcleo de las plantillas.
2. **Los fronts no muestran las promociones por volumen.** En el entorno, las promociones se aplican solo en la taquilla y en línea se cobra el precio normal, para que el comprador pague lo que ve.
3. **Los fronts no tienen campo de código de influencer.** Solo se carga en la taquilla.
4. **`/platform/client-lookup/{cedula}` es público y devuelve nombre, teléfono y correo.** Cualquiera que pruebe cédulas ve datos personales. Recomendación: que devuelva solo el nombre, o los datos enmascarados.
5. Las rutas marcadas *por confirmar* hay que validarlas con el backend de LottoX.
6. El código QR de *Ajustes › Empresa* es una muestra visual, no se puede escanear.

## Movimiento

Mismo lenguaje que la página principal: entrada escalonada de cada pantalla, bolitas de lotería y boletos flotando en el saludo, cifras que cuentan hasta su valor, barras que crecen, botones con resorte, números que saltan al elegirlos en la taquilla, confeti al aprobar un pago, vender, publicar un ganador, aprobar una rifa o una empresa, y una marca de "listo" que se dibuja en el recibo. Todo se apaga si el sistema pide reducir el movimiento.

## Qué no incluye

- El inicio de sesión contra el servidor real y los envíos reales de correo y WhatsApp: se simulan y quedan en *Mensajería › Historial*.
- Las demás empresas del superadministrador son registros de ejemplo con cifras fijas; Rifas Mérida es la única con operación completa.

## Estructura

```
plataforma/
  index.html               carga el catálogo de pagos y el servidor simulado, luego el panel
  src/                     panel (React + Vite): lib.js, ui.jsx, shell.jsx, styles.css y pages/
  src/pages/admin.jsx      panel del superadministrador
  public/sandbox/          api.js (servidor simulado), conexion.js (fronts ↔ servidor), pagina-principal.js (login, rifas y denuncias ↔ servidor), puente.js
  scripts/copiar-fronts.mjs  copia y conecta la página principal y los fronts (public/fronts y public/pagina-principal se generan, no se versionan)
```
