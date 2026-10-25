# Front minimalista — LottoGE

Front de compra de boletos para riferos sobre la plataforma LottoGE. Es una sola página: el comprador ve el premio y, en el mismo recuadro, elige sus boletos, escribe sus datos y paga. El diseño es neutro para que el flyer, las fotos y el color de cada rifero sean lo que destaca.

> **Estado: prototipo funcional.** Todo corre en el navegador. Los pagos, la búsqueda por cédula, los números vendidos y el envío de correos están **simulados** con datos de ejemplo. Abajo se explica qué conectar a la API para usarlo en producción.

## Qué hay en esta carpeta

```
minimalista/
├── front/            ← lo que se carga en la plataforma
│   ├── index.html    la página del comprador (generada, no editar a mano)
│   ├── config.js     los datos de la rifa: lo único que cambia por rifero
│   └── img/          fotos del premio (la primera es la portada)
├── vista-previa/     el mismo front dentro de iPhones y de Macs, con panel de configuración en vivo
│   ├── index.html    fuente del diseño y la lógica
│   └── img/
├── build_front.py    genera front/index.html a partir de vista-previa/index.html
└── README.md
```

## Cómo usarlo

1. **Probarlo:** abre `front/index.html` en el navegador. Para ver todas las pantallas a la vez, abre `vista-previa/index.html`.
2. **Configurar una rifa:** edita `front/config.js` (nombre del rifero, premios, precio, tasa BCV, cantidad de números, fecha y hora, lotería, color, fotos) y pon las fotos en `front/img/`.
3. **Publicarlo:** la carpeta `front/` es estática. Se sube tal cual a cualquier hosting o CDN, o la plataforma la sirve por rifero (por ejemplo `lottoge.com/<rifero>/<rifa>`), escribiendo `config.js` con los datos del sorteo.
4. **Cambiar el diseño:** edita `vista-previa/index.html` y luego ejecuta `python3 build_front.py` para regenerar `front/index.html`. La vista previa tiene tres bloques de script: `pagos` (el catálogo de métodos de pago, copia de `fronts/_comun/metodos-pago.js`), `tema` (lo propio de la plantilla) y el principal (la página, idéntica en las seis plantillas).
5. **Kit para LottoGE:** `python3 build_kit.py`, en la raíz, arma `kit/` con lo común separado de cada tema. Es lo que va al Drive "Sevenlot fronts"; su LÉEME y su guía están en `fronts/_comun/docs/`.

Solo usa archivos locales, más la fuente *TikTok Sans* de Google Fonts. Si no hay conexión, cae a Helvetica o Arial.

## Teléfono y computadora

La misma página se adapta sola al dispositivo:

- **Teléfono** (Android, iPhone u otro): la vista móvil, en una columna. Se mantiene aunque el teléfono se ponga de lado; en ese caso la columna se centra.
- **Computadora** (ventana de 900 px o más que no sea un teléfono): la vista de escritorio.
  - Arriba van las fotos a la izquierda, y a la derecha el premio, el precio, la cuenta regresiva y lo vendido.
  - Debajo, los premios a la izquierda y el recuadro de compra a la derecha. Ese recuadro queda a la vista mientras se baja.
  - El tablero de números y las fotos en grande se abren en el centro de la ventana.
  - Las pantallas después de pagar se reparten en dos columnas.
- **Tableta**: con la ventana angosta, la vista móvil centrada; con la ventana ancha, la de escritorio.

La decide `App.setupDesk`: un teléfono se reconoce por el navegador y lo demás por el ancho de la ventana. Si la ventana cambia de tamaño, la página cambia de vista sin recargar.

En `vista-previa/index.html`, el botón flotante **Ver en iPhone / Mac** muestra las mismas pantallas dentro de un iPhone o de una Mac. También se puede abrir directo en Mac con `#mac` al final de la dirección.

## Configuración (`config.js`)

| Campo | Qué es | Ejemplo |
| --- | --- | --- |
| `rifero` | Nombre de la marca del rifero | `'Rifas La Bendición'` |
| `handle` | Instagram donde se transmite | `'@rifaslabendicion'` |
| `support` | Correo de soporte | `'soporte@rifas-ejemplo.com'` |
| `conalot` | Nº de autorización CONALOT | `'CNL-AUT-RF-2026-075423'` |
| `prize`, `prizeExtra` | 1er premio y su extra | `'Toyota Agya 2026'`, `'+ 3.000 en la guantera'` |
| `second`, `third` | 2do y 3er premio | `'2.000 Bendiciones'` |
| `price` | Precio por boleto en Bs (entero) | `4799` |
| `rate` | Tasa BCV (Bs por $) | `881.88` |
| `total` | Cantidad de números: 100, 1000 o 10000 | `10000` |
| `soldPct` | % vendido | `76` |
| `date`, `time` | Fecha y hora del 1er premio (Venezuela) | `'2026-10-22'`, `'22:00'` |
| `times2` | Horas del 2do y 3er premio | `['4:00 PM', '1:00 PM']` |
| `lottery` | Lotería con la que juega | `'Supergana'` |
| `serviceFee` | Comisión de servicio de la plataforma en %, incluida en el total (0 = sin comisión) | `0` |
| `accent`, `accentInk` | Color de la marca (`coral`, `oro`, `rojo`, `verde`, `azul`, `naranja`, `turquesa` o un hex) y color del texto encima | `'oro'` |
| `images` | Fotos del premio, hasta 10; la primera es la portada | `['img/flyer.jpg', …]` |
| `fx` | Unidades de otras monedas por 1 $ (COP, PEN…) | `{ COP: 4150 }` |
| `paymentMethods` | Métodos de pago del rifero, sin límite, con la forma del API de LottoGE más `icon` y `color`. Los campos están explicados en `config.js` | `[{ id, name, icon, … }]` |
| `companyId`, `raffleId` | UUID del rifero y id de la rifa en LottoGE, para la conexión real | `''` |

El precio en dólares, las cifras del número (2, 3 o 4), las series del tablero, la cuenta regresiva y los textos de las preguntas frecuentes salen de estos datos.

## Flujo del comprador

1. **Página:**
   - Fotos del premio en carrusel, con flechas, puntos y "Ver en grande".
   - Premio, fecha y precio en Bs y $.
   - Cuenta regresiva, % vendido y los tres premios.
2. **Selecciona tus boletos:**
   - **Al azar:** cantidades rápidas 1/2/5/10/20/50 (5 marcado como Popular), más − y +.
   - **Manual:** se ocultan las cantidades rápidas y se abre el tablero de números. Tiene buscador, botones +1/+5/+10 al azar y series; los vendidos salen tachados.
3. **Participar → Tus datos** (en el mismo recuadro):
   - Cédula V/E/J, que llena nombre, teléfono y correo.
   - Estado (obligatorio).
   - Correo (obligatorio: ahí llegan los números).
4. **Continuar → Pago:**
   - Los métodos de pago del rifero, cada uno con su icono y su color (18 iconos en `fronts/_comun/metodos-pago.js`). Con más de 4 se agrupan: en bolívares, en dólares y cripto, y desde otros países. Un método con `minTickets` sale bloqueado si no se llega al mínimo; uno con `commissionRate` suma su comisión al monto.
   - Datos para pagar, con botón de copiar en cada fila y uno para copiar todo.
   - Referencia del pago.
   - Comprobante (foto, captura o PDF de hasta 10 MB), **obligatorio** en todo método manual (`requireReceipt`): sin él no se puede confirmar. Pago Móvil al instante (`isOnline`) no lo pide, porque se verifica con el banco.
5. **Resultado:**
   - **¡Listo!** — Pago Móvil al instante aprobado: los números se revelan y se envían al correo.
   - **Compra rechazada** — Pago Móvil al instante que el banco no encuentra. Muestra el motivo y lleva de vuelta a "Corregir datos del pago".
   - **Boletos reservados** — Pago Móvil manual, Binance o Zelle: queda en revisión del rifero. Si eligió sus números los ve "por confirmar"; si compró al azar no ve números, porque se asignan al aprobar y le llegan por correo.
6. **Mis boletos:** consulta por cédula, con órdenes pagadas y por verificar.

Las notificaciones son **solo por correo**.

Además: modo claro y oscuro, foco visible, textos alternativos y respeto a `prefers-reduced-motion`.

## Qué está simulado y qué conectar a la API

Todo lo que habla con el servidor pasa por `window.LOTTOGE_CONEXION` y `window.LOTTOGE_ANTES` (bloque "puntos de conexión con la plataforma" del script principal). Sin ellos, la página usa su demostración. `fronts/_comun/conexion.ejemplo.js` es la conexión real de ejemplo contra `api.lottoge.net`; la *Guía de implementación* (en `fronts/_comun/docs/`) explica cada punto.

| En la demo | En producción | Punto de conexión |
| --- | --- | --- |
| Datos de `config.js` | Rifa, tasa BCV, comisión de servicio y métodos de pago del API | `LOTTOGE_ANTES` |
| Búsqueda por cédula con personas de ejemplo (`PEOPLE`, `personFor`) | `GET /platform/client-lookup/{cedula}` | `buscarCliente` |
| Números vendidos calculados (`demoTaken`) | Números vendidos reales | `numeroVendido` |
| Pago: referencia que termina en 0 = rechazada; los manuales quedan reservados | Crear la orden, verificar con la pasarela o subir el comprobante | `enviarPago` |
| Mis boletos con órdenes de ejemplo | Órdenes por cédula | `misBoletos` |
| % vendido, "en línea", "viendo" y compras en vivo que se mueven solos (`live`, `TICK`) | Datos reales o quitarlos | `paintLive`, `tickerHTML` |
| Top compradores de ejemplo (`TOP`) | Ranking real | `appHTML` |
| "Te enviamos tus números a tu correo" | Envío real del correo | servidor |

**Seguridad:**
- El total **siempre** se recalcula en el servidor con el precio real del sorteo; nunca se confía en el monto que manda el navegador.
- El servidor valida que la cantidad sea un entero dentro de los límites y que los números elegidos sigan libres al momento de pagar.

## Datos de ejemplo que hay que cambiar

- El rifero "Rifas La Bendición", el correo de soporte y el nº CONALOT.
- Las cuentas de pago y la tasa BCV.
- Los compradores, el ranking y las cédulas de prueba.
- Las horas del 2do y 3er premio.
- Las fotos: el flyer del Toyota Agya 2026 y las de ejemplo son material de prueba aportado por el cliente.
