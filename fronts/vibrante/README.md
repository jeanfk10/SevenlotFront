# Front Vibrante — LottoGE

La plantilla llamativa. El color del rifero ocupa bloques enteros: la portada, el 1er premio y el pie. Usa letras condensadas en mayúsculas y botones redondos que se hunden al tocarlos. Las urgencias van en rojo-rosado: compras en vivo, la barra de vendidos, "Popular" y "Solo quedan". El recuadro de compra está enmarcado con el color del rifero.

**Flujo y lógica:** idénticos a la plantilla [minimalista](../minimalista/README.md):
- compra en el mismo recuadro (boletos, datos y pago);
- modo al azar o manual con tablero de números;
- autocompletado por cédula;
- 4 métodos de pago con copiar todos los datos;
- resultados aprobado, reservado y rechazado;
- entrega solo por correo;
- "Mis boletos", carrusel de fotos y modo claro y oscuro.

Solo cambia el diseño.

- **Tipografía:** Archivo (Google Fonts), en ancho condensado.
- **Recomendada para:** rifas de carros, motos y efectivo con flyers cargados; públicos que compran desde redes.

## Carpeta

```
vibrante/
├── front/            ← lo que se carga en la plataforma (index.html generado, config.js, img/)
├── vista-previa/     todas las pantallas en iPhones + panel de configuración en vivo
├── build_front.py    regenera front/index.html desde la vista previa
└── README.md
```

## Uso

1. **Probar:** abre `front/index.html`. Para ver todas las pantallas, abre `vista-previa/index.html`.
2. **Configurar:** edita `front/config.js`. Es el mismo formato en las tres plantillas, así que una rifa se puede cambiar de plantilla copiando su `config.js` y sus fotos.
3. **Publicar:** `front/` es una carpeta estática y se sube tal cual.
4. **Cambiar el diseño:** edita `vista-previa/index.html` (la capa de diseño de esta plantilla está al final del `<style>`) y ejecuta `python3 build_front.py`.

Para los campos de `config.js`, lo que está simulado y qué conectar a la API, ver el [README de la minimalista](../minimalista/README.md).
