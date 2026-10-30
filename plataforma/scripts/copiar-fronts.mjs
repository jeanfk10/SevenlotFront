// Copia los fronts de venta del kit (kit/02 Fronts de venta) a public/fronts y los conecta con el servidor
// simulado del entorno de pruebas. Se corre solo con `npm run dev` y `npm run build`.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const kit = join(root, '..', 'kit', '02 Fronts de venta');
const out = join(root, 'public', 'fronts');
const PLANTILLAS = { Minimalista: 'minimalista', 'Estándar': 'estandar', Vibrante: 'vibrante', 'Neón': 'neon', Pop: 'pop', Experimental: 'experimental' };

if (!existsSync(kit)) { console.error('No encuentro el kit en', kit); process.exit(1); }
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'comun'), { recursive: true });
cpSync(join(kit, 'comun'), join(out, 'comun'), { recursive: true, filter: f => !/conexion\.ejemplo\.js$/.test(f) });

const SANDBOX = ['<script src="../../sandbox/puente.js"></script>', '<script src="../../sandbox/api.js"></script>', '<script src="../../sandbox/conexion.js"></script>'].join('\n');
for (const [carpeta, slug] of Object.entries(PLANTILLAS)) {
  const src = join(kit, carpeta), dst = join(out, slug);
  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src)) if (f !== 'LEEME.md') cpSync(join(src, f), join(dst, f));
  let html = readFileSync(join(src, 'index.html'), 'utf8');
  const conexion = /<!-- Conexión real[\s\S]*?-->/;
  if (!conexion.test(html)) throw new Error('No encuentro el bloque de conexión en ' + carpeta);
  html = html.replace(conexion, '<!-- Entorno de pruebas: conectado al servidor simulado de LottoX. -->\n' + SANDBOX);
  writeFileSync(join(dst, 'index.html'), html);
}
// Página principal aprobada (landing/sencilla): login, rifas activas y denuncias conectados al servidor simulado.
const land = join(root, '..', 'landing', 'sencilla', 'front'), pp = join(root, 'public', 'pagina-principal');
rmSync(pp, { recursive: true, force: true }); mkdirSync(pp, { recursive: true });
let lhtml = readFileSync(join(land, 'index.html'), 'utf8');
if (!lhtml.includes('<script src="config.js"></script>')) throw new Error('No encuentro config.js en la página principal');
lhtml = lhtml.replace('<script src="config.js"></script>', '<script src="../sandbox/api.js"></script>\n<script src="../sandbox/pagina-principal.js"></script>\n<script src="config.js"></script>');
writeFileSync(join(pp, 'index.html'), lhtml);
writeFileSync(join(pp, 'config.js'), readFileSync(join(land, 'config.js'), 'utf8') + `
// Entorno de pruebas: las llamadas van al servidor simulado (sandbox/pagina-principal.js).
window.LOTTOGE_SITE.api = { login: '__lottox/auth/login', recuperar: '__lottox/auth/forgot', rifas: '__lottox/raffles', denuncias: '__lottox/reports' };
window.LOTTOGE_SITE.rifasDePrueba = [];
`);

// fronts/ → la plantilla y la rifa publicadas en Ajustes › Sitio web
writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="es-VE"><head><meta charset="utf-8"><title>Página pública</title>
<script src="../sandbox/api.js"></script></head><body><script>
const s = window.LottoAPI.db.sitePublished, q = new URLSearchParams(location.search);
if (!q.get('rifa')) q.set('rifa', s.raffleId);
location.replace(s.template + '/?' + q);
</script></body></html>`);
console.log('Fronts de venta listos en public/fronts:', Object.values(PLANTILLAS).join(', '), '· página principal en public/pagina-principal');
