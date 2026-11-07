# Migration status

## Local repositories

- Slides: `/home/haseeb/projects/slides`, branch `main` (new repository).
- Blog migration: `/home/haseeb/projects/blog-slides-migration`, branch
  `feat/slides-migration` (isolated worktree).
- Original blog checkout and its uncommitted slide work remain untouched.
- GitLab project: `git@gitlab.com:hmajid2301/slides.git`.
- The initial import is prepared for `main`; consult Git history and GitLab
  pipelines for commit/deployment status. DNS and the blog cutover remain pending.

## Deck conversion

All 12 decks keep Markdown sources at `content/slides/<old-slug>/slides.md`.
Existing Slidev work, shared add-ons, images, PDFs, demos, and existing tests were
copied from the working checkout. No new tests or test infrastructure were added.

For the 10 legacy Reveal decks, only the Hugo-specific format was replaced:

- Front matter becomes `deck.json`; native Reveal options retain themes/logos.
- Hugo section shortcodes become native horizontal/vertical separators, preserving
  the previously published slide coordinate structure.
- Notes become `Note:` blocks and fragments/backgrounds use native Reveal Markdown
  attribute comments. Mermaid stays editable as fenced Markdown.
- 115 legacy code-highlight fence headers use native `[ranges]` instead of Hugo's
  `{ranges}`; code contents and line counts are preserved. Slidev fences are unchanged.
- GitLab Runners' Hugo-rendered footnotes become standard Markdown links and a
  final references slide, preserving the old final slide's position.
- The previously empty faster-tests deck has a title-only placeholder.

`build-reveal.py` copies the pinned npm Reveal.js assets and generates only the
small HTML launcher. Reveal's Markdown plugin loads `slides.md` in the browser.
No deck content is authored as HTML. The original Markdown also remains available
in the original blog checkout; it was not replaced there.

`copy-slide-assets.py` preserves image/PDF paths, including images referenced
through runtime strings which Vite does not bundle automatically.

There is no reveal-hugo dependency in either the standalone repo or the blog
migration worktree. Hugo remains for the slides index and GitLab routing rules.

## Pages configuration

The default-branch/scheduled GitLab Pages job builds with the Nix dev shell and
publishes `public/`. The shell provides the tools used by every build step;
Reveal.js/Mermaid are pinned in the root pnpm manifest/lockfile and Slidev uses
its per-deck frozen lockfiles.

`task pages` derives the public base URL and asset prefix from `CI_PAGES_URL`.
This supports the GitLab Pages host for now, including a `/slides` project path.
The generated root `_redirects` contains per-deck SPA fallbacks for Slidev.

The permanent old-domain redirects still target `https://slides.haseebmajid.dev/`.
Before deploying the blog cutover, either configure that custom domain on the new
Pages project or deliberately update the blog's map to the verified GitLab Pages
host. Merely publishing at a different GitLab URL does not make those old links
safe to redirect yet.

## Compatibility and cutover gate

The blog worktree owns the authoritative `data/slide_redirects.toml` compatibility
map. Keep the standalone copy in sync. The blog generates 38 HTTP 301 rules via
Hugo for all 12 legacy deck slugs, their slash/no-slash URLs and nested files,
plus the old index. Keep these rules permanently for existing printed QR codes.

The blog worktree no longer exports decks and excludes old static slide files;
GitLab Pages serves files before redirects, so publishing stale slide output
would shadow the redirects. These are local, uncommitted changes only.

**Do not deploy the blog migration branch until the new destinations work.**

Before cutover:

1. Confirm mapping dates/events. GoLab HTMX uses its talk page's 2025-10-06 date,
   not the conflicting old deck metadata. Faster-tests and Python-to-Go have no
   recorded conference, so their paths use only the recorded date.
2. Push the initial import to the GitLab project and verify its actual Pages
   build. Configure the eventual custom domain/TLS if using the current redirect
   targets.
3. Check all edition URLs, PDFs, QR-code images, query strings, Reveal fragments,
   and Slidev routes on the live host.
4. Deploy the blog cutover using a fresh output directory; retain all old redirect
   mappings. Check GitLab's rule diagnostics at the old host's `/_redirects`.
5. Update `/talks/` links separately. Old source/PDF links owned by `gitlab.com`
   cannot be redirected by the blog; retain archival sources until that is
   addressed separately.

Full Nix Pages builds passed for both domain-root and `/slides` project-prefix
URLs; CI lint and the default-branch pipeline graph passed. All 12 deck pages,
eight PDFs, source images, and two Slidev routing rules were checked in output.

Browser-local verification compared all 10 converted decks against the previous
rendered decks for horizontal/vertical slide positions, speaker-note counts, and
non-code fragments. Both Slidev decks loaded and advanced under a simulated
GitLab project prefix, a converted Mermaid diagram rendered, and native code
highlight ranges/fragments were verified. All 225 original non-Mermaid code
blocks were also compared byte-for-byte after conversion. This is not an
exhaustive visual review of every slide or proof of live GitLab redirect behavior.
