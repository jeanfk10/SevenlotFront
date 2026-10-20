# SevenlotFront

Fronts de compra de rifas para la plataforma **LottoGE** (Venezuela). Cada front es una variante de diseño del mismo flujo de compra, configurable por rifero.

## Estructura

- `fronts/<nombre>/` — un front por carpeta. Hoy: `fronts/minimalista/`.
  - `vista-previa/index.html` — fuente del diseño y la lógica, mostrada dentro de iPhones y con panel de configuración.
  - `front/` — lo exportable: `index.html` (generado), `config.js` (datos de la rifa) e `img/`.
  - `build_front.py` — regenera `front/index.html` desde la vista previa.
  - `README.md` — uso, configuración y qué conectar a la API.
- `rifa-dubai/` — primer prototipo, temático (viaje a Dubái). Solo como referencia.

## Regla del usuario: cuando un front queda aprobado

Cuando el usuario diga que un front "está bien" o lo apruebe, se guarda **siempre en los dos lugares**:

1. **GitHub**, en este repositorio: una carpeta `fronts/<nombre>/` con la misma estructura que `fronts/minimalista/` (vista previa, `front/` exportable, `build_front.py`, README). Se hace commit y push.
2. **Su escritorio**: una carpeta con todo lo necesario para exportarlo y cargarlo en la plataforma (`front/`, README). Si la sesión corre en la nube y no tiene acceso a su computadora, se le entrega un `.zip` con esa carpeta para que la guarde en el escritorio, y se le dice claramente.

## Convenciones

- Español de Venezuela, tono cercano. Montos en Bs y $, con la tasa BCV.
- Las notificaciones al comprador van **solo por correo** (no WhatsApp).
- Pago Móvil al instante se verifica con la pasarela (R4) y asigna los números de una vez. Los métodos manuales (Pago Móvil manual, Binance, Zelle) quedan como **boletos reservados** hasta que el rifero los apruebe. Si el comprador compró al azar, no ve números hasta la aprobación.
- Los datos de ejemplo se marcan como tales; no se inventan clientes ni estadísticas reales.
