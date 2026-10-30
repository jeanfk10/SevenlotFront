// Panel del superadministrador de LottoGE, con el mismo sistema que el del operador.
// Corrige lo que señaló el informe de revisión: acciones con confirmación y motivo, un solo estado por
// objeto, datos personales enmascarados en la sala situacional y cifras que salen de la misma fuente.
import { useState, useEffect, useMemo } from 'react';
import { Building2, Ticket, Flag, Receipt, Check, X, Search, Eye, Pause, Play, RefreshCw, AlertTriangle, CalendarClock, FileText, ShieldCheck, Plus, Clock, Lock, Download } from 'lucide-react';
import { API, useDB, go, setQuery, usd, num, plural, date, dateTime, ago, greeting, cedFmt, raffleState, STATE_LABEL, RAFFLE_TONE, attempt, toast, confetti, downloadCSV, daysLeft } from '../lib.js';
import { PageHead, Card, Seg, Button, LinkButton, Badge, Note, Drawer, Modal, Field, Input, Select, Textarea, Empty, Stat, Toggle, Confirm, Count, FloatBg, Bar, Check2 } from '../ui.jsx';

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
  return <>
    <div className="hello"><FloatBg /><PageHead title={<>{greeting()}, <em>superadministrador</em></>} sub={`${plural(active.length, 'empresa activa', 'empresas activas')} · ${plural(all.filter(r => r.status === 'venta').length, 'rifa en venta', 'rifas en venta')} · ${plural(tasks.length, 'tarea pendiente', 'tareas pendientes')}`} actions={<LinkButton href="#/admin/sala" variant="dark" icon={Eye}>Sala situacional</LinkButton>} /></div>
    <div className="quick">
      <a className="q1" href="#/admin/empresas"><i><Building2 size={22} /></i><b>Empresas{pendCo.length > 0 && <em>{pendCo.length}</em>}</b><small>Aprobar, suspender, cambiar plan</small></a>
      <a className="q2" href="#/admin/rifas"><i><Ticket size={22} /></i><b>Rifas por revisar{pendR.length > 0 && <em>{pendR.length}</em>}</b><small>Antes de que salgan a la venta</small></a>
      <a className="q3" href="#/admin/denuncias"><i><Flag size={22} /></i><b>Denuncias{newRep.length > 0 && <em>{newRep.length}</em>}</b><small>Las que llegan de la página principal</small></a>
      <a className="q4" href="#/admin/facturacion"><i><Receipt size={22} /></i><b>Cobros{dueInv.length > 0 && <em>{dueInv.length}</em>}</b><small>Mantenimiento y licencias</small></a>
    </div>
    <div className="grid grid--side">
      <div className="stack">
        <div className="stats">
          <Stat label="Empresas activas" value={<Count to={active.length} format={v => num(v)} />} sub={`${pendCo.length} pendientes · ${db.companies.filter(c => c.status === 'suspendida').length} suspendidas`} />
          <Stat label="Rifas en venta" value={<Count to={all.filter(r => r.status === 'venta').length} format={v => num(v)} />} sub={`${all.filter(r => r.status === 'falta-ganador').length} esperan ganador`} />
          <Stat label="Ventas del mes" value={<Count to={month} format={v => usd(v, true)} />} sub="Todas las empresas" />
          <Stat label="Denuncias abiertas" value={<Count to={db.reports.filter(r => ['nueva', 'revision'].includes(r.status)).length} format={v => num(v)} />} sub={`${newRep.length} sin revisar`} subTone={newRep.length ? 'err' : ''} />
        </div>
        <Card title="Ventas del mes por empresa" body={false}>{sales.map(({ c, s }) => <div className="hbar" key={c.id}><span>{c.name}{c.live && <> <Badge tone="brand" plain>datos reales del entorno</Badge></>}</span><Bar value={s.monthSalesUSD} max={max} label={c.name} /><b className="num" style={{ textAlign: 'right' }}>{usd(s.monthSalesUSD, true)}</b></div>)}</Card>
      </div>
      <div className="stack">
        <Card title="Pendiente de ti" body={false}>{tasks.length ? tasks.map((t, i) => <div className="list-row" key={i}><t.icon size={17} className={t.tone + '-text'} aria-hidden="true" /><span className="grow"><b>{t.title}</b><small>{t.sub}</small></span><LinkButton size="sm" href={'#' + t.to}>{t.action}</LinkButton></div>) : <Empty title="Estás al día" />}</Card>
        <Card title="Actividad reciente" actions={<a className="subtle" href="#/admin/actividad">Ver todo</a>} body={false}>{db.audit.slice(0, 5).map(a => <div className="list-row" key={a.id}><span className="grow"><b>{a.action}</b><small>{a.detail} · {a.by} · {ago(a.at)}</small></span></div>)}</Card>
      </div>
    </div>
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
    <PageHead title="Empresas" sub={`${plural(db.companies.length, 'empresa registrada', 'empresas registradas')} · las pendientes se revisan antes de vender`} actions={<Button icon={Download} onClick={() => downloadCSV('empresas.csv', [['Empresa', 'RIF', 'RUN/LOT', 'Estado', 'Plan', 'Cobros', 'Correo', 'Teléfono', 'Registro'], ...list.map(c => [c.name, c.rif, c.runlot, COMPANY_STATUS[c.status][0], c.plan, BILLING[c.billing][0], c.email, c.phone, date(c.createdAt)])])}>Exportar</Button>} />
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
  const docs = [['acta', 'Acta constitutiva', true], ['rif', 'RIF de la empresa', true], ['socios', 'RIF de los socios', false]];
  const foot = <>{c.status === 'pendiente' && <><Button variant="danger" onClick={() => setAsk('rechazar')}>Rechazar…</Button><Button variant="success" icon={Check} onClick={() => setAsk('aprobar')}>Aprobar empresa</Button></>}
    {c.status === 'activa' && <><Button variant="danger" onClick={() => setAsk('suspender')}>Suspender…</Button>{c.live ? <Button variant="dark" icon={Eye} onClick={() => { API.viewAs(c.id); location.hash = '/'; location.reload(); }}>Ver su panel</Button> : <span />}</>}
    {(c.status === 'suspendida' || c.status === 'rechazada') && <><span /><Button variant="primary" onClick={() => setAsk('reactivar')}>{c.status === 'rechazada' ? 'Volver a revisar' : 'Reactivar'}</Button></>}</>;
  return <Drawer kicker={COMPANY_STATUS[c.status][0]} title={c.name} onClose={onClose} footer={foot}>
    {c.reason && <Note tone={c.status === 'suspendida' ? 'err' : 'warn'}><b>{c.status === 'suspendida' ? 'Suspendida' : 'Rechazada'}:</b> {c.reason}</Note>}
    <dl className="kv kv--left" style={{ gridTemplateColumns: '130px 1fr' }}><dt>RIF</dt><dd>{c.rif}</dd><dt>RUN/LOT</dt><dd>{c.runlot || 'Se asigna al aprobar'}</dd><dt>Estado</dt><dd>{c.state}</dd><dt>Correo</dt><dd>{c.email}</dd><dt>Teléfono</dt><dd>{c.phone}</dd><dt>Registro</dt><dd>{date(c.createdAt)}{c.approvedAt ? ` · aprobada el ${date(c.approvedAt)}` : ''}</dd></dl>
    <div className="stats"><Stat label="Rifas en venta" value={s.rafflesActive} /><Stat label="Ventas del mes" value={usd(s.monthSalesUSD, true)} /></div>
    <div><p className="field__label" style={{ marginBottom: 6 }}>Documentos</p>{docs.map(([k, l, req]) => <div key={k} className="row" style={{ padding: '4px 0' }}>{c.docs[k] ? <Check size={15} className="ok-text" aria-label="Recibido" /> : <X size={15} className={req ? 'err-text' : 'subtle'} aria-label="Falta" />}<span>{l}</span>{!c.docs[k] && <Badge tone={req ? 'err' : undefined} plain>{req ? 'Falta (obligatorio)' : 'Falta (opcional)'}</Badge>}</div>)}</div>
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
    <Card body={false}>
      <div className="toolbar"><Seg label="Estado" value={tab} onChange={t => setQuery({ tab: t, r: '' })} options={[{ key: 'revision', label: 'Por revisar', count: cnt('revision') }, { key: 'venta', label: 'En venta', count: cnt('venta') }, { key: 'falta-ganador', label: 'Falta ganador', count: cnt('falta-ganador') }, { key: 'rechazada', label: 'Rechazadas', count: cnt('rechazada') }, { key: 'todas', label: 'Todas', count: all.length }]} />
        <div className="input-icon" style={{ marginLeft: 'auto', width: 240 }}><Search size={15} /><Input placeholder="Rifa o empresa" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar rifas" /></div></div>
      {!list.length ? <Empty icon={Ticket} title={tab === 'revision' ? 'No hay rifas por revisar' : 'No hay rifas en este estado'} text={tab === 'revision' ? 'Cuando un operador envíe una rifa, aparece aquí.' : ''} /> :
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Rifa</th><th>Empresa</th><th>Estado</th><th>Sorteo</th><th className="r">Precio</th><th>Vendido</th><th><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>{list.map(r => <tr key={r.id} className="clickable" onClick={e => e.target.closest('button') || setQuery({ r: r.id })}><td><b>{r.title}</b><small>{r.prize}</small></td><td>{coName(db, r.companyId)}</td><td><Badge tone={RAFFLE_TONE[r.status]}>{STATE_LABEL[r.status]}</Badge></td><td className="num">{date(r.drawAt)}<small>{r.lottery}</small></td><td className="r num">{usd(r.priceUSD, true)}</td>
            <td style={{ minWidth: 110 }}>{r.status === 'revision' ? <span className="subtle">—</span> : <><Bar value={r.soldPct} max={100} label="Vendido" /><small className="num">{r.soldPct} %</small></>}</td>
            <td className="r"><Button size="sm" variant={r.status === 'revision' ? 'primary' : undefined} onClick={() => setQuery({ r: r.id })}>{r.status === 'revision' ? 'Revisar' : 'Ver'}</Button></td></tr>)}</tbody></table></div>}
    </Card>
    {open && <RaffleDrawer r={open} onClose={() => setQuery({ r: '' })} />}
  </>;
}
function RaffleDrawer({ r, onClose }) {
  const db = useDB(), [rej, setRej] = useState(false), [reason, setReason] = useState('');
  const checks = [['Documento de solvencia', !!r.solvencyDoc], ['Al menos una regla', (r.rules || []).length > 0], ['Fecha del sorteo futura', Date.parse(r.drawAt) > Date.now()], ['Empresa activa', (db.companies.find(c => c.id === r.companyId) || {}).status === 'activa']];
  const okAll = checks.every(c => c[1]);
  const decide = (ok) => { if (attempt(() => API.superRaffleDecide(r.id, ok, reason), ok ? 'Rifa aprobada: ya está en venta' : 'Rifa rechazada: el operador recibe el motivo')) { if (ok) confetti(); onClose(); } };
  return <Drawer kicker={`${coName(db, r.companyId)} · ${STATE_LABEL[r.status]}`} title={r.title} onClose={onClose} footer={r.status === 'revision' ? <><Button variant="danger" onClick={() => setRej(true)}>Rechazar…</Button><Button variant="success" icon={Check} disabled={!okAll} onClick={() => decide(true)}>Aprobar rifa</Button></> : null}>
    {r.status === 'revision' && <Note tone="info" icon={ShieldCheck}>Revisión de solo lectura: el superadministrador aprueba o rechaza, no edita la rifa.</Note>}
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
