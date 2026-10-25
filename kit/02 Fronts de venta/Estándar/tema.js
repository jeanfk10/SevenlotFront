/* Plantilla Estándar: el color de LottoGE por defecto y dos etiquetas en la portada.
   venta.js llama a fx(app, ayudas) cada vez que monta la página, después de dibujarla.
   accent: color del rifero que usa la plantilla si config.js no trae uno. */
window.LOTTOGE_TEMA = {
  accent: 'coral',
  fx(app, { CFG, D, num, esc, reduce }) {
    const el = app.el, live = el.querySelector('.live');
    if (live) live.insertAdjacentHTML('afterend', '<p class="std-tags"><span class="t-teal">Autorizada por CONALOT</span><span class="t-sky">Tus números llegan por correo</span></p>');
    // pause the endless loops while this screen is out of view
    app.fxio = new IntersectionObserver(([e]) => el.classList.toggle('fx-paused', !e.isIntersecting));
    app.fxio.observe(app.device);
  }
};
