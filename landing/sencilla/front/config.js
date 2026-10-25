/*
 * Configuración de la página principal de LottoGE.
 * Aquí se cambia todo lo que puede variar, sin tocar index.html: WhatsApp, planes y precios,
 * rifas de prueba, correo de denuncias y direcciones de la API.
 * Lo que se borre de este archivo vuelve al valor de ejemplo que trae la página.
 */
window.LOTTOGE_SITE = {
  // WhatsApp de contacto. Todos los botones de la página abren este chat.
  whatsapp: {
    numero: '584121665356',                                  // con código de país, solo números (0412-166-5356)
    mostrar: '0412-166-5356',                                // cómo se ve escrito en la página
    mensaje: 'Hola, quiero más información acerca de LottoGE' // mensaje que llega escrito
  },

  // Denuncias. Llegan a la plataforma de LottoGE y se reenvían a Sevenlot.
  denuncias: {
    correo: ''  // ← PONER AQUÍ el correo de Sevenlot que recibe las denuncias (lo coloca el equipo de LottoGE)
  },

  // Direcciones de la API. Mientras estén vacías, la página funciona en modo prueba (todo simulado).
  // El formato de cada llamada está en el Contrato de API del kit.
  api: {
    login: '',      // POST correo y contraseña. Ej.: '/api/auth/login'
    recuperar: '',  // POST correo para recuperar la contraseña. Ej.: '/api/auth/forgot'
    rifas: '',      // GET rifas activas. Ej.: '/api/raffles'
    denuncias: ''   // POST denuncia con su archivo. Ej.: '/api/reports'
  },

  // Planes y precios, en el orden en que salen. Se pueden agregar, quitar o cambiar.
  //   destacado: true pinta el plan en oscuro; insignia: texto amarillo junto al nombre.
  //   mensaje: si se escribe, ese plan abre WhatsApp con ese mensaje en lugar del general.
  planes: [
    {
      nombre: 'Free',
      precio: '$0',
      precioNota: '',
      mantenimiento: '+ $50 al mes de mantenimiento',
      incluye: ['Rifas de hasta 3 cifras', 'Página pública estándar', 'Avisos de venta por correo'],
      destacado: false,
      insignia: '',
      mensaje: ''
    },
    {
      nombre: 'Basic',
      precio: 'REF 799',
      precioNota: '+ IVA',
      mantenimiento: '+ $50 al mes de mantenimiento',
      incluye: ['Rifas de hasta 4 cifras', 'Tu marca y dominio propio', 'WhatsApp automatizado', 'Panel de cajas'],
      destacado: false,
      insignia: '',
      mensaje: ''
    },
    {
      nombre: 'Pro',
      precio: 'REF 1.199',
      precioNota: '+ IVA',
      mantenimiento: '+ $50 al mes de mantenimiento',
      incluye: ['Rifas de hasta 6 cifras', 'Pago Móvil verificado al instante', 'Chatbot de WhatsApp', 'CRM sin límite'],
      destacado: true,
      insignia: 'Recomendado',
      mensaje: ''
    }
  ],
  planesNota: 'Todos incluyen rifas sin límite, legalidad ante CONALOT, reportes y soporte 24/7. Sin contratos forzosos.',

  // Rifas que se muestran mientras api.rifas esté vacío (datos de prueba).
  rifasDePrueba: [
    { titulo: 'Rifa de prueba', operador: 'Operador de prueba', cifras: 4, vendido: 0, sorteo: 'Por definir', url: '' }
  ]
};
