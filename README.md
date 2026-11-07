# Slides

Standalone Reveal.js and Slidev decks. Talk descriptions, recordings, and event
pages stay at <https://haseebmajid.dev/talks/> in the blog repo.

## Nix development shell

```sh
nix develop path:.
task build
task start_server
```

The shell provides Node, pnpm, Python, Hugo, Go (for demos), jq, and Task. The
explicit `path:.` form also works before the initial Git commit. Root and
per-deck npm dependencies use committed pnpm lockfiles.

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
Hugo shortcodes in the converted Reveal sources. Hugo builds the index and
GitLab routing rules, not the deck content.

`data/slide_redirects.toml` maps source directories to published
`<topic>/<YYYY-MM-DD>-<event>/` edition URLs. Source directories remain unchanged
to keep shared imports and local assets intact.

## GitLab Pages

The `pages` job runs `nix develop -c task pages` on the default branch or a
schedule and publishes `public/`. `task pages` uses `CI_PAGES_URL` for the Hugo
base URL and Slidev asset prefix, so both unique-domain and project-path Pages
URLs work without a custom domain.

For a local build matching a GitLab project-path deployment:

```sh
CI_PAGES_URL=https://example.gitlab.io/slides nix develop path:. -c task pages
```

Run `task build` without the Pages environment to rebuild for the eventual
`https://slides.haseebmajid.dev/` host. Assets and build output are generated and
ignored, except for hand-maintained CSS, favicons, and `reveal-init.js`.

The blog owns permanent old `/slides/<slug>/` redirects for QR codes and conference
links. Do not deploy its cutover until their destinations are verified. See
[migration status](docs/slides-migration.md).
