# SevenlotFront

Fronts de compra de rifas para la plataforma **LottoGE** (Venezuela). Cada front es una variante de diseño del mismo flujo de compra, configurable por rifero.

## Estructura

- `fronts/<nombre>/` — un front por carpeta. Hoy: `minimalista` (la base), `estandar` (con la marca LottoGE), `vibrante`, `neon`, `pop` y `experimental`. Todas comparten la misma lógica y el mismo `config.js`; las demás son la minimalista con una capa de diseño al final del `<style>` de su vista previa y, si la tienen, sus adornos o su reorganización en la función `fx` del bloque `<script data-part="tema">`. La `experimental` reubica las secciones en una hoja con pestañas. El script principal y el bloque `<script data-part="pagos">` son idénticos en las seis: un cambio de lógica se aplica en todas.
  - `vista-previa/index.html` — fuente del diseño y la lógica, mostrada dentro de iPhones o de Macs (botón "Ver en") y con panel de configuración.
  - `front/` — lo exportable: `index.html` (generado), `config.js` (datos de la rifa) e `img/`.
  - `build_front.py` — regenera `front/index.html` desde la vista previa.
  - `README.md` — uso, configuración y qué conectar a la API.
- `fronts/_comun/` — lo compartido: `metodos-pago.js` (catálogo de métodos de pago e iconos; es la fuente del bloque `pagos`), `conexion.ejemplo.js` (conexión real de ejemplo con api.lottoge.net), `iconos-pago.html` y `docs/` (LÉEME y guía de implementación del kit, en HTML para subir como Google Docs).
- `build_kit.py` — arma `kit/` (lo que va al Drive "Sevenlot fronts": `02 Fronts de venta/` con `comun/` y una carpeta por plantilla, y `03 Recursos/iconos-pago/`). Comprueba que lo común sea idéntico en las seis.
- `rifa-dubai/` — primer prototipo, temático (viaje a Dubái). Solo como referencia.

## Regla del usuario: cuando un front queda aprobado

Cuando el usuario diga que un front "está bien" o lo apruebe, se guarda **siempre en los dos lugares**:

1. **GitHub**, en este repositorio: una carpeta `fronts/<nombre>/` con la misma estructura que `fronts/minimalista/` (vista previa, `front/` exportable, `build_front.py`, README). Se hace commit y push.
2. **Su escritorio**: una carpeta con todo lo necesario para exportarlo y cargarlo en la plataforma (`front/`, README). Si la sesión corre en la nube y no tiene acceso a su computadora, se le entrega un `.zip` con esa carpeta para que la guarde en el escritorio, y se le dice claramente.

## Convenciones

- Español de Venezuela, tono cercano. Montos en Bs y $, con la tasa BCV.
- Las notificaciones al comprador van **solo por correo** (no WhatsApp).
- Métodos de pago: sin límite, cada uno con un icono del catálogo (`icon`) y su color; la forma es la del API real (`payment-methods/active`). Un mismo icono sirve para varios métodos.
- Pago Móvil al instante se verifica con la pasarela (R4) y asigna los números de una vez. Los métodos manuales (Pago Móvil manual, Binance, Zelle) quedan como **boletos reservados** hasta que el rifero los apruebe. Si el comprador compró al azar, no ve números hasta la aprobación.
- Todo front es adaptable: vista móvil en teléfonos (Android, iPhone, etc.) y vista de escritorio en computadoras (clase `desk`, decidida en `App.setupDesk`). Al cambiar un diseño, revisar las dos.
- Tonos neutros en las plantillas; el color fuerte lo pone el rifero (su color de marca). La `vibrante` se queda como está.
- La `estandar` usa la marca de LottoGE (la de `landing/sencilla`): blanco, azul marino `#1d2340`, coral `#ff5a36`, amarillo, verde agua y azul de apoyo, Plus Jakarta Sans. Su color de rifero por defecto es `coral`.
- Los datos de ejemplo se marcan como tales; no se inventan clientes ni estadísticas reales.
