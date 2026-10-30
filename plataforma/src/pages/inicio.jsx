import { useState, useMemo } from 'react';
import { Plus, Store, Trophy, CreditCard, Plug, Users, AlertTriangle, ChevronRight } from 'lucide-react';
import { API, useDB, usd, bs, num, plural, greeting, longDate, date, dateTime, shortDate, firstName, raffleState, pendingTasks, daysLeft, methodName, initials, ago, compact } from '../lib.js';
import { PageHead, Card, Stat, Seg, LinkButton, Bar, Thumb, Empty, Badge, Avatar, Input } from '../ui.jsx';

const DAY = 864e5;
const TICON = { trophy: Trophy, card: CreditCard, plug: Plug, users: Users, alert: AlertTriangle };
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function Inicio() {
  const db = useDB();
  const [period, setPeriod] = useState('30');
  const now = Date.now(), today = startOfDay(now);
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const prevStart = new Date(monthStart); prevStart.setMonth(prevStart.getMonth() - 1);
  const ok = db.orders.filter(o => o.status === 'aprobada' || o.status === 'abono');
  const paidOf = o => o.status === 'aprobada' ? o.amountUSD : o.paidUSD;
  const sum = (list, f = paidOf) => list.reduce((a, o) => a + f(o), 0);
  const todayList = ok.filter(o => Date.parse(o.createdAt) >= today);
  const month = ok.filter(o => Date.parse(o.createdAt) >= monthStart.getTime());
  const prevSameDays = ok.filter(o => { const t = Date.parse(o.createdAt); return t >= prevStart.getTime() && t < prevStart.getTime() + (now - monthStart.getTime()); });
  const growth = sum(prevSameDays) ? Math.round((sum(month) / sum(prevSameDays) - 1) * 100) : null;
  const pend = db.orders.filter(o => o.status === 'pendiente'), abonos = db.orders.filter(o => o.status === 'abono');
  const owed = sum(pend, o => o.amountUSD) + sum(abonos, o => o.amountUSD - o.paidUSD);
  const live = db.raffles.filter(r => raffleState(r) === 'venta');
  const main = live.find(r => r.id === db.sitePublished.raffleId) || live[0];
  const mainStats = main && API.raffleStats(main.id);
  const tasks = pendingTasks(db);
  const rate = API.rate();
  const days = { '30': 30, '90': 90, 'año': 365 }[period];
  const series = useMemo(() => {
    const buckets = period === 'año' ? 12 : days, out = [];
    if (period === 'año') {
      for (let i = 11; i >= 0; i--) { const d = new Date(now); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - i); const e = new Date(d); e.setMonth(e.getMonth() + 1); out.push({ label: d.toLocaleDateString('es-VE', { month: 'short' }).replace('.', ''), from: d.getTime(), to: e.getTime() }); }
    } else for (let i = buckets - 1; i >= 0; i--) { const from = today - i * DAY; out.push({ label: shortDate(from), from, to: from + DAY }); }
    out.forEach(b => { const l = ok.filter(o => { const t = Date.parse(o.createdAt); return t >= b.from && t < b.to; }); b.usd = sum(l); b.count = l.length; b.bs = l.reduce((a, o) => a + paidOf(o) * o.rate, 0); });
    return out;
  }, [db, period]);
  const max = Math.max(1, ...series.map(s => s.usd));
  const [tip, setTip] = useState(null);
  const latest = db.orders.filter(o => o.status === 'aprobada' || o.status === 'abono').slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const pendTotal = tasks.length;
  return <>
    <PageHead title={`${greeting()}, ${firstName(db.me.short)}`} sub={<>{longDate(now).replace(/^\w/, c => c.toUpperCase())} · {plural(live.length, 'rifa en venta', 'rifas en venta')} · {plural(pendTotal, 'tarea pendiente', 'tareas pendientes')}</>}
      actions={<LinkButton href="#/rifas/nueva" variant="primary" icon={Plus}>Nueva rifa</LinkButton>} />
    <div className="grid grid--side">
      <div className="stack">
        <div className="stats">
          <Stat label="Vendido hoy" value={usd(sum(todayList), true)} unit={bs(sum(todayList, o => paidOf(o) * o.rate), true)} sub={todayList.length ? `${plural(todayList.length, 'venta', 'ventas')} · ${todayList.filter(o => o.channel === 'taquilla').length} en taquilla` : 'Sin ventas todavía'} subTone={todayList.length ? 'ok' : ''} />
          <Stat label={`Vendido en ${new Date(now).toLocaleDateString('es-VE', { month: 'long' })}`} value={usd(sum(month), true)} unit={bs(sum(month, o => paidOf(o) * o.rate), true)} sub={growth == null ? 'Primer mes con ventas' : `${growth >= 0 ? '+' : ''}${growth} % vs. mismo tramo del mes anterior`} subTone={growth >= 0 ? 'ok' : 'err'} />
          <Stat label="Por cobrar" value={usd(owed, true)} unit={plural(pend.length + abonos.length, 'venta', 'ventas')} sub={`${pend.length} por verificar · ${abonos.length} abonos`} />
          {main ? <Stat label="Boletos disponibles" value={num(mainStats.available)} unit={`de ${num(main.total)}`} sub={main.title} /> : <Stat label="Boletos disponibles" value="—" sub="No hay rifas en venta" />}
        </div>
        <Card title="Ventas" actions={<><span className="subtle hide-mobile">US$ · cada venta con la tasa de su día</span><Seg label="Periodo" value={period} onChange={setPeriod} options={[{ key: '30', label: '30 días' }, { key: '90', label: '90 días' }, { key: 'año', label: 'Año' }]} /></>}>
          <div className="chart" role="img" aria-label={`Ventas de los últimos ${period === 'año' ? '12 meses' : days + ' días'}: total ${usd(series.reduce((a, s) => a + s.usd, 0))}`}>
            {series.map((s, i) => <button key={i} type="button" className={s.usd ? '' : 'is-zero'} style={{ height: Math.max(3, s.usd / max * 100) + '%' }} aria-label={`${s.label}: ${usd(s.usd)}`} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(i)} onBlur={() => setTip(null)}>
              {tip === i && <span className="chart-tip">{s.label} · {usd(s.usd)} · {bs(s.bs, true)} · {plural(s.count, 'venta', 'ventas')}</span>}
            </button>)}
          </div>
          <div className="chart-axis"><span>{series[0].label}</span><span>{series[Math.floor(series.length / 3)].label}</span><span>{series[Math.floor(series.length * 2 / 3)].label}</span><span>{series[series.length - 1].label}</span></div>
        </Card>
        <Card title={live.length > 1 ? 'Rifas en venta' : 'Rifa en venta'} body={false}>
          {live.length ? live.map(r => { const st = API.raffleStats(r.id); return <div key={r.id} className="list-row" style={{ alignItems: 'center' }}>
            <div style={{ width: 92 }}><Thumb raffle={r} lg /></div>
            <div className="grow"><b>{r.title}</b><small>{plural(r.prizes.length, 'premio', 'premios')} · {r.lottery} · {usd(r.priceUSD, true)} por boleto · sorteo {dateTime(r.drawAt)}</small>
              <div style={{ margin: '8px 0 4px', maxWidth: 360 }}><Bar value={st.sold} max={r.total} label="Vendidos" /></div><small>{num(st.sold)} de {num(r.total)} vendidos · faltan {plural(daysLeft(r.drawAt), 'día', 'días')}</small></div>
            <LinkButton size="sm" href={`#/ventas/taquilla?rifa=${r.id}`} icon={Store}>Vender</LinkButton><LinkButton size="sm" href={'#/rifas/' + r.id}>Ver rifa</LinkButton>
          </div>; }) : <Empty title="No hay rifas en venta" text="Crea una rifa y envíala a CONALOT." action={<LinkButton href="#/rifas/nueva" variant="primary">Nueva rifa</LinkButton>} />}
        </Card>
      </div>
      <div className="stack">
        <Card title="Pendiente de ti" body={false}>
          {tasks.length ? tasks.map(t => { const I = TICON[t.icon]; return <div className="list-row" key={t.id}><I size={17} aria-hidden="true" className={t.tone + '-text'} /><span className="grow"><b>{t.title}</b><small>{t.sub}</small></span><LinkButton size="sm" href={'#' + t.to}>{t.action}</LinkButton></div>; })
            : <Empty title="Nada pendiente" text="Estás al día." />}
        </Card>
        <Card title="Últimas ventas" actions={<a className="subtle" href="#/ventas/reportes">Ver todas</a>} body={false}>
          {latest.map(o => <div className="list-row" key={o.id}><Avatar name={o.name} /><span className="grow"><b>{o.name}</b><small>{o.numbers.length === 1 ? 'Boleto ' + o.numbers[0] : plural(o.qty, 'boleto', 'boletos')} · {o.channel === 'taquilla' ? 'Taquilla · ' : ''}{o.status === 'abono' ? 'Abono ' + Math.round(o.paidUSD / o.amountUSD * 100) + ' %' : methodName(o.method)}</small></span><b className="num">{usd(o.status === 'abono' ? o.paidUSD : o.amountUSD, true)}</b></div>)}
        </Card>
        <p className="subtle">Tasa vigente Bs {num(rate)},00 por US$. Los montos en Bs usan la tasa del día de cada venta.</p>
      </div>
    </div>
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
