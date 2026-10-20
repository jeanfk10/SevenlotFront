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
  total: 10000,                            // cantidad de números: 100, 1000 o 10000
  soldPct: 76,                             // % vendido (en producción viene de la API)

  // Sorteo (hora de Venezuela)
  date: '2026-10-22',                      // AAAA-MM-DD
  time: '22:00',                           // hora del 1er premio, 24 h
  times2: ['4:00 PM', '1:00 PM'],          // horas del 2do y 3er premio
  lottery: 'Supergana',                    // lotería con la que juega

  // Marca e imágenes
  accent: 'oro',                           // oro, rojo, verde, azul, naranja, turquesa, o un hex como '#d42a33'
  accentInk: '#ffffff',                    // color del texto sobre el acento (solo si accent es un hex)
  images: ['img/flyer.jpg', 'img/burj-al-arab.jpg', 'img/sala.jpg']  // la primera es la portada; hasta 10
};
