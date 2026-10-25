# Guía de implementación: página principal

La página son dos archivos que van juntos:

- **`index.html`:** la página, con HTML, CSS y JavaScript en un solo archivo. No usa librerías. Solo carga la fuente **Plus Jakarta Sans** de Google Fonts; si no hay conexión, usa Segoe UI o Arial.
- **`config.js`:** todo lo que puede cambiar: WhatsApp, planes y precios, rifas de prueba, correo de denuncias y direcciones de la API. Se edita sin tocar `index.html`.

## Probarla en localhost

1. Pon `index.html` y `config.js` en la misma carpeta.
2. En una terminal, dentro de esa carpeta, ejecuta `npx serve .` o `python3 -m http.server 8080`.
3. Abre `http://localhost:8080` (o la dirección que muestre `serve`).

Mientras las direcciones de la API en `config.js` estén vacías, la página funciona en **modo prueba**: el login acepta cualquier correo con una contraseña de 6 caracteres o más, las rifas son de prueba y la denuncia no se envía. Cuando les guste cómo se ve, se conecta la API y se sube a la plataforma real.

## Vistas y rutas

La página cambia de vista con el ancla de la dirección (#login, #inicio, #rifas, #denuncias). En la plataforma conviene usar rutas reales:

| Vista | Ancla | Ruta sugerida | Qué tiene |
| --- | --- | --- | --- |
| Inicio de sesión | #login | /auth | Fondo animado (bolitas de lotería y boletos en un canvas), correo, contraseña con botón para verla, "Recordarme", recuperar contraseña y enlace a WhatsApp para quien no tiene cuenta. |
| Inicio | #inicio | / | Barra, portada con la maquinita de boletos, "Qué hacemos", planes, aviso de denuncias, cierre con WhatsApp y pie. |
| Rifas activas | #rifas | /raffles | Buscador, filtros por cifras (3, 4 o 6) y tarjetas de rifas. Si no hay rifas, muestra un aviso. |
| Denuncias | #denuncias | /denuncias | Formulario con motivo, rifa u operador, Instagram, descripción, comprobante, opción anónima y correo. Al enviar muestra un número de referencia. |

La página abre en el inicio, y el login se abre desde "Iniciar sesión".

## Qué se cambia en config.js

| Campo | Para qué | Valor actual |
| --- | --- | --- |
| whatsapp.numero | Número al que llevan todos los botones de WhatsApp, con código de país y solo dígitos | 584121665356 |
| whatsapp.mostrar | Cómo se ve escrito el número en la página | 0412-166-5356 |
| whatsapp.mensaje | Mensaje que llega escrito | Hola, quiero más información acerca de LottoGE |
| denuncias.correo | Correo de Sevenlot que recibe las denuncias | Vacío: **lo coloca el equipo de LottoGE** |
| api.login | Dirección para iniciar sesión | Vacío (modo prueba) |
| api.recuperar | Dirección para recuperar la contraseña | Vacío (modo prueba) |
| api.rifas | Dirección de las rifas activas | Vacío (muestra rifasDePrueba) |
| api.denuncias | Dirección para enviar denuncias | Vacío (envío simulado) |
| planes | Lista de planes: nombre, precio, nota del precio, mantenimiento, lo que incluye, si va destacado, insignia y mensaje propio de WhatsApp (opcional) | Free, Basic y Pro |
| planesNota | Texto debajo de los planes | Todos incluyen rifas sin límite… |
| rifasDePrueba | Rifas que se ven mientras api.rifas esté vacío | Una "Rifa de prueba" |

**Precios:** se cambian en `planes`. Se puede agregar, quitar o reordenar planes; la página los dibuja tal como estén en la lista.

**Cambios desde el Drive:** Sevenlot puede editar `config.js` en el Drive y volver a enviarlo. LottoGE solo tiene que reemplazar el archivo.

## Denuncias: quién las recibe

Las denuncias llegan a la plataforma de LottoGE por `api.denuncias`. Desde ahí se reenvían a **Sevenlot**:

1. En `config.js`, en `denuncias.correo`, **hay que poner el correo de Sevenlot**. El equipo de LottoGE lo coloca.
2. La página envía ese correo en el campo `notify` junto con la denuncia.
3. El servidor guarda la denuncia y le manda una copia a ese correo, con el número de referencia y el archivo adjunto.

## Dos formas de implementarla

### Opción rápida: página estática

1. Copia `index.html` y `config.js` al servidor o al `public/` del proyecto.
2. Sírvela en `/` (y, si quieres, también en `/auth`, `/raffles` y `/denuncias`, con el ancla correspondiente).
3. Escribe en `config.js` las direcciones de la API.

Si la API está en otro dominio, hay que permitirlo con CORS y cookies (`credentials: 'include'`). Lo más simple es servir la página y la API desde el mismo dominio.

### Opción recomendada: pasarla a React

El sitio actual es React con Vite. `config.js` pasa a ser un módulo de configuración (por ejemplo `siteConfig.ts`) con los mismos campos. Sugerencia de componentes:

- **Header:** logo, enlaces y "Hablar con un asesor". En el teléfono tiene un menú desplegable. Con sesión iniciada muestra las iniciales, "Hola, {nombre}" y "Salir".
- **LoginPage:**
  - **Fondo:** LoginBackground (canvas).
  - **Formularios:** LoginForm y ForgotPasswordForm.
  - **Al entrar:** Confetti.
- **HomePage:**
  - **Portada:** Hero con TicketMachine, el SVG animado de la maquinita.
  - **Secciones:** Features, Plans (lee los planes de la configuración), ReportBanner y CallToAction.
- **RafflesPage:**
  - **Controles:** SearchBox y DigitFilter.
  - **Lista:** RaffleCard y EmptyState.
- **ReportPage:**
  - **Formulario:** ReportForm.
  - **Al enviar:** ReportDone.
  - **Lateral:** la columna de "Qué pasa después".
- **Footer** y **Toast**.

**Reglas para el porte:**

- **Estilos:** copia el bloque `:root` (también está en `03 Recursos/tokens.css`) y respeta los nombres de los colores. Así el diseño queda igual.
- **Animaciones:** son CSS y un poco de JavaScript.
  - Las de la maquinita son @keyframes sobre el SVG.
  - El fondo del login es un requestAnimationFrame sobre un canvas; está en la función `frame()`.
  - El confeti está en `burst()`.
  - Todas se apagan con prefers-reduced-motion; mantenlo.
- **Aparición al bajar:** solo se ocultan los bloques que empiezan fuera de la primera pantalla. Nada importante debe quedar invisible si el JavaScript falla.

## Qué ya está conectado y qué falta

La página ya trae el código que llama a la API: solo hay que escribir las direcciones en `config.js`. El formato de cada llamada está en **04 Herramientas / Contrato de API**.

| Pantalla | Sin dirección (modo prueba) | Con dirección |
| --- | --- | --- |
| Login | Acepta cualquier correo y contraseña de 6 caracteres o más | Envía correo y contraseña a api.login. Muestra "Correo o contraseña incorrectos" si responde 401 y lleva a `redirect` si la respuesta lo trae. |
| Recuperar contraseña | No envía nada | Envía el correo a api.recuperar y siempre muestra el mismo mensaje |
| Rifas activas | Muestra rifasDePrueba | Pide las rifas a api.rifas y "Ver rifa" abre la `url` de cada una |
| Denuncias | Envío simulado; la referencia sale del navegador | Envía la denuncia con su archivo a api.denuncias y muestra la referencia que devuelve el servidor |

**Lo que sigue siendo trabajo del backend:**
- la sesión real (cookie segura);
- el panel al que se llega después del login;
- guardar las denuncias y reenviarlas al correo de Sevenlot.

## Cambios frente a la página actual

- **Nombre:** la marca es **LottoGE**, no "LottoX", en el logo, el `<title>`, los metadatos og: y el pie.
- **Sin ventana emergente:** se quitó la de "Precio exclusivo", que tapaba la portada al entrar.
- **Sin datos inventados:** se quitaron las cifras, los casos de éxito y los testimonios.
- **Idioma:** `lang="es-VE"` en lugar de `lang="en"`.
- **Consola:** quitar el script que apaga console.log, console.error, etc. en producción. Esconde errores reales.
- **Versión:** no mostrar "v1.0.0 · Build 187" al pie de la página pública.

## WhatsApp

Todos los botones de WhatsApp abren el chat de Sevenlot, **0412-166-5356**, con el mensaje "Hola, quiero más información acerca de LottoGE". Son estos:
- Hablar con un asesor;
- Solicitar, en cada plan;
- ¿Aún no tienes cuenta?, en el login;
- Escribir por WhatsApp;
- Abrir WhatsApp, en Denuncias.

El número y el mensaje se cambian en `config.js`. Si un plan necesita un mensaje propio, se escribe en el campo `mensaje` de ese plan.

**WhatsApp automatizado:** sale en los planes Basic y Pro. Todavía no está funcionando, pero se deja porque viene en camino.

## Accesibilidad y teléfono

- **Teclado:** todo se puede usar con teclado y el foco se ve.
- **Formularios:** los campos tienen su etiqueta y los errores salen debajo de cada uno.
- **Teléfono:** en 390 px no hay desplazamiento lateral, y la barra se cambia por un menú.
- **Movimiento reducido:** con prefers-reduced-motion, las animaciones se detienen y el contenido sigue visible.
