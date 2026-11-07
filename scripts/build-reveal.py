#!/usr/bin/env python3
"""Publish Markdown decks using the standard Reveal.js Markdown plugin."""
from pathlib import Path
import html
import json
import shutil
import tomllib

root = Path(__file__).resolve().parent.parent
static = root / "static/slides"
reveal = root / "node_modules/reveal.js"
for directory in ("dist", "plugin"):
    shutil.copytree(reveal / directory, static / "reveal-js" / directory, dirs_exist_ok=True)
shutil.copy2(reveal / "LICENSE", static / "reveal-js/LICENSE")
shutil.copytree(root / "node_modules/mermaid/dist", static / "mermaid", dirs_exist_ok=True)
shutil.copy2(root / "node_modules/mermaid/LICENSE", static / "mermaid/LICENSE")

mapping = tomllib.loads((root / "data/slide_redirects.toml").read_text())
for deck in mapping["decks"]:
    source = root / "content/slides" / deck["old"]
    if not (source / "deck.json").is_file():
        continue
    metadata = json.loads((source / "deck.json").read_text())
    destination = static / deck["new"]
    shutil.copytree(source, destination, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns("node_modules", "dist", ".slidev", "__pycache__"))
    prefix = "../" * len(Path(deck["new"]).parts)
    logo = ""
    if metadata.get("logo"):
        image = metadata["logo"]
        position = html.escape(image.get("diag", "90%"), quote=True)
        width = html.escape(image.get("width", "3%"), quote=True)
        src = html.escape(image["src"], quote=True)
        logo = f'<img src="{src}" alt="" style="position:absolute;top:{position};left:{position};width:{width}">'
    title = html.escape(metadata["title"])
    theme = html.escape(metadata["theme"], quote=True)
    config = json.dumps(metadata["reveal"]).replace("<", "\\u003c")
    (destination / "index.html").write_text(f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="icon" href="{prefix}favicon-32x32.png">
  <link rel="stylesheet" href="{prefix}reveal-js/dist/reset.css">
  <link rel="stylesheet" href="{prefix}reveal-js/dist/reveal.css">
  <link rel="stylesheet" href="{prefix}{theme}">
  <link rel="stylesheet" href="{prefix}highlight-js/catppuccin.min.css">
</head>
<body>
{logo}
<div class="reveal"><div class="slides">
  <section data-markdown="slides.md" data-separator="^---$"
    data-separator-vertical="^----$" data-separator-notes="^Note:"></section>
</div></div>
<script src="{prefix}reveal-js/dist/reveal.js"></script>
<script src="{prefix}reveal-js/plugin/markdown/markdown.js"></script>
<script src="{prefix}reveal-js/plugin/highlight/highlight.js"></script>
<script src="{prefix}reveal-js/plugin/notes/notes.js"></script>
<script src="{prefix}reveal-js/plugin/zoom/zoom.js"></script>
<script>window.revealConfig = {config};</script>
<script src="{prefix}reveal-init.js"></script>
</body>
</html>
''')
    print(f"Published Reveal.js Markdown deck: {deck['new']}")
