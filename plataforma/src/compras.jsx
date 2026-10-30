// Ficha del cliente y detalle completo de cada compra: los usan la ventana del número, el verificador
// del superadministrador y el del operador, para que en los tres se vea exactamente lo mismo.
import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, MessageCircle, Image as ImageIcon, Check } from 'lucide-react';
import { API, PAGOS, useDB, usd, bs, dec, num, plural, date, dateTime, ago, cedFmt, ORDER_STATUS, toast, raffleState } from './lib.js';
import { Badge, Avatar } from './ui.jsx';

const STATUS = { ...ORDER_STATUS, anulada: ['Anulado', 'muted'] };
const copy = (t, what) => { try { navigator.clipboard.writeText(t).then(() => toast(what), () => toast(what)); } catch (e) { toast(what); } };
const waLink = phone => 'https://wa.me/58' + String(phone || '').replace(/\D/g, '').replace(/^0/, '');
const bankName = code => { const b = PAGOS && PAGOS.BANCOS_VE.find(x => x[0] === code); return b ? `${b[1]} (${b[0]})` : code || ''; };
const raffleOf = id => API.raffle(id) || API.db.extRaffles.find(r => r.id === id);
const companyOf = r => (API.db.companies.find(c => c.id === (r && r.companyId)) || API.db.company).name;

/* Totales de un cliente en todas sus compras (solo la empresa que opera en el entorno guarda compras completas). */
export function clientTotals(cedula) {
  const os = API.db.orders.filter(o => o.cedula === cedula);
  const paid = os.reduce((a, o) => a + (o.status === 'aprobada' ? o.amountUSD : o.status === 'abono' ? o.paidUSD : 0), 0);
  const owes = os.filter(o => o.status === 'abono').reduce((a, o) => a + o.amountUSD - o.paidUSD, 0);
  const active = os.filter(o => o.status === 'aprobada' && raffleState(API.raffle(o.raffleId)) === 'venta').reduce((a, o) => a + o.qty, 0);
  return { orders: os, count: os.filter(o => ['aprobada', 'abono'].includes(o.status)).length, paid, owes, active, raffles: new Set(os.map(o => o.raffleId)).size, first: os.reduce((m, o) => !m || o.createdAt < m ? o.createdAt : m, null) };
}

export function ClientCard({ cedula, name, compact }) {
  const db = useDB(), c = API.client(cedula), t = clientTotals(c ? c.cedula : cedula);
  if (!c) return <div className="ccard"><div className="row"><Avatar name={name || '?'} /><div><b>{name || 'Cliente sin registrar'}</b><p className="subtle">{cedula ? cedFmt(cedula) : 'Sin cédula'} · sin datos de contacto en el sistema</p></div></div></div>;
  return <div className="ccard">
    <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={c.name} lg /><div style={{ minWidth: 0 }}><b style={{ fontSize: 15.5 }}>{c.name}</b>{c.test && <> <Badge tone="brand" plain>Cliente de prueba</Badge></>}<p className="subtle">Cliente desde el {date(c.createdAt)}</p></div></div>
    <dl className="kv kv--left ccard__kv">
      <dt>Cédula</dt><dd><span className="mono">{cedFmt(c.cedula)}</span> <button type="button" className="icon-btn icon-btn--xs" aria-label="Copiar cédula" onClick={() => copy(c.cedula.replace(/^[VE]/, ''), 'Cédula copiada')}><Copy size={13} /></button></dd>
      <dt>Teléfono</dt><dd>{c.phone ? <>{c.phone} <button type="button" className="icon-btn icon-btn--xs" aria-label="Copiar teléfono" onClick={() => copy(c.phone, 'Teléfono copiado')}><Copy size={13} /></button> <a className="icon-btn icon-btn--xs" href={waLink(c.phone)} target="_blank" rel="noopener" aria-label="Escribir por WhatsApp"><MessageCircle size={13} /></a></> : <span className="subtle">No registrado</span>}</dd>
      <dt>Correo</dt><dd>{c.email ? <>{c.email} <button type="button" className="icon-btn icon-btn--xs" aria-label="Copiar correo" onClick={() => copy(c.email, 'Correo copiado')}><Copy size={13} /></button></> : <span className="subtle">No registrado</span>}</dd>
      <dt>Ubicación</dt><dd>{c.state ? `${c.municipality ? c.municipality + ', ' : ''}${c.state}` : <span className="subtle">No registrada</span>}</dd>
      <dt>Promociones</dt><dd>{c.consent ? 'Acepta recibir promociones' : 'No acepta promociones'}</dd>
    </dl>
    {!compact && <div className="ccard__stats"><span><b>{t.count}</b>compras</span><span><b>{t.active}</b>boletos activos</span><span><b>{usd(t.paid, true)}</b>pagado</span><span className={t.owes ? 'warn-text' : ''}><b>{usd(t.owes, true)}</b>saldo</span></div>}
  </div>;
}

/* Todo lo que se sabe de una compra: fecha, pago, verificación, canal, números e historial. */
export function OrderDetail({ o, showRaffle = true, hideNumbers }) {
  const db = useDB(), r = raffleOf(o.raffleId), m = API.method(o.method), caja = API.caja(o.cajaId);
  const seller = o.sellerId && db.users.find(u => u.id === o.sellerId);
  const channel = o.channel === 'admin' ? 'Asignado por el superadministrador' : o.channel === 'taquilla' ? `Taquilla${caja ? ` · ${caja.name} (${caja.code})` : ''}${seller ? ` · vendió ${seller.name || seller.email}` : ''}` : 'Página de venta en línea';
  const inf = o.influencer && db.influencers.find(i => i.code === o.influencer);
  return <div className="odetail">
    <dl className="kv kv--left">
      <dt>Orden</dt><dd className="mono">{o.id}</dd>
      {showRaffle && <><dt>Rifa</dt><dd>{r ? r.title : o.raffleId}<small className="subtle"> · {companyOf(r)}{r && r.drawAt ? ` · sorteo ${dateTime(r.drawAt)}` : ''}</small></dd></>}
      <dt>Comprado</dt><dd>{dateTime(o.createdAt)} <small className="subtle">({ago(o.createdAt)})</small></dd>
      {!hideNumbers && <><dt>Números</dt><dd>{o.numbers.length ? <span className="chips">{o.numbers.map(n => <span key={n} className="chip">{n}</span>)}</span> : <span className="subtle">{plural(o.qty, 'boleto', 'boletos')} al azar: los números se asignan al aprobar el pago</span>}</dd></>}
      <dt>Estado</dt><dd><Badge tone={STATUS[o.status][1]}>{o.status === 'abono' ? `Abono ${Math.round(o.paidUSD / o.amountUSD * 100)} %` : STATUS[o.status][0]}</Badge>{o.rejectReason && <small className="err-text"> · {o.rejectReason}</small>}</dd>
      <dt>Monto</dt><dd><b>{usd(o.amountUSD)}</b> · {bs(o.amountBs)} <small className="subtle">(tasa {dec(o.rate)} Bs/US$ del día de la compra)</small></dd>
      {o.status === 'abono' && <><dt>Pagado</dt><dd>{usd(o.paidUSD)} · <span className="warn-text">saldo {usd(o.amountUSD - o.paidUSD)}</span></dd></>}
      <dt>Método de pago</dt><dd>{m ? m.name : o.channel === 'admin' ? 'Sin pago registrado (asignación manual)' : 'Sin método'}{m && m.currency ? <small className="subtle"> · {m.currency}</small> : ''}</dd>
      {o.reference && <><dt>Referencia</dt><dd className="mono">{o.reference}</dd></>}
      {o.bank && m && m.currency === 'VES' && <><dt>Banco</dt><dd>{bankName(o.bank)}</dd></>}
      {o.payerPhone && <><dt>Pagó desde</dt><dd>{o.payerPhone}</dd></>}
      <dt>Comprobante</dt><dd>{o.proof ? (o.proof.url ? <a href={o.proof.url} target="_blank" rel="noopener" className="row" style={{ gap: 6 }}><ImageIcon size={14} />Ver imagen ({o.proof.name || 'comprobante'})</a> : <span>{o.proof.name || 'Adjunto'}</span>) : <span className="subtle">Sin comprobante</span>}</dd>
      <dt>Canal</dt><dd>{channel}</dd>
      {o.influencer && <><dt>Influencer</dt><dd>{o.influencer}{inf ? ` · ${inf.name}` : ''}</dd></>}
      {o.decidedAt && <><dt>{o.status === 'rechazada' ? 'Rechazado por' : 'Verificado por'}</dt><dd>{o.decidedBy || '—'} · {dateTime(o.decidedAt)}</dd></>}
    </dl>
    {o.history && o.history.length > 0 && <div><p className="field__label" style={{ margin: '4px 0 6px' }}>Historial</p><ol className="timeline">{o.history.map((h, i) => <li key={i}><span>{h.text}</span><small className="subtle">{dateTime(h.at)}{h.by ? ' · ' + h.by : ''}</small></li>)}</ol></div>}
  </div>;
}

/* Lista de compras desplegables: cada fila resume la compra y al abrirla muestra todo su detalle. */
export function PurchaseList({ orders, extra = [], actions }) {
  const [open, setOpen] = useState(() => new Set(orders.length === 1 ? [orders[0].id] : []));
  const toggle = id => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return <div className="plist">
    {orders.map(o => { const r = raffleOf(o.raffleId), on = open.has(o.id); return <div key={o.id} className={'plist__item' + (on ? ' is-open' : '')}>
      <button type="button" className="plist__head" aria-expanded={on} onClick={() => toggle(o.id)}>
        {on ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        <span className="grow" style={{ minWidth: 0 }}><b>{r ? r.title : o.raffleId}</b><small className="subtle">{dateTime(o.createdAt)} · {o.numbers.length ? (o.numbers.length > 6 ? `${o.numbers.slice(0, 6).join(' · ')} +${o.numbers.length - 6}` : o.numbers.join(' · ')) : plural(o.qty, 'boleto al azar', 'boletos al azar')} · {(API.method(o.method) || {}).name || (o.channel === 'admin' ? 'Asignado' : o.channel === 'taquilla' ? 'Taquilla' : 'Sin método')}</small></span>
        <Badge tone={STATUS[o.status][1]}>{o.status === 'abono' ? `Abono ${Math.round(o.paidUSD / o.amountUSD * 100)} %` : STATUS[o.status][0]}</Badge>
        <b className="num plist__amt">{usd(o.status === 'abono' ? o.paidUSD : o.amountUSD)}</b>
      </button>
      {on && <div className="plist__body"><OrderDetail o={o} />{actions && <div className="row" style={{ marginTop: 10 }}>{actions(o)}</div>}</div>}
    </div>; })}
    {extra.map((e, i) => <div key={'x' + i} className="plist__item"><div className="plist__head" style={{ cursor: 'default' }}><Check size={16} className="subtle" aria-hidden="true" /><span className="grow"><b>{e.title}</b><small className="subtle">{e.company} · número {e.number} · {e.at ? dateTime(e.at) : ''} · asignado por el superadministrador (empresa de ejemplo, sin detalle de pago)</small></span><Badge tone={e.status === 'vendido' ? 'ok' : 'warn'}>{e.status === 'vendido' ? 'Vendido' : 'Apartado'}</Badge></div></div>)}
  </div>;
}
