# Kit de instalación LottoGE

Este kit trae el diseño nuevo de **lottoge.net** listo para implementarlo en la plataforma. Lo preparó Sevenlot. Cada pieza viene como una página HTML que funciona sola, con su archivo de configuración, su guía, el contrato de API propuesto y una lista de verificación.

## Qué hay en el kit

| Carpeta | Qué trae | Para qué |
| --- | --- | --- |
| 01 Página principal | `index.html`, `config.js` y la guía de implementación | La página pública de lottoge.net, con cuatro vistas: inicio de sesión, inicio, rifas activas y denuncias. |
| 02 Fronts de venta | Las páginas de compra de cada plantilla, una carpeta por plantilla | La página donde el comprador elige sus boletos y paga. Cada rifero usa una plantilla con su color y sus fotos. |
| 03 Recursos | `tokens.css` (colores, tipografía y radios), logos en SVG | Para que todo use la misma marca. |
| 04 Herramientas | Contrato de API y lista de verificación | Para conectar los datos reales y revisar que todo quede bien antes de publicar. |

## Cómo empezar

1. Descarga la carpeta `01 Página principal` (`index.html` y `config.js` van juntos) y pruébala en tu computadora, en localhost:
   - En una terminal, dentro de esa carpeta: `npx serve .` o `python3 -m http.server 8080`.
   - Abre `http://localhost:8080` (o la dirección que muestre `serve`).
   - Todo funciona en modo prueba: los datos son de ejemplo y nada se envía.
2. Lee la **Guía de implementación** de la página principal. Explica cada vista, qué ruta lleva, qué se cambia en `config.js` y cómo pasarla a React.
3. Revisa el **Contrato de API** en `04 Herramientas`. Dice qué datos espera cada pantalla y qué hay que enviar.
4. Conecta la API: se escriben sus direcciones en `config.js` y la página deja el modo prueba.
5. Si les gusta cómo se ve y funciona en localhost, súbanla a la plataforma real.
6. Para los fronts de venta, lee el **LÉEME** de `02 Fronts de venta`.
7. Antes de publicar, marca cada punto de la **Lista de verificación**, en `04 Herramientas`.

## Reglas que no cambian

- **La marca es LottoGE.** La versión actual dice "LottoX"; hay que cambiarla en el logo, el título, el pie y los metadatos.
- **No hay registro abierto de operadores.** Lo hace el equipo comercial. Por eso los botones de la página llevan a WhatsApp y no a un formulario de registro.
- **No se publican cifras ni testimonios inventados.** La página actual tiene "+350 loteros", "$2M+ en premios" y testimonios que no son reales; en el diseño nuevo no están y no deben volver.
- **Las notificaciones al comprador van solo por correo.**
- **Montos en Bs y en $, con la tasa BCV.**
- **Lo que cambia se cambia en `config.js`:** número de WhatsApp, precios y planes, correo de denuncias y direcciones de la API. Así no hace falta tocar el código.
- **El total de cada compra se calcula siempre en el servidor.** Nunca se confía en el monto que manda el navegador.

## Código fuente

- **Repositorio:** https://github.com/jeanfk10/SevenlotFront, en las carpetas `landing/` (página principal) y `fronts/` (fronts de venta).

## Contacto

- **Sevenlot (WhatsApp):** 0412-166-5356
- **Responsable en Sevenlot:** (por completar)
- **Responsable en LottoGE:** (por completar)
