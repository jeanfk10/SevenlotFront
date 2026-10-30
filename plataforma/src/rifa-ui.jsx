// Piezas visuales de una rifa, compartidas por el operador y el superadministrador:
// tarjeta del listado, cabecera del detalle, anillo de avance y datos clave en mosaicos.
import { CalendarDays, Clock, Ticket, Hash, Trophy, ScrollText, FileCheck2, ChevronRight, Plus } from 'lucide-react';
import { API, usd, bs, num, date, dateTime, daysLeft, STATE_LABEL, RAFFLE_TONE, useCountUp } from './lib.js';
import { Badge, Thumb } from './ui.jsx';

// Texto corto de tiempo según el estado: lo primero que se lee en la tarjeta.
export function whenText(r, state) {
  if (state === 'venta') { const d = daysLeft(r.drawAt); return d <= 1 ? 'Cierra hoy' : `Faltan ${d} días`; }
  if (state === 'falta-ganador') return 'Sorteo realizado';
  if (state === 'revision') return 'En revisión';
  if (state === 'borrador') return 'Sin enviar';
  if (state === 'rechazada') return 'Por corregir';
  return r.drawAt ? 'Sorteo ' + date(r.drawAt) : '';
}

export function Ring({ value, max, size = 64, label }) {
  const pct = max ? Math.round(value / max * 100) : 0, shown = useCountUp(pct);
  return <span className="ring" style={{ '--p': shown, width: size, height: size }} role="img" aria-label={`${label || 'Vendido'}: ${pct} %`}><b>{Math.round(shown)}<small>%</small></b></span>;
}

// Tarjeta del listado: flyer grande, estado, cuánto falta, avance y una sola acción principal.
export function RaffleCard({ r, state, sold, href, action, extra, hint }) {
  const live = ['venta', 'falta-ganador', 'finalizada'].includes(state);
  return <article className={'rcard rcard--' + state} onClick={e => e.target.closest('a,button') || (location.hash = href)}>
    <div className="rcard__media"><Thumb raffle={r} lg /><span className={'rcard__state rcard__state--' + RAFFLE_TONE[state]}>{STATE_LABEL[state]}</span><span className="rcard__when"><Clock size={13} aria-hidden="true" />{whenText(r, state)}</span></div>
    <div className="rcard__body">
      <div className="rcard__title"><h3><a href={href}>{r.title}</a></h3><p>{r.prize}</p></div>
      {extra}
      {live ? <div className="rcard__progress"><Ring value={sold} max={r.total} size={56} /><div><b className="num">{num(sold)}</b><span> de {num(r.total)} vendidos</span><small>{usd(r.priceUSD, true)} por boleto</small></div></div>
        : state === 'rechazada' ? <p className="rcard__why">{r.rejectReason || 'Revisa los datos y vuelve a enviarla.'}</p>
        : <p className="rcard__hint">{hint || (state === 'revision' ? 'La revisa el superadministrador antes de salir a la venta.' : 'Continúa donde quedaste y envíala a revisión.')}</p>}
      <div className="rcard__foot">{action}<a className="rcard__more" href={href}>Ver rifa<ChevronRight size={15} aria-hidden="true" /></a></div>
    </div>
  </article>;
}
export const NewRaffleCard = ({ href = '#/rifas/nueva' }) => <a className="rcard rcard--new" href={href}><i><Plus size={26} /></i><b>Nueva rifa</b><small>En 4 pasos, con tu flyer y tus premios</small></a>;

// Cabecera del detalle: flyer a la izquierda y lo importante a la derecha, sin tablas.
export function RaffleHero({ r, state, sold, figures = [], actions, kicker }) {
  const live = ['venta', 'falta-ganador', 'finalizada'].includes(state);
  return <section className="rhero">
    <div className="rhero__media"><Thumb raffle={r} lg /></div>
    <div className="rhero__body">
      <div className="row" style={{ gap: 8 }}><Badge tone={RAFFLE_TONE[state]}>{STATE_LABEL[state]}</Badge><span className="rhero__when"><Clock size={13} aria-hidden="true" />{whenText(r, state)}</span>{kicker && <span className="subtle">{kicker}</span>}</div>
      <h1>{r.title}</h1>
      <p className="rhero__prize"><Trophy size={16} aria-hidden="true" />{r.prize}</p>
      {live && <div className="rhero__progress"><Ring value={sold} max={r.total} size={84} /><div className="grow"><p><b className="num">{num(sold)}</b> de {num(r.total)} boletos vendidos</p><div className="bar" role="progressbar" aria-valuenow={sold} aria-valuemax={r.total} aria-label="Boletos vendidos"><i style={{ width: Math.min(100, sold / r.total * 100) + '%' }} /></div><small>Quedan {num(Math.max(0, r.total - sold))} por vender</small></div></div>}
      {figures.length > 0 && <div className="rhero__figs">{figures.map(([l, v, tone]) => <div key={l} className={'fig fig--' + (tone || 'plain')}><small>{l}</small><b className="num">{v}</b></div>)}</div>}
      {actions && <div className="rhero__actions">{actions}</div>}
    </div>
  </section>;
}

// Datos de la rifa como mosaicos con icono, en vez de una lista de rótulos y valores.
export function RaffleFacts({ r, closesAt, originalDrawAt, closeMinutes }) {
  const dg = String(r.total - 1).length, pad = n => String(n).padStart(dg, '0');
  const tiles = [
    [CalendarDays, 'Sorteo', r.drawAt ? dateTime(r.drawAt) : 'Sin fecha', [r.lottery, r.lotteryTime].filter(Boolean).join(' · ') + (originalDrawAt ? ` · antes: ${date(originalDrawAt)}` : ''), 'coral'],
    [Clock, 'Cierre de ventas', closesAt ? dateTime(closesAt) : `${closeMinutes || 10} min antes`, `${closeMinutes || 10} minutos antes del sorteo`, 'sun'],
    [Ticket, 'Precio por boleto', usd(r.priceUSD), bs(r.priceUSD * API.rate()) + ' con la tasa de hoy', 'teal'],
    [Hash, 'Números', num(r.total), `Del ${pad(0)} al ${pad(r.total - 1)}`, 'sky']
  ];
  return <div className="facts">{tiles.map(([I, l, v, s, tone]) => <div key={l} className={'fact fact--' + tone}><i><I size={18} aria-hidden="true" /></i><div><small>{l}</small><b>{v}</b><span>{s}</span></div></div>)}</div>;
}

export function PrizeList({ prizes }) {
  const list = (prizes || []).filter(Boolean);
  return <ol className="prizes">{list.map((p, i) => <li key={i} className={'prize prize--' + Math.min(i + 1, 3)}><span className="prize__pos">{i + 1}º</span><b>{p}</b></li>)}</ol>;
}

export function RulesBlock({ rules, description, solvencyDoc }) {
  const list = (rules || []).filter(Boolean);
  return <div className="rules">
    {description && <p className="rules__desc">{description}</p>}
    <h3><ScrollText size={16} aria-hidden="true" />Reglas</h3>
    {list.length ? <ol>{list.map((x, i) => <li key={i}>{x}</li>)}</ol> : <p className="err-text">Sin reglas</p>}
    <p className={'rules__doc' + (solvencyDoc ? '' : ' is-missing')}><FileCheck2 size={15} aria-hidden="true" />{solvencyDoc ? <>Solvencia del premio: <b>{solvencyDoc}</b></> : 'Falta el documento de solvencia del premio'}</p>
  </div>;
}

// Vendidos de una rifa propia del entorno o de una empresa de ejemplo (de esas solo se sabe el porcentaje).
export const soldOf = r => API.raffle(r.id) ? API.raffleStats(r.id).sold : Math.round((r.soldPct || 0) * r.total / 100);
