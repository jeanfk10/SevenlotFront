#!/usr/bin/env python3
"""Genera la página exportable (front/index.html) a partir de la vista previa.

La vista previa (vista-previa/index.html) es la fuente y es lo que se publica como artefacto:
el artefacto pone por su cuenta el <!doctype>, <html>, <head> y <body>. Este script le pone ese
esqueleto para que la página funcione sola en cualquier hosting. Todo lo que está antes de la
marca <!-- page --> va en el <head>; lo demás, en el <body>.

Uso:  python3 build_front.py
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "vista-previa" / "index.html"
OUT = HERE / "front" / "index.html"

src = SRC.read_text(encoding="utf-8")
MARK = "<!-- page -->"
assert MARK in src, "No encontré la marca <!-- page --> en la vista previa"
head, body = src.split(MARK, 1)
# La etiqueta de la vitrina de artefactos no hace falta fuera de ella.
head = "\n".join(line for line in head.strip().splitlines() if "claude:viewport-fit-sides" not in line)
head = head.replace("<title>LottoGE Página Principal</title>", "<title>LottoGE · Vende tus rifas en línea</title>")
# El artefacto abre en el inicio de sesión para la demo; la página exportable abre en el inicio.
START = "  const START = 'login';"
assert START in body, "No encontré la vista inicial en la vista previa"
body = body.replace(START, "  const START = 'inicio';")
# La configuración (WhatsApp, planes, API, correo de denuncias) se lee de front/config.js.
SCRIPT = "<script>\n(() => {"
assert body.count(SCRIPT) == 1, "No encontré el script principal en la vista previa"
body = body.replace(SCRIPT, '<script src="config.js"></script>\n' + SCRIPT)

page = f"""<!doctype html>
<html lang="es-VE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head}
</head>
<body>
<!-- Generado con build_front.py a partir de vista-previa/index.html. No editar a mano: cambia la vista previa y vuelve a generar. -->
{body.strip()}
</body>
</html>
"""
OUT.write_text(page, encoding="utf-8")
print(f"Listo: {OUT.relative_to(HERE)}")
