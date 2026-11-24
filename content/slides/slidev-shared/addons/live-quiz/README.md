# Slidev Live Quiz

Slide-driven audience quiz. Phones play on [Banter Bus](https://banterbus.games)
quiz mode; slide clicks drive it through a private, loopback-only Vite proxy.
Static builds show questions, answers and the recorded result, and never
contact Banter. Private, `UNLICENSED`, not published.

## Install

In the edition folder:

```sh
pnpm add slidev-addon-live-quiz@file:../../slidev-shared/addons/live-quiz
```

This is a copied `file:` install: rerun `pnpm install` after changing the add-on.
Plugin files are plain JS with JSDoc, because Node cannot strip TypeScript under
`node_modules`.

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url'
import { liveQuiz } from 'slidev-addon-live-quiz/vite'

export default {
  plugins: [...liveQuiz({ editionDir: fileURLToPath(new URL('.', import.meta.url)), skin: 'arcade' })],
}
```

## Data

- `quiz.yaml` (required): `version: 1`, `title`, 1–50 `questions` with `id`
  (`^[a-z0-9][a-z0-9-]{0,63}$`), `prompt` (≤500), four `options` (≤200 each,
  quote numbers), `correct` A–D, `explanation` (≤1000), optional `rule` and
  `revealItems` (≤32 × 80). Plain text only. No aliases, tags, duplicate or unknown keys.
  Strings must not contain control characters (except newline) or U+2028/2029.
- `quiz-results.json` (optional): written by the winner action in dev. Missing means
  "no recorded results". Malformed or stale (quiz digest changed) fails the build.

The quiz digest (SHA-256 of compact JSON in fixed key order) must match Banter's
`quiz.Digest`. Keep the validators in `server/data.js` and Banter's
`internal/quiz/quiz.go` in sync.

`virtual:live-quiz/data` exports `{ quiz, recording, mode }`, with `mode` set to `live`
under `slidev dev` and `offline` in builds.

## Live mode (`pnpm dev` only)

```sh
QUIZ_SERVER_URL=https://banterbus.haseebmajid.dev \
QUIZ_OIDC_ISSUER=https://id.haseebmajid.dev \
QUIZ_OIDC_CLIENT_ID=banter-quiz \
pnpm dev
```

Optional `QUIZ_SKIN=neutral|arcade`. If any variable is missing, the deck runs answer-only.
The terminal prints a sign-in URL. Approve it (any device), then open the **presenter view**:
only the active slide there drives the quiz. The audience window, previews, overview and
export are read-only. Only members of the client's allowed Pocket ID group can sign in; Banter accepts any
token whose `aud` is its `BANTERBUS_QUIZ_AUDIENCE` (the client ID).

- The token stays in the Vite process. The browser talks only to loopback-only
  `/__quiz/projector` and `/__quiz/host/action` (exact Origin, `X-Quiz-Client: host`, JSON).
  Do not combine this with `--remote`/`--host`.
- Clicks: 1 open (15 s), 2 reveal, 3 leaderboard. Backtracking and reloads never reopen or
  re-score. The winner slide sends `winner` once, after the final leaderboard, then writes
  `quiz-results.json` (temp file + rename). It never writes an empty room; repeating
  rewrites only if the bytes differ. After a reload use **Save results again**.
- `quiz.yaml` edits are pushed to Banter until someone joins; after that, restart `pnpm dev`.
- Sign-in expiry, Banter down or a Banter restart show a reason and fall back to answer-only.

## Components

`<QuizJoin compact? />`, `<QuizQuestion id="…" :step="$clicks" />` (with `clicks: 3`),
`<QuizWinner />`, `<QuizScore />`, `<QuizLeaderboard :standings />`. Style with `--quiz-*`
variables on `.live-quiz` (see `styles/index.css`) from an edition stylesheet, e.g.
`go-simd/2026-11-17/styles/quiz-theme.css`. Banter's phone skin has its own copy
(`.quiz-arcade` in Banter's `static/css/tailwind.css`): keep the two in sync.

See [example.md](./example.md).
