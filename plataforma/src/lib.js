// Utilidades del panel: datos del servidor simulado, formato es-VE, rutas y avisos.
import { useSyncExternalStore, useState, useEffect, useCallback } from 'react';

export const API = window.LottoAPI;
export const PAGOS = window.LOTTOGE_PAGOS;
export const { cedFmt, cedKey, STATES, LOTTERIES, ROLES, REJECT_REASONS, STATE_LABEL } = API.util;

/* Los datos se leen del servidor simulado y la pantalla se vuelve a dibujar cuando cambian
   (también si cambian en otra pestaña, por ejemplo una compra hecha en el front de venta). */
export function useDB() {
  useSyncExternalStore(API.subscribe, API.version);
  return API.db;
}

/* ---------- formato único es-VE ---------- */
const nf2 = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 });
export const num = n => nf0.format(Math.round(+n || 0));
export const dec = n => nf2.format(+n || 0);
export const usd = (n, short) => 'US$ ' + (short && Number.isInteger(+n) ? nf0.format(+n) : nf2.format(+n || 0));
export const bs = (n, short) => 'Bs ' + (short ? nf0.format(Math.round(+n || 0)) : nf2.format(+n || 0));
export const money = (n, cur, short) => cur === 'VES' ? bs(n, short) : cur === 'USDT' ? (short ? nf0.format(n) : nf2.format(n)) + ' USDT' : cur === 'COP' ? 'COP ' + nf0.format(n) : cur === 'EUR' ? '€ ' + nf2.format(n) : usd(n, short);
export const compact = n => n >= 1e6 ? nf2.format(n / 1e6).replace(/,00$/, '') + ' M' : num(n);
const TZ = 'America/Caracas';
const df = new Intl.DateTimeFormat('es-VE', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const tf = new Intl.DateTimeFormat('es-VE', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
export const date = d => d ? df.format(new Date(d)) : '—';
export const time = d => d ? tf.format(new Date(d)).replace(/\s?([ap])\.?\s?m\.?/i, (m, x) => ` ${x.toLowerCase()}. m.`) : '';
export const dateTime = d => d ? `${date(d)} ${time(d)}` : '—';
export const shortDate = d => { const x = new Date(d); return new Intl.DateTimeFormat('es-VE', { timeZone: TZ, day: 'numeric', month: 'short' }).format(x).replace('.', ''); };
export const longDate = d => new Intl.DateTimeFormat('es-VE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(d));
export const ago = d => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'hace un momento'; if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`; const days = Math.floor(s / 86400);
  return days === 1 ? 'ayer' : days < 30 ? `hace ${days} días` : date(d);
};
export const daysLeft = d => Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
export const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;
export const initials = s => String(s || '?').replace(/^\+/, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
export const firstName = s => String(s || '').split(' ')[0];
// datetime-local (hora de Venezuela) ↔ ISO
export const toLocalInput = iso => { if (!iso) return ''; const d = new Date(new Date(iso).getTime() - 4 * 36e5); return d.toISOString().slice(0, 16); };
export const fromLocalInput = v => v ? new Date(v + ':00-04:00').toISOString() : '';
export const greeting = () => { const h = +new Intl.DateTimeFormat('es-VE', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date()); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };

/* ---------- rutas con # (funcionan en cualquier servidor estático) ---------- */
const parse = () => {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = h.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) };
};
export function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => { const f = () => setR(parse()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
}
export const go = (path, query) => { const q = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== '')) : ''; location.hash = path + (q === '?' ? '' : q); };
export const setQuery = (patch) => { const { path, query } = parse(); go(path, { ...query, ...patch }); };

/* ---------- avisos ---------- */
const toastSubs = new Set(); let toastList = [];
export function toast(text, kind = 'ok') {
  const t = { id: Math.random(), text, kind }; toastList = [...toastList, t]; toastSubs.forEach(f => f(toastList));
  setTimeout(() => { toastList = toastList.filter(x => x !== t); toastSubs.forEach(f => f(toastList)); }, kind === 'err' ? 5200 : 3200);
}
export function useToasts() { const [l, setL] = useState(toastList); useEffect(() => { toastSubs.add(setL); return () => toastSubs.delete(setL); }, []); return l; }

/* Ejecuta una acción del servidor y muestra el error en un aviso; devuelve true si salió bien. */
export function attempt(fn, ok) {
  try { const r = fn(); if (ok) toast(ok); return r === undefined ? true : r; } catch (e) { toast(e.message || 'No se pudo completar', 'err'); return false; }
}

/* Archivo de imagen → dataURL reducido (el navegador guarda poco). */
export const readImage = (file, max = 1200) => new Promise((ok, ko) => {
  if (!file) return ok(null);
  if (file.size > 5 * 1024 * 1024) return ko(new Error('La imagen pesa más de 5 MB'));
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return ko(new Error('Usa una imagen JPG, PNG o WebP'));
  const fr = new FileReader();
  fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .78)); }; img.onerror = () => ko(new Error('No se pudo leer la imagen')); img.src = fr.result; };
  fr.readAsDataURL(file);
});

/* Descarga un CSV que Excel abre bien (UTF-8 con BOM y punto y coma). */
export function downloadCSV(name, rows) {
  const csv = rows.map(r => r.map(v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Descargado ${name}`);
}

export function useHotkey(key, fn) {
  const cb = useCallback(fn, [fn]);
  useEffect(() => { const h = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === key) { e.preventDefault(); cb(e); } }; addEventListener('keydown', h); return () => removeEventListener('keydown', h); }, [key, cb]);
}

/* ---------- datos derivados ---------- */
export const raffleState = r => API.raffleState(r);
export const ORDER_STATUS = {
  pendiente: ['Por verificar', 'warn'], abono: ['Abono', 'info'], aprobada: ['Confirmado', 'ok'], rechazada: ['Rechazado', 'err'], vencida: ['Vencido', 'muted']
};
export const RAFFLE_TONE = { borrador: 'muted', revision: 'info', rechazada: 'err', venta: 'ok', 'falta-ganador': 'warn', finalizada: 'muted', cancelada: 'muted' };
export const methodName = id => (API.method(id) || {}).name || 'Sin método';
export function clientStats(db) {
  const by = {};
  db.clients.forEach(c => by[c.cedula] = { ...c, orders: 0, tickets: 0, paidUSD: 0, owesUSD: 0, last: null, active: 0 });
  db.orders.forEach(o => {
    const s = by[o.cedula]; if (!s) return;
    if (o.status === 'aprobada' || o.status === 'abono') { s.orders++; s.tickets += o.qty; s.paidUSD += o.status === 'aprobada' ? o.amountUSD : o.paidUSD; }
    if (o.status === 'abono') s.owesUSD += o.amountUSD - o.paidUSD;
    if (o.status === 'aprobada' && raffleState(API.raffle(o.raffleId)) === 'venta') s.active += o.qty;
    if (!s.last || o.createdAt > s.last) s.last = o.createdAt;
  });
  return Object.values(by);
}
export function pendingTasks(db) {
  const waiting = db.raffles.filter(r => raffleState(r) === 'falta-ganador').sort((a, b) => a.drawAt.localeCompare(b.drawAt));
  const pend = db.orders.filter(o => o.status === 'pendiente');
  const gws = Object.entries(db.gateways).map(([k, g]) => [k, g, API.gatewayState(g)]);
  const expired = db.agents.filter(a => Date.parse(a.expiresAt) < Date.now());
  const tasks = [];
  if (waiting.length) tasks.push({ id: 'ganadores', icon: 'trophy', tone: 'warn', title: `${plural(waiting.length, 'rifa sin ganador reportado', 'rifas sin ganador reportado')}`, sub: `La más antigua cerró el ${date(waiting[0].drawAt)}`, action: 'Reportar', to: '/rifas/ganadores' });
  if (pend.length) tasks.push({ id: 'pagos', icon: 'card', tone: 'warn', title: `${plural(pend.length, 'pago por verificar', 'pagos por verificar')}`, sub: `${pend.filter(o => o.proof).length} tienen comprobante adjunto`, action: 'Revisar', to: '/ventas/pagos' });
  if (!API.gatewayActive()) { const [k, g, st] = gws.find(([, g, s]) => s.key === 'incompleta') || gws[0]; tasks.push({ id: 'pasarela', icon: 'plug', tone: 'info', title: `${g.name} ${st.key === 'incompleta' ? 'sin terminar' : 'pausada'}`, sub: 'Los pagos móviles se confirman a mano', action: 'Completar', to: '/ajustes/pasarelas?p=' + k }); }
  if (expired.length) tasks.push({ id: 'agentes', icon: 'users', tone: 'info', title: `${plural(expired.length, 'agente con acceso vencido', 'agentes con acceso vencido')}`, sub: 'No pueden atender la Bandeja', action: 'Renovar', to: '/mensajeria/agentes' });
  const draft = db.raffles.filter(r => r.status === 'rechazada');
  if (draft.length) tasks.push({ id: 'rechazadas', icon: 'alert', tone: 'err', title: `${plural(draft.length, 'rifa rechazada por CONALOT', 'rifas rechazadas por CONALOT')}`, sub: draft[0].rejectReason, action: 'Corregir', to: `/rifas/${draft[0].id}/editar` });
  return tasks;
}

/* ---------- movimiento (el mismo lenguaje de la página principal) ---------- */
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const CONF = ['#ff5a36', '#ffc23c', '#12a594', '#4f7cff'];
/* Confeti que sale desde un elemento (o desde el centro de arriba), como al entrar en el login. */
export function confetti(from) {
  if (reduceMotion()) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const g = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; g.scale(dpr, dpr);
  const r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
  const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
  const ps = Array.from({ length: 90 }, () => ({ x: ox, y: oy, vx: (Math.random() - .5) * 560, vy: -Math.random() * 520 - 160, s: 5 + Math.random() * 7, c: CONF[Math.floor(Math.random() * 4)], a: Math.random() * 6, va: (Math.random() - .5) * 12 }));
  let last = performance.now(), life = 0;
  const step = now => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; life += dt;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = Math.max(0, 1 - life / 1.6); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }
    if (life < 1.6) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
}
/* Un número que sube hasta su valor la primera vez que se muestra. */
export function useCountUp(value, ms = 900) {
  const [v, setV] = useState(() => reduceMotion() ? value : 0);
  useEffect(() => {
    if (reduceMotion()) { setV(value); return; }
    let raf, start; const from = 0;
    const tick = t => { start = start || t; const k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 3); setV(from + (value - from) * e); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value]);
  return v;
}
