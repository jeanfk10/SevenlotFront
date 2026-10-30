// Estructura del panel: barra superior con 6 secciones, subnavegación, buscador Ctrl K, tasa vigente,
// ayuda, notificaciones, cuenta; en el teléfono, barra inferior con las cinco tareas del día.
import { Component, useMemo, useState, useRef, useEffect } from 'react';
import { Search, HelpCircle, Bell, Home, Store, CreditCard, MessageSquare, Menu, FlaskConical, ExternalLink, RotateCcw, Trophy, Plug, Users, AlertTriangle, ChevronRight, Ticket, User, FileText, LogOut, Sun, Moon, Building2, Flag } from 'lucide-react';
import { API, useDB, useRoute, go, dec, num, time, cedFmt, pendingTasks, useHotkey, useToasts, toast, attempt, raffleState, date, ago, initials } from './lib.js';
import { Modal, Button, Drawer, Note, Badge, Confirm, LogoMark } from './ui.jsx';

export const SECTIONS = [
  { key: 'inicio', label: 'Inicio', base: '/', pages: [['/', 'Resumen'], ['/actividad', 'Actividad']] },
  { key: 'rifas', label: 'Rifas', base: '/rifas', pages: [['/rifas', 'Todas las rifas'], ['/rifas/nueva', 'Nueva rifa'], ['/rifas/ganadores', 'Ganadores por reportar', 'ganadores']] },
  { key: 'ventas', label: 'Ventas', base: '/ventas', badge: 'pagos', pages: [['/ventas/pagos', 'Pagos por verificar', 'pagos'], ['/ventas/taquilla', 'Taquilla'], ['/ventas/verificador', 'Verificador'], ['/ventas/reportes', 'Reportes']] },
  { key: 'clientes', label: 'Clientes', base: '/clientes', pages: [['/clientes', 'Clientes'], ['/clientes/influencers', 'Influencers']] },
  { key: 'mensajeria', label: 'Mensajería', base: '/mensajeria', badge: 'bandeja', pages: [['/mensajeria/bandeja', 'Bandeja', 'bandeja'], ['/mensajeria/resumen', 'Resumen'], ['/mensajeria/campanas', 'Campañas'], ['/mensajeria/automatizaciones', 'Automatizaciones'], ['/mensajeria/historial', 'Historial'], ['/mensajeria/contactos', 'Contactos'], ['/mensajeria/agentes', 'Agentes'], ['/mensajeria/bot', 'Bot'], ['/mensajeria/conexion', 'Conexión']] },
  { key: 'ajustes', label: 'Ajustes', base: '/ajustes', pages: [['/ajustes/empresa', 'Empresa'], ['/ajustes/usuarios', 'Usuarios'], ['/ajustes/cajas', 'Cajas'], ['/ajustes/metodos', 'Métodos de pago'], ['/ajustes/monedas', 'Monedas y tasas'], ['/ajustes/pasarelas', 'Pasarelas'], ['/ajustes/sitio', 'Sitio web'], ['/ajustes/dominios', 'Dominios'], ['/ajustes/seguridad', 'Seguridad']] }
];
export const ADMIN_SECTIONS = [
  { key: 'a-inicio', label: 'Inicio', base: '/admin', pages: [['/admin', 'Resumen'], ['/admin/sala', 'Sala situacional'], ['/admin/actividad', 'Actividad']] },
  { key: 'a-empresas', label: 'Empresas', base: '/admin/empresas', badge: 'empresas', pages: [['/admin/empresas', 'Empresas', 'empresas']] },
  { key: 'a-rifas', label: 'Rifas', base: '/admin/rifas', badge: 'rifas', pages: [['/admin/rifas', 'Supervisor de rifas', 'rifas'], ['/admin/rifas/extensiones', 'Extensiones de fecha', 'ext']] },
  { key: 'a-denuncias', label: 'Denuncias', base: '/admin/denuncias', badge: 'denuncias', pages: [['/admin/denuncias', 'Denuncias', 'denuncias']] },
  { key: 'a-fact', label: 'Facturación', base: '/admin/facturacion', pages: [['/admin/facturacion', 'Cobros'], ['/admin/facturacion/planes', 'Planes']] },
  { key: 'a-ajustes', label: 'Ajustes', base: '/admin/ajustes', pages: [['/admin/ajustes', 'Plataforma'], ['/admin/ajustes/loterias', 'Loterías'], ['/admin/ajustes/usuarios', 'Usuarios'], ['/admin/ajustes/notas', 'Notas de versión'], ['/admin/ajustes/seguridad', 'Seguridad']] }
];
const adminSectionOf = path => ['/admin', '/admin/sala', '/admin/actividad'].includes(path) ? ADMIN_SECTIONS[0] : ADMIN_SECTIONS.slice(1).find(s => path === s.base || path.startsWith(s.base + '/')) || ADMIN_SECTIONS[0];
const adminCounts = db => ({
  empresas: db.companies.filter(c => c.status === 'pendiente').length,
  rifas: API.allRaffles().filter(r => r.status === 'revision').length,
  ext: db.extensions.filter(e => e.status === 'pendiente').length,
  denuncias: db.reports.filter(r => r.status === 'nueva').length
});
// La página activa de la subnavegación: la ruta más larga que coincide.
const activeHref = (pages, path) => pages.map(p => p[0]).filter(h => path === h || path.startsWith(h + '/') || (h === '/rifas' && /^\/rifas\/R-/.test(path))).sort((a, b) => b.length - a.length)[0];
export const logout = () => { API.logout(); location.href = './pagina-principal/#login'; };
export const sectionOf = path => path === '/' || path === '/actividad' ? SECTIONS[0] : SECTIONS.find(s => s.key !== 'inicio' && path.startsWith(s.base)) || SECTIONS[0];
const counts = db => ({
  pagos: db.orders.filter(o => o.status === 'pendiente').length,
  ganadores: db.raffles.filter(r => raffleState(r) === 'falta-ganador').length,
  bandeja: db.conversations.filter(c => c.status === 'abierta' && c.unread).length
});
const isOn = (href, path) => href === path || (href !== '/' && href !== '/rifas' && href !== '/clientes' && path.startsWith(href + '/')) || (href === '/rifas' && /^\/rifas\/R-/.test(path));
export const publicUrl = (db, q = '') => `./fronts/${db.sitePublished.template}/?rifa=${db.sitePublished.raffleId}${q}`;

export function Shell({ children, admin, session }) {
  const db = useDB(), { path } = useRoute(), SECS = admin ? ADMIN_SECTIONS : SECTIONS, sec = admin ? adminSectionOf(path) : sectionOf(path), c = admin ? adminCounts(db) : counts(db);
  const cur = activeHref(sec.pages, path), home = admin ? '/admin' : '/';
  useEffect(() => { const h = () => document.querySelector('.top')?.classList.toggle('is-scrolled', scrollY > 6); addEventListener('scroll', h, { passive: true }); return () => removeEventListener('scroll', h); }, []);
  const viewing = !admin && session && session.role === 'superadmin';
  const [palette, setPalette] = useState(false), [help, setHelp] = useState(false), [tools, setTools] = useState(false), [more, setMore] = useState(false);
  useHotkey('k', () => setPalette(true));
  useEffect(() => { document.getElementById('main')?.focus({ preventScroll: true }); scrollTo(0, 0); setMore(false); }, [path]);
  const ves = db.currencies.find(x => x.code === 'VES');
  return <>
    <a className="skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main').focus(); }}>Saltar al contenido</a>
    {viewing && <div className="viewas" role="note"><Building2 size={15} aria-hidden="true" />Estás viendo el panel de {db.company.name} como superadministrador<button type="button" onClick={() => { API.viewAs(null); location.hash = '/admin/empresas'; location.reload(); }}>Volver al superadministrador</button></div>}
    <div className="sandbar" role="note"><FlaskConical size={14} aria-hidden="true" />Entorno de pruebas<span className="sandbar__text"> · datos de ejemplo guardados en este navegador</span>
      <button type="button" onClick={() => setTools(true)}>Herramientas de prueba</button>
      <a href="./pagina-principal/">Página principal</a>{!admin && <a href={publicUrl(db)} target="_blank" rel="noopener">Mi página de venta</a>}</div>
    <header className="top">
      <div className="top__row">
        <a className="brand" href={'#' + home}><LogoMark /><b>Lotto<em>GE</em></b><span>· {admin ? 'Superadministrador' : db.company.name}</span></a>
        <nav className="nav" aria-label="Secciones">{SECS.map(s => <a key={s.key} href={'#' + s.pages[0][0]} aria-current={sec.key === s.key ? 'page' : undefined}>{s.label}{s.badge && c[s.badge] > 0 && <span className="count" aria-label={`${c[s.badge]} pendientes`}>{c[s.badge]}</span>}</a>)}</nav>
        <div className="top__tools">
          <button type="button" className="search-btn" onClick={() => setPalette(true)} aria-label={admin ? 'Buscar empresa, rifa o denuncia (Ctrl K)' : 'Buscar cliente, boleto o rifa (Ctrl K)'}><Search size={15} aria-hidden="true" /><span>{admin ? 'Buscar empresa, rifa o denuncia' : 'Buscar cliente, boleto o rifa'}</span><kbd>Ctrl K</kbd></button>
          <a className="rate-pill" href={admin ? '#/admin/ajustes' : '#/ajustes/monedas'} title={`Tasa vigente · ${ves.source} · actualizada ${ago(ves.updatedAt)}`}><span className="dot" aria-hidden="true" /><span className="rate-label">Bs/US$</span><b>{dec(ves.rate)}</b><span className="hide-mobile">· {time(ves.updatedAt)}</span></a>
          <button type="button" className="icon-btn hide-m" onClick={() => setHelp(true)} aria-label="Ayuda"><HelpCircle size={18} /></button>
          {admin ? <AdminNotifications db={db} c={c} /> : <Notifications db={db} />}
          <Account db={db} admin={admin} session={session} />
        </div>
      </div>
      <nav className="subnav" aria-label={sec.label}>{sec.pages.map(([href, label, badge]) => <a key={href} href={'#' + href} aria-current={cur === href ? 'page' : undefined}>{label}{badge && c[badge] > 0 && <span className={'count' + (badge === 'ganadores' ? ' count--soft' : '')}>{c[badge]}</span>}</a>)}</nav>
    </header>
    <main id="main" className="main" tabIndex={-1} style={{ outline: 'none' }}><ErrorBoundary key={path}>{children}</ErrorBoundary></main>
    {admin ? <nav className="mbar" aria-label="Tareas del día">
      <a href="#/admin" aria-current={path === '/admin' ? 'page' : undefined}><Home size={20} aria-hidden="true" />Inicio</a>
      <a href="#/admin/empresas" aria-current={path.startsWith('/admin/empresas') ? 'page' : undefined}><Building2 size={20} aria-hidden="true" />Empresas{c.empresas > 0 && <span className="count">{c.empresas}</span>}</a>
      <a href="#/admin/rifas" aria-current={path.startsWith('/admin/rifas') ? 'page' : undefined}><Ticket size={20} aria-hidden="true" />Rifas{c.rifas > 0 && <span className="count">{c.rifas}</span>}</a>
      <a href="#/admin/denuncias" aria-current={path.startsWith('/admin/denuncias') ? 'page' : undefined}><Flag size={20} aria-hidden="true" />Denuncias{c.denuncias > 0 && <span className="count">{c.denuncias}</span>}</a>
      <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog"><Menu size={20} aria-hidden="true" />Más</button>
    </nav> : <nav className="mbar" aria-label="Tareas del día">
      <a href="#/" aria-current={path === '/' ? 'page' : undefined}><Home size={20} aria-hidden="true" />Inicio</a>
      <a href="#/ventas/taquilla" aria-current={path === '/ventas/taquilla' ? 'page' : undefined}><Store size={20} aria-hidden="true" />Vender</a>
      <a href="#/ventas/pagos" aria-current={path === '/ventas/pagos' ? 'page' : undefined}><CreditCard size={20} aria-hidden="true" />Pagos{c.pagos > 0 && <span className="count">{c.pagos}</span>}</a>
      <a href="#/mensajeria/bandeja" aria-current={path === '/mensajeria/bandeja' ? 'page' : undefined}><MessageSquare size={20} aria-hidden="true" />Mensajes{c.bandeja > 0 && <span className="count">{c.bandeja}</span>}</a>
      <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog"><Menu size={20} aria-hidden="true" />Más</button>
    </nav>}
    {more && <><div className="scrim" onClick={() => setMore(false)} /><div className="sheet" role="dialog" aria-label="Todas las secciones">
      {SECS.map(s => <div key={s.key}><h3>{s.label}</h3>{s.pages.map(([h, l]) => <a key={h} href={'#' + h}>{l}</a>)}</div>)}
      <h3>Más</h3><a href="#/" onClick={e => { e.preventDefault(); setMore(false); setHelp(true); }}>Ayuda</a><a href="#/" onClick={e => { e.preventDefault(); setMore(false); setTools(true); }}>Herramientas de prueba</a>
    </div></>}
    {palette && <Palette db={db} admin={admin} onClose={() => setPalette(false)} />}
    {help && <Help onClose={() => setHelp(false)} />}
    {tools && <Tools db={db} onClose={() => setTools(false)} />}
    <Toasts />
  </>;
}

function useOutside(open, setOpen) {
  const ref = useRef();
  useEffect(() => { if (!open) return; const h = e => { if (!ref.current?.contains(e.target)) setOpen(false); }; const k = e => e.key === 'Escape' && setOpen(false); addEventListener('mousedown', h); addEventListener('keydown', k); return () => { removeEventListener('mousedown', h); removeEventListener('keydown', k); }; }, [open]);
  return ref;
}
const NICON = { trophy: Trophy, card: CreditCard, plug: Plug, users: Users, alert: AlertTriangle };
function Notifications({ db }) {
  const [open, setOpen] = useState(false), ref = useOutside(open, setOpen);
  const tasks = pendingTasks(db), recent = db.orders.filter(o => o.status === 'pendiente' && Date.now() - Date.parse(o.createdAt) < 864e5).slice(0, 4);
  const items = [...recent.map(o => ({ id: 'o' + o.id, icon: CreditCard, title: `Nuevo pago de ${o.name}`, sub: `${API.raffle(o.raffleId).title} · ${ago(o.createdAt)}`, to: `/ventas/pagos?orden=${o.id}` })), ...tasks.map(t => ({ id: 't' + t.id + t.title, icon: NICON[t.icon], title: t.title, sub: t.sub, to: t.to }))];
  const unread = items.filter(i => !db.readNotifications.includes(i.id));
  return <div style={{ position: 'relative' }} ref={ref}>
    <button type="button" className="icon-btn" aria-label={`Notificaciones${unread.length ? `, ${unread.length} sin leer` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={18} />{unread.length > 0 && <span className="pip" />}</button>
    {open && <div className="menu" style={{ width: 340 }}>
      <div className="menu__head">Notificaciones{unread.length > 0 && <button className="link" type="button" onClick={() => API.markNotifications(items.map(i => i.id))}>Marcar como leídas</button>}</div>
      {items.length ? items.map(i => <a key={i.id} href={'#' + i.to} onClick={() => { API.markNotifications([i.id]); setOpen(false); }} style={{ opacity: db.readNotifications.includes(i.id) ? .6 : 1 }}><i.icon size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} /><span><b style={{ fontWeight: 600 }}>{i.title}</b><br /><small className="subtle">{i.sub}</small></span></a>) : <p className="subtle" style={{ padding: 16 }}>No tienes notificaciones.</p>}
    </div>}
  </div>;
}
function AdminNotifications({ db, c }) {
  const [open, setOpen] = useState(false), ref = useOutside(open, setOpen);
  const items = [
    c.empresas && { id: 'e', icon: Building2, title: `${c.empresas} ${c.empresas === 1 ? 'empresa espera' : 'empresas esperan'} aprobación`, to: '/admin/empresas' },
    c.rifas && { id: 'r', icon: Ticket, title: `${c.rifas} ${c.rifas === 1 ? 'rifa espera' : 'rifas esperan'} revisión`, to: '/admin/rifas' },
    c.ext && { id: 'x', icon: Trophy, title: `${c.ext} ${c.ext === 1 ? 'solicitud' : 'solicitudes'} de extensión`, to: '/admin/rifas/extensiones' },
    c.denuncias && { id: 'd', icon: Flag, title: `${c.denuncias} ${c.denuncias === 1 ? 'denuncia nueva' : 'denuncias nuevas'}`, to: '/admin/denuncias' }
  ].filter(Boolean);
  return <div style={{ position: 'relative' }} ref={ref}>
    <button type="button" className="icon-btn" aria-label={`Notificaciones${items.length ? `, ${items.length} pendientes` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={18} />{items.length > 0 && <span className="pip" />}</button>
    {open && <div className="menu" style={{ width: 320 }}><div className="menu__head">Pendiente de ti</div>
      {items.length ? items.map(i => <a key={i.id} href={'#' + i.to} onClick={() => setOpen(false)}><i.icon size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} /><b style={{ fontWeight: 600 }}>{i.title}</b></a>) : <p className="subtle" style={{ padding: 16 }}>Estás al día.</p>}</div>}
  </div>;
}
function Account({ db, admin, session }) {
  const [open, setOpen] = useState(false), ref = useOutside(open, setOpen);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('lottox-theme') || ''; } catch (e) { return ''; } });
  const setT = t => { setTheme(t); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; try { localStorage.setItem('lottox-theme', t); } catch (e) {} };
  useEffect(() => { if (theme) document.documentElement.dataset.theme = theme; }, []);
  return <div style={{ position: 'relative' }} ref={ref}>
    <button type="button" className="avatar" aria-label="Cuenta" aria-expanded={open} onClick={() => setOpen(!open)}>{admin ? 'SA' : initials(db.me.short)}</button>
    {open && <div className="menu">
      <div className="menu__head"><span>{admin ? 'Superadministrador' : db.me.name}<br /><small className="subtle" style={{ fontWeight: 400 }}>{session ? session.email : db.me.email} · {admin ? 'Plataforma LottoGE' : 'Operador · ' + db.company.name}</small></span></div>
      <a href="./pagina-principal/" ><Home size={16} aria-hidden="true" />Página principal de LottoGE</a>
      {!admin && <a href={publicUrl(db)} target="_blank" rel="noopener"><ExternalLink size={16} aria-hidden="true" />Ver mi página de venta</a>}
      <a href={admin ? '#/admin/ajustes/seguridad' : '#/ajustes/seguridad'} onClick={() => setOpen(false)}><User size={16} aria-hidden="true" />Seguridad{admin ? '' : ' y sesiones'}</a>
      <button type="button" className="menu__item" onClick={() => setT(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}{theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}</button>
      <button type="button" className="menu__item" onClick={logout}><LogOut size={16} aria-hidden="true" />Cerrar sesión</button>
    </div>}
  </div>;
}

/* Buscador global: pantallas, clientes (nombre o cédula), boletos, órdenes y rifas. */
function Palette({ db, onClose, admin }) {
  const [q, setQ] = useState(''), [sel, setSel] = useState(0);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase(), digits = s.replace(/\D/g, ''), out = [];
    if (admin) {
      const pages = ADMIN_SECTIONS.flatMap(sec => sec.pages.map(([h, l]) => ({ group: 'Pantallas', icon: ChevronRight, label: l, meta: sec.label, to: h })));
      if (!s) return pages;
      pages.filter(p => p.label.toLowerCase().includes(s)).forEach(p => out.push(p));
      db.companies.filter(c => (c.name + c.rif + c.runlot).toLowerCase().includes(s)).slice(0, 6).forEach(c => out.push({ group: 'Empresas', icon: Building2, label: c.name, meta: c.rif, to: '/admin/empresas', query: { e: c.id } }));
      API.allRaffles().filter(r => r.title.toLowerCase().includes(s)).slice(0, 6).forEach(r => out.push({ group: 'Rifas', icon: Ticket, label: r.title, meta: (db.companies.find(c => c.id === r.companyId) || {}).name, to: '/admin/rifas', query: { r: r.id, tab: 'todas' } }));
      db.reports.filter(r => (r.ref + r.target).toLowerCase().includes(s)).slice(0, 4).forEach(r => out.push({ group: 'Denuncias', icon: Flag, label: r.ref, meta: r.target, to: '/admin/denuncias', query: { d: r.ref } }));
      return out;
    }
    const pages = SECTIONS.flatMap(sec => sec.pages.map(([h, l]) => ({ group: 'Pantallas', icon: ChevronRight, label: l, meta: sec.label, to: h })));
    if (!s) return pages.slice(0, 8).concat(db.raffles.filter(r => raffleState(r) === 'venta').map(r => ({ group: 'Rifas en venta', icon: Ticket, label: r.title, meta: r.id, to: '/rifas/' + r.id })));
    pages.filter(p => p.label.toLowerCase().includes(s)).slice(0, 5).forEach(p => out.push(p));
    db.clients.filter(c => c.name.toLowerCase().includes(s) || (digits.length >= 3 && c.cedula.includes(digits)) || (digits.length >= 4 && c.phone.replace(/\D/g, '').includes(digits))).slice(0, 6)
      .forEach(c => out.push({ group: 'Clientes', icon: User, label: c.name, meta: cedFmt(c.cedula), to: '/ventas/verificador', query: { ced: c.cedula } }));
    if (/^lg-?\d+/i.test(s)) db.orders.filter(o => o.id.toLowerCase().replace('-', '').includes(s.replace('-', ''))).slice(0, 5).forEach(o => out.push({ group: 'Órdenes', icon: FileText, label: `${o.id} · ${o.name}`, meta: API.raffle(o.raffleId).title, to: '/ventas/pagos', query: { orden: o.id, tab: { pendiente: 'pendiente', abono: 'abono', aprobada: 'aprobada' }[o.status] || 'rechazada' } }));
    if (digits && digits.length <= 4 && !/^lg/i.test(s)) db.orders.filter(o => o.numbers.includes(digits.padStart(API.digits(API.raffle(o.raffleId)), '0')) && ['aprobada', 'abono', 'pendiente'].includes(o.status)).slice(0, 6)
      .forEach(o => { const r = API.raffle(o.raffleId); out.push({ group: 'Boletos', icon: Ticket, label: `Boleto ${digits.padStart(API.digits(r), '0')} · ${r.title}`, meta: o.name, to: '/ventas/verificador', query: { ced: o.cedula } }); });
    db.raffles.filter(r => r.title.toLowerCase().includes(s) || r.prize.toLowerCase().includes(s)).slice(0, 5).forEach(r => out.push({ group: 'Rifas', icon: Ticket, label: r.title, meta: API.util.STATE_LABEL[raffleState(r)], to: '/rifas/' + r.id }));
    return out;
  }, [q, db, admin]);
  const pick = r => { onClose(); go(r.to, r.query); };
  const key = e => { if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => Math.min(results.length - 1, i + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setSel(i => Math.max(0, i - 1)); } if (e.key === 'Enter' && results[sel]) pick(results[sel]); if (e.key === 'Escape') onClose(); };
  let last = '';
  return <><div className="scrim" onClick={onClose} /><div className="palette" role="dialog" aria-modal="true" aria-label="Buscar">
    <div style={{ position: 'relative' }}><Search size={18} style={{ position: 'absolute', left: 16, top: 17, color: 'var(--ink-3)' }} aria-hidden="true" />
      <input autoFocus value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={key} placeholder={admin ? 'Empresa, RIF, rifa, denuncia o pantalla' : 'Nombre, cédula, número de boleto, orden (LG-…) o pantalla'} aria-label="Buscar" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-activedescendant={results[sel] ? 'pal-' + sel : undefined} /></div>
    <div className="palette__list" id="pal-list" role="listbox">
      {results.length ? results.map((r, i) => { const head = r.group !== last; last = r.group; return <div key={i}>{head && <div className="palette__group">{r.group}</div>}<button id={'pal-' + i} type="button" role="option" aria-selected={i === sel} className="palette__item" onMouseEnter={() => setSel(i)} onClick={() => pick(r)}><r.icon size={15} aria-hidden="true" />{r.label}<small>{r.meta}</small></button></div>; })
        : <p className="subtle" style={{ padding: 16 }}>Sin resultados para «{q}».</p>}
    </div>
  </div></>;
}

/* Ayuda escrita para el operador, organizada por tareas. Cada guía abre su contenido. */
const GUIDES = [
  ['Vender en la taquilla', 'Ventas › Taquilla', ['Elige la rifa en venta.', 'Toca los números o usa "Al azar" con la cantidad (1, 2, 5 o 10). "Ir al número" salta a uno en particular.', 'Escribe la cédula: si el cliente ya compró antes, sus datos se llenan solos.', 'Elige el método de pago. Si cobras una parte, marca "Es un abono" y escribe el monto cobrado.', 'Confirma: sale el recibo con los números para imprimir o enviar por WhatsApp.']],
  ['Verificar un pago', 'Ventas › Pagos por verificar', ['Abre el pago: el panel lateral muestra el comprobante, el monto en US$ y Bs y la tasa con la que se cobró.', 'Compara la referencia y el monto con tu banco.', '"Aprobar pago" asigna los números (si compró al azar) y le avisa al cliente por correo y WhatsApp.', 'Si no hay referencia ni comprobante, el sistema pide una confirmación explícita y lo deja en la Actividad.', 'Para rechazar, elige el motivo: los números reservados se liberan.']],
  ['Reportar el ganador', 'Rifas › Ganadores por reportar', ['Elige la rifa cerrada.', 'Escribe el resultado publicado por la lotería: el sistema busca el boleto y te dice si se vendió y a quién.', 'Adjunta la evidencia del resultado (foto o captura).', 'Marca "Avisar a todos los participantes" si quieres que les llegue el mensaje.']],
  ['Crear una rifa', 'Rifas › Nueva rifa', ['Completa los 4 pasos. Los errores se marcan en cada campo.', 'El cierre de ventas se calcula solo desde la fecha del sorteo.', 'Puedes guardar el borrador en cualquier paso.', 'Al enviarla queda "En revisión CONALOT". En este entorno, la respuesta de CONALOT se simula desde el detalle de la rifa.']],
  ['Actualizar la tasa', 'Ajustes › Monedas y tasas', ['Toca "Actualizar tasa" y escribe la tasa del BCV.', 'Se usa al instante en todo el sistema y en la página pública.', 'Cada venta guarda la tasa con la que se cobró: cambiarla no altera ventas pasadas.']],
  ['Activar el pago automático', 'Ajustes › Pasarelas', ['Completa los pasos de AvilaPay o ChinChin hasta que el estado diga "Activa".', 'Desde ese momento, el método "Pago Móvil al instante" aparece en tu página pública y entrega los números sin revisión manual.']],
  ['Cambiar el diseño de la página pública', 'Ajustes › Sitio web', ['Elige una de las 6 plantillas de venta, el color de tu marca y los textos.', 'Mira la vista previa en teléfono o computadora.', '"Publicar cambios" la deja en tu página pública.']],
  ['Enviar una campaña', 'Mensajería › Campañas', ['Elige el canal (WhatsApp o correo) y la audiencia por segmento de clientes.', 'Por WhatsApp solo se envía a quien dio su consentimiento (política de Meta).', 'El embudo enviados → entregados → leídos → fallidos siempre suma lo mismo.']]
];
function Help({ onClose }) {
  const [open, setOpen] = useState(null), [tour, setTour] = useState(false);
  return <Drawer title={open == null ? 'Ayuda' : GUIDES[open][0]} kicker={open == null ? 'Guías para el operador' : GUIDES[open][1]} onClose={onClose} footer={open == null ? <><span className="subtle">Soporte de ejemplo · lun a sáb, 8:00 a. m. a 6:00 p. m.</span><Button size="sm" onClick={() => setTour(true)}>Recorrido guiado</Button></> : <Button onClick={() => setOpen(null)}>Volver a las guías</Button>}>
    {open == null ? <div className="card">{GUIDES.map(([t, w], i) => <button key={t} type="button" className="list-row" style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen(i)}><span className="grow"><b>{t}</b><small>{w}</small></span><ChevronRight size={16} aria-hidden="true" /></button>)}</div>
      : <ol style={{ paddingLeft: 20, margin: 0, display: 'grid', gap: 10 }}>{GUIDES[open][2].map(s => <li key={s}>{s}</li>)}</ol>}
    {open == null && <Note tone="info" icon={HelpCircle}>El recorrido guiado solo empieza cuando lo pides; nunca sale solo al cargar una pantalla.</Note>}
    {tour && <Tour onClose={() => { setTour(false); onClose(); }} />}
  </Drawer>;
}
const TOUR = [['Inicio', 'Aquí ves lo que tienes que hacer hoy: pagos por verificar, ganadores por reportar y pasarelas sin terminar.', '/'], ['Ventas', 'Pagos por verificar, Taquilla, Verificador y Reportes están en Ventas.', '/ventas/pagos'], ['Tasa vigente', 'La tasa Bs/US$ está siempre arriba. Tócala para actualizarla.', '/ajustes/monedas'], ['Buscador', 'Con Ctrl K buscas clientes, boletos, órdenes y pantallas desde cualquier lugar.', '/']];
function Tour({ onClose }) {
  const [i, setI] = useState(0);
  useEffect(() => { go(TOUR[i][2]); }, [i]);
  return <Modal title={`${i + 1} de ${TOUR.length} · ${TOUR[i][0]}`} onClose={onClose} footer={<><Button onClick={onClose}>Salir</Button>{i < TOUR.length - 1 ? <Button variant="primary" onClick={() => setI(i + 1)}>Siguiente</Button> : <Button variant="primary" onClick={onClose}>Listo</Button>}</>}><p>{TOUR[i][1]}</p></Modal>;
}

/* Herramientas solo del entorno de pruebas: simulan lo que en producción hacen terceros. */
function Tools({ db, onClose }) {
  const [reset, setReset] = useState(false);
  const review = db.raffles.filter(r => r.status === 'revision');
  const closedPend = db.orders.filter(o => o.status === 'pendiente' && raffleState(API.raffle(o.raffleId)) !== 'venta').length;
  return <Drawer title="Herramientas de prueba" kicker="Solo en este entorno" onClose={onClose}>
    <Note tone="info" icon={FlaskConical}>Simulan lo que en producción hacen otros: CONALOT, los clientes, el banco o el paso del tiempo. Todo queda guardado en este navegador.</Note>
    <div className="card">
      <div className="list-row"><span className="grow"><b>Página pública</b><small>Compra como cliente con la plantilla publicada</small></span><a className="btn btn--sm" href={publicUrl(db)} target="_blank" rel="noopener">Abrir</a></div>
      {review.map(r => <div className="list-row" key={r.id}><span className="grow"><b>CONALOT · {r.title}</b><small>En revisión desde {date(r.createdAt)}</small></span><Button size="sm" variant="success" onClick={() => attempt(() => API.conalotDecide(r.id, true), 'CONALOT aprobó la rifa: ya está en venta')}>Aprobar</Button><Button size="sm" variant="danger" onClick={() => attempt(() => API.conalotDecide(r.id, false, 'Falta el documento de solvencia del premio.'), 'CONALOT rechazó la rifa')}>Rechazar</Button></div>)}
      <div className="list-row"><span className="grow"><b>Mensaje entrante</b><small>Un cliente escribe por WhatsApp a la Bandeja</small></span><Button size="sm" onClick={() => { const cv = API.simulateIncoming(); toast(`Nuevo mensaje de ${cv.name}`); }}>Simular</Button></div>
      <div className="list-row"><span className="grow"><b>Recordatorios de pago</b><small>Corre la automatización para quien tiene saldo</small></span><Button size="sm" onClick={() => toast(`Recordatorio enviado a ${API.runReminders()} clientes con saldo`)}>Ejecutar</Button></div>
      <div className="list-row"><span className="grow"><b>Vencer pagos de rifas cerradas</b><small>En producción pasa solo a las 48 h · {closedPend} pendientes</small></span><Button size="sm" disabled={!closedPend} onClick={() => toast(`${API.expireClosed()} pagos vencidos`)}>Vencer</Button></div>
      <div className="list-row"><span className="grow"><b>Reiniciar datos</b><small>Vuelve a la base de ejemplo (tu cliente de prueba se mantiene)</small></span><Button size="sm" variant="danger" icon={RotateCcw} onClick={() => setReset(true)}>Reiniciar</Button></div>
    </div>
    <p className="subtle">Pago Móvil al instante: con una pasarela activa, una referencia que termina en 0 simula que el banco no encontró el pago.</p>
    {reset && <Confirm title="¿Reiniciar los datos?" text="Se borran las ventas, rifas y cambios que hiciste en este navegador y vuelve la base de ejemplo." confirm="Reiniciar" danger onClose={() => setReset(false)} onConfirm={() => { API.reset(); setReset(false); onClose(); go('/'); toast('Datos reiniciados'); }} />}
  </Drawer>;
}

function Toasts() {
  const list = useToasts();
  return <div className="toasts" role="status" aria-live="polite">{list.map(t => <div key={t.id} className={'toast' + (t.kind === 'err' ? ' toast--err' : '')}>{t.kind === 'err' && <AlertTriangle size={16} aria-hidden="true" />}{t.text}</div>)}</div>;
}

/* Si una pantalla falla, se muestra un mensaje con "Recargar" en vez de una pantalla en blanco. */
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(e, info) { console.error('LottoX', e, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="card" role="alert"><div className="empty"><AlertTriangle size={28} /><b>Esta pantalla tuvo un problema</b><p>No perdiste datos. Recarga para seguir trabajando.</p><p className="subtle mono">{String(this.state.error.message || this.state.error)}</p><div className="row" style={{ marginTop: 8 }}><Button variant="primary" onClick={() => location.reload()}>Recargar</Button><Button onClick={() => { this.setState({ error: null }); go('/'); }}>Ir al Inicio</Button></div></div></div>;
  }
}
