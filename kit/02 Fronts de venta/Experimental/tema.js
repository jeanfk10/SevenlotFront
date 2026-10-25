/* Plantilla Experimental: reordena la página común (historia de fotos, hoja con pestañas).
   venta.js llama a fx(app, ayudas) cada vez que monta la página, después de dibujarla.
   accent: color del rifero que usa la plantilla si config.js no trae uno. */
window.LOTTOGE_TEMA = {
  fx(app, { CFG, D, num, esc, reduce }) {
    const el = app.el, $ = q => el.querySelector(q), $$ = q => [...el.querySelectorAll(q)];
    el.classList.add('xp', 'own-layout'); // lays the page out itself, on phones and on computers
    const hero = $('.hero'), slides = $$('.slide'), n = slides.length;

    // story bars and tap zones over the photos
    hero.insertAdjacentHTML('afterbegin', `<div class="xp-segs" aria-hidden="true">${'<i><b></b></i>'.repeat(n)}</div>`
      + (n > 1 ? '<button class="xp-tap xp-tap--prev" type="button" data-action="g-prev" aria-label="Foto anterior"></button><button class="xp-tap xp-tap--next" type="button" data-action="g-next" aria-label="Foto siguiente"></button>' : ''));
    const segs = $$('.xp-segs i');
    const paintSegs = () => segs.forEach((s, i) => {
      s.className = i < app.slide ? 'done' : '';
      if (i === app.slide) { s.classList.remove('now'); void s.offsetWidth; s.classList.add('now'); }
    });
    const paintGallery = app.paintGallery.bind(app);
    app.paintGallery = () => { paintGallery(); paintSegs(); };
    paintSegs();
    // stories advance on their own (not when the visitor prefers less motion)
    if (n > 1 && !reduce) segs.forEach((s, i) => s.firstChild.addEventListener('animationend', () => { if (i === app.slide) app.goSlide((app.slide + 1) % n); }));

    // the sheet: live ticker, swipeable figures, sticky tabs and three panels
    const tabs = [['buy', 'Comprar'], ['prizes', 'Premios'], ['info', 'Info']];
    hero.insertAdjacentHTML('afterend', `<div class="xp-sheet"><span class="xp-grab" aria-hidden="true"></span><div class="xp-stats" data-sec="stats" aria-label="Cifras de la rifa"></div>
      <div class="xp-tabs" role="tablist" aria-label="Secciones">${tabs.map(([k, t], i) => `<button type="button" role="tab" data-xp-tab="${k}" aria-selected="${i === 0}">${t}</button>`).join('')}</div>
      ${tabs.map(([k], i) => `<div data-xp-panel="${k}" role="tabpanel"${i ? ' hidden' : ''}></div>`).join('')}</div>`);
    const sheet = $('.xp-sheet');
    sheet.insertBefore($('.ticker'), $('.xp-stats'));
    $('.xp-stats').append($('.sold'), $('.clock'));
    $('[data-xp-panel="buy"]').append($('[data-sec="buy"]'));
    const prizes = $('.prizes'); prizes.dataset.sec = 'prizes';
    prizes.classList.add('is-seen'); // the steps slide out each time the tab opens
    $('[data-xp-panel="prizes"]').append(prizes, $('.rank'));
    const org = $('.orgcard'); org.dataset.sec = 'org';
    const acc = $$('.acc-sec'); if (acc[0]) acc[0].dataset.sec = 'how';
    $('[data-xp-panel="info"]').append(org, ...acc);
    // sections live in tabs: open the right tab first, and stop below the sticky tabs
    app.secOffset = () => app.desk ? 150 : 74;
    app.openSection = t => { const panel = t.closest('[data-xp-panel]'); if (panel && panel.hidden) app.xpTab(panel.dataset.xpPanel); };
    app.xpTab = name => {
      $$('[data-xp-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.xpTab === name));
      $$('[data-xp-panel]').forEach(p => { p.hidden = p.dataset.xpPanel !== name; });
    };
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-xp-tab]');
      if (!b) return;
      app.xpTab(b.dataset.xpTab);
      const tabsBar = $('.xp-tabs'), y = sheet.offsetTop + tabsBar.offsetTop - (app.desk ? 72 : 0);
      if (app.sc.scrollTop > y) app.sc.scrollTop = y;
    });

    // pause the endless loops while this phone is off screen
    app.fxio = new IntersectionObserver(([e]) => el.classList.toggle('fx-paused', !e.isIntersecting));
    app.fxio.observe(app.device);
  }
};
