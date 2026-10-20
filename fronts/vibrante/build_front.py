#!/usr/bin/env python3
"""Genera el front exportable (front/index.html) a partir de la vista previa.

La vista previa (vista-previa/index.html) es la fuente: ahí vive todo el diseño y la lógica,
dentro de los marcos de iPhone y con el panel de configuración. Este script toma el CSS y el
núcleo del JavaScript, quita la vitrina (iPhones, panel, galería) y arma una página completa
que lee su configuración de front/config.js.

Uso:  python3 build_front.py
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "vista-previa" / "index.html"
OUT = HERE / "front" / "index.html"

src = SRC.read_text(encoding="utf-8")

css = src[src.index("<style>") + len("<style>"):src.index("</style>")]
script = src[src.index("<script>") + len("<script>"):src.index("</script>")]
core = script[:script.index("  /* ---------- theme ---------- */")]
# Each template brings its own Google Fonts link; reuse it as is.
font_link = next(line for line in src.splitlines() if "fonts.googleapis.com/css2" in line)

# The rifero's configuration comes from config.js; anything missing falls back to the sample.
old_cfg = "  let CFG = JSON.parse(JSON.stringify(SAMPLE));"
assert old_cfg in core, "No encontré la línea de configuración en la vista previa"
core = core.replace(old_cfg, "  let CFG = Object.assign(JSON.parse(JSON.stringify(SAMPLE)), window.LOTTOGE_RIFA || {});")

STANDALONE_CSS = """
/* ---------- Página completa (sin marcos de iPhone) ---------- */
html, body { height: 100%; }
body.standalone { margin: 0; overflow: hidden; background: var(--bg); }
[hidden] { display: none !important; }
.shell { position: relative; height: 100%; max-width: 560px; margin: 0 auto; }
@media (min-width: 600px) { body.standalone { background: var(--surface); } }
.screen--full { width: 100%; height: 100%; border-radius: 0; }
.standalone .island, .standalone .sbar, .standalone .homebar { display: none; }
.standalone .scroller { inset: 0; padding-top: env(safe-area-inset-top, 0px); }
.standalone .verify { inset: 0; }
.standalone .lightbox { grid-template-rows: env(safe-area-inset-top, 0px) 56px minmax(0, 1fr); }
.standalone .buybar, .standalone .board__foot { padding-bottom: max(14px, env(safe-area-inset-bottom, 0px)); }
.standalone .afoot { padding-bottom: 110px; }
.standalone .board { height: calc(100% - 40px); }
"""

TAIL = """
  /* ---------- tema claro / oscuro ---------- */
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  function toggleTheme() { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; }

  /* ---------- color de la marca: un nombre de ACCENTS o un hex propio ---------- */
  const [ac, aci] = ACCENTS[CFG.accent] || [CFG.accent, CFG.accentInk || '#ffffff'];
  document.documentElement.style.setProperty('--accent', ac);
  document.documentElement.style.setProperty('--accent-ink', aci);
  document.title = `${CFG.prize} · ${CFG.rifero}`;

  /* ---------- montar la página ---------- */
  const host = document.getElementById('app');
  new App(host, { view: 'home' }, host);
})();
"""

page = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Rifa · LottoGE</title>
<meta name="description" content="Compra de boletos de la rifa, sobre la plataforma LottoGE.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{font_link}
<style>{css}{STANDALONE_CSS}</style>
</head>
<body class="standalone">
<!-- Generado con build_front.py a partir de vista-previa/index.html. No editar a mano: cambia la vista previa y vuelve a generar. -->
<div class="shell"><div class="screen screen--full" id="app"></div></div>
<script src="config.js"></script>
<script>{core}{TAIL}</script>
</body>
</html>
"""

OUT.write_text(page, encoding="utf-8")
print(f"Listo: {OUT.relative_to(HERE)} ({len(page) // 1024} KB)")
