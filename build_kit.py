#!/usr/bin/env python3
"""Arma el kit de los fronts de venta para LottoGE (lo que se sube al Drive "Sevenlot fronts").

Toma las seis plantillas de fronts/<plantilla>/vista-previa/index.html y separa:
  - lo común a todas (la página de compra, su vista de computadora y el catálogo de métodos de pago), y
  - lo propio de cada plantilla (su tema: CSS y, si tiene, un poco de JavaScript).
Comprueba que la parte común sea idéntica en las seis antes de escribir nada.

Salida, en kit/:
  02 Fronts de venta/comun/        venta.css, venta-computadora.css, pagina.css, metodos-pago.js,
                                   venta.js, conexion.ejemplo.js, img/
  02 Fronts de venta/<Plantilla>/  index.html, config.js, tema.css, tema-computadora.css, tema.js, LEEME.md
  03 Recursos/iconos-pago/         iconos-pago.svg, metodos-pago.json, iconos-pago.html

Uso:  python3 build_kit.py
"""
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTS = ROOT / 'fronts'
OUT = ROOT / 'kit'
VENTA = OUT / '02 Fronts de venta'
ICONOS = OUT / '03 Recursos' / 'iconos-pago'
PLANTILLAS = [('minimalista', 'Minimalista'), ('estandar', 'Estándar'), ('vibrante', 'Vibrante'),
              ('neon', 'Neón'), ('pop', 'Pop'), ('experimental', 'Experimental')]
DESK = '\n/* ================= Computer ================='
THEME_MARK = '  /* ---------- theme ---------- */'


def read(p):
    return Path(p).read_text(encoding='utf-8')


def write(p, text):
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')


def partes(slug):
    src = read(FRONTS / slug / 'vista-previa' / 'index.html')

    def block(tag):
        a = src.index(tag) + len(tag)
        return src[a:src.index('</script>', a)]

    css = src[src.index('<style>') + len('<style>'):src.index('</style>')]
    script = block('<script>')
    return {
        'font': next(l for l in src.splitlines() if 'fonts.googleapis.com/css2' in l),
        'pre': css[:css.index(DESK)], 'post': css[css.index(DESK):],
        'pagos': block('<script data-part="pagos">'), 'tema': block('<script data-part="tema">'),
        'core': script[:script.index(THEME_MARK)],
    }


# ---------------------------------------------------------------- split and check
P = {slug: partes(slug) for slug, _ in PLANTILLAS}
base, desk, core, pagos = P['minimalista']['pre'], P['minimalista']['post'], P['minimalista']['core'], P['minimalista']['pagos']
assert pagos.strip() == read(FRONTS / '_comun' / 'metodos-pago.js').strip(), 'metodos-pago.js no coincide con la copia de las vistas previas'
for slug, _ in PLANTILLAS:
    p = P[slug]
    assert p['pre'].startswith(base), f'{slug}: la base del CSS no es la común'
    assert p['post'].startswith(desk), f'{slug}: el CSS de computadora no es el común'
    assert p['core'] == core, f'{slug}: el JavaScript común no coincide'
    assert p['pagos'] == pagos, f'{slug}: el catálogo de pagos no coincide'
    p['tema_css'] = p['pre'][len(base):].strip('\n')
    p['tema_desk'] = p['post'][len(desk):].strip('\n')

# The showcase (phone and Mac frames, the config panel) stays out of the kit; the page itself keeps everything.
a, b = base.index('/* ---------- Showcase ---------- */'), base.index('/* ---------- page parts that only a computer shows ---------- */')
base_kit = base[:a] + base[b:]

# Full-page shell and boot code: the same that build_front.py uses.
bf = read(FRONTS / 'minimalista' / 'build_front.py')
STANDALONE = re.search(r'STANDALONE_CSS = """(.*?)"""', bf, re.S).group(1)
TAIL = re.search(r'TAIL = """(.*?)"""', bf, re.S).group(1)
old_cfg = '  let CFG = JSON.parse(JSON.stringify(SAMPLE));'
assert old_cfg in core
core_kit = core.replace(old_cfg, '  let CFG = Object.assign(JSON.parse(JSON.stringify(SAMPLE)), window.LOTTOGE_RIFA || {});')

HEAD = '/* LottoGE · fronts de venta · {qué}\n   Lo mantiene Sevenlot; los cambios se le piden a Sevenlot. {nota} */\n'
if OUT.exists():
    shutil.rmtree(OUT)

# ---------------------------------------------------------------- comun/
C = VENTA / 'comun'
write(C / 'venta.css', HEAD.format(qué='estilos de la página de compra (teléfono)', nota='Común a todas las plantillas; cada una pone su tema.css después de este archivo.') + base_kit.strip('\n') + '\n')
write(C / 'venta-computadora.css', HEAD.format(qué='vista de computadora', nota='Se aplica cuando la página tiene la clase "desk" (ver App.setupDesk en venta.js). Va después de tema.css.') + desk.strip('\n') + '\n')
write(C / 'pagina.css', HEAD.format(qué='página completa', nota='Contenedor de la página a pantalla completa. Va al final.') + """
/* La pantalla donde se dibuja la página. */
.screen { position: relative; overflow: hidden; background: var(--bg); color: var(--ink); isolation: isolate; font-size: 16px; line-height: 1.45; }
""" + STANDALONE.strip('\n') + '\n')
write(C / 'metodos-pago.js', pagos.strip('\n') + '\n')
write(C / 'venta.js', HEAD.format(qué='la página de compra', nota='''No se edita a mano.
   Lee window.LOTTOGE_RIFA (config.js), window.LOTTOGE_PAGOS (metodos-pago.js), window.LOTTOGE_TEMA (tema.js)
   y, si existe, window.LOTTOGE_CONEXION (conexion.js, ver conexion.ejemplo.js). Las demostraciones están
   en "puntos de conexión con la plataforma".''') + core_kit + TAIL.lstrip('\n'))
shutil.copy(FRONTS / '_comun' / 'conexion.ejemplo.js', C / 'conexion.ejemplo.js')
(C / 'img').mkdir(parents=True, exist_ok=True)
for img in sorted((FRONTS / 'minimalista' / 'front' / 'img').glob('*.jpg')):
    dest = C / 'img' / img.name
    # lighter sample photos for the Drive; the template looks the same
    if shutil.which('convert'):
        subprocess.run(['convert', str(img), '-strip', '-resize', '720x720>', '-sampling-factor', '4:2:0', '-interlace', 'JPEG', '-quality', '66', str(dest)], check=True)
    else:
        shutil.copy(img, dest)

# ---------------------------------------------------------------- one folder per template
for slug, nombre in PLANTILLAS:
    p, D = P[slug], VENTA / nombre
    cfg = read(FRONTS / slug / 'front' / 'config.js').replace("'img/", "'../comun/img/")
    write(D / 'config.js', cfg)
    write(D / 'tema.js', p['tema'].strip('\n') + '\n')
    links = ['../comun/venta.css']
    if p['tema_css']:
        write(D / 'tema.css', f'/* LottoGE · plantilla {nombre} · su diseño, encima de comun/venta.css */\n' + p['tema_css'] + '\n')
        links.append('tema.css')
    links.append('../comun/venta-computadora.css')
    if p['tema_desk']:
        write(D / 'tema-computadora.css', f'/* LottoGE · plantilla {nombre} · ajustes para computadora, encima de comun/venta-computadora.css */\n' + p['tema_desk'] + '\n')
        links.append('tema-computadora.css')
    links.append('../comun/pagina.css')
    css_links = '\n'.join(f'<link rel="stylesheet" href="{h}">' for h in links)
    write(D / 'index.html', f'''<!doctype html>
<html lang="es-VE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Rifa · LottoGE</title>
<meta name="description" content="Compra de boletos de la rifa, sobre la plataforma LottoGE.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{p['font']}
<!-- Estilos, en este orden: la página común, el tema, la vista de computadora, el tema en computadora y la página completa. -->
{css_links}
</head>
<body class="standalone">
<!-- Plantilla {nombre}. La mantiene Sevenlot; no editar a mano. -->
<div class="shell"><div class="screen screen--full" id="app"></div></div>
<script src="config.js"></script>
<script src="../comun/metodos-pago.js"></script>
<!-- Conexión real con la plataforma: copia comun/conexion.ejemplo.js como comun/conexion.js, complétalo y quita este comentario.
<script src="../comun/conexion.js"></script>
-->
<script src="tema.js"></script>
<script src="../comun/venta.js"></script>
</body>
</html>
''')
    readme = read(FRONTS / slug / 'README.md')
    paras = readme.split('\n\n')
    desc = paras[1].strip()
    if desc.endswith(':'):  # the intro goes on in a list
        desc += '\n\n' + paras[2].strip()
    files = ['index.html  la página de compra (no se edita a mano)', 'config.js   los datos de la rifa y sus métodos de pago: lo único que cambia de un rifero a otro']
    if p['tema_css']: files.append('tema.css    el diseño de esta plantilla')
    if p['tema_desk']: files.append('tema-computadora.css  sus ajustes para computadora')
    files.append('tema.js     lo propio de la plantilla en JavaScript' + (' (adornos o reorganización)' if 'fx(app, {' in p['tema'] else ' (aquí, nada)'))
    write(D / 'LEEME.md', f'''# Plantilla {nombre}

{desc}

## Archivos

''' + '\n'.join(f'- {f}' for f in files) + f'''

Lo común a todas las plantillas está en `../comun/`. Las fotos de ejemplo están en `../comun/img/`.

## Probarla

Desde la carpeta "02 Fronts de venta" (la que contiene `comun/` y esta carpeta):

    npx serve .      o      python3 -m http.server 8080

y abre http://localhost:8080/{nombre}/ (o la dirección que muestre serve). En un teléfono sale la vista móvil
y en una computadora, la de escritorio.

Todo lo demás está en el "LÉEME - Fronts de venta" y en la "Guía de implementación - Fronts de venta".
''')

# ---------------------------------------------------------------- 03 Recursos/iconos-pago
NODE = r'''
const vm = require('vm'), fs = require('fs');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1], 'utf8'), ctx);
const P = ctx.window.LOTTOGE_PAGOS, X = s => s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
const out = {
  iconos: Object.entries(P.ICONS).map(([k, i]) => ({ clave: k, nombre: i.name, color: i.color, colorTexto: i.ink, tipo: i.kind,
    monedaPorDefecto: P.DEFAULTS[k].currency, referencia: P.DEFAULTS[k].ref, dibujo: i.glyph,
    svg: X(P.svg(k, 'glyph', 24)), svgFicha: X(P.svg(k, 'tile', 48)) })),
  monedas: Object.entries(P.CURRENCIES).map(([c, m]) => ({ codigo: c, nombre: m.name, prefijo: m.prefix, sufijo: m.suffix, decimales: m.decimals, grupo: m.group })),
  grupos: P.GROUPS.map(([g, t]) => ({ grupo: g, titulo: t })),
  bancosVenezuela: P.BANCOS_VE.map(b => ({ codigo: b.code, nombre: b.name }))
};
process.stdout.write(JSON.stringify(out));
'''
cat = json.loads(subprocess.run(['node', '-e', NODE, str(C / 'metodos-pago.js')], capture_output=True, text=True, check=True).stdout)
ejemplos = re.search(r'paymentMethods: \[(.*?)\n  \],', read(FRONTS / 'minimalista' / 'front' / 'config.js'), re.S).group(1)
EJEMPLOS = json.loads(subprocess.run(['node', '-e', 'process.stdout.write(JSON.stringify(eval("[" + process.argv[1] + "]")))', ejemplos], capture_output=True, text=True, check=True).stdout)
catalogo = {
    'version': '2026-10-25',
    'descripcion': 'Catálogo de métodos de pago de los fronts de venta de LottoGE: iconos (cuatro estilos), monedas y bancos de '
                   'Venezuela. Es el mismo de 02 Fronts de venta/comun/metodos-pago.js. Para la base de datos: guardar en cada '
                   'método de pago la clave del icono (campo icon) y, si se quiere otro color, color y colorInk.',
    'campos': {
        'id': 'Identificador del método.', 'name': 'Nombre que ve el comprador.',
        'icon': 'Clave de un icono de este catálogo. Si falta, se adivina por el nombre. El mismo icono sirve para varios métodos.',
        'color / colorInk': 'Fondo y dibujo de la ficha del icono. Opcional: cada icono trae los suyos.',
        'note / badge': 'Texto chico debajo del nombre y etiqueta resaltada. Opcionales.',
        'isOnline': 'true: se verifica solo con la pasarela (Chinchin, AvilaPay o R4) y entrega los números al instante.',
        'requireReceipt': 'true: pide comprobante y la compra queda como boletos reservados. Por defecto, si no es isOnline.',
        'currency': 'Código de moneda (ver monedas). En el API real viene como currencyId.',
        'minTickets': 'Mínimo de boletos para usar el método.', 'commissionRate': '% que se suma al monto de este método.',
        'accountInfo': 'Datos para pagar: [["Banco", "Banesco (0134)"], …], un objeto o texto con una línea "Etiqueta: valor" por dato.',
        'instructions': 'Indicación corta que sale arriba de los datos.',
        'ref': '{ label, placeholder, error, numeric }: lo que se pide como referencia. Por defecto, el del icono.',
        'askPayer / askBank': 'Pedir el teléfono desde el que paga y su banco.'
    },
    'sqlSugerido': 'ALTER TABLE payment_methods ADD COLUMN icon VARCHAR(40) NULL, ADD COLUMN color CHAR(7) NULL, ADD COLUMN color_ink CHAR(7) NULL;',
    **cat,
    'ejemplos': EJEMPLOS,
}
write(ICONOS / 'metodos-pago.json', json.dumps(catalogo, ensure_ascii=False, indent=2) + '\n')
sprite = '\n'.join(f'  <symbol id="{i["clave"]}" viewBox="0 0 24 24"><title>{i["nombre"]}</title>{i["dibujo"]}</symbol>' for i in cat['iconos'])
write(ICONOS / 'iconos-pago.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
<!-- Iconos de métodos de pago de LottoGE, en un solo color (currentColor). Uso: <svg><use href="iconos-pago.svg#pago-movil"/></svg> -->
{sprite}
</svg>
''')
write(ICONOS / 'iconos-pago.html', read(FRONTS / '_comun' / 'iconos-pago.html').replace('/*__CATALOGO__*/', pagos.strip('\n')))
# every script must at least parse (a stray "*/" in a comment once broke venta.js)
for f in sorted(OUT.rglob('*.js')):
    subprocess.run(['node', '--check', str(f)], check=True)
print('Kit listo en', OUT.relative_to(ROOT))
for f in sorted(OUT.rglob('*')):
    if f.is_file():
        print(f'  {f.relative_to(OUT)}  ({f.stat().st_size // 1024 or 1} KB)')
