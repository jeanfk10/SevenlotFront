import { useState } from 'react';
import { Plus, Store, Trophy, CreditCard, Plug, Users, AlertTriangle, ChevronRight, Search, Megaphone } from 'lucide-react';
import { API, useDB, usd, bs, plural, greeting, longDate, dateTime, raffleState, pendingTasks } from '../lib.js';
import { PageHead, Card, LinkButton, Empty, Badge, Input, Count, FloatBg, Note } from '../ui.jsx';
import { RaffleCard } from '../rifa-ui.jsx';

const TICON = { trophy: Trophy, card: CreditCard, plug: Plug, users: Users, alert: AlertTriangle };
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

// Inicio sencillo: saludo, lo que toca hacer hoy, cuatro accesos grandes, tres cifras y las rifas en venta.
// Los gráficos y el detalle de ventas viven en Ventas › Reportes.
export function Inicio() {
  const db = useDB();
  const now = Date.now(), today = startOfDay(now);
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const ok = db.orders.filter(o => o.status === 'aprobada' || o.status === 'abono');
  const paidOf = o => o.status === 'aprobada' ? o.amountUSD : o.paidUSD;
  const sum = (list, f = paidOf) => list.reduce((a, o) => a + f(o), 0);
  const todayList = ok.filter(o => Date.parse(o.createdAt) >= today);
  const month = ok.filter(o => Date.parse(o.createdAt) >= monthStart.getTime());
  const pend = db.orders.filter(o => o.status === 'pendiente'), abonos = db.orders.filter(o => o.status === 'abono');
  const owed = sum(pend, o => o.amountUSD) + sum(abonos, o => o.amountUSD - o.paidUSD);
  const live = db.raffles.filter(r => raffleState(r) === 'venta');
  const winners = db.raffles.filter(r => raffleState(r) === 'falta-ganador').length;
  // Pagos y ganadores ya salen con su número en los accesos grandes; aquí va el resto.
  const tasks = pendingTasks(db), other = tasks.filter(t => t.id !== 'pagos' && t.id !== 'ganadores');
  return <>
    <div className="hello"><FloatBg /><PageHead title={<>{greeting()}, <em>{db.me.short}</em></>} sub={<>{longDate(now).replace(/^\w/, c => c.toUpperCase())} · {tasks.length ? plural(tasks.length, 'cosa pendiente', 'cosas pendientes') : 'estás al día'}</>}
      actions={<LinkButton href="#/ventas/taquilla" variant="primary" size="lg" icon={Store}>Vender boletos</LinkButton>} /></div>
    {db.releaseNotes && db.releaseNotes[0] && Date.now() - Date.parse(db.releaseNotes[0].at) < 7 * 864e5 && <div style={{ marginBottom: 16 }}><Note tone="info" icon={Megaphone}><b>Novedad de LottoGE: {db.releaseNotes[0].title}.</b> {db.releaseNotes[0].body}</Note></div>}
    {other.length > 0 && <section className="todo" aria-label="Pendiente de ti"><h2 className="sec-title">Pendiente de ti</h2>
      <div className="todo__list">{other.slice(0, 3).map(t => { const I = TICON[t.icon]; return <a key={t.id + t.title} className={'todo__item todo__item--' + t.tone} href={'#' + t.to}><i><I size={20} aria-hidden="true" /></i><span className="grow"><b>{t.title}</b><small>{t.sub}</small></span><span className="todo__go">{t.action}<ChevronRight size={15} aria-hidden="true" /></span></a>; })}</div></section>}
    <div className="quick">
      <a className="q1" href="#/ventas/taquilla"><i><Store size={22} /></i><b>Vender boletos</b><small>En el POS Terminal, en 4 pasos</small></a>
      <a className="q2" href="#/ventas/pagos"><i><CreditCard size={22} /></i><b>Revisar pagos{pend.length > 0 && <em>{pend.length}</em>}</b><small>Aprobar o rechazar comprobantes</small></a>
      <a className="q3" href="#/ventas/verificador"><i><Search size={22} /></i><b>Buscar boletos</b><small>Por la cédula del cliente</small></a>
      <a className="q4" href="#/rifas/ganadores"><i><Trophy size={22} /></i><b>Reportar ganador{winners > 0 && <em>{winners}</em>}</b><small>De las rifas que ya cerraron</small></a>
    </div>
    <div className="kpis">
      <div className="kpi kpi--coral"><small>Vendido hoy</small><b className="num"><Count to={sum(todayList)} format={v => usd(Math.round(v), true)} /></b><span>{todayList.length ? plural(todayList.length, 'venta', 'ventas') : 'Todavía sin ventas'}</span></div>
      <div className="kpi kpi--teal"><small>Vendido en {new Date(now).toLocaleDateString('es-VE', { month: 'long' })}</small><b className="num"><Count to={sum(month)} format={v => usd(Math.round(v), true)} /></b><span>{bs(sum(month, o => paidOf(o) * o.rate), true)}</span></div>
      <a className="kpi kpi--sun" href="#/ventas/pagos"><small>Por cobrar</small><b className="num"><Count to={owed} format={v => usd(Math.round(v), true)} /></b><span>{pend.length} por verificar · {abonos.length} abonos</span></a>
    </div>
    <div className="sec-head"><h2 className="sec-title">{live.length === 1 ? 'Tu rifa en venta' : 'Tus rifas en venta'}</h2><a className="link" href="#/rifas">Ver todas tus rifas</a></div>
    {live.length ? <div className="rgrid">{live.map(r => <RaffleCard key={r.id} r={r} state="venta" sold={API.raffleStats(r.id).sold} href={'#/rifas/' + r.id} action={<LinkButton size="sm" variant="primary" icon={Store} href={`#/ventas/taquilla?rifa=${r.id}`}>Vender</LinkButton>} />)}</div>
      : <Card><Empty title="No hay rifas en venta" text="Crea una rifa y envíala a revisión." action={<LinkButton href="#/rifas/nueva" variant="primary" icon={Plus}>Nueva rifa</LinkButton>} /></Card>}
    <p className="subtle" style={{ marginTop: 18 }}>¿Buscas gráficos y el detalle de cada venta? Están en <a className="link" href="#/ventas/reportes">Ventas › Reportes</a>.</p>
  </>;
}

export function Actividad() {
  const db = useDB(), [q, setQ] = useState(''), [n, setN] = useState(40);
  const list = db.audit.filter(a => !q || (a.action + ' ' + a.detail + ' ' + a.by).toLowerCase().includes(q.toLowerCase()));
  return <>
    <PageHead title="Actividad" sub="Lo que se hizo en el panel: quién, qué y cuándo. Las aprobaciones sin comprobante quedan registradas aquí." />
    <Card body={false}>
      <div className="toolbar"><div className="input-icon grow" style={{ maxWidth: 360 }}><Input placeholder="Buscar en la actividad" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar en la actividad" /></div><span className="subtle">{plural(list.length, 'evento', 'eventos')}</span></div>
      <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Cuándo</th><th>Quién</th><th>Acción</th><th>Detalle</th></tr></thead>
        <tbody>{list.slice(0, n).map(a => <tr key={a.id}><td className="num" style={{ whiteSpace: 'nowrap' }}>{dateTime(a.at)}</td><td>{a.by}</td><td><b>{a.action}</b> {/sin comprobante/i.test(a.action) && <Badge tone="warn">Revisar</Badge>}</td><td className="muted">{a.detail}</td></tr>)}</tbody></table></div>
      {!list.length && <Empty title={`Sin resultados para «${q}»`} />}
      {list.length > n && <div className="card__foot"><span>Mostrando {n} de {list.length}</span><button className="btn btn--sm" type="button" onClick={() => setN(n + 40)}>Ver más</button></div>}
    </Card>
  </>;
}
