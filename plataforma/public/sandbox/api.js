/* LottoX · entorno de pruebas · servidor simulado
   Hace de backend para el panel del operador y para los fronts de venta: guarda una base de datos de
   ejemplo en el navegador (localStorage) y aplica las reglas del negocio (tasas, ventas, verificación,
   números, ganadores, mensajería…). Todos los datos son de ejemplo, salvo el cliente de prueba.

   El panel usa las funciones de window.LottoAPI. Los fronts de venta usan LottoAPI.http(), que responde
   con las mismas rutas y el mismo sobre { status, data } que el API real (ver public/sandbox/conexion.js
   y el README: qué ruta existe hoy en api.lottoge.net y cuál está por confirmar). */
(() => {
  if (window.LottoAPI) return;
  const KEY = 'lottox-sandbox-v1';
  const DAY = 864e5, HOUR = 36e5;

  /* ---------- utilidades ---------- */
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const iso = t => new Date(t).toISOString();
  const r2 = n => Math.round(n * 100) / 100;
  const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const cedKey = c => { const s = String(c || '').toUpperCase().replace(/[^VEJGP0-9]/g, ''); const m = s.match(/^([VEJGP])?(\d{5,9})$/); return m ? (m[1] || 'V') + m[2] : ''; };
  const cedFmt = k => { const m = String(k || '').match(/^([VEJGP])(\d+)$/); return m ? `${m[1]}-${(+m[2]).toLocaleString('es-VE')}` : String(k || ''); };
  const err = (status, message) => Object.assign(new Error(message), { status });

  const STATES = {
    'Amazonas': ['Atures', 'Autana', 'Río Negro'], 'Anzoátegui': ['Simón Bolívar', 'Sotillo', 'Urbaneja', 'Anaco'],
    'Apure': ['San Fernando', 'Páez', 'Achaguas'], 'Aragua': ['Girardot', 'Mario Briceño Iragorry', 'Santiago Mariño', 'Sucre'],
    'Barinas': ['Barinas', 'Bolívar', 'Pedraza'], 'Bolívar': ['Caroní', 'Heres', 'Piar'],
    'Carabobo': ['Valencia', 'Naguanagua', 'San Diego', 'Puerto Cabello', 'Los Guayos'], 'Cojedes': ['San Carlos', 'Tinaquillo'],
    'Delta Amacuro': ['Tucupita', 'Antonio Díaz'], 'Distrito Capital': ['Libertador'], 'Falcón': ['Miranda', 'Carirubana', 'Falcón'],
    'Guárico': ['Juan Germán Roscio', 'Leonardo Infante', 'Miranda'], 'La Guaira': ['Vargas'], 'Lara': ['Iribarren', 'Palavecino', 'Torres', 'Jiménez'],
    'Mérida': ['Libertador', 'Campo Elías', 'Santos Marquina', 'Alberto Adriani', 'Sucre'], 'Miranda': ['Baruta', 'Chacao', 'Sucre', 'El Hatillo', 'Plaza', 'Guaicaipuro', 'Los Salias'],
    'Monagas': ['Maturín', 'Piar', 'Ezequiel Zamora'], 'Nueva Esparta': ['Mariño', 'Maneiro', 'Arismendi'], 'Portuguesa': ['Guanare', 'Páez', 'Araure'],
    'Sucre': ['Sucre', 'Bermúdez', 'Ribero'], 'Táchira': ['San Cristóbal', 'Cárdenas', 'Junín', 'Torbes'], 'Trujillo': ['Trujillo', 'Valera', 'Boconó'],
    'Yaracuy': ['San Felipe', 'Independencia', 'Nirgua'], 'Zulia': ['Maracaibo', 'San Francisco', 'Cabimas', 'Lagunillas']
  };
  const LOTTERIES = [
    ['Triple Táchira A', '12:30 p. m.'], ['Triple Táchira B', '4:30 p. m.'], ['Triple Táchira C', '10:00 p. m.'],
    ['Super Gana', '10:00 p. m.'], ['Chance Táchira', '1:00 p. m.'], ['Lotería Activa', '7:00 p. m.'], ['Triple Zulia', '4:45 p. m.'], ['Triple Caracas', '1:00 p. m.']
  ];
  const ROLES = {
    admin: { name: 'Administrador', desc: 'Todo el panel: rifas, ventas, mensajería y ajustes.' },
    supervisor: { name: 'Supervisor', desc: 'Ventas, pagos, reportes y clientes. No cambia ajustes.' },
    taquillero: { name: 'Taquillero', desc: 'Vende en la taquilla de su caja y consulta boletos.' },
    cobrador: { name: 'Cobrador', desc: 'Verifica pagos y registra abonos.' }
  };
  const REJECT_REASONS = ['El monto no coincide', 'La referencia no aparece en el banco', 'El comprobante no se lee', 'Pago duplicado', 'Otro motivo'];

  /* ---------- base de datos de ejemplo ---------- */
  const FIRST = ['María', 'Luis', 'Carla', 'Daniel', 'Ana', 'Pedro', 'Gabriela', 'José', 'Andreína', 'Carlos', 'Yelitza', 'Ronald', 'Tulio', 'Anthony', 'Alejandro', 'Daniela', 'Keila', 'Richard', 'Marbella', 'Yerimar', 'Nohely', 'Darwin', 'Oriana', 'Jesús', 'Rosa', 'Víctor', 'Milagros', 'Franklin', 'Yusmary', 'Héctor', 'Lisbeth', 'Wilmer', 'Karina', 'Eduardo', 'Mariela', 'Freddy', 'Génesis', 'Orlando', 'Patricia', 'Rafael'];
  const LAST = ['Rondón', 'Pernía', 'Méndez', 'Quintero', 'Contreras', 'Alarcón', 'Cabrera', 'González', 'Velazco', 'Páez', 'Gutiérrez', 'Rojas', 'Pérez', 'Lugo', 'Marcano', 'Torres', 'Hernández', 'Ramírez', 'Briceño', 'Uzcátegui', 'Molina', 'Peña', 'Salas', 'Rivas', 'Duque', 'Mora', 'Paredes', 'Sosa'];

  function seed() {
    const now = Date.now(), R = rng(20261030);
    const pick = a => a[Math.floor(R() * a.length)];
    const at = (daysAgo, hour = 9 + Math.floor(R() * 12), min = Math.floor(R() * 60)) => {
      return Math.min(ve(now - daysAgo * DAY, hour, min), now - 60e3);
    };
    // Las horas de ejemplo son de Venezuela (UTC−4), sin importar la zona del computador.
    const ve = (t, hh, mm) => { const d = new Date(t - 4 * HOUR); d.setUTCHours(hh + 4, mm, 0, 0); return d.getTime(); };
    const future = (days, hh, mm) => iso(ve(now + days * DAY, hh, mm));
    const past = (days, hh, mm) => iso(ve(now - days * DAY, hh, mm));

    // Tasa del bolívar: una por semana, de ~560 hace 11 semanas a 700 hoy.
    const rateHistory = [];
    for (let w = 11; w >= 0; w--) rateHistory.push({ at: iso(at(w * 7, 9, 0)), rate: w ? r2(700 - w * 12.75 - (w % 3) * 2.5) : 700, source: 'BCV (manual)', by: w % 2 ? 'Jean Franco' : 'Supervisor' });
    const rateAt = t => { let r = rateHistory[0].rate; for (const h of rateHistory) if (Date.parse(h.at) <= t) r = h.rate; return r; };

    const company = {
      id: 'c-rifas-merida', name: 'Rifas Mérida', legalName: 'Inversiones Rifas Mérida, C.A.', rif: 'J-50123456-7', runlot: 'CNL-ORF-2026-000759',
      description: 'Rifas autorizadas por CONALOT en el estado Mérida.', state: 'Mérida', municipality: 'Libertador', address: 'Av. Las Américas, C.C. Mérida, local 12',
      phone: '0274-555-0142', whatsapp: '0412-555-0199', email: 'contacto@rifasmerida.ejemplo', instagram: '@rifasmerida', facebook: 'rifasmerida', tiktok: '@rifasmerida',
      legalRep: 'Representante de ejemplo', legalRepId: 'V-12.345.678', plan: 'Pro', subdomain: 'rifas-merida', serviceFee: 0, logo: null
    };
    const me = { id: 'u-1', name: 'Jean Franco Sánchez Suárez', short: 'Jean Franco', email: 'operador@rifasmerida.ejemplo', role: 'admin' };

    const currencies = [
      { code: 'USD', name: 'Dólar estadounidense', symbol: 'US$', rate: 1, base: true, active: true, source: 'Base', updatedAt: null, by: '' },
      { code: 'VES', name: 'Bolívar', symbol: 'Bs', rate: 700, active: true, source: 'BCV (manual)', updatedAt: rateHistory[rateHistory.length - 1].at, by: 'Jean Franco' },
      { code: 'USDT', name: 'Tether', symbol: '₮', rate: 1, active: true, source: 'Manual', updatedAt: past(29, 9, 0), by: 'Jean Franco' },
      { code: 'COP', name: 'Peso colombiano', symbol: '$', rate: 4000, active: false, source: 'Manual', updatedAt: past(29, 9, 0), by: 'Jean Franco' },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, active: false, source: 'Manual', updatedAt: past(29, 9, 0), by: 'Jean Franco' }
    ];

    const pagoMovil = [['Banco', 'Banesco (0134)'], ['Teléfono', '0412-555-0199'], ['RIF', 'J-50123456-7']];
    const paymentMethods = [
      { id: 'pm-auto', name: 'Pago Móvil al instante', icon: 'pago-movil', currency: 'VES', bankCode: '0134', channel: 'online', instant: true, requireReceipt: false, active: true, accountInfo: pagoMovil, note: 'Se verifica solo con la pasarela' },
      { id: 'pm-banesco', name: 'Pago Móvil Banesco', icon: 'comprobante', currency: 'VES', bankCode: '0134', channel: 'ambos', instant: false, requireReceipt: true, active: true, accountInfo: pagoMovil, note: 'Con comprobante' },
      { id: 'pm-mercantil', name: 'Pago Móvil Mercantil', icon: 'comprobante', currency: 'VES', bankCode: '0105', channel: 'ambos', instant: false, requireReceipt: true, active: true, accountInfo: [['Banco', 'Mercantil (0105)'], ['Teléfono', '0414-555-0177'], ['RIF', 'J-50123456-7']], note: 'Con comprobante' },
      { id: 'tr-bdv', name: 'Transferencia', icon: 'transferencia', currency: 'VES', bankCode: '0102', channel: 'online', instant: false, requireReceipt: true, active: true, accountInfo: [['Banco', 'Banco de Venezuela (0102)'], ['Cuenta', '0102-0123-45-0001234567'], ['Titular', 'Inversiones Rifas Mérida'], ['RIF', 'J-50123456-7']], note: 'Banco de Venezuela' },
      { id: 'ef-usd', name: 'Efectivo US$', icon: 'billetera', currency: 'USD', bankCode: '', channel: 'taquilla', instant: false, requireReceipt: false, active: true, accountInfo: [], note: 'Solo en taquilla' },
      { id: 'ef-bs', name: 'Efectivo Bs', icon: 'billetera', currency: 'VES', bankCode: '', channel: 'taquilla', instant: false, requireReceipt: false, active: true, accountInfo: [], note: 'Solo en taquilla' },
      { id: 'pos', name: 'Punto de venta', icon: 'tarjeta', currency: 'VES', bankCode: '0134', channel: 'taquilla', instant: false, requireReceipt: false, active: true, accountInfo: [], note: 'Débito o crédito' },
      { id: 'zelle', name: 'Zelle', icon: 'zelle', currency: 'USD', bankCode: '', channel: 'online', instant: false, requireReceipt: true, active: true, accountInfo: [['Correo', 'pagos@rifasmerida.ejemplo'], ['Titular', 'Inversiones Rifas Mérida']], note: 'Dólares desde EE. UU.' },
      { id: 'binance', name: 'Binance USDT', icon: 'binance', currency: 'USDT', bankCode: '', channel: 'online', instant: false, requireReceipt: true, active: true, accountInfo: [['Pay ID', '412 908 337'], ['Titular', 'Rifas Mérida']], note: 'USDT con Binance Pay' },
      { id: 'zinli', name: 'Zinli', icon: 'zinli', currency: 'USD', bankCode: '', channel: 'online', instant: false, requireReceipt: true, active: false, accountInfo: [['Correo', 'pagos@rifasmerida.ejemplo']], note: 'Dólares en tu tarjeta Zinli' },
      { id: 'nequi', name: 'Nequi', icon: 'nequi', currency: 'COP', bankCode: '', channel: 'online', instant: false, requireReceipt: true, active: false, accountInfo: [['Número Nequi', '300 555 0199'], ['Titular', 'Rifas Mérida']], note: 'Pesos desde Colombia' }
    ];

    const lot = name => LOTTERIES.find(l => l[0] === name) || LOTTERIES[0];
    const raffle = (o) => Object.assign({
      closeMinutes: 10, description: '', rules: ['El sorteo se transmite en vivo por Instagram.', 'El ganador tiene 30 días para reclamar su premio.', 'Los boletos no pagados no participan.'],
      promotions: [], images: [], solvencyDoc: 'solvencia.pdf', rejectReason: '', winner: null, createdAt: past(40, 10, 0), approvedAt: past(35, 10, 0)
    }, o, { lotteryTime: lot(o.lottery)[1] });
    const raffles = [
      raffle({ id: 'R-101', title: 'Gran Rifa Toyota Agya', prize: 'Toyota Agya 2026', prizes: ['Toyota Agya 2026', 'US$ 500', 'US$ 200'], lottery: 'Triple Táchira A', drawAt: future(46, 12, 30), priceUSD: 10, total: 1000, status: 'venta', images: ['flyer.jpg'], tone: 'violeta', promotions: [{ qty: 5, priceUSD: 45 }, { qty: 10, priceUSD: 85 }], description: 'Toyota Agya 2026 0 km, más US$ 500 y US$ 200 para el segundo y tercer lugar.', createdAt: past(70, 10, 0), approvedAt: past(66, 10, 0) }),
      raffle({ id: 'R-102', title: 'Viaje a Dubái para dos', prize: 'Viaje a Dubái para dos personas', prizes: ['Viaje a Dubái para dos', 'US$ 300', 'US$ 100'], lottery: 'Super Gana', drawAt: future(19, 22, 0), priceUSD: 5, total: 10000, status: 'venta', images: ['burj-al-arab.jpg', 'sala.jpg'], tone: 'azul', description: 'Siete noches en Dubái con boletos aéreos y hotel incluidos.', createdAt: past(50, 10, 0), approvedAt: past(46, 10, 0) }),
      raffle({ id: 'R-103', title: 'Impresora 3D', prize: 'Creality K2 Plus', prizes: ['Creality K2 Plus'], lottery: 'Chance Táchira', drawAt: past(5, 13, 0), priceUSD: 1, total: 100, status: 'venta', tone: 'grafito', createdAt: past(45, 10, 0) }),
      raffle({ id: 'R-104', title: 'Moto Bera 2027', prize: 'Moto Bera SBR 2027 0 km', prizes: ['Moto Bera SBR 2027 0 km'], lottery: 'Triple Táchira A', drawAt: future(46, 12, 30), priceUSD: 5, total: 1000, status: 'revision', tone: 'grafito', createdAt: past(2, 16, 10), approvedAt: null }),
      raffle({ id: 'R-105', title: 'Camión emprendedor', prize: 'Camión de carga ligera', prizes: ['Camión de carga ligera'], lottery: 'Lotería Activa', drawAt: future(60, 19, 0), priceUSD: 20, total: 1000, status: 'rechazada', rejectReason: 'Falta el documento de solvencia del premio.', solvencyDoc: '', tone: 'grafito', createdAt: past(12, 11, 0), approvedAt: null }),
      raffle({ id: 'R-106', title: 'iPhone 17 Pro', prize: 'iPhone 17 Pro 256 GB', prizes: ['iPhone 17 Pro 256 GB'], lottery: 'Triple Táchira B', drawAt: past(30, 16, 30), priceUSD: 2, total: 100, status: 'finalizada', tone: 'grafito', createdAt: past(70, 10, 0) }),
      raffle({ id: 'R-107', title: 'Smart TV 65"', prize: 'Smart TV 65" 4K', prizes: ['Smart TV 65" 4K'], lottery: 'Triple Táchira C', drawAt: past(18, 22, 0), priceUSD: 3, total: 100, status: 'venta', tone: 'grafito', createdAt: past(60, 10, 0) }),
      raffle({ id: 'R-108', title: 'Combo de electrodomésticos', prize: 'Nevera, lavadora y cocina', prizes: ['Nevera, lavadora y cocina'], lottery: 'Triple Zulia', drawAt: future(75, 16, 45), priceUSD: 4, total: 1000, status: 'borrador', solvencyDoc: '', rules: [], tone: 'grafito', createdAt: past(1, 18, 0), approvedAt: null })
    ];

    // Clientes: el cliente de prueba (los datos de Jean Franco) y clientes de ejemplo.
    const clients = [{ cedula: 'V31689392', name: 'Jean Franco Sánchez Suárez', phone: '0412-166-5356', email: 'jeanf9839@gmail.com', state: 'Miranda', municipality: 'Baruta', consent: true, createdAt: iso(at(74, 10, 5)), test: true }];
    const usedCed = new Set(['V31689392']);
    for (let i = 0; i < 46; i++) {
      let ced; do { ced = 'V' + (10000000 + Math.floor(R() * 21000000)); } while (usedCed.has(ced)); usedCed.add(ced);
      const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`;
      const state = i % 3 === 0 ? 'Mérida' : pick(Object.keys(STATES));
      const hasPhone = i % 11 !== 5, hasMail = i % 4 !== 1;
      clients.push({
        cedula: ced, name, phone: hasPhone ? `04${pick(['12', '14', '16', '24', '26'])}-${String(1000000 + Math.floor(R() * 8999999)).replace(/^(\d{3})/, '$1-')}` : '',
        email: hasMail ? `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${name.split(' ')[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@ejemplo.com` : '',
        state, municipality: pick(STATES[state]), consent: i % 5 !== 2, createdAt: iso(at(i < 6 ? 2 + i * 3 : 20 + Math.floor(R() * 150)))
      });
    }

    const cajas = [
      { id: 'cj-1', code: 'TQ-01', name: 'Taquilla principal', type: 'fija', location: 'C.C. Mérida, local 12', state: 'Mérida', userId: 'u-3', pin: true, raffles: 'todas', active: true },
      { id: 'cj-2', code: 'TQ-02', name: 'Kiosco La Hechicera', type: 'fija', location: 'Av. Alberto Carnevali, La Hechicera', state: 'Mérida', userId: 'u-4', pin: true, raffles: 'todas', active: true },
      { id: 'cj-3', code: 'MV-01', name: 'Cobrador móvil Ejido', type: 'móvil', location: 'Ejido, municipio Campo Elías', state: 'Mérida', userId: 'u-5', pin: false, raffles: ['R-101'], active: true },
      { id: 'cj-4', code: 'TQ-03', name: 'Taquilla El Vigía', type: 'fija', location: 'El Vigía, Av. Bolívar', state: 'Mérida', userId: '', pin: true, raffles: 'todas', active: false }
    ];
    const users = [
      { id: 'u-1', name: me.name, email: me.email, role: 'admin', cajaId: '', status: 'activo', lastAt: iso(now - 4 * 60e3), createdAt: past(200, 9, 0) },
      { id: 'u-2', name: 'Supervisor de ejemplo', email: 'supervisor@rifasmerida.ejemplo', role: 'supervisor', cajaId: '', status: 'activo', lastAt: past(1, 18, 22), createdAt: past(160, 9, 0) },
      { id: 'u-3', name: 'Taquillero Centro', email: 'taquilla1@rifasmerida.ejemplo', role: 'taquillero', cajaId: 'cj-1', status: 'activo', lastAt: past(0, 11, 4), createdAt: past(150, 9, 0) },
      { id: 'u-4', name: 'Taquillero La Hechicera', email: 'taquilla2@rifasmerida.ejemplo', role: 'taquillero', cajaId: 'cj-2', status: 'activo', lastAt: past(2, 17, 40), createdAt: past(120, 9, 0) },
      { id: 'u-5', name: 'Cobrador Ejido', email: 'cobrador@rifasmerida.ejemplo', role: 'cobrador', cajaId: 'cj-3', status: 'activo', lastAt: past(6, 10, 15), createdAt: past(90, 9, 0) },
      { id: 'u-6', name: '', email: 'nuevo.vendedor@ejemplo.com', role: 'taquillero', cajaId: 'cj-4', status: 'invitado', lastAt: null, createdAt: past(3, 9, 0) }
    ];
    const influencers = [
      { id: 'inf-1', name: 'Influencer de ejemplo', handle: '@influencer.merida', code: 'MERIDA10', commissionPct: 10, phone: '0414-555-0101', bankCode: '0134', account: '0412-555-0101', raffles: 'todas', active: true, paidUSD: 0, createdAt: past(40, 9, 0) },
      { id: 'inf-2', name: 'Creador Andino', handle: '@creadorandino', code: 'ANDES5', commissionPct: 5, phone: '0424-555-0102', bankCode: '0105', account: '0424-555-0102', raffles: ['R-102'], active: true, paidUSD: 6, createdAt: past(25, 9, 0) }
    ];

    // Ventas: históricas, con la tasa del día de cada una.
    const orders = [], taken = {};
    raffles.forEach(r => taken[r.id] = new Set());
    const digits = r => String(r.total - 1).length;
    const freeNums = (r, q) => {
      const out = []; let guard = 0;
      while (out.length < q && guard++ < 20000) { const n = Math.floor(R() * r.total); if (!taken[r.id].has(n)) { taken[r.id].add(n); out.push(String(n).padStart(digits(r), '0')); } }
      return out;
    };
    const online = ['pm-banesco', 'pm-mercantil', 'tr-bdv', 'zelle', 'binance'], counter = ['ef-usd', 'ef-bs', 'pos', 'pm-banesco'];
    let code = 48000;
    const mk = (o) => {
      const r = raffles.find(x => x.id === o.raffleId), t = o.t, rate = rateAt(t), m = paymentMethods.find(x => x.id === o.method);
      const qty = o.qty, nums = o.numbers || (o.status === 'pendiente' && o.random ? [] : freeNums(r, qty));
      const amountUSD = o.amountUSD ?? qty * r.priceUSD;
      const c = clients.find(x => x.cedula === o.cedula);
      const order = {
        id: 'LG-' + (++code), raffleId: r.id, cedula: o.cedula, name: c.name, qty, random: !!o.random, numbers: nums,
        amountUSD, rate, amountBs: r2(amountUSD * rate), method: o.method || '', currency: m ? m.currency : '',
        reference: o.reference ?? (m && m.requireReceipt ? String(100000 + Math.floor(R() * 899999)).slice(0, 6) : ''),
        bank: m && m.bankCode ? m.bankCode : '', payerPhone: '', proof: o.proof === undefined ? (m && m.requireReceipt ? { kind: 'muestra', name: 'comprobante.jpg' } : null) : o.proof,
        channel: o.channel, cajaId: o.channel === 'taquilla' ? (o.cajaId || pick(['cj-1', 'cj-1', 'cj-2', 'cj-3'])) : '', sellerId: o.channel === 'taquilla' ? 'u-3' : '',
        influencer: o.influencer || '', status: o.status, paidUSD: o.status === 'aprobada' ? amountUSD : (o.paidUSD || 0),
        createdAt: iso(t), decidedAt: o.status === 'aprobada' || o.status === 'rechazada' ? iso(t + (o.channel === 'taquilla' ? 0 : 3 * HOUR)) : null,
        decidedBy: o.status === 'aprobada' ? (o.channel === 'taquilla' ? 'Taquilla' : 'Supervisor') : o.status === 'rechazada' ? 'Supervisor' : '',
        rejectReason: o.rejectReason || '', history: [{ at: iso(t), text: o.channel === 'taquilla' ? 'Venta registrada en taquilla' : 'Compra recibida desde la página' }]
      };
      if (order.status === 'rechazada') taken[r.id] = new Set([...taken[r.id]].filter(n => !nums.includes(String(n).padStart(digits(r), '0'))));
      orders.push(order); return order;
    };
    const buyer = () => clients[1 + Math.floor(R() * (clients.length - 1))].cedula;
    // R-106 iPhone (finalizada): 100 números, 72 vendidos
    for (let i = 0; i < 24; i++) mk({ raffleId: 'R-106', t: at(70 - i * 1.6), qty: 3, cedula: buyer(), method: pick(i % 2 ? online : counter), channel: i % 2 ? 'online' : 'taquilla', status: 'aprobada' });
    // R-107 TV (falta ganador): 64 vendidos
    for (let i = 0; i < 32; i++) mk({ raffleId: 'R-107', t: at(58 - i * 1.2), qty: 2, cedula: buyer(), method: pick(i % 3 ? online : counter), channel: i % 3 ? 'online' : 'taquilla', status: i === 5 ? 'rechazada' : 'aprobada', rejectReason: i === 5 ? 'El monto no coincide' : '' });
    // R-103 Impresora (falta ganador): 61 vendidos + pendientes de rifa cerrada
    for (let i = 0; i < 30; i++) mk({ raffleId: 'R-103', t: at(44 - i * 1.3), qty: i % 3 ? 2 : 3, cedula: buyer(), method: pick(online), channel: 'online', status: 'aprobada' });
    // R-101 Toyota (en venta): ventas de los últimos 66 días
    for (let i = 0; i < 120; i++) {
      const d = Math.floor(R() * 66), ch = R() < .35 ? 'taquilla' : 'online';
      const q = pick([1, 1, 1, 2, 2, 3, 5]);
      mk({ raffleId: 'R-101', t: at(d), qty: q, amountUSD: q === 5 ? 45 : undefined, cedula: buyer(), method: pick(ch === 'online' ? online : counter), channel: ch, status: i % 23 === 7 ? 'rechazada' : 'aprobada', rejectReason: i % 23 === 7 ? pick(REJECT_REASONS.slice(0, 3)) : '', influencer: i % 9 === 0 ? 'MERIDA10' : '' });
    }
    // R-102 Dubái (en venta)
    for (let i = 0; i < 70; i++) {
      const d = Math.floor(R() * 46), ch = R() < .2 ? 'taquilla' : 'online', q = pick([1, 2, 2, 4, 5, 10]);
      mk({ raffleId: 'R-102', t: at(d), qty: q, cedula: buyer(), method: pick(ch === 'online' ? online : counter), channel: ch, status: 'aprobada', influencer: i % 7 === 0 ? 'ANDES5' : '' });
    }
    // Historial del cliente de prueba
    const ME = 'V31689392';
    mk({ raffleId: 'R-106', t: at(60, 19, 12), qty: 2, cedula: ME, method: 'pm-banesco', channel: 'online', status: 'aprobada' });
    mk({ raffleId: 'R-101', t: at(41, 14, 10), qty: 3, cedula: ME, method: 'ef-usd', channel: 'taquilla', cajaId: 'cj-1', status: 'abono', paidUSD: 15, reference: '', proof: null });
    mk({ raffleId: 'R-101', t: at(29, 9, 2), qty: 4, cedula: ME, method: 'zelle', channel: 'online', status: 'aprobada' });
    mk({ raffleId: 'R-101', t: at(13, 11, 28), qty: 1, cedula: ME, method: 'pm-mercantil', channel: 'online', status: 'aprobada' });
    mk({ raffleId: 'R-101', t: at(13, 11, 29), qty: 1, cedula: ME, method: 'pm-mercantil', channel: 'online', status: 'rechazada', rejectReason: 'Pago duplicado' });
    mk({ raffleId: 'R-101', t: at(1, 19, 36), qty: 1, cedula: ME, method: 'ef-usd', channel: 'taquilla', cajaId: 'cj-1', status: 'aprobada', reference: '', proof: null });
    // Pagos por verificar: con comprobante, sin método, abonos y algunos de rifas ya cerradas
    const pend = [
      ['R-101', 1, 'pm-banesco', 0.2], ['R-101', 2, 'pm-mercantil', 0.5], ['R-101', 1, '', 0.9], ['R-102', 5, '', 1.2], ['R-101', 1, 'zelle', 1.6], ['R-102', 2, 'binance', 2.1],
      ['R-101', 3, 'tr-bdv', 2.6], ['R-102', 10, 'pm-banesco', 3.1], ['R-101', 1, 'pm-banesco', 3.4], ['R-102', 4, 'zelle', 4.2], ['R-101', 2, 'pm-mercantil', 5.5], ['R-102', 1, 'binance', 6.1],
      ['R-103', 2, 'pm-banesco', 9.2], ['R-103', 1, 'zelle', 11], ['R-107', 2, 'pm-mercantil', 21], ['R-107', 1, '', 24]
    ];
    pend.forEach(([rid, q, m, d], i) => mk({ raffleId: rid, t: at(d, 8 + (i * 5) % 13), qty: q, cedula: buyer(), method: m, channel: 'online', status: 'pendiente', random: i % 4 === 1, reference: m ? undefined : '', proof: m ? undefined : null }));
    [['R-101', 2, 4], ['R-101', 4, 8], ['R-102', 6, 3]].forEach(([rid, q, d]) => {
      const r = raffles.find(x => x.id === rid);
      mk({ raffleId: rid, t: at(d), qty: q, cedula: buyer(), method: 'ef-usd', channel: 'taquilla', status: 'abono', paidUSD: r2(q * r.priceUSD / 2), reference: '', proof: null });
    });

    // Ganador de la rifa finalizada
    const r106 = raffles.find(r => r.id === 'R-106'), winOrder = orders.find(o => o.raffleId === 'R-106' && o.status === 'aprobada' && o.cedula !== ME);
    r106.winner = { number: winOrder.numbers[0], orderId: winOrder.id, cedula: winOrder.cedula, name: winOrder.name, result: winOrder.numbers[0], evidence: 'resultado-triple-tachira-b.jpg', reportedAt: past(29, 18, 0), notified: true, sold: true };

    // Mensajería
    const automations = [
      { key: 'compra_confirmada', name: 'Compra confirmada', when: 'Al aprobar un pago, con los números asignados', template: 'confirmacion_registro_compra', enabled: true, body: '¡Hola {{nombre}}! Tu compra de {{boletos}} en {{rifa}} está confirmada. Tus números: {{numeros}}. ¡Mucha suerte!' },
      { key: 'pago_recibido', name: 'Pago recibido', when: 'Cuando el cliente sube un comprobante', template: 'comprobante_pago', enabled: true, body: 'Hola {{nombre}}, recibimos tu comprobante para {{rifa}}. Lo revisamos y te confirmamos en breve.' },
      { key: 'abono', name: 'Abono registrado', when: 'Al registrar un pago parcial, con el saldo', template: 'abonado', enabled: true, body: 'Hola {{nombre}}, registramos tu abono de {{monto}} en {{rifa}}. Saldo pendiente: {{saldo}}.' },
      { key: 'recordatorio', name: 'Recordatorio de pago', when: '24 h antes del cierre a quien tenga saldo', template: 'recordatorio_pago', enabled: true, body: 'Hola {{nombre}}, el sorteo de {{rifa}} cierra mañana. Completa tu saldo de {{saldo}} para participar.' },
      { key: 'ultima_llamada', name: 'Última llamada', when: '6 h antes del sorteo a clientes de la rifa', template: 'comercial_ultima_llamada', enabled: false, body: '¡Últimas horas para {{rifa}}! Compra tus boletos aquí: {{enlace}}' },
      { key: 'ganador', name: 'Ganador anunciado', when: 'Al reportar el ganador, a todos los participantes', template: 'anuncio_ganador', enabled: false, body: 'Resultado de {{rifa}}: el número ganador es el {{numero}}. ¡Gracias por participar!' }
    ];
    const messages = [];
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const deliver = (seedStr, phone) => { if (!phone) return ['fallido', 'Número sin WhatsApp']; const h = hash(seedStr) % 100; return h < 3 ? ['fallido', pick(['Plantilla rechazada por Meta: variable {{2}} vacía', 'Límite de mensajes por hora alcanzado', 'El cliente bloqueó el número'])] : h < 26 ? ['entregado', ''] : ['leido', '']; };
    orders.filter(o => Date.parse(o.createdAt) >= monthStart.getTime()).forEach(o => {
      const c = clients.find(x => x.cedula === o.cedula), key = o.status === 'abono' ? 'abono' : o.status === 'aprobada' ? 'compra_confirmada' : o.proof ? 'pago_recibido' : null;
      if (!key) return;
      const [st, reason] = deliver(o.id + key, c.phone);
      messages.push({ id: 'm-' + o.id, at: o.decidedAt || o.createdAt, channel: 'whatsapp', to: c.phone || '—', cedula: c.cedula, name: c.name, kind: 'automatizacion', ref: key, template: automations.find(a => a.key === key).template, status: st, reason });
    });
    const campaigns = [
      { id: 'cp-1', name: 'Última semana Viaje a Dubái', channel: 'whatsapp', segment: 'inactivos', audienceLabel: 'Clientes inactivos 90 días', template: 'promocion_actividad', subject: '', body: '¡Hola {{nombre}}! Quedan pocos días para el Viaje a Dubái. Participa desde US$ 5.', status: 'enviada', createdAt: past(3, 10, 0), sentAt: past(2, 10, 0), scheduledAt: null },
      { id: 'cp-2', name: 'Recordatorio de saldo', channel: 'whatsapp', segment: 'saldo', audienceLabel: 'Con saldo pendiente', template: 'recordatorio_pago', subject: '', body: 'Hola {{nombre}}, tienes un saldo pendiente en {{rifa}}.', status: 'enviada', createdAt: past(10, 10, 0), sentAt: past(10, 11, 0), scheduledAt: null },
      { id: 'cp-3', name: 'Nueva rifa: Moto Bera', channel: 'correo', segment: 'correo', audienceLabel: 'Todos con correo', template: '', subject: '¡Se viene una moto!', body: 'Muy pronto: la rifa de la Moto Bera SBR 2027. Te avisamos apenas abra la venta.', status: 'programada', createdAt: past(1, 15, 0), sentAt: null, scheduledAt: future(3, 9, 0) },
      { id: 'cp-4', name: '', channel: 'whatsapp', segment: '', audienceLabel: '', template: '', subject: '', body: '', status: 'borrador', createdAt: past(0, 9, 30), sentAt: null, scheduledAt: null }
    ];
    // Envíos de las campañas ya enviadas, con el resultado de cada uno
    [['cp-1', c => !c.test && hash(c.cedula) % 3 === 0], ['cp-2', c => c.cedula === 'V31689392' || hash(c.cedula) % 7 === 1]].forEach(([id, f]) => {
      const cp = campaigns.find(x => x.id === id);
      clients.filter(f).filter(c => c.consent).forEach(c => { const [st, reason] = deliver(id + c.cedula, c.phone); messages.push({ id: 'm-' + id + c.cedula, at: cp.sentAt, channel: 'whatsapp', to: c.phone || '—', cedula: c.cedula, name: c.name, kind: 'campana', ref: id, template: cp.template, status: st, reason }); });
    });
    const conv = (name, cedula, phone, unread, msgs, extra = {}) => ({ id: uid('cv'), name, cedula, phone, unread, status: 'abierta', assignedTo: '', messages: msgs, ...extra });
    const c2 = clients[3], c3 = clients[4], c4 = clients[5], c5 = clients[6];
    const conversations = [
      conv(c2.name, c2.cedula, c2.phone, 2, [
        { from: 'cliente', type: 'texto', text: 'Buenas, compré 2 boletos de la Gran Rifa Toyota Agya', at: iso(now - 50 * 60e3) },
        { from: 'cliente', type: 'texto', text: '¿Ya salió mi número? Pagué a las 3', at: iso(now - 42 * 60e3) }
      ]),
      conv(c3.name, c3.cedula, c3.phone, 1, [{ from: 'cliente', type: 'imagen', text: 'Comprobante de pago', at: iso(now - 2.2 * HOUR) }]),
      conv(c4.name, c4.cedula, c4.phone, 0, [
        { from: 'cliente', type: 'texto', text: '¿Cuándo es el sorteo del viaje?', at: iso(now - 26 * HOUR) },
        { from: 'agente', type: 'texto', text: 'El sorteo es con Super Gana, a las 10:00 p. m. ¡Suerte!', at: iso(now - 25.5 * HOUR), by: 'Jean Franco' },
        { from: 'cliente', type: 'texto', text: 'Gracias, ya me llegó', at: iso(now - 25 * HOUR) }
      ]),
      conv(c5.name, c5.cedula, c5.phone, 0, [{ from: 'cliente', type: 'texto', text: '¿Puedo pagar el resto mañana?', at: iso(now - 28 * HOUR) }]),
      conv('', '', '+58 424-555-0131', 1, [{ from: 'cliente', type: 'audio', text: 'Mensaje de voz · 0:12', at: iso(now - 3 * DAY) }]),
      conv('Cliente de prueba', 'V31689392', '0412-166-5356', 0, [
        { from: 'bot', type: 'texto', text: '¡Hola! Soy el asistente de Rifas Mérida. Escribe 1, 2 o 3.', at: iso(now - 5 * DAY) },
        { from: 'cliente', type: 'texto', text: '2', at: iso(now - 5 * DAY + 60e3) }
      ], { status: 'archivada' })
    ];
    const agents = [
      ['Agente Centro', 'agente1@rifasmerida.ejemplo', -12], ['Agente Ejido', 'agente2@rifasmerida.ejemplo', -40], ['Agente Noche', 'agente3@rifasmerida.ejemplo', -3],
      ['Agente Cobros', 'agente4@rifasmerida.ejemplo', -25], ['Agente Fin de semana', 'agente5@rifasmerida.ejemplo', -60], ['Supervisor de ejemplo', 'supervisor@rifasmerida.ejemplo', 22], ['Jean Franco', 'operador@rifasmerida.ejemplo', 48]
    ].map(([name, email, d], i) => ({ id: 'ag-' + i, name, email, expiresAt: iso(now + d * DAY), chats: 3 + (i * 7) % 20 }));
    const bot = {
      enabled: true,
      welcome: '¡Hola! Soy el asistente de Rifas Mérida. Escribe 1 para ver la rifa en venta, 2 para consultar tus boletos o 3 para hablar con una persona.',
      hours: 'Lunes a sábado · 8:00 a. m. – 8:00 p. m.', outOfHours: 'Responder y crear conversación pendiente',
      responses: [
        { key: '1', title: 'Rifa en venta', action: 'Envía la rifa activa con enlace de compra', text: 'Esta es nuestra rifa en venta: {{rifa}}. Compra aquí: {{enlace}}' },
        { key: '2', title: 'Mis boletos', action: 'Pide la cédula y responde con el Verificador', text: 'Escríbeme tu cédula, sin puntos.' },
        { key: '3', title: 'Hablar con alguien', action: 'Pasa la conversación a la Bandeja', text: 'Te paso con una persona del equipo. Te escribimos en unos minutos.' }
      ]
    };

    const gateways = {
      avilapay: { name: 'AvilaPay', steps: [
        { key: 'vincular', title: 'Vincular cuenta AvilaPay', done: true, doneAt: past(48, 10, 0) },
        { key: 'identidad', title: 'Verificar identidad', done: true, doneAt: past(46, 15, 0) },
        { key: 'credenciales', title: 'Cargar credenciales API', done: false, doneAt: null },
        { key: 'prueba', title: 'Prueba de cobro', done: false, doneAt: null }
      ], credentials: { merchantKey: '' }, enabled: true },
      chinchin: { name: 'ChinChin', steps: [
        { key: 'registro', title: 'Registrar comercio', done: true, doneAt: past(30, 10, 0) },
        { key: 'verificacion', title: 'Verificación de ChinChin', done: true, doneAt: past(21, 10, 0) },
        { key: 'credenciales', title: 'Cargar credenciales', done: false, doneAt: null },
        { key: 'prueba', title: 'Prueba de cobro', done: false, doneAt: null }
      ], credentials: { apiKey: '', secret: '', merchantId: '' }, enabled: true }
    };
    const site = { template: 'estandar', accent: 'coral', accentCustom: '#5638c9', raffleId: 'R-101', rifero: 'Rifas Mérida', handle: '@rifasmerida', support: 'contacto@rifasmerida.ejemplo' };

    const audit = [];
    const log = (t, by, action, detail) => audit.push({ id: uid('a'), at: iso(t), by, action, detail });
    log(at(0, 9, 0), 'Jean Franco', 'Tasa actualizada', 'Bs/US$ 700,00 (BCV)');
    log(at(2, 16, 10), 'Jean Franco', 'Rifa enviada a CONALOT', 'Moto Bera 2027');
    log(at(1, 19, 36), 'Taquilla principal', 'Venta en taquilla', 'Gran Rifa Toyota Agya · 1 boleto');
    log(at(1, 18, 0), 'Jean Franco', 'Borrador guardado', 'Combo de electrodomésticos');

    return {
      v: 1, createdAt: iso(now), company, me, currencies, rateHistory: rateHistory.reverse(), paymentMethods, raffles, clients, orders, cajas, users, influencers,
      automations, messages, campaigns, conversations, agents, bot, whatsapp: { connected: true, number: '+58 412-555-0199', displayName: 'Rifas Mérida', quality: 'Alta', tier: '1.000 conversaciones al día', planMonthly: 2000, connectedAt: past(120, 10, 0) },
      gateways, site, sitePublished: clone(site), sitePublishedAt: past(15, 10, 0), domains: [],
      security: { password: 'Prueba2026!', changedAt: past(90, 10, 0), sessions: [
        { id: 's-1', device: 'Chrome · Windows', place: 'Mérida, Venezuela', current: true, lastAt: iso(now) },
        { id: 's-2', device: 'Safari · iPhone', place: 'Mérida, Venezuela', current: false, lastAt: past(1, 21, 10) },
        { id: 's-3', device: 'Chrome · Android', place: 'Caracas, Venezuela', current: false, lastAt: past(6, 8, 45) }
      ] },
      audit, readNotifications: [], seq: code
    };
  }

  /* ---------- persistencia y suscripción ---------- */
  let db, mem = null, version = 0;
  const subs = new Set();
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return mem; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) { mem = v; } }
  };
  function load() {
    const raw = store.get();
    try { db = raw ? JSON.parse(raw) : null; } catch (e) { db = null; }
    if (!db || db.v !== 1) { db = seed(); store.set(JSON.stringify(db)); }
  }
  function commit() {
    version++;
    try { store.set(JSON.stringify(db)); } catch (e) {
      // Sin espacio (comprobantes grandes): se quitan las imágenes más antiguas y se reintenta.
      db.orders.filter(o => o.proof && o.proof.url).slice(0, 10).forEach(o => { o.proof = { kind: 'muestra', name: o.proof.name }; });
      try { store.set(JSON.stringify(db)); } catch (e2) { console.warn('LottoX: no se pudo guardar', e2); }
    }
    subs.forEach(f => { try { f(version); } catch (e) { console.error(e); } });
  }
  window.addEventListener('storage', e => { if (e.key === KEY) { load(); version++; subs.forEach(f => f(version)); } });
  load();

  /* ---------- reglas compartidas ---------- */
  const now = () => Date.now();
  const raffle = id => db.raffles.find(r => r.id === id);
  const client = ced => db.clients.find(c => c.cedula === cedKey(ced));
  const method = id => db.paymentMethods.find(m => m.id === id);
  const caja = id => db.cajas.find(c => c.id === id);
  const rate = () => (db.currencies.find(c => c.code === 'VES') || { rate: 1 }).rate;
  const digits = r => String(r.total - 1).length;
  const pad = (r, n) => String(n).padStart(digits(r), '0');
  const gatewayActive = () => Object.values(db.gateways).some(g => g.enabled && g.steps.every(s => s.done));
  const gatewayState = g => {
    const done = g.steps.filter(s => s.done).length;
    return done === g.steps.length ? (g.enabled ? { key: 'activa', label: 'Activa' } : { key: 'pausada', label: 'Pausada' }) : { key: 'incompleta', label: `Incompleta · paso ${done + 1} de ${g.steps.length}`, step: done };
  };
  function raffleState(r) {
    if (r.status === 'venta' && Date.parse(r.drawAt) <= now()) return 'falta-ganador';
    return r.status;
  }
  const STATE_LABEL = { borrador: 'Borrador', revision: 'En revisión CONALOT', rechazada: 'Rechazada', venta: 'En venta', 'falta-ganador': 'Falta ganador', finalizada: 'Finalizada', cancelada: 'Cancelada' };
  const editable = r => ['borrador', 'rechazada'].includes(r.status);
  const closesAt = r => Date.parse(r.drawAt) - (r.closeMinutes || 10) * 60e3;
  const onSale = r => r.status === 'venta' && closesAt(r) > now();
  function takenMap(rid) {
    const r = raffle(rid), map = new Map();
    db.orders.forEach(o => {
      if (o.raffleId !== rid) return;
      const st = o.status === 'aprobada' ? 'vendido' : (o.status === 'pendiente' || o.status === 'abono') ? 'reservado' : null;
      if (st) o.numbers.forEach(n => map.set(+n, st));
    });
    return map;
  }
  function raffleStats(rid) {
    const r = raffle(rid), os = db.orders.filter(o => o.raffleId === rid);
    const sold = os.filter(o => o.status === 'aprobada').reduce((a, o) => a + o.qty, 0);
    const reserved = os.filter(o => o.status === 'pendiente' || o.status === 'abono').reduce((a, o) => a + o.qty, 0);
    const revenueUSD = os.reduce((a, o) => a + (o.status === 'aprobada' ? o.amountUSD : o.status === 'abono' ? o.paidUSD : 0), 0);
    return { sold, reserved, available: r.total - sold - reserved, revenueUSD, orders: os.length, buyers: new Set(os.filter(o => o.status === 'aprobada').map(o => o.cedula)).size };
  }
  function freeNumbers(r, q, skip = new Set()) {
    const map = takenMap(r.id), out = [];
    let n = Math.floor(Math.random() * r.total), guard = 0;
    while (out.length < q && guard++ < r.total * 3) {
      n = (n * 7919 + 104729 + guard) % r.total;
      if (!map.has(n) && !skip.has(n) && !out.includes(pad(r, n))) out.push(pad(r, n));
    }
    if (out.length < q) for (let i = 0; i < r.total && out.length < q; i++) if (!map.has(i) && !skip.has(i) && !out.includes(pad(r, i))) out.push(pad(r, i));
    return out;
  }
  const priceFor = (r, q) => {
    // La mejor promoción por volumen que aplique; el resto, a precio normal.
    const promos = (r.promotions || []).filter(p => p.qty > 1 && p.priceUSD > 0).sort((a, b) => b.qty - a.qty);
    let left = q, total = 0;
    for (const p of promos) while (left >= p.qty) { total += p.priceUSD; left -= p.qty; }
    return r2(total + left * r.priceUSD);
  };

  function audit(action, detail, by) { db.audit.unshift({ id: uid('a'), at: iso(now()), by: by || db.me.short, action, detail }); if (db.audit.length > 400) db.audit.length = 400; }
  function deliverSim(seedStr, to, channel) {
    if (!to || to === '—') return ['fallido', channel === 'correo' ? 'El cliente no tiene correo' : 'Número sin WhatsApp'];
    if (channel === 'whatsapp' && !db.whatsapp.connected) return ['fallido', 'WhatsApp desconectado'];
    const h = hash(seedStr) % 100;
    return h < 4 ? ['fallido', channel === 'correo' ? 'El correo rebotó (buzón lleno)' : 'Límite de mensajes por hora alcanzado'] : h < 28 ? ['entregado', ''] : ['leido', ''];
  }
  const fill = (tpl, vars) => String(tpl || '').replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  function notify(key, order, extra = {}) {
    const a = db.automations.find(x => x.key === key), c = client(order.cedula) || {}, r = raffle(order.raffleId) || {};
    const vars = { nombre: (c.name || order.name || '').split(' ')[0], rifa: r.title, boletos: `${order.qty} ${order.qty === 1 ? 'boleto' : 'boletos'}`, numeros: order.numbers.join(', ') || 'se asignan al aprobar', monto: 'US$ ' + r2(order.paidUSD || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 }), saldo: 'US$ ' + r2(order.amountUSD - (order.paidUSD || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2 }), ...extra };
    // Al comprador siempre le llega el correo (si tiene); WhatsApp solo si la automatización está activa.
    if (c.email && ['compra_confirmada', 'pago_recibido', 'abono', 'ganador'].includes(key)) {
      const [st, reason] = deliverSim(order.id + key + 'mail', c.email, 'correo');
      db.messages.unshift({ id: uid('m'), at: iso(now()), channel: 'correo', to: c.email, cedula: c.cedula, name: c.name, kind: 'notificacion', ref: key, template: a ? a.template : key, body: fill(a ? a.body : '', vars), status: st, reason });
    }
    if (!a || !a.enabled) return;
    const [st, reason] = deliverSim(order.id + key + Date.now(), c.phone, 'whatsapp');
    db.messages.unshift({ id: uid('m'), at: iso(now()), channel: 'whatsapp', to: c.phone || '—', cedula: c.cedula, name: c.name, kind: 'automatizacion', ref: key, template: a.template, body: fill(a.body, vars), status: st, reason });
  }
  function upsertClient(data) {
    const key = cedKey(data.cedula); if (!key) throw err(400, 'Cédula inválida');
    let c = db.clients.find(x => x.cedula === key);
    if (!c) { c = { cedula: key, name: '', phone: '', email: '', state: '', municipality: '', consent: false, createdAt: iso(now()) }; db.clients.push(c); }
    ['name', 'phone', 'email', 'state', 'municipality'].forEach(k => { if (data[k]) c[k] = String(data[k]).trim(); });
    if (data.consent != null) c.consent = !!data.consent;
    return c;
  }

  function createOrder(o) {
    const r = raffle(o.raffleId); if (!r) throw err(404, 'La rifa no existe');
    if (!onSale(r)) throw err(409, 'Esta rifa no está en venta');
    const m = o.method ? method(o.method) : null;
    if (o.method && (!m || !m.active)) throw err(400, 'Método de pago no disponible');
    const qty = Math.max(1, parseInt(o.qty, 10) || (o.numbers || []).length || 1);
    const map = takenMap(r.id);
    const chosen = (o.numbers || []).map(n => pad(r, +n));
    const clash = chosen.filter(n => map.has(+n));
    if (clash.length) throw err(409, `Ya no están libres: ${clash.join(', ')}`);
    if (chosen.length && chosen.length !== qty) throw err(400, 'La cantidad no coincide con los números');
    const stats = raffleStats(r.id); if (qty > stats.available) throw err(409, `Solo quedan ${stats.available} boletos`);
    const c = upsertClient(o.customer || {});
    // Los fronts de venta no muestran promociones: en línea se cobra el precio normal (ver Hallazgos en el README).
    const amountUSD = o.channel === 'taquilla' ? priceFor(r, qty) : r2(qty * r.priceUSD), rt = rate();
    const order = {
      id: 'LG-' + (++db.seq), raffleId: r.id, cedula: c.cedula, name: c.name, qty, random: !chosen.length, numbers: chosen,
      amountUSD, rate: rt, amountBs: r2(amountUSD * rt), method: m ? m.id : '', currency: m ? m.currency : '',
      reference: String(o.reference || '').trim(), bank: o.bank || (m && m.bankCode) || '', payerPhone: o.payerPhone || '',
      proof: o.proof || null, channel: o.channel || 'online', cajaId: o.cajaId || '', sellerId: o.sellerId || '', influencer: String(o.influencer || '').toUpperCase(),
      status: 'pendiente', paidUSD: 0, createdAt: iso(now()), decidedAt: null, decidedBy: '', rejectReason: '',
      history: [{ at: iso(now()), text: o.channel === 'taquilla' ? 'Venta registrada en taquilla' : 'Compra recibida desde la página' }]
    };
    db.orders.unshift(order);
    return order;
  }
  function approve(order, by, note) {
    const r = raffle(order.raffleId);
    if (!order.numbers.length) order.numbers = freeNumbers(r, order.qty);
    order.status = 'aprobada'; order.paidUSD = order.amountUSD; order.decidedAt = iso(now()); order.decidedBy = by || db.me.short;
    order.history.push({ at: iso(now()), text: note || 'Pago aprobado · números asignados: ' + order.numbers.join(', '), by: order.decidedBy });
    notify('compra_confirmada', order);
  }

  /* ---------- API del panel ---------- */
  const A = {
    version: () => version,
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    get db() { return db; },
    reset() { db = seed(); commit(); },
    util: { cedKey, cedFmt, hash, r2, STATES, LOTTERIES, ROLES, REJECT_REASONS, STATE_LABEL },
    raffle, client, method, caja, rate, raffleState, raffleStats, takenMap, editable, onSale, closesAt, gatewayActive, gatewayState, priceFor, pad, digits, freeNumbers,

    /* Monedas y tasa */
    setRate(value, source) {
      const v = r2(+value); if (!(v > 0)) throw err(400, 'Escribe una tasa mayor que 0');
      const ves = db.currencies.find(c => c.code === 'VES'), prev = ves.rate;
      if (prev && Math.abs(v - prev) / prev > 0.25) throw err(400, `La tasa cambia más de 25 % (antes ${prev}). Revisa el número.`);
      Object.assign(ves, { rate: v, source: source || 'BCV (manual)', updatedAt: iso(now()), by: db.me.short });
      db.rateHistory.unshift({ at: iso(now()), rate: v, source: ves.source, by: db.me.short });
      audit('Tasa actualizada', `Bs/US$ ${v.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (${ves.source})`); commit();
    },
    saveCurrency(cur, isNew) {
      const code = String(cur.code || '').toUpperCase().trim();
      if (!/^[A-Z]{3,4}$/.test(code)) throw err(400, 'El código son 3 o 4 letras (por ejemplo, EUR)');
      const ex = db.currencies.find(c => c.code === code);
      if (isNew && ex) throw err(409, `Ya existe ${code}. Edítala en vez de crear otra.`);
      const r = +cur.rate; if (!(r > 0)) throw err(400, 'La tasa debe ser mayor que 0');
      if (code === 'EUR' && (r < 0.5 || r > 1.5)) throw err(400, 'Un euro vale entre 0,5 y 1,5 por dólar. Revisa la tasa.');
      if (code === 'USD' && r !== 1) throw err(400, 'El dólar es la moneda base: su tasa es 1');
      if (code === 'VES') return A.setRate(r);
      const data = { code, name: cur.name || code, symbol: cur.symbol || code, rate: r, active: !!cur.active, source: 'Manual', updatedAt: iso(now()), by: db.me.short };
      if (ex) Object.assign(ex, data); else db.currencies.push(data);
      audit(isNew ? 'Moneda agregada' : 'Moneda editada', `${code} · ${r}`); commit();
    },

    /* Métodos de pago */
    saveMethod(m) {
      const P = window.LOTTOGE_PAGOS;
      if (!String(m.name || '').trim()) throw err(400, 'Escribe el nombre que verá el comprador');
      // Nada de datos de prueba a la vista del comprador ("123✅✅✅", "werwerwrew").
      const looksFake = s => /(.)\1{3,}|werwer|asdf|qwer|xxxx|\btest\b|prueba123/i.test(s) || /^[\d\W]{1,4}$/.test(s.trim()) || /\p{Extended_Pictographic}/u.test(s);
      if (looksFake(m.name)) throw err(400, 'El nombre parece de prueba. Usa uno que entienda el comprador.');
      if ((m.accountInfo || []).some(([k, v]) => looksFake(String(k)) || (v && looksFake(String(v)) && !/^[\d\s-]{6,}$/.test(v)))) throw err(400, 'Hay datos de prueba en el método. Escribe datos reales para el comprador.');
      const cur = db.currencies.find(c => c.code === m.currency);
      if (!cur) throw err(400, 'Elige una moneda registrada en Monedas y tasas');
      const ic = P && P.ICONS[m.icon], def = P && P.DEFAULTS[m.icon];
      if (def && m.icon !== 'billetera' && m.icon !== 'tarjeta' && m.icon !== 'qr') {
        const want = def.currency, ok = want === m.currency || (want === 'USDT' && m.currency === 'USD') || (want === 'USD' && m.currency === 'USDT');
        if (!ok) throw err(400, `${ic.name} cobra en ${want}. Cambia la moneda o el icono.`);
      }
      (m.accountInfo || []).forEach(([k, v]) => {
        if (/tel[eé]fono/i.test(k) && v && !/^0(2\d{2}|4(12|14|16|22|24|26))-?\d{3}-?\d{4}$/.test(v.replace(/\s/g, ''))) throw err(400, `El teléfono "${v}" no tiene formato venezolano (0412-555-0199)`);
        if (/correo/i.test(k) && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) throw err(400, `El correo "${v}" no es válido`);
        if (/rif/i.test(k) && v && !/^[JVEGP]-?\d{8}-?\d$/i.test(v)) throw err(400, `El RIF "${v}" no es válido (J-50123456-7)`);
      });
      if (m.channel === 'online' && m.requireReceipt === false && !m.instant) throw err(400, 'Un método en línea sin pasarela necesita comprobante');
      const data = { id: m.id || uid('pm'), name: m.name.trim(), icon: m.icon, color: m.color || '', currency: m.currency, bankCode: m.bankCode || '', channel: m.channel, instant: !!m.instant, requireReceipt: m.instant ? false : !!m.requireReceipt, active: m.active !== false, accountInfo: (m.accountInfo || []).filter(([k, v]) => k && v), note: m.note || '', minTickets: +m.minTickets || 1, commissionRate: +m.commissionRate || 0 };
      const ex = method(data.id);
      if (ex) Object.assign(ex, data); else db.paymentMethods.push(data);
      audit(ex ? 'Método de pago editado' : 'Método de pago agregado', data.name); commit(); return data;
    },
    toggleMethod(id) { const m = method(id); m.active = !m.active; audit(m.active ? 'Método activado' : 'Método desactivado', m.name); commit(); },
    deleteMethod(id) {
      if (db.orders.some(o => o.method === id)) throw err(409, 'Tiene ventas registradas: desactívalo en vez de borrarlo');
      const m = method(id); db.paymentMethods = db.paymentMethods.filter(x => x.id !== id); audit('Método de pago eliminado', m.name); commit();
    },

    /* Rifas */
    validateRaffle(r, step) {
      const e = {};
      const s1 = () => {
        if (!r.images || !r.images.length) e.images = 'Sube el flyer oficial de la rifa.';
        if (!String(r.title || '').trim()) e.title = 'Escribe el título de la rifa.';
        const d = Date.parse(r.drawAt), tomorrow = new Date(); tomorrow.setHours(24, 0, 0, 0);
        if (!r.drawAt || isNaN(d)) e.drawAt = 'Elige la fecha y hora del sorteo.'; else if (d < tomorrow.getTime()) e.drawAt = 'Elige una fecha a partir de mañana.';
        if (!String(r.prize || '').trim()) e.prize = 'Escribe el premio principal.';
        if (!r.lottery) e.lottery = 'Elige la lotería que define el ganador.';
      };
      const s2 = () => {
        if (!(+r.priceUSD > 0)) e.priceUSD = 'El precio debe ser mayor que 0.';
        if (![100, 1000, 10000].includes(+r.total)) e.total = 'Elige 100, 1.000 o 10.000 números.';
        (r.promotions || []).forEach((p, i) => { if (!(p.qty > 1) || !(p.priceUSD > 0)) e['promo' + i] = 'Completa la cantidad y el precio de la promoción.'; else if (p.priceUSD >= p.qty * r.priceUSD) e['promo' + i] = 'La promoción debe costar menos que comprar los boletos sueltos.'; });
      };
      const s3 = () => {
        if (!(r.rules || []).filter(x => String(x).trim()).length) e.rules = 'Escribe al menos una regla.';
        if (!r.solvencyDoc) e.solvencyDoc = 'Adjunta el documento de solvencia del premio.';
      };
      if (!step || step === 1) s1(); if (!step || step === 2) s2(); if (!step || step === 3) s3();
      return e;
    },
    saveRaffle(r, submit) {
      const ex = r.id && raffle(r.id);
      if (ex && !editable(ex)) throw err(409, 'Esta rifa no se puede editar en su estado actual');
      if (submit) { const e = A.validateRaffle(r); if (Object.keys(e).length) throw Object.assign(err(400, 'Faltan datos'), { fields: e }); }
      const lot = LOTTERIES.find(l => l[0] === r.lottery) || ['', ''];
      const data = Object.assign(ex || { id: 'R-' + (100 + db.raffles.length + 1 + Math.floor(Math.random() * 10)), createdAt: iso(now()), winner: null, approvedAt: null, tone: 'violeta' }, {
        title: String(r.title || '').trim() || 'Rifa sin título', prize: String(r.prize || '').trim(), prizes: [r.prize, ...(r.prizes || []).slice(1)].filter(Boolean),
        lottery: r.lottery || '', lotteryTime: lot[1], drawAt: r.drawAt || '', closeMinutes: +r.closeMinutes || 10, priceUSD: +r.priceUSD || 0, total: +r.total || 1000,
        description: r.description || '', rules: (r.rules || []).map(String).filter(x => x.trim()), promotions: (r.promotions || []).filter(p => p.qty && p.priceUSD).map(p => ({ qty: +p.qty, priceUSD: +p.priceUSD })),
        images: r.images || [], solvencyDoc: r.solvencyDoc || '', status: submit ? 'revision' : 'borrador', rejectReason: submit ? '' : (ex ? ex.rejectReason : '')
      });
      if (!ex) db.raffles.unshift(data);
      audit(submit ? 'Rifa enviada a CONALOT' : 'Borrador guardado', data.title); commit(); return data;
    },
    conalotDecide(id, ok, reason) {
      const r = raffle(id); if (r.status !== 'revision') throw err(409, 'La rifa no está en revisión');
      if (ok) { r.status = 'venta'; r.approvedAt = iso(now()); r.rejectReason = ''; } else { if (!reason) throw err(400, 'Escribe el motivo'); r.status = 'rechazada'; r.rejectReason = reason; }
      audit(ok ? 'CONALOT aprobó la rifa' : 'CONALOT rechazó la rifa', r.title + (ok ? '' : ' · ' + reason), 'CONALOT (simulado)'); commit();
    },
    savePromotions(id, promotions) {
      const r = raffle(id);
      const list = promotions.filter(p => p.qty && p.priceUSD).map(p => ({ qty: +p.qty, priceUSD: +p.priceUSD }));
      list.forEach(p => { if (p.qty < 2) throw err(400, 'La promoción es desde 2 boletos'); if (p.priceUSD >= p.qty * r.priceUSD) throw err(400, `${p.qty} boletos por US$ ${p.priceUSD} no es descuento (sueltos: US$ ${p.qty * r.priceUSD})`); });
      r.promotions = list.sort((a, b) => a.qty - b.qty); audit('Promociones actualizadas', r.title); commit();
    },
    findWinner(id, result) {
      const r = raffle(id), dg = digits(r);
      const s = String(result || '').replace(/\D/g, ''); if (!s) return null;
      const num = s.slice(-dg).padStart(dg, '0');
      const o = db.orders.find(x => x.raffleId === id && x.numbers.includes(num) && ['aprobada', 'pendiente', 'abono'].includes(x.status));
      return { number: num, order: o || null, sold: !!(o && o.status === 'aprobada'), client: o ? client(o.cedula) : null };
    },
    reportWinner(id, { result, evidence, notifyAll }) {
      const r = raffle(id); if (raffleState(r) !== 'falta-ganador') throw err(409, 'Esta rifa no espera ganador');
      const w = A.findWinner(id, result); if (!w) throw err(400, 'Escribe el número ganador publicado por la lotería');
      if (!evidence) throw err(400, 'Adjunta la evidencia del resultado');
      r.status = 'finalizada';
      r.winner = { number: w.number, result, orderId: w.order ? w.order.id : '', cedula: w.order ? w.order.cedula : '', name: w.order ? w.order.name : '', sold: w.sold, evidence, reportedAt: iso(now()), notified: !!notifyAll };
      // Pagos que seguían abiertos en esta rifa: vencen al cerrar.
      db.orders.filter(o => o.raffleId === id && (o.status === 'pendiente')).forEach(o => { o.status = 'vencida'; o.history.push({ at: iso(now()), text: 'Vencida: la rifa cerró' }); });
      if (notifyAll) {
        const seen = new Set();
        db.orders.filter(o => o.raffleId === id && o.status === 'aprobada').forEach(o => { if (seen.has(o.cedula)) return; seen.add(o.cedula); notify('ganador', o, { numero: w.number }); });
      }
      audit('Ganador reportado', `${r.title} · número ${w.number}${w.sold ? ' · ' + w.order.name : ' · no vendido'}`); commit(); return r.winner;
    },

    /* Ventas */
    createOrder(o) { const order = createOrder(o); if (order.proof) notify('pago_recibido', order); audit('Compra recibida', `${order.id} · ${raffle(order.raffleId).title} · ${order.qty} boleto(s)`, 'Página pública'); commit(); return order; },
    sellCounter(o) {
      // Taquilla: la venta queda aprobada al instante (o como abono si se cobra una parte).
      const order = createOrder(Object.assign({}, o, { channel: 'taquilla' }));
      const paid = o.partialUSD ? r2(+o.partialUSD) : 0;
      if (paid && paid < order.amountUSD) {
        if (!order.numbers.length) order.numbers = freeNumbers(raffle(order.raffleId), order.qty);
        order.status = 'abono'; order.paidUSD = paid; order.history.push({ at: iso(now()), text: `Abono de US$ ${paid} en taquilla`, by: db.me.short });
        notify('abono', order);
      } else approve(order, (caja(o.cajaId) || {}).name || 'Taquilla', 'Venta cobrada en taquilla · números: ');
      if (order.status === 'aprobada') order.history[order.history.length - 1].text += order.numbers.join(', ');
      audit('Venta en taquilla', `${order.id} · ${raffle(order.raffleId).title} · ${order.qty} boleto(s)`); commit(); return order;
    },
    approveOrder(id, { force } = {}) {
      const o = db.orders.find(x => x.id === id); if (!o) throw err(404, 'No existe');
      if (o.status !== 'pendiente') throw err(409, 'Este pago ya no está por verificar');
      const m = method(o.method);
      const hasEvidence = o.reference || o.proof || (m && !m.requireReceipt);
      if (!hasEvidence && !force) throw err(412, 'Este pago no tiene referencia ni comprobante');
      approve(o, db.me.short, force && !hasEvidence ? 'Aprobado sin comprobante (confirmado por el operador)' : null);
      if (force && !hasEvidence) o.history[o.history.length - 1].text += ' · números: ' + o.numbers.join(', ');
      audit(force && !hasEvidence ? 'Pago aprobado sin comprobante' : 'Pago aprobado', `${o.id} · ${o.name} · US$ ${o.amountUSD}`); commit(); return o;
    },
    rejectOrder(id, reason) {
      const o = db.orders.find(x => x.id === id); if (!o) throw err(404, 'No existe');
      if (!['pendiente', 'abono'].includes(o.status)) throw err(409, 'Este pago ya se revisó');
      if (!String(reason || '').trim()) throw err(400, 'Escribe el motivo del rechazo');
      o.status = 'rechazada'; o.rejectReason = reason; o.decidedAt = iso(now()); o.decidedBy = db.me.short;
      o.history.push({ at: iso(now()), text: 'Pago rechazado: ' + reason + (o.numbers.length ? ' · se liberan ' + o.numbers.join(', ') : ''), by: db.me.short });
      audit('Pago rechazado', `${o.id} · ${reason}`); commit();
    },
    registerPayment(id, amountUSD, methodId, reference) {
      const o = db.orders.find(x => x.id === id); if (!o || o.status !== 'abono') throw err(409, 'Esta venta no es un abono');
      const v = r2(+amountUSD), due = r2(o.amountUSD - o.paidUSD);
      if (!(v > 0)) throw err(400, 'Escribe el monto');
      if (v > due) throw err(400, `El saldo es US$ ${due}`);
      o.paidUSD = r2(o.paidUSD + v);
      o.history.push({ at: iso(now()), text: `Pago de US$ ${v}${methodId ? ' · ' + ((method(methodId) || {}).name || '') : ''}${reference ? ' · ref. ' + reference : ''}`, by: db.me.short });
      if (o.paidUSD >= o.amountUSD) approve(o, db.me.short, 'Saldo completado · venta confirmada'); else notify('abono', o);
      audit('Abono registrado', `${o.id} · US$ ${v}`); commit(); return o;
    },
    expireClosed() {
      let n = 0;
      db.orders.forEach(o => { const r = raffle(o.raffleId); if (o.status === 'pendiente' && raffleState(r) !== 'venta') { o.status = 'vencida'; o.history.push({ at: iso(now()), text: 'Vencida: la rifa ya cerró' }); n++; } });
      if (n) { audit('Pagos vencidos', `${n} pagos de rifas cerradas`); commit(); }
      return n;
    },

    /* Clientes e influencers */
    saveClient(c) { const x = upsertClient(c); audit('Cliente actualizado', x.name); commit(); return x; },
    setConsent(ced, v) { const c = client(ced); c.consent = !!v; commit(); },
    saveInfluencer(f) {
      const code = String(f.code || '').toUpperCase().trim();
      if (!String(f.name || '').trim()) throw err(400, 'Escribe el nombre');
      if (!/^[A-Z0-9]{3,15}$/.test(code)) throw err(400, 'El código: de 3 a 15 letras o números, sin espacios');
      if (db.influencers.some(i => i.code === code && i.id !== f.id)) throw err(409, 'Ese código ya existe');
      const pct = +f.commissionPct; if (!(pct > 0 && pct <= 50)) throw err(400, 'La comisión va de 1 a 50 %');
      if (f.phone && !/^0(4(12|14|16|22|24|26))-?\d{3}-?\d{4}$/.test(f.phone.replace(/\s/g, ''))) throw err(400, 'El WhatsApp no tiene formato venezolano (0414-000-0000)');
      const data = { id: f.id || uid('inf'), name: f.name.trim(), handle: f.handle || '', code, commissionPct: pct, phone: f.phone || '', bankCode: f.bankCode || '', account: f.account || '', raffles: f.raffles || 'todas', active: f.active !== false, paidUSD: f.paidUSD || 0, createdAt: f.createdAt || iso(now()) };
      const ex = db.influencers.find(i => i.id === data.id); if (ex) Object.assign(ex, data); else db.influencers.push(data);
      audit(ex ? 'Influencer editado' : 'Influencer creado', data.name + ' · ' + code); commit();
    },
    payInfluencer(id, amount) { const i = db.influencers.find(x => x.id === id); i.paidUSD = r2(i.paidUSD + +amount); audit('Comisión pagada', `${i.name} · US$ ${amount}`); commit(); },

    /* Cajas y usuarios */
    saveCaja(c) {
      if (!String(c.name || '').trim()) throw err(400, 'Escribe el nombre de la caja');
      if (!/^[A-Z]{2}-\d{2}$/.test(String(c.code || '').toUpperCase())) throw err(400, 'El código: dos letras y dos números (TQ-04)');
      if (db.cajas.some(x => x.code === c.code.toUpperCase() && x.id !== c.id)) throw err(409, 'Ese código ya existe');
      const loc = String(c.location || '').trim();
      if (loc.length < 6 || !/[aeiouáéíóú]/i.test(loc) || /([bcdfghjklmnpqrstvwxyz]{5,})/i.test(loc)) throw err(400, 'Escribe una ubicación real (calle, local o sector)');
      const data = { id: c.id || uid('cj'), code: c.code.toUpperCase(), name: c.name.trim(), type: c.type || 'fija', location: loc, state: c.state || db.company.state, userId: c.userId || '', pin: !!c.pin, raffles: c.raffles || 'todas', active: c.active !== false };
      const ex = caja(data.id); if (ex) Object.assign(ex, data); else db.cajas.push(data);
      audit(ex ? 'Caja editada' : 'Caja creada', data.name); commit();
    },
    inviteUser(u) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u.email || '')) throw err(400, 'Escribe un correo válido');
      if (db.users.some(x => x.email.toLowerCase() === u.email.toLowerCase() && x.id !== u.id)) throw err(409, 'Ya hay un usuario con ese correo');
      if (!ROLES[u.role]) throw err(400, 'Elige un rol');
      if (u.role === 'taquillero' && !u.cajaId) throw err(400, 'Un taquillero necesita una caja');
      const ex = db.users.find(x => x.id === u.id);
      if (ex) { Object.assign(ex, { name: u.name, role: u.role, cajaId: u.cajaId || '' }); audit('Usuario editado', u.email); }
      else { db.users.push({ id: uid('u'), name: u.name || '', email: u.email, role: u.role, cajaId: u.cajaId || '', status: 'invitado', lastAt: null, createdAt: iso(now()) }); audit('Invitación enviada', u.email); }
      commit();
    },
    setUserStatus(id, status) { const u = db.users.find(x => x.id === id); if (u.id === 'u-1') throw err(409, 'No puedes desactivar tu propia cuenta'); u.status = status; audit(status === 'inactivo' ? 'Usuario desactivado' : 'Usuario activado', u.email); commit(); },

    /* Mensajería */
    sendMessage(convId, text) {
      const cv = db.conversations.find(c => c.id === convId), t = String(text || '').trim(); if (!t) return;
      cv.messages.push({ from: 'agente', type: 'texto', text: t, at: iso(now()), by: db.me.short }); cv.unread = 0;
      if (!cv.assignedTo) cv.assignedTo = db.me.short;
      db.messages.unshift({ id: uid('m'), at: iso(now()), channel: 'whatsapp', to: cv.phone, cedula: cv.cedula, name: cv.name || cv.phone, kind: 'manual', ref: 'bandeja', template: '', body: t, status: db.whatsapp.connected ? 'entregado' : 'fallido', reason: db.whatsapp.connected ? '' : 'WhatsApp desconectado' });
      commit();
    },
    markRead(convId) { const cv = db.conversations.find(c => c.id === convId); if (cv && cv.unread) { cv.unread = 0; commit(); } },
    assignConv(convId) { const cv = db.conversations.find(c => c.id === convId); cv.assignedTo = cv.assignedTo === db.me.short ? '' : db.me.short; commit(); },
    archiveConv(convId) { const cv = db.conversations.find(c => c.id === convId); cv.status = cv.status === 'archivada' ? 'abierta' : 'archivada'; commit(); },
    simulateIncoming() {
      const pool = db.clients.filter(c => c.phone && !c.test), c = pool[Math.floor(Math.random() * pool.length)];
      const texts = ['Hola, ¿todavía hay boletos?', '¿Cuánto cuesta el boleto en bolívares?', 'Ya pagué por Pago Móvil, ¿me confirman?', '¿A qué hora es el sorteo?', '¿Puedo pagar con Zelle?'];
      let cv = db.conversations.find(x => x.cedula === c.cedula);
      if (!cv) { cv = { id: uid('cv'), name: c.name, cedula: c.cedula, phone: c.phone, unread: 0, status: 'abierta', assignedTo: '', messages: [] }; db.conversations.unshift(cv); }
      cv.status = 'abierta'; cv.unread++; cv.messages.push({ from: 'cliente', type: 'texto', text: texts[Math.floor(Math.random() * texts.length)], at: iso(now()) });
      db.conversations = [cv, ...db.conversations.filter(x => x !== cv)]; commit(); return cv;
    },
    audience(segment, selected) {
      const monthAgo = now() - 30 * DAY, q90 = now() - 90 * DAY;
      const last = {}; db.orders.forEach(o => { const t = Date.parse(o.createdAt); if (!last[o.cedula] || t > last[o.cedula]) last[o.cedula] = t; });
      const owes = new Set(db.orders.filter(o => o.status === 'abono').map(o => o.cedula));
      const f = {
        todos: () => true, saldo: c => owes.has(c.cedula), nuevos: c => Date.parse(c.createdAt) >= monthAgo,
        inactivos: c => (last[c.cedula] || 0) < q90, correo: c => !!c.email, seleccionados: c => (selected || []).includes(c.cedula)
      }[segment] || (() => false);
      return db.clients.filter(f);
    },
    createCampaign(cp, mode) {
      if (mode !== 'borrador') {
        if (!String(cp.name || '').trim()) throw err(400, 'Ponle un nombre a la campaña');
        if (!String(cp.body || '').trim()) throw err(400, 'Escribe el mensaje');
        if (cp.channel === 'correo' && !String(cp.subject || '').trim()) throw err(400, 'Escribe el asunto del correo');
        if (mode === 'programada' && !(Date.parse(cp.scheduledAt) > now())) throw err(400, 'Elige una fecha futura para programarla');
      }
      const people = A.audience(cp.segment, cp.selected);
      const data = { id: cp.id || uid('cp'), name: cp.name || '', channel: cp.channel, segment: cp.segment, selected: cp.selected || [], audienceLabel: cp.audienceLabel || '', template: cp.template || '', subject: cp.subject || '', body: cp.body || '', status: mode === 'ahora' ? 'enviada' : mode, createdAt: iso(now()), sentAt: mode === 'ahora' ? iso(now()) : null, scheduledAt: mode === 'programada' ? cp.scheduledAt : null };
      const ex = db.campaigns.find(x => x.id === data.id); if (ex) Object.assign(ex, data); else db.campaigns.unshift(data);
      let skipped = 0;
      if (mode === 'ahora') {
        people.forEach(c => {
          // Promociones solo a quien dio su consentimiento (políticas de Meta).
          if (data.channel === 'whatsapp' && !c.consent) { skipped++; return; }
          const to = data.channel === 'correo' ? c.email : c.phone;
          const [st, reason] = deliverSim(data.id + c.cedula, to, data.channel);
          db.messages.unshift({ id: uid('m'), at: iso(now()), channel: data.channel, to: to || '—', cedula: c.cedula, name: c.name, kind: 'campana', ref: data.id, template: data.template, body: fill(data.body, { nombre: c.name.split(' ')[0] }), status: st, reason });
        });
      }
      audit(mode === 'ahora' ? 'Campaña enviada' : mode === 'programada' ? 'Campaña programada' : 'Borrador de campaña', `${data.name || 'Sin nombre'} · ${people.length} destinatarios`); commit();
      return { campaign: data, recipients: people.length - skipped, skipped };
    },
    deleteCampaign(id) { db.campaigns = db.campaigns.filter(c => c.id !== id); commit(); },
    toggleAutomation(key) { const a = db.automations.find(x => x.key === key); a.enabled = !a.enabled; audit(a.enabled ? 'Automatización activada' : 'Automatización desactivada', a.name); commit(); },
    saveAutomation(key, body) { if (!String(body || '').trim()) throw err(400, 'El mensaje no puede quedar vacío'); const a = db.automations.find(x => x.key === key); a.body = body; audit('Mensaje automático editado', a.name); commit(); },
    runReminders() {
      const owes = db.orders.filter(o => o.status === 'abono');
      owes.forEach(o => notify('recordatorio', o)); commit(); return owes.length;
    },
    renewAgents(ids) { ids.forEach(id => { const a = db.agents.find(x => x.id === id); a.expiresAt = iso(now() + 90 * DAY); }); audit('Accesos de agentes renovados', `${ids.length} agentes`); commit(); },
    addAgent(name, email) {
      if (!String(name || '').trim()) throw err(400, 'Escribe el nombre');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) throw err(400, 'Escribe un correo válido');
      db.agents.push({ id: uid('ag'), name, email, expiresAt: iso(now() + 90 * DAY), chats: 0 }); audit('Agente agregado', name); commit();
    },
    removeAgent(id) { db.agents = db.agents.filter(a => a.id !== id); commit(); },
    saveBot(b) { if (!String(b.welcome || '').trim()) throw err(400, 'Escribe el mensaje de bienvenida'); Object.assign(db.bot, b); audit('Bot actualizado', 'Asistente automático'); commit(); },
    botReply(text, ctx = {}) {
      const t = String(text || '').trim(), b = db.bot;
      const live = db.raffles.find(r => r.id === db.sitePublished.raffleId && onSale(r)) || db.raffles.find(onSale);
      if (ctx.waitingCedula) {
        const c = client(t);
        if (!c) return { text: 'No encontré esa cédula. Revísala y escríbela sin puntos, por ejemplo 18456732.', ctx };
        const act = db.orders.filter(o => o.cedula === c.cedula && o.status === 'aprobada' && raffleState(raffle(o.raffleId)) === 'venta');
        const nums = act.flatMap(o => o.numbers), pend = db.orders.filter(o => o.cedula === c.cedula && (o.status === 'pendiente' || o.status === 'abono')).length;
        const by = {}; act.forEach(o => { (by[o.raffleId] = by[o.raffleId] || []).push(...o.numbers); });
        return { text: nums.length ? `${c.name.split(' ')[0]}, tienes ${nums.length} boletos activos: ${Object.entries(by).map(([rid, ns]) => raffle(rid).title + ': ' + ns.sort().join(', ')).join(' · ')}${pend ? `. Además tienes ${pend} pago(s) en revisión.` : '.'}` : `${c.name.split(' ')[0]}, no tienes boletos activos${pend ? `, pero tienes ${pend} pago(s) en revisión` : ''}.`, ctx: {} };
      }
      const resp = b.responses.find(x => x.key === t);
      if (!resp) return { text: b.welcome, ctx: {} };
      if (t === '2') return { text: fill(resp.text, {}), ctx: { waitingCedula: true } };
      return { text: fill(resp.text, { rifa: live ? live.title : 'por anunciar', enlace: `${db.company.subdomain}.lottoge.net` }), ctx: {}, handoff: t === '3' };
    },
    setWhatsapp(connected) { db.whatsapp.connected = connected; if (connected) db.whatsapp.connectedAt = iso(now()); audit(connected ? 'WhatsApp reconectado' : 'WhatsApp desconectado', db.whatsapp.number); commit(); },

    /* Ajustes */
    saveCompany(c) {
      const e = {};
      if (!String(c.name || '').trim()) e.name = 'Escribe el nombre comercial.';
      if (!/^[JVEGP]-\d{8}-\d$/.test(String(c.rif || '').toUpperCase())) e.rif = 'El RIF va así: J-50123456-7.';
      if (!c.state || !STATES[c.state]) e.state = 'Elige el estado.';
      if (!c.municipality || (STATES[c.state] && !STATES[c.state].includes(c.municipality))) e.municipality = 'Elige el municipio.';
      if (c.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) e.email = 'El correo no es válido.';
      if (c.whatsapp && !/^0(4(12|14|16|22|24|26))-?\d{3}-?\d{4}$/.test(c.whatsapp.replace(/\s/g, ''))) e.whatsapp = 'Formato: 0412-555-0199.';
      if (c.phone && !/^0(2\d{2}|4(12|14|16|22|24|26))-?\d{3}-?\d{4}$/.test(c.phone.replace(/\s/g, ''))) e.phone = 'Formato: 0274-555-0142.';
      if (Object.keys(e).length) throw Object.assign(err(400, 'Revisa los campos marcados'), { fields: e });
      Object.assign(db.company, c, { rif: c.rif.toUpperCase() }); audit('Datos de la empresa guardados', db.company.name); commit();
    },
    gatewayStep(gw, key, data = {}) {
      const g = db.gateways[gw], i = g.steps.findIndex(s => s.key === key), s = g.steps[i];
      if (g.steps.slice(0, i).some(x => !x.done)) throw err(409, 'Completa primero los pasos anteriores');
      if (key === 'credenciales') {
        if (gw === 'avilapay' && !/^[A-Za-z0-9_-]{16,}$/.test(data.merchantKey || '')) throw err(400, 'La clave del comercio tiene al menos 16 caracteres, sin espacios');
        if (gw === 'chinchin' && (!data.apiKey || !data.secret || !/^\d{4,}$/.test(data.merchantId || ''))) throw err(400, 'Completa la clave API, la llave secreta y el ID de comercio (solo números)');
        g.credentials = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, '••••' + String(v).slice(-4)]));
      }
      s.done = true; s.doneAt = iso(now());
      audit(`${g.name}: ${s.title}`, gatewayState(g).label); commit();
      return gatewayState(g);
    },
    toggleGateway(gw) { const g = db.gateways[gw]; g.enabled = !g.enabled; audit(g.enabled ? `${g.name} activada` : `${g.name} pausada`, ''); commit(); },
    saveSite(s, publish) {
      if (s.accent === 'propio' && !/^#[0-9a-f]{6}$/i.test(s.accentCustom || '')) throw err(400, 'El color propio va en hexadecimal: #5638c9');
      if (s.support && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.support)) throw err(400, 'El correo de soporte no es válido');
      Object.assign(db.site, s);
      if (publish) { db.sitePublished = clone(db.site); db.sitePublishedAt = iso(now()); audit('Página pública publicada', `Plantilla ${s.template}`); }
      commit();
    },
    addDomain(host) {
      const h = String(host || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(h)) throw err(400, 'Escribe un dominio como rifasmerida.com (sin http ni barras)');
      if (/lottoge\.net$/.test(h)) throw err(400, 'Ese ya es tu subdominio de LottoX');
      if (db.domains.some(d => d.host === h)) throw err(409, 'Ese dominio ya está agregado');
      const token = 'lottox-verify=' + hash(h + db.company.id).toString(16);
      db.domains.push({ id: uid('dm'), host: h, addedAt: iso(now()), attempts: 0, records: [
        { type: 'CNAME', name: h.split('.').length > 2 ? h.split('.')[0] : 'www', value: `${db.company.subdomain}.lottoge.net`, ok: false },
        { type: 'TXT', name: '_lottox', value: token, ok: false }
      ] });
      audit('Dominio agregado', h); commit();
    },
    verifyDomain(id) {
      const d = db.domains.find(x => x.id === id); d.attempts++;
      // Simulación de la propagación de DNS: el TXT aparece en el primer intento, el CNAME en el segundo.
      d.records[1].ok = true; if (d.attempts >= 2) d.records[0].ok = true;
      d.checkedAt = iso(now()); if (d.records.every(r => r.ok)) audit('Dominio verificado', d.host); commit();
      return d.records.every(r => r.ok);
    },
    removeDomain(id) { const d = db.domains.find(x => x.id === id); db.domains = db.domains.filter(x => x.id !== id); audit('Dominio eliminado', d.host); commit(); },
    changePassword(current, next) {
      if (current !== db.security.password) throw Object.assign(err(400, 'La contraseña actual no es correcta'), { fields: { current: 'La contraseña actual no es correcta.' } });
      if (next.length < 8 || !/[A-Z]/.test(next) || !/\d/.test(next) || !/[^A-Za-z0-9]/.test(next)) throw err(400, 'La nueva contraseña no cumple los requisitos');
      if (next === current) throw err(400, 'La nueva contraseña debe ser distinta');
      db.security.password = next; db.security.changedAt = iso(now()); audit('Contraseña cambiada', ''); commit();
    },
    closeSession(id) { db.security.sessions = db.security.sessions.filter(s => s.id !== id || s.current); audit('Sesión cerrada', ''); commit(); },
    closeOtherSessions() { const n = db.security.sessions.filter(s => !s.current).length; db.security.sessions = db.security.sessions.filter(s => s.current); audit('Sesiones cerradas', `${n} dispositivos`); commit(); },
    markNotifications(ids) { db.readNotifications = [...new Set([...db.readNotifications, ...ids])]; commit(); },

    /* ---------- API con las rutas del servidor real (la usan los fronts de venta) ----------
       http('GET', '/raffles/R-101') → Promise<{ status, data }>. Simula la latencia de la red. */
    http(verb, path, body) {
      const wait = ms => new Promise(ok => setTimeout(ok, ms));
      const [p, qs] = path.split('?'), q = new URLSearchParams(qs || ''), seg = p.replace(/^\/+|\/+$/g, '').split('/');
      const ok = data => ({ status: 'success', data });
      const run = async () => {
        await wait(verb === 'GET' ? 180 : 420);
        // GET /raffles/{id}                                         [observado]
        if (verb === 'GET' && seg[0] === 'raffles' && seg.length === 2) {
          const r = raffle(seg[1]); if (!r || ['borrador', 'revision', 'rechazada'].includes(r.status)) throw err(404, 'Rifa no encontrada');
          const st = raffleStats(r.id);
          return ok({ id: r.id, name: r.title, prize: r.prize, prizes: r.prizes, drawDate: r.drawAt, totalNumbers: r.total, ticketPrice: r.priceUSD, currency: 'USD', lottery: r.lottery, lotteryTime: r.lotteryTime, status: raffleState(r), images: r.images, soldTickets: st.sold, reservedTickets: st.reserved, promotions: r.promotions, onSale: onSale(r) });
        }
        // GET /raffles/{id}/taken                                   [por confirmar]
        if (verb === 'GET' && seg[0] === 'raffles' && seg[2] === 'taken') return ok([...takenMap(seg[1]).keys()]);
        // GET /exchange-rate/current                                [observado]
        if (verb === 'GET' && p === '/exchange-rate/current') { const v = db.currencies.find(c => c.code === 'VES'); return ok({ rate: v.rate, date: v.updatedAt, source: v.source }); }
        // GET /companies/{id}/service-fee-public                    [observado]
        if (verb === 'GET' && seg[0] === 'companies' && seg[2] === 'service-fee-public') return ok({ serviceFeeRate: db.company.serviceFee || 0 });
        // GET /payment-methods/active?companyId=                    [observado]
        if (verb === 'GET' && p === '/payment-methods/active') {
          const gw = gatewayActive();
          return ok(db.paymentMethods.filter(m => m.active && m.channel !== 'taquilla' && (!m.instant || gw) && (db.currencies.find(c => c.code === m.currency) || {}).active)
            .map(m => ({ id: m.id, name: m.name, icon: m.icon, color: m.color || undefined, note: m.note, currency: m.currency, isOnline: !!(m.instant && gw), requireReceipt: !!m.requireReceipt, minTickets: m.minTickets || 1, commissionRate: m.commissionRate || 0, accountInfo: m.accountInfo })));
        }
        // GET /platform/client-lookup/{cedula}                      [observado]
        if (verb === 'GET' && seg[0] === 'platform' && seg[1] === 'client-lookup') { const c = client(decodeURIComponent(seg[2])); if (!c) throw err(404, 'No existe'); return ok({ name: c.name, phone: c.phone, email: c.email, state: c.state }); }
        // POST /orders                                              [por confirmar]
        if (verb === 'POST' && p === '/orders') {
          const o = createOrder({ raffleId: body.raffleId, method: body.paymentMethodId, qty: body.ticketCount, numbers: body.numbers, customer: { cedula: body.customer.idNumber, name: body.customer.name, phone: body.customer.phone, email: body.customer.email, state: body.customer.state }, channel: 'online' });
          audit('Compra recibida', `${o.id} · ${raffle(o.raffleId).title} · ${o.qty} boleto(s)`, 'Página pública'); commit();
          return ok({ id: o.id, code: o.id, status: o.status, total: o.amountUSD, totalBs: o.amountBs, rate: o.rate });
        }
        // POST /orders/{id}/verify  (Pago Móvil al instante con la pasarela)   [por confirmar]
        if (verb === 'POST' && seg[0] === 'orders' && seg[2] === 'verify') {
          await wait(1800);
          const o = db.orders.find(x => x.id === seg[1]); if (!o) throw err(404, 'Orden no encontrada');
          o.reference = body.reference || ''; o.payerPhone = body.payerPhone || ''; o.bank = body.bank || o.bank;
          const gwName = Object.values(db.gateways).find(g => g.enabled && g.steps.every(s => s.done));
          // Simulación del banco: una referencia que termina en 0 no aparece.
          if (!gwName || /0$/.test(o.reference)) {
            o.status = 'rechazada'; o.rejectReason = gwName ? 'La pasarela no encontró el pago' : 'No hay pasarela activa'; o.decidedAt = iso(now()); o.decidedBy = gwName ? gwName.name : 'Sistema';
            o.history.push({ at: iso(now()), text: 'Pago móvil no verificado: ' + o.rejectReason }); commit();
            return ok({ approved: false, reason: o.rejectReason });
          }
          approve(o, gwName.name, 'Verificado al instante por ' + gwName.name + ' · números: ');
          o.history[o.history.length - 1].text += o.numbers.join(', ');
          audit('Pago verificado por la pasarela', `${o.id} · ${gwName.name}`, gwName.name); commit();
          return ok({ approved: true, numbers: o.numbers });
        }
        // POST /orders/{id}/receipt (comprobante)                   [por confirmar]
        if (verb === 'POST' && seg[0] === 'orders' && seg[2] === 'receipt') {
          const o = db.orders.find(x => x.id === seg[1]); if (!o) throw err(404, 'Orden no encontrada');
          o.reference = body.reference || ''; if (body.bank) o.bank = body.bank; o.proof = body.receipt || null;
          o.history.push({ at: iso(now()), text: 'Comprobante recibido · ref. ' + (o.reference || '—') });
          notify('pago_recibido', o); commit();
          return ok({ id: o.id, status: o.status });
        }
        // GET /orders?cedula=&raffleId=                             [por confirmar]
        if (verb === 'GET' && p === '/orders') {
          const c = client(q.get('cedula')); const os = c ? db.orders.filter(o => o.cedula === c.cedula && o.raffleId === q.get('raffleId') && ['aprobada', 'pendiente', 'abono'].includes(o.status)) : [];
          return ok({ customerName: c ? c.name : '', ticketCount: os.reduce((a, o) => a + o.qty, 0), orders: os.map(o => ({ id: o.id, code: o.id, paymentMethodName: (method(o.method) || {}).name || 'Taquilla', amountLabel: 'US$ ' + o.amountUSD.toLocaleString('es-VE', { minimumFractionDigits: 2 }), status: o.status === 'aprobada' ? 'paid' : 'pending', numbers: o.status === 'aprobada' || o.status === 'abono' ? o.numbers : [], note: o.status === 'abono' ? `Abono: saldo pendiente US$ ${r2(o.amountUSD - o.paidUSD)}. Tus números están reservados.` : '' })) });
        }
        throw err(404, 'Ruta no simulada: ' + verb + ' ' + path);
      };
      return run().catch(e => Promise.reject(Object.assign(e, { status: e.status || 500 })));
    }
  };
  window.LottoAPI = A;
})();
