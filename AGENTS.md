# Repository guide

## Preferences

- Keep README succinct; put contributor/agent details here.
- Do not add tests unless explicitly requested.
- Keep slide changes focused and speaker notes short: reminders and click cues, not scripts.
- Keep work-tracking docs local and Git-ignored under `docs/`.

## Sources

- Decks live at `content/slides/<topic>/<YYYY-MM-DD>-<event>/slides.md`.
  Omit the event suffix when no event is recorded. Each edition owns its assets and demos.
- Shared Slidev components, themes and add-ons live in `content/slides/slidev-shared/`.
- `data/slide_redirects.json` uses `new` for both source directories and published
  edition URLs; `old` is permanent compatibility metadata. Keep it in sync with
  the blog's `data/slide_redirects.toml`. Never redirect historical editions to “latest”.
- Reveal decks use `deck.json` for title/theme/logo/options. `---` starts a horizontal
  slide, `----` a vertical slide, and `Note:` speaker notes. Use native Reveal
  Markdown attributes for fragments/backgrounds and fenced Mermaid blocks.
- Reveal loads external Markdown; generated HTML is only a launcher. Do not edit it
  or add Hugo shortcodes/reveal-hugo dependencies.
- Run Slidev's `pnpm install --frozen-lockfile` and `pnpm dev` inside an edition folder.

## Tooling and checks

The Nix shell provides Node, pnpm, Task, Go for demos, nixfmt and miniserve.
Root and per-deck dependencies use committed pnpm lockfiles. Builds need no Hugo or Python.

- `nix develop -c task lint`: ESLint, Prettier and nixfmt.
- `pnpm lint`: Node-based checks only, after dependency installation.
- ESLint checks authored JS/TS/Vue, excluding dependencies and generated/vendor assets.
  Slidev layout filenames are exempt from Vue's multi-word component naming rule.
- Prettier checks project JSON/YAML, ESLint config and build scripts, not deck
  Markdown, Vue/TS presentation formatting or slide styles.
- `nix develop -c task build`: build every deck. Checks imports/bundling, not full
  TypeScript type checking or visual correctness.
- Branch/MR pipelines lint and build without publishing. Default-branch pipelines
  lint and run the Pages build/deployment. Only the default branch publishes.
- Validate CI rules for both branch/MR and default-branch contexts after changes.

## Publishing

`scripts/build.mjs` recreates `public/`, copies shared assets, generates Reveal
launchers, builds Slidev and preserves edition images/PDFs. `public/` is ignored.
Hand-maintained shared CSS, favicons and `reveal-init.js` stay in `static/slides/`.

`CI_PAGES_URL` determines Slidev asset prefixes and SPA fallback rules. Check both
root-host and GitLab project-path output after path/build changes:

```sh
nix develop -c task build
CI_PAGES_URL=https://example.gitlab.io/slides nix develop -c task pages
```

The homepage redirects to the blog's `/talks/`; decks stay on this site.
The blog owns permanent legacy `/slides/<slug>/` redirects for QR codes and conference
links. Do not deploy its cutover until the destination editions/assets/routes work.
