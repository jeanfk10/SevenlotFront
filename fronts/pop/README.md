# Front Pop — LottoGE

Estilo sticker en tonos neutros. La página va en franjas arena, salvia, niebla y piedra, y el color fuerte lo pone solo el rifero: la estrella con el precio, la cinta y lo que el comprador elige. Todo lleva bordes negros gruesos con sombra sólida y está un poco inclinado, como stickers pegados. Alrededor flotan círculos, estrellas, anillos y triángulos. Las cintas dicen "¡Compra ya!" con el premio y el precio. Los botones se hunden al tocarlos, y las cantidades y métodos rebotan como gelatina al elegirlos. Las secciones entran con rebote, la cuenta regresiva salta cada segundo y el boleto final cae girando.

**Flujo y lógica:** idénticos a la plantilla [minimalista](../minimalista/README.md):
- compra en el mismo recuadro (boletos, datos y pago);
- modo al azar o manual con tablero de números;
- autocompletado por cédula;
- 4 métodos de pago con copiar todos los datos;
- resultados aprobado, reservado y rechazado;
- entrega solo por correo;
- "Mis boletos", carrusel de fotos y modo claro y oscuro.

Solo cambian el diseño y las animaciones.

- **Tipografía:** Bricolage Grotesque (Google Fonts).
- **Recomendada para:** rifas familiares, combos, electrodomésticos y efectivo; públicos jóvenes; riferos con marca alegre.

## Teléfono y computadora

La página se adapta sola: en un teléfono (Android, iPhone u otro), la vista móvil; en una computadora, la de escritorio. En computadora, una franja arena va detrás de las fotos y el precio. La cuenta regresiva, lo vendido y los premios son tarjetas tipo sticker. En la vista previa, el botón flotante **Ver en iPhone / Mac** muestra las mismas pantallas en los dos. Los detalles están en el [README de la minimalista](../minimalista/README.md#teléfono-y-computadora).

## Carpeta

```
pop/
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
   - La capa de diseño de esta plantilla está al final del `<style>`.
   - Los adornos que se agregan a la página (cintas, figuras, auroras) están en la función `themeFx` del `<script>`.

Las animaciones respetan `prefers-reduced-motion`. En la vista previa, los adornos en bucle se pausan cuando la pantalla no está a la vista.

Para los campos de `config.js`, lo que está simulado y qué conectar a la API, ver el [README de la minimalista](../minimalista/README.md).
