/* Plantilla Pop: adornos que se agregan a la página común (estrella con el precio, figuras y cintas).
   venta.js llama a fx(app, ayudas) cada vez que monta la página, después de dibujarla.
   accent: color del rifero que usa la plantilla si config.js no trae uno. */
window.LOTTOGE_TEMA = {
  fx(app, { CFG, D, num, esc, reduce }) {
    const el = app.el;
    const shapes = (host, list) => host && host.insertAdjacentHTML('afterbegin', list.map(([cls, style]) => `<i class="fx-shape ${cls}" style="${style}" aria-hidden="true"></i>`).join(''));
    const hero = el.querySelector('.hero');
    hero.insertAdjacentHTML('beforeend', `<div class="fx-badge" aria-hidden="true"><b>Solo</b><span>Bs ${num(CFG.price)}</span></div>`);
    shapes(hero, [
      ['s-circle', 'width:58px;height:58px;left:-18px;top:150px;background:var(--c2)'],
      ['s-star', 'width:54px;height:54px;right:6px;top:300px;background:var(--c3);animation-delay:-1.2s'],
      ['s-ring', 'width:70px;height:70px;right:-26px;bottom:170px;animation-delay:-2.5s'],
      ['s-pill', 'width:84px;height:24px;left:-24px;top:8px;background:var(--c5);animation-delay:-.8s']
    ]);
    shapes(el.querySelector('.prizes'), [
      ['s-tri', 'width:48px;height:42px;right:22px;top:26px;background:var(--c1)'],
      ['s-circle', 'width:34px;height:34px;left:46%;top:22px;background:var(--c4);animation-delay:-1.6s']
    ]);
    shapes(el.querySelector('[data-sec="buy"]'), [
      ['s-star', 'width:46px;height:46px;right:-14px;top:-20px;background:var(--c1);animation-delay:-.4s'],
      ['s-circle', 'width:30px;height:30px;left:-12px;bottom:60px;background:var(--c3);animation-delay:-2s']
    ]);
    const words = ['¡Compra ya!', CFG.prize, `Solo Bs ${num(CFG.price)}`, `Sorteo ${D.short}`].map(esc);
    const ribbon = cls => `<div class="fx-ribbon ${cls}" aria-hidden="true"><div class="fx-ribbon__track">${words.map(w => `<span>${w}</span><span>★</span>`).join('').repeat(2)}</div></div>`;
    hero.insertAdjacentHTML('afterend', ribbon(''));
    el.querySelector('[data-sec="buy"]').insertAdjacentHTML('beforebegin', ribbon('fx-ribbon--b'));
    // pause the fun while this phone is off screen
    app.fxio = new IntersectionObserver(([e]) => el.classList.toggle('fx-paused', !e.isIntersecting));
    app.fxio.observe(app.device);
  }
};
