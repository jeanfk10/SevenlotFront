# Plantilla Neón

Una noche sobria en grafito, plata y blanco cálido; el único color es el del rifero. Detrás de la página se mueve una aurora suave y detrás del premio giran rayos tenues. El título tiene un brillo leve en el color del rifero, sin parpadeo. Dos cintas diagonales corren con el premio, el precio y la fecha. El recuadro de compra tiene un borde fino que gira en el color del rifero. El 1er premio tiene brillo metálico y el botón principal un destello que lo cruza. La cuenta regresiva da vuelta cada segundo y la barra de vendidos tiene rayas en movimiento.

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

y abre http://localhost:8080/Neón/ (o la dirección que muestre serve). En un teléfono sale la vista móvil
y en una computadora, la de escritorio.

Todo lo demás está en el "LÉEME - Fronts de venta" y en la "Guía de implementación - Fronts de venta".
