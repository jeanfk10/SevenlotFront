/* LottoX · entorno de pruebas · conexión de los fronts de venta con el servidor simulado
   Es el mismo contrato que comun/conexion.ejemplo.js del kit (LOTTOGE_ANTES y LOTTOGE_CONEXION), pero las
   rutas las responde LottoAPI.http() en el navegador en vez de api.lottoge.net. Lo que se compra aquí
   aparece en el panel (Ventas › Pagos por verificar) y lo que se cambia en el panel se ve aquí.

   Parámetros de la dirección: ?rifa=R-101 (por defecto, la rifa publicada en Ajustes › Sitio web)
   y ?borrador=1 (usa los colores y textos sin publicar, para la vista previa del panel). */
(() => {
  const API = window.LottoAPI;
  const RIFA = window.LOTTOGE_RIFA = window.LOTTOGE_RIFA || {};
  const PAGOS = window.LOTTOGE_PAGOS;
  const get = path => API.http('GET', path).then(r => r.data);
  const post = (path, body) => API.http('POST', path, body).then(r => r.data);
  const url = new URLSearchParams(location.search);
  const db = API.db, site = url.get('borrador') ? db.site : db.sitePublished;
  RIFA.companyId = db.company.id;
  RIFA.raffleId = /^[\w-]{1,64}$/.test(url.get('rifa') || '') ? url.get('rifa') : site.raffleId;

  const vendidos = new Set();
  const h12 = t => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  const corto = n => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[1][0]}.` : p[0] || 'Cliente'; };

  window.LOTTOGE_ANTES = (async () => {
    const { companyId, raffleId } = RIFA;
    const [rifa, tasa, comision, metodos, tomados] = await Promise.all([
      get(`/raffles/${raffleId}`),
      get('/exchange-rate/current').catch(() => null),
      get(`/companies/${companyId}/service-fee-public`).catch(() => null),
      get(`/payment-methods/active?companyId=${companyId}`),
      get(`/raffles/${raffleId}/taken`).catch(() => [])
    ]);
    if (!rifa.onSale) throw Object.assign(new Error('Cerrada'), { status: 'cerrada', rifa });
    if (tasa && tasa.rate) RIFA.rate = +tasa.rate;
    if (comision && comision.serviceFeeRate != null) RIFA.serviceFee = +comision.serviceFeeRate;
    if (!metodos || !metodos.length) throw Object.assign(new Error('Sin métodos de pago activos'), { status: 'sin-metodos' });
    RIFA.paymentMethods = metodos.map(PAGOS.fromApi);
    const ve = new Date(new Date(rifa.drawDate).getTime() - 4 * 3600e3).toISOString();
    const orders = db.orders.filter(o => o.raffleId === raffleId && o.status === 'aprobada');
    const top = {}; orders.forEach(o => { top[o.cedula] = top[o.cedula] || [corto(o.name), (API.client(o.cedula) || {}).municipality || '', 0]; top[o.cedula][2] += o.qty; });
    const accents = { propio: site.accentCustom };
    Object.assign(RIFA, {
      rifero: site.rifero || db.company.name, handle: site.handle || db.company.instagram, support: site.support || db.company.email,
      conalot: db.company.runlot, prize: rifa.prize, prizeExtra: '', second: rifa.prizes[1] || '', third: rifa.prizes[2] || '',
      price: Math.round(rifa.ticketPrice * RIFA.rate), total: rifa.totalNumbers,
      soldPct: Math.round((rifa.soldTickets + rifa.reservedTickets) / rifa.totalNumbers * 1000) / 10,
      date: ve.slice(0, 10), time: ve.slice(11, 16), times2: [h12(ve.slice(11, 16)), h12(ve.slice(11, 16))], lottery: rifa.lottery,
      accent: accents[site.accent] || site.accent, accentInk: '#ffffff',
      images: (rifa.images || []).map(src => /^(data:|https?:|\/)/.test(src) ? src : '../comun/img/' + src),
      fx: Object.fromEntries(db.currencies.filter(c => !['USD', 'VES'].includes(c.code)).map(c => [c.code, c.rate])),
      ticker: orders.slice(0, 8).map(o => [corto(o.name), (API.client(o.cedula) || {}).municipality || 'Venezuela', o.qty]),
      top: Object.values(top).sort((a, b) => b[2] - a[2]).slice(0, 3)
    });
    if (!RIFA.images.length) delete RIFA.images;
    (tomados || []).forEach(n => vendidos.add(+n));
    // Hallazgo: las plantillas siempre muestran 2do y 3er premio; con premio único se ocultan aquí.
    if (!RIFA.second) document.head.insertAdjacentHTML('beforeend', '<style>.p23row{display:none!important}</style>');
  })().catch(e => {
    console.error('LottoX: no se pudo cargar la rifa', e);
    const msg = e.status === 404 ? 'No encontramos esta rifa. Revisa el enlace.'
      : e.status === 'cerrada' ? `La venta de “${e.rifa.name}” ya cerró. Gracias por participar.`
      : e.status === 'sin-metodos' ? 'Esta rifa todavía no tiene métodos de pago activos.'
      : 'No pudimos cargar la rifa. Recarga la página en unos minutos.';
    document.getElementById('app').innerHTML = `<p style="margin:0;padding:48px 24px;text-align:center;font:500 1rem/1.5 system-ui,sans-serif">${msg}</p>`;
    return new Promise(() => {});
  });

  // Los archivos del comprador se guardan reducidos (el navegador tiene poco espacio).
  const reducir = file => new Promise(ok => {
    if (!file) return ok(null);
    if (!/^image\//.test(file.type)) return ok({ kind: 'archivo', name: file.name });
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok({ kind: 'imagen', name: file.name, url: c.toDataURL('image/jpeg', 0.7) });
      };
      img.onerror = () => ok({ kind: 'archivo', name: file.name });
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  window.LOTTOGE_CONEXION = {
    buscarCliente: cedula => get(`/platform/client-lookup/${encodeURIComponent(cedula)}`)
      .then(d => d && d.name ? { name: d.name, phone: d.phone || '', email: d.email || '' } : null)
      .catch(e => e.status === 404 ? null : Promise.reject(e)),
    numeroVendido: n => vendidos.has(n),
    enviarPago: async orden => {
      // Llave de "Mis boletos" del equipo donde se compró. En LottoGE la firma el servidor (verifyToken);
      // en esta simulación es solo la cédula codificada.
      const llave = 'sim.' + btoa(orden.cedula);
      const metodo = RIFA.paymentMethods.find(m => String(m.id) === orden.metodo) || {};
      let creada;
      try {
        creada = await post('/orders', {
          raffleId: RIFA.raffleId, companyId: RIFA.companyId, paymentMethodId: orden.metodo,
          ticketCount: orden.cantidad, numbers: orden.numeros,
          customer: { idNumber: orden.cedula, name: orden.nombre, phone: orden.telefono, email: orden.correo, state: orden.estado }
        });
      } catch (e) { console.warn('LottoX:', e.message); return { estado: 'rechazado' }; }
      if (metodo.isOnline) {
        const r = await post(`/orders/${creada.id}/verify`, { reference: orden.referencia, payerPhone: orden.telefonoPago, bank: orden.banco });
        return { estado: r.approved ? 'aprobado' : 'rechazado', orden: creada.code, numeros: r.numbers || [], llave };
      }
      await post(`/orders/${creada.id}/receipt`, { reference: orden.referencia, bank: orden.banco, receipt: await reducir(orden.comprobante) });
      orden.numeros.forEach(n => vendidos.add(+n));
      return { estado: 'reservado', orden: creada.code, llave };
    },
    // Solo con la llave de esa cédula (sin llave no hay consulta, como en LottoGE).
    misBoletos: (cedula, llave) => llave !== 'sim.' + btoa(cedula) ? Promise.reject(Object.assign(new Error('HTTP 403'), { status: 403 })) : get(`/orders?cedula=${encodeURIComponent(cedula)}&raffleId=${RIFA.raffleId}`)
      .then(d => ({
        nombre: d.customerName || '', boletos: d.ticketCount || 0,
        ordenes: (d.orders || []).map(o => ({ id: o.code, metodo: o.paymentMethodName, monto: o.amountLabel, estado: o.status === 'paid' ? 'pagado' : 'por-verificar', numeros: o.numbers || [], nota: o.note || '' }))
      }))
  };
})();
