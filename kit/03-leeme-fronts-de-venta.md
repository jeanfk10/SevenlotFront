# Fronts de venta

Aquí van las páginas de compra: la que ve el comprador cuando entra al enlace de una rifa. Hay una carpeta por plantilla, y todas tienen el mismo flujo y la misma configuración. Solo cambia el diseño.

> **Espacio reservado:** Sevenlot cargará en estas carpetas los archivos de cada plantilla.

## Qué trae cada carpeta

- **index.html:** la página de compra. No se edita a mano.
- **config.js:** los datos de la rifa; es lo único que cambia de un rifero a otro.
- **img/:** fotos del premio; la primera es la portada.
- **README:** uso, configuración y qué conectar a la API.

## Plantillas

| Plantilla | Cómo se ve |
| --- | --- |
| Minimalista | La base. Neutra, para que el flyer y el color del rifero sean lo que destaque. |
| Vibrante | El color del rifero ocupa bloques enteros, con letras condensadas y botones redondos. |
| Neón | Noche en grafito y plata, con rayos detrás del premio. El único color es el del rifero. |
| Pop | Estilo sticker en tonos arena y salvia, con bordes gruesos y cintas de precio. |
| Experimental | Las fotos del premio a pantalla completa, como una historia de Instagram, con una hoja de pestañas debajo. |

## Cómo se instala

1. Cada rifa se sirve como una carpeta estática, por ejemplo `lottoge.net/<rifero>/<rifa>`.
2. La plataforma escribe `config.js` con los datos del sorteo, o lo cambia por una llamada a la API (`GET /api/raffles/{id}`).
3. Las fotos van en `img/`, o como direcciones completas en `images` dentro de `config.js`.
4. Los pagos, la búsqueda por cédula, los números vendidos y los correos se conectan según el **Contrato de API** (`04 Herramientas`).

## Campos de `config.js`

| Campo | Qué es | Ejemplo |
| --- | --- | --- |
| `rifero` | Nombre de la marca del rifero | `'Rifas La Bendición'` |
| `handle` | Instagram donde se transmite el sorteo | `'@rifaslabendicion'` |
| `support` | Correo de soporte del rifero | `'soporte@rifas-ejemplo.com'` |
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
| `accent`, `accentInk` | Color de la marca (`oro`, `rojo`, `verde`, `azul`, `naranja`, `turquesa` o un hex) y color del texto encima | `'oro'` |
| `images` | Fotos del premio, hasta 10; la primera es la portada | `['img/flyer.jpg']` |

## Reglas del flujo de compra

- **Pago Móvil al instante:** se verifica con la pasarela (R4) y asigna los números de una vez.
- **Pago Móvil manual, Binance y Zelle:** quedan como **boletos reservados** hasta que el rifero los apruebe. Si el comprador compró al azar, no ve números hasta la aprobación.
- **Notificaciones:** al comprador le llegan **solo por correo**.
- **Total:** se recalcula siempre en el servidor con el precio real. El servidor también comprueba que los números elegidos sigan libres.
- **Datos de ejemplo:** las cuentas de pago, los compradores, el ranking y las cédulas de prueba que traen las plantillas se cambian por los reales.
