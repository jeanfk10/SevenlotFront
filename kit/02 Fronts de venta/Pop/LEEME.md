# Plantilla Pop

Estilo sticker en tonos neutros. La página va en franjas arena, salvia, niebla y piedra, y el color fuerte lo pone solo el rifero: la estrella con el precio, la cinta y lo que el comprador elige. Todo lleva bordes negros gruesos con sombra sólida y está un poco inclinado, como stickers pegados. Alrededor flotan círculos, estrellas, anillos y triángulos. Las cintas dicen "¡Compra ya!" con el premio y el precio. Los botones se hunden al tocarlos, y las cantidades y métodos rebotan como gelatina al elegirlos. Las secciones entran con rebote, la cuenta regresiva salta cada segundo y el boleto final cae girando.

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

y abre http://localhost:8080/Pop/ (o la dirección que muestre serve). En un teléfono sale la vista móvil
y en una computadora, la de escritorio.

Todo lo demás está en el "LÉEME - Fronts de venta" y en la "Guía de implementación - Fronts de venta".
