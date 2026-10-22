# SevenlotFront

Fronts de compra de rifas para la plataforma **LottoGE** (Venezuela). Cada front es una variante de diseño del mismo flujo de compra, configurable por rifero.

## Estructura

- `fronts/<nombre>/` — un front por carpeta. Hoy: `minimalista` (la base), `vibrante`, `neon`, `pop` y `experimental`. Todas comparten la misma lógica y el mismo `config.js`; las demás son la minimalista con una capa de diseño al final del `<style>` de su vista previa y, si la tienen, sus adornos o su reorganización en la función `themeFx` del `<script>`. La `experimental` reubica las secciones en una hoja con pestañas.
  - `vista-previa/index.html` — fuente del diseño y la lógica, mostrada dentro de iPhones y con panel de configuración.
  - `front/` — lo exportable: `index.html` (generado), `config.js` (datos de la rifa) e `img/`.
  - `build_front.py` — regenera `front/index.html` desde la vista previa.
  - `README.md` — uso, configuración y qué conectar a la API.
- `landing/<nombre>/` — propuestas para la página principal de lottoge.net (la que presenta la plataforma a los operadores). Hoy: `sencilla`. Cada una tiene `vista-previa/index.html` (fuente y artefacto publicado), `front/index.html` (generado con `build_front.py`) y README. La página tiene cuatro vistas: inicio de sesión (el artefacto abre ahí), inicio, rifas activas (de prueba) y denuncias. El registro de operadores no se hace desde la página: lo hace el equipo comercial, así que los botones llevan a WhatsApp.
- `rifa-dubai/` — primer prototipo, temático (viaje a Dubái). Solo como referencia.

## Regla del usuario: cuando un front queda aprobado

Cuando el usuario diga que un front "está bien" o lo apruebe, se guarda **siempre en los dos lugares**:

1. **GitHub**, en este repositorio: una carpeta `fronts/<nombre>/` con la misma estructura que `fronts/minimalista/` (vista previa, `front/` exportable, `build_front.py`, README). Se hace commit y push.
2. **Su escritorio**: una carpeta con todo lo necesario para exportarlo y cargarlo en la plataforma (`front/`, README). Si la sesión corre en la nube y no tiene acceso a su computadora, se le entrega un `.zip` con esa carpeta para que la guarde en el escritorio, y se le dice claramente.

## Convenciones

- Español de Venezuela, tono cercano. Montos en Bs y $, con la tasa BCV.
- Las notificaciones al comprador van **solo por correo** (no WhatsApp).
- Pago Móvil al instante se verifica con la pasarela (R4) y asigna los números de una vez. Los métodos manuales (Pago Móvil manual, Binance, Zelle) quedan como **boletos reservados** hasta que el rifero los apruebe. Si el comprador compró al azar, no ve números hasta la aprobación.
- Tonos neutros en las plantillas; el color fuerte lo pone el rifero (su color de marca). La `vibrante` se queda como está.
- Los datos de ejemplo se marcan como tales; no se inventan clientes ni estadísticas reales.
