// Browser-safe recording validation shared by local playback and hosted export.
const MAX_PLAYERS = 200
const POINTS_PER_QUESTION = 1000
const DIGEST = /^[0-9a-f]{64}$/
// eslint-disable-next-line no-control-regex
const NICK_FORBIDDEN = /[\u0000-\u001F\u007F-\u009F]/

export function record(v, path, keys, fail) {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(path, 'must be a mapping')
  for (const k of Object.keys(v)) {
    if (!keys.includes(k)) fail(path, `unknown key "${k}"`)
  }
  return v
}

export function list(v, path, fail) {
  if (!Array.isArray(v)) fail(path, 'must be a list')
  return v
}

function nonNegInt(v, path, max, fail) {
  if (!Number.isInteger(v) || v < 0 || v > max) fail(path, `must be an integer 0-${max}`)
  return v
}

/** @returns {import('./types.ts').Recording} */
export function validateRecordingData(raw, quiz, expectedDigest, fail = (path, message) => {
  throw new Error(`${path}: ${message}`)
}) {
  const root = record(raw, 'recording', ['version', 'quizDigest', 'standings', 'rounds'], fail)
  if (root.version !== 1) fail('version', 'must be 1')
  if (typeof root.quizDigest !== 'string' || !DIGEST.test(root.quizDigest)) fail('quizDigest', 'must be a SHA-256 hex digest')
  if (root.quizDigest !== expectedDigest) fail('quizDigest', 'does not match quiz.yaml (questions changed since recording)')
  const rounds = list(root.rounds, 'rounds', fail)
  if (rounds.length !== quiz.questions.length) fail('rounds', `need one entry per question (${quiz.questions.length})`)
  const outRounds = rounds.map((r, i) => {
    const p = `rounds[${i}]`
    const round = record(r, p, ['questionId', 'counts'], fail)
    if (round.questionId !== quiz.questions[i].id) fail(`${p}.questionId`, `expected "${quiz.questions[i].id}"`)
    const counts = list(round.counts, `${p}.counts`, fail)
    if (counts.length !== 4) fail(`${p}.counts`, 'need 4 counts')
    const c = counts.map((n, j) => nonNegInt(n, `${p}.counts[${j}]`, MAX_PLAYERS, fail))
    if (c.reduce((a, b) => a + b, 0) > MAX_PLAYERS) fail(`${p}.counts`, `sum above ${MAX_PLAYERS}`)
    return { questionId: quiz.questions[i].id, counts: c }
  })
  const standings = list(root.standings, 'standings', fail)
  if (standings.length > MAX_PLAYERS) fail('standings', `at most ${MAX_PLAYERS}`)
  const maxScore = quiz.questions.length * POINTS_PER_QUESTION
  let prev = Infinity
  const outStandings = standings.map((s, i) => {
    const p = `standings[${i}]`
    const st = record(s, p, ['rank', 'nickname', 'score'], fail)
    if (st.rank !== i + 1) fail(`${p}.rank`, `expected ${i + 1}`)
    const nick = st.nickname
    if (typeof nick !== 'string' || nick !== nick.normalize('NFC').trim() || !nick || [...nick].length > 24 || NICK_FORBIDDEN.test(nick) || !nick.isWellFormed())
      fail(`${p}.nickname`, 'must be 1-24 trimmed characters without control characters')
    const score = nonNegInt(st.score, `${p}.score`, maxScore, fail)
    if (score > prev) fail(`${p}.score`, 'scores must not increase')
    prev = score
    return { rank: i + 1, nickname: nick, score }
  })
  return { version: 1, quizDigest: root.quizDigest, standings: outStandings, rounds: outRounds }
}
