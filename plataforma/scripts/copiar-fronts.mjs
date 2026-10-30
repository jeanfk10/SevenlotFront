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
// fronts/ → la plantilla y la rifa publicadas en Ajustes › Sitio web
writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="es-VE"><head><meta charset="utf-8"><title>Página pública</title>
<script src="../sandbox/api.js"></script></head><body><script>
const s = window.LottoAPI.db.sitePublished, q = new URLSearchParams(location.search);
if (!q.get('rifa')) q.set('rifa', s.raffleId);
location.replace(s.template + '/?' + q);
</script></body></html>`);
console.log('Fronts de venta listos en public/fronts:', Object.values(PLANTILLAS).join(', '));
