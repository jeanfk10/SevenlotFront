import { useState, useEffect, useRef } from 'react';
import { Upload, Globe, Copy, Check, Plus, Pencil, Trash2, RefreshCw, History, Shield, Zap, BarChart3, ExternalLink, Eye, Smartphone, Monitor, AlertTriangle, Clock, Info, Lock, LogOut, MapPin, KeyRound, Store } from 'lucide-react';
import { API, PAGOS, useDB, go, setQuery, usd, bs, dec, num, plural, date, dateTime, time, ago, cedFmt, STATES, ROLES, attempt, toast, readImage, initials, confetti } from '../lib.js';
import { PageHead, Card, Seg, Button, LinkButton, Badge, Note, Modal, Field, Input, Select, Textarea, Empty, Toggle, MethodIcon, Tabs, Avatar, Confirm, Check2, Thumb } from '../ui.jsx';

const copy = (t, what = 'Copiado') => { try { navigator.clipboard.writeText(t); } catch (e) { } toast(what); };

/* ---------- Empresa ---------- */
const SECTIONS_E = [['general', 'Datos generales'], ['contacto', 'Contacto'], ['redes', 'Redes sociales'], ['legal', 'Datos legales'], ['qr', 'Código QR']];
export function Empresa() {
  const db = useDB(), [c, setC] = useState({ ...db.company }), [sec, setSec] = useState('general'), [errors, setErrors] = useState({});
  const set = (k, v) => setC({ ...c, [k]: v });
  const dirty = JSON.stringify(c) !== JSON.stringify(db.company);
  const save = () => { try { API.saveCompany(c); setErrors({}); toast('Datos de la empresa guardados'); } catch (e) { if (e.fields) { setErrors(e.fields); const first = Object.keys(e.fields)[0]; setSec(['email', 'whatsapp', 'phone'].includes(first) ? 'contacto' : 'general'); } toast(e.message, 'err'); } };
  const url = `${db.company.subdomain}.lottoge.net`;
  return <>
    <PageHead title="Empresa" sub={`Datos legales, contacto y plan de ${db.company.name}`} actions={<Button variant="primary" disabled={!dirty} onClick={save}>Guardar cambios</Button>} />
    <div className="grid grid--empresa">
      <nav className="card" style={{ padding: 6 }} aria-label="Secciones de la empresa">{SECTIONS_E.map(([k, l]) => <button key={k} type="button" className="palette__item" aria-selected={sec === k} aria-current={sec === k ? 'true' : undefined} onClick={() => setSec(k)} style={{ fontWeight: sec === k ? 600 : 400 }}>{l}{Object.keys(errors).some(f => (k === 'general' && ['name', 'rif', 'state', 'municipality'].includes(f)) || (k === 'contacto' && ['email', 'whatsapp', 'phone'].includes(f))) && <AlertTriangle size={13} className="err-text" aria-label="Con errores" />}</button>)}</nav>
      <Card>
        {sec === 'general' && <div style={{ display: 'grid', gap: 16 }}>
          <div className="row"><span className="avatar" style={{ width: 60, height: 60, borderRadius: 12, fontSize: 18, background: 'linear-gradient(135deg,#2b2440,#5638c9)', color: '#fff', overflow: 'hidden' }}>{c.logo ? <img src={c.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(c.name)}</span>
            <div><label className="btn btn--sm" style={{ cursor: 'pointer' }}><Upload size={14} />Cambiar logo<input type="file" accept="image/png,image/jpeg" hidden onChange={e => e.target.files[0] && readImage(e.target.files[0], 400).then(v => set('logo', v), er => toast(er.message, 'err'))} /></label><p className="hint">PNG o JPG cuadrado, mínimo 400 × 400 px.</p></div></div>
          <div className="form-grid">
            <Field label="Nombre comercial" required error={errors.name}><Input value={c.name} onChange={e => set('name', e.target.value)} /></Field>
            <Field label="RIF" required error={errors.rif} hint="J-50123456-7"><Input value={c.rif} onChange={e => set('rif', e.target.value.toUpperCase())} /></Field>
            <Field label="Descripción" className="full"><Textarea rows={3} value={c.description} onChange={e => set('description', e.target.value)} /></Field>
            <Field label="Estado" required error={errors.state}><Select value={c.state} onChange={e => setC({ ...c, state: e.target.value, municipality: '' })} placeholder="Elige el estado" options={Object.keys(STATES)} /></Field>
            <Field label="Municipio" required error={errors.municipality}><Select value={c.municipality} onChange={e => set('municipality', e.target.value)} placeholder="Elige el municipio" options={STATES[c.state] || []} /></Field>
            <Field label="Dirección" className="full"><Input value={c.address} onChange={e => set('address', e.target.value)} /></Field>
          </div></div>}
        {sec === 'contacto' && <div className="form-grid">
          <Field label="Teléfono fijo" error={errors.phone} hint="0274-555-0142"><Input type="tel" value={c.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="WhatsApp de atención" error={errors.whatsapp} hint="0412-555-0199"><Input type="tel" value={c.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Field>
          <Field label="Correo de contacto" error={errors.email} className="full"><Input type="email" value={c.email} onChange={e => set('email', e.target.value)} autoComplete="off" /></Field></div>}
        {sec === 'redes' && <div className="form-grid">{[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']].map(([k, l]) => <Field key={k} label={l}><Input value={c[k] || ''} onChange={e => set(k, e.target.value)} placeholder="@usuario" /></Field>)}</div>}
        {sec === 'legal' && <div className="form-grid">
          <Field label="Razón social"><Input value={c.legalName} onChange={e => set('legalName', e.target.value)} /></Field>
          <Field label="RUN/LOT (CONALOT)" hint="Lo asigna CONALOT; no se edita."><Input value={c.runlot} disabled /></Field>
          <Field label="Representante legal"><Input value={c.legalRep} onChange={e => set('legalRep', e.target.value)} /></Field>
          <Field label="Cédula del representante"><Input value={c.legalRepId} onChange={e => set('legalRepId', e.target.value)} /></Field>
          <div className="full"><Note tone="info" icon={Info}>Documentos en regla: Acta constitutiva, RIF de la empresa y RIF de los socios. Para cambiarlos, escribe a soporte.</Note></div></div>}
        {sec === 'qr' && <div style={{ display: 'grid', gap: 14, justifyItems: 'start' }}><QR text={'https://' + url} /><p className="muted">Lleva a {url}. Imprímelo para tus taquillas y flyers.</p><Button onClick={() => print()}>Imprimir</Button></div>}
      </Card>
      <div className="stack">
        <Card><p className="subtle">Plan actual</p><b style={{ fontSize: 18 }}>Pro</b><p className="muted" style={{ margin: '6px 0 12px' }}>Boletos ilimitados por rifa · {num(db.whatsapp.planMonthly)} mensajes de WhatsApp al mes · correos ilimitados · dominio propio</p><Note tone="ok" icon={Check}>Tienes el plan más completo.</Note></Card>
        <Card><p className="subtle">Tu página pública</p><p className="mono" style={{ margin: '4px 0 10px' }}>{url}</p><div className="row"><a className="btn btn--sm" href={`./fronts/${db.sitePublished.template}/?rifa=${db.sitePublished.raffleId}`} target="_blank" rel="noopener"><Globe size={14} />Abrir</a><Button size="sm" icon={Copy} onClick={() => copy('https://' + url, 'Enlace copiado')}>Copiar</Button></div></Card>
      </div>
    </div>
  </>;
}
/* QR de muestra (patrón determinista a partir del texto; no es un QR escaneable). */
function QR({ text }) {
  const n = 25, cells = [], h = API.util.hash;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const finder = [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const on = finder ? (() => { const [fx, fy] = [[0, 0], [n - 7, 0], [0, n - 7]].find(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7); const dx = x - fx, dy = y - fy; return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5); })() : h(text + x + ',' + y) % 2 === 0;
    if (on) cells.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" />);
  }
  return <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width="180" height="180" role="img" aria-label={`Código QR de ${text} (muestra)`} style={{ background: '#fff', borderRadius: 8 }}><g fill="#17151c">{cells}</g></svg>;
}

/* ---------- Usuarios ---------- */
export function Usuarios() {
  const db = useDB(), [edit, setEdit] = useState(null), [off, setOff] = useState(null);
  return <>
    <PageHead title="Usuarios" sub="Personal de la empresa y lo que puede hacer cada rol" actions={<Button variant="primary" icon={Plus} onClick={() => setEdit({ name: '', email: '', role: 'taquillero', cajaId: '' })}>Invitar usuario</Button>} />
    <div className="grid grid--side">
      <Card body={false}><div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Usuario</th><th>Rol</th><th>Caja</th><th>Último acceso</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{db.users.map(u => <tr key={u.id}><td><b>{u.name || 'Invitación pendiente'}</b><small>{u.email}</small></td><td>{ROLES[u.role].name}</td><td>{u.cajaId ? (API.caja(u.cajaId) || {}).name : '—'}</td><td className="num">{u.lastAt ? ago(u.lastAt) : 'Nunca'}<small>Desde {date(u.createdAt)}</small></td>
          <td><Badge tone={u.status === 'activo' ? 'ok' : u.status === 'invitado' ? 'warn' : undefined}>{u.status === 'activo' ? 'Activo' : u.status === 'invitado' ? 'Invitación enviada' : 'Inactivo'}</Badge></td>
          <td className="r"><div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>{u.status === 'invitado' && <Button size="sm" onClick={() => toast(`Invitación reenviada a ${u.email}`)}>Reenviar</Button>}<Button size="sm" icon={Pencil} onClick={() => setEdit({ ...u })}>Editar</Button>{u.id !== 'u-1' && <Button size="sm" variant="ghost" onClick={() => u.status === 'inactivo' ? attempt(() => API.setUserStatus(u.id, 'activo'), 'Usuario activado') : setOff(u)}>{u.status === 'inactivo' ? 'Activar' : 'Desactivar'}</Button>}</div></td></tr>)}</tbody></table></div></Card>
      <Card title="Roles" body={false}>{Object.values(ROLES).map(r => <div className="list-row" key={r.name}><span><b>{r.name}</b><small>{r.desc}</small></span></div>)}</Card>
    </div>
    {edit && <Modal title={edit.id ? 'Editar usuario' : 'Invitar usuario'} sub={edit.id ? '' : 'Le llega un correo para crear su contraseña: nadie la escribe por él.'} onClose={() => setEdit(null)} footer={<><Button onClick={() => setEdit(null)}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.inviteUser(edit), edit.id ? 'Usuario guardado' : `Invitación enviada a ${edit.email}`) && setEdit(null)}>{edit.id ? 'Guardar' : 'Enviar invitación'}</Button></>}>
      <Field label="Correo" required><Input type="email" data-autofocus value={edit.email} disabled={!!edit.id} onChange={e => setEdit({ ...edit, email: e.target.value })} autoComplete="off" name="invite-email" /></Field>
      <Field label="Nombre"><Input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} autoComplete="off" /></Field>
      <Field label="Rol" required hint={ROLES[edit.role].desc}><Select value={edit.role} disabled={edit.id === 'u-1'} onChange={e => setEdit({ ...edit, role: e.target.value })} options={Object.entries(ROLES).map(([k, r]) => [k, r.name])} /></Field>
      <Field label="Caja" required={edit.role === 'taquillero'}><Select value={edit.cajaId} onChange={e => setEdit({ ...edit, cajaId: e.target.value })} placeholder="Sin caja" options={db.cajas.map(c => [c.id, `${c.name} · ${c.code}`])} /></Field>
    </Modal>}
    {off && <Confirm title={`¿Desactivar a ${off.name || off.email}?`} text="No podrá entrar al panel. Sus ventas se mantienen." confirm="Desactivar" danger onClose={() => setOff(null)} onConfirm={() => { attempt(() => API.setUserStatus(off.id, 'inactivo'), 'Usuario desactivado'); setOff(null); }} />}
  </>;
}

/* ---------- Cajas ---------- */
export function Cajas() {
  const db = useDB(), [edit, setEdit] = useState(null);
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const live = db.raffles.filter(r => API.raffleState(r) === 'venta');
  return <>
    <PageHead title="Cajas" sub="Puntos de venta fijos y móviles" actions={<Button variant="primary" icon={Plus} onClick={() => setEdit({ code: '', name: '', type: 'fija', location: '', state: db.company.state, userId: '', pin: true, raffles: 'todas', active: true })}>Nueva caja</Button>} />
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>{db.cajas.map(c => {
      const sales = db.orders.filter(o => o.cajaId === c.id && o.status === 'aprobada' && Date.parse(o.createdAt) >= month.getTime());
      const covers = c.raffles === 'todas' ? live.length : live.filter(r => c.raffles.includes(r.id)).length, u = db.users.find(x => x.id === c.userId);
      return <div key={c.id} className="card" style={{ padding: 16, display: 'grid', gap: 10, opacity: c.active ? 1 : .7 }}>
        <div className="row row--between"><b>{c.name}</b><Badge tone={c.active ? 'ok' : undefined}>{c.active ? 'Activa' : 'Inactiva'}</Badge></div>
        <p className="subtle"><span className="mono">{c.code}</span> · {c.type === 'móvil' ? 'Móvil' : 'Fija'} · {c.pin ? 'con PIN' : 'sin PIN'}</p>
        <p className="row" style={{ gap: 6 }}><MapPin size={14} className="subtle" aria-hidden="true" />{c.location}</p>
        <dl className="kv"><dt>Responsable</dt><dd>{u ? (u.name || u.email) : <span className="warn-text">Sin asignar</span>}</dd><dt>Rifas en venta que cubre</dt><dd>{covers} de {live.length}</dd><dt>Ventas del mes</dt><dd>{sales.length} · {usd(sales.reduce((a, o) => a + o.amountUSD, 0), true)}</dd></dl>
        <div className="row"><Button size="sm" icon={Pencil} onClick={() => setEdit({ ...c })}>Editar</Button>{c.active && <LinkButton size="sm" icon={Store} href="#/ventas/taquilla">Vender</LinkButton>}</div></div>; })}</div>
    {edit && <Modal title={edit.id ? 'Editar caja' : 'Nueva caja'} wide onClose={() => setEdit(null)} footer={<><Button onClick={() => setEdit(null)}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.saveCaja(edit), edit.id ? 'Caja guardada' : 'Caja creada') && setEdit(null)}>{edit.id ? 'Guardar' : 'Crear caja'}</Button></>}>
      <div className="form-grid">
        <Field label="Nombre" required><Input data-autofocus value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Taquilla El Vigía" /></Field>
        <Field label="Código" required hint="Dos letras y dos números: TQ-04"><Input value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></Field>
        <Field label="Tipo"><Select value={edit.type} onChange={e => setEdit({ ...edit, type: e.target.value })} options={[['fija', 'Fija'], ['móvil', 'Móvil (cobrador)']]} /></Field>
        <Field label="Responsable"><Select value={edit.userId} onChange={e => setEdit({ ...edit, userId: e.target.value })} placeholder="Sin asignar" options={db.users.filter(u => u.status !== 'inactivo').map(u => [u.id, `${u.name || u.email} · ${ROLES[u.role].name}`])} /></Field>
        <Field label="Ubicación" required className="full" hint="Calle, local o sector. Se valida que sea una dirección real."><Input value={edit.location} onChange={e => setEdit({ ...edit, location: e.target.value })} /></Field>
        <Field label="Rifas que vende"><Select value={edit.raffles === 'todas' ? 'todas' : edit.raffles[0] || 'todas'} onChange={e => setEdit({ ...edit, raffles: e.target.value === 'todas' ? 'todas' : [e.target.value] })} options={[['todas', 'Todas las rifas'], ...live.map(r => [r.id, r.title])]} /></Field>
        <div className="field"><span className="field__label">Opciones</span><Check2 checked={edit.pin} onChange={v => setEdit({ ...edit, pin: v })}>Pedir PIN para vender</Check2><Check2 checked={edit.active} onChange={v => setEdit({ ...edit, active: v })}>Caja activa</Check2></div>
      </div></Modal>}
  </>;
}

/* ---------- Métodos de pago ---------- */
const CHANNEL = { online: 'Página pública', taquilla: 'Solo taquilla', ambos: 'Página y taquilla' };
export function Metodos() {
  const db = useDB(), [edit, setEdit] = useState(null), [del, setDel] = useState(null);
  const gw = API.gatewayActive();
  return <>
    <PageHead title="Métodos de pago" sub="Las cuentas donde cobras. Los activos en la página pública salen en tu front de venta, con su icono." actions={<Button variant="primary" icon={Plus} onClick={() => setEdit({ name: '', icon: 'comprobante', currency: 'VES', bankCode: '0134', channel: 'ambos', instant: false, requireReceipt: true, active: true, accountInfo: [['Banco', ''], ['Teléfono', ''], ['RIF', db.company.rif]], note: '' })}>Agregar método</Button>} />
    {!gw && db.paymentMethods.some(m => m.instant && m.active) && <div style={{ marginBottom: 14 }}><Note tone="info" icon={Zap}><b>"Pago Móvil al instante" no sale en tu página</b> hasta que una pasarela esté activa. <a href="#/ajustes/pasarelas">Completar pasarela</a></Note></div>}
    <Card body={false}><div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Método</th><th>Banco</th><th>Moneda</th><th>Dónde se usa</th><th>Comprobante</th><th>Activo</th><th><span className="sr-only">Acciones</span></th></tr></thead>
      <tbody>{db.paymentMethods.map(m => { const bank = PAGOS.BANCOS_VE.find(b => b[0] === m.bankCode); const curOff = !(db.currencies.find(c => c.code === m.currency) || {}).active; return <tr key={m.id}>
        <td><div className="cell-main"><MethodIcon method={m} size={30} /><div><b>{m.name}</b><small>{m.note}</small></div></div></td><td>{bank ? `${bank[1]} (${bank[0]})` : '—'}</td>
        <td>{m.currency}{curOff && <small className="warn-text">Moneda inactiva</small>}</td><td>{CHANNEL[m.channel]}{m.instant && <small className={gw ? 'ok-text' : 'warn-text'}>{gw ? 'Al instante con pasarela' : 'Espera pasarela'}</small>}</td>
        <td>{m.instant ? 'No (pasarela)' : m.requireReceipt ? 'Sí' : 'No'}</td>
        <td><Toggle checked={m.active} onChange={() => { API.toggleMethod(m.id); toast(`${m.name} ${m.active ? 'desactivado' : 'activado'}`); }} label={`Activar ${m.name}`} /></td>
        <td className="r"><div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}><Button size="sm" icon={Pencil} onClick={() => setEdit(JSON.parse(JSON.stringify(m)))}>Editar</Button><Button size="sm" variant="ghost" icon={Trash2} aria-label={`Eliminar ${m.name}`} onClick={() => setDel(m)} /></div></td></tr>; })}</tbody></table></div></Card>
    {edit && <MethodForm m={edit} onClose={() => setEdit(null)} />}
    {del && <Confirm title={`¿Eliminar ${del.name}?`} text="Si ya tiene ventas, el sistema no lo borra: desactívalo." confirm="Eliminar" danger onClose={() => setDel(null)} onConfirm={() => { attempt(() => API.deleteMethod(del.id), 'Método eliminado'); setDel(null); }} />}
  </>;
}
function MethodForm({ m: init, onClose }) {
  const db = useDB(), [m, setM] = useState(init), set = (k, v) => setM({ ...m, [k]: v });
  const icons = Object.entries(PAGOS.ICONS);
  const pickIcon = k => { const d = PAGOS.DEFAULTS[k]; setM({ ...m, icon: k, currency: d && db.currencies.some(c => c.code === d.currency) ? d.currency : m.currency, name: m.name || PAGOS.ICONS[k].name }); };
  return <Modal title={init.id ? `Editar ${init.name}` : 'Agregar método de pago'} wide onClose={onClose} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.saveMethod(m), 'Método guardado') && onClose()}>Guardar</Button></>}>
    <div className="field"><span className="field__label">Icono</span><div className="row" role="radiogroup" aria-label="Icono del método">{icons.map(([k, ic]) => <button key={k} type="button" role="radio" aria-checked={m.icon === k} title={ic.name} aria-label={ic.name} onClick={() => pickIcon(k)} style={{ padding: 3, borderRadius: 12, border: m.icon === k ? '2px solid var(--ink)' : '2px solid transparent', background: 'none', cursor: 'pointer' }}><MethodIcon method={{ icon: k }} size={34} /></button>)}</div><p className="hint">El mismo icono sirve para varios métodos (por ejemplo, un Pago Móvil por banco).</p></div>
    <div className="form-grid">
      <Field label="Nombre que ve el comprador" required><Input value={m.name} onChange={e => set('name', e.target.value)} placeholder="Pago Móvil Banesco" /></Field>
      <Field label="Nota corta"><Input value={m.note} onChange={e => set('note', e.target.value)} placeholder="Con comprobante" /></Field>
      <Field label="Moneda" required hint="Debe coincidir con el método: Zelle en US$, Binance en USDT…"><Select value={m.currency} onChange={e => set('currency', e.target.value)} options={db.currencies.map(c => [c.code, `${c.code} · ${c.name}${c.active ? '' : ' (inactiva)'}`])} /></Field>
      <Field label="Banco"><Select value={m.bankCode} onChange={e => set('bankCode', e.target.value)} placeholder="No aplica" options={PAGOS.BANCOS_VE.map(([c, n]) => [c, `${n} (${c})`])} /></Field>
      <Field label="Dónde se usa"><Select value={m.channel} onChange={e => set('channel', e.target.value)} options={Object.entries(CHANNEL)} /></Field>
      <div className="field"><span className="field__label">Verificación</span><Check2 checked={m.instant} onChange={v => setM({ ...m, instant: v, requireReceipt: v ? false : m.requireReceipt })}>Al instante con la pasarela (AvilaPay o ChinChin)</Check2>{!m.instant && <Check2 checked={m.requireReceipt} onChange={v => set('requireReceipt', v)}>Pedir comprobante</Check2>}</div>
      <div className="full field"><span className="field__label">Datos para pagar</span>{m.accountInfo.map(([k, v], i) => <div key={i} className="row" style={{ flexWrap: 'nowrap' }}><Input style={{ width: 150 }} aria-label="Dato" value={k} onChange={e => set('accountInfo', m.accountInfo.map((r, j) => j === i ? [e.target.value, r[1]] : r))} /><Input style={{ flex: 1 }} aria-label={`Valor de ${k || 'dato'}`} value={v} onChange={e => set('accountInfo', m.accountInfo.map((r, j) => j === i ? [r[0], e.target.value] : r))} /><Button size="sm" variant="ghost" icon={Trash2} aria-label="Quitar dato" onClick={() => set('accountInfo', m.accountInfo.filter((_, j) => j !== i))} /></div>)}
        <div><Button size="sm" icon={Plus} onClick={() => set('accountInfo', [...m.accountInfo, ['', '']])}>Agregar dato</Button></div><p className="hint">Se validan teléfonos (0412-555-0199), correos y RIF; no se aceptan datos de prueba.</p></div>
    </div>
  </Modal>;
}

/* ---------- Monedas y tasas ---------- */
export function Monedas() {
  const db = useDB(), [rate, setRate] = useState(null), [edit, setEdit] = useState(null);
  const ves = db.currencies.find(c => c.code === 'VES');
  return <>
    <PageHead title="Monedas y tasas" sub="Una sola tasa vigente por moneda. Todo el sistema la usa." actions={<><Button icon={Plus} onClick={() => setEdit({ code: '', name: '', symbol: '', rate: '', active: true, isNew: true })}>Agregar moneda</Button><Button variant="primary" icon={RefreshCw} onClick={() => setRate({ value: String(ves.rate), source: 'BCV (manual)' })}>Actualizar tasa</Button></>} />
    <div className="grid grid--side">
      <Card body={false}><div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Moneda</th><th className="r">Tasa vigente</th><th>Fuente</th><th>Actualizada</th><th>Uso</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{db.currencies.map(c => <tr key={c.code}><td><b>{c.name}</b><small>{c.code} · {c.symbol}{c.base ? ' · moneda base' : ''}</small></td><td className="r num">{c.code === 'VES' ? <><b>{dec(c.rate)}</b> Bs por US$</> : dec(c.rate)}</td><td>{c.source}</td>
          <td className="num">{c.updatedAt ? (Date.now() - Date.parse(c.updatedAt) < 864e5 ? 'Hoy ' + time(c.updatedAt) : date(c.updatedAt)) : '—'}{c.by && <small>{c.by}</small>}</td>
          <td><Badge tone={c.base ? 'brand' : c.active ? 'ok' : undefined}>{c.base ? 'Principal' : c.active ? 'Activa' : 'Inactiva'}</Badge></td>
          <td className="r">{c.code === 'VES' ? <Button size="sm" icon={History} onClick={() => document.getElementById('hist').scrollIntoView({ behavior: 'smooth' })}>Historial</Button> : !c.base && <Button size="sm" icon={Pencil} onClick={() => setEdit({ ...c })}>Editar</Button>}</td></tr>)}</tbody></table></div></Card>
      <Card title="Historial del bolívar" id="hist" body={false}>{db.rateHistory.slice(0, 8).map((h, i) => <div className="list-row" key={i}><span className="grow num">{date(h.at)} {time(h.at)}<small>{h.source} · {h.by}</small></span><b className="num">Bs {dec(h.rate)}</b></div>)}
        <div className="card__body"><Note tone="info" icon={Shield}>Cada venta guarda la tasa con la que se cobró. Cambiar la tasa no altera ventas pasadas.</Note></div></Card>
    </div>
    {rate && <Modal title="Actualizar la tasa del bolívar" sub={`Vigente: Bs ${dec(ves.rate)} por US$ desde ${dateTime(ves.updatedAt)}`} onClose={() => setRate(null)} footer={<><Button onClick={() => setRate(null)}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.setRate(String(rate.value).replace(',', '.'), rate.source), 'Tasa actualizada en todo el sistema') && setRate(null)}>Actualizar</Button></>}>
      <Field label="Nueva tasa" required hint={+String(rate.value).replace(',', '.') > 0 ? `Un boleto de US$ 10 costará ${bs(10 * +String(rate.value).replace(',', '.'))}.` : 'Bs por cada dólar.'}><div className="input-affix"><Input data-autofocus inputMode="decimal" value={rate.value} onChange={e => setRate({ ...rate, value: e.target.value })} /><span>Bs</span></div></Field>
      <Field label="Fuente"><Select value={rate.source} onChange={e => setRate({ ...rate, source: e.target.value })} options={['BCV (manual)', 'BCV (oficial)', 'Promedio del día']} /></Field>
      <p className="subtle">Si la tasa cambia más de 25 %, el sistema pide revisarla (evita errores de tipeo).</p></Modal>}
    {edit && <Modal title={edit.isNew ? 'Agregar moneda' : `Editar ${edit.name}`} onClose={() => setEdit(null)} footer={<><Button onClick={() => setEdit(null)}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.saveCurrency(edit, edit.isNew), 'Moneda guardada') && setEdit(null)}>Guardar</Button></>}>
      <div className="form-grid"><Field label="Código" required hint="3 o 4 letras. No se repiten."><Input data-autofocus value={edit.code} disabled={!edit.isNew} onChange={e => setEdit({ ...edit, code: e.target.value.toUpperCase() })} placeholder="PEN" /></Field>
        <Field label="Nombre"><Input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Sol peruano" /></Field>
        <Field label="Símbolo"><Input value={edit.symbol} onChange={e => setEdit({ ...edit, symbol: e.target.value })} placeholder="S/" /></Field>
        <Field label="Unidades por US$" required><Input inputMode="decimal" value={edit.rate} onChange={e => setEdit({ ...edit, rate: e.target.value.replace(',', '.') })} /></Field></div>
      <Check2 checked={edit.active} onChange={v => setEdit({ ...edit, active: v })}>Activa (los métodos en esta moneda salen en la página)</Check2></Modal>}
  </>;
}

/* ---------- Pasarelas ---------- */
export function Pasarelas({ query }) {
  const db = useDB(), tab = query.p || 'avilapay', g = db.gateways[tab], st = API.gatewayState(g);
  const [form, setForm] = useState(null);
  const tone = st.key === 'activa' ? 'ok' : st.key === 'pausada' ? undefined : 'warn';
  const stepSub = (s, i) => s.done ? (s.key === 'credenciales' ? 'Cargadas · ' + Object.values(g.credentials).filter(Boolean).join(' · ') : s.key === 'prueba' ? 'Cobro de prueba aprobado' : `Listo el ${date(s.doneAt)}`) : i === st.step ? ({ credenciales: tab === 'avilapay' ? 'Falta la clave del comercio' : 'Faltan la clave API, la llave secreta y el ID de comercio', prueba: 'Se hará un cobro de Bs 1,00' }[s.key] || 'Pendiente') : 'Después del paso anterior';
  const doStep = s => { if (s.key === 'credenciales') return setForm(tab === 'avilapay' ? { merchantKey: '' } : { apiKey: '', secret: '', merchantId: '' }); const r = attempt(() => API.gatewayStep(tab, s.key)); if (r) { toast(r.key === 'activa' ? `${g.name} activa: los pagos móviles se aprueban solos` : `${s.title}: listo`); if (r.key === 'activa') confetti(); } };
  return <>
    <PageHead title="Pasarelas de pago" sub="Confirma pagos automáticamente, sin revisar capturas" />
    <div className="tabs" role="tablist" aria-label="Pasarelas">{Object.entries(db.gateways).map(([k, x]) => <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setQuery({ p: k })}>{x.name} <Badge tone={API.gatewayState(x).key === 'activa' ? 'ok' : 'warn'} plain>{API.gatewayState(x).key === 'activa' ? 'Activa' : 'Incompleta'}</Badge></button>)}</div>
    <div className="grid grid--side">
      <Card title={g.name} actions={<Badge tone={tone}>{st.label}</Badge>} body={false}>
        <div className="card__body" style={{ paddingBottom: 6 }}><p className="muted">{st.key === 'activa' ? 'Activa: los pagos móviles de tu página se verifican solos y el cliente recibe sus números al instante.' : st.key === 'pausada' ? 'Pausada: los pagos móviles vuelven a revisarse a mano.' : 'Un solo estado claro. Mientras no esté completa, los pagos móviles se verifican a mano y el Inicio lo avisa.'}</p></div>
        {g.steps.map((s, i) => <div className="list-row" key={s.key}><span className="steps" style={{ margin: 0 }}><i style={s.done ? { background: 'var(--ok-soft)', borderColor: 'var(--ok-soft)', color: 'var(--ok)' } : i === st.step ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'var(--primary-ink)' } : {}}>{s.done ? <Check size={13} aria-label="Hecho" /> : i + 1}</i></span>
          <span className="grow"><b>{s.title}</b><small>{stepSub(s, i)}</small></span>{!s.done && i === st.step && <Button size="sm" variant="brand" onClick={() => doStep(s)}>{s.key === 'prueba' ? 'Hacer prueba' : 'Continuar'}</Button>}</div>)}
        {st.key !== 'incompleta' && <div className="card__foot"><span>{st.key === 'activa' ? 'Puedes pausarla sin perder la configuración.' : 'Reactívala cuando quieras.'}</span><Button size="sm" onClick={() => { API.toggleGateway(tab); toast(`${g.name} ${st.key === 'activa' ? 'pausada' : 'activada'}`); }}>{st.key === 'activa' ? 'Pausar' : 'Activar'}</Button></div>}
      </Card>
      <Card title="Qué cambia al activarla" body={false}>{[[Zap, 'Los pagos móviles se aprueban solos'], [Check, 'El cliente recibe sus números al instante'], [BarChart3, 'Las ventas se concilian en Reportes']].map(([I, t]) => <div className="list-row" key={t}><I size={16} className="subtle" aria-hidden="true" />{t}</div>)}
        <div className="card__body"><p className="subtle">En tu página pública aparece "Pago Móvil al instante" solo mientras haya una pasarela activa.</p></div></Card>
    </div>
    {form && <Modal title={`Credenciales de ${g.name}`} sub="Se guardan cifradas; después solo se ven los últimos 4 caracteres." onClose={() => setForm(null)} footer={<><Button onClick={() => setForm(null)}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.gatewayStep(tab, 'credenciales', form), 'Credenciales cargadas') && setForm(null)}>Guardar credenciales</Button></>}>
      {tab === 'avilapay' ? <Field label="Clave del comercio" required hint="Al menos 16 caracteres. En pruebas: abcdefghijklmnop1234"><Input data-autofocus type="password" autoComplete="new-password" value={form.merchantKey} onChange={e => setForm({ merchantKey: e.target.value })} /></Field>
        : <><Field label="Clave API" required><Input data-autofocus type="password" autoComplete="new-password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} /></Field><Field label="Llave secreta" required><Input type="password" autoComplete="new-password" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} /></Field><Field label="ID de comercio" required hint="Solo números."><Input inputMode="numeric" value={form.merchantId} onChange={e => setForm({ ...form, merchantId: e.target.value })} /></Field></>}
    </Modal>}
  </>;
}

/* ---------- Sitio web: las plantillas de venta de Sevenlot ---------- */
const TEMPLATES = [
  ['estandar', 'Estándar', 'Con la marca de LottoGE: blanco, azul marino y coral.'], ['minimalista', 'Minimalista', 'Limpia y neutra; el color lo pone tu marca.'],
  ['vibrante', 'Vibrante', 'Colores fuertes y mucho movimiento.'], ['neon', 'Neón', 'Fondo oscuro con brillos, ideal de noche.'],
  ['pop', 'Pop', 'Divertida, con formas y colores alegres.'], ['experimental', 'Experimental', 'Secciones en una hoja con pestañas.']
];
const ACCENTS = [['coral', '#ff5a36', 'Coral'], ['oro', '#e9b227', 'Oro'], ['rojo', '#d42a33', 'Rojo'], ['verde', '#0e8a55', 'Verde'], ['azul', '#1d5bd0', 'Azul'], ['naranja', '#f07a1f', 'Naranja'], ['turquesa', '#14a6a0', 'Turquesa']];
export function Sitio() {
  const db = useDB(), [s, setS] = useState({ ...db.site }), [tab, setTab] = useState('plantilla'), [dev, setDev] = useState('phone'), [nonce, setNonce] = useState(0);
  const live = db.raffles.filter(r => API.onSale(r));
  const dirty = JSON.stringify(s) !== JSON.stringify(db.sitePublished);
  const timer = useRef();
  // Cada cambio se guarda como borrador y la vista previa se recarga con él.
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => { try { API.saveSite(s, false); setNonce(n => n + 1); } catch (e) { } }, 350); return () => clearTimeout(timer.current); }, [JSON.stringify(s)]);
  const src = `./fronts/${s.template}/?rifa=${s.raffleId}&borrador=1&v=${nonce}`;
  const [scale, setScale] = useState(.6), stage = useRef();
  useEffect(() => { const f = () => stage.current && setScale(Math.min(1, (stage.current.clientWidth) / 1440)); f(); addEventListener('resize', f); return () => removeEventListener('resize', f); }, [dev]);
  return <>
    <PageHead title="Sitio web" sub="Personaliza tu página pública de rifas con las plantillas de venta" actions={<><a className="btn" href={src} target="_blank" rel="noopener"><Eye size={15} />Vista previa</a><Button variant="primary" disabled={!dirty} onClick={() => attempt(() => API.saveSite(s, true), 'Cambios publicados en tu página pública')}>Publicar cambios</Button></>} />
    <div className="grid grid--sitio">
      <Card body={false}>
        <div style={{ padding: '0 18px' }}><Tabs label="Opciones del sitio" value={tab} onChange={setTab} options={[{ key: 'plantilla', label: 'Plantilla' }, { key: 'colores', label: 'Colores' }, { key: 'textos', label: 'Textos' }]} /></div>
        <div className="card__body" style={{ paddingTop: 0, display: 'grid', gap: 10 }}>
          {tab === 'plantilla' && <>{TEMPLATES.map(([k, n, d]) => <button key={k} type="button" className="tpl" aria-pressed={s.template === k} onClick={() => setS({ ...s, template: k })}><b>{n}{db.sitePublished.template === k && <Badge tone="ok" plain>Publicada</Badge>}</b><small>{d}</small></button>)}
            <Note tone="info" icon={Info}>Son las 6 plantillas de venta de Sevenlot, conectadas a este panel: lo que compres en ellas aparece en Pagos por verificar.</Note></>}
          {tab === 'colores' && <><div className="field"><span className="field__label">Color de tu marca</span><div className="swatches" role="radiogroup" aria-label="Color de la marca">{ACCENTS.map(([k, hex, n]) => <button key={k} type="button" role="radio" className="swatch" aria-checked={s.accent === k} aria-pressed={s.accent === k} aria-label={n} title={n} style={{ background: hex }} onClick={() => setS({ ...s, accent: k })} />)}
            <button type="button" role="radio" className="swatch" aria-checked={s.accent === 'propio'} aria-pressed={s.accent === 'propio'} aria-label="Color propio" title="Color propio" style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }} onClick={() => setS({ ...s, accent: 'propio' })} /></div></div>
            {s.accent === 'propio' && <Field label="Color propio" hint="En hexadecimal, por ejemplo #5638c9."><div className="row" style={{ flexWrap: 'nowrap' }}><input type="color" value={/^#[0-9a-f]{6}$/i.test(s.accentCustom) ? s.accentCustom : '#5638c9'} onChange={e => setS({ ...s, accentCustom: e.target.value })} aria-label="Elegir color" style={{ width: 44, height: 38, border: 0, background: 'none' }} /><Input value={s.accentCustom} onChange={e => setS({ ...s, accentCustom: e.target.value })} /></div></Field>}
            <p className="hint">La Vibrante mantiene su propia paleta.</p></>}
          {tab === 'textos' && <>
            <Field label="Rifa destacada" hint="La que abre tu página pública."><Select value={s.raffleId} onChange={e => setS({ ...s, raffleId: e.target.value })} options={live.map(r => [r.id, r.title])} /></Field>
            <Field label="Nombre de la marca"><Input value={s.rifero} onChange={e => setS({ ...s, rifero: e.target.value })} /></Field>
            <Field label="Instagram" hint="Donde se transmite el sorteo."><Input value={s.handle} onChange={e => setS({ ...s, handle: e.target.value })} /></Field>
            <Field label="Correo de soporte"><Input type="email" value={s.support} onChange={e => setS({ ...s, support: e.target.value })} /></Field>
            <Note tone="info" icon={Info}>Las cifras de ventas y compradores salen del sistema: no se usan números de ejemplo.</Note></>}
        </div>
        <div className="card__foot"><span>{dirty ? 'Cambios sin publicar' : `Publicado ${ago(db.sitePublishedAt)}`}</span>{dirty && <button className="link" type="button" onClick={() => setS({ ...db.sitePublished })}>Descartar</button>}</div>
      </Card>
      <div>
        <div className="row row--between" style={{ marginBottom: 10 }}><Seg label="Dispositivo" value={dev} onChange={setDev} options={[{ key: 'phone', label: <><Smartphone size={14} aria-hidden="true" /> Teléfono</> }, { key: 'desk', label: <><Monitor size={14} aria-hidden="true" /> Computadora</> }]} /><a className="subtle" href={src} target="_blank" rel="noopener">Abrir en otra pestaña <ExternalLink size={12} /></a></div>
        <div className="preview-stage" ref={stage}>{!live.length ? <Empty title="No hay rifas en venta para mostrar" /> : dev === 'phone'
          ? <div className="phone"><iframe key={src} src={src} title="Vista previa en teléfono" /></div>
          : <div className="desk-frame"><div className="desk-frame__bar"><i /><i /><i /></div><div className="desk-frame__view" style={{ aspectRatio: 'auto', height: 900 * scale }}><iframe key={src} src={src} title="Vista previa en computadora" style={{ transform: `scale(${scale})` }} /></div></div>}</div>
      </div>
    </div>
  </>;
}

/* ---------- Dominios ---------- */
export function Dominios() {
  const db = useDB(), [host, setHost] = useState(''), [del, setDel] = useState(null), [checking, setChecking] = useState('');
  const verify = d => { setChecking(d.id); setTimeout(() => { const ok = API.verifyDomain(d.id); setChecking(''); toast(ok ? `${d.host} verificado: ya abre tu página` : 'El TXT ya se ve; el CNAME aún no propaga. Intenta en unos minutos.', ok ? 'ok' : 'err'); }, 1200); };
  return <>
    <PageHead title="Dominios" sub={`Usa tu propio dominio para la página de rifas. Hoy abre en ${db.company.subdomain}.lottoge.net`} />
    <Card title="Agregar dominio"><form className="row" style={{ alignItems: 'flex-start' }} onSubmit={e => { e.preventDefault(); attempt(() => API.addDomain(host), 'Dominio agregado: configura los registros DNS') && setHost(''); }}>
      <div style={{ flex: 1, minWidth: 240 }}><Field label="Dominio" hint="Por ejemplo rifasmerida.com o www.rifasmerida.com (sin http ni barras)."><Input value={host} onChange={e => setHost(e.target.value)} placeholder="rifasmerida.com" /></Field></div><Button type="submit" variant="primary" style={{ marginTop: 24 }}>Agregar</Button></form></Card>
    <div style={{ height: 18 }} />
    {!db.domains.length ? <Card><Empty icon={Globe} title="Sin dominios propios" text="Agrega uno arriba. Después copias los registros DNS en tu proveedor (GoDaddy, Namecheap, Cloudflare…) y verificamos." /></Card>
      : db.domains.map(d => { const ok = d.records.every(r => r.ok); return <div key={d.id} style={{ marginBottom: 14 }}><Card title={<span className="row"><b>{d.host}</b><Badge tone={ok ? 'ok' : 'warn'}>{ok ? 'Verificado' : 'Esperando DNS'}</Badge></span>} actions={<>{!ok && <Button size="sm" icon={RefreshCw} disabled={checking === d.id} onClick={() => verify(d)}>{checking === d.id ? 'Verificando…' : 'Verificar ahora'}</Button>}<Button size="sm" variant="ghost" icon={Trash2} aria-label={`Quitar ${d.host}`} onClick={() => setDel(d)} /></>} body={false}>
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Tipo</th><th>Nombre</th><th>Valor</th><th>Estado</th><th><span className="sr-only">Copiar</span></th></tr></thead>
          <tbody>{d.records.map(r => <tr key={r.type}><td className="mono">{r.type}</td><td className="mono">{r.name}</td><td className="mono" style={{ wordBreak: 'break-all' }}>{r.value}</td><td><Badge tone={r.ok ? 'ok' : 'warn'}>{r.ok ? 'Correcto' : 'Pendiente'}</Badge></td><td className="r"><Button size="sm" icon={Copy} onClick={() => copy(r.value, `${r.type} copiado`)}>Copiar</Button></td></tr>)}</tbody></table></div>
        <div className="card__foot"><span>{ok ? 'Listo: el certificado de seguridad (https) se genera solo.' : 'Los cambios de DNS tardan de 5 minutos a 24 horas. Verificamos solos cada hora.'}</span>{d.checkedAt && <span>Última revisión {ago(d.checkedAt)}</span>}</div></Card></div>; })}
    {del && <Confirm title={`¿Quitar ${del.host}?`} text="Tu página seguirá abriendo en el subdominio de LottoX." confirm="Quitar" danger onClose={() => setDel(null)} onConfirm={() => { API.removeDomain(del.id); setDel(null); toast('Dominio quitado'); }} />}
  </>;
}

/* ---------- Seguridad ---------- */
export function Seguridad() {
  const db = useDB(), [f, setF] = useState({ current: '', next: '', again: '' }), [err, setErr] = useState({}), [show, setShow] = useState(false);
  const rules = [['8 caracteres o más', f.next.length >= 8], ['Una mayúscula', /[A-Z]/.test(f.next)], ['Un número', /\d/.test(f.next)], ['Un símbolo', /[^A-Za-z0-9]/.test(f.next)], ['Las dos coinciden', f.next && f.next === f.again]];
  const okAll = rules.every(r => r[1]) && f.current;
  const save = e => { e.preventDefault(); try { API.changePassword(f.current, f.next); setF({ current: '', next: '', again: '' }); setErr({}); toast('Contraseña cambiada'); } catch (x) { setErr(x.fields || {}); toast(x.message, 'err'); } };
  return <>
    <PageHead title="Seguridad" sub="Contraseña y sesiones abiertas de tu cuenta" />
    <div className="grid grid--2">
      <Card title="Cambiar contraseña"><form onSubmit={save} style={{ display: 'grid', gap: 14 }} noValidate>
        <input type="text" name="username" autoComplete="username" value={db.me.email} readOnly hidden />
        <Field label="Contraseña actual" required error={err.current} hint="En este entorno: Prueba2026! (si no la cambiaste)."><Input type={show ? 'text' : 'password'} autoComplete="current-password" value={f.current} onChange={e => setF({ ...f, current: e.target.value })} /></Field>
        <Field label="Nueva contraseña" required><Input type={show ? 'text' : 'password'} autoComplete="new-password" value={f.next} onChange={e => setF({ ...f, next: e.target.value })} /></Field>
        <Field label="Repite la nueva contraseña" required><Input type={show ? 'text' : 'password'} autoComplete="new-password" value={f.again} onChange={e => setF({ ...f, again: e.target.value })} /></Field>
        <Check2 checked={show} onChange={setShow}>Mostrar contraseñas</Check2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }} aria-label="Requisitos">{rules.map(([t, ok]) => <li key={t} className={ok ? 'ok-text' : 'muted'} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>{ok ? <Check size={14} aria-label="Cumple" /> : <Clock size={14} aria-label="Falta" />}{t}</li>)}</ul>
        <div><Button type="submit" variant="primary" disabled={!okAll}>Cambiar contraseña</Button></div>
        <p className="subtle">Misma política en el registro, en Cajas y en Usuarios. Último cambio: {date(db.security.changedAt)}.</p>
      </form></Card>
      <Card title="Sesiones abiertas" actions={db.security.sessions.length > 1 && <Button size="sm" variant="danger" icon={LogOut} onClick={() => { API.closeOtherSessions(); toast('Se cerraron las demás sesiones'); }}>Cerrar las demás</Button>} body={false}>
        {db.security.sessions.map(s => <div className="list-row" key={s.id}><Lock size={16} className="subtle" aria-hidden="true" /><span className="grow"><b>{s.device}</b>{s.current && <> <Badge tone="ok" plain>Esta sesión</Badge></>}<small>{s.place} · {s.current ? 'activa ahora' : ago(s.lastAt)}</small></span>{!s.current && <Button size="sm" onClick={() => { API.closeSession(s.id); toast('Sesión cerrada'); }}>Cerrar</Button>}</div>)}
      </Card>
    </div>
  </>;
}
