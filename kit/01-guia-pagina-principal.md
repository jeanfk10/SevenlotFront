# Guía de implementación: página principal

`index.html` es una sola página con HTML, CSS y JavaScript en el mismo archivo. No usa librerías. Solo carga la fuente **Plus Jakarta Sans** de Google Fonts; si no hay conexión, usa Segoe UI o Arial.

## Vistas y rutas

La página cambia de vista con el ancla de la dirección (`#login`, `#inicio`, `#rifas`, `#denuncias`). En la plataforma conviene usar rutas reales:

| Vista | Ancla en el prototipo | Ruta sugerida | Qué tiene |
| --- | --- | --- | --- |
| Inicio de sesión | `#login` | `/auth` | Fondo animado (bolitas de lotería y boletos en un `<canvas>`), correo, contraseña con botón para verla, "Recordarme", recuperar contraseña y enlace a WhatsApp para quien no tiene cuenta. |
| Inicio | `#inicio` | `/` | Barra, portada con la maquinita de boletos, "Qué hacemos", planes, aviso de denuncias, cierre con WhatsApp y pie. |
| Rifas activas | `#rifas` | `/raffles` | Buscador, filtros por cifras (3, 4 o 6) y tarjetas de rifas. Si no hay rifas, muestra un aviso. |
| Denuncias | `#denuncias` | `/denuncias` | Formulario con motivo, rifa u operador, Instagram, descripción, comprobante, opción anónima y correo. Al enviar muestra un número de referencia. |

**Vista inicial:** la página abre en el inicio, y el login se abre desde "Iniciar sesión". El prototipo publicado para la demo abre en el login.

## Dos formas de implementarla

### Opción rápida: página estática

1. Copia `index.html` al servidor o al `public/` del proyecto.
2. Sírvela en `/` (y, si quieres, también en `/auth`, `/raffles` y `/denuncias`, con el ancla correspondiente).
3. Conecta los tres puntos de datos del contrato de API: login, rifas activas y denuncias.

Sirve para publicar rápido, pero queda fuera del enrutador de React.

### Opción recomendada: pasarla a React

El sitio actual es React con Vite. Sugerencia de componentes:

- **`<Header>`:** logo, enlaces y "Hablar con un asesor". En el teléfono tiene un menú desplegable. Con sesión iniciada muestra las iniciales, "Hola, {nombre}" y "Salir".
- **`<LoginPage>`:**
  - **Fondo:** `<LoginBackground>` (canvas).
  - **Formularios:** `<LoginForm>` y `<ForgotPasswordForm>`.
  - **Al entrar:** `<Confetti>` al iniciar sesión.
- **`<HomePage>`:**
  - **Portada:** `<Hero>` con `<TicketMachine>`, el SVG animado de la maquinita.
  - **Secciones:** `<Features>`, `<Plans>`, `<ReportBanner>` y `<CallToAction>`.
- **`<RafflesPage>`:**
  - **Controles:** `<SearchBox>` y `<DigitFilter>`.
  - **Lista:** `<RaffleCard>` y `<EmptyState>`.
- **`<ReportPage>`:**
  - **Formulario:** `<ReportForm>`.
  - **Al enviar:** `<ReportDone>`.
  - **Lateral:** la columna de "Qué pasa después".
- **`<Footer>`** y **`<Toast>`**.

**Reglas para el porte:**

- **Estilos:** copia el bloque `:root` (también está en `03 Recursos/tokens.css`) y respeta los nombres de los colores. Así el diseño queda igual.
- **Animaciones:** son CSS y un poco de JavaScript.
  - Las de la maquinita son `@keyframes` sobre el SVG.
  - El fondo del login es un `requestAnimationFrame` sobre un `<canvas>`; está en la función `frame()`.
  - El confeti está en `burst()`.
  - Todas se apagan con `prefers-reduced-motion`; mantenlo.
- **Aparición al bajar:** solo se ocultan los bloques que empiezan fuera de la primera pantalla. Nada importante debe quedar invisible si el JavaScript falla.

## Qué hay que conectar

| En el prototipo | En producción | Dónde está en el código |
| --- | --- | --- |
| El login acepta cualquier correo y contraseña de 6 caracteres o más | Iniciar sesión de verdad y llevar a cada usuario a su panel | evento `submit` de `[data-login]` |
| "¿Olvidaste tu contraseña?" no envía nada | Enviar el enlace de recuperación | evento `submit` de `[data-forgot-form]` |
| La sesión se guarda en `sessionStorage` | La sesión de la plataforma (cookie segura) | `session`, `paintSession()` |
| Rifas activas: una "Rifa de prueba" fija (`RAFFLES`) | Las rifas activas reales | `RAFFLES`, `renderRaffles()` |
| "Ver rifa" muestra un aviso | Abrir la página de compra de esa rifa | clic en `[data-open]` |
| La denuncia no se envía; la referencia sale del navegador | Guardar la denuncia y su archivo; la referencia la da el servidor | evento `submit` de `[data-form]` |

El contrato de cada punto está en **04 Herramientas / Contrato de API**.

## Cambios frente a la página actual

- **Nombre:** la marca es **LottoGE**, no "LottoX", en el logo, el `<title>`, los metadatos `og:` y el pie.
- **Sin ventana emergente:** se quitó la de "Precio exclusivo", que tapaba la portada al entrar. La preventa va como texto en Planes si se quiere mantener.
- **Sin datos inventados:** se quitaron las cifras, los casos de éxito y los testimonios.
- **Idioma:** `lang="es-VE"` en lugar de `lang="en"`.
- **Consola:** quitar el script que apaga `console.log`, `console.error`, etc. en producción. Esconde errores reales; si no se quiere ruido, se quitan los `console.log` del código.
- **Versión:** no mostrar "v1.0.0 · Build 187" al pie de la página pública.

## Botones que llevan a WhatsApp

Todos abren `https://wa.me/584227383647` con un mensaje ya escrito:

| Botón | Mensaje |
| --- | --- |
| Hablar con un asesor, Escribir por WhatsApp | Hola, quiero información sobre LottoGE |
| Solicitar (Plan Free, Basic o Pro) | Hola, me interesa el Plan Free/Basic/Pro de LottoGE |
| ¿Aún no tienes cuenta? (login) | Hola, quiero registrar mi operadora en LottoGE |
| ¿Es urgente? (denuncias) | Hola, quiero hacer una denuncia |

Confirma el número con Sevenlot antes de publicar.

## Accesibilidad y teléfono

- **Teclado:** todo se puede usar con teclado y el foco se ve.
- **Formularios:** los campos tienen su etiqueta y los errores salen debajo de cada uno.
- **Teléfono:** en 390 px no hay desplazamiento lateral, y la barra se cambia por un menú.
- **Movimiento reducido:** con `prefers-reduced-motion`, las animaciones se detienen y el contenido sigue visible.

## Datos por confirmar

- **Número de WhatsApp:** `+58 422 738 3647`, tomado de la página actual.
- **Precios:** se copiaron de la página actual.
  - Free: $0 + $50 al mes.
  - Basic: REF 799 + IVA + $50 al mes.
  - Pro: REF 1.199 + IVA + $50 al mes.
- **"WhatsApp automatizado" en los planes:** los fronts de compra envían los números al comprador solo por correo. Hay que decidir qué se promete.
- **Denuncias:** quién las recibe y en qué plazo se responden.
