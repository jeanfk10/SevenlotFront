# Front Neón — LottoGE

Una noche sobria en grafito, plata y blanco cálido; el único color es el del rifero. Detrás de la página se mueve una aurora suave y detrás del premio giran rayos tenues. El título tiene un brillo leve en el color del rifero, sin parpadeo. Dos cintas diagonales corren con el premio, el precio y la fecha. El recuadro de compra tiene un borde fino que gira en el color del rifero. El 1er premio tiene brillo metálico y el botón principal un destello que lo cruza. La cuenta regresiva da vuelta cada segundo y la barra de vendidos tiene rayas en movimiento.

**Flujo y lógica:** idénticos a la plantilla [minimalista](../minimalista/README.md):
- compra en el mismo recuadro (boletos, datos y pago);
- modo al azar o manual con tablero de números;
- autocompletado por cédula;
- 4 métodos de pago con copiar todos los datos;
- resultados aprobado, reservado y rechazado;
- entrega solo por correo;
- "Mis boletos", carrusel de fotos y modo claro y oscuro.

Solo cambian el diseño y las animaciones.

- **Tipografía:** Unbounded para títulos y montos, Archivo para el texto (Google Fonts).
- **Recomendada para:** rifas de carros, motos y efectivo con flyers llamativos; públicos que compran desde redes, de noche.

## Carpeta

```
neon/
├── front/            ← lo que se carga en la plataforma (index.html generado, config.js, img/)
├── vista-previa/     todas las pantallas en iPhones + panel de configuración en vivo
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

Las animaciones respetan `prefers-reduced-motion`. En la vista previa, los adornos en bucle se pausan cuando el teléfono no está en pantalla.

Para los campos de `config.js`, lo que está simulado y qué conectar a la API, ver el [README de la minimalista](../minimalista/README.md).
