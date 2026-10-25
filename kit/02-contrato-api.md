# Contrato de API (propuesta)

Estos son los datos que necesitan las pantallas. Los nombres de las rutas y los campos son una propuesta: si el backend ya tiene los suyos, se adaptan las llamadas del front y se deja anotado aquí.

Todas las respuestas van en JSON. Las fechas van en ISO 8601 con la hora de Venezuela (`-04:00`). Los montos en bolívares van en enteros o con dos decimales, nunca como texto con formato.

## Página principal

### Iniciar sesión

`POST /api/auth/login`

```json
{ "email": "operador@correo.com", "password": "••••••••", "remember": true }
```

- **200:** `{ "user": { "name": "Yosmer", "role": "operador" }, "redirect": "/panel" }`. La sesión va en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`; no se devuelve el token al JavaScript.
- **401:** `{ "error": "credenciales" }`. El front muestra "Correo o contraseña incorrectos" sin decir cuál de los dos falló.
- **429:** demasiados intentos. Hay que limitar los intentos por correo y por IP.

`POST /api/auth/logout` → **204**.

### Recuperar contraseña

`POST /api/auth/forgot` con `{ "email": "…" }` → **204** siempre, exista o no la cuenta, para no revelar qué correos están registrados.

### Rifas activas

`GET /api/raffles?status=active&q=texto&digits=4`

```json
[
  {
    "id": "rf_123",
    "title": "Toyota Agya 2026",
    "operator": { "name": "Rifas La Bendición", "slug": "rifaslabendicion" },
    "digits": 4,
    "soldPct": 76,
    "drawAt": "2026-10-22T22:00:00-04:00",
    "lottery": "Supergana",
    "price": { "bs": 4799, "usd": 5.44, "rate": 881.88 },
    "cover": "https://…/flyer.jpg",
    "url": "https://lottoge.net/rifaslabendicion/toyota-agya-2026"
  }
]
```

- La tarjeta usa `title`, `operator.name`, `digits`, `soldPct` y `drawAt`. "Ver rifa" lleva a `url`.
- **Lista vacía:** `[]`. El front muestra "Pronto habrá más rifas aquí".

### Denuncias

`POST /api/reports` (multipart/form-data):

| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `reason` | texto | sí | Uno de: rifa sin autorización de CONALOT, no entregaron el premio, pago no reconocido, suplantan a un operador, otro |
| `target` | texto | sí | Nombre de la rifa u operador |
| `link` | texto | no | Enlace o usuario de Instagram |
| `description` | texto | sí | Entre 20 y 1000 caracteres |
| `file` | archivo | no | Imagen o PDF, máximo 5 MB |
| `anonymous` | sí/no | sí | Si es `true`, se ignora `email` |
| `email` | texto | no | Para responder al denunciante |

- **201:** `{ "reference": "DN-2026-04821" }`. El front muestra ese número.
- **422:** `{ "errors": { "campo": "mensaje" } }`. El front pone cada mensaje debajo de su campo.
- **Seguridad:**
  - Revisar el tipo y el tamaño real del archivo en el servidor.
  - Guardar los archivos fuera de la carpeta pública.
  - Poner un captcha o un límite por IP para evitar spam.

## Fronts de venta

Las páginas de compra (ver `02 Fronts de venta`) necesitan esto. Cada plantilla trae en su README dónde se conecta cada punto.

| Pantalla | Llamada | Notas |
| --- | --- | --- |
| Configuración de la rifa | `GET /api/raffles/{id}` → datos de `config.js` | Rifero, premios, precio en Bs, tasa BCV, cantidad de números, fecha, lotería, color de marca y fotos. |
| Números vendidos | `GET /api/raffles/{id}/taken` | Para tachar los vendidos en el tablero. |
| Datos del comprador por cédula | `GET /api/customers?cedula=V18456732` | Llena nombre, teléfono y correo. |
| Crear la orden | `POST /api/orders` | El servidor recalcula el total con el precio real y comprueba que los números elegidos sigan libres. |
| Pago Móvil al instante | `POST /api/orders/{id}/verify` | Se verifica con la pasarela (R4). Si se aprueba, asigna los números y los envía por correo. |
| Pagos manuales (Pago Móvil manual, Binance, Zelle) | `POST /api/orders/{id}/receipt` | Quedan como **boletos reservados** hasta que el rifero apruebe. Si el comprador compró al azar, no ve números hasta la aprobación. |
| Mis boletos | `GET /api/orders?cedula=…` | Órdenes pagadas y por verificar. |

Las notificaciones al comprador van **solo por correo**.
