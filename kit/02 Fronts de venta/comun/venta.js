/* LottoGE · fronts de venta · la página de compra
   Generado con build_kit.py desde fronts/<plantilla>/vista-previa/index.html (repositorio SevenlotFront). No se edita a mano: se cambia la vista previa y se vuelve a generar.
   Lee window.LOTTOGE_RIFA (config.js), window.LOTTOGE_PAGOS (metodos-pago.js), window.LOTTOGE_TEMA (tema.js)
   y, si existe, window.LOTTOGE_CONEXION (conexion.js, ver conexion.ejemplo.js). Las demostraciones están
   en "puntos de conexión con la plataforma". */

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Lo propio de cada plantilla (window.LOTTOGE_TEMA) y el catálogo de métodos de pago (window.LOTTOGE_PAGOS).
  const TEMA = window.LOTTOGE_TEMA || {};
  const PAGOS = window.LOTTOGE_PAGOS;
  // Without a platform connection the page is a demo: it shows sample buyers, live figures and a demo note.
  // Connected, it only shows the ticker and the ranking if the platform sends them (config ticker / top).
  const DEMO = !window.LOTTOGE_CONEXION;
  // Phones always get the mobile layout, even turned sideways; tablets and computers go by the window width.
  const PHONE = /Android.+Mobile|iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(navigator.userAgent) || !!(navigator.userAgentData && navigator.userAgentData.mobile);

  /* ---------- what a rifero configures (sample loaded from the flyer) ---------- */
  const SAMPLE = {
    rifero: 'Rifas La Bendición', handle: '@rifaslabendicion', support: 'soporte@rifas-ejemplo.com', conalot: 'CNL-AUT-RF-2026-075423',
    prize: 'Toyota Agya 2026', prizeExtra: '+ 3.000 en la guantera', second: '2.000 Bendiciones', third: '1.000 Bendiciones',
    price: 4799, rate: 881.88, total: 10000, soldPct: 76,
    date: '2026-10-22', time: '22:00', times2: ['4:00 PM', '1:00 PM'], lottery: 'Supergana',
    accent: TEMA.accent || 'oro', images: ['img/flyer.jpg', 'img/burj-al-arab.jpg', 'img/sala.jpg'],
    // Monedas fuera del dólar: unidades por 1 $ (ejemplo). En la plataforma salen del API de tasas.
    fx: { COP: 4150, PEN: 3.75 },
    // Métodos de pago del rifero, en el orden en que salen. Cuentas de ejemplo. La forma es la del API
    // (payment-methods/active) más icon y color; lo que falte lo completa LOTTOGE_PAGOS.normalize.
    paymentMethods: [
      { id: 'pm-auto', icon: 'pago-movil', name: 'Pago Móvil', isOnline: true,
        accountInfo: [['Banco', 'Banesco (0134)'], ['Teléfono', '0412-555-0199'], ['RIF', 'J-50123456-7']] },
      { id: 'binance', icon: 'binance', name: 'Binance', note: 'USDT con Binance Pay',
        accountInfo: [['Pay ID', '412 908 337'], ['Titular', 'Rifas La Bendición']] },
      { id: 'zelle', icon: 'zelle', name: 'Zelle', note: 'Dólares desde EE. UU.',
        accountInfo: [['Correo', 'pagos@rifero-ejemplo.com'], ['Titular', 'Rifas La Bendición']] },
      { id: 'pm-manual', icon: 'comprobante', name: 'Pago Móvil manual', note: 'Con comprobante, lo revisa el rifero',
        accountInfo: [['Banco', 'Banesco (0134)'], ['Teléfono', '0412-555-0199'], ['RIF', 'J-50123456-7']] },
      { id: 'transferencia', icon: 'transferencia', name: 'Transferencia', note: 'Banco de Venezuela',
        accountInfo: [['Banco', 'Banco de Venezuela (0102)'], ['Cuenta', '0102-0123-45-0001234567'], ['Titular', 'Rifas La Bendición'], ['RIF', 'J-50123456-7']] },
      { id: 'zinli', icon: 'zinli', name: 'Zinli', note: 'Dólares en tu tarjeta Zinli',
        accountInfo: [['Correo', 'pagos@rifero-ejemplo.com'], ['Titular', 'Rifas La Bendición']] },
      { id: 'paypal', icon: 'paypal', name: 'PayPal', note: 'Con la comisión de PayPal', minTickets: 5, commissionRate: 5.4,
        accountInfo: [['Correo', 'pagos@rifero-ejemplo.com']], instructions: 'El monto ya incluye la comisión de PayPal. Escribe tu cédula en la nota del pago.' },
      { id: 'nequi', icon: 'nequi', name: 'Nequi', note: 'Pesos desde Colombia',
        accountInfo: [['Número Nequi', '300 555 0199'], ['Titular', 'Rifas La Bendición']] }
    ]
  };
  const ACCENTS = {
    coral: ['#ff5a36', '#ffffff', 'Coral'], oro: ['#e9b227', '#17130a', 'Oro'], rojo: ['#d42a33', '#ffffff', 'Rojo'], verde: ['#0e8a55', '#ffffff', 'Verde'],
    azul: ['#1d5bd0', '#ffffff', 'Azul'], naranja: ['#f07a1f', '#1a0e04', 'Naranja'], turquesa: ['#14a6a0', '#04201f', 'Turquesa']
  };
  const ESTADOS = ['Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
    'Falcón', 'Guárico', 'La Guaira', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo',
    'Yaracuy', 'Zulia', 'Fuera del país'];
  let CFG = Object.assign(JSON.parse(JSON.stringify(SAMPLE)), window.LOTTOGE_RIFA || {});

  /* ---------- formatting (es-VE) ---------- */
  const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const num = (n, d = 0) => { const [i, f] = n.toFixed(d).split('.'); return f ? group(i) + ',' + f : group(i); };
  const bs = n => 'Bs ' + num(n, 2);
  const usd = n => '$' + num(n, 2);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = s => (s.replace(/^rifas?\s+/i, '').split(/\s+/).filter(w => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w)).map(w => w[0]).join('').slice(0, 2) || s.slice(0, 2)).toUpperCase();
  const boletos = q => `${num(q)} ${q === 1 ? 'boleto' : 'boletos'}`;
  const DAY = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const DAYL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MONL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  /* Everything the pages show is derived from the configuration. */
  function derive(c) {
    const [y, m, d] = c.date.split('-').map(Number), [hh, mm] = c.time.split(':').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d)), h12 = ((hh + 11) % 12) + 1;
    return {
      digits: String(c.total - 1).length,
      target: Date.UTC(y, m - 1, d, hh + 4, mm), // Venezuela is UTC-4
      short: `${DAY[dt.getUTCDay()]} ${d} ${MON[m - 1]}`,
      long: `${DAYL[dt.getUTCDay()]} ${d} de ${MONL[m - 1]}`,
      tag: `${d} ${MON[m - 1].toUpperCase()}`,
      hour: `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`,
      unitUsd: c.price / c.rate,
      series: c.total >= 1000 ? c.total / 10 : c.total,
      // the rifero's payment methods, completed by the catalog (any number of them)
      pays: (c.paymentMethods && c.paymentMethods.length ? c.paymentMethods : SAMPLE.paymentMethods).map(PAGOS.normalize)
    };
  }
  let D = derive(CFG);
  const pad = n => String(n).padStart(D.digits, '0');
  const methodOf = id => D.pays.find(m => m.id === id) || D.pays[0];
  const demoTaken = n => ((Math.imul(n + 17, 2654435761) >>> 0) % 100) < CFG.soldPct;
  const taken = n => CONEXION.numeroVendido(n);
  // Platform service fee (config serviceFee, a %), added to the tickets before the method's own commission.
  const serviceFee = () => Math.max(0, +CFG.serviceFee || 0);
  const withFee = totBs => totBs * (1 + serviceFee() / 100);
  const pct = v => `${num(v, v % 1 ? 1 : 0)}%`;
  const freeFrom = (start, count, skip = []) => { const out = []; for (let i = 0; out.length < count && i < CFG.total; i++) { const c = (start + i) % CFG.total, k = pad(c); if (!taken(c) && !skip.includes(k)) out.push(k); } return out; };

  /* ---------- shared live figures (sample) ---------- */
  const live = { bump: 0, online: 1284, viewing: 47 };
  const soldNow = () => Math.min(CFG.total - 1, Math.round(CFG.total * CFG.soldPct / 100) + live.bump);
  const paintLive = (root = document) => {
    const s = soldNow(), pct = Math.floor(s / CFG.total * 100);
    root.querySelectorAll('[data-live="online"]').forEach(n => n.textContent = num(live.online));
    root.querySelectorAll('[data-live="viewing"]').forEach(n => n.textContent = live.viewing);
    root.querySelectorAll('[data-live="pct"]').forEach(n => n.textContent = pct);
    root.querySelectorAll('[data-live="count"]').forEach(n => n.textContent = `${num(s)} de ${num(CFG.total)}`);
    root.querySelectorAll('[data-live="left"]').forEach(n => n.textContent = num(CFG.total - s));
    root.querySelectorAll('[data-live="bar"]').forEach(n => n.style.width = (s / CFG.total * 100).toFixed(1) + '%');
    root.querySelectorAll('[data-live-bar]').forEach(n => n.setAttribute('aria-valuenow', pct));
  };
  const tick = (n, v) => { if (n.textContent === v) return; n.textContent = v; n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); };
  const paintClock = (root = document) => {
    let t = Math.max(0, D.target - Date.now());
    const d = Math.floor(t / 864e5); t -= d * 864e5;
    const h = Math.floor(t / 36e5); t -= h * 36e5;
    const m = Math.floor(t / 6e4), s = Math.floor((t - m * 6e4) / 1e3);
    const two = v => String(v).padStart(2, '0');
    root.querySelectorAll('[data-cd="d"]').forEach(n => tick(n, two(d)));
    root.querySelectorAll('[data-cd="h"]').forEach(n => tick(n, two(h)));
    root.querySelectorAll('[data-cd="m"]').forEach(n => tick(n, two(m)));
    root.querySelectorAll('[data-cd="s"]').forEach(n => tick(n, two(s)));
  };
  setInterval(() => paintClock(), 1000);
  setInterval(() => {
    live.online = Math.max(980, Math.min(1620, live.online + Math.round(Math.random() * 24 - 10)));
    live.viewing = Math.max(31, Math.min(78, live.viewing + Math.round(Math.random() * 6 - 3)));
    paintLive();
  }, 3200);
  setInterval(() => { if (DEMO && soldNow() < CFG.total * .985) { live.bump += 1 + Math.floor(Math.random() * 4); paintLive(); } }, 7000);

  const TICK = [['Robert R.', 'Maracay', 5], ['Gabriela M.', 'Caracas', 10], ['Richard N.', 'Barinas', 2], ['Marbella H.', 'Mérida', 20],
    ['Yerimar R.', 'Barquisimeto', 1], ['Keila T.', 'Cumaná', 10], ['Darwin G.', 'Valencia', 50], ['Nohely V.', 'Puerto La Cruz', 5]];
  const tickList = () => CFG.ticker || (DEMO ? TICK : []);
  const topList = () => CFG.top || (DEMO ? TOP : []);
  const tickerHTML = () => {
    const one = tickList().map(([n, c, q]) => `<span><b>${esc(n)}</b> de ${esc(c)} compró ${boletos(+q || 0)}</span>`).join('');
    return one + one.replace(/<span>/g, '<span aria-hidden="true">');
  };
  const TOP = [['Darwin G.', 'Valencia', 214], ['Keila T.', 'Cumaná', 168], ['Luis C.', 'Caracas', 141]];
  const PEOPLE = [
    { name: 'Daniela Rojas', phone: '0414-555-2190', email: 'daniela.rojas@ejemplo.com' },
    { name: 'José Gregorio Pérez', phone: '0424-555-7731', email: 'josegpz@ejemplo.com' },
    { name: 'Andreína Lugo', phone: '0412-555-4408', email: 'andreina.lugo@ejemplo.com' },
    { name: 'Luis Eduardo Marcano', phone: '0416-555-0952', email: 'lemarcano@ejemplo.com' }
  ];
  const personFor = ced => ced === '18456732' ? PEOPLE[0] : PEOPLE[[...ced].reduce((a, c) => a + +c, 0) % PEOPLE.length];
  const demoNumbers = (q, seedBase) => {
    const nums = []; let seed = seedBase + q * 37, guard = 0;
    while (nums.length < q && guard++ < 50000) { seed = (seed * 1103515245 + 12345) % 2147483648; const n = seed % CFG.total, k = pad(n); if (!taken(n) && !nums.includes(k)) nums.push(k); }
    return nums;
  };

  /* ---------- puntos de conexión con la plataforma ----------
     Lo único que habla con el servidor. Cada uno trae aquí una versión de demostración; la plataforma
     los cambia por los suyos definiendo window.LOTTOGE_CONEXION antes de cargar la página
     (ver conexion.ejemplo.js en el kit). Si falta alguno, se usa el de demostración. */
  const CONEXION = Object.assign({
    // Datos del comprador por su cédula ('V18456732') → { name, phone, email } o null si no está registrado.
    buscarCliente: cedula => new Promise(ok => setTimeout(() => ok(personFor(cedula.slice(1))), 500)),
    // Si un número ya se vendió. Responde al instante: la plataforma precarga la lista de vendidos.
    numeroVendido: n => demoTaken(n),
    // Envía la compra (ver order() en App) → { estado: 'aprobado' | 'reservado' | 'rechazado', orden, numeros }.
    // Demo: Pago Móvil al instante se aprueba, salvo una referencia que termine en 0 (el banco no la encuentra);
    // los demás métodos quedan reservados hasta que el rifero los revise.
    enviarPago: orden => new Promise(ok => setTimeout(() => {
      const m = methodOf(orden.metodo);
      ok(!m.isOnline ? { estado: 'reservado' } : /0$/.test(orden.referencia) ? { estado: 'rechazado' } : { estado: 'aprobado' });
    }, 2400)),
    // Órdenes de una cédula en esta rifa → { nombre, boletos, ordenes: [{ id, metodo, monto, estado: 'pagado' | 'por-verificar', numeros, nota }] }.
    misBoletos: cedula => {
      const ced = cedula.slice(1), p = personFor(ced);
      return Promise.resolve({ demo: true, nombre: p.name, boletos: 7, ordenes: [
        { id: 'LG-48035', metodo: 'Pago Móvil', monto: bs(5 * CFG.price), estado: 'pagado', numeros: demoNumbers(5, +ced.slice(-4)) },
        { id: 'LG-48112', metodo: 'Zelle', monto: usd(2 * CFG.price / CFG.rate), estado: 'por-verificar', nota: '2 boletos al azar. Los números se asignan cuando se apruebe el pago y te llegan a tu correo.' }
      ] });
    }
  }, window.LOTTOGE_CONEXION || {});

  /* ---------- payment methods on the page ---------- */
  const methodBtn = m => `<button class="method" type="button" role="radio" data-action="method" data-m="${esc(m.id)}" aria-checked="false"><i class="mico" style="--mc:${esc(m.color)};--mci:${esc(m.ink)}">${PAGOS.svg(m.icon)}</i><b>${esc(m.name)}</b>${m.note ? `<span>${esc(m.note)}</span>` : ''}${m.badge ? `<em>${esc(m.badge)}</em>` : ''}${m.minTickets > 1 ? `<small>Desde ${m.minTickets} boletos</small>` : ''}</button>`;
  // With more than four methods in more than one currency, they go in groups: bolívares, dólares, other countries.
  const methodsHTML = () => {
    const groups = PAGOS.GROUPS.map(([g, title]) => [title, D.pays.filter(m => PAGOS.groupOf(m.currency) === g)]).filter(([, ms]) => ms.length);
    const titled = D.pays.length > 4 && groups.length > 1;
    return groups.map(([title, ms]) => (titled ? `<p class="methods__group">${title}</p>` : '') + ms.map(methodBtn).join('')).join('');
  };
  const ordersHTML = r => !r || !r.ordenes || !r.ordenes.length
    ? '<p class="mine-who">No encontramos boletos con esa cédula en esta rifa.</p>'
    : `<p class="mine-who"><b>${esc(r.nombre)}</b> tiene ${boletos(r.boletos)} en esta rifa.</p>` + r.ordenes.map(o =>
      `<div class="ord"><div class="ord__head"><span><b>Orden ${esc(o.id)}</b><br>${esc(o.metodo)} · ${esc(o.monto)}</span>${o.estado === 'pagado' ? '<span class="tag tag--ok">Pagado</span>' : '<span class="tag tag--wait">Por verificar</span>'}</div>`
      + (o.numeros && o.numeros.length ? `<ul>${o.numeros.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : `<p>${esc(o.nota || 'Los números se asignan cuando se apruebe el pago y te llegan a tu correo.')}</p>`) + '</div>').join('')
      + (r.demo ? '<p class="hint">Datos de ejemplo. En producción, esta consulta va contra la API de LottoGE.</p>' : '');


  /* ---------- the buyer's page, built from the configuration ---------- */
  const PLUS = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M8 2h2v14H8zM2 8h14v2H2z" fill="currentColor"/></svg>';
  const THEME_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2v16a8 8 0 0 1 0-16Z"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor"/></svg>';
  const SHUFFLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 3l4 4-4 4V8h-2.6l-8 9H3v-2h2.6l8-9H17zm0 10l4 4-4 4v-3h-3.4l-2.2-2.5 1.4-1.5 1.7 2H17zM3 7h3.4l2.2 2.5-1.4 1.5-1.7-2H3z"/></svg>';
  const HAND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 2a2 2 0 0 1 2 2v6.3l.6-.1V4.5a2 2 0 0 1 4 0v5.7l.5.1V6a2 2 0 1 1 4 0v8.5c0 4.1-3 7.5-7.1 7.5h-.8c-2.2 0-4.2-1.1-5.4-3L3.3 14a2 2 0 0 1 3.4-2.1L7 12.4V4a2 2 0 0 1 2-2Z"/></svg>';
  const COPY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 2h12v14h-2V4H8zM4 6h12v16H4zm2 2v12h8V8z"/></svg>';
  const CLOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v6l5 3 1-1.7-4-2.4V7z"/></svg>';
  const XMARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.3 4.3 12 10.6 5.7 4.3 4.3 5.7 10.6 12l-6.3 6.3 1.4 1.4 6.3-6.3 6.3 6.3 1.4-1.4-6.3-6.3 6.3-6.3z"/></svg>';
  const qtys = [1, 2, 5, 10, 20, 50];

  function appHTML(c, p) {
    const prize = esc(c.prize), org = esc(c.rifero), mark = esc(initials(c.rifero)), imgs = c.images.length ? c.images : SAMPLE.images;
    const acc = (items, cls) => items.map(([q, a], i) =>
      `<div class="acc__item"><button type="button" aria-expanded="false" aria-controls="${p}-${cls}${i}"><span>${q}</span>${PLUS}</button><div class="acc__body" id="${p}-${cls}${i}" hidden><p>${a}</p></div></div>`).join('');
    const instant = D.pays.find(m => m.isOnline), manual = D.pays.some(m => !m.isOnline);
    const HOW = [
      ['Elige tus boletos', 'Toca una cantidad o elige tus números en el tablero, y luego “Participar”.'],
      ['Escribe tu cédula', 'Llenamos tu nombre, teléfono y correo. Solo revisas y eliges tu estado.'],
      ['Paga como prefieras', instant
        ? `${esc(instant.name)} se verifica solo, al instante.${manual ? ' Con los demás métodos subes el comprobante y el rifero lo revisa.' : ''}`
        : 'Pagas, subes el comprobante y el rifero lo revisa.'],
      ['Recibe tus números', 'Te llegan a tu correo apenas se confirma el pago.']
    ];
    const FAQ = [
      ['¿Cómo se escoge al ganador?', `Con el resultado de ${esc(c.lottery)} de ${D.digits} cifras del ${D.long}. El 1er premio juega a las ${D.hour}; el 2do y el 3er, a las ${c.times2[0]} y a la ${c.times2[1]} del mismo día.`],
      ['¿Esta rifa es legal?', `Sí. Está autorizada por CONALOT con el nº ${esc(c.conalot)}, y funciona sobre LottoGE, la plataforma autorizada para rifas en Venezuela.`],
      ['¿Cuándo recibo mis números?', (instant ? `Con ${esc(instant.name)}, en el momento. ` : '') + (manual ? `Con ${instant ? 'los otros métodos' : 'tu pago'} tus boletos quedan reservados hasta que el rifero apruebe el comprobante, normalmente en menos de 2 horas.` : '')],
      ['¿Cómo cobro si gano?', `${org} te escribe a tu correo. La entrega se hace en persona y se transmite en vivo por ${esc(c.handle)}.`]
    ];
    const ids = ['V', 'E', 'J'].map(t => `<button type="button" role="radio" data-action="idtype" data-t="${t}" aria-checked="${t === 'V'}">${t}</button>`).join('');
    const nSeries = c.total / D.series;
    return `
<div class="app" data-view="home">
  <div class="island" aria-hidden="true"></div>
  <div class="sbar" aria-hidden="true"><span>9:41</span><span class="sbar__icons">
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.6c2.2 0 4.2.8 5.7 2.2l1.2-1.3A10 10 0 0 0 8 .8 10 10 0 0 0 1.1 3.5l1.2 1.3A8.3 8.3 0 0 1 8 2.6Zm0 3.4c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.6 6.6 0 0 0 8 4.2c-1.8 0-3.4.7-4.6 1.8l1.2 1.3C5.5 6.5 6.7 6 8 6Zm0 3.3c.5 0 1 .2 1.2.5L8 11.2 6.8 9.8c.3-.3.7-.5 1.2-.5Z"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="20" height="9" rx="2"/><rect x="24.5" y="4.5" width="1.6" height="4" rx=".8" opacity=".45"/></svg>
  </span></div>

  <section class="view" data-v="home" aria-label="Rifa ${prize}">
    <div class="scroller" data-scroller>
      <nav class="nav" aria-label="${org}">
        <span class="org"><span class="org__mark" aria-hidden="true">${mark}</span><span class="org__name">${org}</span></span>
        <span class="nav__links"><button type="button" data-action="go" data-to="prizes">Premios</button><button type="button" data-action="go" data-to="how">Cómo participar</button><button type="button" data-action="go" data-to="faq">Preguntas</button></span>
        <button class="chip" type="button" data-action="mine">Mis boletos</button>
        <button class="iconbtn" type="button" data-action="theme" aria-label="Cambiar entre modo claro y oscuro">${THEME_ICON}</button>
        <button class="btn btn--accent nav__buy" type="button" data-action="to-buy">Comprar boletos</button>
      </nav>
      <div class="ticker" aria-label="Compras recientes${CFG.ticker ? '' : ', datos de ejemplo'}"${tickList().length ? '' : ' hidden'}>
        <span class="ticker__label"><span class="dot" aria-hidden="true"></span>En vivo</span>
        <div class="ticker__viewport"><div class="ticker__track">${tickerHTML()}</div></div>
      </div>
      <div class="page">
      <header class="hero">
        <div class="hero__img">
          <div class="slides" data-slides tabindex="0" role="group" aria-roledescription="carrusel" aria-label="Fotos del premio">
            ${imgs.map((src, i) => `<figure class="slide" role="group" aria-roledescription="foto" aria-label="${i + 1} de ${imgs.length}"><img src="${src}" alt="Foto ${i + 1} de ${imgs.length} del premio: ${prize}"${i ? ' loading="lazy"' : ''}></figure>`).join('')}
          </div>
          ${imgs.length > 1 ? `<span class="gal__count" data-gal-count aria-hidden="true">1 / ${imgs.length}</span>
          <button class="gal__nav gal__nav--prev" type="button" data-action="g-prev" aria-label="Foto anterior" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor"/></svg></button>
          <button class="gal__nav gal__nav--next" type="button" data-action="g-next" aria-label="Foto siguiente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 4.6 16 12l-7.4 7.4 1.4 1.4 8.8-8.8L10 3.2z" fill="currentColor"/></svg></button>
          <div class="dots" role="group" aria-label="Elegir foto">${imgs.map((_, i) => `<button type="button" data-action="g-go" data-i="${i}" aria-label="Ver foto ${i + 1}" aria-current="${i === 0}"></button>`).join('')}</div>` : ''}
          <button class="flyerbtn" type="button" data-action="flyer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v2H7.4l4.3 4.3-1.4 1.4L6 7.4V11H4zm16 16h-7v-2h3.6l-4.3-4.3 1.4-1.4 4.3 4.3V13h2z" fill="currentColor"/></svg>Ver en grande</button>
        </div>
        <div class="hero__body">
          <p class="hero__when">Sorteo el ${D.long} · ${esc(c.lottery)} ${D.digits} cifras</p>
          <h1 class="hero__title">${prize}</h1>
          ${c.prizeExtra ? `<p class="hero__extra">${esc(c.prizeExtra)}</p>` : ''}
          <div class="price"><p class="price__bs">Bs ${num(c.price)}</p><p class="price__usd">por boleto<br><b>${usd(D.unitUsd)}</b> a tasa BCV</p></div>
          <button class="btn btn--accent btn--block" type="button" data-action="to-buy" data-hero-buy>Comprar boletos</button>
          <p class="live"${DEMO ? '' : ' hidden'}><span class="dot" aria-hidden="true"></span><span><b data-live="online"></b> en línea · <b data-live="viewing"></b> viendo esta rifa</span></p>
        </div>
      </header>

      <section class="clock" data-sec="clock" data-reveal aria-label="Tiempo para el cierre de la venta">
        <p>La venta cierra en</p>
        <div class="cd" role="timer"><div><b data-cd="d">00</b><span>días</span></div><div><b data-cd="h">00</b><span>horas</span></div><div><b data-cd="m">00</b><span>min</span></div><div><b data-cd="s">00</b><span>seg</span></div></div>
      </section>
      <section class="sold" data-reveal aria-label="Avance de la venta">
        <div class="sold__head"><p class="sold__pct"><span data-live="pct"></span>%<small>vendido</small></p><p class="sold__n" data-live="count"></p></div>
        <div class="bar" role="progressbar" aria-label="Boletos vendidos" aria-valuemin="0" aria-valuemax="100" data-live-bar><span data-live="bar"></span></div>
        <p class="sold__left">Solo quedan <b data-live="left"></b> boletos.</p>
      </section>
      <section class="prizes" data-sec="prizes" data-reveal aria-labelledby="${p}-pz">
        <h2 class="h2" id="${p}-pz">Premios</h2>
        <div class="p1"><small>1er premio · ${D.hour}</small><b>${prize}</b>${c.prizeExtra ? `<span>${esc(c.prizeExtra)}</span>` : ''}</div>
        <div class="p23row">
          <div class="p23"><small>2do premio · ${c.times2[0]}</small><b>${esc(c.second)}</b></div>
          <div class="p23"><small>3er premio · ${c.times2[1]}</small><b>${esc(c.third)}</b></div>
        </div>
      </section>

      <!-- The whole purchase happens here, one stage at a time -->
      <section class="buy" data-sec="buy" aria-label="Comprar boletos" aria-live="polite">
        <div class="stage" data-stage="pick">
          <h2 class="buy__h">Selecciona tus boletos</h2>
          <div class="seg" role="radiogroup" aria-label="Cómo quieres tus números">
            <button type="button" role="radio" data-action="mode" data-mode="random" aria-checked="true">${SHUFFLE}Al azar</button>
            <button type="button" role="radio" data-action="mode" data-mode="manual" aria-checked="false">${HAND}Manual</button>
          </div>
          <div data-panel="random">
            <div class="quick" role="group" aria-label="Cantidades rápidas">
              ${qtys.map(q => `<button class="qbtn" type="button" data-action="quick" data-q="${q}" aria-pressed="false">${q === 5 ? '<em>Popular</em>' : ''}<b>${q}</b><span>Bs ${num(q * c.price)}</span></button>`).join('')}
            </div>
            <div class="stepper"><button type="button" data-action="dec" aria-label="Quitar un boleto">−</button><input class="field" id="${p}-qty" type="text" inputmode="numeric" autocomplete="off" data-in="qty" aria-label="Cantidad de boletos" aria-describedby="${p}-qtyerr"><button type="button" data-action="inc" aria-label="Agregar un boleto">+</button></div>
            <p class="err" id="${p}-qtyerr" data-err="qty" hidden></p>
          </div>
          <div class="manual" data-panel="manual" hidden>
            <p class="hint" data-manual-hint></p>
            <ul class="chips" data-picks aria-label="Números elegidos"></ul>
            <button class="btn btn--ink btn--block" type="button" data-action="board" aria-haspopup="dialog">Elegir mis números</button>
          </div>
          <button class="btn btn--accent btn--block go" type="button" data-action="participar"><span>Participar</span><b data-go-bs></b></button>
          <p class="go__sub" data-go-usd></p>
        </div>

        <div class="stage" data-stage="data" hidden>
          <button class="back" type="button" data-action="to-pick">${BACK}<span>Modificar cantidad (<span data-qword></span>)</span></button>
          <h2 class="buy__h">Tus datos</h2>
          <p class="lbl" id="${p}-idlbl" style="margin-top:0">Cédula</p>
          <div class="idrow"><div class="seg seg--id" role="radiogroup" aria-label="Tipo de documento">${ids}</div>
            <input class="field" id="${p}-ced" type="text" inputmode="numeric" maxlength="9" placeholder="Ej. 18456732" autocomplete="off" data-in="cedula" aria-labelledby="${p}-idlbl"></div>
          <p class="lookup" data-lookup aria-live="polite">Con tu cédula llenamos el resto.</p>
          <label class="lbl" for="${p}-name">Nombre y apellido</label><input class="field" id="${p}-name" type="text" autocomplete="name" data-in="name">
          <label class="lbl" for="${p}-phone">Teléfono</label><input class="field" id="${p}-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0414-555-0000" data-in="phone">
          <label class="lbl" for="${p}-estado">Estado</label>
          <select class="field" id="${p}-estado" data-in="estado"><option value="">Selecciona tu estado</option>${ESTADOS.map(e => `<option>${e}</option>`).join('')}</select>
          <label class="lbl" for="${p}-mail">Correo <small>(ahí te llegan tus números)</small></label><input class="field" id="${p}-mail" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.com" data-in="email">
          <p class="err" data-err="data" hidden></p>
          <button class="btn btn--accent btn--block go" type="button" data-action="to-pay"><span>Continuar</span><b data-go-bs></b></button>
        </div>

        <div class="stage" data-stage="pay" hidden>
          <button class="back" type="button" data-action="to-data">${BACK}Modificar datos</button>
          <h2 class="buy__h">Pago</h2>
          <div class="recap"><span data-qword></span><b data-go-bs></b></div>
          <p class="go__sub" style="margin:0 0 14px; text-align:right" data-go-usd></p>
          <div class="methods" role="radiogroup" aria-label="Método de pago">${methodsHTML()}</div>
          <div class="paybox" data-paybox></div>
          <div data-f="payer"><label class="lbl" for="${p}-payer">Teléfono desde el que pagas</label><input class="field" id="${p}-payer" type="tel" inputmode="tel" placeholder="0414-555-0000" data-in="payer"></div>
          <div data-f="bank"><label class="lbl" for="${p}-bank">Tu banco</label><select class="field" id="${p}-bank" data-in="bank">${PAGOS.BANCOS_VE.map(b => `<option value="${b.name}">${b.name} (${b.code})</option>`).join('')}</select></div>
          <label class="lbl" for="${p}-ref" data-ref-label>Número de referencia</label>
          <input class="field" id="${p}-ref" type="text" autocomplete="off" data-in="ref" placeholder="Últimos 6 dígitos">
          <div data-f="file"><input class="sr-only" id="${p}-file" type="file" accept="image/*,.pdf" data-in="file" aria-required="true"><label class="upload" for="${p}-file" data-upload><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 16V6.8L7.4 10.4 6 9l6-6 6 6-1.4 1.4L13 6.8V16zM4 19h16v2H4z" fill="currentColor"/></svg><span class="upcheck" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z" fill="currentColor"/></svg></span><span><span data-file-name>Subir comprobante</span><small data-file-sub>Obligatorio. Foto, captura o PDF del pago.</small></span></label></div>
          <p class="err" data-err="pay" hidden></p>
          <button class="btn btn--accent btn--block go" type="button" data-action="confirm"><span>Confirmar pago</span><b data-go-bs></b></button>
        </div>
      </section>

      <section class="orgcard" data-sec="org" data-reveal aria-labelledby="${p}-org">
        <h2 class="sr-only" id="${p}-org">Quién organiza</h2>
        <div class="orgcard__who"><span class="org__mark" aria-hidden="true">${mark}</span><span><b>${org}</b><span>Organiza esta rifa</span></span></div>
        <dl><dt>Instagram</dt><dd>${esc(c.handle)}</dd><dt>Soporte</dt><dd>${esc(c.support)}</dd><dt>Sorteo</dt><dd>${D.short}, ${D.hour}</dd></dl>
        <div class="seal"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="var(--ink)"/><path d="M12 20.5l5.5 5.5L29 14.5" fill="none" stroke="var(--bg)" stroke-width="3.4"/></svg>
          <span><b>Autorizada por CONALOT</b>Evento nº ${esc(c.conalot)}</span></div>
      </section>
      <section class="rank" data-sec="rank" data-reveal aria-labelledby="${p}-rk"${topList().length ? '' : ' hidden'}>
        <h2 class="h2" id="${p}-rk">Top compradores</h2>
        <p class="note">Quienes más boletos llevan en esta rifa.${CFG.top ? '' : ' Datos de ejemplo.'}</p>
        <ol>${topList().map(([n, city, q], i) => `<li><span class="rank__pos">${i + 1}</span><span class="rank__who"><b>${esc(n)}</b><span>${esc(city)}</span></span><span class="rank__n">${num(+q || 0)}<span>boletos</span></span></li>`).join('')}</ol>
      </section>
      <section class="acc-sec" data-sec="how" data-reveal aria-labelledby="${p}-how">
        <h2 class="h2" id="${p}-how">Cómo participar</h2>
        <div class="acc steps-list">${acc(HOW, 'h')}</div>
      </section>
      <section class="acc-sec" data-sec="faq" data-reveal aria-labelledby="${p}-faq">
        <h2 class="h2" id="${p}-faq">Preguntas frecuentes</h2>
        <div class="acc">${acc(FAQ, 'f')}</div>
      </section>
      </div>
      <footer class="afoot">
        <p class="afoot__pow">Rifa de <b>${org}</b>, montada sobre</p>
        <span class="lgmark"><i aria-hidden="true"></i>Lotto<b>GE</b></span>
        <p>LottoGE es la plataforma autorizada que procesa la venta y asigna los números. Cada rifero responde por sus premios.</p>
        ${DEMO ? '<p>Prototipo de demostración: no procesa pagos ni guarda datos. Rifero, compradores, montos y cuentas son de ejemplo.</p>' : ''}
      </footer>
    </div>

    <div class="buybar" data-buybar>
      <p><b>Bs ${num(c.price)}</b>por boleto · ${usd(D.unitUsd)}</p>
      <button class="btn btn--accent" type="button" data-action="to-buy" tabindex="-1">Comprar boletos</button>
    </div>

    <div class="board-bg" data-board-bg hidden></div>
    <div class="board" data-board hidden role="dialog" aria-modal="true" aria-labelledby="${p}-bh">
      <div class="board__head">
        <div><h2 id="${p}-bh">Elige tus números</h2><p>Del ${pad(0)} al ${pad(c.total - 1)}. Los tachados ya se vendieron.</p></div>
        <button class="board__x" type="button" data-action="board-close" aria-label="Cerrar el tablero">×</button>
      </div>
      <div class="board__tools">
        <input class="field" id="${p}-search" type="text" inputmode="numeric" maxlength="${D.digits}" placeholder="Buscar número" autocomplete="off" data-in="search" aria-label="Buscar un número">
        <div class="rand" role="group" aria-label="Agregar números al azar">${[1, 5, 10].map(n => `<button type="button" data-action="rand" data-n="${n}" aria-label="Agregar ${n} al azar">+${n}</button>`).join('')}</div>
      </div>
      ${nSeries > 1 ? `<div class="series" role="group" aria-label="Series">${Array.from({ length: nSeries }, (_, i) => `<button type="button" data-action="series" data-i="${i}" aria-pressed="${i === 0}">${pad(i * D.series)}–${pad((i + 1) * D.series - 1)}</button>`).join('')}</div>` : '<div></div>'}
      <div class="grid" data-grid role="group" aria-label="Números"></div>
      <div class="board__foot">
        <div class="legend" aria-hidden="true"><span><i class="l1"></i>Libre</span><span><i class="l2"></i>Vendido</span><span><i class="l3"></i>Elegido</span></div>
        <button class="btn btn--accent btn--block" type="button" data-action="board-close" data-board-done>Listo</button>
      </div>
    </div>

    <div class="lightbox" data-lightbox hidden role="dialog" aria-label="Fotos del premio">
      <div class="lightbox__bar"><span>${imgs.length > 1 ? `${imgs.length} fotos del premio` : 'Foto del premio'}</span><button type="button" data-action="close-flyer">Cerrar</button></div>
      <div class="lightbox__img" data-lb-scroll>${imgs.map((src, i) => `<img src="${src}" alt="Foto ${i + 1} de ${imgs.length} del premio: ${prize}" loading="lazy">`).join('')}</div>
    </div>
    <div class="verify" data-verify hidden role="status"><h2>Verificando tu pago</h2><p data-verify-line></p><div class="vbar" aria-hidden="true"><span></span></div><p data-verify-note></p></div>
  </section>

  <section class="view" data-v="ok" aria-label="Compra confirmada" hidden>
    <div class="scroller" data-ok-scroller>
      <header class="ok-head"><h1 class="wide">¡Listo!</h1><p data-ok-lede></p></header>
      <div class="tkt">
        <div class="tkt__main">
          <div class="tkt__top"><span>${org}</span><span>Boleto</span></div>
          <p class="tkt__prize">${prize}</p>
          <div class="tkt__meta"><span>Sorteo<b>${D.tag}</b></span><span>Hora<b>${D.hour}</b></span><span>Lotería<b>${esc(c.lottery)}</b></span></div>
        </div>
        <div class="tkt__stub"><span class="tkt__lbl">Tu número</span><span class="num" data-big-num></span><svg class="barcode" data-barcode viewBox="0 0 92 56" aria-hidden="true"></svg></div>
      </div>
      <div class="stubs-wrap" data-stubs-wrap><h2 data-stubs-title></h2><ul class="stubs" data-stubs></ul></div>
      <div class="ok-body">
        <p data-ok-sent></p>
        <table class="order" aria-label="Detalle de la orden"><tbody data-order></tbody></table>
        <div class="ok-actions"><button class="btn btn--accent btn--block" type="button" data-action="again">Comprar más boletos</button><button class="btn btn--ghost btn--block" type="button" data-action="home">Volver al inicio</button></div>
      </div>
    </div>
    <canvas class="confetti" data-confetti aria-hidden="true"></canvas>
  </section>

  <section class="view" data-v="held" aria-label="Boletos reservados" hidden>
    <div class="scroller" data-held-scroller>
      <header class="st-head">
        <span class="st-icon st-icon--wait" aria-hidden="true">${CLOCK}</span>
        <h1 class="wide">Boletos reservados</h1>
        <p data-held-lede></p>
      </header>
      <ol class="steps3" aria-label="Estado de tu pago">
        <li class="is-done"><i aria-hidden="true">✓</i><span><b>Comprobante recibido</b>Tu referencia y tu comprobante llegaron bien.</span></li>
        <li class="is-now" aria-current="step"><i aria-hidden="true">2</i><span><b>En revisión</b>El rifero lo verifica desde su panel, normalmente en menos de 2 horas.</span></li>
        <li><i aria-hidden="true">3</i><span><b>Aprobado o rechazado</b>Te avisamos por correo con el resultado.</span></li>
      </ol>
      <div class="held" data-held-box><h2 data-held-title></h2><ul data-held-nums></ul></div>
      <div class="held-note" data-held-random><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18v14H3zm2 2v.5l7 4.4 7-4.4V7zm0 2.9V17h14V9.9l-7 4.4z"/></svg><span data-held-random-txt></span></div>
      <div class="st-body">
        <p data-held-sent></p>
        <table class="order" aria-label="Detalle de la orden"><tbody data-held-order></tbody></table>
        <div class="ok-actions"><button class="btn btn--accent btn--block" type="button" data-action="mine">Ver mis boletos</button><button class="btn btn--ghost btn--block" type="button" data-action="home">Volver al inicio</button></div>
      </div>
    </div>
  </section>

  <section class="view" data-v="rej" aria-label="Compra rechazada" hidden>
    <div class="scroller" data-rej-scroller>
      <header class="st-head">
        <span class="st-icon st-icon--bad" aria-hidden="true">${XMARK}</span>
        <h1 class="wide">Compra rechazada</h1>
        <p data-rej-lede></p>
      </header>
      <div class="why">
        <h2>Revisa que coincida con tu pago</h2>
        <ul>
          <li>El <b>monto exacto</b>, sin redondear.</li>
          <li>La <b>referencia</b>: los últimos 6 dígitos del comprobante.</li>
          <li data-rej-payer>El <b>teléfono</b> y el <b>banco</b> desde los que pagaste.</li>
        </ul>
      </div>
      <div class="st-body">
        <div class="why why--note"><p><b>Tus boletos no se apartaron.</b> Si ya hiciste el pago, no lo repitas: corrige los datos y vuelve a verificar.</p></div>
        <button class="btn btn--accent btn--block" type="button" data-action="fix-pay">Corregir datos del pago</button>
        <div class="support"><span><small>Soporte por correo</small><b>${esc(c.support)}</b></span><button type="button" class="copy" data-copy="${esc(c.support)}">Copiar</button></div>
        <button class="btn btn--ghost btn--block" type="button" data-action="home">Volver al inicio</button>
      </div>
    </div>
  </section>

  <section class="view" data-v="mine" aria-label="Mis boletos" hidden>
    <div class="scroller">
      <div class="mine-top"><button class="back" type="button" data-action="home">${BACK}Inicio</button><p>${prize}</p></div>
      <div class="mine-body">
        <h2>Mis boletos</h2>
        <p>Escribe tu cédula para ver los boletos que tienes en esta rifa.</p>
        <div class="idrow"><div class="seg seg--id" role="radiogroup" aria-label="Tipo de documento">${ids}</div>
          <input class="field" id="${p}-mced" type="text" inputmode="numeric" maxlength="9" placeholder="Ej. 18456732" autocomplete="off" data-in="mced" aria-label="Número de cédula"></div>
        <button class="btn btn--ink btn--block" type="button" data-action="search" style="margin-top:8px">Buscar mis boletos</button>
        <p class="err" data-err="mine" hidden></p>
        <div class="mine-res" data-mine-res aria-live="polite"></div>
      </div>
    </div>
  </section>

  <div class="homebar" aria-hidden="true"></div>
</div>`;
  }

  let uid = 0;
  class App {
    constructor(screen, init, device) {
      this.device = device; this.init = init;
      this.s = Object.assign({ view: 'home', stage: 'pick', qty: 2, mode: 'random', picks: [], idType: 'V', cedula: '', name: '', phone: '', email: '', estado: '',
        method: 'pm-auto', ref: '', payer: '', bank: 'Banesco', file: '', series: 0, search: '' }, JSON.parse(JSON.stringify(init)));
      const seeds = { first: 7, second: 2026, third: 4821 };
      this.s.picks = this.s.picks.reduce((out, x) => { const k = seeds[x] != null ? freeFrom(seeds[x] % CFG.total, 1, out)[0] : x; if (k) out.push(k); return out; }, []);
      if (!D.pays.some(m => m.id === this.s.method)) this.s.method = D.pays[0].id;
      this.timers = [];
      const p = 'p' + (++uid);
      screen.innerHTML = appHTML(CFG, p);
      this.el = screen.querySelector('.app');
      this.sc = this.el.querySelector('[data-scroller]');
      this.$ = q => this.el.querySelector(q);
      this.$$ = q => [...this.el.querySelectorAll(q)];
      this.setupDesk(screen);
      paintLive(this.el); paintClock(this.el);
      this.bind();
      this.setupHome();
      this.setupGallery();
      if (TEMA.fx) TEMA.fx(this, { CFG, D, num, esc, reduce });
      if (this.s.cedula) this.fillPerson(personFor(this.s.cedula), false);
      this.syncInputs();
      this.show(this.s.view);
      this.stage(this.s.stage, true);
      if (init.slide) { const go = () => this.goSlide(init.slide, true); go(); requestAnimationFrame(go); window.addEventListener('load', go, { once: true }); }
      if (init.flyer) this.flyer(true);
      if (init.board) this.board(true);
      if (init.verifying) this.verify(init.hold);
      if (this.s.view === 'ok') this.buildSuccess();
      if (this.s.view === 'held') this.buildHeld();
      if (this.s.view === 'rej') this.buildRejected();
      if (init.searched) { this.$('[data-in="mced"]').value = this.s.cedula; this.search(); }
      if (init.scrollTo) {
        const go = () => this.scrollToSec(init.scrollTo, true);
        go(); requestAnimationFrame(go); window.addEventListener('load', go, { once: true }); document.fonts && document.fonts.ready.then(go);
      }
    }

    destroy() { this.dead = true; this.fxio && this.fxio.disconnect(); this.timers.forEach(clearTimeout); this.io && this.io.disconnect(); this.ro && this.ro.disconnect(); this.ro2 && this.ro2.disconnect(); this.io2 && this.io2.disconnect(); cancelAnimationFrame(this.raf); }
    later(fn, ms) { const t = setTimeout(fn, ms); this.timers.push(t); return t; }

    bind() {
      this.el.addEventListener('click', e => {
        const a = e.target.closest('[data-action]');
        if (a) return this.act(a.dataset.action, a);
        const g = e.target.closest('[data-num]');
        if (g) return this.togglePick(g.dataset.num);
        const ab = e.target.closest('.acc__item > button');
        if (ab) {
          const list = [...ab.closest('.acc').querySelectorAll('.acc__item > button')], was = ab.getAttribute('aria-expanded') === 'true';
          list.forEach(b => { const on = b === ab && !was; b.setAttribute('aria-expanded', on); this.el.querySelector('#' + b.getAttribute('aria-controls')).hidden = !on; });
          return;
        }
        const x = e.target.closest('[data-unpick]');
        if (x) return this.togglePick(x.dataset.unpick);
        if (e.target.closest('[data-board-bg]')) return this.board(false);
        const ca = e.target.closest('[data-copy-all]');
        if (ca) return this.copyAll(ca);
        const cp = e.target.closest('[data-copy]');
        if (cp) this.copy(cp);
      });
      this.el.addEventListener('input', e => this.onInput(e.target));
      this.el.addEventListener('change', e => {
        const t = e.target, k = t.dataset.in;
        if (k === 'bank') this.s.bank = t.value;
        if (k === 'estado') { this.s.estado = t.value; t.classList.remove('is-bad'); }
        if (k === 'file') {
          const f = t.files && t.files[0], err = this.$('[data-err="pay"]');
          const bad = !f ? '' : !(/^image\//.test(f.type) || /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) ? 'El comprobante debe ser una foto, una captura o un PDF.'
            : f.size > 10 * 1024 * 1024 ? 'El comprobante pesa más de 10 MB. Sube una foto o captura más liviana.' : '';
          if (bad) { t.value = ''; err.textContent = bad; err.hidden = false; } else if (f) err.hidden = true;
          this.s.file = f && !bad ? f.name : '';
          this.fileObj = f && !bad ? f : null;
          this.renderFile();
        }
      });
      this.el.addEventListener('keydown', e => {
        if (e.key === 'Escape') { if (!this.$('[data-board]').hidden) this.board(false); if (!this.$('[data-lightbox]').hidden) this.flyer(false); }
        if (e.key === 'Enter' && e.target.dataset.in === 'mced') { e.preventDefault(); this.search(); }
      });
    }

    act(name, a) {
      const s = this.s;
      switch (name) {
        case 'theme': return toggleTheme(this.device);
        case 'to-buy': return this.scrollToSec('buy');
        case 'go': return this.scrollToSec(a.dataset.to);
        case 'mode': s.mode = a.dataset.mode; return this.renderPick();
        case 'quick': s.qty = +a.dataset.q; return this.syncQty();
        case 'inc': s.qty = (Number.isInteger(s.qty) && s.qty > 0 ? s.qty : 0) + 1; return this.syncQty();
        case 'dec': s.qty = Math.max(1, (Number.isInteger(s.qty) ? s.qty : 2) - 1); return this.syncQty();
        case 'board': return this.board(true);
        case 'board-close': return this.board(false);
        case 'series': s.series = +a.dataset.i; s.search = ''; this.$('[data-in="search"]').value = ''; return this.renderGrid(true);
        case 'rand': return this.addRandom(+a.dataset.n);
        case 'participar': return this.participar();
        case 'to-pick': return this.stage('pick');
        case 'to-data': return this.stage('data');
        case 'to-pay': return this.toPay();
        case 'idtype': s.idType = a.dataset.t; a.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', b === a)); return;
        case 'method': s.method = a.dataset.m; return this.renderMethod();
        case 'confirm': return this.confirm();
        case 'fix-pay': this.show('home'); this.stage('pay', true); this.scrollToSec('buy', true); this.$('[data-in="ref"]').classList.add('is-bad'); this.$('[data-in="ref"]').focus({ preventScroll: true }); return;
        case 'again': Object.assign(s, { picks: [], mode: 'random', ref: '', file: '' }); this.syncInputs(); this.show('home'); this.stage('pick', true); return this.scrollToSec('buy', true);
        case 'home': return this.show('home');
        case 'mine': this.show('mine'); if (this.s.cedula) { this.$('[data-in="mced"]').value = this.s.cedula; this.search(); } return;
        case 'search': return this.search();
        case 'g-prev': return this.goSlide(this.slide - 1);
        case 'g-next': return this.goSlide(this.slide + 1);
        case 'g-go': return this.goSlide(+a.dataset.i);
        case 'flyer': this.flyer(true); this.$('[data-action="close-flyer"]').focus(); return;
        case 'close-flyer': this.flyer(false); this.$('[data-action="flyer"]').focus(); return;
      }
    }

    /* ---- stages of the purchase box ---- */
    count() { return this.s.mode === 'manual' ? this.s.picks.length : (Number.isInteger(this.s.qty) ? this.s.qty : 0); }
    stage(name, instant) {
      this.s.stage = name;
      this.$$('[data-stage]').forEach(st => {
        const on = st.dataset.stage === name;
        st.hidden = !on;
        st.classList.toggle('is-in', on && !instant && !reduce);
      });
      this.$('[data-err="data"]').hidden = true; this.$('[data-err="pay"]').hidden = true;
      if (name === 'pay') this.renderMethod();
      if (!instant) this.scrollToSec('buy');
      this.renderTotals();
    }
    participar() {
      const s = this.s;
      if (s.mode === 'manual') {
        if (!s.picks.length) { const h = this.$('[data-manual-hint]'); h.textContent = 'Elige al menos un número en el tablero para participar.'; h.classList.add('err'); return; }
      } else if (!this.qtyOk()) { this.syncQty(); this.$('[data-in="qty"]').focus(); return; }
      this.stage('data');
    }
    toPay() {
      const s = this.s, bad = [];
      if (!/^\d{6,9}$/.test(s.cedula)) bad.push(['cedula', 'tu cédula, solo números (de 6 a 9 dígitos)']);
      if (s.name.trim().length < 3) bad.push(['name', 'tu nombre y apellido']);
      if (s.phone.replace(/\D/g, '').length !== 11) bad.push(['phone', 'tu teléfono de 11 dígitos, por ejemplo 0414-555-2190']);
      if (!s.estado) bad.push(['estado', 'tu estado']);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email.trim())) bad.push(['email', 'tu correo: ahí te enviamos tus números']);
      bad.forEach(([k]) => this.$(`[data-in="${k}"]`).classList.add('is-bad'));
      const err = this.$('[data-err="data"]');
      if (bad.length) { err.textContent = 'Falta ' + bad[0][1] + '.'; err.hidden = false; this.$(`[data-in="${bad[0][0]}"]`).focus(); return; }
      this.stage('pay');
    }
    confirm() {
      const s = this.s, err = this.$('[data-err="pay"]'), m = methodOf(s.method);
      let msg = '', field = '';
      if (m.askPayer && s.payer.replace(/\D/g, '').length !== 11) { msg = 'Escribe el teléfono desde el que hiciste el Pago Móvil (11 dígitos).'; field = 'payer'; }
      else if (s.ref.trim().length < 4) { msg = `Escribe ${m.ref.error} de tu pago (al menos 4 caracteres).`; field = 'ref'; }
      else if (m.requireReceipt && !s.file) { msg = 'Sube el comprobante de tu pago: una foto, una captura o un PDF. Sin él, el rifero no puede revisar tu pago.'; field = 'file'; }
      if (msg) {
        err.textContent = msg; err.hidden = false;
        const f = this.$(`[data-in="${field}"]`);
        (field === 'file' ? this.$('[data-upload]') : f).classList.add('is-bad');
        f.focus(); return;
      }
      err.hidden = true;
      this.verify(false);
    }

    /* ---- tickets ---- */
    maxQty() { return Math.min(500, CFG.total - soldNow()); }
    qtyOk() { return Number.isInteger(this.s.qty) && this.s.qty >= 1 && this.s.qty <= this.maxQty(); }
    syncQty(fromTyping) {
      const s = this.s, ok = Number.isInteger(s.qty) && s.qty >= 1, max = this.maxQty();
      const inp = this.$('[data-in="qty"]');
      if (!fromTyping) inp.value = ok ? s.qty : '';
      this.$$('[data-action="quick"]').forEach(b => b.setAttribute('aria-pressed', ok && +b.dataset.q === s.qty));
      const err = this.$('[data-err="qty"]');
      const msg = !ok ? 'Escribe una cantidad entera de 1 o más.' : s.qty > max ? `El máximo por compra es ${num(max)} boletos.` : '';
      err.textContent = msg; err.hidden = !msg; inp.classList.toggle('is-bad', !!msg);
      this.renderTotals();
    }
    renderPick() {
      const m = this.s.mode;
      this.$$('[data-action="mode"]').forEach(b => b.setAttribute('aria-checked', b.dataset.mode === m));
      this.$('[data-panel="random"]').hidden = m !== 'random';
      this.$('[data-panel="manual"]').hidden = m !== 'manual';
      this.renderPicks(); this.renderTotals();
    }
    renderPicks() {
      const s = this.s, n = s.picks.length, h = this.$('[data-manual-hint]');
      this.$('[data-picks]').innerHTML = s.picks.map(k => `<li>${k}<button type="button" data-unpick="${k}" aria-label="Quitar el ${k}">×</button></li>`).join('');
      h.classList.remove('err');
      h.textContent = n ? `Elegiste ${n === 1 ? '1 número' : n + ' números'}. Toca × para quitar uno.` : 'Abre el tablero y toca los números que quieres.';
      this.$('[data-action="board"]').textContent = n ? 'Elegir más números' : 'Elegir mis números';
      const done = this.$('[data-board-done]'); if (done) done.textContent = n ? `Listo · ${n === 1 ? '1 número' : n + ' números'} · Bs ${num(n * CFG.price)}` : 'Listo';
    }
    togglePick(k) {
      const s = this.s, i = s.picks.indexOf(k);
      if (i >= 0) s.picks.splice(i, 1);
      else { if (taken(+k)) return; if (s.picks.length >= 500) return; s.picks.push(k); }
      const b = this.$(`[data-num="${k}"]`); if (b) b.setAttribute('aria-pressed', i < 0);
      this.renderPicks(); this.renderTotals();
    }
    addRandom(n) {
      const s = this.s; let seed = (Date.now() + s.picks.length * 97) % CFG.total;
      for (let added = 0, guard = 0; added < n && guard < CFG.total; guard++) {
        seed = (seed * 7 + 3137) % CFG.total; const k = pad(seed);
        if (!taken(seed) && !s.picks.includes(k)) { s.picks.push(k); added++; }
      }
      this.renderGrid(); this.renderPicks(); this.renderTotals();
    }
    board(on) {
      this.$('[data-board]').hidden = !on; this.$('[data-board-bg]').hidden = !on;
      if (on) { this.renderGrid(true); this.renderPicks(); this.$('[data-board] .board__x').focus({ preventScroll: true }); }
      else if (this.s.mode === 'manual' && this.s.stage === 'pick') this.$('[data-action="board"]').focus({ preventScroll: true });
    }
    renderGrid(resetScroll) {
      const s = this.s, q = s.search, grid = this.$('[data-grid]');
      let list = [];
      if (q) { for (let i = 0; i < CFG.total && list.length < 120; i++) { const k = pad(i); if (k.includes(q)) list.push(i); } }
      else { const a = s.series * D.series; for (let i = a; i < a + D.series; i++) list.push(i); }
      this.$$('[data-action="series"]').forEach(b => b.setAttribute('aria-pressed', !q && +b.dataset.i === s.series));
      grid.innerHTML = list.length ? list.map(i => { const k = pad(i), t = taken(i); return `<button type="button" data-num="${k}" aria-pressed="${s.picks.includes(k)}"${t ? ' disabled aria-label="' + k + ', vendido"' : ''}>${k}</button>`; }).join('')
        : `<p class="grid__empty">No hay números que contengan “${esc(q)}”.</p>`;
      if (resetScroll) grid.scrollTop = 0;
    }

    renderTotals() {
      const q = this.count(), tot = withFee(q * CFG.price), f = serviceFee();
      this.$$('[data-go-bs]').forEach(n => n.textContent = bs(tot));
      this.$$('[data-go-usd]').forEach(n => n.textContent = `${usd(tot / CFG.rate)} · tasa BCV Bs ${num(CFG.rate, 2)}${f ? ` · incluye ${pct(f)} de servicio` : ''}`);
      this.$$('[data-qword]').forEach(n => n.textContent = boletos(q));
      this.$('[data-action="participar"]').disabled = q < 1;
      this.renderPaybox();
    }

    /* ---- buyer data ---- */
    onInput(t) {
      const s = this.s, k = t.dataset.in;
      if (!k) return;
      if (k === 'qty') {
        const clean = t.value.replace(/\D/g, '');
        if (clean !== t.value) t.value = clean;
        s.qty = clean === '' ? NaN : parseInt(clean, 10);
        this.syncQty(true);
      } else if (k === 'search') {
        t.value = t.value.replace(/\D/g, '').slice(0, D.digits); s.search = t.value; this.renderGrid(true);
      } else if (k === 'mced') {
        t.value = t.value.replace(/\D/g, '').slice(0, 9);
      } else if (k === 'cedula') {
        t.value = t.value.replace(/\D/g, '').slice(0, 9);
        s.cedula = t.value; t.classList.remove('is-bad');
        const lk = this.$('[data-lookup]'), seq = this.lkSeq = (this.lkSeq || 0) + 1;
        if (s.cedula.length >= 6) {
          lk.className = 'lookup'; lk.innerHTML = '<span class="spin" aria-hidden="true"></span>Buscando tus datos…';
          const stale = () => seq !== this.lkSeq || this.dead;
          // one lookup per cédula: wait until the typing stops
          setTimeout(() => stale() || CONEXION.buscarCliente(s.idType + s.cedula).then(p => {
            if (stale()) return;
            if (p) this.fillPerson(p, true); else { lk.className = 'lookup'; lk.textContent = 'No encontramos esa cédula. Escribe tus datos.'; }
          }, () => { if (!stale()) { lk.className = 'lookup'; lk.textContent = 'No pudimos buscar tus datos. Escríbelos tú.'; } }), 400);
        } else { lk.className = 'lookup'; lk.textContent = 'Con tu cédula llenamos el resto.'; }
      } else if (['name', 'phone', 'email', 'ref', 'payer'].includes(k)) {
        s[k] = t.value; t.classList.remove('is-bad');
      }
    }
    fillPerson(p, animate) {
      Object.assign(this.s, { name: p.name, phone: p.phone, email: p.email });
      const lk = this.$('[data-lookup]');
      lk.className = 'lookup is-ok';
      lk.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor"/></svg>Encontramos tus datos. Revísalos.';
      ['name', 'phone', 'email'].forEach((k, i) => {
        const f = this.$(`[data-in="${k}"]`);
        f.value = this.s[k]; f.classList.remove('is-bad', 'is-filled');
        if (animate && !reduce) { void f.offsetWidth; f.style.animationDelay = i * 90 + 'ms'; f.classList.add('is-filled'); }
      });
    }
    syncInputs() {
      const s = this.s;
      this.$('[data-in="cedula"]').value = s.cedula;
      this.$('[data-in="estado"]').value = s.estado;
      this.$('[data-in="ref"]').value = s.ref;
      this.$('[data-in="payer"]').value = s.payer;
      this.$('[data-in="bank"]').value = s.bank;
      this.syncQty(); this.renderPick(); this.renderMethod(); this.renderFile();
    }

    /* ---- payment ---- */
    renderMethod() {
      const q = this.count();
      // a method can ask for a minimum of tickets; below it the button turns off and another one is picked
      this.$$('[data-action="method"]').forEach(b => { b.disabled = q < methodOf(b.dataset.m).minTickets; });
      if (q < methodOf(this.s.method).minTickets) { const ok = D.pays.find(x => q >= x.minTickets); if (ok) this.s.method = ok.id; }
      const m = methodOf(this.s.method);
      this.$$('[data-action="method"]').forEach(b => b.setAttribute('aria-checked', b.dataset.m === m.id));
      this.$('[data-f="payer"]').hidden = !m.askPayer;
      this.$('[data-f="bank"]').hidden = !m.askBank;
      this.$('[data-f="file"]').hidden = !m.requireReceipt;
      this.$('[data-ref-label]').textContent = m.ref.label;
      const r = this.$('[data-in="ref"]'); r.placeholder = m.ref.placeholder; r.inputMode = m.ref.numeric ? 'numeric' : 'text';
      this.renderPaybox();
    }
    /* What to pay with this method: the total in Bs plus the platform's service fee, turned into its currency
       (BCV rate, and config fx outside the dollar), plus the method's own commission if it has one. */
    amount(m, totBs) {
      totBs = withFee(totBs);
      const c = PAGOS.CURRENCIES[m.currency], k = 1 + m.commissionRate / 100, inUsd = totBs / CFG.rate;
      const fx = CFG.fx || {};
      const v = m.currency === 'VES' ? totBs * k : ['USD', 'USDT'].includes(m.currency) ? inUsd * k : fx[m.currency] ? inUsd * fx[m.currency] * k : null;
      return v == null ? usd(inUsd * k) + ' (equivalente)' : c.prefix + num(v, c.decimals) + c.suffix;
    }
    renderPaybox() {
      const m = methodOf(this.s.method);
      const rows = [...m.accountInfo, ...(serviceFee() ? [['Comisión de servicio', `${pct(serviceFee())} incluida`]] : []),
        ...(m.commissionRate ? [['Comisión', `${pct(m.commissionRate)} incluida`]] : []), ['Monto exacto', this.amount(m, this.count() * CFG.price)]];
      const all = [`Pago a ${CFG.rifero} por ${m.name}`, ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n');
      this.$('[data-paybox]').innerHTML = `<p class="paybox__brand" style="--mc:${esc(m.color)}"><i aria-hidden="true"></i>Paga con ${esc(m.name)}</p>
        ${m.instructions ? `<p class="paybox__how">${esc(m.instructions)}</p>` : ''}
        <table aria-label="Datos para pagar con ${esc(m.name)}"><tbody>${rows.map(([k, v]) =>
        `<tr><td>${esc(k)}</td><td>${esc(v)}</td><td><button type="button" class="copy" data-copy="${esc(v)}" aria-label="Copiar ${esc(k.toLowerCase())}">Copiar</button></td></tr>`).join('')}</tbody></table>
        <button type="button" class="copyall" data-copy-all="${esc(all)}">${COPY_ICON}<span>Copiar todos los datos</span></button>`;
    }
    renderFile() {
      this.$('[data-upload]').classList.toggle('has-file', !!this.s.file);
      if (this.s.file) this.$('[data-upload]').classList.remove('is-bad');
      this.$('[data-file-name]').textContent = this.s.file ? 'Comprobante cargado' : 'Subir comprobante';
      this.$('[data-file-sub]').textContent = this.s.file ? 'Toca aquí si quieres cambiarlo.' : 'Obligatorio. Foto, captura o PDF del pago.';
    }
    copy(btn) {
      const text = btn.dataset.copy.replace(/^Bs /, '');
      const done = () => { btn.textContent = 'Copiado'; btn.classList.add('is-done'); this.later(() => { btn.textContent = 'Copiar'; btn.classList.remove('is-done'); }, 1600); };
      try { navigator.clipboard.writeText(text).then(done, done); } catch (e) { done(); }
    }
    copyAll(btn) {
      const label = btn.querySelector('span');
      const done = () => { label.textContent = 'Datos copiados'; btn.classList.add('is-done'); this.later(() => { label.textContent = 'Copiar todos los datos'; btn.classList.remove('is-done'); }, 1800); };
      try { navigator.clipboard.writeText(btn.dataset.copyAll).then(done, done); } catch (e) { done(); }
    }
    verify(hold) {
      const s = this.s, m = methodOf(s.method);
      this.$('[data-verify-line]').innerHTML = `${esc(m.name)} · ref. ${esc(s.ref || '—')} · <b>${this.amount(m, this.count() * CFG.price)}</b>`;
      this.$('[data-verify-note]').textContent = m.isOnline ? 'Esto toma unos segundos. No cierres esta pantalla.' : 'El rifero revisa tu pago desde su panel y lo aprueba o lo rechaza.';
      this.$('[data-verify] h2').textContent = m.isOnline ? 'Verificando tu pago' : 'Enviando tu comprobante';
      this.$('[data-verify]').hidden = false;
      this.el.classList.add('is-dark-top');
      if (hold) return;
      const done = res => {
        if (this.dead) return;
        this.$('[data-verify]').hidden = true; this.el.classList.remove('is-dark-top');
        this.result = res || {};
        const out = { aprobado: 'ok', reservado: 'held' }[this.result.estado] || 'rej';
        this.show(out);
        if (out === 'ok') this.buildSuccess(true); else if (out === 'held') this.buildHeld(); else this.buildRejected();
      };
      CONEXION.enviarPago(this.order()).then(done, () => done({ estado: 'rechazado' }));
    }
    /* The purchase as it goes to the platform. The server recalculates the total with the real price
       and checks that the chosen numbers are still free. */
    order() {
      const s = this.s, m = methodOf(s.method), q = this.count();
      return {
        metodo: m.id, cantidad: q, modo: s.mode, numeros: s.mode === 'manual' ? [...s.picks] : [],
        cedula: s.idType + s.cedula, nombre: s.name.trim(), telefono: s.phone, correo: s.email.trim(), estado: s.estado,
        referencia: s.ref.trim(), telefonoPago: m.askPayer ? s.payer : '', banco: m.askBank ? s.bank : '',
        comprobante: m.requireReceipt ? this.fileObj || null : null,
        moneda: m.currency, monto: this.amount(m, q * CFG.price), montoBs: q * CFG.price
      };
    }

    /* ---- views ---- */
    show(view) {
      this.s.view = view;
      this.el.dataset.view = view;
      this.$$('[data-v]').forEach(v => v.hidden = v.dataset.v !== view);
      if (view === 'ok') this.$('[data-ok-scroller]').scrollTop = 0;
    }
    flyer(on) {
      this.$('[data-lightbox]').hidden = !on; this.el.classList.toggle('is-dark-top', on);
      if (on) { const box = this.$('[data-lb-scroll]'), img = box.children[this.slide || 0]; box.scrollTop = img ? img.offsetTop : 0; }
    }
    /* Photo carousel: swipe on phones, arrows and dots for everyone. */
    setupGallery() {
      const track = this.$('[data-slides]');
      this.slide = 0;
      this.$$('.slide img').forEach(img => { const set = () => img.classList.toggle('is-tall', img.naturalHeight > img.naturalWidth * 1.05); img.complete ? set() : img.addEventListener('load', set, { once: true }); });
      track.addEventListener('scroll', () => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== this.slide) { this.slide = i; this.paintGallery(); }
      }, { passive: true });
      track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') this.goSlide(this.slide + 1); if (e.key === 'ArrowLeft') this.goSlide(this.slide - 1); });
    }
    goSlide(i, instant) {
      const track = this.$('[data-slides]'), n = track.children.length;
      i = Math.max(0, Math.min(n - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: instant || reduce ? 'auto' : 'smooth' });
      this.slide = i; this.paintGallery();
    }
    paintGallery() {
      const n = this.$('[data-slides]').children.length, c = this.$('[data-gal-count]');
      if (!c) return;
      c.textContent = `${this.slide + 1} / ${n}`;
      this.$('[data-action="g-prev"]').disabled = this.slide === 0;
      this.$('[data-action="g-next"]').disabled = this.slide === n - 1;
      this.$$('[data-action="g-go"]').forEach(d => d.setAttribute('aria-current', +d.dataset.i === this.slide));
    }
    /* Computer or phone. In this showcase the Mac frames pick the computer layout (class "desk"); on the real page
       it is picked for a window 900px or wider that isn't a phone. Between 600 and 900px the phone layout is centred ("mid"). */
    setupDesk(screen) {
      const inFrame = !!screen.closest('.device');
      const fit = () => {
        const w = screen.clientWidth, was = this.desk;
        this.desk = inFrame ? document.documentElement.dataset.device === 'mac' : !PHONE && w >= 900;
        this.el.classList.toggle('desk', this.desk);
        this.el.classList.toggle('mid', !inFrame && !this.desk && w >= 600);
        this.el.style.setProperty('--vh', this.sc.clientHeight + 'px');
        if (was === undefined) return;
        if (was !== this.desk && this.slide != null) this.goSlide(this.slide, true);
        this.fitBuy();
      };
      fit();
      if (!inFrame) { this.ro = new ResizeObserver(fit); this.ro.observe(screen); }
    }
    /* On a computer the purchase box stays in view beside the prizes; when it is taller than the window
       it sticks lower, so its last button can always be reached. */
    fitBuy() {
      const buy = this.$('[data-sec="buy"]');
      if (!buy) return;
      const room = this.sc.clientHeight - 24, h = buy.offsetHeight, top = 96;
      buy.style.setProperty('--buy-top', (this.desk && h + top > room ? room - h : top) + 'px');
    }
    scrollToSec(key, instant) {
      const t = this.$(`[data-sec="${key}"]`);
      if (!t) return;
      if (this.openSection) this.openSection(t);
      let y = 0, n = t;
      while (n && n !== this.sc) { y += n.offsetTop; n = n.offsetParent; }
      const top = Math.max(0, y - (this.secOffset ? this.secOffset() : this.desk ? 96 : 60));
      if (instant || reduce) this.sc.scrollTop = top; else this.sc.scrollTo({ top, behavior: 'smooth' });
    }

    buildHeld() {
      const s = this.s, q = Math.max(1, this.count()), p = s.name ? s : PEOPLE[0], m = methodOf(s.method), tot = q * CFG.price, r = this.result || {};
      const chosen = s.mode === 'manual' && s.picks.length > 0, first = esc(p.name.split(' ')[0]), mail = esc(p.email);
      this.$('[data-held-lede]').innerHTML = chosen
        ? `${first}, apartamos los <b>${q === 1 ? 'el número' : q + ' números'}</b> que elegiste mientras ${esc(CFG.rifero)} revisa tu pago por ${esc(m.name)}.`.replace('los <b>el número</b>', 'el <b>número</b>')
        : `${first}, tu compra de <b>${boletos(q)}</b> está en revisión: ${esc(CFG.rifero)} verifica tu pago por ${esc(m.name)}.`;
      this.$('[data-held-box]').hidden = !chosen;
      this.$('[data-held-random]').hidden = chosen;
      if (chosen) {
        this.$('[data-held-title]').textContent = q === 1 ? 'Tu número, esperando confirmación' : `Tus ${q} números, esperando confirmación`;
        this.$('[data-held-nums]').innerHTML = s.picks.map(n => `<li><b>${n}</b><span>Por confirmar</span></li>`).join('');
      } else {
        this.$('[data-held-random-txt]').innerHTML = `<b>Tus números llegan por correo</b>Como elegiste al azar, se asignan cuando se apruebe el pago y te los enviamos a <b>${mail}</b>.`;
      }
      this.$('[data-held-sent]').innerHTML = chosen
        ? `Cuando se apruebe, te enviamos la confirmación a <b>${mail}</b>. Si se rechaza, te escribimos al mismo correo para corregirlo.`
        : `Si el pago se rechaza, te escribimos a <b>${mail}</b> para corregirlo.`;
      const order = [['Orden', r.orden || 'LG-' + (48100 + q * 7)], ['Números', chosen ? s.picks.join(', ') : 'Al azar, al aprobar'], ['Método', m.name], ['Referencia', s.ref || '—'], ['Comprobante', s.file ? 'Cargado' : 'No adjuntado'], ['Total', this.amount(m, tot)], ['Estado', 'Por verificar']];
      this.$('[data-held-order]').innerHTML = order.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join('');
      this.$('[data-held-scroller]').scrollTop = 0;
    }
    buildRejected() {
      const s = this.s, m = methodOf(s.method), amt = this.amount(m, this.count() * CFG.price);
      this.$('[data-rej-lede]').innerHTML = m.isOnline
        ? `El banco no encontró un ${esc(m.name)} de <b>${amt}</b> con la referencia <b>${esc(s.ref || '—')}</b> desde el <b>${esc(s.payer || '—')}</b> (${esc(s.bank)}).`
        : `No pudimos registrar tu pago por ${esc(m.name)} de <b>${amt}</b> con la referencia <b>${esc(s.ref || '—')}</b>. Revisa los datos e intenta de nuevo.`;
      this.$('[data-rej-payer]').hidden = !m.askPayer;
      this.$('[data-rej-scroller]').scrollTop = 0;
    }

    pickNumbers(q, seedBase) {
      const nums = [...this.s.picks];
      let seed = seedBase + q * 37, guard = 0;
      while (nums.length < q && guard++ < 50000) { seed = (seed * 1103515245 + 12345) % 2147483648; const n = seed % CFG.total, k = pad(n); if (!taken(n) && !nums.includes(k)) nums.push(k); }
      return nums;
    }
    buildSuccess(playNow) {
      const s = this.s, q = Math.max(1, this.count()), p = s.name ? s : PEOPLE[0], r = this.result || {};
      const nums = r.numeros && r.numeros.length ? r.numeros.map(String) : this.pickNumbers(q, 4821);
      const digits = n => [...n].map(d => `<i data-d="${d}">${d}</i>`).join('');
      this.$('[data-ok-lede]').innerHTML = `${esc(p.name.split(' ')[0])}, ${q === 1 ? 'tu boleto ya está' : `tus <b>${q} boletos</b> ya están`} en el sorteo del <b>${D.long}</b>.`;
      this.$('[data-ok-sent]').innerHTML = `Te enviamos tus números a tu correo <b>${esc(p.email)}</b>.`;
      const big = this.$('[data-big-num]'); big.innerHTML = digits(nums[0]); big.setAttribute('aria-label', 'Número ' + nums[0]);
      this.$('[data-stubs-wrap]').hidden = q < 2;
      this.$('[data-stubs-title]').textContent = q === 2 ? 'Tu otro número' : `Tus otros ${q - 1} números`;
      this.$('[data-stubs]').innerHTML = nums.slice(1).map(n => `<li><span class="num" aria-label="Número ${n}">${digits(n)}</span></li>`).join('');
      this.$('[data-barcode]').innerHTML = barcode(nums[0]);
      const m = methodOf(s.method), tot = q * CFG.price;
      const order = [['Orden', r.orden || 'LG-' + (48000 + q * 7)], ['Método', m.name], ['Referencia', s.ref || '004821'], ['Total', bs(withFee(tot))], ['En dólares', usd(withFee(tot) / CFG.rate)]];
      this.$('[data-order]').innerHTML = order.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join('');
      this.okPlayed = false;
      if (playNow) this.celebrate(); else this.whenVisible(() => this.celebrate());
    }
    celebrate() {
      if (this.okPlayed || reduce) return; this.okPlayed = true;
      this.$$('[data-v="ok"] .num i').forEach((c, i) => {
        const end = c.dataset.d, stop = 500 + Math.min(i, 24) * 70, t0 = performance.now();
        const spin = () => { if (performance.now() - t0 >= stop) { c.textContent = end; c.classList.add('is-set'); return; } c.textContent = Math.floor(Math.random() * 10); this.later(spin, 55); };
        spin();
      });
      confetti(this.$('[data-confetti]'), this);
    }
    whenVisible(fn) {
      this.io2 = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { this.io2.disconnect(); fn(); } }, { threshold: .35 });
      this.io2.observe(this.device);
    }
    search() {
      const inp = this.$('[data-in="mced"]'), err = this.$('[data-err="mine"]'), res = this.$('[data-mine-res]');
      const ced = inp.value;
      if (!/^\d{6,9}$/.test(ced)) { err.textContent = 'Escribe tu cédula, solo números (de 6 a 9 dígitos).'; err.hidden = false; inp.classList.add('is-bad'); res.innerHTML = ''; return; }
      err.hidden = true; inp.classList.remove('is-bad');
      res.innerHTML = '<p class="lookup"><span class="spin" aria-hidden="true"></span>Buscando tus boletos…</p>';
      const idt = (this.$('[data-v="mine"] [data-action="idtype"][aria-checked="true"]') || { dataset: { t: 'V' } }).dataset.t;
      CONEXION.misBoletos(idt + ced).then(r => { if (!this.dead) res.innerHTML = ordersHTML(r); },
        () => { if (!this.dead) res.innerHTML = '<p class="err">No pudimos buscar tus boletos. Intenta de nuevo en un momento.</p>'; });
    }
    setupHome() {
      const bar = this.$('[data-buybar]'), heroBuy = this.$('[data-hero-buy]'), buy = this.$('[data-sec="buy"]');
      const seen = new Set();
      const sync = () => { const on = !seen.has(heroBuy) && !seen.has(buy) && this.sc.scrollTop > 200; bar.classList.toggle('is-on', on); bar.querySelector('button').tabIndex = on ? 0 : -1; };
      this.io = new IntersectionObserver(es => es.forEach(e => {
        if (e.target === heroBuy || e.target === buy) { e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); return sync(); }
        if (e.isIntersecting && !reduce) { [...e.target.children].forEach((c, i) => { c.style.animationDelay = i * 75 + 'ms'; c.classList.add('rise'); }); this.io.unobserve(e.target); }
      }), { root: this.sc, rootMargin: '0px 0px 60px 0px' });
      this.$$('[data-reveal]').forEach(n => this.io.observe(n));
      this.io.observe(heroBuy); this.io.observe(buy);
      this.ro2 = new ResizeObserver(() => this.fitBuy()); this.ro2.observe(buy); this.ro2.observe(this.sc);
      this.sc.addEventListener('scroll', sync, { passive: true });
    }
  }

  function barcode(seedStr) {
    let x = 0, seed = +seedStr + 97, out = '';
    while (x < 90) { seed = (seed * 69069 + 1) % 4294967296; const w = 1 + (seed >>> 8) % 3; out += `<rect x="${x}" y="0" width="${w}" height="56"/>`; x += w + 1 + (seed >>> 16) % 3; }
    return out;
  }

  function confetti(cv, app) {
    const W = cv.width = cv.offsetWidth * 2, H = cv.height = cv.offsetHeight * 2;
    const ctx = cv.getContext('2d'), cs = getComputedStyle(app.el);
    const cols = ['--accent', '--ink', '--surface-2', '--good'].map(v => cs.getPropertyValue(v).trim() || '#e9b227');
    const P = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .2, vx: (Math.random() - .5) * 26, vy: -Math.random() * 30 - 8,
      w: 8 + Math.random() * 10, h: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    const frame = t => {
      ctx.clearRect(0, 0, W, H);
      P.forEach(p => { p.vy += .9; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
      if (t - t0 < 3200) app.raf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    };
    app.raf = requestAnimationFrame(frame);
  }

  /* ---------- tema claro / oscuro ---------- */
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  function toggleTheme() { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; }

  /* ---------- montar la página ----------
     Si la plataforma necesita traer datos antes de mostrar la página (la rifa, la tasa, los métodos de pago),
     define window.LOTTOGE_ANTES como una promesa: la página espera a que termine y vuelve a leer LOTTOGE_RIFA. */
  const host = document.getElementById('app');
  Promise.resolve(window.LOTTOGE_ANTES).catch(() => {}).then(() => {
    CFG = Object.assign(JSON.parse(JSON.stringify(SAMPLE)), window.LOTTOGE_RIFA || {});
    D = derive(CFG);
    // color de la marca: un nombre de ACCENTS o un hex propio
    const [ac, aci] = ACCENTS[CFG.accent] || [CFG.accent, CFG.accentInk || '#ffffff'];
    document.documentElement.style.setProperty('--accent', ac);
    document.documentElement.style.setProperty('--accent-ink', aci);
    document.title = `${CFG.prize} · ${CFG.rifero}`;
    new App(host, { view: 'home' }, host);
  });
})();
