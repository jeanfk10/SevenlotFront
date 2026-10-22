# Front Estándar — LottoGE

La plantilla con la marca de LottoGE. Usa los mismos colores, letra y formas que la página principal de lottoge.net (`landing/sencilla`):

- **Colores:**
  - fondo blanco con grises cálidos (`#f6f5f2`, `#ecebe6`);
  - letras azul marino (`#1d2340`);
  - coral (`#ff5a36`) para los botones;
  - de apoyo, amarillo (`#ffc23c`), verde agua (`#12a594`) y azul (`#4f7cff`).
- **Letra:** Plus Jakarta Sans.
- **Formas:** tarjetas redondeadas y botones tipo píldora que se elevan un poco al pasar el mouse.

Detrás de las fotos del premio se mueve una mancha amarilla, como la de la maquinita de boletos de la página principal. Cada color cumple una función:

- **Coral:** las acciones (comprar, participar, confirmar) y el "¡Listo!".
- **Azul marino:** el 1er premio, el pie de página y los métodos de pago elegidos.
- **Amarillo:** el extra del premio, "Popular", el 1.º del top de compradores y los pagos por revisar.
- **Verde agua:** la barra de vendidos, "Autorizada por CONALOT" y lo confirmado.
- **Azul:** el borde de los campos al escribir.

**Color del rifero:** el color de los botones y del boleto sigue siendo el color de marca del rifero (`accent` en `config.js`). En esta plantilla viene por defecto `coral`, el de LottoGE, que se agregó a la lista de colores del panel. Si el rifero elige otro, los botones toman ese color y el resto de la marca LottoGE se mantiene.

**Flujo y lógica:** idénticos a la plantilla [minimalista](../minimalista/README.md):
- compra en el mismo recuadro (boletos, datos y pago);
- modo al azar o manual con tablero de números;
- autocompletado por cédula;
- 4 métodos de pago con copiar todos los datos;
- resultados aprobado, reservado y rechazado;
- entrega solo por correo;
- "Mis boletos", carrusel de fotos y modo claro y oscuro (el oscuro, en azul marino profundo).

**Recomendada para:** riferos que quieren que su página se vea como parte de LottoGE, o que todavía no tienen una marca propia.

## Teléfono y computadora

La página se adapta sola: en un teléfono (Android, iPhone u otro), la vista móvil; en una computadora, la de escritorio. En computadora, la mancha amarilla crece detrás de las fotos y el recuadro de compra flota sobre una sombra suave. En la vista previa, el botón flotante **Ver en iPhone / Mac** muestra las mismas pantallas en los dos. Los detalles están en el [README de la minimalista](../minimalista/README.md#teléfono-y-computadora).

## Carpeta

```
estandar/
├── front/            ← lo que se carga en la plataforma (index.html generado, config.js, img/)
├── vista-previa/     todas las pantallas en iPhones o en Macs + panel de configuración en vivo
├── build_front.py    regenera front/index.html desde la vista previa
└── README.md
```

## Uso

1. **Probar:** abre `front/index.html`. Para ver todas las pantallas, abre `vista-previa/index.html`.
2. **Configurar:** edita `front/config.js`. Es el mismo formato en todas las plantillas, así que una rifa cambia de plantilla copiando su `config.js` y sus fotos.
3. **Publicar:** `front/` es una carpeta estática y se sube tal cual.
4. **Cambiar el diseño:** edita `vista-previa/index.html` y ejecuta `python3 build_front.py`.
   - La capa de diseño de esta plantilla está antes de las reglas de computadora ("Computer") del `<style>`, y sus ajustes para computadora, al final.
   - Las etiquetas "Autorizada por CONALOT" y "Tus números llegan por correo" se agregan en la función `themeFx` del `<script>`.

Las animaciones respetan `prefers-reduced-motion`. En la vista previa, las animaciones en bucle se pausan cuando la pantalla no está a la vista.

Para los campos de `config.js`, lo que está simulado y qué conectar a la API, ver el [README de la minimalista](../minimalista/README.md).
