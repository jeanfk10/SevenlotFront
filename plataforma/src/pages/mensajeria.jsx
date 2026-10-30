import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Send, Zap, UserPlus, Archive, CreditCard, Plus, Pencil, AlertTriangle, HelpCircle, Shield, Bot as BotIcon, RefreshCw, Trash2, Mic, Image as ImageIcon, MessageCircle, Mail, Wifi, WifiOff, FlaskConical } from 'lucide-react';
import { API, useDB, go, setQuery, usd, num, plural, date, dateTime, time, ago, cedFmt, attempt, toast, initials, firstName, fromLocalInput, toLocalInput, downloadCSV } from '../lib.js';
import { PageHead, Card, Seg, Button, LinkButton, Badge, Note, Modal, Field, Input, Select, Textarea, Empty, Stat, Toggle, Avatar, Pager, Confirm } from '../ui.jsx';

const monthStart = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); };
const MSG_STATUS = { enviado: ['Enviado', 'info'], entregado: ['Entregado', 'ok'], leido: ['Leído', 'ok'], fallido: ['Fallido', 'err'] };
const autoName = (db, key) => (db.automations.find(a => a.key === key) || {}).name;
const kindLabel = (db, m) => m.kind === 'automatizacion' ? autoName(db, m.ref) : m.kind === 'campana' ? 'Campaña: ' + ((db.campaigns.find(c => c.id === m.ref) || {}).name || 'sin nombre') : m.kind === 'notificacion' ? 'Correo: ' + (autoName(db, m.ref) || 'aviso') : m.kind === 'manual' ? 'Respuesta en la Bandeja' : 'Bot';

/* ---------- Bandeja ---------- */
const QUICK = ['¡Hola! Tu pago está en revisión. Te confirmamos tus números en unos minutos.', 'Tu pago ya fue aprobado. Te llegaron tus números al correo. ¡Mucha suerte!', 'El sorteo es con la lotería indicada en la página, a la hora del primer premio.', 'Puedes pagar el saldo en cualquier taquilla o por Pago Móvil.'];
export function Bandeja({ query }) {
  const db = useDB();
  const [f, setF] = useState('abiertas'), [q, setQ] = useState(''), [text, setText] = useState(''), [quick, setQuick] = useState(false);
  const list = db.conversations.filter(c => (f === 'abiertas' ? c.status === 'abierta' : f === 'mias' ? c.status === 'abierta' && c.assignedTo === db.me.short : c.status === 'archivada') && (!q || ((c.name || '') + c.phone).toLowerCase().includes(q.toLowerCase())));
  const cur = db.conversations.find(c => c.id === query.c) || list[0];
  const end = useRef();
  useEffect(() => { if (cur && cur.unread) API.markRead(cur.id); end.current?.scrollIntoView({ block: 'end' }); }, [cur && cur.id, cur && cur.messages.length]);
  const client = cur && cur.cedula && API.client(cur.cedula);
  const orders = client ? db.orders.filter(o => o.cedula === client.cedula) : [];
  const pend = orders.filter(o => o.status === 'pendiente' || o.status === 'abono');
  const send = e => { e && e.preventDefault(); if (!text.trim()) return; API.sendMessage(cur.id, text); setText(''); };
  const preview = m => m.type === 'audio' ? 'Mensaje de voz' + (m.text.match(/·.*$/) ? ' ' + m.text.match(/·.*$/)[0] : '') : m.type === 'imagen' ? 'Imagen · ' + m.text.toLowerCase() : m.text;
  return <>
    <PageHead title="Bandeja" sub="Conversaciones de WhatsApp con tus clientes" actions={<Button icon={FlaskConical} onClick={() => { const c = API.simulateIncoming(); setQuery({ c: c.id }); }}>Simular mensaje entrante</Button>} />
    {!db.whatsapp.connected && <div style={{ marginBottom: 14 }}><Note tone="err" icon={WifiOff}><b>WhatsApp desconectado.</b> Los mensajes no salen. <a href="#/mensajeria/conexion">Reconectar</a></Note></div>}
    <div className="card inbox">
      <div className="inbox__list">
        <div style={{ padding: 12, display: 'grid', gap: 10, borderBottom: '1px solid var(--line)' }}>
          <div className="input-icon"><Search size={15} /><Input placeholder="Buscar conversación" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar conversación" /></div>
          <Seg label="Conversaciones" value={f} onChange={setF} options={[{ key: 'abiertas', label: 'Abiertas', count: db.conversations.filter(c => c.status === 'abierta').length }, { key: 'mias', label: 'Mías' }, { key: 'archivadas', label: 'Archivadas' }]} />
        </div>
        <ul>{list.map(c => { const last = c.messages[c.messages.length - 1]; return <li key={c.id}><button type="button" className="conv" aria-current={cur && cur.id === c.id} onClick={() => setQuery({ c: c.id })}>
          <Avatar name={c.name || '?'} /><span className="grow" style={{ minWidth: 0 }}><span className="row row--between" style={{ flexWrap: 'nowrap' }}><b>{c.name || c.phone}</b><small className="subtle">{Date.now() - Date.parse(last.at) < 864e5 ? time(last.at) : ago(last.at)}</small></span>
            <span className="row row--between" style={{ flexWrap: 'nowrap' }}><p>{last.from === 'agente' ? 'Tú: ' : ''}{preview(last)}</p>{c.unread > 0 && <span className="count" aria-label={`${c.unread} sin leer`}>{c.unread}</span>}</span></span></button></li>; })}
          {!list.length && <li><Empty title="Sin conversaciones" /></li>}</ul>
      </div>
      {cur ? <div className="inbox__chat">
        <div className="card__head"><span><b>{cur.name || 'Contacto sin nombre'}</b> <span className="subtle">{cur.phone}</span>{cur.assignedTo && <> · <Badge tone="brand" plain>Asignada a {cur.assignedTo === db.me.short ? 'ti' : cur.assignedTo}</Badge></>}</span>
          <div className="row"><Button size="sm" icon={UserPlus} onClick={() => API.assignConv(cur.id)}>{cur.assignedTo === db.me.short ? 'Soltar' : 'Asignarme'}</Button><Button size="sm" icon={Archive} onClick={() => { API.archiveConv(cur.id); toast(cur.status === 'archivada' ? 'Conversación reabierta' : 'Conversación archivada'); }}>{cur.status === 'archivada' ? 'Reabrir' : 'Archivar'}</Button></div></div>
        <div className="msgs" aria-live="polite">{cur.messages.map((m, i) => <div key={i} className={'msg' + (m.from === 'agente' ? ' msg--me' : m.from === 'bot' ? ' msg--bot' : '')}>
          {m.type === 'audio' ? <span className="row"><Mic size={14} aria-hidden="true" />{preview(m)}</span> : m.type === 'imagen' ? <span className="row"><ImageIcon size={14} aria-hidden="true" />{preview(m)}</span> : m.text}
          <small>{time(m.at)}{m.from === 'bot' ? ' · Bot' : m.by ? ' · ' + m.by : ''}</small></div>)}<div ref={end} /></div>
        {quick && <div style={{ padding: '0 12px', display: 'grid', gap: 6 }}>{QUICK.map(t => <button key={t} type="button" className="tpl" onClick={() => { setText(t); setQuick(false); }}><small style={{ color: 'var(--ink)' }}>{t}</small></button>)}</div>}
        <form className="composer" onSubmit={send}><Input className="grow" style={{ flex: 1, minWidth: 180 }} value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un mensaje…" aria-label="Mensaje" /><Button icon={Zap} onClick={() => setQuick(!quick)} aria-expanded={quick}>Respuestas rápidas</Button><Button type="submit" variant="primary" icon={Send}>Enviar</Button></form>
      </div> : <div className="inbox__chat"><Empty title="Elige una conversación" /></div>}
      <aside className="inbox__side" aria-label="Ficha del cliente">{cur && (client ? <>
        <div><p className="subtle">Cliente</p><b>{client.name}</b><p className="subtle">{cedFmt(client.cedula)}</p></div>
        <dl className="kv"><dt>Compras</dt><dd>{orders.filter(o => o.status === 'aprobada').length}</dd><dt>Pago pendiente</dt><dd className={pend.length ? 'warn-text' : ''}>{usd(pend.reduce((a, o) => a + o.amountUSD - o.paidUSD, 0), true)}</dd></dl>
        {pend.length > 0 && <><Note tone="warn" icon={CreditCard}>Tiene {plural(pend.length, 'pago', 'pagos')} {pend[0].status === 'abono' ? 'con saldo' : 'por verificar'}{pend[0].proof ? ' con comprobante' : ''}.</Note>
          <Button size="sm" onClick={() => go('/ventas/pagos', { tab: pend[0].status, orden: pend[0].id })}>Abrir pago</Button></>}
        <LinkButton size="sm" href={`#/ventas/verificador?ced=${client.cedula}`}>Ver sus boletos</LinkButton>
      </> : <><p className="subtle">Contacto no registrado</p><p>No hay un cliente con este número. Cuando compre, se vincula solo.</p></>)}</aside>
    </div>
  </>;
}

/* ---------- Resumen ---------- */
export function ResumenMsj() {
  const db = useDB(), ms = db.messages.filter(m => Date.parse(m.at) >= monthStart());
  const wa = ms.filter(m => m.channel === 'whatsapp');
  const del = wa.filter(m => m.status === 'entregado' || m.status === 'leido').length, read = wa.filter(m => m.status === 'leido').length, fail = wa.filter(m => m.status === 'fallido');
  const month = new Date().toLocaleDateString('es-VE', { month: 'long' });
  return <>
    <PageHead title="Resumen de mensajería" sub={`Uso del plan y salud de los envíos de ${month}`} />
    <div className="stats" style={{ marginBottom: 18 }}>
      <Stat label="Mensajes usados" value={num(wa.length)} unit={`de ${num(db.whatsapp.planMonthly)}`} sub={`${Math.round(wa.length / db.whatsapp.planMonthly * 100)} % del plan`} />
      <Stat label="Entregados" value={num(del)} sub={wa.length ? `${(del / wa.length * 100).toFixed(1).replace('.', ',')} %` : '—'} subTone="ok" />
      <Stat label="Leídos" value={num(read)} sub={wa.length ? `${Math.round(read / wa.length * 100)} %` : '—'} />
      <Stat label="Fallidos" value={num(fail.length)} sub={<a href="#/mensajeria/historial?estado=fallido" className="err-text">Ver motivos</a>} />
      <Stat label="Calidad del número" value={<Badge tone={db.whatsapp.connected ? 'ok' : 'err'}>{db.whatsapp.connected ? db.whatsapp.quality : 'Desconectado'}</Badge>} sub="Según Meta" />
    </div>
    <div className="grid grid--2">
      <Card title="Envíos por automatización" body={false}><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Automatización</th><th className="r">Enviados</th><th className="r">Fallidos</th></tr></thead>
        <tbody>{db.automations.map(a => { const l = wa.filter(m => m.kind === 'automatizacion' && m.ref === a.key); return <tr key={a.key}><td>{a.name}{!a.enabled && <small>Apagada</small>}</td><td className="r num">{l.length}</td><td className="r num">{l.filter(m => m.status === 'fallido').length}</td></tr>; })}
          <tr><td>Campañas</td><td className="r num">{wa.filter(m => m.kind === 'campana').length}</td><td className="r num">{wa.filter(m => m.kind === 'campana' && m.status === 'fallido').length}</td></tr>
          <tr><td>Respuestas en la Bandeja</td><td className="r num">{wa.filter(m => m.kind === 'manual').length}</td><td className="r num">{wa.filter(m => m.kind === 'manual' && m.status === 'fallido').length}</td></tr></tbody></table></div>
        <div className="card__foot"><span>Total</span><b className="num">{num(wa.length)}</b></div></Card>
      <Card title="Fallos recientes" body={false}>{fail.slice(0, 6).map(m => <div className="list-row" key={m.id}><AlertTriangle size={16} className="err-text" aria-hidden="true" /><span className="grow"><b>{kindLabel(db, m)}</b><small>{m.reason} · {m.name} · {ago(m.at)}</small></span></div>)}{!fail.length && <Empty title="Sin fallos este mes" />}</Card>
    </div>
    <p className="subtle" style={{ marginTop: 12 }}>Los correos no consumen el plan de WhatsApp: este mes salieron {num(ms.filter(m => m.channel === 'correo').length)}.</p>
  </>;
}

/* ---------- Campañas (WhatsApp y correo) ---------- */
const SEGMENTS = [['todos', 'Todos los clientes'], ['saldo', 'Con saldo pendiente'], ['nuevos', 'Nuevos este mes'], ['inactivos', 'Clientes inactivos 90 días'], ['correo', 'Todos con correo'], ['seleccionados', 'Clientes seleccionados']];
export function Campanas({ query }) {
  const db = useDB(), [ch, setCh] = useState('todas'), [st, setSt] = useState('todos');
  const [form, setForm] = useState(query.nueva ? { channel: 'whatsapp', segment: query.seleccion ? 'seleccionados' : 'todos', selected: query.seleccion ? query.seleccion.split(',') : [], name: '', body: '¡Hola {{nombre}}! ', subject: '', template: 'promocion_actividad' } : null);
  const stats = id => { const l = db.messages.filter(m => m.kind === 'campana' && m.ref === id); return { sent: l.length, del: l.filter(m => m.status === 'entregado' || m.status === 'leido').length, read: l.filter(m => m.status === 'leido').length, fail: l.filter(m => m.status === 'fallido').length }; };
  const list = db.campaigns.filter(c => (ch === 'todas' || c.channel === ch) && (st === 'todos' || c.status === st));
  const reachMail = db.clients.filter(c => c.email).length;
  return <>
    <PageHead title="Campañas" sub="Mensajes masivos por WhatsApp y correo" actions={<Button variant="primary" icon={Plus} onClick={() => setForm({ channel: ch === 'correo' ? 'correo' : 'whatsapp', segment: 'todos', selected: [], name: '', body: '¡Hola {{nombre}}! ', subject: '', template: 'promocion_actividad' })}>Nueva campaña</Button>} />
    <Card body={false}>
      <div className="toolbar"><Seg label="Canal" value={ch} onChange={setCh} options={[{ key: 'todas', label: 'Todas' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'correo', label: 'Correo' }]} /><Seg label="Estado" value={st} onChange={setSt} options={[{ key: 'todos', label: 'Todos los estados' }, { key: 'programada', label: 'Programadas' }, { key: 'enviada', label: 'Enviadas' }, { key: 'borrador', label: 'Borradores' }]} /></div>
      {!list.length ? (ch === 'correo' ? <Empty icon={Mail} title="Aún no tienes campañas de correo" text={`Puedes llegar a ${plural(reachMail, 'cliente', 'clientes')} con correo. Los correos son ilimitados en tu plan.`} action={<Button variant="primary" onClick={() => setForm({ channel: 'correo', segment: 'correo', selected: [], name: '', body: '', subject: '' })}>Crear campaña de correo</Button>} /> : <Empty title="No hay campañas con este filtro" />) :
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Campaña</th><th>Canal</th><th>Audiencia</th><th className="r">Enviados</th><th className="r">Entregados</th><th className="r">Leídos / abiertos</th><th className="r">Fallidos</th><th>Fecha</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{list.map(c => { const s = stats(c.id), sent = c.status === 'enviada'; return <tr key={c.id}><td><b>{c.name || 'Borrador sin nombre'}</b><small>{c.channel === 'correo' ? (c.subject ? `Asunto: "${c.subject}"` : '—') : c.template ? 'Plantilla: ' + c.template : '—'}</small></td>
            <td><Badge tone={c.channel === 'correo' ? 'info' : 'ok'}>{c.channel === 'correo' ? 'Correo' : 'WhatsApp'}</Badge></td><td>{c.audienceLabel || '—'}{c.segment && <small>{num(API.audience(c.segment, c.selected).length)} clientes</small>}</td>
            {sent ? <><td className="r num">{s.sent}</td><td className="r num">{s.del}</td><td className="r num">{s.read}</td><td className="r num">{s.fail}</td></> : <><td className="r">—</td><td className="r">—</td><td className="r">—</td><td className="r">—</td></>}
            <td>{sent ? <span className="num">{date(c.sentAt)}</span> : <Badge tone={c.status === 'programada' ? 'brand' : undefined}>{c.status === 'programada' ? 'Programada · ' + date(c.scheduledAt) : 'Borrador'}</Badge>}</td>
            <td className="r">{!sent && <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}><Button size="sm" icon={Pencil} onClick={() => setForm({ ...c, scheduledAt: c.scheduledAt })}>Editar</Button><Button size="sm" variant="ghost" icon={Trash2} aria-label={`Borrar ${c.name || 'borrador'}`} onClick={() => { API.deleteCampaign(c.id); toast('Campaña borrada'); }} /></div>}</td></tr>; })}</tbody></table></div>}
    </Card>
    {form && <CampaignForm init={form} onClose={() => { setForm(null); if (query.nueva) setQuery({ nueva: '', seleccion: '' }); }} />}
  </>;
}
function CampaignForm({ init, onClose }) {
  const db = useDB(), [c, setC] = useState({ ...init, scheduledAt: init.scheduledAt || '' }), set = (k, v) => setC({ ...c, [k]: v });
  const people = API.audience(c.segment, c.selected);
  const reach = c.channel === 'correo' ? people.filter(p => p.email).length : people.filter(p => p.phone && p.consent).length;
  const noConsent = c.channel === 'whatsapp' ? people.filter(p => !p.consent).length : 0;
  const run = mode => { const label = SEGMENTS.find(s => s[0] === c.segment)[1]; const r = attempt(() => API.createCampaign({ ...c, audienceLabel: label }, mode)); if (r) { toast(mode === 'ahora' ? `Campaña enviada a ${plural(r.recipients, 'cliente', 'clientes')}${r.skipped ? ` · ${r.skipped} sin consentimiento quedaron fuera` : ''}` : mode === 'programada' ? 'Campaña programada' : 'Borrador guardado'); onClose(); } };
  const used = db.messages.filter(m => m.channel === 'whatsapp' && Date.parse(m.at) >= monthStart()).length;
  return <Modal title={init.id ? 'Editar campaña' : 'Nueva campaña'} wide onClose={onClose} footer={<><Button variant="ghost" onClick={() => run('borrador')}>Guardar borrador</Button><Button onClick={() => run('programada')} disabled={!c.scheduledAt}>Programar</Button><Button variant="primary" icon={Send} onClick={() => run('ahora')}>Enviar ahora a {num(reach)}</Button></>}>
    <div className="form-grid">
      <Field label="Nombre de la campaña" required><Input data-autofocus value={c.name} onChange={e => set('name', e.target.value)} placeholder="Última semana de la rifa" /></Field>
      <div className="field"><span className="field__label">Canal</span><Seg label="Canal" value={c.channel} onChange={v => set('channel', v)} options={[{ key: 'whatsapp', label: 'WhatsApp' }, { key: 'correo', label: 'Correo' }]} /></div>
      <Field label="Audiencia" hint={`${plural(people.length, 'cliente', 'clientes')} en el segmento · le llega a ${num(reach)}${noConsent ? ` (${noConsent} sin consentimiento para promociones quedan fuera)` : ''}.`}><Select value={c.segment} onChange={e => set('segment', e.target.value)} options={SEGMENTS.filter(s => s[0] !== 'seleccionados' || c.selected.length)} /></Field>
      {c.channel === 'whatsapp' ? <Field label="Plantilla aprobada por Meta"><Select value={c.template} onChange={e => set('template', e.target.value)} options={[['promocion_actividad', 'Promoción · promocion_actividad'], ['recordatorio_pago', 'Recordatorio de pago · recordatorio_pago'], ['nueva_rifa', 'Nueva rifa · nueva_rifa']]} /></Field>
        : <Field label="Asunto" required><Input value={c.subject} onChange={e => set('subject', e.target.value)} placeholder="¡Se viene una moto!" /></Field>}
      <Field label="Mensaje" required className="full" hint="Usa {{nombre}} para el primer nombre del cliente."><Textarea rows={4} value={c.body} onChange={e => set('body', e.target.value)} /></Field>
      <Field label="Programar para (opcional)" hint="Hora de Venezuela."><Input type="datetime-local" value={toLocalInput(c.scheduledAt)} onChange={e => set('scheduledAt', fromLocalInput(e.target.value))} /></Field>
    </div>
    {c.channel === 'whatsapp' && <Note tone={used + reach > db.whatsapp.planMonthly ? 'err' : 'info'} icon={HelpCircle}>Consume {num(reach)} mensajes del plan: llevas {num(used)} de {num(db.whatsapp.planMonthly)} este mes.</Note>}
    <div><p className="field__label" style={{ marginBottom: 6 }}>Vista previa</p><div className="msg msg--bot" style={{ maxWidth: '100%' }}>{c.body.replace(/\{\{nombre\}\}/g, firstName(people[0] ? people[0].name : 'María')) || '…'}</div></div>
  </Modal>;
}

/* ---------- Automatizaciones ---------- */
export function Automatizaciones() {
  const db = useDB(), [edit, setEdit] = useState(null);
  const count = key => db.messages.filter(m => m.kind === 'automatizacion' && m.ref === key && Date.parse(m.at) >= monthStart()).length;
  return <>
    <PageHead title="Automatizaciones" sub="Mensajes que se envían solos cuando pasa algo en el sistema" />
    <Card body={false}>{db.automations.map(a => <div key={a.key} className="list-row"><Toggle checked={a.enabled} onChange={() => { API.toggleAutomation(a.key); toast(`${a.name}: ${a.enabled ? 'apagada' : 'activada'}`); }} label={`Activar ${a.name}`} />
      <span className="grow"><b>{a.name}</b><small>{a.when} · plantilla <span className="mono">{a.template}</span></small></span><span className="subtle num hide-mobile">{count(a.key)} este mes</span><Button size="sm" icon={Pencil} onClick={() => setEdit(a)}>Editar mensaje</Button></div>)}</Card>
    <div style={{ marginTop: 14 }}><Note icon={HelpCircle}>Cada mensaje automático consume del plan ({num(db.whatsapp.planMonthly)} al mes en Pro). Al comprador siempre le llega además la confirmación por correo.</Note></div>
    {edit && <AutoForm a={edit} onClose={() => setEdit(null)} />}
  </>;
}
function AutoForm({ a, onClose }) {
  const [body, setBody] = useState(a.body);
  const vars = (a.body.match(/\{\{\w+\}\}/g) || []).filter((v, i, l) => l.indexOf(v) === i);
  return <Modal title={`Editar mensaje · ${a.name}`} sub={a.when} onClose={onClose} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.saveAutomation(a.key, body), 'Mensaje guardado') && onClose()}>Guardar</Button></>}>
    <Field label="Mensaje" required hint={`Variables disponibles: ${vars.join(' ')}`}><Textarea data-autofocus rows={5} value={body} onChange={e => setBody(e.target.value)} /></Field>
    {vars.some(v => !body.includes(v)) && <Note tone="warn">Quitaste {vars.filter(v => !body.includes(v)).join(', ')}. Meta rechaza plantillas con variables vacías; revisa que el mensaje siga teniendo sentido.</Note>}
  </Modal>;
}

/* ---------- Historial ---------- */
export function Historial({ query }) {
  const db = useDB(), [st, setSt] = useState(query.estado || 'todos'), [chn, setChn] = useState('todos'), [q, setQ] = useState(''), [page, setPage] = useState(1);
  const list = db.messages.filter(m => (st === 'todos' || m.status === st || (st === 'entregado' && m.status === 'leido')) && (chn === 'todos' || m.channel === chn) && (!q || (m.name + m.to).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.at.localeCompare(a.at));
  const per = 15, pages = Math.max(1, Math.ceil(list.length / per)), shown = list.slice((page - 1) * per, page * per);
  return <>
    <PageHead title="Historial" sub="Cada mensaje enviado, con su estado y el motivo si falló" actions={<Button onClick={() => downloadCSV('historial-mensajes.csv', [['Fecha', 'Canal', 'Destinatario', 'Para', 'Origen', 'Plantilla', 'Estado', 'Motivo'], ...list.map(m => [dateTime(m.at), m.channel, m.name, m.to, kindLabel(db, m), m.template, MSG_STATUS[m.status][0], m.reason])])}>Exportar</Button>} />
    <Card body={false}>
      <div className="toolbar"><Seg label="Estado" value={st} onChange={v => { setSt(v); setPage(1); }} options={[{ key: 'todos', label: 'Todos' }, { key: 'entregado', label: 'Entregados' }, { key: 'leido', label: 'Leídos' }, { key: 'fallido', label: 'Fallidos', count: db.messages.filter(m => m.status === 'fallido').length }]} />
        <Seg label="Canal" value={chn} onChange={v => { setChn(v); setPage(1); }} options={[{ key: 'todos', label: 'Todos' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'correo', label: 'Correo' }]} />
        <div className="input-icon" style={{ marginLeft: 'auto', width: 220 }}><Search size={15} /><Input placeholder="Cliente o número" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} aria-label="Buscar en el historial" /></div></div>
      {!list.length ? <Empty title="No hay mensajes con este filtro" /> : <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Fecha</th><th>Para</th><th>Origen</th><th>Canal</th><th>Estado</th></tr></thead>
        <tbody>{shown.map(m => <tr key={m.id}><td className="num" style={{ whiteSpace: 'nowrap' }}>{dateTime(m.at)}</td><td><b>{m.name}</b><small>{m.to}</small></td><td>{kindLabel(db, m)}{m.template && <small className="mono">{m.template}</small>}</td><td>{m.channel === 'correo' ? 'Correo' : 'WhatsApp'}</td>
          <td><Badge tone={MSG_STATUS[m.status][1]}>{MSG_STATUS[m.status][0]}</Badge>{m.reason && <small className="err-text">{m.reason}</small>}</td></tr>)}</tbody></table></div>}
      <Pager page={page} pages={pages} onChange={setPage} shown={shown.length} total={list.length} noun="mensajes" />
    </Card>
  </>;
}

/* ---------- Contactos (la misma base que Clientes) ---------- */
export function Contactos() {
  const db = useDB(), [q, setQ] = useState(''), [page, setPage] = useState(1);
  const counts = useMemo(() => { const m = {}; db.messages.forEach(x => { if (x.channel === 'whatsapp') m[x.cedula] = (m[x.cedula] || 0) + 1; }); return m; }, [db]);
  const list = db.clients.filter(c => c.phone && (!q || (c.name + c.phone).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.name.localeCompare(b.name));
  const per = 15, pages = Math.max(1, Math.ceil(list.length / per)), shown = list.slice((page - 1) * per, page * per);
  return <>
    <PageHead title="Contactos" sub={`${plural(list.length, 'contacto', 'contactos')} con WhatsApp · sincronizados con Clientes, sin duplicar`} />
    <Card body={false}>
      <div className="toolbar"><div className="input-icon" style={{ width: 260 }}><Search size={15} /><Input placeholder="Nombre o teléfono" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} aria-label="Buscar contactos" /></div><span className="subtle" style={{ marginLeft: 'auto' }}>{db.clients.filter(c => c.phone && c.consent).length} aceptan promociones</span></div>
      <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Contacto</th><th>Teléfono</th><th className="r">Mensajes</th><th>Acepta promociones</th></tr></thead>
        <tbody>{shown.map(c => <tr key={c.cedula}><td><b>{c.name}</b><small>{cedFmt(c.cedula)}</small></td><td>{c.phone}</td><td className="r num">{counts[c.cedula] || 0}</td>
          <td><div className="row"><Toggle checked={c.consent} onChange={v => { API.setConsent(c.cedula, v); toast(v ? `${firstName(c.name)} acepta promociones` : `${firstName(c.name)} ya no recibe promociones`); }} label={`Consentimiento de ${c.name} para promociones`} /><span className="subtle">{c.consent ? 'Sí' : 'No'}</span></div></td></tr>)}</tbody></table></div>
      <Pager page={page} pages={pages} onChange={setPage} shown={shown.length} total={list.length} noun="contactos" />
    </Card>
    <p className="subtle" style={{ marginTop: 10 }}>Meta exige consentimiento para mensajes promocionales. Las confirmaciones de compra sí llegan a todos.</p>
  </>;
}

/* ---------- Agentes ---------- */
export function Agentes() {
  const db = useDB(), [add, setAdd] = useState(false), [f, setF] = useState({ name: '', email: '' });
  const expired = db.agents.filter(a => Date.parse(a.expiresAt) < Date.now());
  return <>
    <PageHead title="Agentes" sub="Personas del equipo que atienden la Bandeja de WhatsApp. Su acceso vence cada 90 días." actions={<Button variant="primary" icon={Plus} onClick={() => setAdd(true)}>Agregar agente</Button>} />
    {expired.length > 0 && <div style={{ marginBottom: 14 }}><Note tone="warn"><b>{plural(expired.length, 'agente tiene', 'agentes tienen')} el acceso vencido</b> y no pueden atender. <button className="link" type="button" onClick={() => { API.renewAgents(expired.map(a => a.id)); toast(`${plural(expired.length, 'acceso renovado', 'accesos renovados')} por 90 días`); }}>Renovar todos</button></Note></div>}
    <Card body={false}><div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Agente</th><th>Acceso</th><th className="r">Chats atendidos</th><th><span className="sr-only">Acciones</span></th></tr></thead>
      <tbody>{db.agents.map(a => { const exp = Date.parse(a.expiresAt) < Date.now(); return <tr key={a.id}><td><b>{a.name}</b><small>{a.email}</small></td><td><Badge tone={exp ? 'err' : 'ok'}>{exp ? 'Vencido el ' + date(a.expiresAt) : 'Activo hasta el ' + date(a.expiresAt)}</Badge></td><td className="r num">{a.chats}</td>
        <td className="r"><div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}><Button size="sm" icon={RefreshCw} onClick={() => { API.renewAgents([a.id]); toast(`Acceso de ${a.name} renovado por 90 días`); }}>Renovar</Button><Button size="sm" variant="ghost" icon={Trash2} aria-label={`Quitar a ${a.name}`} onClick={() => { API.removeAgent(a.id); toast('Agente quitado'); }} /></div></td></tr>; })}</tbody></table></div></Card>
    {add && <Modal title="Agregar agente" onClose={() => setAdd(false)} footer={<><Button onClick={() => setAdd(false)}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.addAgent(f.name, f.email), 'Agente agregado: recibe la invitación por correo') && (setAdd(false), setF({ name: '', email: '' }))}>Agregar</Button></>}>
      <Field label="Nombre" required><Input data-autofocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field><Field label="Correo" required><Input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} autoComplete="off" /></Field></Modal>}
  </>;
}

/* ---------- Bot ---------- */
export function Bot() {
  const db = useDB(), [b, setB] = useState(JSON.parse(JSON.stringify(db.bot)));
  const [chat, setChat] = useState(() => [{ from: 'bot', text: db.bot.welcome }]), [ctx, setCtx] = useState({}), [input, setInput] = useState('');
  const set = (k, v) => setB({ ...b, [k]: v });
  const say = e => { e.preventDefault(); const t = input.trim(); if (!t) return; const r = API.botReply(t, ctx); setChat([...chat, { from: 'cliente', text: t }, { from: 'bot', text: r.text + (r.handoff ? ' (la conversación pasa a la Bandeja)' : '') }]); setCtx(r.ctx); setInput(''); };
  const dirty = JSON.stringify(b) !== JSON.stringify(db.bot);
  return <>
    <PageHead title="Asistente automático" sub="Respuestas del bot cuando no hay un agente disponible" actions={<><Button onClick={() => { setChat([{ from: 'bot', text: b.welcome }]); setCtx({}); }}>Reiniciar prueba</Button><Button variant="primary" disabled={!dirty} onClick={() => attempt(() => API.saveBot(b), 'Bot guardado')}>Guardar</Button></>} />
    <div className="grid grid--side grid--side-340">
      <Card><div style={{ display: 'grid', gap: 14 }}>
        <div className="row"><Toggle checked={b.enabled} onChange={v => set('enabled', v)} label="Bot activo" /><span>{b.enabled ? 'El bot responde cuando no hay agentes' : 'Bot apagado'}</span></div>
        <Field label="Mensaje de bienvenida" required><Textarea rows={3} value={b.welcome} onChange={e => set('welcome', e.target.value)} /></Field>
        <div className="form-grid"><Field label="Horario de atención humana"><Select value={b.hours} onChange={e => set('hours', e.target.value)} options={['Lunes a sábado · 8:00 a. m. – 8:00 p. m.', 'Lunes a viernes · 8:00 a. m. – 6:00 p. m.', 'Todos los días · 8:00 a. m. – 10:00 p. m.']} /></Field>
          <Field label="Fuera de horario"><Select value={b.outOfHours} onChange={e => set('outOfHours', e.target.value)} options={['Responder y crear conversación pendiente', 'Responder solo con el bot', 'No responder']} /></Field></div>
        <div className="field"><span className="field__label">Respuestas</span>{b.responses.map((r, i) => <div key={r.key} className="card" style={{ padding: 12, display: 'grid', gap: 8 }}><div className="row"><b>{r.key} · {r.title}</b><span className="subtle">{r.action}</span></div>
          <Field label={`Texto de la opción ${r.key}`}><Textarea rows={2} value={r.text} onChange={e => set('responses', b.responses.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} /></Field></div>)}</div>
        <Note icon={Shield}>Recuerda las políticas de Meta: sin spam, sin promesas falsas y con opción para dejar de recibir mensajes.</Note>
      </div></Card>
      <Card title="Probar bot" body={false}><div className="msgs" style={{ minHeight: 360, maxHeight: 460 }}>{chat.map((m, i) => <div key={i} className={'msg' + (m.from === 'bot' ? ' msg--bot' : ' msg--me')}>{m.text}<small>{m.from === 'bot' ? 'Bot' : 'Cliente (tú)'}</small></div>)}</div>
        <form className="composer" onSubmit={say}><Input className="grow" style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe 1, 2 o 3… o una cédula" aria-label="Mensaje de prueba" /><Button type="submit" variant="primary" icon={Send}>Enviar</Button></form>
        <p className="subtle" style={{ padding: '0 12px 12px' }}>Usa los datos del sistema: prueba "2" y luego 31689392.</p></Card>
    </div>
  </>;
}

/* ---------- Conexión ---------- */
export function Conexion() {
  const db = useDB(), w = db.whatsapp, [ask, setAsk] = useState(false);
  const used = db.messages.filter(m => m.channel === 'whatsapp' && Date.parse(m.at) >= monthStart()).length;
  return <>
    <PageHead title="Conexión de WhatsApp" sub="Estado del número, calidad y límites de Meta en un solo lugar" />
    <div className="grid grid--side">
      <Card title={w.connected ? 'Número conectado' : 'Número desconectado'} actions={<Badge tone={w.connected ? 'ok' : 'err'}>{w.connected ? 'Conectado' : 'Desconectado'}</Badge>}>
        <dl className="kv kv--left" style={{ gridTemplateColumns: '200px 1fr' }}><dt>Número</dt><dd>{w.number}</dd><dt>Nombre visible</dt><dd>{w.displayName}</dd><dt>Calidad según Meta</dt><dd>{w.connected ? <Badge tone="ok">{w.quality}</Badge> : '—'}</dd>
          <dt>Límite de Meta</dt><dd>{w.tier}</dd><dt>Uso del plan este mes</dt><dd>{num(used)} de {num(w.planMonthly)} mensajes (igual que en Resumen)</dd><dt>{w.connected ? 'Conectado desde' : 'Última conexión'}</dt><dd>{date(w.connectedAt)}</dd></dl>
      </Card>
      <div className="stack">
        <Card title="Acciones"><div style={{ display: 'grid', gap: 10 }}>
          {!w.connected && <Button variant="primary" icon={Wifi} onClick={() => { API.setWhatsapp(true); toast('WhatsApp reconectado'); }}>Reconectar</Button>}
          <a className="btn" href="#/mensajeria/bot">Configurar el bot</a><a className="btn" href="#/mensajeria/automatizaciones">Automatizaciones</a>
        </div></Card>
        {w.connected && <Card title="Zona de riesgo"><p className="muted" style={{ marginBottom: 10 }}>Si desconectas el número, dejan de salir confirmaciones, campañas y respuestas.</p><Button variant="danger" icon={WifiOff} onClick={() => setAsk(true)}>Desconectar WhatsApp</Button></Card>}
      </div>
    </div>
    {ask && <Confirm title="¿Desconectar WhatsApp?" text="Dejan de salir todos los mensajes automáticos y las respuestas de la Bandeja hasta que lo reconectes." confirm="Desconectar" danger onClose={() => setAsk(false)} onConfirm={() => { API.setWhatsapp(false); setAsk(false); toast('WhatsApp desconectado'); }} />}
  </>;
}
