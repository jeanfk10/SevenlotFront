/* Plantilla Neón: adornos que se agregan a la página común (aurora y cintas).
   venta.js llama a fx(app, ayudas) cada vez que monta la página, después de dibujarla.
   accent: color del rifero que usa la plantilla si config.js no trae uno. */
window.LOTTOGE_TEMA = {
  fx(app, { CFG, D, num, esc, reduce }) {
    const el = app.el, home = el.querySelector('[data-v="home"]');
    home.insertAdjacentHTML('afterbegin', '<div class="fx-aurora" aria-hidden="true"><i></i><i></i><i></i></div>');
    const words = [CFG.prize, `Solo Bs ${num(CFG.price)}`, `Sorteo ${D.short}`, '¡Nueva oportunidad!'].map(esc);
    const ribbon = cls => `<div class="fx-ribbon ${cls}" aria-hidden="true"><div class="fx-ribbon__track">${words.map(w => `<span>${w}</span><span>✦</span>`).join('').repeat(2)}</div></div>`;
    el.querySelector('.hero').insertAdjacentHTML('afterend', ribbon(''));
    el.querySelector('[data-sec="buy"]').insertAdjacentHTML('beforebegin', ribbon('fx-ribbon--b'));
    // pause the light show while this phone is off screen
    app.fxio = new IntersectionObserver(([e]) => el.classList.toggle('fx-paused', !e.isIntersecting));
    app.fxio.observe(app.device);
  }
};
