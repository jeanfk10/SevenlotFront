# Página principal sencilla — LottoGE

Propuesta para la página principal de **lottoge.net**, la que les presenta la plataforma a los operadores (riferos). Tiene fondo blanco, tonos cálidos y formas redondeadas. A la derecha hay una maquinita que imprime boletos, solo como ilustración.

> **Estado: propuesta para aprobación.** Es una página estática hecha en HTML y CSS. Cuando llegue el código de la plataforma (React), hay que pasarla a sus componentes.

## Qué hay en esta carpeta

```
sencilla/
├── front/
│   └── index.html    la página, autocontenida (la maquinita es un SVG dentro del archivo)
├── vista-previa/
│   └── index.html    la misma página en computadora y en teléfono, una al lado de la otra
└── README.md
```

Para verla, abre `vista-previa/index.html` o `front/index.html` en el navegador. Solo carga la fuente *Plus Jakarta Sans* de Google Fonts. Si no hay conexión, usa Segoe UI o Arial.

## Secciones

1. **Barra:** logo; enlaces a Qué hacemos, Planes e Iniciar sesión; botón "Hablar con un asesor".
2. **Portada:** "Vende tus rifas en línea" con una frase de apoyo y los botones "Hablar con un asesor" y "Ver planes". Debajo van tres etiquetas: Legal ante CONALOT, Bs y $ con tasa BCV y Soporte 24/7. A la derecha está la maquinita, que imprime un boleto en bucle.
3. **Qué hacemos:** cuatro puntos con su color.
   - Tu página, tu marca.
   - Pagos verificados.
   - Boletos automáticos.
   - Todo en un panel.
4. **Planes:** Free, Basic y Pro, con precio, mantenimiento y lo principal de cada uno.
5. **Cierre:** "¿Listo para empezar?" con el botón de WhatsApp.
6. **Pie:** Instagram, Términos y Privacidad.

## Cambios frente a la página actual

- **Nombre:** se usa **LottoGE**, no "LottoX".
- **Sin registro directo:** el registro de operadores lo hace el equipo comercial. Por eso todos los botones abren WhatsApp con un mensaje ya escrito:
  - "Hablar con un asesor" y "Escribir por WhatsApp": *"Hola, quiero información sobre LottoGE"*.
  - "Solicitar" en cada plan: *"Hola, me interesa el Plan Free/Basic/Pro de LottoGE"*.
  - "Iniciar sesión" sigue llevando a `lottoge.net/auth`, para los operadores que ya tienen cuenta.
- **Sin datos inventados:** se quitaron las cifras (+350 loteros, $2M+ en premios, etc.), los casos de éxito y los testimonios.
- **Sin ventana emergente:** se quitó la de "Precio exclusivo" que tapaba la portada.

## Datos que hay que confirmar

- **Número de WhatsApp:** `+58 422 738 3647`, el mismo de la preventa en la página actual.
- **Precios:** se copiaron de la página actual.
  - Free: $0 + $50 al mes de mantenimiento.
  - Basic: REF 799 + IVA + $50 al mes.
  - Pro: REF 1.199 + IVA + $50 al mes.
- **"WhatsApp automatizado" en Basic y Pro:** el plan lo ofrece, pero los fronts de compra envían los números al comprador solo por correo. Hay que confirmar qué se promete.
- **"Pago Móvil verificado al instante":** en la página actual aparece solo en el Plan Pro, como "Pasarela integrada de Pagos Inmediata".
- **Enlaces:** Términos y Privacidad apuntan a `lottoge.net/terms` y `lottoge.net/privacy`.
