/* ================= Conexión con la plataforma LottoGE (EJEMPLO) =================
   La página de compra trae una versión de demostración de todo lo que habla con el servidor.
   Este archivo muestra cómo cambiarla por la real sin tocar venta.js:

     1. Cópialo como comun/conexion.js y complétalo con el equipo de backend.
     2. En el index.html de cada plantilla, quita el comentario de <script src="../comun/conexion.js">
        (va después de config.js y de metodos-pago.js, y antes de tema.js y venta.js).

   Rutas: las marcadas [observado] existen hoy en api.lottoge.net; las marcadas [por confirmar] hay que
   validarlas con backend (ver "Mapeo al API real de LottoGE" en 04 Herramientas).
   Las respuestas del API vienen en un sobre { status, data }: get() devuelve data.
   Este archivo no se probó contra el API real. */
(() => {
  const BASE = 'https://api.lottoge.net/api/v1';
  const RIFA = window.LOTTOGE_RIFA = window.LOTTOGE_RIFA || {};
  const PAGOS = window.LOTTOGE_PAGOS;          // catálogo (comun/metodos-pago.js)

  const pedir = (path, opts = {}) => fetch(BASE + path, Object.assign({ credentials: 'include' }, opts))
    .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(Object.assign(new Error('HTTP ' + r.status), { status: r.status })))
    .then(j => j && typeof j === 'object' && 'data' in j ? j.data : j);
  const get = path => pedir(path);
  const post = (path, body) => pedir(path, body instanceof FormData
    ? { method: 'POST', body }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  /* ---------- 1. Datos antes de mostrar la página ----------
     La página espera esta promesa (window.LOTTOGE_ANTES) y después lee window.LOTTOGE_RIFA.
     companyId (UUID del rifero) y raffleId los escribe la plataforma en config.js; si no están,
     se toman de la dirección (…/Minimalista/?empresa=<companyId>&rifa=<raffleId>). */
  const vendidos = new Set();
  const url = new URLSearchParams(location.search), idDe = k => /^[\w-]{1,64}$/.test(url.get(k) || '') ? url.get(k) : '';
  RIFA.companyId = RIFA.companyId || idDe('empresa');
  RIFA.raffleId = RIFA.raffleId || idDe('rifa');
  window.LOTTOGE_ANTES = (async () => {
    const { companyId, raffleId } = RIFA;
    // Con conexion.js la página es la real: sin ids no se muestra la de ejemplo.
    if (!companyId || !raffleId) throw Object.assign(new Error('Faltan companyId o raffleId'), { status: 404 });
    const [rifa, tasa, comision, metodos, tomados] = await Promise.all([
      get(`/raffles/${raffleId}`),                                          // [observado] { id, name, drawDate, totalNumbers, prize, … }
      get('/exchange-rate/current').catch(() => null),                      // [observado] { rate, date, source }
      get(`/companies/${companyId}/service-fee-public`).catch(() => null),  // [observado] { serviceFeeRate }
      get(`/payment-methods/active?companyId=${companyId}`),               // [observado] lista de métodos
      get(`/raffles/${raffleId}/taken`).catch(() => [])                     // [por confirmar] números vendidos
    ]);
    // La tasa del API manda; la de config.js queda como respaldo.
    if (tasa && tasa.rate) RIFA.rate = +tasa.rate;
    // Comisión de servicio en %. Si el API la da como fracción (0.05), multiplicar por 100.
    if (comision && comision.serviceFeeRate != null) RIFA.serviceFee = +comision.serviceFeeRate;
    // Métodos de pago: cada uno tal como viene del API. Si la base de datos guarda icon y color
    // (recomendado, con las claves de metodos-pago.json), se usan; si no, el icono se adivina por el nombre.
    if (!metodos || !metodos.length) throw Object.assign(new Error('Sin métodos de pago activos'), { status: 'sin-metodos' });
    RIFA.paymentMethods = metodos.map(PAGOS.fromApi);
    // Datos de la rifa: los nombres de la izquierda son los de config.js.
    // Ajustar según lo que devuelva el API: el precio no viene en /raffles/{id} (ver el mapeo).
    Object.assign(RIFA, {
      prize: rifa.prize || rifa.name,
      total: rifa.totalNumbers || RIFA.total
    });
    // drawDate (ISO) → date 'AAAA-MM-DD' y time 'HH:MM' en hora de Venezuela (UTC-4 todo el año).
    const sorteo = new Date(rifa.drawDate);
    if (!isNaN(sorteo)) {
      const ve = new Date(sorteo.getTime() - 4 * 3600e3).toISOString();
      Object.assign(RIFA, { date: ve.slice(0, 10), time: ve.slice(11, 16) });
    }
    (tomados || []).forEach(n => vendidos.add(+n));
  })().catch(e => {
    // Sin datos reales no se muestra la página: así nadie ve las cuentas de pago de ejemplo de config.js.
    console.error('LottoGE: no se pudo cargar la rifa', e);
    document.getElementById('app').innerHTML = '<p style="margin:0;padding:48px 24px;text-align:center;font:500 1rem/1.5 system-ui,sans-serif">'
      + (e.status === 404 ? 'No encontramos esta rifa. Revisa el enlace.'
        : e.status === 'sin-metodos' ? 'Esta rifa todavía no tiene métodos de pago activos.'
        : 'No pudimos cargar la rifa. Recarga la página en unos minutos.') + '</p>';
    return new Promise(() => {});
  });

  /* ---------- 2. Lo que la página pide mientras el comprador compra ---------- */
  window.LOTTOGE_CONEXION = {
    // Cédula con su letra ('V18456732') → { name, phone, email } o null si no existe.
    buscarCliente: cedula => get(`/platform/client-lookup/${encodeURIComponent(cedula)}`)     // [observado] path param
      .then(d => d && d.name ? { name: d.name, phone: d.phone || '', email: d.email || '' } : null)
      .catch(e => e.status === 404 ? null : Promise.reject(e)),

    // Si un número ya se vendió (se pinta tachado en el tablero). Responde al instante con lo precargado.
    numeroVendido: n => vendidos.has(n),

    // La compra. orden trae: metodo, cantidad, modo ('random' | 'manual'), numeros, cedula, nombre, telefono,
    // correo, estado, referencia, telefonoPago, banco, titularPago (Zelle, transferencias…), cuentaPago (correo o ID de
    // Binance, PayPal…), comprobante (File o null), moneda, monto, montoBs. Lo que pide cada tipo está en metodos-pago.js (PIDE).
    // Debe responder { estado: 'aprobado' | 'reservado' | 'rechazado', orden: 'LG-…', numeros: ['0928', …] }.
    // El servidor recalcula el total con el precio real y comprueba que los números elegidos sigan libres.
    enviarPago: async orden => {
      const metodo = RIFA.paymentMethods.find(m => String(m.id) === orden.metodo) || {};
      const creada = await post('/orders', {                                // [por confirmar]
        raffleId: RIFA.raffleId, companyId: RIFA.companyId, paymentMethodId: orden.metodo,
        ticketCount: orden.cantidad, numbers: orden.numeros, customer: {
          idNumber: orden.cedula, name: orden.nombre, phone: orden.telefono, email: orden.correo, state: orden.estado
        },
        // Datos de quien paga, para que el rifero los compare al verificar (LottoGE los guarda en payerInfo).
        payerInfo: { holder: orden.titularPago, account: orden.cuentaPago, phone: orden.telefonoPago, bank: orden.banco }
      });
      if (metodo.isOnline) {
        // Pago Móvil al instante: la pasarela activa del rifero (Chinchin, AvilaPay o R4) verifica el pago.
        const r = await post(`/orders/${creada.id}/verify`, {                // [por confirmar]
          reference: orden.referencia, payerPhone: orden.telefonoPago, bank: orden.banco
        });
        return { estado: r.approved ? 'aprobado' : 'rechazado', orden: creada.code || creada.id, numeros: r.numbers || [] };
      }
      // Métodos manuales: se sube el comprobante y queda reservado hasta que el rifero lo revise.
      const fd = new FormData();
      fd.append('reference', orden.referencia);
      if (orden.banco) fd.append('bank', orden.banco);
      if (orden.comprobante) fd.append('receipt', orden.comprobante);
      await post(`/orders/${creada.id}/receipt`, fd);                         // [por confirmar]
      return { estado: 'reservado', orden: creada.code || creada.id };
    },

    // "Mis boletos" → { nombre, boletos, ordenes: [{ id, metodo, monto, estado: 'pagado' | 'por-verificar', numeros, nota }] }.
    misBoletos: cedula => get(`/orders?cedula=${encodeURIComponent(cedula)}&raffleId=${RIFA.raffleId}`)   // [por confirmar]
      .then(d => ({
        nombre: d.customerName || '',
        boletos: d.ticketCount || 0,
        ordenes: (d.orders || []).map(o => ({
          id: o.code || o.id, metodo: o.paymentMethodName, monto: o.amountLabel || '',
          estado: o.status === 'paid' ? 'pagado' : 'por-verificar', numeros: o.numbers || [], nota: o.note || ''
        }))
      }))
  };
})();
