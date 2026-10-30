import { useState, useMemo } from 'react';
import { Search, Download, Send, Plus, Copy, Pencil } from 'lucide-react';
import { API, PAGOS, useDB, go, usd, num, plural, date, cedFmt, clientStats, attempt, toast, downloadCSV } from '../lib.js';
import { PageHead, Card, Seg, Button, Badge, Empty, Pager, Stat, Field, Input, Select, Modal, Toggle } from '../ui.jsx';

export function Clientes() {
  const db = useDB();
  const [q, setQ] = useState(''), [seg, setSeg] = useState('todos'), [sel, setSel] = useState([]), [page, setPage] = useState(1);
  const all = useMemo(() => clientStats(db), [db]);
  const monthAgo = Date.now() - 30 * 864e5, q90 = Date.now() - 90 * 864e5;
  const segs = { todos: () => true, saldo: c => c.owesUSD > 0, nuevos: c => Date.parse(c.createdAt) >= monthAgo, inactivos: c => !c.last || Date.parse(c.last) < q90 };
  const digits = q.replace(/\D/g, '');
  const list = all.filter(segs[seg]).filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (digits.length >= 3 && (c.cedula.includes(digits) || c.phone.replace(/\D/g, '').includes(digits)))).sort((a, b) => (b.last || '').localeCompare(a.last || ''));
  const per = 10, pages = Math.max(1, Math.ceil(list.length / per)), shown = list.slice((page - 1) * per, page * per);
  const exp = () => downloadCSV('clientes.csv', [['Nombre', 'Cédula', 'Teléfono', 'Correo', 'Estado', 'Municipio', 'Compras', 'Boletos', 'Total pagado US$', 'Saldo US$', 'Última compra', 'Acepta promociones'], ...list.map(c => [c.name, cedFmt(c.cedula), c.phone, c.email, c.state, c.municipality, c.orders, c.tickets, c.paidUSD.toFixed(2), c.owesUSD.toFixed(2), c.last ? date(c.last) : '', c.consent ? 'Sí' : 'No'])]);
  const campaign = () => go('/mensajeria/campanas', { nueva: 1, seleccion: sel.join(',') });
  return <>
    <PageHead title="Clientes" sub={`${plural(all.length, 'cliente', 'clientes')} · ${all.filter(c => c.phone).length} con WhatsApp · ${all.filter(c => c.email).length} con correo`} actions={<><Button icon={Download} onClick={exp}>Exportar</Button><Button variant="primary" icon={Send} disabled={!sel.length} onClick={campaign}>Enviar campaña{sel.length ? ` (${sel.length})` : ''}</Button></>} />
    <Card body={false}>
      <div className="toolbar"><div className="input-icon" style={{ width: 260 }}><Search size={15} /><Input placeholder="Nombre, cédula o teléfono" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} aria-label="Buscar clientes" /></div>
        <Seg label="Segmento" value={seg} onChange={s => { setSeg(s); setPage(1); }} options={[{ key: 'todos', label: 'Todos', count: all.length }, { key: 'saldo', label: 'Con saldo', count: all.filter(segs.saldo).length }, { key: 'nuevos', label: 'Nuevos este mes', count: all.filter(segs.nuevos).length }, { key: 'inactivos', label: 'Inactivos 90 días', count: all.filter(segs.inactivos).length }]} />
        <span className="subtle" style={{ marginLeft: 'auto' }}>{sel.length ? `${sel.length} seleccionados` : ''}</span></div>
      {!list.length ? <Empty title={q ? `Sin resultados para «${q}»` : 'No hay clientes en este segmento'} action={q && <Button onClick={() => setQ('')}>Limpiar</Button>} /> :
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th><input type="checkbox" className="chk" aria-label="Seleccionar todos los de esta página" checked={shown.every(c => sel.includes(c.cedula))} onChange={e => setSel(e.target.checked ? [...new Set([...sel, ...shown.map(c => c.cedula)])] : sel.filter(x => !shown.some(c => c.cedula === x)))} /></th><th>Cliente</th><th>Contacto</th><th>Ubicación</th><th className="r">Compras</th><th className="r">Total pagado</th><th>Última compra</th></tr></thead>
          <tbody>{shown.map(c => <tr key={c.cedula} className={'clickable' + (sel.includes(c.cedula) ? ' is-sel' : '')} onClick={e => e.target.closest('input') || go('/ventas/verificador', { ced: c.cedula })}>
            <td><input type="checkbox" className="chk" aria-label={`Seleccionar a ${c.name}`} checked={sel.includes(c.cedula)} onChange={e => setSel(e.target.checked ? [...sel, c.cedula] : sel.filter(x => x !== c.cedula))} /></td>
            <td><b>{c.name}</b>{c.test && <> <Badge tone="brand" plain>Prueba</Badge></>}<small>{cedFmt(c.cedula)}</small></td>
            <td>{c.phone || <span className="subtle">Sin teléfono</span>}<small>{c.email || 'sin correo'}</small></td><td>{c.state || '—'}{c.municipality ? ' · ' + c.municipality : ''}</td>
            <td className="r num">{c.orders}</td><td className="r num">{usd(c.paidUSD)}{c.owesUSD > 0 && <small className="warn-text">saldo {usd(c.owesUSD)}</small>}</td><td className="num">{c.last ? date(c.last) : '—'}</td></tr>)}</tbody></table></div>}
      <Pager page={page} pages={pages} onChange={setPage} shown={shown.length} total={list.length} noun="clientes" />
    </Card>
  </>;
}

const BLANK_INF = { name: '', handle: '', code: '', commissionPct: 10, phone: '', bankCode: '0134', account: '', raffles: 'todas', active: true };
export function Influencers() {
  const db = useDB(), [edit, setEdit] = useState(null), [pay, setPay] = useState(null);
  const rows = db.influencers.map(i => {
    const os = db.orders.filter(o => o.influencer === i.code && o.status === 'aprobada');
    const sales = os.reduce((a, o) => a + o.amountUSD, 0), earned = sales * i.commissionPct / 100;
    return { ...i, sales, earned, due: Math.max(0, earned - i.paidUSD), tickets: os.reduce((a, o) => a + o.qty, 0) };
  });
  const tot = k => rows.reduce((a, r) => a + r[k], 0);
  return <>
    <PageHead title="Influencers" sub="Afiliados que venden con su código y ganan comisión" actions={<Button variant="primary" icon={Plus} onClick={() => setEdit({ ...BLANK_INF })}>Nuevo influencer</Button>} />
    <div className="stats" style={{ marginBottom: 18 }}><Stat label="Influencers activos" value={rows.filter(r => r.active).length} /><Stat label="Ventas con código" value={usd(tot('sales'))} /><Stat label="Comisiones por pagar" value={usd(tot('due'))} /><Stat label="Boletos vendidos" value={num(tot('tickets'))} /></div>
    <Card body={false}>{!rows.length ? <Empty title="No hay influencers registrados" action={<Button variant="primary" onClick={() => setEdit({ ...BLANK_INF })}>Nuevo influencer</Button>} /> :
      <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Influencer</th><th>Código</th><th className="r">Comisión</th><th className="r">Ventas</th><th className="r">Ganado</th><th className="r">Por pagar</th><th>Rifas</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.id}><td><b>{r.name}</b><small>{r.handle}</small></td><td><span className="mono">{r.code}</span> <button className="icon-btn" style={{ width: 26, height: 26, display: 'inline-grid' }} type="button" aria-label={`Copiar el código ${r.code}`} onClick={() => { navigator.clipboard?.writeText(r.code); toast('Código copiado'); }}><Copy size={13} /></button></td>
          <td className="r num">{r.commissionPct} %</td><td className="r num">{usd(r.sales)}</td><td className="r num">{usd(r.earned)}</td><td className="r num">{usd(r.due)}</td><td>{r.raffles === 'todas' ? 'Todas' : r.raffles.map(id => (API.raffle(id) || {}).title).join(', ')}</td>
          <td><Badge tone={r.active ? 'ok' : undefined}>{r.active ? 'Activo' : 'Inactivo'}</Badge></td>
          <td className="r"><div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>{r.due > 0 && <Button size="sm" onClick={() => setPay(r)}>Pagar</Button>}<Button size="sm" icon={Pencil} onClick={() => setEdit({ ...r })}>Editar</Button></div></td></tr>)}</tbody></table></div>}
    </Card>
    {edit && <InfluencerForm f={edit} onClose={() => setEdit(null)} />}
    {pay && <Modal title={`Pagar comisión a ${pay.name}`} onClose={() => setPay(null)} footer={<><Button onClick={() => setPay(null)}>Cancelar</Button><Button variant="primary" onClick={() => { attempt(() => API.payInfluencer(pay.id, pay.due.toFixed(2)), 'Comisión registrada como pagada'); setPay(null); }}>Registrar pago de {usd(pay.due)}</Button></>}>
      <p className="muted">Ventas con el código {pay.code}: {usd(pay.sales)} · comisión {pay.commissionPct} % = {usd(pay.earned)} · ya pagado {usd(pay.paidUSD)}.</p>
      <p>Transfiere {usd(pay.due)} a {PAGOS.BANCOS_VE.find(b => b[0] === pay.bankCode)?.[1] || 'su banco'} ({pay.bankCode}) · {pay.account || 'cuenta no registrada'}.</p></Modal>}
  </>;
}
function InfluencerForm({ f: init, onClose }) {
  const db = useDB(), [f, setF] = useState(init), set = (k, v) => setF({ ...f, [k]: v });
  return <Modal title={init.id ? 'Editar influencer' : 'Nuevo influencer'} wide onClose={onClose} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.saveInfluencer(f), init.id ? 'Influencer guardado' : 'Influencer creado') && onClose()}>{init.id ? 'Guardar' : 'Crear influencer'}</Button></>}>
    <div className="form-grid">
      <Field label="Nombre" required><Input data-autofocus value={f.name} onChange={e => set('name', e.target.value)} placeholder="Nombre y apellido" /></Field>
      <Field label="Código de descuento" required hint="Solo letras y números, sin espacios."><Input value={f.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="MERIDA10" /></Field>
      <Field label="Comisión" required hint="Escribe 10 para un 10 %."><div className="input-affix"><Input type="number" min="1" max="50" value={f.commissionPct} onChange={e => set('commissionPct', e.target.value)} /><span>%</span></div></Field>
      <Field label="Instagram o TikTok"><Input value={f.handle} onChange={e => set('handle', e.target.value)} placeholder="@usuario" /></Field>
      <Field label="WhatsApp"><Input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="0414-000-0000" /></Field>
      <Field label="Banco para pagos"><Select value={f.bankCode} onChange={e => set('bankCode', e.target.value)} options={PAGOS.BANCOS_VE.map(([c, n]) => [c, `${n} (${c})`])} /></Field>
      <Field label="Pago móvil o cuenta"><Input value={f.account} onChange={e => set('account', e.target.value)} placeholder="0414-000-0000" /></Field>
      <Field label="Rifas"><Select value={f.raffles === 'todas' ? 'todas' : f.raffles[0]} onChange={e => set('raffles', e.target.value === 'todas' ? 'todas' : [e.target.value])} options={[['todas', 'Todas las rifas'], ...db.raffles.filter(r => ['venta', 'revision', 'borrador'].includes(r.status)).map(r => [r.id, r.title])]} /></Field>
      <div className="field"><span className="field__label">Estado</span><div className="row"><Toggle checked={f.active} onChange={v => set('active', v)} label="Influencer activo" /><span>{f.active ? 'Activo' : 'Inactivo'}</span></div></div>
    </div>
  </Modal>;
}
