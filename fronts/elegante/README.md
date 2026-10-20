# Front Elegante — LottoGE

La plantilla sobria. Fondo blanco, nombres y montos con serifa (Instrument Serif) y tarjetas de esquinas suaves con sombra leve. El color del rifero aparece solo donde se compra: botones, selección y barra de vendidos. El recuadro de compra es una tarjeta que flota sobre la página.

**Flujo y lógica:** idénticos a la plantilla [minimalista](../minimalista/README.md):
- compra en el mismo recuadro (boletos, datos y pago);
- modo al azar o manual con tablero de números;
- autocompletado por cédula;
- 4 métodos de pago con copiar todos los datos;
- resultados aprobado, reservado y rechazado;
- entrega solo por correo;
- "Mis boletos", carrusel de fotos y modo claro y oscuro.

Solo cambia el diseño.

- **Tipografía:** Instrument Sans e Instrument Serif (Google Fonts).
- **Recomendada para:** premios de alto valor (viajes, inmuebles, carros) y riferos que quieren transmitir seriedad.

## Carpeta

```
elegante/
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
