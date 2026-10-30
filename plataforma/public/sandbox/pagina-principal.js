/* LottoX · entorno de pruebas · conexión de la página principal (login, rifas activas y denuncias)
   La página principal ya llama a una API cuando su config.js trae las direcciones (api.login, api.rifas,
   api.denuncias, api.recuperar). Aquí esas direcciones apuntan a "__lottox/…" y este archivo las responde
   con el servidor simulado, con el mismo formato que espera la página. El diseño no se toca. */
(() => {
  const API = window.LottoAPI, real = window.fetch.bind(window);
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const wait = ms => new Promise(ok => setTimeout(ok, ms));
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url, m = url.match(/__lottox\/([^?]+)/);
    if (!m) return real(input, init);
    await wait(450);
    try {
      if (m[1] === 'auth/login') {
        const b = JSON.parse(init.body || '{}'), s = API.login(b.email, b.password);
        return json(200, { user: { name: s.role === 'superadmin' ? 'Superadministrador' : s.name }, redirect: s.role === 'superadmin' ? '../#/admin' : '../#/' });
      }
      if (m[1] === 'auth/forgot') return json(200, { ok: true });
      if (m[1] === 'raffles') return json(200, { items: API.publicRaffles() });
      if (m[1] === 'reports') {
        const fd = init.body, file = fd.get('file');
        const ref = API.createReport({ reason: fd.get('reason'), target: fd.get('target'), link: fd.get('link'), description: fd.get('description'), anonymous: fd.get('anonymous') === 'true', email: fd.get('email') || '', fileName: file && file.name });
        return json(200, { reference: ref });
      }
      return json(404, { message: 'Ruta no simulada' });
    } catch (e) { return json(e.status || 500, { message: e.message }); }
  };
  // Si ya hay una sesión abierta en el panel, la barra de la página principal ofrece volver a él.
  addEventListener('DOMContentLoaded', () => {
    const s = API.session(); if (!s) return;
    document.querySelectorAll('a[href="#login"]').forEach(a => { a.href = s.role === 'superadmin' ? '../#/admin' : '../#/'; a.textContent = 'Ir a mi panel'; });
  });
})();
