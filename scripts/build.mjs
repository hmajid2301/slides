#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'public');
const { base_url, decks } = JSON.parse(readFileSync(join(root, 'data/slide_redirects.json'), 'utf8'));
const prefix = new URL(process.env.CI_PAGES_URL || `${base_url}/`).pathname.replace(/\/$/, '');
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
})[character]);
const copy = (source, destination) => cpSync(source, destination, { recursive: true });
const redirects = [];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const asset of ['favicon-16x16.png', 'favicon-32x32.png', 'stylesheets', 'highlight-js', 'reveal-init.js']) {
  copy(join(root, 'static/slides', asset), join(output, asset));
}
for (const directory of ['dist', 'plugin', 'LICENSE']) {
  copy(join(root, 'node_modules/reveal.js', directory), join(output, 'reveal-js', directory));
}
copy(join(root, 'node_modules/mermaid/dist'), join(output, 'mermaid'));
copy(join(root, 'node_modules/mermaid/LICENSE'), join(output, 'mermaid/LICENSE'));

for (const deck of decks) {
  const source = join(root, 'content/slides', deck.old);
  const destination = join(output, deck.new);
  if (existsSync(join(source, 'deck.json'))) {
    const metadata = JSON.parse(readFileSync(join(source, 'deck.json'), 'utf8'));
    cpSync(source, destination, {
      recursive: true,
      filter: path => !relative(source, path).split('/').some(part =>
        ['node_modules', 'dist', '.slidev', '__pycache__'].includes(part)),
    });
    const assetPrefix = '../'.repeat(deck.new.split('/').length);
    const image = metadata.logo;
    const logo = image ? `<img src="${escape(image.src)}" alt="" style="position:absolute;top:${escape(image.diag ?? '90%')};left:${escape(image.diag ?? '90%')};width:${escape(image.width ?? '3%')}">` : '';
    const config = JSON.stringify(metadata.reveal).replace(/</g, '\\u003c');
    writeFileSync(join(destination, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(metadata.title)}</title>
  <link rel="icon" href="${assetPrefix}favicon-32x32.png">
  <link rel="stylesheet" href="${assetPrefix}reveal-js/dist/reset.css">
  <link rel="stylesheet" href="${assetPrefix}reveal-js/dist/reveal.css">
  <link rel="stylesheet" href="${assetPrefix}${escape(metadata.theme)}">
  <link rel="stylesheet" href="${assetPrefix}highlight-js/catppuccin.min.css">
</head>
<body>
${logo}
<div class="reveal"><div class="slides">
  <section data-markdown="slides.md" data-separator="^---$"
    data-separator-vertical="^----$" data-separator-notes="^Note:"></section>
</div></div>
<script src="${assetPrefix}reveal-js/dist/reveal.js"></script>
<script src="${assetPrefix}reveal-js/plugin/markdown/markdown.js"></script>
<script src="${assetPrefix}reveal-js/plugin/highlight/highlight.js"></script>
<script src="${assetPrefix}reveal-js/plugin/notes/notes.js"></script>
<script src="${assetPrefix}reveal-js/plugin/zoom/zoom.js"></script>
<script>window.revealConfig = ${config};</script>
<script src="${assetPrefix}reveal-init.js"></script>
</body>
</html>
`);
  } else {
    execFileSync('pnpm', ['install', '--frozen-lockfile'], { cwd: source, stdio: 'inherit' });
    execFileSync('pnpm', ['exec', 'slidev', 'build', 'slides.md', '--base', `${prefix}/${deck.new}/`, '--out', destination], {
      cwd: source, stdio: 'inherit',
    });
    redirects.push(`${prefix}/${deck.new}/* ${prefix}/${deck.new}/index.html 200`);
  }
  // Vite cannot bundle images/PDFs referenced only through runtime strings.
  if (existsSync(join(source, 'images'))) copy(join(source, 'images'), join(destination, 'images'));
  if (existsSync(join(source, 'slides.pdf'))) copy(join(source, 'slides.pdf'), join(destination, 'slides.pdf'));
  console.log(`Published: ${deck.new}`);
}

writeFileSync(join(output, '_redirects'), `${redirects.join('\n')}\n`);
// Pages serves index.html before redirect rules, so the root uses an HTML redirect.
writeFileSync(join(output, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Haseeb Majid — Slides</title>
  <meta http-equiv="refresh" content="0; url=https://haseebmajid.dev/talks/">
  <link rel="canonical" href="https://haseebmajid.dev/talks/">
</head>
<body>
  <main><p>Redirecting to <a href="https://haseebmajid.dev/talks/">talk descriptions, slides, and recordings</a>.</p></main>
</body>
</html>
`);
