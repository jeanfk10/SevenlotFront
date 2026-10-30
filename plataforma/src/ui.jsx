// Componentes base accesibles: botones con texto, rótulos asociados, errores junto al campo, foco visible.
import { useEffect, useId, useRef, cloneElement, isValidElement, Children } from 'react';
import { X, AlertTriangle, Inbox, Check, Upload } from 'lucide-react';
import { PAGOS, initials, useCountUp, reduceMotion } from './lib.js';

export function Button({ variant, size, icon: Icon, children, block, className = '', ...p }) {
  const cls = ['btn', variant && 'btn--' + variant, size && 'btn--' + size, block && 'btn--block', className].filter(Boolean).join(' ');
  return <button type="button" className={cls} {...p}>{Icon && <Icon size={size === 'sm' ? 14 : 15} aria-hidden="true" />}{children}</button>;
}
export function LinkButton({ variant, size, icon: Icon, children, ...p }) {
  return <a className={['btn', variant && 'btn--' + variant, size && 'btn--' + size].filter(Boolean).join(' ')} {...p}>{Icon && <Icon size={size === 'sm' ? 14 : 15} aria-hidden="true" />}{children}</a>;
}
export const Badge = ({ tone, plain, children }) => <span className={['badge', tone && tone !== 'muted' && 'badge--' + tone, plain && 'badge--plain'].filter(Boolean).join(' ')}>{children}</span>;
export const Note = ({ tone, icon: Icon = AlertTriangle, children, role }) => <div className={'note' + (tone ? ' note--' + tone : '')} role={role}>{Icon && <Icon size={16} aria-hidden="true" />}<div>{children}</div></div>;

export function PageHead({ title, sub, actions, crumbs }) {
  return <div className="page-head"><div>{crumbs && <nav className="crumbs" aria-label="Ruta">{crumbs}</nav>}<h1>{title}</h1>{sub && <p>{sub}</p>}</div>{actions && <div className="page-head__actions">{actions}</div>}</div>;
}
export function Card({ title, actions, children, foot, body = true, className = '', id }) {
  return <section className={'card ' + className} id={id} aria-label={typeof title === 'string' ? title : undefined}>
    {(title || actions) && <div className="card__head">{typeof title === 'string' ? <h2>{title}</h2> : title}{actions && <div className="row">{actions}</div>}</div>}
    {body ? <div className="card__body">{children}</div> : children}
    {foot && <div className="card__foot">{foot}</div>}
  </section>;
}
export function Count({ to, format }) { const v = useCountUp(to); return <>{format(v)}</>; }
export const Stat = ({ label, value, unit, sub, subTone }) => <div className="stat"><small>{label}</small><b>{value}{unit && <em>{unit}</em>}</b>{sub && <span className={subTone ? subTone + '-text' : ''}>{sub}</span>}</div>;

export function Seg({ options, value, onChange, label }) {
  return <div className="seg" role="group" aria-label={label}>{options.map(o => <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}>{o.label}{o.count != null && <span>{o.count}</span>}</button>)}</div>;
}
export function Tabs({ options, value, onChange, label }) {
  return <div className="tabs" role="tablist" aria-label={label}>{options.map(o => <button key={o.key} role="tab" type="button" aria-selected={value === o.key} onClick={() => onChange(o.key)}>{o.label}</button>)}</div>;
}

/* Campo con rótulo asociado, ayuda y error. El primer hijo recibe id, aria-invalid y aria-describedby. */
export function Field({ label, required, hint, error, children, className = '' }) {
  const id = useId(), hid = id + '-h', eid = id + '-e';
  const child = Children.only(children);
  const described = [hint && hid, error && eid].filter(Boolean).join(' ') || undefined;
  return <div className={'field ' + className}>
    {label && <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true">*</span>}</label>}
    {isValidElement(child) ? cloneElement(child, { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': described, 'aria-required': required || undefined, required: child.props.required ?? required }) : child}
    {error && <p className="error" id={eid}><AlertTriangle size={13} aria-hidden="true" />{error}</p>}
    {hint && !error && <p className="hint" id={hid}>{hint}</p>}
  </div>;
}
export const Input = ({ className = '', ...p }) => <input className={'input ' + className} {...p} />;
export const Textarea = p => <textarea className="textarea" {...p} />;
export function Select({ options, placeholder, ...p }) {
  return <select className="select" {...p}>{placeholder != null && <option value="">{placeholder}</option>}{options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}</select>;
}
export function Toggle({ checked, onChange, label, disabled }) {
  return <button type="button" role="switch" className="switch" aria-checked={!!checked} aria-label={label} title={label} disabled={disabled} onClick={() => onChange(!checked)} />;
}
export function Check2({ checked, onChange, children }) {
  return <label className="check"><input type="checkbox" className="chk" checked={!!checked} onChange={e => onChange(e.target.checked)} /><span>{children}</span></label>;
}
export function FileDrop({ onFile, accept = 'image/jpeg,image/png,image/webp', label, hint, error, id }) {
  const ref = useRef();
  return <div>
    <div className="drop" role="button" tabIndex={0} id={id} aria-invalid={error ? 'true' : undefined} onClick={() => ref.current.click()} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), ref.current.click())}
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && onFile(e.dataTransfer.files[0]); }}>
      <Upload size={18} aria-hidden="true" /><span>{label || 'Arrastra la imagen o haz clic para subirla'}</span>{hint && <small className="subtle">{hint}</small>}
    </div>
    <input ref={ref} type="file" accept={accept} hidden onChange={e => { e.target.files[0] && onFile(e.target.files[0]); e.target.value = ''; }} />
  </div>;
}

/* Diálogo modal: role="dialog", foco dentro, Escape cierra, el fondo no recibe Tab. */
function useDialog(onClose) {
  const ref = useRef();
  useEffect(() => {
    const prev = document.activeElement, el = ref.current;
    const focusables = () => [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null);
    (el.querySelector('[data-autofocus]') || focusables()[1] || focusables()[0] || el).focus();
    const key = e => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') { const f = focusables(); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    el.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { el.removeEventListener('keydown', key); document.body.style.overflow = ''; prev && prev.focus && prev.focus(); };
  }, []);
  return ref;
}
export function Modal({ title, sub, onClose, children, footer, wide, xl }) {
  const ref = useDialog(onClose), id = useId();
  return <><div className="scrim" onClick={onClose} /><div ref={ref} className={'modal' + (wide ? ' modal--wide' : '') + (xl ? ' modal--xl' : '')} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
    <div className="modal__head"><div><h2 id={id}>{title}</h2>{sub && <p>{sub}</p>}</div><button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button></div>
    <div className="modal__body">{children}</div>
    {footer && <div className="modal__foot">{footer}</div>}
  </div></>;
}
export function Drawer({ title, kicker, onClose, children, footer }) {
  const ref = useDialog(onClose), id = useId();
  return <><div className="scrim" onClick={onClose} /><div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
    <div className="modal__head"><div>{kicker && <p className="subtle" style={{ marginTop: 0 }}>{kicker}</p>}<h2 id={id}>{title}</h2></div><button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar panel"><X size={18} /></button></div>
    <div className="modal__body">{children}</div>
    {footer && <div className="modal__foot">{footer}</div>}
  </div></>;
}
export function Confirm({ title, text, confirm = 'Confirmar', danger, onConfirm, onClose, children }) {
  return <Modal title={title} onClose={onClose} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant={danger ? 'danger-solid' : 'primary'} onClick={onConfirm}>{confirm}</Button></>}>
    {text && <p className="muted">{text}</p>}{children}
  </Modal>;
}

export const Empty = ({ icon: Icon = Inbox, title, text, action }) => <div className="empty"><Icon size={28} aria-hidden="true" /><b>{title}</b>{text && <p>{text}</p>}{action && <div style={{ marginTop: 8 }}>{action}</div>}</div>;
export function Steps({ steps, current, label = 'Pasos' }) {
  return <ol className="steps" aria-label={label}>{steps.map((s, i) => <li key={s} className={i === current ? 'is-on' : i < current ? 'is-done' : ''} aria-current={i === current ? 'step' : undefined}><i>{i < current ? <Check size={13} aria-label="Hecho" /> : i + 1}</i><span className={i === current ? '' : 'hide-mobile'}>{s}</span></li>)}</ol>;
}
export const Bar = ({ value, max, brand, label }) => <div className={'bar' + (brand ? ' bar--brand' : '')} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}><i style={{ width: Math.min(100, max ? value / max * 100 : 0) + '%' }} /></div>;
export function Pager({ page, pages, onChange, shown, total, noun = 'resultados' }) {
  return <div className="card__foot"><span>Mostrando {shown} de {total} {noun}</span>{pages > 1 && <div className="row"><Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</Button><span>Página {page} de {pages}</span><Button size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Siguiente</Button></div>}</div>;
}
export const Avatar = ({ name, lg }) => <span className={'avatar' + (lg ? ' avatar--lg' : '')} aria-hidden="true">{initials(name)}</span>;
export function MethodIcon({ method, size = 26 }) {
  if (!method || !PAGOS) return <span className="mico" style={{ width: size, height: size, borderRadius: 7, background: 'var(--sunken)' }} />;
  return <span className="mico" aria-hidden="true" dangerouslySetInnerHTML={{ __html: PAGOS.svg(method.icon, 'tile', size, method.color || undefined) }} />;
}
export function Thumb({ raffle, lg }) {
  const img = raffle.images && raffle.images[0];
  const src = img && (/^(data:|https?:)/.test(img) ? img : './fronts/comun/img/' + img);
  const label = raffle.title.split(/\s+/).filter(w => w.length > 2).slice(-1)[0] || raffle.title;
  return <span className={'thumb' + (raffle.tone && raffle.tone !== 'violeta' ? ' thumb--' + raffle.tone : '') + (lg ? ' thumb--lg' : '')} aria-hidden="true">{src ? <img src={src} alt="" loading="lazy" /> : <span>{label.slice(0, lg ? 24 : 6).toUpperCase()}</span>}</span>;
}

/* Logo de LottoGE (el de la página principal). */
export const LogoMark = () => <i className="logo-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#fff" d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5V9a2 2 0 0 0 0 4v2.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 15.5V13a2 2 0 0 0 0-4z" /><path d="M9.5 9.5h5M9.5 12.5h3" stroke="#ff5a36" strokeWidth="1.8" strokeLinecap="round" /></svg></i>;

/* Bolitas de lotería y boletos que flotan despacio (el fondo del login, en pequeño). */
export function FloatBg({ count = 14 }) {
  const ref = useRef();
  useEffect(() => {
    if (reduceMotion()) return;
    const cv = ref.current, cx = cv.getContext('2d'), COLORS = ['#ff5a36', '#ffc23c', '#12a594', '#4f7cff'];
    let W = 0, H = 0, raf = 0, items = [], mx = 0, tx = 0;
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); };
    size();
    items = Array.from({ length: Math.max(6, Math.round(count * Math.min(1, W / 1000))) }, (_, i) => ({ kind: i % 3 === 0 ? 'ticket' : 'ball', x: W * (.35 + Math.random() * .65), y: Math.random() * H, r: 9 + Math.random() * 13, c: COLORS[i % 4], v: 6 + Math.random() * 12, sway: Math.random() * 6, rot: Math.random() - .5, n: String(Math.floor(Math.random() * 100)).padStart(2, '0'), z: .4 + Math.random() * .6 }));
    let last = performance.now();
    const frame = t => {
      const dt = Math.min(.05, (t - last) / 1000); last = t; tx += (mx - tx) * .05;
      cx.clearRect(0, 0, W, H);
      for (const it of items) {
        it.y -= it.v * dt * it.z; it.sway += dt; if (it.y < -40) { it.y = H + 40; it.x = W * (.35 + Math.random() * .65); }
        const x = it.x + Math.sin(it.sway) * 8 + tx * 18 * it.z, y = it.y;
        cx.save(); cx.translate(x, y); cx.globalAlpha = .3 * it.z + .12;
        if (it.kind === 'ball') {
          cx.rotate(Math.sin(it.sway) * .25); cx.fillStyle = it.c; cx.beginPath(); cx.arc(0, 0, it.r, 0, 7); cx.fill();
          cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(0, 0, it.r * .6, 0, 7); cx.fill();
          cx.fillStyle = '#1d2340'; cx.font = `800 ${Math.round(it.r * .62)}px "Plus Jakarta Sans", Arial`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(it.n, 0, 1);
        } else {
          cx.rotate(it.rot + Math.sin(it.sway) * .1); const w = it.r * 2.6, h = it.r * 1.5;
          cx.fillStyle = it.c; cx.beginPath(); cx.roundRect(-w / 2, -h / 2, w, h, 5); cx.fill();
          cx.fillStyle = 'rgba(255,255,255,.85)'; cx.fillRect(-w / 2 + 6, -h / 2 + 6, w * .4, 3); cx.fillRect(-w / 2 + 6, -h / 2 + 12, w * .26, 3);
        }
        cx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const mv = e => { mx = e.clientX / innerWidth - .5; };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    addEventListener('resize', size); addEventListener('pointermove', mv, { passive: true }); document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('pointermove', mv); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}
