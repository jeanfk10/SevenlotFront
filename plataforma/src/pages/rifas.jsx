import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, List, LayoutGrid, Search, Download, Trophy, Check, Clock, AlertTriangle, Store, ExternalLink, Pencil, Trash2, FlaskConical, Info } from 'lucide-react';
import { API, useDB, go, usd, bs, num, plural, date, dateTime, raffleState, STATE_LABEL, RAFFLE_TONE, LOTTERIES, attempt, toast, readImage, downloadCSV, toLocalInput, fromLocalInput, cedFmt, ORDER_STATUS, daysLeft, methodName, confetti } from '../lib.js';
import { PageHead, Card, Seg, Button, LinkButton, Badge, Bar, Thumb, Empty, Field, Input, Select, Textarea, Steps, Note, FileDrop, Check2, Tabs, Modal, Pager, Stat, Confirm } from '../ui.jsx';
import { publicUrl } from '../shell.jsx';

const nextAction = (r) => {
  const s = raffleState(r);
  if (s === 'venta') return <LinkButton size="sm" href={`#/ventas/taquilla?rifa=${r.id}`}>Vender</LinkButton>;
  if (s === 'falta-ganador') return <LinkButton size="sm" variant="brand" href={`#/rifas/ganadores?rifa=${r.id}`}>Reportar ganador</LinkButton>;
  if (s === 'rechazada' || s === 'borrador') return <LinkButton size="sm" href={`#/rifas/${r.id}/editar`}>{s === 'rechazada' ? 'Corregir' : 'Continuar'}</LinkButton>;
  return <LinkButton size="sm" href={'#/rifas/' + r.id}>Ver</LinkButton>;
};

export function Rifas({ query }) {
  const db = useDB();
  const [f, setF] = useState(query.estado || 'todas'), [q, setQ] = useState(''), [view, setView] = useState('lista');
  const st = r => raffleState(r);
  const cnt = k => db.raffles.filter(r => st(r) === k).length;
  const filters = [{ key: 'todas', label: 'Todas', count: db.raffles.length }, { key: 'venta', label: 'En venta', count: cnt('venta') }, { key: 'revision', label: 'En revisión', count: cnt('revision') }, { key: 'falta-ganador', label: 'Falta ganador', count: cnt('falta-ganador') }, { key: 'borrador', label: 'Borradores', count: cnt('borrador') }, { key: 'rechazada', label: 'Rechazadas', count: cnt('rechazada') }, { key: 'finalizada', label: 'Finalizadas', count: cnt('finalizada') }];
  const list = db.raffles.filter(r => (f === 'todas' || st(r) === f) && (!q || (r.title + r.prize).toLowerCase().includes(q.toLowerCase())));
  return <>
    <PageHead title="Rifas" sub={`${plural(db.raffles.length, 'rifa', 'rifas')} · ${cnt('venta')} en venta, ${cnt('revision')} en revisión, ${cnt('falta-ganador')} esperan ganador`} actions={<LinkButton href="#/rifas/nueva" variant="primary" icon={Plus}>Nueva rifa</LinkButton>} />
    <Card body={false}>
      <div className="toolbar"><Seg label="Filtrar por estado" options={filters} value={f} onChange={setF} />
        <div className="input-icon" style={{ marginLeft: 'auto', width: 240 }}><Search size={15} /><Input placeholder="Buscar rifa o premio" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar rifa o premio" /></div>
        <Seg label="Vista" value={view} onChange={setView} options={[{ key: 'lista', label: <><List size={15} aria-hidden="true" /><span className="sr-only">Lista</span></> }, { key: 'tarjetas', label: <><LayoutGrid size={15} aria-hidden="true" /><span className="sr-only">Tarjetas</span></> }]} />
      </div>
      {!list.length ? <Empty title={q ? `Sin resultados para «${q}»` : 'No hay rifas en este estado'} action={q && <Button onClick={() => setQ('')}>Limpiar búsqueda</Button>} /> : view === 'lista' ?
        <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Rifa</th><th>Estado</th><th>Sorteo</th><th>Precio</th><th>Vendidos</th><th><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>{list.map(r => { const s = API.raffleStats(r.id), state = st(r); return <tr key={r.id} className="clickable" onClick={e => e.target.closest('a,button') || go('/rifas/' + r.id)}>
            <td><div className="cell-main"><Thumb raffle={r} /><div><b>{r.title}</b><small>{plural(r.prizes.length, 'premio', 'premios')} · {r.lottery || 'Sin lotería'}</small></div></div></td>
            <td><Badge tone={RAFFLE_TONE[state]}>{STATE_LABEL[state]}</Badge></td>
            <td className="num">{state === 'rechazada' ? '—' : date(r.drawAt)}</td><td className="num">{usd(r.priceUSD, true)}</td>
            <td>{state === 'rechazada' ? <span className="subtle">Motivo: {r.rejectReason}</span> : s.sold ? <div style={{ maxWidth: 130 }}><Bar value={s.sold} max={r.total} label="Vendidos" /><small className="num">{num(s.sold)} / {num(r.total)}</small></div> : <span className="subtle">Sin ventas</span>}</td>
            <td className="r">{nextAction(r)}</td></tr>; })}</tbody></table></div>
        : <div className="grid grid--3" style={{ padding: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>{list.map(r => { const s = API.raffleStats(r.id), state = st(r); return <div key={r.id} className="card" style={{ padding: 14, display: 'grid', gap: 8 }}>
          <Thumb raffle={r} lg /><div className="row row--between"><b>{r.title}</b><Badge tone={RAFFLE_TONE[state]}>{STATE_LABEL[state]}</Badge></div>
          <small className="subtle">{r.prize} · {usd(r.priceUSD, true)} · sorteo {date(r.drawAt)}</small><Bar value={s.sold} max={r.total} label="Vendidos" /><small className="subtle num">{num(s.sold)} de {num(r.total)} vendidos</small>
          <div className="row"><LinkButton size="sm" href={'#/rifas/' + r.id}>Ver</LinkButton>{nextAction(r)}</div></div>; })}</div>}
    </Card>
  </>;
}

/* ---------- Nueva rifa (y corregir una rechazada o un borrador) ---------- */
const BLANK = { title: '', prize: '', prizes: [], lottery: '', drawAt: '', closeMinutes: 10, priceUSD: '', total: 1000, description: '', rules: ['El sorteo se transmite en vivo por Instagram.', ''], promotions: [], images: [], solvencyDoc: '' };
const STEPS = ['Sorteo y premios', 'Boletos y precio', 'Reglas', 'Revisar y enviar'];
const FIELD_NAMES = { images: 'Flyer', title: 'Título', drawAt: 'Fecha del sorteo', prize: 'Premio principal', lottery: 'Lotería', priceUSD: 'Precio', total: 'Cantidad de números', rules: 'Reglas', solvencyDoc: 'Documento de solvencia' };
export function NuevaRifa({ id }) {
  const db = useDB(), existing = id && API.raffle(id);
  const [r, setR] = useState(() => existing ? JSON.parse(JSON.stringify({ ...existing, prizes: existing.prizes.length > 1 ? existing.prizes : [existing.prize] })) : { ...BLANK, prizes: [''] });
  const [step, setStep] = useState(0), [errors, setErrors] = useState({}), [tried, setTried] = useState(false);
  const top = useRef();
  if (existing && !API.editable(existing)) return <><PageHead title={existing.title} /><Note tone="warn">Esta rifa no se puede editar en su estado actual ({STATE_LABEL[raffleState(existing)]}). <a href={'#/rifas/' + id}>Ver la rifa</a></Note></>;
  const set = (k, v) => { const n = { ...r, [k]: v }; setR(n); if (tried) setErrors(API.validateRaffle(n, step + 1)); };
  const v = API.validateRaffle(r);
  const next = () => {
    const e = API.validateRaffle(r, step + 1); setErrors(e); setTried(true);
    if (Object.keys(e).length) { setTimeout(() => { const el = document.querySelector('[aria-invalid="true"]'); el && el.focus(); }, 0); top.current?.scrollIntoView({ block: 'start' }); return; }
    setTried(false); setStep(step + 1); scrollTo(0, 0);
  };
  const save = submit => { try { const out = API.saveRaffle({ ...r, prize: r.prizes[0] || r.prize, id: existing ? existing.id : undefined }, submit); toast(submit ? 'Rifa enviada: queda En revisión hasta que el superadministrador la apruebe' : 'Borrador guardado'); if (submit) confetti(); go('/rifas/' + out.id); } catch (e) { if (e.fields) { setErrors(e.fields); toast('Faltan datos: ' + Object.keys(e.fields).map(k => FIELD_NAMES[k] || k).join(', '), 'err'); } else toast(e.message, 'err'); } };
  const errList = Object.keys(errors).filter(k => errors[k]);
  const closeAt = r.drawAt ? new Date(Date.parse(r.drawAt) - (r.closeMinutes || 10) * 60e3) : null;
  const checklist = [['images', 'Flyer oficial'], ['title', 'Título y premio', !v.title && !v.prize], ['drawAt', 'Fecha del sorteo'], ['lottery', 'Lotería y horario'], ['priceUSD', 'Precio y cantidad de números', !v.priceUSD && !v.total], ['solvencyDoc', 'Documento de solvencia'], ['rules', 'Al menos una regla']];
  return <>
    <div ref={top} />
    <PageHead crumbs={<><a href="#/rifas">Rifas</a><span aria-hidden="true">›</span><span>{existing ? existing.title : 'Nueva rifa'}</span></>} title={existing ? (existing.status === 'rechazada' ? 'Corregir rifa' : 'Continuar borrador') : 'Nueva rifa'} />
    <Steps steps={STEPS} current={step} />
    {existing && existing.status === 'rechazada' && <div style={{ marginBottom: 16 }}><Note tone="err"><b>CONALOT la rechazó:</b> {existing.rejectReason} Corrige y vuelve a enviarla.</Note></div>}
    <div className="grid grid--side">
      <Card body={false}>
        <div className="card__body" style={{ display: 'grid', gap: 16 }}>
          {errList.length > 0 && <Note tone="err" role="alert"><b>{plural(errList.length, 'campo obligatorio falta', 'campos obligatorios faltan')}.</b> Revisa {errList.map(k => `"${FIELD_NAMES[k] || 'Promoción'}"`).join(', ')}.</Note>}
          {step === 0 && <>
            <div className="field"><span className="field__label">Flyer<span className="req">*</span></span>
              {r.images.length ? <div className="row" style={{ alignItems: 'flex-start' }}>{r.images.map((src, i) => <div key={i} style={{ width: 140 }}><Thumb raffle={{ ...r, images: [src] }} lg /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => set('images', r.images.filter((_, j) => j !== i))}>Quitar</Button></div>)}
                {r.images.length < 4 && <div style={{ width: 160 }}><FileDrop label="Agregar foto" onFile={f => readImage(f).then(src => set('images', [...r.images, src]), e => toast(e.message, 'err'))} /></div>}</div>
                : <FileDrop error={errors.images} hint="1600 × 1000 px · JPG, PNG o WebP · máx. 5 MB" onFile={f => readImage(f).then(src => set('images', [src]), e => toast(e.message, 'err'))} />}
              {errors.images && <p className="error"><AlertTriangle size={13} />{errors.images}</p>}
              {!r.images.length && <p className="hint">¿Sin imagen a mano? <button type="button" className="link" onClick={() => set('images', ['flyer.jpg'])}>Usar el flyer de ejemplo</button></p>}
            </div>
            <Field label="Título de la rifa" required error={errors.title}><Input value={r.title} onChange={e => set('title', e.target.value)} placeholder="Gran Rifa Moto Bera 2027" maxLength={80} /></Field>
            <div className="form-grid">
              <Field label="Fecha y hora del sorteo" required error={errors.drawAt} hint="Hora de Venezuela."><Input type="datetime-local" value={toLocalInput(r.drawAt)} min={toLocalInput(new Date(Date.now() + 864e5).toISOString())} onChange={e => set('drawAt', fromLocalInput(e.target.value))} /></Field>
              <Field label="Cierre de ventas" hint={closeAt ? `Se calcula solo: cierra el ${dateTime(closeAt)}.` : 'Se calcula solo a partir de la fecha del sorteo.'}><Select value={r.closeMinutes} onChange={e => set('closeMinutes', +e.target.value)} options={[[10, '10 minutos antes del sorteo'], [30, '30 minutos antes'], [60, '1 hora antes'], [180, '3 horas antes']]} /></Field>
              <Field label="Premio principal" required error={errors.prize}><Input value={r.prizes[0] || ''} onChange={e => { const p = [...r.prizes]; p[0] = e.target.value; setR({ ...r, prizes: p, prize: e.target.value }); }} placeholder="Moto Bera SBR 2027 0 km" /></Field>
              <Field label="Lotería que define el ganador" required error={errors.lottery}><Select value={r.lottery} onChange={e => set('lottery', e.target.value)} placeholder="Elige la lotería" options={LOTTERIES.map(([n, t]) => [n, `${n} · ${t}`])} /></Field>
              {[1, 2].map(i => <Field key={i} label={`${i + 1}º premio (opcional)`}><Input value={r.prizes[i] || ''} onChange={e => { const p = [...r.prizes]; p[i] = e.target.value; setR({ ...r, prizes: p }); }} placeholder={i === 1 ? 'US$ 500' : 'US$ 200'} /></Field>)}
              <Field label="Descripción" className="full"><Textarea value={r.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Qué incluye el premio, condiciones de entrega…" /></Field>
            </div>
          </>}
          {step === 1 && <div className="form-grid">
            <Field label="Precio por boleto" required error={errors.priceUSD} hint={+r.priceUSD > 0 ? `Equivale a ${bs(r.priceUSD * API.rate())} con la tasa de hoy.` : 'En dólares; el comprador ve también el monto en Bs.'}><div className="input-affix"><Input type="number" min="0.5" step="0.5" inputMode="decimal" value={r.priceUSD} onChange={e => set('priceUSD', e.target.value)} /><span>US$</span></div></Field>
            <Field label="Cantidad de números" required error={errors.total} hint={`Del ${'0'.repeat(String(r.total - 1).length)} al ${num(r.total - 1).replace(/\./g, '')}.`}><Select value={r.total} onChange={e => set('total', +e.target.value)} options={[[100, '100 números (2 cifras)'], [1000, '1.000 números (3 cifras)'], [10000, '10.000 números (4 cifras)']]} /></Field>
            <div className="full field"><span className="field__label">Promociones por volumen (opcional)</span>
              {r.promotions.map((p, i) => <div key={i} className="row"><Input type="number" min="2" style={{ width: 100 }} aria-label="Cantidad de boletos" value={p.qty} onChange={e => { const ps = [...r.promotions]; ps[i] = { ...p, qty: +e.target.value }; set('promotions', ps); }} /><span>boletos por</span><div className="input-affix" style={{ width: 130 }}><Input type="number" min="1" aria-label="Precio de la promoción" value={p.priceUSD} onChange={e => { const ps = [...r.promotions]; ps[i] = { ...p, priceUSD: +e.target.value }; set('promotions', ps); }} /><span>US$</span></div><Button size="sm" variant="ghost" icon={Trash2} onClick={() => set('promotions', r.promotions.filter((_, j) => j !== i))}>Quitar</Button>{errors['promo' + i] && <p className="error">{errors['promo' + i]}</p>}</div>)}
              <div><Button size="sm" icon={Plus} onClick={() => set('promotions', [...r.promotions, { qty: 5, priceUSD: Math.max(1, (+r.priceUSD || 1) * 5 - (+r.priceUSD || 1) / 2) }])}>Agregar promoción</Button></div>
              <p className="hint">Se aplican en la taquilla. Recaudación posible: {usd((+r.priceUSD || 0) * r.total)}.</p></div>
          </div>}
          {step === 2 && <>
            <div className="field"><span className="field__label">Reglas y condiciones<span className="req">*</span></span>
              {r.rules.map((x, i) => <div key={i} className="row"><span className="subtle num" style={{ width: 18 }}>{i + 1}.</span><Input className="grow" style={{ flex: 1 }} aria-label={`Regla ${i + 1}`} aria-invalid={errors.rules && !r.rules.some(y => y.trim()) ? 'true' : undefined} value={x} onChange={e => { const rs = [...r.rules]; rs[i] = e.target.value; set('rules', rs); }} />{r.rules.length > 1 && <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Quitar regla ${i + 1}`} onClick={() => set('rules', r.rules.filter((_, j) => j !== i))} />}</div>)}
              {errors.rules && <p className="error"><AlertTriangle size={13} />{errors.rules}</p>}
              <div><Button size="sm" icon={Plus} onClick={() => set('rules', [...r.rules, ''])}>Agregar regla</Button></div></div>
            <div className="field"><span className="field__label">Documento de solvencia del premio<span className="req">*</span></span>
              {r.solvencyDoc ? <div className="row"><Badge tone="ok">{r.solvencyDoc}</Badge><Button size="sm" variant="ghost" onClick={() => set('solvencyDoc', '')}>Cambiar</Button></div>
                : <FileDrop accept="application/pdf,image/*" error={errors.solvencyDoc} label="Sube el documento (PDF o foto)" hint="CONALOT lo exige para aprobar la rifa." onFile={f => set('solvencyDoc', f.name)} />}
              {errors.solvencyDoc && <p className="error"><AlertTriangle size={13} />{errors.solvencyDoc}</p>}</div>
          </>}
          {step === 3 && <>
            <Note tone={Object.keys(v).length ? 'err' : 'ok'} icon={Object.keys(v).length ? AlertTriangle : Check}>{Object.keys(v).length ? <>Faltan datos: {Object.keys(v).map(k => FIELD_NAMES[k] || k).join(', ')}. Vuelve al paso que corresponde.</> : <>Todo listo para enviar a CONALOT. Mientras la revisan, la rifa queda <b>En revisión</b> y no se puede vender.</>}</Note>
            <dl className="kv kv--left" style={{ gridTemplateColumns: '180px 1fr' }}>
              <dt>Título</dt><dd>{r.title || '—'}</dd><dt>Premios</dt><dd>{r.prizes.filter(Boolean).join(' · ') || '—'}</dd><dt>Sorteo</dt><dd>{r.drawAt ? dateTime(r.drawAt) : '—'} · {r.lottery || '—'}</dd>
              <dt>Cierre de ventas</dt><dd>{closeAt ? dateTime(closeAt) : '—'}</dd><dt>Precio</dt><dd>{usd(+r.priceUSD || 0)} · {num(r.total)} números</dd>
              <dt>Promociones</dt><dd>{r.promotions.length ? r.promotions.map(p => `${p.qty} por ${usd(p.priceUSD, true)}`).join(' · ') : 'Ninguna'}</dd><dt>Reglas</dt><dd>{plural(r.rules.filter(x => x.trim()).length, 'regla', 'reglas')}</dd><dt>Solvencia</dt><dd>{r.solvencyDoc || 'Falta'}</dd>
            </dl>
          </>}
        </div>
        <div className="card__foot"><div className="row"><Button variant="ghost" onClick={() => save(false)}>Guardar borrador</Button>{step > 0 && <Button onClick={() => setStep(step - 1)}>Atrás</Button>}</div>
          {step < 3 ? <Button variant="primary" onClick={next}>Siguiente: {STEPS[step + 1].toLowerCase()}</Button> : <Button variant="primary" disabled={!!Object.keys(v).length} onClick={() => save(true)}>Enviar a CONALOT</Button>}</div>
      </Card>
      <Card title="Antes de enviar a CONALOT" body={false}>
        {checklist.map(([k, label, okOverride]) => { const ok = okOverride ?? !v[k]; return <div key={k} className="list-row" style={{ padding: '10px 18px' }}>{ok ? <Check size={15} className="ok-text" aria-label="Listo" /> : <Clock size={15} className="subtle" aria-label="Pendiente" />}<span className={ok ? 'ok-text' : 'muted'}>{label}</span></div>; })}
      </Card>
    </div>
  </>;
}

/* ---------- Ganadores por reportar ---------- */
export function Ganadores({ query }) {
  const db = useDB();
  const list = db.raffles.filter(r => raffleState(r) === 'falta-ganador').sort((a, b) => a.drawAt.localeCompare(b.drawAt));
  const [sel, setSel] = useState(query.rifa || (list[0] && list[0].id));
  const [result, setResult] = useState(''), [evidence, setEvidence] = useState(''), [notify, setNotify] = useState(true), [done, setDone] = useState(null);
  const r = list.find(x => x.id === sel) || list[0];
  useEffect(() => { setResult(''); setEvidence(''); }, [sel]);
  const w = r && result ? API.findWinner(r.id, result) : null;
  const finished = db.raffles.filter(x => x.status === 'finalizada' && x.winner).sort((a, b) => b.winner.reportedAt.localeCompare(a.winner.reportedAt)).slice(0, 5);
  const exportList = () => downloadCSV('ganadores-por-reportar.csv', [['Rifa', 'Premio', 'Cerró', 'Lotería', 'Boletos vendidos'], ...list.map(x => [x.title, x.prize, date(x.drawAt), x.lottery, API.raffleStats(x.id).sold])]);
  const publish = () => { const res = attempt(() => API.reportWinner(r.id, { result, evidence, notifyAll: notify })); if (res) { setDone({ ...res, title: r.title }); setSel(null); confetti(); } };
  return <>
    <PageHead title="Ganadores por reportar" sub={list.length ? `${plural(list.length, 'rifa cerrada espera', 'rifas cerradas esperan')} su ganador. CONALOT exige reportarlo.` : 'No hay rifas esperando ganador.'} actions={list.length > 0 && <Button icon={Download} onClick={exportList}>Exportar lista</Button>} />
    {done && <div style={{ marginBottom: 16 }}><Note tone="ok" icon={Trophy}><b>Ganador publicado en {done.title}:</b> número {done.number} · {done.sold ? `${done.name} (${cedFmt(done.cedula)})` : 'el número no se vendió (queda desierto)'}.{done.notified ? ' Se avisó a los participantes.' : ''}</Note></div>}
    {!list.length ? <Card><Empty icon={Trophy} title="Estás al día" text="Cuando una rifa cierre, aparecerá aquí para que reportes el resultado." /></Card> :
      <div className="grid grid--side grid--side-380">
        <Card body={false}><div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Rifa</th><th>Cerró</th><th>Lotería</th><th className="r">Boletos vendidos</th><th><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>{list.map(x => <tr key={x.id} className={'clickable' + (r && x.id === r.id ? ' is-sel' : '')} onClick={() => setSel(x.id)}><td><b>{x.title}</b><small>{x.prize}</small></td><td className="num">{date(x.drawAt)}<small>hace {plural(-daysLeft(x.drawAt) + 1, 'día', 'días')}</small></td><td>{x.lottery}</td><td className="r num">{num(API.raffleStats(x.id).sold)}</td><td className="r"><Button size="sm" variant={r && x.id === r.id ? 'brand' : undefined} onClick={() => setSel(x.id)}>Reportar</Button></td></tr>)}</tbody></table></div></Card>
        {r && <Card title={`Reportar ganador · ${r.title}`} body={false}>
          <div className="card__body" style={{ display: 'grid', gap: 14 }}>
            <Field label={`Resultado de ${r.lottery} del ${date(r.drawAt)}`} required hint={`Escribe el número publicado por la lotería. Juegan las últimas ${API.digits(r)} cifras.`}><Input inputMode="numeric" value={result} onChange={e => setResult(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={'4380'.slice(0, Math.max(API.digits(r), 3)) } data-autofocus /></Field>
            {w && (w.order ? <Note tone={w.sold ? 'ok' : 'warn'} icon={Trophy}><b>Boleto {w.number} · {w.sold ? 'vendido' : 'reservado sin pagar'}.</b> {w.order.name} · {cedFmt(w.order.cedula)} · {w.sold ? 'pagado y confirmado' : 'el pago no está confirmado: el boleto no participa'}.</Note>
              : <Note tone="warn"><b>Boleto {w.number} · no vendido.</b> La rifa queda desierta para este premio; así se le informa a CONALOT.</Note>)}
            <Field label="Evidencia del resultado" required>{evidence ? <div className="row"><Badge tone="ok">{evidence}</Badge><Button size="sm" variant="ghost" onClick={() => setEvidence('')}>Cambiar</Button></div> : <FileDrop accept="image/*,application/pdf" label="Sube la foto o captura del resultado" onFile={f => setEvidence(f.name)} />}</Field>
            <Check2 checked={notify} onChange={setNotify}>Avisar a todos los participantes (correo y, si está activa, la automatización "Ganador anunciado")</Check2>
            {!db.automations.find(a => a.key === 'ganador').enabled && notify && <p className="hint">La automatización de WhatsApp "Ganador anunciado" está apagada: solo saldrá el correo. <a href="#/mensajeria/automatizaciones">Activarla</a></p>}
            <Button variant="primary" block disabled={!w || !evidence} onClick={publish}>Confirmar y publicar ganador</Button>
            <p className="subtle">Los pagos que seguían por verificar en esta rifa vencen al publicar el ganador.</p>
          </div>
        </Card>}
      </div>}
    {finished.length > 0 && <div style={{ marginTop: 18 }}><Card title="Reportados recientemente" body={false}>{finished.map(x => <div className="list-row" key={x.id}><Trophy size={16} className="subtle" aria-hidden="true" /><span className="grow"><b>{x.title}</b><small>Número {x.winner.number} · {x.winner.sold ? x.winner.name : 'no vendido'} · {date(x.winner.reportedAt)}</small></span><LinkButton size="sm" href={'#/rifas/' + x.id}>Ver</LinkButton></div>)}</Card></div>}
  </>;
}

/* ---------- Detalle de la rifa ---------- */
export function RifaDetalle({ id, query }) {
  const db = useDB(), r = API.raffle(id);
  const [tab, setTab] = useState(query.tab || 'config'), [ext, setExt] = useState(false);
  if (!r) return <Card><Empty title="Esta rifa no existe" action={<LinkButton href="#/rifas">Ver rifas</LinkButton>} /></Card>;
  const state = raffleState(r), s = API.raffleStats(id), editable = API.editable(r);
  const exts = db.extensions.filter(e => e.raffleId === id), pendingExt = exts.find(e => e.status === 'pendiente'), lastExt = exts.find(e => e.status !== 'pendiente');
  return <>
    <PageHead crumbs={<><a href="#/rifas">Rifas</a><span aria-hidden="true">›</span><span>{r.id}</span></>} title={<span className="row" style={{ gap: 12 }}>{r.title}<Badge tone={RAFFLE_TONE[state]}>{STATE_LABEL[state]}</Badge></span>}
      sub={`${r.prize} · ${r.lottery || 'sin lotería'} · sorteo ${r.drawAt ? dateTime(r.drawAt) : 'sin fecha'}`}
      actions={<>{state === 'venta' && <><a className="btn" href={`./fronts/${db.sitePublished.template}/?rifa=${r.id}`} target="_blank" rel="noopener"><ExternalLink size={15} />Página de venta</a><LinkButton variant="primary" icon={Store} href={`#/ventas/taquilla?rifa=${r.id}`}>Vender</LinkButton></>}
        {state === 'venta' && <Button icon={Clock} onClick={() => setExt(true)} disabled={!!pendingExt}>{pendingExt ? 'Extensión en revisión' : 'Pedir más tiempo'}</Button>}
        {state === 'falta-ganador' && <LinkButton variant="brand" icon={Trophy} href={`#/rifas/ganadores?rifa=${r.id}`}>Reportar ganador</LinkButton>}
        {editable && <LinkButton variant="primary" icon={Pencil} href={`#/rifas/${r.id}/editar`}>{r.status === 'rechazada' ? 'Corregir y reenviar' : 'Editar borrador'}</LinkButton>}</>} />
    {r.status === 'revision' && <div style={{ marginBottom: 16 }}><Note tone="info" icon={FlaskConical}><b>En revisión.</b> La revisa el superadministrador de LottoGE (entra con su usuario y ve a Rifas). Mientras tanto no se puede editar ni vender. Atajo de prueba:{' '}
      <button className="link" type="button" onClick={() => attempt(() => API.conalotDecide(r.id, true), 'CONALOT aprobó: la rifa ya está en venta')}>Aprobar</button> ·{' '}
      <button className="link" type="button" onClick={() => attempt(() => API.conalotDecide(r.id, false, 'Falta el documento de solvencia del premio.'), 'CONALOT rechazó la rifa')}>Rechazar</button></Note></div>}
    {r.status === 'rechazada' && <div style={{ marginBottom: 16 }}><Note tone="err"><b>Rechazada:</b> {r.rejectReason}</Note></div>}
    {pendingExt && <div style={{ marginBottom: 16 }}><Note tone="info" icon={Clock}><b>Pediste mover el sorteo al {dateTime(pendingExt.requestedDate)}</b> · lo revisa el superadministrador; mientras tanto la fecha sigue siendo {dateTime(r.drawAt)}.</Note></div>}
    {!pendingExt && lastExt && Date.now() - Date.parse(lastExt.decidedAt) < 3 * 864e5 && <div style={{ marginBottom: 16 }}><Note tone={lastExt.status === 'aprobada' ? 'ok' : 'err'} icon={Clock}><b>Extensión {lastExt.status}.</b> {lastExt.status === 'aprobada' ? `El sorteo ahora es el ${dateTime(r.drawAt)} (original: ${date(r.originalDrawAt || lastExt.originalDate)}).` : lastExt.note}</Note></div>}
    {ext && <ExtensionModal r={r} onClose={() => setExt(false)} />}
    {r.winner && <div style={{ marginBottom: 16 }}><Note tone="ok" icon={Trophy}><b>Ganador: número {r.winner.number}</b> · {r.winner.sold ? `${r.winner.name} (${cedFmt(r.winner.cedula)})` : 'no vendido'} · reportado el {date(r.winner.reportedAt)} · evidencia: {r.winner.evidence}</Note></div>}
    <div className="stats" style={{ marginBottom: 18 }}>
      <Stat label="Vendidos" value={num(s.sold)} unit={`de ${num(r.total)}`} sub={`${Math.round(s.sold / r.total * 100)} %`} />
      <Stat label="Reservados" value={num(s.reserved)} sub="Pagos por verificar y abonos" />
      <Stat label="Recaudado" value={usd(s.revenueUSD, true)} sub={`de ${usd(r.priceUSD * r.total, true)} posibles`} />
      <Stat label="Compradores" value={num(s.buyers)} sub={state === 'venta' ? `Faltan ${plural(daysLeft(r.drawAt), 'día', 'días')}` : ''} />
    </div>
    <Tabs label="Secciones de la rifa" value={tab} onChange={setTab} options={[{ key: 'config', label: 'Configuración' }, { key: 'promos', label: 'Promociones' }, { key: 'boletos', label: 'Boletos' }]} />
    {tab === 'config' && <RaffleConfig r={r} editable={editable} />}
    {tab === 'promos' && <Promos r={r} />}
    {tab === 'boletos' && <Boletos r={r} />}
  </>;
}
function RaffleConfig({ r, editable }) {
  return <div className="grid grid--side">
    <Card title="Información" actions={!editable && <span className="subtle">Solo lectura en este estado</span>}>
      <dl className="kv kv--left" style={{ gridTemplateColumns: '170px 1fr' }}>
        <dt>Premios</dt><dd>{r.prizes.map((p, i) => <div key={i}>{i + 1}º · {p}</div>)}</dd><dt>Lotería</dt><dd>{r.lottery} · {r.lotteryTime}</dd>
        <dt>Sorteo</dt><dd>{dateTime(r.drawAt)}</dd><dt>Cierre de ventas</dt><dd>{dateTime(API.closesAt(r))} ({r.closeMinutes} min antes)</dd>
        <dt>Precio</dt><dd>{usd(r.priceUSD)} · {bs(r.priceUSD * API.rate())} hoy</dd><dt>Números</dt><dd>{num(r.total)} (del {API.pad(r, 0)} al {API.pad(r, r.total - 1)})</dd>
        <dt>Descripción</dt><dd>{r.description || '—'}</dd><dt>Solvencia</dt><dd>{r.solvencyDoc || <span className="err-text">Falta</span>}</dd>
        <dt>Reglas</dt><dd>{r.rules.length ? <ol style={{ margin: 0, paddingLeft: 18 }}>{r.rules.map((x, i) => <li key={i}>{x}</li>)}</ol> : <span className="err-text">Sin reglas</span>}</dd>
      </dl>
    </Card>
    <Card title="Imagen promocional"><div style={{ display: 'grid', gap: 8 }}>{r.images.length ? r.images.map((src, i) => <Thumb key={i} raffle={{ ...r, images: [src] }} lg />) : <Thumb raffle={r} lg />}</div></Card>
  </div>;
}
function Promos({ r }) {
  const [list, setList] = useState(r.promotions.map(p => ({ ...p })));
  const can = ['venta', 'borrador', 'rechazada'].includes(raffleState(r));
  return <Card title="Promociones por volumen" actions={can && <Button variant="primary" size="sm" onClick={() => attempt(() => API.savePromotions(r.id, list), 'Promociones guardadas')}>Guardar promociones</Button>}>
    <div style={{ display: 'grid', gap: 10 }}>
      {!list.length && <Empty title="No hay promociones configuradas" text="Ejemplo: 5 boletos por menos de lo que cuestan sueltos." />}
      {list.map((p, i) => <div key={i} className="row"><Input type="number" style={{ width: 100 }} disabled={!can} aria-label="Cantidad" value={p.qty} onChange={e => setList(list.map((x, j) => j === i ? { ...x, qty: +e.target.value } : x))} /><span>boletos por</span><div className="input-affix" style={{ width: 130 }}><Input type="number" disabled={!can} aria-label="Precio" value={p.priceUSD} onChange={e => setList(list.map((x, j) => j === i ? { ...x, priceUSD: +e.target.value } : x))} /><span>US$</span></div><span className="subtle">sueltos: {usd(p.qty * r.priceUSD, true)} · ahorro {usd(p.qty * r.priceUSD - p.priceUSD)}</span>{can && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setList(list.filter((_, j) => j !== i))}>Quitar</Button>}</div>)}
      {can && <div><Button size="sm" icon={Plus} onClick={() => setList([...list, { qty: 5, priceUSD: r.priceUSD * 5 - r.priceUSD / 2 }])}>Agregar promoción</Button></div>}
      <Note tone="info" icon={Info}>Se aplican en la Taquilla. Hallazgo: los fronts de venta todavía no muestran promociones, por eso en línea se cobra el precio normal.</Note>
    </div>
  </Card>;
}
function Boletos({ r }) {
  const db = useDB(), [q, setQ] = useState(''), [f, setF] = useState('todos'), [page, setPage] = useState(1);
  const rows = useMemo(() => db.orders.filter(o => o.raffleId === r.id).flatMap(o => (o.numbers.length ? o.numbers : ['—']).map(n => ({ n, o, client: API.client(o.cedula) }))), [db, r.id]);
  const list = rows.filter(x => (f === 'todos' || x.o.status === f) && (!q || x.n.includes(q) || x.o.name.toLowerCase().includes(q.toLowerCase()) || x.o.cedula.includes(q.replace(/\D/g, '') || '#'))).sort((a, b) => a.n.localeCompare(b.n));
  const per = 15, pages = Math.max(1, Math.ceil(list.length / per)), shown = list.slice((page - 1) * per, page * per);
  const exp = () => downloadCSV(`boletos-${r.id}.csv`, [['Número', 'Estado del boleto', 'Cliente', 'Cédula', 'Estado (región)', 'Método', 'Referencia', 'Orden', 'Fecha'], ...list.map(x => [x.n, ORDER_STATUS[x.o.status][0], x.o.name, cedFmt(x.o.cedula), x.client ? x.client.state : '', methodName(x.o.method), x.o.reference, x.o.id, dateTime(x.o.createdAt)])]);
  return <Card body={false}>
    <div className="toolbar"><div className="input-icon" style={{ width: 260 }}><Search size={15} /><Input placeholder="Número, nombre o cédula" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} aria-label="Buscar boletos" /></div>
      <Seg label="Estado del boleto" value={f} onChange={v => { setF(v); setPage(1); }} options={[{ key: 'todos', label: 'Todos' }, { key: 'aprobada', label: 'Vendidos' }, { key: 'pendiente', label: 'Reservados' }, { key: 'abono', label: 'Abonos' }, { key: 'rechazada', label: 'Rechazados' }]} />
      <Button size="sm" icon={Download} onClick={exp} className="hide-mobile" style={{ marginLeft: 'auto' }}>Exportar Excel</Button></div>
    {!list.length ? <Empty title="No hay boletos con ese filtro" /> : <div className="tbl-wrap"><table className="tbl tbl--cards"><thead><tr><th>Número</th><th>Estado del boleto</th><th>Cliente</th><th>Estado (región)</th><th>Método</th><th>Ref. de pago</th><th>Fecha</th></tr></thead>
      <tbody>{shown.map((x, i) => <tr key={x.o.id + x.n + i}><td className="mono"><b>{x.n}</b></td><td><Badge tone={ORDER_STATUS[x.o.status][1]}>{ORDER_STATUS[x.o.status][0]}</Badge></td><td>{x.o.name}<small>{cedFmt(x.o.cedula)}</small></td><td>{x.client ? x.client.state : '—'}</td><td>{methodName(x.o.method)}</td><td className="mono">{x.o.reference || '—'}</td><td className="num">{date(x.o.createdAt)}</td></tr>)}</tbody></table></div>}
    <Pager page={page} pages={pages} onChange={setPage} shown={shown.length} total={list.length} noun="boletos" />
  </Card>;
}

function ExtensionModal({ r, onClose }) {
  const db = useDB(), [when, setWhen] = useState(toLocalInput(new Date(Date.parse(r.drawAt) + 7 * 864e5).toISOString())), [why, setWhy] = useState('');
  const days = Math.round((Date.parse(fromLocalInput(when)) - Date.parse(r.drawAt)) / 864e5);
  return <Modal title="Pedir más tiempo para el sorteo" sub={`Fecha actual: ${dateTime(r.drawAt)}. Lo aprueba el superadministrador de LottoGE.`} onClose={onClose}
    footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => attempt(() => API.requestExtension(r.id, fromLocalInput(when), why), 'Solicitud enviada al superadministrador') && onClose()}>Enviar solicitud</Button></>}>
    <Field label="Nueva fecha y hora del sorteo" required hint={days > 0 ? `+${days} días · máximo ${db.platform.maxExtensionDays}.` : 'Debe ser después de la fecha actual.'}><Input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></Field>
    <Field label="Motivo" required hint="Ej.: faltan boletos por vender o cambió el horario de la lotería."><Textarea data-autofocus rows={3} value={why} onChange={e => setWhy(e.target.value)} /></Field>
  </Modal>;
}
