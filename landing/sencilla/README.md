# Página principal sencilla — LottoGE

Propuesta para la página principal de **lottoge.net**, la que les presenta la plataforma a los operadores (riferos). Tiene fondo blanco, tonos cálidos y formas redondeadas. A la derecha hay una maquinita que imprime boletos, solo como ilustración.

> **Estado: prototipo para aprobación.** Es una página estática en HTML, CSS y JavaScript. Las rifas activas son de prueba y el envío de denuncias está simulado. Cuando llegue el código de la plataforma (React), hay que pasarla a sus componentes y conectarla a la API.

## Qué hay en esta carpeta

```
sencilla/
├── vista-previa/
│   └── index.html    fuente: diseño y lógica; es lo que se publica como artefacto
├── front/
│   └── index.html    la página completa para cualquier hosting (generada, no editar a mano)
├── build_front.py    genera front/index.html desde la vista previa
└── README.md
```

- **Probarla:** abre `front/index.html` en el navegador.
- **Cambiar algo:** edita `vista-previa/index.html` y luego ejecuta `python3 build_front.py`.
- **Fuente:** solo carga *Plus Jakarta Sans* de Google Fonts. Si no hay conexión, usa Segoe UI o Arial.

## Vistas

La página tiene cuatro vistas. Se cambia entre ellas con la barra o con el enlace directo: `#login`, `#inicio`, `#rifas` y `#denuncias`.

0. **Iniciar sesión** (`#login`): el artefacto abre aquí para la demo. La página exportable (`front/index.html`) abre en el inicio, porque `build_front.py` cambia la vista inicial `START`.
   - **Fondo animado:** bolitas de lotería y boletos que suben despacio, con manchas de color que se mueven. Todo se desplaza un poco con el mouse.
   - **Formulario:**
     - correo y contraseña, con botón para ver u ocultar la contraseña;
     - "Recordarme";
     - "¿Olvidaste tu contraseña?", que abre el formulario para pedir el enlace (simulado).
   - **Al entrar:** el botón muestra "Entrando…", luego "¡Bienvenido!" con confeti, y te lleva al inicio. Ahí la barra muestra tu nombre (sacado del correo) y el botón "Salir", que te devuelve al login.
   - **Prototipo:** cualquier correo y una contraseña de 6 caracteres o más funcionan. La sesión vive solo en el navegador.
   - **Sin registro:** abajo dice "¿Aún no tienes cuenta? Habla con un asesor", porque el registro lo hace el equipo comercial.
1. **Inicio**
   - **Portada:** "Vende tus rifas en línea", con los botones "Hablar con un asesor" y "Ver rifas activas".
   - **Maquinita:** imprime un boleto con un número nuevo en cada vuelta. Al tocar el botón amarillo imprime otro de inmediato.
   - **Qué hacemos:** cuatro puntos, más un aviso que lleva a Denuncias.
   - **Planes:** Free, Basic y Pro.
   - **Cierre:** con el botón de WhatsApp.
2. **Rifas activas:** buscador, filtros por cifras (3, 4 o 6) y una sola tarjeta de **"Rifa de prueba"**. El resto de la lista queda vacía, con el mensaje "Pronto habrá más rifas aquí".
3. **Denuncias:** formulario con estos campos:
   - Motivo:
     - rifa sin autorización de CONALOT;
     - no entregaron el premio;
     - pago no reconocido;
     - suplantan a un operador;
     - otro.
   - Nombre de la rifa u operador.
   - Enlace o usuario de Instagram (opcional).
   - Qué pasó (mínimo 20 caracteres).
   - Comprobante (opcional).
   - Opción de denuncia anónima.
   - Correo para responder (opcional).

   El formulario valida los campos y, al enviar, muestra un número de referencia (`DN-2026-#####`). Al lado se explica qué pasa después y hay un contacto por WhatsApp para casos urgentes.

**Animaciones:**
- **Maquinita:** sale el boleto, la barra de progreso se llena, la máquina vibra, saltan chispas, flotan boletos y la mancha de fondo cambia de forma.
- **Página:**
  - entrada escalonada de la portada;
  - secciones que aparecen al bajar;
  - tarjetas que se levantan al pasar el ratón;
  - transición entre vistas;
  - menú móvil animado.
- **Formulario de denuncias:** marca de "recibido" que se dibuja sola.

Todo respeta `prefers-reduced-motion`.

## Registro de operadores

No hay registro directo: lo hace el equipo comercial. Todos los botones abren WhatsApp con un mensaje ya escrito:
- "Hablar con un asesor": *"Hola, quiero información sobre LottoGE"*.
- "Solicitar" en cada plan: *"Hola, me interesa el Plan … de LottoGE"*.

"Iniciar sesión" abre la vista de login, para los operadores que ya tienen cuenta.

## Qué conectar a la API

| En el prototipo | En producción | Dónde (en el `<script>`) |
| --- | --- | --- |
| Lista `RAFFLES` con una rifa de prueba | `GET` rifas activas (nombre, operador, cifras, % vendido, fecha de sorteo, enlace) | `RAFFLES`, `renderRaffles` |
| El login acepta cualquier correo y contraseña; la sesión se guarda en `sessionStorage` | Autenticación real (`POST` de inicio de sesión, recuperación de contraseña) y la redirección a cada panel | evento `submit` de `data-login` y `data-forgot-form` |
| "Ver rifa" muestra un aviso | Abrir la página de compra de esa rifa | evento `click` de `data-open` |
| La denuncia no se envía; el número de referencia sale en el navegador | `POST` de la denuncia con el archivo adjunto; el servidor devuelve la referencia | evento `submit` de `data-form` |

## Datos que hay que confirmar

- **Número de WhatsApp:** `+58 422 738 3647`, el mismo de la preventa en la página actual.
- **Precios:** se copiaron de la página actual.
  - Free: $0 + $50 al mes.
  - Basic: REF 799 + IVA + $50 al mes.
  - Pro: REF 1.199 + IVA + $50 al mes.
- **"WhatsApp automatizado" en Basic y Pro:** los fronts de compra envían los números al comprador solo por correo. Hay que confirmar qué se promete.
- **Motivos de denuncia y quién la recibe:** hay que definir qué equipo revisa las denuncias y en qué plazo responde.
