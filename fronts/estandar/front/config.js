/*
 * Configuración de la rifa: lo único que cambia de un rifero a otro.
 * En producción, la plataforma LottoGE escribe este objeto con los datos reales del sorteo
 * (o lo reemplaza por una llamada a la API). Todo lo que falte usa el ejemplo de la demo.
 */
window.LOTTOGE_RIFA = {
  // Rifero
  rifero: 'Rifas La Bendición',            // nombre de la marca, sale arriba y en el boleto
  handle: '@rifaslabendicion',             // Instagram, donde se transmite el sorteo
  support: 'soporte@rifas-ejemplo.com',    // correo de soporte del rifero
  conalot: 'CNL-AUT-RF-2026-075423',       // nº de autorización CONALOT del evento

  // Premios
  prize: 'Toyota Agya 2026',               // 1er premio
  prizeExtra: '+ 3.000 en la guantera',    // extra del 1er premio ('' si no hay)
  second: '2.000 Bendiciones',             // 2do premio
  third: '1.000 Bendiciones',              // 3er premio

  // Venta
  price: 4799,                             // precio por boleto, en bolívares (entero)
  rate: 881.88,                            // tasa BCV, Bs por dólar
  serviceFee: 0,                           // % de comisión de servicio de la plataforma, incluida en el total (0 = sin comisión)
  total: 10000,                            // cantidad de números: 100, 1000 o 10000
  soldPct: 76,                             // % vendido (en producción viene de la API)

  // Sorteo (hora de Venezuela)
  date: '2026-10-22',                      // AAAA-MM-DD
  time: '22:00',                           // hora del 1er premio, 24 h
  times2: ['4:00 PM', '1:00 PM'],          // horas del 2do y 3er premio
  lottery: 'Supergana',                    // lotería con la que juega

  // Marca e imágenes
  accent: 'coral',                         // coral (el de LottoGE), oro, rojo, verde, azul, naranja, turquesa, o un hex como '#d42a33'
  accentInk: '#ffffff',                    // color del texto sobre el acento (solo si accent es un hex)
  images: ['img/flyer.jpg', 'img/burj-al-arab.jpg', 'img/sala.jpg'],  // la primera es la portada; hasta 10

  // Monedas fuera del dólar: cuántas unidades de esa moneda da 1 $ (ejemplo). En producción salen del API de tasas.
  fx: { COP: 4150, PEN: 3.75 },

  // Métodos de pago del rifero, en el orden en que salen. No hay límite: con más de 4 se agrupan por moneda.
  // Tienen la forma del API de LottoGE (payment-methods/active) más icon y color. Cuentas de ejemplo.
  //   id               identificador del método
  //   name             nombre que ve el comprador
  //   icon             uno del catálogo (comun/metodos-pago.js): pago-movil, comprobante, transferencia,
  //                    transferencia-inmediata, tarjeta, qr, zelle, binance, usdt, cripto, paypal, zinli, wally,
  //                    airtm, billetera, nequi, daviplata, yape. Si falta, se adivina por el nombre.
  //                    El mismo icono sirve para varios métodos (por ejemplo, un Pago Móvil por banco).
  //   color, colorInk  fondo y dibujo de la ficha del icono (opcional: cada icono trae los suyos)
  //   note, badge      texto chico debajo del nombre y etiqueta resaltada (opcionales)
  //   isOnline         true: se verifica solo con la pasarela y entrega los números al instante
  //   requireReceipt   true: pide comprobante y queda como boleto reservado (por defecto, si no es isOnline)
  //   currency         VES, USD, USDT, EUR, COP, PEN, CLP, BRL, MXN o ARS (por defecto, la del icono)
  //   minTickets       mínimo de boletos para usar este método
  //   commissionRate   % que se suma al monto de este método (por ejemplo, la comisión de PayPal)
  //   accountInfo      datos para pagar: [['Banco', 'Banesco (0134)'], …]; también acepta un objeto o texto
  //   instructions     una indicación corta que sale arriba de los datos (opcional)
  //   ref              { label, placeholder, error, numeric } para cambiar lo que se pide como referencia
  //   askPayer, askBank  pedir el teléfono desde el que paga y su banco (por defecto: Pago Móvil al instante pide
  //                    los dos; los demás métodos de bancos venezolanos, solo el banco)
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
  ],

  // Compras recientes y ranking (opcionales). En la demostración se ven unos de ejemplo; con la conexión real
  // solo aparecen si vienen aquí, con datos reales: [nombre, ciudad, boletos].
  //   ticker: [['Robert R.', 'Maracay', 5], …],
  //   top: [['Darwin G.', 'Valencia', 214], …],

  // Conexión con la plataforma: la usa comun/conexion.js (ver conexion.ejemplo.js). En modo demostración no hace falta.
  companyId: '',                           // UUID del rifero en LottoGE
  raffleId: ''                             // id de la rifa
};
