import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Check, X, AlertTriangle, Image, Shuffle, ZoomIn, Copy, Minus, Hand, ChevronRight, Printer, MessageCircle, Plus, Download, Store, Calendar, UserCheck, ExternalLink, FlaskConical } from 'lucide-react';
import { API, PAGOS, useDB, go, setQuery, usd, bs, money, num, dec, plural, date, dateTime, ago, cedFmt, cedKey, methodName, ORDER_STATUS, REJECT_REASONS, raffleState, attempt, toast, downloadCSV, readImage, STATES, firstName, confetti } from '../lib.js';
import { ClientCard, PurchaseList } from '../compras.jsx';
import { PageHead, Card, Seg, Button, LinkButton, Badge, Note, Drawer, Modal, Field, Input, Select, Textarea, Steps, Empty, Pager, Stat, MethodIcon, Thumb, Avatar, Check2, Bar, FileDrop, Confirm } from '../ui.jsx';

/* ---------- comprobante: la imagen completa (se puede abrir en grande) o una captura de ejemplo ---------- */
function Proof({ o }) {
  const m = API.method(o.method), [big, setBig] = useState(false);
  if (o.proof && o.proof.url) return <div className="proof proof--full">
    <button type="button" className="proof__img" onClick={() => setBig(true)} aria-label="Ver el comprobante en grande"><img src={o.proof.url} alt={`Comprobante de ${o.name}`} /></button>
    <button type="button" className="btn btn--sm proof__zoom" onClick={() => setBig(true)}><ZoomIn size={14} aria-hidden="true" />Ver en grande</button>
    {big && createPortal(<div className="lightbox" role="dialog" aria-modal="true" aria-label="Comprobante en grande" onClick={() => setBig(false)} onKeyDown={e => e.key === 'Escape' && setBig(false)}><img src={o.proof.url} alt={`Comprobante de ${o.name}`} /><button type="button" className="btn lightbox__close" autoFocus onClick={() => setBig(false)}><X size={15} />Cerrar</button></div>, document.body)}
  </div>;
  if (o.proof) return <div className="proof"><div className="receipt" role="img" aria-label="Captura de ejemplo del comprobante">
    <span className="receipt__ok"><Check size={18} /></span><b>{m && m.currency === 'VES' ? bs(o.amountBs) : money(o.amountUSD, m ? m.currency : 'USD')}</b>
    <div><span>Operación</span><span>{m ? m.name.replace(/ al instante/, '') : 'Pago'}</span></div><div><span>Referencia</span><span>{o.reference || '—'}</span></div>
    <div><span>Fecha</span><span>{date(o.createdAt)}</span></div><div><span>Destino</span><span>{API.db.company.name}</span></div>
    <small className="subtle" style={{ textAlign: 'center' }}>Comprobante de ejemplo</small></div></div>;
  return <div className="proof"><div className="empty"><Image size={26} /><b>Sin comprobante</b><p>El cliente no adjuntó ninguna imagen.</p></div></div>;
}
const r2 = n => Math.round(n * 100) / 100;
const hasEvidence = o => { const m = API.method(o.method); return !!(o.reference || o.proof || (m && !m.requireReceipt)); };
const dupsOf = o => o.reference ? API.refUses(o.reference, o.id) : [];
// Boletos de una venta: los números, o "?" si se compró al azar y todavía no se asignan.
const ticketsOf = o => o.numbers.length ? o.numbers : Array.from({ length: o.qty }, (_, i) => '?' + (i + 1));
export const Tkt = ({ n, onRemove, sel, onClick, sub }) => { const q = String(n).startsWith('?'); const El = onClick ? 'button' : 'span';
  return <El type={onClick ? 'button' : undefined} className={'tkt' + (q ? ' tkt--q' : '') + (sel ? ' is-sel' : '')} onClick={onClick} aria-pressed={onClick ? !!sel : undefined}><b>{q ? '?' : n}</b>{sub && <small>{sub}</small>}{onRemove && <i role="button" tabIndex={0} aria-label={`Quitar ${n}`} onClick={e => { e.stopPropagation(); onRemove(); }}><X size={11} /></i>}</El>; };

/* ---------- Pagos y abonos ---------- */
export function Pagos({ query }) {
  const db = useDB();
  const tab = query.tab || 'pendiente', [q, setQ] = useState(''), [page, setPage] = useState(1), [sel, setSel] = useState([]);
  const open = query.orden ? db.orders.find(o => o.id === query.orden) : null;
  const of = t => db.orders.filter(o => t === 'rechazada' ? (o.status === 'rechazada' || o.status === 'vencida') : o.status === t);
  const qs = q.trim().toLowerCase(), qd = qs.replace(/\D/g, '');
  // Busca por nombre, orden, cédula, referencia o número de boleto (hasta 5 cifras).
  const list = of(tab).filter(o => !qs || o.name.toLowerCase().includes(qs) || o.id.toLowerCase().includes(qs) || (qd.length >= 3 && (o.cedula.includes(qd) || o.reference.includes(qd))) || (qd && qd.length <= 5 && /^\d+$/.test(qs) && o.numbers.some(n => +n === +qd)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const per = 12, pages = Math.max(1, Math.ceil(list.length / per)), shown = list.slice((page - 1) * per, page * per);
  const closed = of('pendiente').filter(o => raffleState(API.raffle(o.raffleId)) !== 'venta');
  const selectable = shown.filter(o => tab === 'pendiente' && hasEvidence(o) && !dupsOf(o).length);
  const bulk = () => { let n = 0; sel.forEach(id => { try { API.approveOrder(id); n++; } catch (e) { } }); setSel([]); toast(`${plural(n, 'pago aprobado', 'pagos aprobados')}`); };
  return <>
    <PageHead title="Pagos y abonos" sub={`${plural(of('pendiente').length, 'pago espera', 'pagos esperan')} revisión · ${plural(of('abono').length, 'abono abierto', 'abonos abiertos')}`} actions={sel.length > 0 && <Button variant="success" icon={Check} onClick={bulk}>Aprobar {sel.length} con comprobante</Button>} />
    <Card body={false}>
      <div className="toolbar">
        <Seg label="Estado del pago" value={tab} onChange={t => { setPage(1); setSel([]); setQuery({ tab: t, orden: '' }); }} options={[{ key: 'pendiente', label: 'Por verificar', count: of('pendiente').length }, { key: 'abono', label: 'Abonos', count: of('abono').length }, { key: 'aprobada', label: 'Aprobados', count: of('aprobada').length }, { key: 'rechazada', label: 'Rechazados', count: of('rechazada').length }]} />
        <div className="input-icon" style={{ marginLeft: 'auto', width: 300 }}><Search size={15} /><Input placeholder="Nombre, cédula, n.º de boleto o referencia" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} aria-label="Buscar pagos" /></div>
      </div>
      {!list.length ? <Empty title={q ? `Sin resultados para «${q}»` : tab === 'pendiente' ? 'No hay pagos por verificar' : 'No hay pagos en esta pestaña'} text={tab === 'pendiente' && !q ? 'Cuando un cliente pague desde tu página, aparece aquí.' : ''} action={q && <Button onClick={() => setQ('')}>Limpiar búsqueda</Button>} /> :
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr>{tab === 'pendiente' && <th className="hide-mobile"><input type="checkbox" className="chk" aria-label="Seleccionar los pagos con comprobante" checked={selectable.length > 0 && selectable.every(o => sel.includes(o.id))} onChange={e => setSel(e.target.checked ? selectable.map(o => o.id) : [])} /></th>}<th>Cliente</th><th>Compra</th><th className="r">Monto</th><th>Pago</th><th>{tab === 'pendiente' ? 'Recibido' : 'Estado'}</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{shown.map(o => { const r = API.raffle(o.raffleId), c = API.client(o.cedula), ev = hasEvidence(o), dup = dupsOf(o).length > 0; return <tr key={o.id} className={'clickable' + (open && open.id === o.id ? ' is-sel' : '')} onClick={e => e.target.closest('button,input,a') || setQuery({ orden: o.id })}>
            {tab === 'pendiente' && <td className="hide-mobile">{ev && !dup ? <input type="checkbox" className="chk" aria-label={`Seleccionar pago de ${o.name}`} checked={sel.includes(o.id)} onChange={e => setSel(e.target.checked ? [...sel, o.id] : sel.filter(x => x !== o.id))} /> : <span className="subtle" title="Revísalo uno por uno">—</span>}</td>}
            <td><b>{o.name}</b><small>{cedFmt(o.cedula)}{c && c.phone ? ' · ' + c.phone : ''}</small></td>
            <td>{r.title}<small className="mono">{o.numbers.length ? (o.numbers.length === 1 ? 'N.º ' : 'N.º ') + o.numbers.slice(0, 5).join(', ') + (o.numbers.length > 5 ? ` y ${o.numbers.length - 5} más` : '') : plural(o.qty, 'boleto al azar', 'boletos al azar')}</small>{o.channel === 'taquilla' && <small>POS · {(API.caja(o.cajaId) || {}).name}</small>}</td>
            <td className="r num"><b>{usd(o.amountUSD)}</b><small>{bs(o.amountBs)}</small>{o.status === 'abono' && <small className="warn-text">Saldo {usd(o.amountUSD - o.paidUSD)}</small>}</td>
            <td>{o.method ? methodName(o.method) : <span className="subtle">Sin método</span>}<small className="mono">{o.reference ? 'Ref. ' + o.reference : o.proof ? 'Con comprobante' : 'Sin referencia'}</small>{dup && <Badge tone="err">Referencia repetida</Badge>}</td>
            <td>{tab === 'pendiente' ? <>{ago(o.createdAt)}{raffleState(r) !== 'venta' && <small className="warn-text">Rifa cerrada</small>}</> : <><Badge tone={ORDER_STATUS[o.status][1]}>{ORDER_STATUS[o.status][0]}</Badge>{o.rejectReason && <small>{o.rejectReason}</small>}</>}</td>
            <td className="r">{tab === 'pendiente' ? <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>{ev && !dup ? <Button size="sm" variant="success" onClick={e => { const b = e.currentTarget; attempt(() => API.approveOrder(o.id), `Pago de ${firstName(o.name)} aprobado`) && confetti(b); }}>Aprobar</Button> : <Button size="sm" onClick={() => setQuery({ orden: o.id })}>Revisar</Button>}</div> : <Button size="sm" onClick={() => setQuery({ orden: o.id })}>{o.status === 'abono' ? 'Cobrar' : 'Ver'}</Button>}</td>
          </tr>; })}</tbody></table></div>}
      <Pager page={page} pages={pages} onChange={setPage} shown={shown.length} total={list.length} noun="pagos" />
    </Card>
    {tab === 'pendiente' && closed.length > 0 && <div style={{ marginTop: 14 }}><Note tone="warn"><b>{plural(closed.length, 'pago pertenece', 'pagos pertenecen')} a rifas ya cerradas.</b> Se vencen automáticamente a las 48 h y se le avisa al cliente. <button type="button" className="link" onClick={() => toast(`${API.expireClosed()} pagos vencidos`)}>Vencer ahora (prueba)</button></Note></div>}
    {open && <PaymentModal key={open.id} o={open} onClose={() => setQuery({ orden: '' })} />}
  </>;
}

// Ventana central del pago: comprobante completo a la izquierda, datos y acciones a la derecha.
function PaymentModal({ o, onClose }) {
  const r = API.raffle(o.raffleId), c = API.client(o.cedula) || {}, m = API.method(o.method);
  const [reject, setReject] = useState(false), [force, setForce] = useState(false);
  const ev = hasEvidence(o), dups = dupsOf(o);
  const approve = e => { if (!ev || dups.length) return setForce(true); const btn = e && e.currentTarget; if (attempt(() => API.approveOrder(o.id), `Pago aprobado · números ${API.db.orders.find(x => x.id === o.id).numbers.join(', ') || ''}`)) { confetti(btn); onClose(); } };
  const footer = o.status === 'pendiente' ? <><Button variant="danger" onClick={() => setReject(true)}>Rechazar…</Button><Button variant="success" icon={Check} onClick={approve}>{!ev ? 'Aprobar sin comprobante…' : dups.length ? 'Aprobar con referencia repetida…' : 'Aprobar pago'}</Button></>
    : o.status === 'abono' ? <><Button variant="danger" onClick={() => setReject(true)}>Anular abono…</Button><LinkButton href={`#/ventas/verificador?ced=${o.cedula}`}>Ver cliente</LinkButton><Button onClick={onClose}>Cerrar</Button></>
    : <><LinkButton href={`#/ventas/verificador?ced=${o.cedula}`}>Ver en el buscador</LinkButton><Button onClick={onClose}>Cerrar</Button></>;
  return <Modal xl title={o.name} sub={`${o.status === 'pendiente' ? 'Pago por verificar' : ORDER_STATUS[o.status][0]} · ${o.id} · ${r.title}`} onClose={onClose} footer={footer}>
    <div className="paymodal">
      <Proof o={o} />
      <div className="paymodal__info">
        {dups.length > 0 && <Note tone="err" icon={Copy}><b>Referencia repetida.</b> La {o.reference} ya aparece en {dups.map(d => `${d.id} (${d.name}, ${date(d.at)}${d.where === 'abono' ? ', en un abono' : ''})`).join('; ')}. Confirma con tu banco antes de aprobar.</Note>}
        <dl className="kv kv--left" style={{ gridTemplateColumns: '110px 1fr' }}>
          <dt>Monto</dt><dd><b>{usd(o.amountUSD)}</b> · {bs(o.amountBs)} (tasa {dec(o.rate)}){o.rate !== API.rate() && <><br /><small className="subtle">Se cobró con la tasa de ese día; hoy es {dec(API.rate())}.</small></>}</dd>
          <dt>Método</dt><dd>{m ? m.name : <span className="warn-text">Sin método</span>}{o.bank && m && m.currency === 'VES' ? ` · banco ${o.bank}` : ''}</dd>
          <dt>Referencia</dt><dd className="mono">{o.reference || <span className="warn-text">Sin referencia</span>}</dd>
          {o.payerPhone && <><dt>Pagó desde</dt><dd>{o.payerPhone}</dd></>}
          <dt>Boletos</dt><dd>{o.numbers.length ? <div className="tkts">{o.numbers.map(n => <Tkt key={n} n={n} />)}</div> : `${plural(o.qty, 'boleto', 'boletos')} al azar · se asignan al confirmar el pago`}</dd>
          <dt>Cliente</dt><dd>{cedFmt(o.cedula)}{c.phone ? ' · ' + c.phone : ''}{c.email ? <><br />{c.email}</> : ''}</dd>
          <dt>Canal</dt><dd>{o.channel === 'taquilla' ? 'POS Terminal · ' + ((API.caja(o.cajaId) || {}).name || '') : 'Página pública'}{o.influencer ? ' · código ' + o.influencer : ''}</dd>
          <dt>Orden</dt><dd className="mono">{o.id} · {dateTime(o.createdAt)}</dd>
        </dl>
        {o.status === 'pendiente' && !dups.length && (ev ? (o.proof && !o.proof.url ? <Note tone="ok" icon={Check}>La referencia y el monto coinciden con el comprobante.</Note> : <Note tone="info" icon={AlertTriangle}>Compara la referencia {o.reference} y el monto {m && m.currency === 'VES' ? bs(o.amountBs) : usd(o.amountUSD)} con tu banco antes de aprobar.</Note>)
          : !ev && <Note tone="warn"><b>Sin referencia ni comprobante.</b> Solo apruébalo si confirmaste el pago por otra vía; quedará registrado en la Actividad.</Note>)}
        {o.status === 'pendiente' && raffleState(r) !== 'venta' && <Note tone="warn">La rifa ya cerró. Si apruebas, el boleto participa solo si el pago llegó antes del cierre.</Note>}
        {o.status === 'abono' && <AbonoBox o={o} />}
        <details className="history"><summary>Historial ({o.history.length})</summary><ol>{o.history.map((h, i) => <li key={i}><span>{h.text}</span><br /><small className="subtle">{dateTime(h.at)}{h.by ? ' · ' + h.by : ''}</small></li>)}</ol></details>
      </div>
    </div>
    {reject && <RejectModal o={o} onClose={() => setReject(false)} onDone={onClose} />}
    {force && <ForceModal o={o} dups={dups} onClose={() => setForce(false)} onDone={onClose} />}
  </Modal>;
}

// Abono: el cliente puede terminar de pagar primero el boleto que más le interesa.
function AbonoBox({ o }) {
  const db = useDB(), due = r2(o.amountUSD - o.paidUSD), unit = r2(o.amountUSD / o.qty), tickets = ticketsOf(o);
  const [target, setTarget] = useState(o.focus && tickets.includes(o.focus) ? o.focus : ''), [pay, setPay] = useState({ amount: '', method: 'ef-usd', ref: '' });
  const needs = target ? Math.max(0, r2(unit - o.paidUSD)) : due;
  const register = () => {
    const res = attempt(() => API.registerPayment(o.id, pay.amount, pay.method, pay.ref, target ? { number: target.startsWith('?') ? 'azar' : target } : {}));
    if (!res) return;
    if (res.id !== o.id) { toast(`Boleto ${res.numbers[0]} pagado completo: ya está confirmado`); confetti(); setTarget(''); }
    else toast(res.status === 'aprobada' ? 'Saldo completado: venta confirmada' : 'Abono registrado');
    setPay({ ...pay, amount: '', ref: '' });
  };
  return <section className="abono">
    <div className="row row--between"><h3>Saldo pendiente {usd(due)}</h3><span className="subtle">Pagado {usd(o.paidUSD)} de {usd(o.amountUSD)}</span></div>
    <Bar value={o.paidUSD} max={o.amountUSD} label="Pagado" />
    <div className="field"><span className="field__label">{o.qty > 1 ? '¿A qué boleto va este pago?' : 'Boleto'}</span>
      <div className="tkts">{o.qty > 1 && <button type="button" className={'tkt tkt--all' + (!target ? ' is-sel' : '')} aria-pressed={!target} onClick={() => setTarget('')}><b>Todos</b><small>{plural(o.qty, 'boleto', 'boletos')}</small></button>}
        {tickets.map(n => <Tkt key={n} n={n} sel={target === n} sub={usd(unit, true)} onClick={o.qty > 1 ? () => setTarget(target === n ? '' : n) : undefined} />)}</div>
      <p className="hint">{o.qty < 2 ? `${o.numbers.length ? 'El número queda reservado' : 'El número se asigna'} hasta completar el saldo.` : target ? <>Lo ya abonado ({usd(o.paidUSD)}) se aplica primero a {target.startsWith('?') ? 'un boleto al azar' : 'el ' + target}. {needs > 0 ? <>Para dejarlo pagado faltan <b>{usd(needs)}</b>.</> : 'Ya alcanza: registra cualquier monto para confirmarlo.'} Los otros siguen reservados como abono.</> : 'Elige un boleto si el cliente quiere terminar de pagar uno primero.'}{o.random && !o.numbers.length ? ' Comprado al azar: el número se ve cuando ese boleto queda pagado.' : ''}</p></div>
    <div className="form-grid"><Field label="Monto recibido"><div className="input-affix"><Input type="number" inputMode="decimal" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} placeholder={dec(needs || due)} /><span>US$</span></div></Field>
      <Field label="Método"><Select value={pay.method} onChange={e => setPay({ ...pay, method: e.target.value })} options={db.paymentMethods.filter(x => x.active).map(x => [x.id, x.name])} /></Field></div>
    <Field label="Referencia (opcional)" hint="Si ya se usó en otro pago, el sistema te avisa."><Input value={pay.ref} onChange={e => setPay({ ...pay, ref: e.target.value })} /></Field>
    <div className="row"><Button variant="primary" onClick={register}>Registrar pago</Button>{target && needs > 0 && <Button onClick={() => setPay({ ...pay, amount: String(needs) })}>Cobrar lo que falta del boleto</Button>}<Button onClick={() => setPay({ ...pay, amount: String(due) })}>Cobrar todo el saldo</Button></div>
  </section>;
}
function RejectModal({ o, onClose, onDone }) {
  const [reason, setReason] = useState(REJECT_REASONS[0]), [other, setOther] = useState('');
  const text = reason === 'Otro motivo' ? other : reason;
  return <Modal title={`Rechazar el pago de ${o.name}`} sub="El cliente recibe el motivo por correo. Los números reservados se liberan." onClose={onClose}
    footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="danger-solid" disabled={!text.trim()} onClick={() => attempt(() => API.rejectOrder(o.id, text), 'Pago rechazado') && (onClose(), onDone())}>Rechazar pago</Button></>}>
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}><legend className="field__label" style={{ marginBottom: 6 }}>Motivo<span className="req">*</span></legend>
      {REJECT_REASONS.map(x => <label key={x} className="check"><input type="radio" name="motivo" checked={reason === x} onChange={() => setReason(x)} />{x}</label>)}</fieldset>
    {reason === 'Otro motivo' && <Field label="Escribe el motivo" required><Textarea data-autofocus value={other} onChange={e => setOther(e.target.value)} rows={2} /></Field>}
  </Modal>;
}
function ForceModal({ o, dups = [], onClose, onDone }) {
  const [ok, setOk] = useState(false), ev = hasEvidence(o);
  return <Modal title={dups.length ? 'Aprobar con referencia repetida' : 'Aprobar sin comprobante'} sub={`${o.name} · ${usd(o.amountUSD)}${dups.length ? ' · ref. ' + o.reference : ' · sin método, referencia ni comprobante'}`} onClose={onClose}
    footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="success" disabled={!ok} onClick={() => attempt(() => API.approveOrder(o.id, { force: true }), 'Pago aprobado · quedó registrado en la Actividad') && (onClose(), onDone())}>Aprobar de todos modos</Button></>}>
    {dups.length > 0 && <Note tone="err">Esta referencia ya está en {dups.map(d => `${d.id} (${d.name})`).join(', ')}. Puede ser el mismo pago enviado dos veces.</Note>}
    {!ev && <Note tone="warn">Este pago no tiene cómo verificarse. Si lo apruebas, se asignan los números y queda registrado a tu nombre en la Actividad.</Note>}
    <Check2 checked={ok} onChange={setOk}>{dups.length ? 'Revisé en el banco: son pagos distintos y apruebo este.' : 'Confirmé el pago por otra vía (efectivo, llamada al banco…) y apruebo sin comprobante.'}</Check2>
  </Modal>;
}

/* ---------- POS Terminal (taquilla) ---------- */
const TQ_STEPS = ['Rifa', 'Números', 'Cliente', 'Cobro'];
export function Taquilla({ query }) {
  const db = useDB();
  const live = db.raffles.filter(r => API.onSale(r));
  const cajas = db.cajas.filter(c => c.active);
  const [cajaId, setCaja] = useState(cajas[0] ? cajas[0].id : '');
  const [rid, setRid] = useState(query.rifa && live.some(r => r.id === query.rifa) ? query.rifa : '');
  const [step, setStep] = useState(rid ? 1 : 0), [picks, setPicks] = useState([]), [done, setDone] = useState(null);
  // Dos modalidades, como en la página de venta: escoger los números (se ven) o al azar (no se ven hasta cobrar completo).
  const [mode, setMode] = useState('elegir'), [rq, setRq] = useState(1);
  const [cust, setCust] = useState({ idType: 'V', ced: query.ced ? query.ced.replace(/^[VEJGP]/, '') : '', name: '', phone: '', email: '', state: '', municipality: '', influencer: '' });
  const [pay, setPay] = useState({ method: '', ref: '', partial: false, partialUSD: '', proof: null });
  const r = rid && API.raffle(rid);
  const reset = () => { setStep(rid ? 1 : 0); setPicks([]); setRq(1); setDone(null); setCust({ idType: 'V', ced: '', name: '', phone: '', email: '', state: '', municipality: '', influencer: '' }); setPay({ method: '', ref: '', partial: false, partialUSD: '', proof: null }); };
  if (done) return <Receipt o={done} onNew={reset} />;
  const caja = API.caja(cajaId);
  const allowed = r && caja ? (caja.raffles === 'todas' || caja.raffles.includes(r.id)) : true;
  const count = mode === 'azar' ? rq : picks.length, max = r ? API.maxPerPerson(r) : 0;
  const held = r && /^\d{6,8}$/.test(cust.ced) ? API.heldBy(r.id, cust.idType + cust.ced) : 0, over = held + count > max;
  const total = r ? API.priceFor(r, count) : 0, normal = r ? count * r.priceUSD : 0;
  const tickets = mode === 'azar' ? Array.from({ length: rq }, (_, i) => '?' + (i + 1)) : picks;
  const sell = () => {
    const o = attempt(() => API.sellCounter({ raffleId: r.id, method: pay.method, qty: count, numbers: mode === 'azar' ? [] : picks, cajaId, sellerId: 'u-1', influencer: cust.influencer, reference: pay.ref, proof: pay.proof, partialUSD: pay.partial ? pay.partialUSD : 0, customer: { cedula: cust.idType + cust.ced, name: cust.name, phone: cust.phone, email: cust.email, state: cust.state, municipality: cust.municipality } }));
    if (o) { setDone(o); confetti(); toast(o.status === 'abono' ? 'Abono registrado: boletos reservados' : '¡Venta exitosa!'); }
  };
  const switchMode = k => { setMode(k); setPicks([]); setRq(1); };
  return <>
    <PageHead title="POS Terminal" sub={caja ? `Vendiendo en ${caja.name} (${caja.code})` : 'Elige la caja'} actions={cajas.length > 1 && <div style={{ width: 230 }}><Select aria-label="Caja" value={cajaId} onChange={e => setCaja(e.target.value)} options={cajas.map(c => [c.id, `${c.name} · ${c.code}`])} /></div>} />
    <Steps steps={TQ_STEPS} current={step} />
    {step === 0 && (live.length ? <div className="grid grid--3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>{live.map(x => { const s = API.raffleStats(x.id), ok = !caja || caja.raffles === 'todas' || caja.raffles.includes(x.id); return <button key={x.id} type="button" className="card" disabled={!ok} style={{ padding: 14, display: 'grid', gap: 8, textAlign: 'left', cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : .55 }} onClick={() => { setRid(x.id); setPicks([]); setRq(1); setStep(1); }}>
      <Thumb raffle={x} lg /><b>{x.title}</b><small className="subtle">{usd(x.priceUSD, true)} por boleto · {num(s.available)} disponibles · sorteo {date(x.drawAt)}</small>{!ok && <small className="warn-text">Esta caja no vende esta rifa</small>}</button>; })}</div>
      : <Card><Empty title="No hay rifas en venta" action={<LinkButton href="#/rifas">Ver rifas</LinkButton>} /></Card>)}
    {step > 0 && r && <div className="grid grid--side">
      <div>
        {step === 1 && <NumberPicker r={r} mode={mode} setMode={switchMode} picks={picks} setPicks={setPicks} rq={rq} setRq={setRq} max={max} />}
        {step === 2 && <CustomerStep cust={cust} setCust={setCust} r={r} count={count} max={max} held={held} />}
        {step === 3 && <PayStep r={r} total={total} pay={pay} setPay={setPay} random={mode === 'azar'} />}
        {!allowed && <Note tone="warn">La caja {caja.name} no tiene asignada esta rifa.</Note>}
        {step === 1 && count > 0 && <div className="tq-mbar"><span className="grow"><small>{plural(count, 'boleto', 'boletos')}{mode === 'azar' ? ' al azar' : ' · ' + picks.slice(0, 4).join(', ') + (picks.length > 4 ? '…' : '')}</small><b className="num">{usd(total)}</b></span><Button variant="primary" disabled={!allowed} onClick={() => { setStep(2); scrollTo(0, 0); }}>Continuar</Button></div>}
      </div>
      <Card title="Venta actual" body={false} className="tq-sum">
        <div className="card__body" style={{ display: 'grid', gap: 10 }}>
          <div className="row row--between"><b>{r.title}</b><button className="link" type="button" onClick={() => { setStep(0); setPicks([]); setRq(1); }}>Cambiar</button></div>
          {count ? <div className="tkts tkts--cart" aria-live="polite">{tickets.slice(0, 40).map(n => <Tkt key={n} n={n} onRemove={step === 1 ? () => mode === 'azar' ? setRq(Math.max(0, rq - 1)) : setPicks(picks.filter(x => x !== n)) : undefined} />)}{tickets.length > 40 && <span className="tkt tkt--more">+{tickets.length - 40}</span>}</div> : <p className="subtle">Escoge los números en la cuadrícula o elige cuántos van al azar.</p>}
          {mode === 'azar' && count > 0 && <p className="hint">Al azar: los números salen en el recibo cuando se cobra completo.</p>}
          <div>
            <div className="sumrow"><span>{plural(count, 'boleto', 'boletos')} × {usd(r.priceUSD, true)}</span><b>{usd(normal)}</b></div>
            {total < normal && <div className="sumrow ok-text"><span>Promoción por volumen</span><b className="ok-text">− {usd(normal - total)}</b></div>}
            <div className="sumrow"><span>Tasa del día</span><b>Bs {dec(API.rate())}</b></div>
            <div className="sumrow sumrow--total"><span>Total</span><b>{usd(total)}</b></div>
            <div className="sumrow" style={{ justifyContent: 'flex-end' }}><span>{bs(total * API.rate())}</span></div>
            {pay.partial && +pay.partialUSD > 0 && <div className="sumrow warn-text"><span>Abono hoy · saldo</span><b className="warn-text">{usd(+pay.partialUSD)} · {usd(total - pay.partialUSD)}</b></div>}
          </div>
          {step === 1 && <Button variant="primary" block disabled={!count || !allowed} onClick={() => setStep(2)}>Continuar con el cliente <ChevronRight size={15} /></Button>}
          {step === 2 && <div className="row"><Button onClick={() => setStep(1)}>Atrás</Button><Button variant="primary" className="grow" disabled={!/^\d{6,8}$/.test(cust.ced) || cust.name.trim().length < 3 || over} onClick={() => setStep(3)}>Continuar al cobro</Button></div>}
          {step === 3 && <div className="row"><Button onClick={() => setStep(2)}>Atrás</Button><Button variant="success" className="grow" disabled={!pay.method || (pay.partial && !(+pay.partialUSD > 0 && +pay.partialUSD < total))} onClick={sell}>{pay.partial ? 'Registrar abono' : 'Confirmar venta'}</Button></div>}
        </div>
      </Card>
    </div>}
  </>;
}
function NumberPicker({ r, mode, setMode, picks, setPicks, rq, setRq, max }) {
  const map = API.takenMap(r.id), per = 100, pages = Math.ceil(r.total / per);
  const [page, setPage] = useState(0), [jump, setJump] = useState(''), [hit, setHit] = useState('');
  const s = API.raffleStats(r.id), cap = Math.min(max, s.available);
  const go2 = () => { const n = parseInt(jump, 10); if (isNaN(n) || n < 0 || n >= r.total) return toast(`Escribe un número del ${API.pad(r, 0)} al ${API.pad(r, r.total - 1)}`, 'err'); setPage(Math.floor(n / per)); setHit(API.pad(r, n)); const st = map.get(n); if (st) toast(`El ${API.pad(r, n)} está ${st}`, 'err'); };
  const toggle = k => { if (picks.includes(k)) return setPicks(picks.filter(x => x !== k)); if (picks.length >= cap) return toast(`Máximo ${max} boletos por persona en esta rifa (2,5 %)`, 'err'); setPicks([...picks, k]); };
  const setQ = n => { if (n > cap) toast(`Máximo ${max} boletos por persona en esta rifa (2,5 %)`, 'err'); setRq(Math.max(1, Math.min(cap, n))); };
  return <Card title={r.title} actions={<span className="subtle">{num(s.available)} disponibles · {usd(r.priceUSD, true)} por boleto</span>} body={false}>
    <div className="toolbar">
      <Seg label="Modalidad" value={mode} onChange={setMode} options={[{ key: 'elegir', label: <><Hand size={14} aria-hidden="true" /> Escoger números</> }, { key: 'azar', label: <><Shuffle size={14} aria-hidden="true" /> Al azar</> }]} />
      <span className="pill-max" title="Reglamento: 2,5 % de los números por persona natural">Máx. {num(max)} por persona</span>
      {mode === 'elegir' && <form className="input-icon" style={{ width: 170, marginLeft: 'auto' }} onSubmit={e => { e.preventDefault(); go2(); }}><Search size={15} /><Input inputMode="numeric" placeholder="Ir al número…" value={jump} onChange={e => setJump(e.target.value.replace(/\D/g, ''))} aria-label="Ir al número" /></form>}
    </div>
    {mode === 'azar' ? <div className="card__body azar">
      <p className="azar__lead">¿Cuántos boletos al azar?</p>
      <div className="stepper"><Button size="lg" icon={Minus} aria-label="Uno menos" disabled={rq <= 1} onClick={() => setQ(rq - 1)} /><Input inputMode="numeric" aria-label="Cantidad de boletos al azar" value={rq} onChange={e => setQ(+e.target.value.replace(/\D/g, '') || 1)} /><Button size="lg" icon={Plus} aria-label="Uno más" disabled={rq >= cap} onClick={() => setQ(rq + 1)} /></div>
      <div className="row" style={{ justifyContent: 'center' }}>{[1, 2, 5, 10, 20].filter(n => n <= cap).map(n => <Button key={n} size="sm" variant={rq === n ? 'dark' : undefined} onClick={() => setQ(n)}>{n}</Button>)}</div>
      <Note tone="info" icon={Shuffle}>El sistema escoge los números cuando se cobra completo y salen en el recibo. Si es un abono, se asignan al terminar de pagar, igual que en la página de venta.</Note>
    </div> : <>
      <div className="card__body"><div className="legend" style={{ marginBottom: 10 }}><span><i />Libre</span><span><i className="l-pick" />Elegido</span><span><i className="l-res" />Reservado</span><span><i className="l-sold" />Vendido</span></div>
        <div className="nums" role="group" aria-label={`Números del ${API.pad(r, page * per)} al ${API.pad(r, Math.min(r.total, (page + 1) * per) - 1)}`}>
        {Array.from({ length: Math.min(per, r.total - page * per) }, (_, i) => { const n = page * per + i, k = API.pad(r, n), st = map.get(n), on = picks.includes(k);
          return <button key={k} type="button" className={'numb' + (on ? ' is-pick' : st === 'vendido' ? ' is-sold' : st === 'reservado' ? ' is-res' : '') + (hit === k ? ' is-hit' : '')} disabled={!!st} aria-pressed={on} aria-label={`${k}${st ? ', ' + st : on ? ', elegido' : ''}`} onClick={() => toggle(k)}>{k}</button>; })}
      </div></div>
      <div className="card__foot"><span>{API.pad(r, page * per)}–{API.pad(r, Math.min(r.total, (page + 1) * per) - 1)}</span>{pages > 1 && <div className="row"><Button size="sm" disabled={!page} onClick={() => setPage(page - 1)}>Anterior</Button><span>Página {page + 1} de {pages}</span><Button size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Siguiente</Button></div>}</div>
    </>}
  </Card>;
}
function CustomerStep({ cust, setCust, r, count, max, held }) {
  const [found, setFound] = useState(null);
  const set = (k, v) => setCust(c => ({ ...c, [k]: v }));
  useEffect(() => {
    if (!/^\d{6,8}$/.test(cust.ced)) { setFound(null); return; }
    const t = setTimeout(() => { const c = API.client(cust.idType + cust.ced); setFound(c ? 'si' : 'no'); if (c) setCust(x => ({ ...x, name: c.name, phone: c.phone, email: c.email, state: c.state, municipality: c.municipality })); }, 250);
    return () => clearTimeout(t);
  }, [cust.ced, cust.idType]);
  return <Card title="Datos del cliente">
    {found === 'si' && <div style={{ marginBottom: 14 }}><Note tone="ok" icon={UserCheck}><b>Cliente encontrado.</b> Revisa que los datos estén al día.</Note></div>}
    {found === 'no' && <div style={{ marginBottom: 14 }}><Note tone="info">Cliente nuevo: completa sus datos y queda guardado.</Note></div>}
    {held + count > max && <div style={{ marginBottom: 14 }}><Note tone="err"><b>Pasa el máximo por persona.</b> Por reglamento cada cédula puede tener hasta {max} boletos de {r.title} (2,5 % de {num(r.total)}). Esta cédula ya tiene {held}{held ? '' : ''}: puede llevar {Math.max(0, max - held)} más. Vuelve a los números y quita {held + count - max}.</Note></div>}
    {held > 0 && held + count <= max && <div style={{ marginBottom: 14 }}><Note tone="info">Esta cédula ya tiene {plural(held, 'boleto', 'boletos')} de esta rifa; con esta venta llega a {held + count} de {max} permitidos.</Note></div>}
    <div className="form-grid">
      <Field label="Cédula" required hint="Solo números, de 6 a 8 dígitos. Prueba con 31689392."><div className="row" style={{ flexWrap: 'nowrap' }}><select className="select" style={{ width: 70 }} aria-label="Tipo de documento" value={cust.idType} onChange={e => set('idType', e.target.value)}>{['V', 'E'].map(x => <option key={x}>{x}</option>)}</select><Input data-autofocus inputMode="numeric" value={cust.ced} onChange={e => set('ced', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="18456732" /></div></Field>
      <Field label="Nombre y apellido" required><Input value={cust.name} onChange={e => set('name', e.target.value)} autoComplete="off" /></Field>
      <Field label="Teléfono" hint="Para avisarle por WhatsApp."><Input type="tel" value={cust.phone} onChange={e => set('phone', e.target.value)} placeholder="0414-555-0000" autoComplete="off" /></Field>
      <Field label="Correo" hint="Le llega la confirmación con sus números."><Input type="email" value={cust.email} onChange={e => set('email', e.target.value)} autoComplete="off" /></Field>
      <Field label="Estado"><Select value={cust.state} onChange={e => setCust(c => ({ ...c, state: e.target.value, municipality: '' }))} placeholder="Elige el estado" options={Object.keys(STATES)} /></Field>
      <Field label="Municipio"><Select value={cust.municipality} disabled={!cust.state} onChange={e => set('municipality', e.target.value)} placeholder="Elige el municipio" options={cust.state ? STATES[cust.state] : []} /></Field>
      <Field label="Código de influencer (opcional)" hint="Si el cliente viene de un influencer."><Input value={cust.influencer} onChange={e => set('influencer', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="MERIDA10" /></Field>
    </div>
  </Card>;
}
function PayStep({ r, total, pay, setPay, random }) {
  const db = useDB(), methods = db.paymentMethods.filter(m => m.active && m.channel !== 'online');
  const m = API.method(pay.method), set = (k, v) => setPay(p => ({ ...p, [k]: v }));
  const amountIn = m ? (m.currency === 'VES' ? bs(total * API.rate()) : money(total * ((db.currencies.find(c => c.code === m.currency) || {}).rate || 1), m.currency)) : '';
  return <Card title="Cobro">
    <div style={{ display: 'grid', gap: 14 }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="field__label" style={{ marginBottom: 8 }}>Método de pago<span className="req">*</span></legend>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>{methods.map(x => <button key={x.id} type="button" className="tpl" aria-pressed={pay.method === x.id} onClick={() => set('method', x.id)}><b><MethodIcon method={x} size={22} />{x.name}</b><small>{x.note || x.currency}</small></button>)}</div></fieldset>
      {m && <Note tone="info" icon={Store}><b>Total a cobrar: {amountIn}</b>{m.currency !== 'USD' && ` (${usd(total)})`}. Tasa {m.currency === 'VES' ? 'Bs ' + dec(API.rate()) : '1 US$ = ' + dec((db.currencies.find(c => c.code === m.currency) || {}).rate || 1) + ' ' + m.currency}.</Note>}
      {m && m.requireReceipt && <div className="form-grid"><Field label="Referencia" hint="La del pago móvil, transferencia o Zelle."><Input value={pay.ref} onChange={e => set('ref', e.target.value)} /></Field>
        <Field label="Comprobante (opcional)">{pay.proof ? <div className="row"><Badge tone="ok">Imagen adjunta</Badge><Button size="sm" variant="ghost" onClick={() => set('proof', null)}>Quitar</Button></div> : <FileDrop label="Adjuntar captura" onFile={f => readImage(f, 900).then(url => set('proof', { kind: 'imagen', name: f.name, url }), e => toast(e.message, 'err'))} />}</Field></div>}
      <Check2 checked={pay.partial} onChange={v => set('partial', v)}>Es un abono (el cliente paga una parte hoy)</Check2>
      {pay.partial && <Field label="Monto cobrado hoy" required hint={`Debe ser menor que ${usd(total)}. ${random ? 'Los boletos quedan reservados y los números se asignan al completar el saldo.' : 'Los números quedan reservados hasta completar el saldo.'}`}><div className="input-affix" style={{ maxWidth: 220 }}><Input type="number" inputMode="decimal" value={pay.partialUSD} onChange={e => set('partialUSD', e.target.value)} /><span>US$</span></div></Field>}
    </div>
  </Card>;
}
function Receipt({ o, onNew }) {
  const db = useDB(), r = API.raffle(o.raffleId), c = API.client(o.cedula) || {}, m = API.method(o.method);
  const text = `¡Hola ${firstName(o.name)}! Tu compra en ${r.title} (${db.company.name}): ${o.numbers.length ? (o.numbers.length === 1 ? 'boleto ' : 'boletos ') + o.numbers.join(', ') : plural(o.qty, 'boleto al azar', 'boletos al azar') + ' (los números se asignan al completar el pago)'}. ${o.status === 'abono' ? `Abonaste ${usd(o.paidUSD)}; saldo ${usd(o.amountUSD - o.paidUSD)}.` : `Total ${usd(o.amountUSD)}.`} Sorteo: ${dateTime(r.drawAt)} con ${r.lottery}. Orden ${o.id}.`;
  const wa = 'https://wa.me/58' + (c.phone || '').replace(/\D/g, '').replace(/^0/, '') + '?text=' + encodeURIComponent(text);
  return <>
    <svg className="tick" viewBox="0 0 72 72" aria-hidden="true" style={{ marginBottom: 6 }}><circle cx="36" cy="36" r="36" /><path d="m22 37 9 9 19-20" /></svg>
    <PageHead title={o.status === 'abono' ? 'Abono registrado' : '¡Venta exitosa!'} sub={`Orden ${o.id} · ${dateTime(o.createdAt)}`} actions={<><Button icon={Printer} onClick={() => print()}>Imprimir</Button>{c.phone && <a className="btn" href={wa} target="_blank" rel="noopener"><MessageCircle size={15} />Enviar por WhatsApp</a>}<Button variant="primary" icon={Plus} onClick={onNew}>Nueva venta</Button></>} />
    <div className="ticket printable" style={{ maxWidth: 460 }}>
      <div className="row row--between"><b>{db.company.name}</b><span className="subtle">RIF {db.company.rif}</span></div>
      <p className="subtle">{r.title} · sorteo {dateTime(r.drawAt)} · {r.lottery}</p>
      <div className="tkts" style={{ margin: '6px 0' }}>{ticketsOf(o).map(n => <Tkt key={n} n={n} />)}</div>
      {!o.numbers.length && <p className="hint">Comprados al azar: los números se asignan cuando se complete el pago y le llegan por correo.</p>}
      <dl className="kv"><dt>Cliente</dt><dd>{o.name} · {cedFmt(o.cedula)}</dd><dt>Método</dt><dd>{m ? m.name : '—'}</dd><dt>Total</dt><dd>{usd(o.amountUSD)} · {bs(o.amountBs)}</dd><dt>Tasa</dt><dd>Bs {dec(o.rate)}</dd>
        {o.status === 'abono' && <><dt>Abonado</dt><dd>{usd(o.paidUSD)}</dd><dt>Saldo</dt><dd className="warn-text">{usd(o.amountUSD - o.paidUSD)}</dd></>}<dt>Caja</dt><dd>{(API.caja(o.cajaId) || {}).name || '—'}</dd></dl>
      <p className="subtle">Autorizada por CONALOT · {db.company.runlot}. {c.email ? 'Le llegó la confirmación a ' + c.email + '.' : 'El cliente no tiene correo registrado.'}</p>
    </div>
  </>;
}

/* ---------- Buscar boletos (verificador): por cédula, por número o por rifa ---------- */
export function Verificador({ query }) {
  const db = useDB();
  const modo = query.modo || (query.num != null && query.num !== '' ? 'numero' : query.rifa && !query.ced ? 'rifa' : 'cedula');
  const raffles = db.raffles.filter(r => db.orders.some(o => o.raffleId === r.id));
  const [input, setInput] = useState(query.ced ? cedFmt(cedKey(query.ced)) : ''), [nIn, setNIn] = useState(query.num || ''), [rIn, setRIn] = useState(query.rifa || (raffles.find(r => API.onSale(r)) || raffles[0] || {}).id || '');
  const [tab, setTab] = useState('activos'), [rf, setRf] = useState(''), [page, setPage] = useState(1), [q, setQ] = useState(''), [st, setSt] = useState('vigentes');
  const setModo = m => go('/ventas/verificador', { modo: m });
  const search = e => { e.preventDefault(); const k = cedKey(input); if (!k) return toast('Escribe una cédula de 6 a 8 dígitos', 'err'); setPage(1); go('/ventas/verificador', { modo: 'cedula', ced: k }); };
  const searchNum = e => { e.preventDefault(); const r = API.raffle(rIn); if (!r) return toast('Elige la rifa', 'err'); const n = parseInt(nIn, 10); if (isNaN(n) || n < 0 || n >= r.total) return toast(`Escribe un número del ${API.pad(r, 0)} al ${API.pad(r, r.total - 1)}`, 'err'); go('/ventas/verificador', { modo: 'numero', rifa: r.id, num: API.pad(r, n) }); };
  const head = <Card>
    <Seg label="Buscar por" value={modo} onChange={setModo} options={[{ key: 'cedula', label: 'Por cédula' }, { key: 'numero', label: 'Por número de boleto' }, { key: 'rifa', label: 'Por rifa' }]} />
    <div style={{ marginTop: 14 }}>
      {modo === 'cedula' && <><form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={search}><div className="input-icon grow"><Search size={15} /><Input data-autofocus inputMode="numeric" value={input} onChange={e => setInput(e.target.value)} placeholder="V-18.456.732" aria-label="Cédula del cliente" /></div><Button variant="primary" type="submit">Buscar</Button></form>
        <p className="hint" style={{ marginTop: 6 }}>Con o sin puntos y letra; mínimo 6 dígitos. Prueba con 31689392 (cliente de prueba).</p></>}
      {modo === 'numero' && <form className="row" onSubmit={searchNum}><div style={{ minWidth: 220, flex: 1 }}><Select aria-label="Rifa" value={rIn} onChange={e => setRIn(e.target.value)} options={raffles.map(r => [r.id, r.title])} /></div><div className="input-icon" style={{ width: 170 }}><Search size={15} /><Input inputMode="numeric" value={nIn} onChange={e => setNIn(e.target.value.replace(/\D/g, ''))} placeholder="Número" aria-label="Número de boleto" /></div><Button variant="primary" type="submit">Buscar</Button></form>}
      {modo === 'rifa' && <div className="row"><div style={{ minWidth: 220, flex: 1 }}><Select aria-label="Rifa" value={rIn} onChange={e => { setRIn(e.target.value); setPage(1); go('/ventas/verificador', { modo: 'rifa', rifa: e.target.value }); }} options={raffles.map(r => [r.id, r.title])} /></div><div className="input-icon" style={{ width: 260 }}><Search size={15} /><Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Nombre, cédula o número" aria-label="Filtrar compras de la rifa" /></div></div>}
    </div>
  </Card>;
  const openPagos = o => <LinkButton size="sm" href={`#/ventas/pagos?tab=${{ pendiente: 'pendiente', abono: 'abono', aprobada: 'aprobada' }[o.status] || 'rechazada'}&orden=${o.id}`}>Abrir el pago</LinkButton>;

  if (modo === 'numero') {
    const r = query.rifa && API.raffle(query.rifa), k = query.num;
    const o = r && k ? db.orders.find(x => x.raffleId === r.id && x.numbers.includes(k) && ['aprobada', 'abono', 'pendiente'].includes(x.status)) : null;
    return <><PageHead title="Buscar boletos" sub="Por cédula, por número de boleto o por rifa" />{head}<div style={{ height: 18 }} />
      {r && k && (o ? <div className="grid grid--verif"><div className="stack"><div className="numhit"><Tkt n={k} /><div><b>{o.status === 'aprobada' ? 'Vendido' : o.status === 'abono' ? 'Apartado con abono' : 'Apartado, pago por verificar'}</b><small>{r.title}</small></div></div><ClientCard cedula={o.cedula} /><LinkButton size="sm" href={`#/ventas/verificador?modo=cedula&ced=${o.cedula}`}>Ver todas sus compras</LinkButton></div>
        <Card title="La compra de ese boleto" body={false}><PurchaseList orders={[o]} actions={openPagos} /></Card></div>
        : <Card><Empty icon={Search} title={`El ${k} de ${r.title} está disponible`} text="Nadie lo ha comprado ni apartado." action={API.onSale(r) && <LinkButton href={`#/ventas/taquilla?rifa=${r.id}`} variant="primary" icon={Store}>Venderlo en el POS</LinkButton>} /></Card>)}
    </>;
  }
  if (modo === 'rifa') {
    const r = API.raffle(query.rifa || rIn), qs = q.trim().toLowerCase(), qd = qs.replace(/\D/g, '');
    const all = r ? db.orders.filter(o => o.raffleId === r.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
    const groups = { vigentes: all.filter(o => ['aprobada', 'abono', 'pendiente'].includes(o.status)), aprobada: all.filter(o => o.status === 'aprobada'), abono: all.filter(o => o.status === 'abono'), pendiente: all.filter(o => o.status === 'pendiente') };
    const list = groups[st].filter(o => !qs || o.name.toLowerCase().includes(qs) || (qd.length >= 5 && o.cedula.includes(qd)) || (qd && qd.length <= 5 && o.numbers.some(n => +n === +qd)));
    const per = 12, pages = Math.max(1, Math.ceil(list.length / per)), shown = list.slice((page - 1) * per, page * per);
    return <><PageHead title="Buscar boletos" sub="Por cédula, por número de boleto o por rifa" />{head}<div style={{ height: 18 }} />
      {r && <Card body={false}><div className="toolbar"><Seg label="Estado" value={st} onChange={v => { setSt(v); setPage(1); }} options={[{ key: 'vigentes', label: 'Todas', count: groups.vigentes.length }, { key: 'aprobada', label: 'Vendidos', count: groups.aprobada.length }, { key: 'abono', label: 'Abonos', count: groups.abono.length }, { key: 'pendiente', label: 'Por verificar', count: groups.pendiente.length }]} /></div>
        {!list.length ? <Empty title="No hay compras con ese filtro" /> : <PurchaseList key={st + q + page} orders={shown} actions={openPagos} />}
        <Pager page={page} pages={pages} onChange={setPage} shown={shown.length} total={list.length} noun="compras" /></Card>}
    </>;
  }
  const key = query.ced ? cedKey(query.ced) : '';
  const c = key && API.client(key);
  const mine = c ? db.orders.filter(o => o.cedula === c.cedula).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const active = mine.filter(o => o.status === 'aprobada' && raffleState(API.raffle(o.raffleId)) === 'venta');
  const pend = mine.filter(o => o.status === 'pendiente' || o.status === 'abono');
  const lists = { activos: active, pendientes: pend, historial: mine };
  const list = lists[tab].filter(o => !rf || o.raffleId === rf), per = 10, pages = Math.max(1, Math.ceil(list.length / per)), shown = list.slice((page - 1) * per, page * per);
  const mineR = [...new Set(mine.map(o => o.raffleId))].map(id => API.raffle(id));
  return <>
    <PageHead title="Buscar boletos" sub="Por cédula, por número de boleto o por rifa" />
    {head}
    <div style={{ height: 18 }} />
    {key && !c && <Card><Empty icon={Search} title={`No hay compras con la cédula ${cedFmt(key)}`} text="Revisa el número o véndele su primer boleto." action={<LinkButton href={`#/ventas/taquilla?ced=${key}`} variant="primary" icon={Store}>Vender en el POS</LinkButton>} /></Card>}
    {c && <div className="grid grid--verif">
      <div className="stack"><ClientCard cedula={c.cedula} />
        <div className="row"><LinkButton size="sm" icon={Store} href={`#/ventas/taquilla?ced=${c.cedula}`}>Venderle</LinkButton>{c.phone && <a className="btn btn--sm" target="_blank" rel="noopener" href={'https://wa.me/58' + c.phone.replace(/\D/g, '').replace(/^0/, '')}><MessageCircle size={14} />WhatsApp</a>}</div></div>
      <Card body={false}>
        <div className="toolbar"><Seg label="Compras" value={tab} onChange={t => { setTab(t); setPage(1); }} options={[{ key: 'activos', label: 'Activos', count: active.length }, { key: 'pendientes', label: 'Pendientes', count: pend.length }, { key: 'historial', label: 'Historial', count: mine.length }]} />
          <div style={{ marginLeft: 'auto', width: 220 }}><Select aria-label="Filtrar por rifa" value={rf} onChange={e => { setRf(e.target.value); setPage(1); }} placeholder="Rifa: todas" options={mineR.map(r => [r.id, r.title])} /></div></div>
        {!list.length ? <Empty title={tab === 'activos' ? 'Sin boletos activos' : tab === 'pendientes' ? 'Sin pagos pendientes' : 'Sin compras'} /> :
          <PurchaseList key={tab + rf + page} orders={shown} actions={openPagos} />}
        <Pager page={page} pages={pages} onChange={setPage} shown={shown.length} total={list.length} noun="compras" />
      </Card>
    </div>}
  </>;
}
const iso10 = t => new Date(t - 4 * 36e5).toISOString().slice(0, 10);
const GROUP = m => !m ? 'Otros' : ['pago-movil', 'comprobante'].includes(m.icon) ? 'Pago móvil' : m.icon === 'billetera' ? 'Efectivo' : m.icon === 'transferencia' || m.icon === 'transferencia-inmediata' ? 'Transferencia' : 'Otros';
export function Reportes() {
  const db = useDB();
  const [f, setF] = useState({ from: iso10(Date.now() - 29 * 864e5), to: iso10(Date.now()), raffle: '', method: '', caja: '', cur: 'USD' });
  const set = (k, v) => setF({ ...f, [k]: v });
  const rows = useMemo(() => db.orders.filter(o => {
    if (!['aprobada', 'abono'].includes(o.status)) return false;
    const d = iso10(Date.parse(o.createdAt));
    return d >= f.from && d <= f.to && (!f.raffle || o.raffleId === f.raffle) && (!f.method || o.method === f.method) && (!f.caja || (f.caja === 'online' ? o.channel === 'online' : o.cajaId === f.caja));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [db, f]);
  const val = o => { const usdv = o.status === 'aprobada' ? o.amountUSD : o.paidUSD; return f.cur === 'USD' ? usdv : usdv * o.rate; };
  const fmt = n => f.cur === 'USD' ? usd(n) : bs(n);
  const total = rows.reduce((a, o) => a + val(o), 0);
  const byMethod = {}; rows.forEach(o => { const k = methodName(o.method); byMethod[k] = (byMethod[k] || 0) + val(o); });
  const byGroup = {}; rows.forEach(o => { const g = GROUP(API.method(o.method)); byGroup[g] = (byGroup[g] || 0) + val(o); });
  const groups = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
  const mList = Object.entries(byMethod).sort((a, b) => b[1] - a[1]), mMax = Math.max(1, ...mList.map(x => x[1]));
  const [n, setN] = useState(10);
  const exp = () => downloadCSV(`reporte-${f.from}-a-${f.to}.csv`, [['Fecha', 'Orden', 'Rifa', 'Cliente', 'Cédula', 'Método', 'Referencia', 'Caja', 'Estado', 'Monto US$', 'Tasa', 'Monto Bs'],
    ...rows.map(o => { const u = o.status === 'aprobada' ? o.amountUSD : o.paidUSD; return [date(o.createdAt), o.id, API.raffle(o.raffleId).title, o.name, cedFmt(o.cedula), methodName(o.method), o.reference, o.channel === 'online' ? 'En línea' : (API.caja(o.cajaId) || {}).name, ORDER_STATUS[o.status][0], dec(u), dec(o.rate), dec(u * o.rate)]; })]);
  return <>
    <PageHead title="Reportes" sub="Recaudación confirmada por periodo, método y caja" actions={<Button icon={Download} onClick={exp}>Exportar Excel</Button>} />
    <Card><div className="row">
      <Calendar size={15} className="subtle" aria-hidden="true" /><Input type="date" style={{ width: 150 }} aria-label="Desde" value={f.from} max={f.to} onChange={e => set('from', e.target.value)} /><span className="subtle">a</span><Input type="date" style={{ width: 150 }} aria-label="Hasta" value={f.to} min={f.from} onChange={e => set('to', e.target.value)} />
      <div style={{ width: 190 }}><Select aria-label="Rifa" value={f.raffle} onChange={e => set('raffle', e.target.value)} placeholder="Rifa: todas" options={db.raffles.filter(r => API.raffleStats(r.id).orders).map(r => [r.id, r.title])} /></div>
      <div style={{ width: 180 }}><Select aria-label="Método" value={f.method} onChange={e => set('method', e.target.value)} placeholder="Método: todos" options={db.paymentMethods.map(m => [m.id, m.name])} /></div>
      <div style={{ width: 180 }}><Select aria-label="Caja" value={f.caja} onChange={e => set('caja', e.target.value)} placeholder="Caja: todas" options={[['online', 'En línea'], ...db.cajas.map(c => [c.id, c.name])]} /></div>
      <div style={{ width: 200 }}><Select aria-label="Moneda de reporte" value={f.cur} onChange={e => set('cur', e.target.value)} options={[['USD', 'Moneda de reporte: US$'], ['VES', 'Moneda de reporte: Bs']]} /></div>
    </div></Card>
    <div style={{ height: 18 }} />
    <div className="stats"><Stat label="Total confirmado" value={fmt(total)} sub={f.cur === 'USD' ? `${bs(rows.reduce((a, o) => a + (o.status === 'aprobada' ? o.amountUSD : o.paidUSD) * o.rate, 0))} · tasa de cada venta` : 'Cada venta con su propia tasa'} />
      <Stat label="Ventas" value={num(rows.length)} sub={rows.length ? `promedio ${fmt(total / rows.length)}` : '—'} />
      {groups.slice(0, 3).map(([g, v]) => <Stat key={g} label={g} value={fmt(v)} sub={`${Math.round(v / (total || 1) * 100)} %`} />)}</div>
    <div style={{ height: 18 }} />
    {!rows.length ? <Card><Empty title="No hay ventas confirmadas con estos filtros" text="Amplía el rango de fechas o quita algún filtro." /></Card> :
      <div className="grid grid--2">
        <Card title="Por método de pago" body={false}>{mList.map(([k, v]) => <div className="hbar" key={k}><span>{k}</span><Bar value={v} max={mMax} label={k} /><b className="num" style={{ textAlign: 'right' }}>{fmt(v)}</b></div>)}<div className="card__foot"><span>Suma</span><b className="num">{fmt(total)}</b></div></Card>
        <Card title="Detalle" actions={<span className="subtle">{plural(rows.length, 'venta', 'ventas')}</span>} body={false}>
          <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Fecha</th><th>Rifa</th><th>Método</th><th>Caja</th><th className="r">Monto</th></tr></thead>
            <tbody>{rows.slice(0, n).map(o => <tr key={o.id}><td className="num">{date(o.createdAt)}</td><td>{API.raffle(o.raffleId).title}</td><td>{methodName(o.method)}{o.reference && <small className="mono">Ref. {o.reference}</small>}</td><td>{o.channel === 'online' ? 'En línea' : (API.caja(o.cajaId) || {}).name}</td><td className="r num">{fmt(val(o))}{o.status === 'abono' && <small>abono</small>}</td></tr>)}</tbody></table></div>
          {rows.length > n && <div className="card__foot"><span>Mostrando {n} de {rows.length}</span><Button size="sm" onClick={() => setN(n + 20)}>Ver más</Button></div>}
        </Card>
      </div>}
  </>;
}
