/* ================= Métodos de pago de LottoGE =================
   Catálogo común a todas las plantillas de venta: iconos, valores por defecto de cada tipo de pago,
   monedas y bancos de Venezuela.

   - La página toma los métodos de config.js (paymentMethods). En la plataforma vienen del API
     (GET /api/v1/payment-methods/active?companyId=…): LOTTOGE_PAGOS.fromApi() convierte cada uno.
   - Cada método solo necesita id, name e icon, más los datos de su cuenta (accountInfo).
     Lo demás (color, qué se le pide al comprador, moneda) sale del icono si no se indica.
   - Un mismo icono sirve para varios métodos: por ejemplo, cinco Pago Móvil de bancos distintos,
     cada uno con su color.
   - Sin límite de métodos. Con más de 4, la página los agrupa por moneda. */
window.LOTTOGE_PAGOS = (() => {
  const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const F = 'fill="currentColor"';

  /* Iconos de 24 × 24 en un solo color (currentColor). Son dibujos propios, no logos oficiales:
     si LottoGE consigue el permiso de una marca, puede cambiar el dibujo aquí sin tocar nada más.
     color e ink: fondo y dibujo de la ficha cuadrada que se ve en la página (aproximados a cada marca). */
  const ICONS = {
    'pago-movil': { name: 'Pago Móvil', color: '#0f9d58', ink: '#ffffff', kind: 'banco-ve',
      glyph: `<rect x="6" y="2" width="12" height="20" rx="2.5" ${S}/><path d="M10.5 18.5h3" ${S}/><path d="m9.2 10.4 2 2 3.8-4.2" ${S}/>` },
    'comprobante': { name: 'Pago con comprobante', color: '#1d5fbf', ink: '#ffffff', kind: 'banco-ve',
      glyph: `<path d="M6 2.5h8.5L19 7v14.5H6z" ${S}/><path d="M14 2.5V7h4.5M9.5 12h6M9.5 16h6" ${S}/>` },
    'transferencia': { name: 'Transferencia bancaria', color: '#24408e', ink: '#ffffff', kind: 'banco-ve',
      glyph: `<path d="M3.5 9.5 12 4.5l8.5 5" ${S}/><path d="M5.5 10.5v7M9.8 10.5v7M14.2 10.5v7M18.5 10.5v7M3.5 20.5h17" ${S}/>` },
    'transferencia-inmediata': { name: 'Transferencia inmediata', color: '#0b7a75', ink: '#ffffff', kind: 'banco-ve',
      glyph: `<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" ${S}/>` },
    'tarjeta': { name: 'Tarjeta de débito o crédito', color: '#334155', ink: '#ffffff', kind: 'pasarela',
      glyph: `<rect x="3" y="5" width="18" height="14" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>` },
    'qr': { name: 'Pago con QR', color: '#111827', ink: '#ffffff', kind: 'pasarela',
      glyph: `<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" ${S}/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 18h2.5v2H14zM18 14h2v2.5h-2z" ${F}/>` },
    'zelle': { name: 'Zelle', color: '#6d1ed4', ink: '#ffffff', kind: 'usd',
      glyph: `<path d="M6 5h12v2.9L9.9 16.4H18V19H6v-2.9l8.1-8.5H6z" ${F}/><path d="M11 2h2v3h-2zM11 19h2v3h-2z" ${F}/>` },
    'binance': { name: 'Binance Pay', color: '#f0b90b', ink: '#1e2026', kind: 'cripto',
      glyph: `<path d="m12 2.6 3.4 3.4L12 9.4 8.6 6zM6 8.6 9.4 12 6 15.4 2.6 12zm12 0 3.4 3.4-3.4 3.4-3.4-3.4zm-6 6 3.4 3.4-3.4 3.4-3.4-3.4z" ${F}/>` },
    'usdt': { name: 'USDT', color: '#26a17b', ink: '#ffffff', kind: 'cripto',
      glyph: `<circle cx="12" cy="12" r="9" ${S}/><path d="M8 8h8M12 8v9" ${S}/><path d="M8.3 11.6c1 .6 2.3.9 3.7.9s2.7-.3 3.7-.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>` },
    'cripto': { name: 'Criptomonedas', color: '#f7931a', ink: '#1a1206', kind: 'cripto',
      glyph: `<path d="M12 2.5 20.2 7v10L12 21.5 3.8 17V7z" ${S}/><path d="M12 7.6 15.8 9.8v4.4L12 16.4l-3.8-2.2V9.8z" ${F}/>` },
    'paypal': { name: 'PayPal', color: '#003087', ink: '#ffffff', kind: 'usd',
      glyph: `<path fill-rule="evenodd" d="M7 3h6.2a5 5 0 0 1 0 10h-2.7v8H7zm3.5 3.2v3.6h2.6a1.8 1.8 0 0 0 0-3.6z" ${F}/>` },
    'zinli': { name: 'Zinli', color: '#7b3fe4', ink: '#ffffff', kind: 'usd',
      glyph: `<rect x="3" y="5" width="18" height="14" rx="3" ${S}/><path d="M8.5 9h7l-7 6h7" ${S}/>` },
    'wally': { name: 'Wally', color: '#00a19a', ink: '#ffffff', kind: 'usd',
      glyph: `<path d="M3.5 6h2.6l2.1 8.2L10.6 6h2.8l2.4 8.2L17.9 6h2.6L17 18h-2.6L12 10l-2.4 8H7z" ${F}/>` },
    'airtm': { name: 'AirTM', color: '#1f6feb', ink: '#ffffff', kind: 'usd',
      glyph: `<path fill-rule="evenodd" d="M12 4 20 20h-3.3l-1.6-3.4H8.9L7.3 20H4zm0 6.2-2 4.2h4z" ${F}/>` },
    'billetera': { name: 'Billetera digital', color: '#475569', ink: '#ffffff', kind: 'usd',
      glyph: `<path d="M4.5 8V7A2.5 2.5 0 0 1 7 4.5h10.5V8" ${S}/><rect x="3.5" y="8" width="17" height="11.5" rx="2.5" ${S}/><circle cx="16" cy="13.75" r="1.5" ${F}/>` },
    'nequi': { name: 'Nequi', color: '#da0081', ink: '#ffffff', kind: 'exterior',
      glyph: `<path d="M6 19V5h2.6l6.8 9.2V5H18v14h-2.6L8.6 9.8V19z" ${F}/>` },
    'daviplata': { name: 'DaviPlata', color: '#e1251b', ink: '#ffffff', kind: 'exterior',
      glyph: `<path fill-rule="evenodd" d="M6 4h5.5a8 8 0 0 1 0 16H6zm3 3v10h2.5a5 5 0 0 0 0-10z" ${F}/>` },
    'yape': { name: 'Yape', color: '#742284', ink: '#ffffff', kind: 'exterior',
      glyph: `<path d="M5 4h3.3L12 10.4 15.7 4H19l-5.5 9v7h-3v-7z" ${F}/>` }
  };

  /* Qué se le pide al comprador según el tipo de icono. Un método puede cambiar cualquiera de estos datos. */
  const REF = {
    banco: { label: 'Número de referencia', placeholder: 'Últimos 6 dígitos', error: 'la referencia', numeric: true },
    zelle: { label: 'Código de confirmación', placeholder: 'Ej. ZL7Q2K', error: 'el código de confirmación', numeric: false },
    binance: { label: 'ID de la orden en Binance', placeholder: 'Ej. 2849104772', error: 'el ID de la orden', numeric: true },
    hash: { label: 'Hash de la transacción (TxID)', placeholder: 'Pega aquí el TxID', error: 'el hash de la transacción', numeric: false },
    paypal: { label: 'ID de la transacción', placeholder: 'Ej. 7XK21934LM881', error: 'el ID de la transacción', numeric: false },
    operacion: { label: 'Número de operación', placeholder: 'Ej. 48211904', error: 'el número de operación', numeric: false },
    comprobante: { label: 'Número de comprobante', placeholder: 'Ej. M1234567', error: 'el número de comprobante', numeric: false },
    autorizacion: { label: 'Número de autorización', placeholder: 'Ej. 004821', error: 'el número de autorización', numeric: true }
  };
  const DEFAULTS = {
    'pago-movil': { currency: 'VES', ref: REF.banco }, 'comprobante': { currency: 'VES', ref: REF.banco },
    'transferencia': { currency: 'VES', ref: REF.banco }, 'transferencia-inmediata': { currency: 'VES', ref: REF.banco },
    'tarjeta': { currency: 'VES', ref: REF.autorizacion }, 'qr': { currency: 'VES', ref: REF.autorizacion },
    'zelle': { currency: 'USD', ref: REF.zelle }, 'binance': { currency: 'USDT', ref: REF.binance },
    'usdt': { currency: 'USDT', ref: REF.hash }, 'cripto': { currency: 'USDT', ref: REF.hash },
    'paypal': { currency: 'USD', ref: REF.paypal }, 'zinli': { currency: 'USD', ref: REF.operacion },
    'wally': { currency: 'USD', ref: REF.operacion }, 'airtm': { currency: 'USD', ref: REF.operacion },
    'billetera': { currency: 'USD', ref: REF.operacion }, 'nequi': { currency: 'COP', ref: REF.comprobante },
    'daviplata': { currency: 'COP', ref: REF.comprobante }, 'yape': { currency: 'PEN', ref: REF.operacion }
  };

  /* Monedas. El monto en Bs es la base; los demás salen de la tasa BCV (Bs por $) y, fuera del dólar,
     de config.js → fx (unidades de esa moneda por 1 $). group: cómo se agrupan los métodos en la página. */
  const CURRENCIES = {
    VES: { name: 'Bolívares', prefix: 'Bs ', suffix: '', decimals: 2, group: 'bs' },
    USD: { name: 'Dólares', prefix: '$', suffix: '', decimals: 2, group: 'usd' },
    USDT: { name: 'Tether (USDT)', prefix: '', suffix: ' USDT', decimals: 2, group: 'usd' },
    EUR: { name: 'Euros', prefix: '€', suffix: '', decimals: 2, group: 'usd' },
    COP: { name: 'Pesos colombianos', prefix: 'COP ', suffix: '', decimals: 0, group: 'ext' },
    PEN: { name: 'Soles', prefix: 'S/ ', suffix: '', decimals: 2, group: 'ext' },
    CLP: { name: 'Pesos chilenos', prefix: 'CLP ', suffix: '', decimals: 0, group: 'ext' },
    BRL: { name: 'Reales', prefix: 'R$ ', suffix: '', decimals: 2, group: 'ext' },
    MXN: { name: 'Pesos mexicanos', prefix: 'MX$ ', suffix: '', decimals: 2, group: 'ext' },
    ARS: { name: 'Pesos argentinos', prefix: 'ARS ', suffix: '', decimals: 0, group: 'ext' }
  };
  const GROUPS = [['bs', 'En bolívares'], ['usd', 'En dólares y cripto'], ['ext', 'Desde otros países']];

  /* Bancos de Venezuela con su código, para "Tu banco" en Pago Móvil y transferencias. */
  const BANCOS_VE = [
    ['0102', 'Banco de Venezuela'], ['0104', 'Venezolano de Crédito'], ['0105', 'Mercantil'], ['0108', 'BBVA Provincial'],
    ['0114', 'Bancaribe'], ['0115', 'Banco Exterior'], ['0128', 'Banco Caroní'], ['0134', 'Banesco'], ['0137', 'Sofitasa'],
    ['0138', 'Banco Plaza'], ['0146', 'Bangente'], ['0151', 'BFC Banco Fondo Común'], ['0156', '100% Banco'], ['0157', 'DelSur'],
    ['0163', 'Banco del Tesoro'], ['0166', 'Banco Agrícola de Venezuela'], ['0168', 'Bancrecer'], ['0169', 'R4 Banco Microfinanciero'],
    ['0171', 'Banco Activo'], ['0172', 'Bancamiga'], ['0174', 'Banplus'], ['0175', 'Banco Bicentenario'], ['0177', 'Banfanb'],
    ['0178', 'N58 Banco Digital'], ['0191', 'BNC Nacional de Crédito']
  ].map(([code, name]) => ({ code, name }));

  /* Si un método no trae icono, se adivina por su nombre. */
  const GUESS = [
    [/pago\s*m[oó]vil/i, 'pago-movil'], [/zelle/i, 'zelle'], [/binance/i, 'binance'], [/usdt|tether/i, 'usdt'],
    [/bitcoin|btc|cripto|eth/i, 'cripto'], [/paypal/i, 'paypal'], [/zinli/i, 'zinli'], [/wally/i, 'wally'], [/airtm/i, 'airtm'],
    [/nequi/i, 'nequi'], [/davi\s*plata/i, 'daviplata'], [/yape/i, 'yape'], [/transfer/i, 'transferencia'],
    [/tarjeta|d[eé]bito|cr[eé]dito|punto/i, 'tarjeta'], [/\bqr\b/i, 'qr']
  ];
  const guessIcon = name => (GUESS.find(([re]) => re.test(name || '')) || [, 'billetera'])[1];

  /* accountInfo puede venir como lista [['Banco', 'Banesco'], …], como lista de { label, value },
     como objeto { Banco: 'Banesco', … } o como texto con una línea "Etiqueta: valor" por dato. */
  const rowsOf = info => {
    if (!info) return [];
    if (Array.isArray(info)) return info.map(r => Array.isArray(r) ? [String(r[0]), String(r[1])] : [String(r.label ?? r.key ?? 'Dato'), String(r.value ?? '')]);
    if (typeof info === 'object') return Object.entries(info).map(([k, v]) => [k, String(v)]);
    return String(info).split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['Dato', l]; });
  };

  /* Completa un método con los valores de su icono. Es lo que usa la página para todo. */
  function normalize(raw, i = 0) {
    const icon = ICONS[raw.icon] ? raw.icon : guessIcon(raw.name);
    const base = ICONS[icon], def = DEFAULTS[icon];
    const isOnline = !!raw.isOnline, bankVE = base.kind === 'banco-ve';
    const cur = String(raw.currency || def.currency).toUpperCase();
    return {
      id: String(raw.id ?? `metodo-${i + 1}`),
      icon, name: raw.name || base.name,
      note: raw.note ?? (isOnline ? 'Se verifica solo con el banco' : ''),
      badge: raw.badge ?? (isOnline ? 'Al instante' : ''),
      color: raw.color || base.color, ink: raw.colorInk || raw.ink || base.ink,
      currency: CURRENCIES[cur] ? cur : 'USD',
      isOnline, requireReceipt: raw.requireReceipt ?? !isOnline,
      minTickets: Math.max(1, parseInt(raw.minTickets, 10) || 1),
      commissionRate: Math.max(0, +raw.commissionRate || 0),
      accountInfo: rowsOf(raw.accountInfo),
      instructions: raw.instructions || '',
      askPayer: raw.askPayer ?? (isOnline && bankVE),
      askBank: raw.askBank ?? bankVE,
      ref: Object.assign({}, def.ref, raw.ref)
    };
  }

  /* Un método tal como lo devuelve el API real de LottoGE (payment-methods/active):
     { id, name, accountInfo, requireReceipt, isOnline, minTickets, currencyId, commissionRate, countryFlag, instructions }.
     icon y color son opcionales: conviene guardarlos en la base de datos junto a cada método.
     currencyId: si el API usa ids propios en vez de códigos (VES, USD…), se traducen en CURRENCY_IDS. */
  const CURRENCY_IDS = {};
  function fromApi(a, i) {
    const cur = a.currency || CURRENCY_IDS[a.currencyId] || (typeof a.currencyId === 'string' && /^[A-Za-z]{3,4}$/.test(a.currencyId) ? a.currencyId : undefined);
    return normalize({
      id: a.id, name: a.name, icon: a.icon, color: a.color, colorInk: a.colorInk, note: a.note, badge: a.badge,
      isOnline: a.isOnline, requireReceipt: a.requireReceipt, minTickets: a.minTickets, commissionRate: a.commissionRate,
      currency: cur, accountInfo: a.accountInfo, instructions: a.instructions
    }, i);
  }

  /* El icono como SVG. style: 'glyph' (solo el dibujo), 'tile' (ficha cuadrada con su color),
     'circle' (círculo con su color) u 'outline' (borde y dibujo en su color, fondo transparente). */
  function svg(key, style = 'glyph', size = 24, color, ink) {
    const ic = ICONS[key] || ICONS.billetera, c = color || ic.color, k = ink || ic.ink;
    if (style === 'glyph') return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${ic.glyph}</svg>`;
    const bg = style === 'circle' ? `<circle cx="24" cy="24" r="24" fill="${c}"/>`
      : style === 'outline' ? `<rect x="1.5" y="1.5" width="45" height="45" rx="12.5" fill="none" stroke="${c}" stroke-width="3"/>`
      : `<rect width="48" height="48" rx="14" fill="${c}"/>`;
    return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${bg}<g transform="translate(12 12)" color="${style === 'outline' ? c : k}">${ic.glyph}</g></svg>`;
  }

  const groupOf = code => (CURRENCIES[code] || CURRENCIES.USD).group;
  return { ICONS, DEFAULTS, REF, CURRENCIES, GROUPS, BANCOS_VE, CURRENCY_IDS, normalize, fromApi, guessIcon, rowsOf, svg, groupOf };
})();
