#!/usr/bin/env python3
"""Retain image/PDF URLs that are referenced as strings rather than Vite imports."""
from pathlib import Path
import shutil
import tomllib

root = Path(__file__).resolve().parent.parent
mapping = tomllib.loads((root / "data/slide_redirects.toml").read_text())
for deck in mapping["decks"]:
    source = root / "content/slides" / deck["old"]
    destination = root / "static/slides" / deck["new"]
    if (source / "images").is_dir():
        shutil.copytree(source / "images", destination / "images", dirs_exist_ok=True)
    if (source / "slides.pdf").is_file():
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / "slides.pdf", destination / "slides.pdf")
