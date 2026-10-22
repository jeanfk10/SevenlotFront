# Front Experimental — LottoGE

La misma rifa, ordenada de otra forma. Al entrar, las fotos del premio ocupan toda la pantalla como una historia de Instagram: avanzan solas, con barras arriba que marcan cuál se ve, y se cambian tocando los lados de la foto. Encima van el premio, la fecha, el precio y el botón de compra. Debajo sube una hoja con tres partes:

- **Cifras a la vista:** el porcentaje vendido y, debajo, la cuenta regresiva, completos y sin deslizar nada.
- **Pestañas fijas:** Comprar, Premios e Info, que se quedan arriba al bajar.
- **Comprar:** la cantidad es la protagonista, con un número grande y botones − y +. Las cantidades rápidas son una fila de píldoras.
- **Premios:** cada premio es un escalón que sale de lado. El 1.º va completo y en el color del rifero; el 2.º y el 3.º son más cortos. Debajo va el top de compradores.
- **Info:** el organizador con su permiso CONALOT, cómo participar y las preguntas frecuentes.

En el resultado aprobado, el boleto se monta sobre una franja oscura. Los tonos son neutros (piedra y grafito); el único color es el del rifero.

**Flujo y lógica:** idénticos a la plantilla [minimalista](../minimalista/README.md):
- compra en el mismo recuadro (boletos, datos y pago);
- modo al azar o manual con tablero de números;
- autocompletado por cédula;
- 4 métodos de pago con copiar todos los datos;
- resultados aprobado, reservado y rechazado;
- entrega solo por correo;
- "Mis boletos", carrusel de fotos y modo claro y oscuro.

El botón "Comprar boletos" (y la barra flotante) abre la pestaña Comprar y baja hasta el recuadro.

- **Tipografía:** Archivo (Google Fonts), la misma familia de la vibrante: angosta en títulos y montos, normal en el texto.
- **Recomendada para:** riferos que venden por Instagram y TikTok y quieren que la página se sienta como una app.

## Teléfono y computadora

La página se adapta sola: en un teléfono (Android, iPhone u otro), la vista móvil; en una computadora, la de escritorio. En computadora, la historia de fotos se queda fija a la izquierda y la hoja con las cifras y las pestañas baja a la derecha. En la vista previa, el botón flotante **Ver en iPhone / Mac** muestra las mismas pantallas en los dos. Los detalles están en el [README de la minimalista](../minimalista/README.md#teléfono-y-computadora).

## Carpeta

```
experimental/
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
   - La reorganización está en la función `themeFx` del `<script>`. Mueve las mismas secciones de la minimalista a la hoja y sus pestañas, y agrega las barras de la historia. `scrollToSec` abre la pestaña de la sección antes de bajar hasta ella.

Las animaciones respetan `prefers-reduced-motion`: con esa preferencia, las fotos no avanzan solas. En la vista previa, las animaciones en bucle se pausan cuando la pantalla no está a la vista.

Para los campos de `config.js`, lo que está simulado y qué conectar a la API, ver el [README de la minimalista](../minimalista/README.md).
