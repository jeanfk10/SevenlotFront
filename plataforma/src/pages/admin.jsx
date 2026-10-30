// Panel del superadministrador de LottoGE, con el mismo sistema que el del operador.
// Corrige lo que señaló el informe de revisión: acciones con confirmación y motivo, un solo estado por
// objeto, datos personales enmascarados en la sala situacional y cifras que salen de la misma fuente.
import { useState, useEffect, useMemo } from 'react';
import { Building2, Ticket, Flag, Receipt, Check, X, Search, Eye, Pause, Play, RefreshCw, AlertTriangle, CalendarClock, FileText, ShieldCheck, Plus, Clock, Lock, Download, Pencil, Trash2, History, Info, UserPlus, Mail, ChevronRight } from 'lucide-react';
import { RaffleCard, RaffleHero, RaffleFacts, PrizeList, RulesBlock, soldOf } from '../rifa-ui.jsx';
import { API, useDB, go, setQuery, usd, bs, num, plural, date, dateTime, ago, greeting, cedFmt, raffleState, STATE_LABEL, RAFFLE_TONE, LOTTERIES, attempt, toast, confetti, downloadCSV, daysLeft, readImage, toLocalInput, fromLocalInput, STATES } from '../lib.js';
import { ClientCard, OrderDetail, PurchaseList, clientTotals } from '../compras.jsx';
import { PageHead, Card, Seg, Button, LinkButton, Badge, Note, Drawer, Modal, Field, Input, Select, Textarea, Empty, Stat, Toggle, Confirm, Count, FloatBg, Bar, Check2, FileDrop, Thumb, Steps } from '../ui.jsx';

const COMPANY_STATUS = { pendiente: ['Pendiente', 'warn'], activa: ['Activa', 'ok'], suspendida: ['Suspendida', 'err'], rechazada: ['Rechazada', 'muted'] };
const BILLING = { pagado: ['Al día', 'ok'], pendiente: ['Pago pendiente', 'warn'], vencido: ['Vencido', 'err'], '': ['Sin cobros', 'muted'] };
const REPORT_STATUS = { nueva: ['Nueva', 'warn'], revision: ['En revisión', 'info'], resuelta: ['Resuelta', 'ok'], descartada: ['Descartada', 'muted'] };
const coName = (db, id) => (db.companies.find(c => c.id === id) || {}).name || '—';
const mask = ced => { const m = String(ced).match(/^([VE])(\d+)$/); return m ? `${m[1]}-${m[2].slice(0, 2)}.***.${m[2].slice(-3)}` : '—'; };
const maskPhone = p => p ? p.replace(/^(\d{4})-?(\d{3})-?(\d{4})$/, '$1-***-$3') : '—';

/* ---------- Inicio ---------- */
export function AdminInicio() {
  const db = useDB(), all = API.allRaffles();
  const pendCo = db.companies.filter(c => c.status === 'pendiente'), pendR = all.filter(r => r.status === 'revision'), pendX = db.extensions.filter(e => e.status === 'pendiente');
  const newRep = db.reports.filter(r => r.status === 'nueva'), dueInv = db.invoices.filter(f => f.status === 'pendiente');
  const active = db.companies.filter(c => c.status === 'activa');
  const sales = active.map(c => ({ c, s: API.companyStats(c) })).sort((a, b) => b.s.monthSalesUSD - a.s.monthSalesUSD);
  const month = sales.reduce((a, x) => a + x.s.monthSalesUSD, 0), max = Math.max(1, ...sales.map(x => x.s.monthSalesUSD));
  const tasks = [
    pendCo.length && { icon: Building2, tone: 'warn', title: plural(pendCo.length, 'empresa espera aprobación', 'empresas esperan aprobación'), sub: pendCo.map(c => c.name).slice(0, 2).join(', '), to: '/admin/empresas', action: 'Revisar' },
    pendR.length && { icon: Ticket, tone: 'warn', title: plural(pendR.length, 'rifa por revisar', 'rifas por revisar'), sub: 'Aprobación previa a la venta', to: '/admin/rifas', action: 'Revisar' },
    pendX.length && { icon: CalendarClock, tone: 'info', title: plural(pendX.length, 'solicitud de extensión', 'solicitudes de extensión'), sub: 'Cambios de fecha del sorteo', to: '/admin/rifas/extensiones', action: 'Responder' },
    newRep.length && { icon: Flag, tone: 'err', title: plural(newRep.length, 'denuncia nueva', 'denuncias nuevas'), sub: 'Llegaron desde la página principal', to: '/admin/denuncias', action: 'Ver' },
    dueInv.length && { icon: Receipt, tone: 'info', title: plural(dueInv.length, 'cobro pendiente', 'cobros pendientes'), sub: usd(dueInv.reduce((a, f) => a + f.amountUSD, 0)) + ' por cobrar', to: '/admin/facturacion', action: 'Cobrar' }
  ].filter(Boolean);
  // Empresas, rifas, denuncias y cobros ya salen con su número en los accesos grandes.
  const other = tasks.filter(t => t.icon === CalendarClock);
  return <>
    <div className="hello"><FloatBg /><PageHead title={<>{greeting()}, <em>superadministrador</em></>} sub={`${plural(active.length, 'empresa activa', 'empresas activas')} · ${plural(all.filter(r => r.status === 'venta').length, 'rifa en venta', 'rifas en venta')} · ${plural(tasks.length, 'tarea pendiente', 'tareas pendientes')}`} actions={<LinkButton href="#/admin/sala" variant="dark" icon={Eye}>Sala situacional</LinkButton>} /></div>
    {other.length > 0 && <section className="todo" aria-label="Pendiente de ti"><h2 className="sec-title">Pendiente de ti</h2>
      <div className="todo__list">{other.slice(0, 3).map((t, i) => <a key={i} className={'todo__item todo__item--' + t.tone} href={'#' + t.to}><i><t.icon size={20} aria-hidden="true" /></i><span className="grow"><b>{t.title}</b><small>{t.sub}</small></span><span className="todo__go">{t.action}<ChevronRight size={15} aria-hidden="true" /></span></a>)}</div></section>}
    <div className="quick">
      <a className="q1" href="#/admin/empresas"><i><Building2 size={22} /></i><b>Empresas{pendCo.length > 0 && <em>{pendCo.length}</em>}</b><small>Aprobar, suspender, cambiar plan</small></a>
      <a className="q2" href="#/admin/rifas"><i><Ticket size={22} /></i><b>Rifas por revisar{pendR.length > 0 && <em>{pendR.length}</em>}</b><small>Antes de que salgan a la venta</small></a>
      <a className="q3" href="#/admin/denuncias"><i><Flag size={22} /></i><b>Denuncias{newRep.length > 0 && <em>{newRep.length}</em>}</b><small>Las que llegan de la página principal</small></a>
      <a className="q4" href="#/admin/facturacion"><i><Receipt size={22} /></i><b>Cobros{dueInv.length > 0 && <em>{dueInv.length}</em>}</b><small>Mantenimiento y licencias</small></a>
    </div>
    <div className="kpis">
      <div className="kpi kpi--coral"><small>Empresas activas</small><b className="num"><Count to={active.length} format={v => num(v)} /></b><span>{pendCo.length} pendientes · {db.companies.filter(c => c.status === 'suspendida').length} suspendidas</span></div>
      <div className="kpi kpi--teal"><small>Rifas en venta</small><b className="num"><Count to={all.filter(r => r.status === 'venta').length} format={v => num(v)} /></b><span>{all.filter(r => r.status === 'falta-ganador').length} esperan ganador</span></div>
      <div className="kpi kpi--sun"><small>Ventas del mes</small><b className="num"><Count to={month} format={v => usd(v, true)} /></b><span>Todas las empresas</span></div>
    </div>
    <Card title="Ventas del mes por empresa" body={false}>{sales.map(({ c, s }) => <div className="hbar" key={c.id}><span>{c.name}{c.live && <> <Badge tone="brand" plain>datos reales del entorno</Badge></>}</span><Bar value={s.monthSalesUSD} max={max} label={c.name} /><b className="num" style={{ textAlign: 'right' }}>{usd(s.monthSalesUSD, true)}</b></div>)}</Card>
    <p className="subtle" style={{ marginTop: 14 }}>Los compradores en vivo están en la <a className="link" href="#/admin/sala">Sala situacional</a> y el historial, en <a className="link" href="#/admin/actividad">Actividad</a>.</p>
  </>;
}

/* ---------- Sala situacional (en vivo, con datos enmascarados) ---------- */
export function Sala() {
  const db = useDB(), [paused, setPaused] = useState(false), [at, setAt] = useState(Date.now()), [, tick] = useState(0), [tab, setTab] = useState('compradores');
  useEffect(() => { if (paused) return; const t = setInterval(() => setAt(Date.now()), 10000); return () => clearInterval(t); }, [paused]);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, []);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ok = db.orders.filter(o => o.status === 'aprobada');
  const todayO = ok.filter(o => Date.parse(o.createdAt) >= today.getTime());
  const others = db.companies.filter(c => c.status === 'activa' && !c.live).reduce((a, c) => a + c.monthSalesUSD / 30, 0);
  const all = API.allRaffles();
  const pendOld = db.orders.filter(o => o.status === 'pendiente' && Date.now() - Date.parse(o.createdAt) > 864e5);
  const alerts = [
    ...all.filter(r => r.status === 'falta-ganador').map(r => ({ tone: 'warn', text: `${r.title} (${coName(db, r.companyId)}) cerró y no ha reportado ganador`, to: '/admin/rifas?tab=falta-ganador' })),
    pendOld.length && { tone: 'warn', text: `${plural(pendOld.length, 'pago lleva', 'pagos llevan')} más de 24 h sin verificar en Rifas Mérida`, to: '/admin/empresas?e=c-rifas-merida' },
    db.companies.filter(c => c.status === 'pendiente').length && { tone: 'info', text: `${plural(db.companies.filter(c => c.status === 'pendiente').length, 'empresa espera', 'empresas esperan')} aprobación`, to: '/admin/empresas' },
    db.reports.filter(r => r.status === 'nueva').length && { tone: 'err', text: `${plural(db.reports.filter(r => r.status === 'nueva').length, 'denuncia nueva', 'denuncias nuevas')}`, to: '/admin/denuncias' }
  ].filter(Boolean);
  const top = {}; ok.forEach(o => { top[o.cedula] = top[o.cedula] || { cedula: o.cedula, name: o.name, qty: 0, usd: 0 }; top[o.cedula].qty += o.qty; top[o.cedula].usd += o.amountUSD; });
  const states = {}; ok.forEach(o => { const c = API.client(o.cedula); const k = (c && c.state) || 'Sin dato'; states[k] = (states[k] || 0) + o.qty; });
  const stMax = Math.max(1, ...Object.values(states));
  const secs = Math.floor((Date.now() - at) / 1000);
  return <>
    <PageHead title="Sala situacional" sub={`Monitoreo en vivo para CONALOT · actualizado ${secs < 5 ? 'ahora' : `hace ${secs} s`}`} actions={<><Button icon={paused ? Play : Pause} onClick={() => setPaused(!paused)}>{paused ? 'Reanudar' : 'Pausar'}</Button><Button icon={RefreshCw} onClick={() => { setAt(Date.now()); toast('Sala actualizada'); }}>Actualizar</Button></>} />
    <div className="stats" style={{ marginBottom: 18 }}>
      <Stat label="Ventas de hoy" value={<Count to={todayO.reduce((a, o) => a + o.amountUSD, 0) + others} format={v => usd(v, true)} />} sub={`${todayO.length} en Rifas Mérida + promedio de las demás`} />
      <Stat label="Boletos vendidos hoy" value={<Count to={todayO.reduce((a, o) => a + o.qty, 0)} format={v => num(v)} />} sub="Rifas Mérida (en vivo)" />
      <Stat label="Rifas en venta" value={num(all.filter(r => r.status === 'venta').length)} sub={`${db.companies.filter(c => c.status === 'activa').length} empresas activas`} />
      <Stat label="Pagos por verificar" value={num(db.orders.filter(o => o.status === 'pendiente').length)} sub={`${pendOld.length} con más de 24 h`} subTone={pendOld.length ? 'warn' : ''} />
    </div>
    <div className="grid grid--side">
      <Card body={false}>
        <div className="toolbar"><Seg label="Vista" value={tab} onChange={setTab} options={[{ key: 'compradores', label: 'Top compradores' }, { key: 'compras', label: 'Últimas compras' }, { key: 'estados', label: 'Por estado' }]} /><span className="subtle" style={{ marginLeft: 'auto' }}><Lock size={13} /> Cédulas y teléfonos enmascarados</span></div>
        {tab === 'compradores' && <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>#</th><th>Comprador</th><th>Cédula</th><th>Teléfono</th><th className="r">Boletos</th><th className="r">Monto</th></tr></thead>
          <tbody>{Object.values(top).sort((a, b) => b.qty - a.qty).slice(0, 10).map((t, i) => { const c = API.client(t.cedula) || {}; return <tr key={t.cedula}><td className="num">{i + 1}</td><td><b>{t.name.split(' ')[0]} {(t.name.split(' ')[1] || '')[0] || ''}.</b></td><td className="mono">{mask(t.cedula)}</td><td className="mono">{maskPhone(c.phone)}</td><td className="r num">{t.qty}</td><td className="r num">{usd(t.usd, true)}</td></tr>; })}</tbody></table></div>}
        {tab === 'compras' && <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Hora</th><th>Comprador</th><th>Rifa</th><th className="r">Boletos</th><th className="r">Monto</th></tr></thead>
          <tbody>{ok.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map(o => <tr key={o.id}><td className="num">{dateTime(o.createdAt)}</td><td>{o.name ? `${o.name.split(' ')[0]} ${(o.name.split(' ')[1] || '')[0] || ''}.` : 'Cliente sin nombre'}<small className="mono">{mask(o.cedula)}</small></td><td>{API.raffle(o.raffleId).title}<small>Rifas Mérida</small></td><td className="r num">{o.qty}</td><td className="r num">{usd(o.amountUSD)}</td></tr>)}</tbody></table></div>}
        {tab === 'estados' && <div>{Object.entries(states).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div className="hbar" key={k}><span>{k}</span><Bar value={v} max={stMax} label={k} /><b className="num" style={{ textAlign: 'right' }}>{num(v)} boletos</b></div>)}</div>}
      </Card>
      <Card title="Alertas" body={false}>{alerts.length ? alerts.map((a, i) => <a key={i} href={'#' + a.to} className="list-row" style={{ textDecoration: 'none' }}><AlertTriangle size={16} className={a.tone + '-text'} aria-hidden="true" /><span className="grow">{a.text}</span></a>) : <Empty title="Sin alertas" />}</Card>
    </div>
  </>;
}

export function AdminActividad() {
  const db = useDB(), [f, setF] = useState('todo'), [q, setQ] = useState(''), [n, setN] = useState(40);
  const list = db.audit.filter(a => (f === 'todo' || (f === 'sa' ? a.by === 'Superadministrador' : f === 'web' ? a.by === 'Página principal' || a.by === 'Página pública' : !['Superadministrador', 'Página principal', 'Página pública'].includes(a.by))) && (!q || (a.action + a.detail + a.by).toLowerCase().includes(q.toLowerCase())));
  return <>
    <PageHead title="Actividad" sub="Bitácora de toda la plataforma: quién hizo qué y cuándo" actions={<Button icon={Download} onClick={() => downloadCSV('actividad.csv', [['Fecha', 'Quién', 'Acción', 'Detalle'], ...list.map(a => [dateTime(a.at), a.by, a.action, a.detail])])}>Exportar</Button>} />
    <Card body={false}>
      <div className="toolbar"><Seg label="Origen" value={f} onChange={setF} options={[{ key: 'todo', label: 'Todo' }, { key: 'sa', label: 'Superadministrador' }, { key: 'op', label: 'Operadores' }, { key: 'web', label: 'Páginas públicas' }]} /><div className="input-icon" style={{ marginLeft: 'auto', width: 240 }}><Search size={15} /><Input placeholder="Buscar" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar en la actividad" /></div></div>
      {!list.length ? <Empty title="Sin resultados" /> : <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Cuándo</th><th>Quién</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>{list.slice(0, n).map(a => <tr key={a.id}><td className="num" style={{ whiteSpace: 'nowrap' }}>{dateTime(a.at)}</td><td>{a.by}</td><td><b>{a.action}</b></td><td className="muted">{a.detail}</td></tr>)}</tbody></table></div>}
      {list.length > n && <div className="card__foot"><span>Mostrando {n} de {list.length}</span><Button size="sm" onClick={() => setN(n + 40)}>Ver más</Button></div>}
    </Card>
  </>;
}

/* ---------- Empresas ---------- */
export function Empresas({ query }) {
  const db = useDB(), [tab, setTab] = useState('todas'), [q, setQ] = useState('');
  const cnt = k => db.companies.filter(c => c.status === k).length;
  const list = db.companies.filter(c => (tab === 'todas' || c.status === tab) && (!q || (c.name + ' ' + c.rif + ' ' + c.runlot + ' ' + c.email).toLowerCase().includes(q.toLowerCase())));
  const open = query.e && db.companies.find(c => c.id === query.e);
  return <>
    <PageHead title="Empresas" sub={`${plural(db.companies.length, 'empresa registrada', 'empresas registradas')} · las pendientes se revisan antes de vender`} actions={<><LinkButton variant="primary" icon={UserPlus} href="#/admin/empresas/nueva">Registrar empresa</LinkButton><Button icon={Download} onClick={() => downloadCSV('empresas.csv', [['Empresa', 'RIF', 'RUN/LOT', 'Estado', 'Plan', 'Cobros', 'Correo', 'Teléfono', 'Registro'], ...list.map(c => [c.name, c.rif, c.runlot, COMPANY_STATUS[c.status][0], c.plan, BILLING[c.billing][0], c.email, c.phone, date(c.createdAt)])])}>Exportar</Button></>} />
    <Card body={false}>
      <div className="toolbar"><Seg label="Estado" value={tab} onChange={setTab} options={[{ key: 'todas', label: 'Todas', count: db.companies.length }, { key: 'pendiente', label: 'Pendientes', count: cnt('pendiente') }, { key: 'activa', label: 'Activas', count: cnt('activa') }, { key: 'suspendida', label: 'Suspendidas', count: cnt('suspendida') }, { key: 'rechazada', label: 'Rechazadas', count: cnt('rechazada') }]} />
        <div className="input-icon" style={{ marginLeft: 'auto', width: 260 }}><Search size={15} /><Input placeholder="Nombre, RIF, RUN/LOT o correo" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar empresas" /></div></div>
      {!list.length ? <Empty icon={Building2} title={q ? `Sin resultados para «${q}»` : 'No hay empresas en este estado'} action={q && <Button onClick={() => setQ('')}>Limpiar búsqueda</Button>} /> :
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Empresa</th><th>Estado</th><th>Plan</th><th>Cobros</th><th className="r">Rifas en venta</th><th className="r">Ventas del mes</th><th>Registro</th><th><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>{list.map(c => { const s = API.companyStats(c); return <tr key={c.id} className="clickable" onClick={e => e.target.closest('button') || setQuery({ e: c.id })}>
            <td><b>{c.name}</b><small>{c.rif} · {c.runlot || 'Sin RUN/LOT'}</small></td><td><Badge tone={COMPANY_STATUS[c.status][1]}>{COMPANY_STATUS[c.status][0]}</Badge></td><td>{c.plan}</td>
            <td><Badge tone={BILLING[c.billing][1]} plain>{BILLING[c.billing][0]}</Badge></td><td className="r num">{s.rafflesActive}</td><td className="r num">{usd(s.monthSalesUSD, true)}</td><td className="num">{date(c.createdAt)}</td>
            <td className="r"><Button size="sm" variant={c.status === 'pendiente' ? 'primary' : undefined} onClick={() => setQuery({ e: c.id })}>{c.status === 'pendiente' ? 'Revisar' : 'Ver'}</Button></td></tr>; })}</tbody></table></div>}
    </Card>
    {open && <CompanyDrawer c={open} onClose={() => setQuery({ e: '' })} />}
  </>;
}
function CompanyDrawer({ c, onClose }) {
  const db = useDB(), s = API.companyStats(c), [ask, setAsk] = useState(null), [reason, setReason] = useState(''), [plan, setPlan] = useState(c.plan);
  const act = (action, extra) => { const ok = attempt(() => API.companyAction(c.id, action, extra), { aprobar: `${c.name} aprobada: ya puede vender`, rechazar: 'Empresa rechazada', suspender: 'Empresa suspendida', reactivar: 'Empresa reactivada', plan: 'Plan cambiado' }[action]); if (ok) { if (action === 'aprobar') confetti(); setAsk(null); setReason(''); } };
  const docs = [['cedula', 'Cédula de identidad', true], ['rif', 'RIF', true], ...((c.personType || 'juridica') === 'juridica' ? [['acta', 'Acta Constitutiva', true]] : [])];
  const hasDoc = k => k === 'cedula' ? c.docs.cedula !== false : !!c.docs[k];
  const foot = <>{c.status === 'pendiente' && <><Button variant="danger" onClick={() => setAsk('rechazar')}>Rechazar…</Button><Button variant="success" icon={Check} onClick={() => setAsk('aprobar')}>Aprobar empresa</Button></>}
    {c.status === 'activa' && <><Button variant="danger" onClick={() => setAsk('suspender')}>Suspender…</Button>{c.live ? <Button variant="dark" icon={Eye} onClick={() => { API.viewAs(c.id); location.hash = '/'; location.reload(); }}>Ver su panel</Button> : <span />}</>}
    {(c.status === 'suspendida' || c.status === 'rechazada') && <><span /><Button variant="primary" onClick={() => setAsk('reactivar')}>{c.status === 'rechazada' ? 'Volver a revisar' : 'Reactivar'}</Button></>}</>;
  return <Drawer kicker={COMPANY_STATUS[c.status][0]} title={c.name} onClose={onClose} footer={foot}>
    {c.reason && <Note tone={c.status === 'suspendida' ? 'err' : 'warn'}><b>{c.status === 'suspendida' ? 'Suspendida' : 'Rechazada'}:</b> {c.reason}</Note>}
    <dl className="kv kv--left" style={{ gridTemplateColumns: '130px 1fr' }}><dt>RIF</dt><dd>{c.rif}</dd><dt>RUN/LOT</dt><dd>{c.runlot || 'Se asigna al aprobar'}</dd><dt>Estado</dt><dd>{c.state}</dd><dt>Correo</dt><dd>{c.email}</dd><dt>Teléfono</dt><dd>{c.phone}</dd>{c.address && <><dt>Dirección</dt><dd>{c.address}{c.municipality ? `, ${c.municipality}` : ''}</dd></>}{c.subdomain && <><dt>Página</dt><dd className="mono">{c.subdomain}.lottoge.net</dd></>}<dt>Registro</dt><dd>{date(c.createdAt)}{c.registeredBy ? ' · por el superadministrador' : ''}{c.approvedAt ? ` · aprobada el ${date(c.approvedAt)}` : ''}</dd></dl>
    {c.admin && <div className="card" style={{ padding: 14, display: 'grid', gap: 6 }}><div className="row row--between"><b>Administrador de la empresa</b><Badge tone={c.admin.status === 'invitado' ? 'warn' : 'ok'}>{c.admin.status === 'invitado' ? 'Invitación enviada' : 'Activo'}</Badge></div><span>{c.admin.name} · {cedFmt(c.admin.cedula)}</span><span className="subtle">{c.admin.email}{c.admin.phone ? ' · ' + c.admin.phone : ''}</span>{c.admin.status === 'invitado' && <div><Button size="sm" icon={Mail} onClick={() => attempt(() => API.resendInvite(c.id), `Invitación reenviada a ${c.admin.email}`)}>Reenviar invitación</Button></div>}</div>}
    <div className="stats"><Stat label="Rifas en venta" value={s.rafflesActive} /><Stat label="Ventas del mes" value={usd(s.monthSalesUSD, true)} /></div>
    <div><p className="field__label" style={{ marginBottom: 6 }}>Documentos</p>{docs.map(([k, l, req]) => <div key={k} className="row" style={{ padding: '4px 0' }}>{hasDoc(k) ? <Check size={15} className="ok-text" aria-label="Recibido" /> : <X size={15} className={req ? 'err-text' : 'subtle'} aria-label="Falta" />}<span>{l}</span>{!hasDoc(k) && <Badge tone={req ? 'err' : undefined} plain>{req ? 'Falta (obligatorio)' : 'Falta (opcional)'}</Badge>}</div>)}</div>
    {c.status !== 'rechazada' && <div className="row" style={{ alignItems: 'flex-end' }}><div className="grow"><Field label="Plan"><Select value={plan} onChange={e => setPlan(e.target.value)} options={db.plans.map(p => [p.key, `${p.key} · ${p.priceLabel}`])} /></Field></div><Button disabled={plan === c.plan} onClick={() => act('plan', { plan })}>Cambiar plan</Button></div>}
    {ask && <Modal title={{ aprobar: `¿Aprobar ${c.name}?`, rechazar: `Rechazar ${c.name}`, suspender: `Suspender ${c.name}`, reactivar: c.status === 'rechazada' ? 'Volver a revisar' : `Reactivar ${c.name}` }[ask]} onClose={() => setAsk(null)}
      footer={<><Button onClick={() => setAsk(null)}>Cancelar</Button><Button variant={['rechazar', 'suspender'].includes(ask) ? 'danger-solid' : 'primary'} onClick={() => act(ask, { reason })}>{{ aprobar: 'Aprobar', rechazar: 'Rechazar', suspender: 'Suspender', reactivar: 'Confirmar' }[ask]}</Button></>}>
      <p className="muted">{{ aprobar: 'Se le asigna su RUN/LOT, puede crear rifas y se genera el cobro de la licencia.', rechazar: 'La empresa recibe el motivo por correo y puede corregir y volver a enviar.', suspender: 'Sus rifas dejan de venderse y su página pública muestra que está suspendida.', reactivar: 'Vuelve a quedar como estaba antes.' }[ask]}</p>
      {['rechazar', 'suspender'].includes(ask) && <Field label="Motivo" required hint="Le llega a la empresa."><Textarea data-autofocus rows={3} value={reason} onChange={e => setReason(e.target.value)} /></Field>}
    </Modal>}
  </Drawer>;
}

/* ---------- Supervisor de rifas ---------- */
export function SupervisorRifas({ query }) {
  const db = useDB(), all = API.allRaffles(), tab = query.tab || 'revision', [q, setQ] = useState('');
  const cnt = k => all.filter(r => r.status === k).length;
  const list = all.filter(r => (tab === 'todas' || r.status === tab) && (!q || (r.title + coName(db, r.companyId)).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = query.r && all.find(r => r.id === query.r);
  return <>
    <PageHead title="Supervisor de rifas" sub="Las rifas se revisan antes de salir a la venta (requisito de CONALOT)" />
    <div className="toolbar toolbar--bare"><Seg label="Estado" value={tab} onChange={t => setQuery({ tab: t, r: '' })} options={[{ key: 'revision', label: 'Por revisar', count: cnt('revision') }, { key: 'venta', label: 'En venta', count: cnt('venta') }, { key: 'falta-ganador', label: 'Falta ganador', count: cnt('falta-ganador') }, { key: 'rechazada', label: 'Rechazadas', count: cnt('rechazada') }, { key: 'todas', label: 'Todas', count: all.length }]} />
        <div className="input-icon" style={{ marginLeft: 'auto', width: 240 }}><Search size={15} /><Input placeholder="Rifa o empresa" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar rifas" /></div>
    </div>
    {!list.length ? <Card><Empty icon={Ticket} title={tab === 'revision' ? 'No hay rifas por revisar' : 'No hay rifas en este estado'} text={tab === 'revision' ? 'Cuando un operador envíe una rifa, aparece aquí.' : ''} /></Card> :
      <div className="rgrid">{list.map(r => <RaffleCard key={r.id} r={r} state={r.status} sold={soldOf(r)} href={`#/admin/rifas/detalle?r=${r.id}`} hint={`Enviada el ${date(r.createdAt)}. Revísala antes de que salga a la venta.`} extra={<p className="rcard__co"><Building2 size={14} aria-hidden="true" />{coName(db, r.companyId)}</p>}
        action={r.status === 'revision' ? <Button size="sm" variant="primary" onClick={() => setQuery({ r: r.id })}>Revisar</Button> : r.status === 'venta' ? <LinkButton size="sm" icon={Pencil} href={`#/admin/rifas/editar?r=${r.id}`} aria-label={`Editar ${r.title}`}>Editar</LinkButton> : null} />)}</div>}
    {open && <RaffleDrawer r={open} onClose={() => setQuery({ r: '' })} />}
  </>;
}
function RaffleDrawer({ r, onClose }) {
  const db = useDB(), [rej, setRej] = useState(false), [reason, setReason] = useState('');
  const checks = [['Documento de solvencia', !!r.solvencyDoc], ['Al menos una regla', (r.rules || []).length > 0], ['Fecha del sorteo futura', Date.parse(r.drawAt) > Date.now()], ['Empresa activa', (db.companies.find(c => c.id === r.companyId) || {}).status === 'activa']];
  const okAll = checks.every(c => c[1]);
  const decide = (ok) => { if (attempt(() => API.superRaffleDecide(r.id, ok, reason), ok ? 'Rifa aprobada: ya está en venta' : 'Rifa rechazada: el operador recibe el motivo')) { if (ok) confetti(); onClose(); } };
  const editBtn = <div className="row"><LinkButton href={`#/admin/rifas/detalle?r=${r.id}`}>Detalle y boletos</LinkButton><LinkButton icon={Pencil} href={`#/admin/rifas/editar?r=${r.id}`}>Editar rifa</LinkButton></div>;
  return <Drawer kicker={`${coName(db, r.companyId)} · ${STATE_LABEL[r.status]}`} title={r.title} onClose={onClose} footer={r.status === 'revision' ? <><Button variant="danger" onClick={() => setRej(true)}>Rechazar…</Button><div className="row">{editBtn}<Button variant="success" icon={Check} disabled={!okAll} onClick={() => decide(true)}>Aprobar rifa</Button></div></> : r.status === 'venta' ? <><span />{editBtn}</> : <><span /><LinkButton href={`#/admin/rifas/detalle?r=${r.id}`}>Detalle y boletos</LinkButton></>}>
    {r.status === 'revision' && <Note tone="info" icon={ShieldCheck}>Si falta algo menor, corrígelo con "Editar rifa" y apruébala; si no, recházala con el motivo.</Note>}
    {(r.changes || []).length > 0 && <Note icon={History}><b>Editada por el superadministrador {ago(r.changes[0].at)}:</b> {r.changes[0].diff.join('; ')}.</Note>}
    {r.rejectReason && <Note tone="err"><b>Rechazada:</b> {r.rejectReason}</Note>}
    <dl className="kv kv--left" style={{ gridTemplateColumns: '130px 1fr' }}><dt>Premio</dt><dd>{r.prize}</dd><dt>Lotería</dt><dd>{r.lottery}</dd><dt>Sorteo</dt><dd>{dateTime(r.drawAt)}</dd><dt>Precio</dt><dd>{usd(r.priceUSD)} · {num(r.total)} números</dd><dt>Enviada</dt><dd>{date(r.createdAt)}</dd><dt>Reglas</dt><dd>{(r.rules || []).length ? (r.rules || []).join(' · ') : <span className="err-text">Sin reglas</span>}</dd></dl>
    <div><p className="field__label" style={{ marginBottom: 6 }}>Requisitos</p>{checks.map(([l, ok]) => <div key={l} className="row" style={{ padding: '4px 0' }}>{ok ? <Check size={15} className="ok-text" aria-label="Cumple" /> : <X size={15} className="err-text" aria-label="No cumple" />}<span className={ok ? '' : 'err-text'}>{l}</span></div>)}</div>
    {r.status === 'revision' && !okAll && <Note tone="warn">No cumple todos los requisitos: solo se puede rechazar.</Note>}
    {rej && <Modal title={`Rechazar ${r.title}`} sub="El operador recibe el motivo y puede corregir y reenviar." onClose={() => setRej(false)} footer={<><Button onClick={() => setRej(false)}>Cancelar</Button><Button variant="danger-solid" onClick={() => decide(false)}>Rechazar rifa</Button></>}>
      <Field label="Motivo" required><Textarea data-autofocus rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder={r.solvencyDoc ? '' : 'Falta el documento de solvencia del premio.'} /></Field>
      {!r.solvencyDoc && !reason && <button type="button" className="link" onClick={() => setReason('Falta el documento de solvencia del premio.')}>Usar "Falta el documento de solvencia del premio."</button>}</Modal>}
  </Drawer>;
}

/* ---------- Extensiones de fecha ---------- */
export function Extensiones() {
  const db = useDB(), [tab, setTab] = useState('pendiente'), [rej, setRej] = useState(null), [note, setNote] = useState('');
  const title = e => (API.raffle(e.raffleId) || db.extRaffles.find(x => x.id === e.raffleId) || {}).title || e.raffleId;
  const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  const list = db.extensions.filter(e => tab === 'todas' || e.status === tab);
  const cnt = k => db.extensions.filter(e => e.status === k).length;
  return <>
    <PageHead title="Extensiones de fecha" sub={`Cambios de fecha del sorteo que piden los operadores · máximo ${db.platform.maxExtensionDays} días`} />
    <Card body={false}>
      <div className="toolbar"><Seg label="Estado" value={tab} onChange={setTab} options={[{ key: 'pendiente', label: 'Pendientes', count: cnt('pendiente') }, { key: 'aprobada', label: 'Aprobadas', count: cnt('aprobada') }, { key: 'rechazada', label: 'Rechazadas', count: cnt('rechazada') }, { key: 'todas', label: 'Todas', count: db.extensions.length }]} /></div>
      {!list.length ? <Empty icon={CalendarClock} title="No hay solicitudes en esta pestaña" text="Los operadores las piden desde el detalle de una rifa en venta." /> :
        list.map(e => <div className="list-row" key={e.id} style={{ alignItems: 'flex-start' }}><CalendarClock size={18} className="subtle" aria-hidden="true" style={{ marginTop: 2 }} />
          <span className="grow"><b>{title(e)}</b> <Badge tone={e.status === 'pendiente' ? 'warn' : e.status === 'aprobada' ? 'ok' : 'err'}>{e.status === 'pendiente' ? `+${days(e.currentDate, e.requestedDate)} días` : e.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}</Badge>
            <small>{coName(db, e.companyId)} · solicitado por {e.by} · {ago(e.createdAt)}</small>
            <small>Fecha original {date(e.originalDate)} · actual {date(e.currentDate)} · propuesta <b>{dateTime(e.requestedDate)}</b></small>
            <small style={{ color: 'var(--ink-2)', marginTop: 4 }}>“{e.reason}”</small>{e.note && e.status !== 'pendiente' && <small>Respuesta: {e.note}</small>}</span>
          {e.status === 'pendiente' && <div className="row" style={{ flexWrap: 'nowrap' }}><Button size="sm" variant="danger" onClick={() => { setRej(e); setNote(''); }}>Rechazar</Button><Button size="sm" variant="success" onClick={() => attempt(() => API.decideExtension(e.id, true), 'Extensión aprobada: la fecha del sorteo cambió')}>Aprobar</Button></div>}</div>)}
    </Card>
    {rej && <Modal title="Rechazar la extensión" onClose={() => setRej(null)} footer={<><Button onClick={() => setRej(null)}>Cancelar</Button><Button variant="danger-solid" onClick={() => attempt(() => API.decideExtension(rej.id, false, note), 'Extensión rechazada') && setRej(null)}>Rechazar</Button></>}><Field label="Motivo" required><Textarea data-autofocus rows={3} value={note} onChange={e => setNote(e.target.value)} /></Field></Modal>}
  </>;
}

/* ---------- Denuncias (llegan desde la página principal) ---------- */
export function Denuncias({ query }) {
  const db = useDB(), [tab, setTab] = useState('abiertas');
  const cnt = k => db.reports.filter(r => r.status === k).length;
  const list = db.reports.filter(r => tab === 'todas' || (tab === 'abiertas' ? ['nueva', 'revision'].includes(r.status) : r.status === tab));
  const open = query.d && db.reports.find(r => r.ref === query.d);
  return <>
    <PageHead title="Denuncias" sub="Las que envía el público desde la página principal de LottoGE" actions={<a className="btn" href="./pagina-principal/#denuncias" target="_blank" rel="noopener"><Flag size={15} />Abrir el formulario público</a>} />
    <Card body={false}>
      <div className="toolbar"><Seg label="Estado" value={tab} onChange={setTab} options={[{ key: 'abiertas', label: 'Abiertas', count: cnt('nueva') + cnt('revision') }, { key: 'resuelta', label: 'Resueltas', count: cnt('resuelta') }, { key: 'descartada', label: 'Descartadas', count: cnt('descartada') }, { key: 'todas', label: 'Todas', count: db.reports.length }]} /></div>
      {!list.length ? <Empty icon={Flag} title="No hay denuncias en esta pestaña" /> :
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Referencia</th><th>Motivo</th><th>Rifa u operador</th><th>Estado</th><th>Recibida</th><th><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>{list.map(r => <tr key={r.ref} className="clickable" onClick={e => e.target.closest('button') || setQuery({ d: r.ref })}><td className="mono"><b>{r.ref}</b></td><td>{r.reason}</td><td>{r.target}<small>{r.anonymous ? 'Anónima' : r.email || 'Sin correo'}</small></td><td><Badge tone={REPORT_STATUS[r.status][1]}>{REPORT_STATUS[r.status][0]}</Badge></td><td className="num">{ago(r.createdAt)}</td><td className="r"><Button size="sm" variant={r.status === 'nueva' ? 'primary' : undefined} onClick={() => setQuery({ d: r.ref })}>Ver</Button></td></tr>)}</tbody></table></div>}
    </Card>
    {open && <ReportDrawer r={open} onClose={() => setQuery({ d: '' })} />}
  </>;
}
function ReportDrawer({ r, onClose }) {
  const db = useDB(), [note, setNote] = useState(''), [ask, setAsk] = useState(null);
  const co = db.companies.find(c => r.target.toLowerCase().includes(c.name.toLowerCase()));
  return <Drawer kicker={`${r.ref} · ${REPORT_STATUS[r.status][0]}`} title={r.reason} onClose={onClose} footer={['nueva', 'revision'].includes(r.status) ? <><Button onClick={() => setAsk('descartada')}>Descartar…</Button><div className="row">{r.status === 'nueva' && <Button onClick={() => attempt(() => API.reportAction(r.ref, 'revision', 'Se tomó la denuncia para revisión.'), 'Denuncia en revisión')}>Pasar a revisión</Button>}<Button variant="success" icon={Check} onClick={() => setAsk('resuelta')}>Resolver…</Button></div></> : null}>
    <dl className="kv kv--left" style={{ gridTemplateColumns: '120px 1fr' }}><dt>Rifa u operador</dt><dd>{r.target}{co && <> · <a href={`#/admin/empresas?e=${co.id}`}>ver empresa</a></>}</dd><dt>Enlace</dt><dd>{r.link || '—'}</dd><dt>Contacto</dt><dd>{r.anonymous ? 'Anónima' : r.email || 'No dejó correo'}</dd><dt>Comprobante</dt><dd>{r.fileName || 'Sin archivo'}</dd><dt>Recibida</dt><dd>{dateTime(r.createdAt)}</dd></dl>
    <div className="note"><FileText size={16} aria-hidden="true" /><div>{r.description}</div></div>
    {co && co.status === 'activa' && <Note tone="warn">La empresa denunciada está activa. Si se confirma, puedes suspenderla desde <a href={`#/admin/empresas?e=${co.id}`}>Empresas</a>.</Note>}
    <div><p className="field__label" style={{ marginBottom: 6 }}>Seguimiento</p>{r.notes.length ? <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>{r.notes.map((n, i) => <li key={i}>{n.text}<br /><small className="subtle">{dateTime(n.at)} · {n.by}</small></li>)}</ol> : <p className="subtle">Sin notas todavía.</p>}</div>
    {['nueva', 'revision'].includes(r.status) && <div className="row" style={{ alignItems: 'flex-end' }}><div className="grow"><Field label="Agregar nota"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej.: se llamó al operador" /></Field></div><Button disabled={!note.trim()} onClick={() => attempt(() => API.reportAction(r.ref, r.status === 'nueva' ? 'revision' : r.status, note), 'Nota agregada') && setNote('')}>Agregar</Button></div>}
    {ask && <ResolveModal r={r} status={ask} onClose={() => setAsk(null)} />}
  </Drawer>;
}
function ResolveModal({ r, status, onClose }) {
  const [t, setT] = useState('');
  return <Modal title={status === 'resuelta' ? `Resolver ${r.ref}` : `Descartar ${r.ref}`} sub={r.email && !r.anonymous ? `Se le avisa a ${r.email}.` : 'La denuncia no tiene correo de contacto.'} onClose={onClose} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant={status === 'resuelta' ? 'success' : 'danger-solid'} onClick={() => attempt(() => API.reportAction(r.ref, status, t), status === 'resuelta' ? 'Denuncia resuelta' : 'Denuncia descartada') && onClose()}>{status === 'resuelta' ? 'Marcar como resuelta' : 'Descartar'}</Button></>}>
    <Field label={status === 'resuelta' ? 'Cómo se resolvió' : 'Por qué se descarta'} required><Textarea data-autofocus rows={3} value={t} onChange={e => setT(e.target.value)} /></Field>
  </Modal>;
}

/* ---------- Facturación ---------- */
export function Cobros() {
  const db = useDB(), [tab, setTab] = useState('pendiente'), [pay, setPay] = useState(null), [m, setM] = useState({ method: 'Transferencia', ref: '' });
  const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
  const list = db.invoices.filter(f => tab === 'todas' || f.status === tab).sort((a, b) => b.dueAt.localeCompare(a.dueAt));
  const late = db.invoices.filter(f => f.status === 'pendiente' && Date.parse(f.dueAt) < Date.now());
  return <>
    <PageHead title="Cobros" sub="Mantenimiento mensual y licencias de las empresas · una sola fuente para Empresas y Facturación" />
    <div className="stats" style={{ marginBottom: 18 }}>
      <Stat label="Cobrado este mes" value={<Count to={db.invoices.filter(f => f.status === 'pagada' && Date.parse(f.paidAt) >= ms.getTime()).reduce((a, f) => a + f.amountUSD, 0)} format={v => usd(v, true)} />} />
      <Stat label="Por cobrar" value={usd(db.invoices.filter(f => f.status === 'pendiente').reduce((a, f) => a + f.amountUSD, 0), true)} sub={plural(db.invoices.filter(f => f.status === 'pendiente').length, 'factura', 'facturas')} />
      <Stat label="Vencidas" value={num(late.length)} sub={late.length ? usd(late.reduce((a, f) => a + f.amountUSD, 0)) : 'Ninguna'} subTone={late.length ? 'err' : ''} />
      <Stat label="Empresas al día" value={`${db.companies.filter(c => c.billing === 'pagado').length} de ${db.companies.filter(c => ['activa', 'suspendida'].includes(c.status)).length}`} />
    </div>
    <Card body={false}>
      <div className="toolbar"><Seg label="Estado" value={tab} onChange={setTab} options={[{ key: 'pendiente', label: 'Pendientes', count: db.invoices.filter(f => f.status === 'pendiente').length }, { key: 'pagada', label: 'Pagadas' }, { key: 'todas', label: 'Todas' }]} /></div>
      {!list.length ? <Empty icon={Receipt} title="No hay facturas en esta pestaña" /> : <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Factura</th><th>Empresa</th><th>Concepto</th><th className="r">Monto</th><th>Vence</th><th>Estado</th><th><span className="sr-only">Acción</span></th></tr></thead>
        <tbody>{list.map(f => { const overdue = f.status === 'pendiente' && Date.parse(f.dueAt) < Date.now(); return <tr key={f.id}><td className="mono">{f.id}</td><td>{coName(db, f.companyId)}</td><td>{f.concept}</td><td className="r num">{usd(f.amountUSD)}</td><td className="num">{date(f.dueAt)}</td>
          <td><Badge tone={f.status === 'pagada' ? 'ok' : overdue ? 'err' : 'warn'}>{f.status === 'pagada' ? 'Pagada' : overdue ? 'Vencida' : 'Pendiente'}</Badge>{f.paidAt && <small>{f.method} · ref. {f.reference}</small>}</td>
          <td className="r">{f.status === 'pendiente' && <Button size="sm" variant="primary" onClick={() => { setPay(f); setM({ method: 'Transferencia', ref: '' }); }}>Registrar pago</Button>}</td></tr>; })}</tbody></table></div>}
    </Card>
    {pay && <Modal title={`Registrar pago · ${pay.id}`} sub={`${coName(db, pay.companyId)} · ${pay.concept} · ${usd(pay.amountUSD)}`} onClose={() => setPay(null)} footer={<><Button onClick={() => setPay(null)}>Cancelar</Button><Button variant="success" onClick={() => attempt(() => API.payInvoice(pay.id, m.method, m.ref), 'Pago registrado') && setPay(null)}>Registrar pago</Button></>}>
      <Field label="Método"><Select value={m.method} onChange={e => setM({ ...m, method: e.target.value })} options={['Transferencia', 'Pago Móvil', 'Zelle', 'Efectivo', 'Binance']} /></Field>
      <Field label="Referencia" required><Input data-autofocus value={m.ref} onChange={e => setM({ ...m, ref: e.target.value })} /></Field></Modal>}
  </>;
}
export function Planes() {
  const db = useDB();
  return <>
    <PageHead title="Planes" sub="Los mismos precios que muestra la página principal" />
    <div className="grid grid--3">{db.plans.map(p => { const n = db.companies.filter(c => c.plan === p.key && c.status === 'activa').length; return <div key={p.key} className={'card lift'} style={{ padding: 22, display: 'grid', gap: 10, ...(p.key === 'Pro' ? { background: 'var(--dark)', color: 'var(--dark-ink)', borderColor: 'transparent' } : {}) }}>
      <div className="row row--between"><b style={{ fontSize: 20 }}>{p.key}</b>{p.key === 'Pro' && <Badge tone="warn" plain>Recomendado</Badge>}</div>
      <b style={{ fontSize: 28, letterSpacing: '-.03em' }}>{p.priceLabel}</b><span style={{ opacity: .75 }}>+ {usd(p.monthly, true)} al mes de mantenimiento</span>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>{p.features.map(f => <li key={f}>{f}</li>)}</ul>
      <span style={{ opacity: .8, fontSize: 13 }}>{plural(n, 'empresa activa', 'empresas activas')} en este plan · rifas de hasta {p.digits} cifras</span></div>; })}</div>
    <p className="subtle" style={{ marginTop: 14 }}>"Ilimitado" se muestra con palabras, nunca como 999999. El plan Free no dice "Gratis": su costo real es el mantenimiento mensual.</p>
  </>;
}

/* ---------- Ajustes de la plataforma ---------- */
export function Plataforma() {
  const db = useDB(), [p, setP] = useState({ ...db.platform }), set = (k, v) => setP({ ...p, [k]: v });
  const dirty = JSON.stringify(p) !== JSON.stringify(db.platform);
  return <>
    <PageHead title="Plataforma" sub="Un solo lugar para el nombre, el contacto y las reglas generales" actions={<Button variant="primary" disabled={!dirty} onClick={() => attempt(() => API.savePlatform(p), 'Configuración guardada')}>Guardar cambios</Button>} />
    <div className="grid grid--2">
      <Card title="Marca y contacto"><div className="form-grid">
        <Field label="Nombre de la plataforma" hint="El mismo en el logo, los correos y las páginas."><Input value={p.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="WhatsApp de ventas"><Input value={p.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Field>
        <Field label="Correo de soporte"><Input type="email" value={p.supportEmail} onChange={e => set('supportEmail', e.target.value)} /></Field>
        <Field label="Correo que recibe las denuncias" hint="Copia de cada denuncia de la página principal."><Input type="email" value={p.reportsEmail} onChange={e => set('reportsEmail', e.target.value)} placeholder="denuncias@…" /></Field>
      </div></Card>
      <Card title="Reglas generales"><div className="form-grid">
        <Field label="Máximo de días de extensión"><Input type="number" min="1" max="60" value={p.maxExtensionDays} onChange={e => set('maxExtensionDays', e.target.value)} /></Field>
        <Field label="Cierre automático (minutos antes del sorteo)" hint="Por defecto: 10 minutos."><Input type="number" min="5" value={p.autoCloseMinutes} onChange={e => set('autoCloseMinutes', e.target.value)} /></Field>
        <Field label="Máximo de boletos por compra"><Input type="number" min="1" value={p.maxTicketsPerOrder} onChange={e => set('maxTicketsPerOrder', e.target.value)} /></Field>
      </div></Card>
    </div>
  </>;
}
export function Loterias() {
  const db = useDB(), [off, setOff] = useState(null);
  return <>
    <PageHead title="Loterías" sub="Catálogo de loterías con las que pueden jugar las rifas" />
    <Card body={false}><div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Lotería</th><th>Horario</th><th>Rifas que la usan</th><th>Activa</th></tr></thead>
      <tbody>{db.lotteries.map(l => <tr key={l.name}><td><b>{l.name}</b></td><td>{l.time}</td><td>{API.allRaffles().filter(r => r.lottery === l.name && ['venta', 'revision'].includes(r.status)).length}</td>
        <td><div className="row"><Toggle checked={l.active} onChange={() => l.active ? setOff(l) : attempt(() => API.toggleLottery(l.name), `${l.name} activada`)} label={`Activar ${l.name}`} /><span className="subtle">{l.active ? 'Sí' : 'No'}</span></div></td></tr>)}</tbody></table></div></Card>
    {off && <Confirm title={`¿Desactivar ${off.name}?`} text="Las rifas nuevas ya no podrán elegirla. Las que ya la usan siguen igual." confirm="Desactivar" danger onClose={() => setOff(null)} onConfirm={() => { attempt(() => API.toggleLottery(off.name), `${off.name} desactivada`); setOff(null); }} />}
  </>;
}
const SROLES = { superadmin: 'Superadministrador', soporte: 'Soporte', auditor: 'Auditoría (solo lectura)' };
export function AdminUsuarios() {
  const db = useDB(), [inv, setInv] = useState(null);
  return <>
    <PageHead title="Usuarios de la plataforma" sub="Equipo de LottoGE con acceso al superadministrador" actions={<Button variant="primary" icon={Plus} onClick={() => setInv({ name: '', email: '', role: 'soporte' })}>Invitar usuario</Button>} />
    <Card body={false}><div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Usuario</th><th>Rol</th><th>Último acceso</th><th>Estado</th></tr></thead>
      <tbody>{db.staff.map(u => <tr key={u.id}><td><b>{u.name || 'Invitación pendiente'}</b><small>{u.email}</small></td><td>{SROLES[u.role]}</td><td>{u.lastAt ? ago(u.lastAt) : 'Nunca'}</td><td><Badge tone={u.status === 'activo' ? 'ok' : 'warn'}>{u.status === 'activo' ? 'Activo' : 'Invitación enviada'}</Badge></td></tr>)}</tbody></table></div></Card>
    {inv && <Modal title="Invitar usuario" sub="Le llega un correo para crear su contraseña." onClose={() => setInv(null)} footer={<><Button onClick={() => setInv(null)}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.inviteStaff(inv.name, inv.email, inv.role), 'Invitación enviada') && setInv(null)}>Enviar invitación</Button></>}>
      <Field label="Correo" required><Input type="email" data-autofocus autoComplete="off" value={inv.email} onChange={e => setInv({ ...inv, email: e.target.value })} /></Field>
      <Field label="Nombre"><Input autoComplete="off" value={inv.name} onChange={e => setInv({ ...inv, name: e.target.value })} /></Field>
      <Field label="Rol"><Select value={inv.role} onChange={e => setInv({ ...inv, role: e.target.value })} options={Object.entries(SROLES)} /></Field></Modal>}
  </>;
}
export function Notas() {
  const db = useDB(), [f, setF] = useState({ title: '', body: '' });
  return <>
    <PageHead title="Notas de versión" sub="Avisos que ven los operadores al entrar a su panel" />
    <div className="grid grid--side">
      <Card body={false}>{db.releaseNotes.length ? db.releaseNotes.map(n => <div className="list-row" key={n.id} style={{ alignItems: 'flex-start' }}><span className="grow"><b>{n.title}</b><small>{date(n.at)}</small><p className="muted" style={{ marginTop: 4 }}>{n.body}</p></span></div>) : <Empty title="No hay notas de versión aún" />}</Card>
      <Card title="Nueva nota"><div style={{ display: 'grid', gap: 12 }}><Field label="Título" required><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field><Field label="Texto" required><Textarea rows={4} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></Field>
        <Button variant="primary" onClick={() => attempt(() => API.addReleaseNote(f.title, f.body), 'Nota publicada') && setF({ title: '', body: '' })}>Publicar</Button></div></Card>
    </div>
  </>;
}
export function AdminSeguridad() {
  const [f, setF] = useState({ current: '', next: '', again: '' }), [err, setErr] = useState({});
  const rules = [['8 caracteres o más', f.next.length >= 8], ['Una mayúscula', /[A-Z]/.test(f.next)], ['Un número', /\d/.test(f.next)], ['Un símbolo', /[^A-Za-z0-9]/.test(f.next)], ['Las dos coinciden', f.next && f.next === f.again]];
  const save = e => { e.preventDefault(); try { API.changeAdminPassword(f.current, f.next); setF({ current: '', next: '', again: '' }); setErr({}); toast('Contraseña cambiada'); } catch (x) { setErr(x.fields || {}); toast(x.message, 'err'); } };
  return <>
    <PageHead title="Seguridad" sub="Contraseña de la cuenta de superadministrador" />
    <Card title="Cambiar contraseña"><form onSubmit={save} style={{ display: 'grid', gap: 14, maxWidth: 460 }} noValidate>
      <input type="text" name="username" autoComplete="username" value="admin@lottoge.net" readOnly hidden />
      <Field label="Contraseña actual" required error={err.current} hint="En este entorno: Admin2026! (si no la cambiaste)."><Input type="password" autoComplete="current-password" value={f.current} onChange={e => setF({ ...f, current: e.target.value })} /></Field>
      <Field label="Nueva contraseña" required><Input type="password" autoComplete="new-password" value={f.next} onChange={e => setF({ ...f, next: e.target.value })} /></Field>
      <Field label="Repite la nueva contraseña" required><Input type="password" autoComplete="new-password" value={f.again} onChange={e => setF({ ...f, again: e.target.value })} /></Field>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>{rules.map(([t, ok]) => <li key={t} className={ok ? 'ok-text' : 'muted'} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>{ok ? <Check size={14} /> : <Clock size={14} />}{t}</li>)}</ul>
      <div><Button type="submit" variant="primary" disabled={!rules.every(r => r[1]) || !f.current}>Cambiar contraseña</Button></div>
    </form></Card>
  </>;
}

/* ---------- Editar una rifa (en venta o esperando aprobación) ---------- */
const FIELD_LABEL = { title: 'Título', prize: 'Premio principal', lottery: 'Lotería', drawAt: 'Fecha del sorteo', closeMinutes: 'Cierre de ventas', priceUSD: 'Precio', total: 'Cantidad de números', rules: 'Reglas', solvencyDoc: 'Solvencia', reason: 'Motivo' };
const normalize = d => ({ ...d, title: String(d.title || ''), prizes: d.prizes.map(x => String(x || '').trim()), rules: d.rules.map(x => String(x || '').trim()).filter(Boolean), promotions: d.promotions.filter(p => p.qty || p.priceUSD).map(p => ({ qty: +p.qty, priceUSD: +p.priceUSD })) });
export function EditarRifa({ query }) {
  const db = useDB(), info = API.raffleForEdit(query.r);
  const [d, setD] = useState(() => info && JSON.parse(JSON.stringify(info.data)));
  const [reason, setReason] = useState(''), [errors, setErrors] = useState({}), [confirm, setConfirm] = useState(false);
  if (!info) return <Card><Empty title="Esta rifa no existe" action={<LinkButton href="#/admin/rifas">Volver a las rifas</LinkButton>} /></Card>;
  const back = `#/admin/rifas/detalle?r=${info.id}`;
  if (!info.editable) return <><PageHead crumbs={<><a href="#/admin/rifas">Rifas</a><span aria-hidden="true">›</span><span>{info.data.title}</span></>} title={info.data.title} /><Note tone="warn">Esta rifa está {STATE_LABEL[info.status].toLowerCase()}: solo se editan las rifas en venta o esperando aprobación.</Note></>;
  const set = (k, v) => setD(x => ({ ...x, [k]: v }));
  const validDate = !isNaN(Date.parse(d.drawAt));
  const diff = API.raffleDiff(info.data, normalize({ ...d, drawAt: validDate ? d.drawAt : info.data.drawAt }));
  const priceChanged = +d.priceUSD !== +info.data.priceUSD, dateChanged = validDate && Date.parse(d.drawAt) !== Date.parse(info.data.drawAt);
  const closeAt = validDate ? new Date(Date.parse(d.drawAt) - (+d.closeMinutes || 10) * 60e3) : null;
  const save = () => {
    try { const out = API.superEditRaffle(info.id, d, reason); setConfirm(false); toast(`Rifa actualizada: ${plural(out.length, 'cambio', 'cambios')}. La empresa ya lo ve.`); go('/admin/rifas/detalle', { r: info.id }); }
    catch (e) { setConfirm(false); if (e.fields) { setErrors(e.fields); setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0); } toast(e.message, 'err'); }
  };
  const errList = Object.keys(errors);
  return <>
    <PageHead crumbs={<><a href="#/admin/rifas">Rifas</a><span aria-hidden="true">›</span><a href={back}>{info.data.title}</a><span aria-hidden="true">›</span><span>Editar</span></>}
      title={<span className="row" style={{ gap: 12 }}>Editar rifa<Badge tone={RAFFLE_TONE[info.status]}>{STATE_LABEL[info.status]}</Badge></span>}
      sub={`${coName(db, info.companyId)} · ${info.id}${info.sales ? ` · ${plural(info.sales, 'boleto vendido o reservado', 'boletos vendidos o reservados')}` : ' · sin ventas todavía'}`}
      actions={<><LinkButton href={back}>Cancelar</LinkButton><Button variant="primary" icon={Check} disabled={!diff.length} onClick={() => { setErrors({}); setConfirm(true); }}>Guardar cambios</Button></>} />
    {errList.length > 0 && <div style={{ marginBottom: 16 }}><Note tone="err" role="alert"><b>Revisa {errList.length === 1 ? 'el campo marcado' : 'los campos marcados'}:</b> {errList.map(k => FIELD_LABEL[k] || 'Promoción').join(', ')}.</Note></div>}
    <div className="grid grid--side">
      <div className="stack">
        <Card title="Sorteo y premios"><div className="form-grid">
          <Field label="Título de la rifa" required error={errors.title} className="full"><Input value={d.title} onChange={e => set('title', e.target.value)} maxLength={80} /></Field>
          {[0, 1, 2].map(i => <Field key={i} label={`${i + 1}º premio${i ? ' (opcional)' : ''}`} required={!i} error={!i ? errors.prize : undefined}><Input value={d.prizes[i] || ''} onChange={e => set('prizes', d.prizes.map((x, j) => j === i ? e.target.value : x))} /></Field>)}
          <Field label="Lotería que define el ganador" required error={errors.lottery}><Select value={d.lottery} onChange={e => set('lottery', e.target.value)} options={db.lotteries.filter(l => l.active || l.name === info.data.lottery).map(l => [l.name, `${l.name} · ${l.time}`])} /></Field>
          <Field label="Fecha y hora del sorteo" required error={errors.drawAt} hint={info.originalDrawAt ? `Hora de Venezuela. Fecha original: ${dateTime(info.originalDrawAt)}.` : 'Hora de Venezuela.'}><Input type="datetime-local" value={toLocalInput(d.drawAt)} onChange={e => set('drawAt', fromLocalInput(e.target.value))} /></Field>
          <Field label="Cierre de ventas" error={errors.closeMinutes} hint={closeAt ? `Cierra el ${dateTime(closeAt)}` : ''}><Select value={d.closeMinutes} onChange={e => set('closeMinutes', +e.target.value)} options={[[10, '10 minutos antes del sorteo'], [30, '30 minutos antes'], [60, '1 hora antes'], [180, '3 horas antes']]} /></Field>
          <Field label="Descripción" className="full"><Textarea rows={3} value={d.description} onChange={e => set('description', e.target.value)} /></Field>
        </div></Card>
        <Card title="Boletos y precio"><div className="form-grid">
          <Field label="Precio por boleto" required error={errors.priceUSD} hint={+d.priceUSD > 0 ? `${bs(d.priceUSD * API.rate())} con la tasa de hoy.` : ''}><div className="input-affix"><Input type="number" min="0.5" step="0.5" inputMode="decimal" value={d.priceUSD} onChange={e => set('priceUSD', e.target.value)} /><span>US$</span></div></Field>
          <Field label="Cantidad de números" required error={errors.total} hint={info.sales ? 'Bloqueado: ya hay boletos vendidos o reservados.' : 'Se puede cambiar porque todavía no hay ventas.'}><Select value={d.total} disabled={info.sales > 0} onChange={e => set('total', +e.target.value)} options={[[100, '100 números (2 cifras)'], [1000, '1.000 números (3 cifras)'], [10000, '10.000 números (4 cifras)']]} /></Field>
          <div className="full field"><span className="field__label">Promociones por volumen</span>
            {d.promotions.map((p, i) => <div key={i} className="row"><Input type="number" min="2" style={{ width: 100 }} aria-label="Cantidad de boletos" value={p.qty} onChange={e => set('promotions', d.promotions.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} /><span>boletos por</span><div className="input-affix" style={{ width: 130 }}><Input type="number" min="1" aria-label="Precio de la promoción" value={p.priceUSD} onChange={e => set('promotions', d.promotions.map((x, j) => j === i ? { ...x, priceUSD: e.target.value } : x))} /><span>US$</span></div><Button size="sm" variant="ghost" icon={Trash2} onClick={() => set('promotions', d.promotions.filter((_, j) => j !== i))}>Quitar</Button>{errors['promo' + i] && <p className="error">{errors['promo' + i]}</p>}</div>)}
            <div><Button size="sm" icon={Plus} onClick={() => set('promotions', [...d.promotions, { qty: 5, priceUSD: Math.max(1, (+d.priceUSD || 1) * 4.5) }])}>Agregar promoción</Button></div></div>
          {priceChanged && info.sales > 0 && <div className="full"><Note tone="info" icon={Info}>Las compras ya hechas mantienen el precio con que se pagaron. El nuevo precio aplica a las compras nuevas.</Note></div>}
        </div></Card>
        <Card title="Reglas y documentos"><div style={{ display: 'grid', gap: 14 }}>
          <div className="field"><span className="field__label">Reglas y condiciones<span className="req">*</span></span>
            {d.rules.map((x, i) => <div key={i} className="row" style={{ flexWrap: 'nowrap' }}><span className="subtle num" style={{ width: 18 }}>{i + 1}.</span><Input style={{ flex: 1 }} aria-label={`Regla ${i + 1}`} aria-invalid={errors.rules ? 'true' : undefined} value={x} onChange={e => set('rules', d.rules.map((y, j) => j === i ? e.target.value : y))} />{d.rules.length > 1 && <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Quitar regla ${i + 1}`} onClick={() => set('rules', d.rules.filter((_, j) => j !== i))} />}</div>)}
            {errors.rules && <p className="error"><AlertTriangle size={13} />{errors.rules}</p>}
            <div><Button size="sm" icon={Plus} onClick={() => set('rules', [...d.rules, ''])}>Agregar regla</Button></div></div>
          <div className="field"><span className="field__label">Documento de solvencia del premio<span className="req">*</span></span>
            {d.solvencyDoc ? <div className="row"><Badge tone="ok">{d.solvencyDoc}</Badge><Button size="sm" variant="ghost" onClick={() => set('solvencyDoc', '')}>Cambiar</Button></div> : <FileDrop accept="application/pdf,image/*" error={errors.solvencyDoc} label="Sube el documento (PDF o foto)" onFile={f => set('solvencyDoc', f.name)} />}
            {errors.solvencyDoc && <p className="error"><AlertTriangle size={13} />{errors.solvencyDoc}</p>}</div>
        </div></Card>
        <Card title="Imágenes"><div className="row" style={{ alignItems: 'flex-start' }}>
          {d.images.map((src, i) => <div key={i} style={{ width: 150 }}><Thumb raffle={{ title: d.title, images: [src] }} lg /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => set('images', d.images.filter((_, j) => j !== i))}>Quitar</Button></div>)}
          {d.images.length < 4 && <div style={{ width: 170 }}><FileDrop label="Agregar foto" hint="JPG, PNG o WebP · máx. 5 MB" onFile={f => readImage(f).then(src => set('images', [...d.images, src]), e => toast(e.message, 'err'))} /></div>}
        </div>{!d.images.length && <p className="hint" style={{ marginTop: 8 }}>Sin imágenes, la página de venta usa una de muestra.</p>}</Card>
      </div>
      <div className="stack" style={{ position: 'sticky', top: 140 }}>
        <Card title={diff.length ? `Cambios (${diff.length})` : 'Cambios'} body={false}>
          {diff.length ? diff.map((x, i) => <div key={i} className="list-row" style={{ padding: '9px 18px' }}><Pencil size={14} className="brand-text" aria-hidden="true" /><span className="grow" style={{ fontSize: 13 }}>{x}</span></div>) : <div className="card__body"><p className="subtle">Todavía no cambiaste nada. Lo que modifiques aparece aquí, con el valor anterior y el nuevo.</p></div>}
          <div className="card__body" style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)' }}>
            {dateChanged && <Note tone="warn" icon={CalendarClock}>Cambias la fecha del sorteo. La empresa y la página de venta muestran la nueva; la original queda guardada.</Note>}
            <Field label="Motivo del cambio" required error={errors.reason} hint="Le llega a la empresa y queda en la Actividad."><Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej.: corrección pedida por el operador" /></Field>
            <Button variant="primary" block icon={Check} disabled={!diff.length} onClick={() => { setErrors({}); setConfirm(true); }}>Guardar cambios</Button>
          </div>
        </Card>
        {info.changes.length > 0 && <Card title="Ediciones anteriores" body={false}>{info.changes.slice(0, 4).map((c, i) => <div key={i} className="list-row" style={{ alignItems: 'flex-start' }}><History size={15} className="subtle" aria-hidden="true" style={{ marginTop: 2 }} /><span className="grow"><b style={{ fontSize: 13 }}>{dateTime(c.at)}</b><small>{c.diff.join('; ')}</small><small>Motivo: {c.reason}</small></span></div>)}</Card>}
      </div>
    </div>
    {confirm && <Modal title="¿Guardar los cambios?" sub={`${info.data.title} · ${coName(db, info.companyId)}`} onClose={() => setConfirm(false)} footer={<><Button onClick={() => setConfirm(false)}>Seguir editando</Button><Button variant="primary" onClick={save}>Guardar {plural(diff.length, 'cambio', 'cambios')}</Button></>}>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>{diff.map((x, i) => <li key={i}>{x}</li>)}</ul>
      {!reason.trim() && <Note tone="warn">Falta el motivo: escríbelo antes de guardar.</Note>}
    </Modal>}
  </>;
}

/* ---------- Registrar empresa (la planilla de registro, basada en /register-company de la plataforma original) ---------- */
const REG_STEPS = ['Plan', 'Datos de la empresa', 'Administrador', 'Revisar y registrar'];
const REG_BLANK = { plan: 'Basic', personType: 'juridica', name: '', legalName: '', rifType: 'J', rifNumber: '', rifCheck: '', runlot: '', phone: '', email: '', state: '', municipality: '', address: '', description: '', docs: {}, adminName: '', adminIdType: 'V', adminCedula: '', adminEmail: '', adminPhone: '', terms: false, approveNow: false };
const REG_LABEL = { plan: 'Plan', personType: 'Tipo de persona', name: 'Nombre comercial', legalName: 'Razón social', rif: 'RIF', runlot: 'RUN/LOT', phone: 'Teléfono', email: 'Correo', state: 'Estado', municipality: 'Municipio', address: 'Dirección', cedulaDoc: 'Cédula de identidad', rifDoc: 'RIF', acta: 'Acta Constitutiva', adminName: 'Nombre del administrador', adminCedula: 'Cédula', adminEmail: 'Correo del administrador', adminPhone: 'Teléfono del administrador', terms: 'Términos' };
const RIF_FOR = { juridica: ['J'], natural: ['V', 'E'], gubernamental: ['G'] };
export function RegistrarEmpresa() {
  const db = useDB(), [d, setD] = useState({ ...REG_BLANK }), [step, setStep] = useState(0), [touched, setTouched] = useState({}), [shown, setShown] = useState({});
  const live = API.validateCompany(d, step + 1);
  const err = k => (shown[k] || touched[k]) ? live[k] : undefined;
  const set = (k, v) => setD(x => { const n = { ...x, [k]: v }; if (k === 'personType') { n.rifType = RIF_FOR[v][0]; if (v !== 'juridica') n.docs = { ...n.docs, acta: '' }; } if (k === 'state') n.municipality = ''; return n; });
  const sub = API.freeSubdomain(d.name);
  const blur = k => () => setTouched(t => ({ ...t, [k]: true }));
  const next = () => {
    const e = API.validateCompany(d, step + 1);
    if (Object.keys(e).length) { setShown(Object.fromEntries(Object.keys(e).map(k => [k, true]))); setTimeout(() => { const el = document.querySelector('main [aria-invalid="true"]'); el && (el.matches('input,select,textarea,[tabindex]') ? el : el.querySelector('input,select,textarea'))?.focus(); }, 0); return; }
    setShown({}); setStep(step + 1); scrollTo(0, 0);
  };
  const submit = () => {
    try { const c = API.registerCompany(d); confetti(); toast(c.status === 'activa' ? `${c.name} registrada y aprobada. Invitación enviada a ${c.admin.email}` : `${c.name} registrada: queda pendiente de revisión. Invitación enviada a ${c.admin.email}`); go('/admin/empresas', { e: c.id }); }
    catch (e) { if (e.fields) { const order = [['plan'], ['personType', 'name', 'legalName', 'rif', 'runlot', 'phone', 'email', 'state', 'municipality', 'address', 'cedulaDoc', 'rifDoc', 'acta'], ['adminName', 'adminCedula', 'adminEmail', 'adminPhone'], ['terms']]; const st = order.findIndex(g => g.some(k => e.fields[k])); setShown(Object.fromEntries(Object.keys(e.fields).map(k => [k, true]))); if (st >= 0) setStep(st); } toast(e.message, 'err'); }
  };
  const errs = Object.keys(live).filter(k => shown[k]);
  const plan = db.plans.find(p => p.key === d.plan);
  const DOC_ERR = { cedula: 'cedulaDoc', rif: 'rifDoc', acta: 'acta' };
  const docField = (key, label, hint, drop, pdfOnly) => <div className="field"><span className="field__label">{label}<span className="req">*</span></span>
    {d.docs[key] ? <div className="row"><Badge tone="ok">{d.docs[key]}</Badge><Button size="sm" variant="ghost" onClick={() => set('docs', { ...d.docs, [key]: '' })}>Cambiar</Button></div>
      : <FileDrop accept={pdfOnly ? 'application/pdf' : 'application/pdf,image/jpeg,image/png'} error={err(DOC_ERR[key])} label={`Sube ${drop}`} hint={hint} onFile={f => { const okType = /\.pdf$/i.test(f.name) || (!pdfOnly && /\.(jpe?g|png)$/i.test(f.name)); if (!okType) return toast(pdfOnly ? 'Solo se acepta PDF' : 'Usa PDF, JPG o PNG', 'err'); if (f.size > 10 * 1024 * 1024) return toast('El archivo pesa más de 10 MB', 'err'); set('docs', { ...d.docs, [key]: f.name }); }} />}
    {err(DOC_ERR[key]) && <p className="error"><AlertTriangle size={13} />{err(DOC_ERR[key])}</p>}</div>;
  return <>
    <PageHead crumbs={<><a href="#/admin/empresas">Empresas</a><span aria-hidden="true">›</span><span>Registrar empresa</span></>} title="Registrar empresa" sub="Planilla de registro de operadores de rifas. Al registrarla queda pendiente de revisión, salvo que la apruebes en el último paso." />
    <Steps steps={REG_STEPS} current={step} />
    {errs.length > 0 && <div style={{ marginBottom: 16 }}><Note tone="err" role="alert"><b>{plural(errs.length, 'campo por corregir', 'campos por corregir')}:</b> {errs.map(k => REG_LABEL[k] || k).join(', ')}.</Note></div>}
    <div className="grid grid--side">
      <Card body={false}>
        <form className="card__body" style={{ display: 'grid', gap: 16 }} autoComplete="off" noValidate onSubmit={e => { e.preventDefault(); step < 3 ? next() : submit(); }}>
          {step === 0 && <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="field__label" style={{ marginBottom: 10 }}>Elige el plan<span className="req">*</span></legend>
            <div className="grid grid--3" role="radiogroup" aria-label="Plan">{db.plans.map(p => <button key={p.key} type="button" role="radio" aria-checked={d.plan === p.key} aria-pressed={d.plan === p.key} className="tpl lift" style={{ padding: 18, gap: 8 }} onClick={() => set('plan', p.key)}>
              <b style={{ fontSize: 17 }}>{p.key}{p.key === 'Pro' && <Badge tone="warn" plain>Recomendado</Badge>}</b><b style={{ fontSize: 22 }}>{p.priceLabel}</b><small>+ {usd(p.monthly, true)} al mes de mantenimiento</small>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: 'var(--ink-2)', fontSize: 13, display: 'grid', gap: 3 }}>{p.features.map(f => <li key={f}>{f}</li>)}</ul></button>)}</div></fieldset>}
          {step === 1 && <>
            <div className="field"><span className="field__label">Tipo de persona<span className="req">*</span></span><Seg label="Tipo de persona" value={d.personType} onChange={v => set('personType', v)} options={[{ key: 'juridica', label: 'Jurídica (empresa)' }, { key: 'natural', label: 'Natural (firma personal)' }, { key: 'gubernamental', label: 'Gubernamental' }]} /></div>
            <div className="form-grid">
              <Field label="Nombre comercial" required error={err('name')} hint="Como lo verán los compradores."><Input value={d.name} onChange={e => set('name', e.target.value)} onBlur={blur('name')} maxLength={60} placeholder="Rifas Los Andes" /></Field>
              <Field label={d.personType === 'juridica' ? 'Razón social' : 'Nombre completo del titular'} required={d.personType === 'juridica'} error={err('legalName')}><Input value={d.legalName} onChange={e => set('legalName', e.target.value)} onBlur={blur('legalName')} placeholder={d.personType === 'juridica' ? 'Inversiones Los Andes, C.A.' : ''} /></Field>
              <Field label="RIF" required error={err('rif')} hint="Letra, 8 números y el dígito final."><div className="row" style={{ flexWrap: 'nowrap' }}><select className="select" style={{ width: 72 }} aria-label="Letra del RIF" value={d.rifType} onChange={e => set('rifType', e.target.value)}>{RIF_FOR[d.personType].map(x => <option key={x}>{x}</option>)}</select><Input inputMode="numeric" aria-label="Número del RIF" value={d.rifNumber} onChange={e => set('rifNumber', e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={blur('rif')} placeholder="50123456" /><Input inputMode="numeric" aria-label="Dígito final del RIF" style={{ width: 58 }} value={d.rifCheck} onChange={e => set('rifCheck', e.target.value.replace(/\D/g, '').slice(0, 1))} onBlur={blur('rif')} placeholder="7" /></div></Field>
              <Field label="RUN/LOT (CONALOT)" error={err('runlot')} hint="Si ya lo tiene. Si no, se asigna al aprobar."><Input value={d.runlot} onChange={e => set('runlot', e.target.value.toUpperCase())} onBlur={blur('runlot')} placeholder="CNL-ORF-2026-000123" /></Field>
              <Field label="Teléfono" required error={err('phone')}><Input type="tel" value={d.phone} onChange={e => set('phone', e.target.value)} onBlur={blur('phone')} placeholder="0274-555-0142" /></Field>
              <Field label="Correo de la empresa" required error={err('email')}><Input type="email" name="company-email" autoComplete="off" value={d.email} onChange={e => set('email', e.target.value)} onBlur={blur('email')} placeholder="contacto@empresa.com" /></Field>
              <Field label="Estado" required error={err('state')}><Select value={d.state} onChange={e => set('state', e.target.value)} onBlur={blur('state')} placeholder="Elige el estado" options={Object.keys(STATES)} /></Field>
              <Field label="Municipio" required error={err('municipality')}><Select value={d.municipality} disabled={!d.state} onChange={e => set('municipality', e.target.value)} onBlur={blur('municipality')} placeholder={d.state ? 'Elige el municipio' : 'Primero elige el estado'} options={STATES[d.state] || []} /></Field>
              <Field label="Dirección" required error={err('address')} className="full"><Input value={d.address} onChange={e => set('address', e.target.value)} onBlur={blur('address')} placeholder="Av. Los Próceres, C.C. Las Tapias, local 4" /></Field>
              <Field label="Descripción (opcional)" className="full"><Textarea rows={2} value={d.description} onChange={e => set('description', e.target.value)} placeholder="Qué rifas hace y dónde opera" /></Field>
              <p className="hint full" style={{ margin: 0 }}>Su página será <b className="mono">{sub}.lottoge.net</b> (se genera sola con el nombre).</p>
            </div>
            <div className="form-grid">{docField('cedula', d.personType === 'juridica' ? 'Cédula de identidad del representante' : 'Cédula de identidad', 'PDF, JPG o PNG · hasta 10 MB', 'la cédula de identidad')}{docField('rif', 'RIF', 'PDF, JPG o PNG · hasta 10 MB', 'el RIF')}{d.personType === 'juridica' && docField('acta', 'Acta Constitutiva', 'Obligatoria para persona jurídica · PDF de hasta 10 MB', 'el Acta Constitutiva (PDF)', true)}</div>
          </>}
          {step === 2 && <>
            <Note tone="info" icon={Mail}>A esta persona le llega una invitación por correo para crear su propia contraseña y entrar al panel del operador. Nadie escribe la contraseña por ella.</Note>
            <div className="form-grid">
              <Field label="Nombre y apellido" required error={err('adminName')}><Input name="admin-name" autoComplete="off" value={d.adminName} onChange={e => set('adminName', e.target.value)} onBlur={blur('adminName')} /></Field>
              <Field label="Cédula" required error={err('adminCedula')} hint="Solo números, de 6 a 8 dígitos."><div className="row" style={{ flexWrap: 'nowrap' }}><select className="select" style={{ width: 70 }} aria-label="Tipo de cédula" value={d.adminIdType} onChange={e => set('adminIdType', e.target.value)}>{['V', 'E'].map(x => <option key={x}>{x}</option>)}</select><Input inputMode="numeric" autoComplete="off" value={d.adminCedula} onChange={e => set('adminCedula', e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={blur('adminCedula')} placeholder="18456732" /></div></Field>
              <Field label="Correo del administrador" required error={err('adminEmail')} hint="A este correo le llega la invitación."><Input type="email" name="admin-invite-email" autoComplete="off" value={d.adminEmail} onChange={e => set('adminEmail', e.target.value)} onBlur={blur('adminEmail')} /></Field>
              <Field label="Teléfono (opcional)" error={err('adminPhone')}><Input type="tel" autoComplete="off" value={d.adminPhone} onChange={e => set('adminPhone', e.target.value)} onBlur={blur('adminPhone')} placeholder="0412-555-0199" /></Field>
            </div>
          </>}
          {step === 3 && <>
            <dl className="kv kv--left" style={{ gridTemplateColumns: '170px 1fr' }}>
              <dt>Plan</dt><dd>{d.plan} · {plan.priceLabel} + {usd(plan.monthly, true)} al mes</dd>
              <dt>Empresa</dt><dd>{d.name}{d.legalName ? ` · ${d.legalName}` : ''}</dd>
              <dt>RIF</dt><dd>{d.rifType}-{d.rifNumber}-{d.rifCheck}</dd><dt>RUN/LOT</dt><dd>{d.runlot || 'Se asigna al aprobar'}</dd>
              <dt>Contacto</dt><dd>{d.phone} · {d.email}</dd><dt>Ubicación</dt><dd>{d.address}, {d.municipality}, {d.state}</dd>
              <dt>Página</dt><dd className="mono">{sub}.lottoge.net</dd>
              <dt>Documentos</dt><dd>{['cedula', 'rif', 'acta'].filter(k => d.docs[k]).map(k => d.docs[k]).join(' · ')}</dd>
              <dt>Administrador</dt><dd>{d.adminName} · {d.adminIdType}-{d.adminCedula} · {d.adminEmail}</dd>
            </dl>
            <Check2 checked={d.terms} onChange={v => set('terms', v)}>La empresa acepta los <a href="./pagina-principal/" target="_blank" rel="noopener">términos y condiciones de LottoGE</a> y declara que los datos son ciertos.</Check2>
            {err('terms') && <p className="error"><AlertTriangle size={13} />{err('terms')}</p>}
            <Check2 checked={d.approveNow} onChange={v => set('approveNow', v)}>Aprobar la empresa de una vez (ya revisé sus documentos). Si no, queda en Empresas › Pendientes.</Check2>
          </>}
          <div className="row row--between" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            {step > 0 ? <Button onClick={() => { setShown({}); setStep(step - 1); }}>Atrás</Button> : <LinkButton href="#/admin/empresas">Cancelar</LinkButton>}
            {step < 3 ? <Button type="submit" variant="primary">Siguiente: {REG_STEPS[step + 1].toLowerCase()}</Button> : <Button type="submit" variant="primary" icon={Check}>{d.approveNow ? 'Registrar y aprobar' : 'Registrar empresa'}</Button>}
          </div>
        </form>
      </Card>
      <Card title="Lo que se pide" body={false}>
        {[['Plan elegido', !!d.plan], ['Nombre y RIF válidos', d.name.trim().length >= 3 && /^\d{8}$/.test(d.rifNumber) && /^\d$/.test(d.rifCheck)], ['Contacto y ubicación', !!(d.phone && d.email && d.municipality && d.address)], ['Cédula de identidad', !!d.docs.cedula], ['RIF', !!d.docs.rif], ...(d.personType === 'juridica' ? [['Acta Constitutiva', !!d.docs.acta]] : []), ['Administrador', !!(d.adminName && d.adminCedula && d.adminEmail)], ['Términos aceptados', d.terms]].map(([l, ok]) => <div key={l} className="list-row" style={{ padding: '10px 18px' }}>{ok ? <Check size={15} className="ok-text" aria-label="Listo" /> : <Clock size={15} className="subtle" aria-label="Pendiente" />}<span className={ok ? 'ok-text' : 'muted'}>{l}</span></div>)}
        <div className="card__body"><p className="subtle">Los datos se validan al salir de cada campo y otra vez al registrar. No se repiten RIF, correo ni RUN/LOT; el subdominio se genera solo y nunca se repite.</p></div>
      </Card>
    </div>
  </>;
}

/* ---------- Detalle de la rifa: configuración, promociones y cada boleto ---------- */
const NUM_STATUS = { vendido: ['Vendido', 'ok'], apartado: ['Apartado', 'warn'], disponible: ['Disponible', 'muted'] };
export function AdminRifaDetalle({ query }) {
  const db = useDB(), all = API.allRaffles(), r = all.find(x => x.id === query.r), tab = query.tab || 'boletos';
  const [rej, setRej] = useState(false), [reason, setReason] = useState('');
  if (!r) return <Card><Empty title="Esta rifa no existe" action={<LinkButton href="#/admin/rifas">Volver a las rifas</LinkButton>} /></Card>;
  const info = API.raffleForEdit(r.id), N = API.numbersOf(r.id);
  const c = { vendido: 0, apartado: 0, disponible: 0 }; N.list.forEach(x => c[x.status]++);
  const st = r.live ? API.raffleStats(r.id) : null, randomPend = st ? st.reserved - c.apartado : 0;
  const decide = ok => { if (attempt(() => API.superRaffleDecide(r.id, ok, reason), ok ? 'Rifa aprobada: ya está en venta' : 'Rifa rechazada')) { if (ok) confetti(); setRej(false); } };
  return <>
    <nav className="crumbs crumbs--top" aria-label="Ruta"><a href="#/admin/rifas">Rifas</a><span aria-hidden="true">›</span><span>{r.title}</span></nav>
    <RaffleHero r={{ ...r, prizes: info.data.prizes }} state={r.status} sold={c.vendido} kicker={coName(db, r.companyId)}
      figures={[['Apartados', num(c.apartado) + (randomPend > 0 ? ` + ${randomPend} al azar` : ''), c.apartado ? 'sun' : ''], ['Disponibles', num(c.disponible), 'sky'], ...(st ? [['Recaudado', usd(st.revenueUSD, true), 'teal']] : [])]}
      actions={<>{r.status === 'revision' && <><Button variant="success" size="lg" icon={Check} onClick={() => decide(true)}>Aprobar rifa</Button><Button variant="danger" size="lg" onClick={() => setRej(true)}>Rechazar…</Button></>}{info.editable && <LinkButton size="lg" icon={Pencil} href={`#/admin/rifas/editar?r=${r.id}`}>Editar rifa</LinkButton>}</>} />
    <div className="tabs" role="tablist" aria-label="Secciones de la rifa">{[['boletos', `Boletos (${num(r.total)})`], ['config', 'Resumen'], ['promos', `Promociones (${(info.data.promotions || []).length})`]].map(([k, l]) => <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setQuery({ tab: k })}>{l}</button>)}</div>
    {tab === 'boletos' && <TicketBoard key={r.id} r={r} N={N} counts={c} />}
    {tab === 'promos' && <Card title="Promociones por volumen" actions={info.editable && <LinkButton size="sm" icon={Pencil} href={`#/admin/rifas/editar?r=${r.id}`}>Editar promociones</LinkButton>} body={false}>
      {(info.data.promotions || []).length ? <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Promoción</th><th className="r">Precio</th><th className="r">Sueltos costarían</th><th className="r">Ahorro</th></tr></thead>
        <tbody>{info.data.promotions.map((p, i) => <tr key={i}><td><b>{p.qty} boletos</b></td><td className="r num">{usd(p.priceUSD)}</td><td className="r num">{usd(p.qty * r.priceUSD)}</td><td className="r num ok-text">{usd(p.qty * r.priceUSD - p.priceUSD)} ({Math.round((1 - p.priceUSD / (p.qty * r.priceUSD)) * 100)} %)</td></tr>)}</tbody></table></div>
        : <Empty title="Esta rifa no tiene promociones" text={info.editable ? 'Puedes agregarlas desde "Editar promociones".' : ''} />}
    </Card>}
    {tab === 'config' && <div className="rsum">
      <RaffleFacts r={r} closeMinutes={info.data.closeMinutes} originalDrawAt={info.originalDrawAt} closesAt={r.drawAt && new Date(Date.parse(r.drawAt) - (info.data.closeMinutes || 10) * 60e3).toISOString()} />
      <div className="grid grid--2">
        <Card title="Premios"><PrizeList prizes={info.data.prizes} /></Card>
        <Card title="Descripción y reglas"><RulesBlock rules={info.data.rules} description={info.data.description} solvencyDoc={info.data.solvencyDoc} /></Card>
      </div>
      {info.data.images.length > 1 && <Card title="Más fotos"><div className="rsum__gallery">{info.data.images.slice(1).map((src, i) => <Thumb key={i} raffle={{ title: r.title, images: [src] }} lg />)}</div></Card>}
      <Card title="Ediciones del superadministrador" body={false}>{info.changes.length ? info.changes.map((ch, i) => <div key={i} className="list-row" style={{ alignItems: 'flex-start' }}><History size={15} className="subtle" style={{ marginTop: 2 }} aria-hidden="true" /><span className="grow"><b style={{ fontSize: 13 }}>{dateTime(ch.at)}</b><small>{ch.diff.join('; ')}</small><small>Motivo: {ch.reason}</small></span></div>) : <Empty title="Sin ediciones" />}</Card>
    </div>}
    {rej && <Modal title={`Rechazar ${r.title}`} onClose={() => setRej(false)} footer={<><Button onClick={() => setRej(false)}>Cancelar</Button><Button variant="danger-solid" onClick={() => decide(false)}>Rechazar rifa</Button></>}><Field label="Motivo" required><Textarea data-autofocus rows={3} value={reason} onChange={e => setReason(e.target.value)} /></Field></Modal>}
  </>;
}
function TicketBoard({ r, N, counts }) {
  const [f, setF] = useState('todos'), [page, setPage] = useState(0), [jump, setJump] = useState(''), [hit, setHit] = useState(null), [open, setOpen] = useState(null);
  const per = 100, list = f === 'todos' ? N.list : N.list.filter(x => x.status === f), pages = Math.max(1, Math.ceil(list.length / per)), pg = Math.min(page, pages - 1);
  const shown = list.slice(pg * per, pg * per + per);
  const goNum = e => { e.preventDefault(); const n = parseInt(jump, 10); if (isNaN(n) || n < 0 || n >= N.total) return toast(`Escribe un número del ${N.list[0].k} al ${N.list[N.total - 1].k}`, 'err'); setF('todos'); setPage(Math.floor(n / per)); setHit(n); setOpen(n); };
  const exp = () => downloadCSV(`boletos-${r.id}.csv`, [['Número', 'Estado', 'Cliente', 'Cédula', 'Orden', 'Fecha'], ...N.list.map(x => [x.k, NUM_STATUS[x.status][0], x.name || '', x.cedula ? cedFmt(x.cedula) : '', x.orderId || '', x.at ? dateTime(x.at) : ''])]);
  const editable = r.status === 'venta';
  return <>
    {!editable && <div style={{ marginBottom: 14 }}><Note tone="info" icon={Lock}>{r.status === 'revision' ? 'La rifa todavía no está en venta: todos los números están disponibles.' : 'La venta cerró: puedes ver cada número, pero ya no se cambian.'}</Note></div>}
    <Card body={false}>
      <div className="toolbar">
        <Seg label="Estado del número" value={f} onChange={v => { setF(v); setPage(0); }} options={[{ key: 'todos', label: 'Todos', count: N.total }, { key: 'vendido', label: 'Vendidos', count: counts.vendido }, { key: 'apartado', label: 'Apartados', count: counts.apartado }, { key: 'disponible', label: 'Disponibles', count: counts.disponible }]} />
        <form className="input-icon" style={{ width: 170 }} onSubmit={goNum}><Search size={15} /><Input inputMode="numeric" placeholder="Ir al número…" aria-label="Ir al número" value={jump} onChange={e => setJump(e.target.value.replace(/\D/g, ''))} /></form>
        <div className="legend" style={{ marginLeft: 'auto' }}><span><i className="l-sold-a" />Vendido</span><span><i className="l-res" />Apartado</span><span><i />Disponible</span></div>
        <Button size="sm" icon={Download} onClick={exp}>Exportar</Button>
      </div>
      <div className="card__body">{shown.length ? <div className="nums" role="group" aria-label="Números de la rifa">{shown.map(x => <button key={x.n} type="button" className={'nadm nadm--' + x.status + (hit === x.n ? ' is-hit' : '')} aria-label={`${x.k}, ${NUM_STATUS[x.status][0].toLowerCase()}${x.name ? ', ' + x.name : ''}`} title={x.name ? `${x.k} · ${x.name}` : x.k} onClick={() => { setHit(x.n); setOpen(x.n); }}>{x.k}</button>)}</div> : <Empty title="No hay números con ese estado" />}</div>
      <div className="card__foot"><span>{shown.length ? `${shown[0].k}–${shown[shown.length - 1].k}` : ''} · toca un número para ver quién lo tiene{editable ? ' o cambiar su estado' : ''}</span>
        {pages > 1 && <div className="row"><Button size="sm" disabled={!pg} onClick={() => setPage(pg - 1)}>Anterior</Button><select className="select" style={{ height: 32, width: 'auto' }} aria-label="Página" value={pg} onChange={e => setPage(+e.target.value)}>{Array.from({ length: pages }, (_, i) => <option key={i} value={i}>{list[i * per].k}–{list[Math.min(list.length, (i + 1) * per) - 1].k}</option>)}</select><Button size="sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Siguiente</Button></div>}</div>
    </Card>
    {N.log.length > 0 && <div style={{ marginTop: 18 }}><Card title="Cambios de números" body={false}>{N.log.slice(0, 12).map((l, i) => <div key={i} className="list-row" style={{ alignItems: 'flex-start' }}><History size={15} className="subtle" style={{ marginTop: 2 }} aria-hidden="true" /><span className="grow"><b>{l.number}: {NUM_STATUS[l.from][0]} → {NUM_STATUS[l.to][0]}</b>{l.who ? ` · ${l.who}` : ''}<small>{dateTime(l.at)} · Motivo: {l.reason}</small></span></div>)}</Card></div>}
    {open != null && <NumberModal r={r} x={N.list[open]} editable={editable} onClose={() => setOpen(null)} />}
  </>;
}
function NumberModal({ r, x, editable, onClose }) {
  const db = useDB(), [to, setTo] = useState(''), [reason, setReason] = useState(''), [ced, setCed] = useState(''), [name, setName] = useState(''), [errs, setErrs] = useState({});
  const ord = x.orderId && db.orders.find(o => o.id === x.orderId);
  const known = ced.length >= 6 && API.client('V' + ced);
  const save = () => { try { API.setNumberStatus(r.id, x.n, to, { reason, cedula: ced, name }); toast(`Número ${x.k}: ${NUM_STATUS[x.status][0].toLowerCase()} → ${NUM_STATUS[to][0].toLowerCase()}`); onClose(); } catch (e) { setErrs(e.fields || {}); toast(e.message, 'err'); } };
  const options = ['vendido', 'apartado', 'disponible'].filter(s => s !== x.status);
  return <Modal wide title={<span className="row" style={{ gap: 10 }}>Número <span className="mono" style={{ fontSize: 22 }}>{x.k}</span><Badge tone={NUM_STATUS[x.status][1]}>{NUM_STATUS[x.status][0]}</Badge></span>} sub={`${r.title} · ${coName(db, r.companyId)}`} onClose={onClose}
    footer={editable ? <><Button onClick={onClose}>Cerrar</Button><Button variant="primary" disabled={!to} onClick={save}>{to ? `Cambiar a ${NUM_STATUS[to][0].toLowerCase()}` : 'Elige el nuevo estado'}</Button></> : <Button onClick={onClose}>Cerrar</Button>}>
    {x.status !== 'disponible' ? <>
      {x.name === 'Comprador de ejemplo' && !x.cedula ? <Note icon={Info}>Empresa de ejemplo: este número vendido no tiene un cliente cargado en el entorno de pruebas.</Note> : <>
        <div className="row row--between"><b>Quién lleva este número</b>{x.cedula && <a className="link" href={`#/admin/rifas/verificador?ced=${x.cedula}`}>Ver todas sus compras</a>}</div>
        <ClientCard cedula={x.cedula} name={x.name} />
        {ord ? <><b>Compra de este número</b><OrderDetail o={ord} showRaffle={false} /></> : x.at && <p className="subtle">Asignado por el superadministrador el {dateTime(x.at)} (empresa de ejemplo, sin detalle de pago).</p>}
      </>}
    </> : <p className="muted">Nadie tiene este número todavía.</p>}
    {editable && <>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="field__label" style={{ marginBottom: 8 }}>Cambiar el estado a<span className="req">*</span></legend>
        <div className="row">{options.map(o => <button key={o} type="button" className="tpl" style={{ width: 'auto', padding: '9px 14px' }} aria-pressed={to === o} onClick={() => setTo(o)}><b>{NUM_STATUS[o][0]}</b></button>)}</div></fieldset>
      {x.status === 'disponible' && to && <div className="form-grid">
        <Field label="Cédula del cliente" required error={errs.cedula} hint={known ? `Cliente registrado: ${known.name}` : 'Si es nuevo, escribe también su nombre.'}><Input inputMode="numeric" autoComplete="off" data-autofocus value={ced} onChange={e => setCed(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="18456732" /></Field>
        {!known && <Field label="Nombre y apellido" required error={errs.name}><Input autoComplete="off" value={name} onChange={e => setName(e.target.value)} /></Field>}
      </div>}
      {to === 'disponible' && ord && <Note tone="warn">{ord.qty > 1 ? `Se saca el ${x.k} de la compra ${ord.id} de ${ord.name}: le ${ord.qty - 1 === 1 ? 'queda 1 boleto' : `quedan ${ord.qty - 1} boletos`} y el monto baja ${usd(ord.amountUSD / ord.qty)}.` : `Se anula la compra ${ord.id} de ${ord.name} (era su único boleto).`} El número queda libre para la venta.</Note>}
      {to === 'vendido' && x.status === 'apartado' && <Note tone="info" icon={Info}>Queda vendido a {x.name}, sin pasar por la verificación del pago.</Note>}
      {to === 'apartado' && x.status === 'vendido' && <Note tone="warn">El boleto deja de estar pagado y vuelve a esperar el pago de {x.name}.</Note>}
      {to && <Field label="Motivo del cambio" required error={errs.reason} hint="Queda registrado con tu usuario en la Actividad y en el historial del número."><Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej.: el cliente pagó en efectivo en la oficina" /></Field>}
    </>}
  </Modal>;
}

/* ---------- Verificador del superadministrador: todas las compras de una cédula en todas las rifas ---------- */
export function AdminVerificador({ query }) {
  const db = useDB(), key = query.ced ? API.util.cedKey(query.ced) : '';
  const [input, setInput] = useState(key ? cedFmt(key) : ''), [tab, setTab] = useState('todas'), [rf, setRf] = useState('');
  const search = e => { e.preventDefault(); const k = API.util.cedKey(input); if (!k) return toast('Escribe una cédula de 6 a 8 números', 'err'); go('/admin/rifas/verificador', { ced: k }); };
  const c = key && API.client(key);
  const orders = key ? db.orders.filter(o => o.cedula === key).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const extra = key ? db.extRaffles.flatMap(r => Object.entries(r.numberOverrides || {}).filter(([, v]) => v.cedula === key && v.status !== 'disponible').map(([n, v]) => ({ raffleId: r.id, title: r.title, company: coName(db, r.companyId), number: String(n).padStart(String(r.total - 1).length, '0'), status: v.status, at: v.at, name: v.name }))) : [];
  const name = c ? c.name : (orders[0] || extra[0] || {}).name;
  const f = o => tab === 'todas' || (tab === 'activas' ? o.status === 'aprobada' && raffleState(API.raffle(o.raffleId)) === 'venta' : tab === 'pendientes' ? ['pendiente', 'abono'].includes(o.status) : ['rechazada', 'vencida', 'anulada'].includes(o.status));
  const list = orders.filter(f).filter(o => !rf || o.raffleId === rf);
  const raffles = [...new Set(orders.map(o => o.raffleId))].map(id => API.raffle(id)).filter(Boolean);
  const t = key ? clientTotals(key) : null;
  const tickets = orders.filter(o => ['aprobada', 'abono', 'pendiente'].includes(o.status)).reduce((a, o) => a + o.qty, 0) + extra.length;
  return <>
    <PageHead title="Verificador" sub="Busca por cédula y ve todo lo que una persona compró, en todas las rifas de todas las empresas" />
    <Card><form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={search}><div className="input-icon grow"><Search size={15} /><Input data-autofocus inputMode="numeric" value={input} onChange={e => setInput(e.target.value)} placeholder="V-18.456.732" aria-label="Cédula" /></div><Button variant="primary" type="submit">Buscar</Button></form>
      <p className="hint" style={{ marginTop: 6 }}>Con o sin puntos y letra. Prueba con 31689392 (cliente de prueba).</p></Card>
    <div style={{ height: 18 }} />
    {key && !c && !orders.length && !extra.length && <Card><Empty icon={Search} title={`No hay compras con la cédula ${cedFmt(key)}`} text="Esta persona no ha comprado en ninguna rifa de la plataforma." /></Card>}
    {key && (c || orders.length || extra.length) && <div className="grid grid--verif">
      <div className="stack"><ClientCard cedula={key} name={name} />
        <Card body={false}><div className="list-row"><span className="grow">Boletos en total</span><b className="num">{num(tickets)}</b></div><div className="list-row"><span className="grow">Rifas en las que participó</span><b className="num">{new Set([...orders.map(o => o.raffleId), ...extra.map(e => e.raffleId)]).size}</b></div><div className="list-row"><span className="grow">Primera compra</span><b className="num">{t && t.first ? date(t.first) : extra[0] ? date(extra[0].at) : '—'}</b></div></Card>
      </div>
      <Card body={false}>
        <div className="toolbar"><Seg label="Compras" value={tab} onChange={setTab} options={[{ key: 'todas', label: 'Todas', count: orders.length + extra.length }, { key: 'activas', label: 'Activas', count: orders.filter(o => o.status === 'aprobada' && raffleState(API.raffle(o.raffleId)) === 'venta').length }, { key: 'pendientes', label: 'Pendientes', count: orders.filter(o => ['pendiente', 'abono'].includes(o.status)).length }, { key: 'otras', label: 'Rechazadas o anuladas', count: orders.filter(o => ['rechazada', 'vencida', 'anulada'].includes(o.status)).length }]} />
          {raffles.length > 1 && <div style={{ marginLeft: 'auto', width: 220 }}><Select aria-label="Filtrar por rifa" value={rf} onChange={e => setRf(e.target.value)} placeholder="Rifa: todas" options={raffles.map(r => [r.id, r.title])} /></div>}</div>
        {list.length || (tab === 'todas' && !rf && extra.length) ? <PurchaseList orders={list} extra={tab === 'todas' && !rf ? extra : []} /> : <Empty title="No hay compras con este filtro" />}
        <div className="card__foot"><span>Toca una compra para ver todo su detalle: números, pago, verificación e historial.</span></div>
      </Card>
    </div>}
  </>;
}
