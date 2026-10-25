# Plantilla Vibrante

La plantilla llamativa. El color del rifero ocupa bloques enteros: la portada, el 1er premio y el pie. Usa letras condensadas en mayúsculas y botones redondos que se hunden al tocarlos. Las urgencias van en rojo-rosado: compras en vivo, la barra de vendidos, "Popular" y "Solo quedan". El recuadro de compra está enmarcado con el color del rifero.

## Archivos

- index.html  la página de compra (no se edita a mano)
- config.js   los datos de la rifa y sus métodos de pago: lo único que cambia de un rifero a otro
- tema.css    el diseño de esta plantilla
- tema-computadora.css  sus ajustes para computadora
- tema.js     lo propio de la plantilla en JavaScript (adornos o reorganización)

Lo común a todas las plantillas está en `../comun/`. Las fotos de ejemplo están en `../comun/img/`.

## Probarla

Desde la carpeta "02 Fronts de venta" (la que contiene `comun/` y esta carpeta):

    npx serve .      o      python3 -m http.server 8080

y abre http://localhost:8080/Vibrante/ (o la dirección que muestre serve). En un teléfono sale la vista móvil
y en una computadora, la de escritorio.

Todo lo demás está en el "LÉEME - Fronts de venta" y en la "Guía de implementación - Fronts de venta".
