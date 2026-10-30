/* LottoX · entorno de pruebas · puente
   Si el navegador no deja guardar datos en esta página (vista previa, modo privado), los fronts usan el
   servidor simulado de la ventana del panel que los abrió. Fuera del panel, muestra un aviso discreto. */
(() => {
  let ok = true;
  try { localStorage.setItem('lottox-probe', '1'); localStorage.removeItem('lottox-probe'); } catch (e) { ok = false; }
  if (!ok) {
    try { if (window.parent !== window && window.parent.LottoAPI) window.LottoAPI = window.parent.LottoAPI; } catch (e) {}
    try { if (!window.LottoAPI && window.opener && window.opener.LottoAPI) window.LottoAPI = window.opener.LottoAPI; } catch (e) {}
  }
  if (window.parent === window) addEventListener('DOMContentLoaded', () => {
    const a = document.createElement('a');
    a.href = '../../#/'; a.textContent = 'Entorno de pruebas · volver al panel';
    a.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:2147483647;padding:6px 12px;border-radius:999px;background:#17151c;color:#fff;font:600 12px/1.4 system-ui,sans-serif;text-decoration:none;opacity:.82;box-shadow:0 4px 14px rgba(0,0,0,.25)');
    document.body.appendChild(a);
  });
})();
