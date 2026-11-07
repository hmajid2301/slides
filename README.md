# Slides

Standalone Reveal.js and Slidev decks. Talk descriptions, recordings, and event
pages stay at <https://haseebmajid.dev/talks/> in the blog repo.

## Nix development shell

```sh
nix develop path:.
task build
task start_server
```

The shell provides Node, pnpm, Task, Go (for demos), and miniserve for local
previews at <http://localhost:1313/>. Root and per-deck npm dependencies use
committed pnpm lockfiles. No Hugo or Python is needed to build the site.

## Editing decks

All deck content stays in `content/slides/<old-slug>/slides.md`.

- **Reveal.js:** edit Markdown; `deck.json` holds the title, theme, logo, and Reveal
  options. `---` starts a horizontal slide; `----` starts a vertical slide.
  `Note:` begins speaker notes. Native Reveal Markdown attribute comments handle
  fragments and slide backgrounds. Mermaid uses fenced `mermaid` blocks.
- **Slidev:** edit Markdown/Vue as before. Shared components and themes remain in
  `content/slides/slidev-shared/`. Run `pnpm dev` from a Slidev deck directory
  after `pnpm install --frozen-lockfile`.

Reveal.js loads external Markdown using its standard Markdown plugin. Generated
HTML is only a launcher; do not edit it. There is no reveal-hugo module and no
Hugo shortcodes in the converted Reveal sources.

`data/slide_redirects.json` maps source directories to published
`<topic>/<YYYY-MM-DD>-<event>/` edition URLs. Source directories remain unchanged
to keep shared imports and local assets intact.

## GitLab Pages

The `pages` job runs `nix develop -c task pages` on the default branch or a
schedule and publishes `public/`. One script, `scripts/build.mjs`, creates a
fresh output directory, copies shared assets, generates Reveal launchers, builds
Slidev decks, and preserves images/PDFs. It uses `CI_PAGES_URL` for the Slidev
asset prefix and `_redirects`, so both unique-domain and project-path Pages URLs
work without a custom domain. The homepage redirects to the blog's `/talks/`;
individual deck URLs remain on this site.

For a local build matching a GitLab project-path deployment:

```sh
CI_PAGES_URL=https://example.gitlab.io/slides nix develop path:. -c task pages
```

Run `task build` without `CI_PAGES_URL` to build for
`https://slides.haseebmajid.dev/`. Output goes directly to `public/` and is
ignored. Hand-maintained CSS, favicons, and `reveal-init.js` stay in `static/slides/`.

The blog owns permanent old `/slides/<slug>/` redirects for QR codes and conference
links. Do not deploy its cutover until their destinations are verified. See
[migration status](docs/slides-migration.md).
