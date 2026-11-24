// Read and validate edition quiz data. Node-only; never imported by browser code.
// Rules mirror Banter Bus internal/quiz.Validate so both compute the same digest.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isAlias, isNode, parseDocument, visit } from 'yaml'
/** @typedef {import('../shared/types.ts').Quiz} Quiz */
/** @typedef {import('../shared/types.ts').Question} Question */
/** @typedef {import('../shared/types.ts').Recording} Recording */
/** @typedef {(path: string, message: string) => never} Fail */

const CHOICES = ['A', 'B', 'C', 'D']

export const QUIZ_FILE = 'quiz.yaml'
export const RECORDING_FILE = 'quiz-results.json'

const MAX_QUIZ_BYTES = 64 * 1024
const MAX_RECORDING_BYTES = 256 * 1024
const MAX_PLAYERS = 200
const POINTS_PER_QUESTION = 1000
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/
const DIGEST = /^[0-9a-f]{64}$/
// Go's unicode.IsControl (C0, DEL, C1) except \n, plus U+2028/2029: these encode
// differently in encoding/json and JSON.stringify, so the digest would not match.
// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]/
// eslint-disable-next-line no-control-regex
const NICK_FORBIDDEN = /[\u0000-\u001F\u007F-\u009F]/

class DataError extends Error {
  /** @param {string} file @param {string} path @param {string} message */
  constructor(file, path, message) {
    super(`${file}: ${path}: ${message}`)
    this.name = 'LiveQuizDataError'
  }
}

function record(v, path, keys, fail) {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(path, 'must be a mapping')
  const obj = v
  for (const k of Object.keys(obj)) {
    if (!keys.includes(k)) fail(path, `unknown key "${k}"`)
  }
  return obj
}

function list(v, path, fail) {
  if (!Array.isArray(v)) fail(path, 'must be a list')
  return v
}

/** Trim, then enforce the Go checkText rules. */
function text(v, path, max, fail) {
  if (typeof v !== 'string') fail(path, 'must be a string (quote numbers)')
  const s = (v).trim()
  if (!s) fail(path, 'required')
  if (!s.isWellFormed()) fail(path, 'invalid Unicode')
  if ([...s].length > max) fail(path, `at most ${max} characters`)
  if (FORBIDDEN.test(s)) fail(path, 'control characters and U+2028/U+2029 are not allowed')
  return s
}

function validateQuiz(raw, fail) {
  const root = record(raw, 'quiz', ['version', 'title', 'questions'], fail)
  if (root.version !== 1) fail('version', 'must be 1')
  const title = text(root.title, 'title', 120, fail)
  const items = list(root.questions, 'questions', fail)
  if (items.length < 1 || items.length > 50) fail('questions', 'need 1-50 questions')
  const seen = new Set()
  const questions = items.map((item, i) => {
    const p = `questions[${i}]`
    const q = record(item, p, ['id', 'prompt', 'options', 'correct', 'explanation', 'rule', 'revealItems'], fail)
    if (typeof q.id !== 'string' || !ID.test(q.id)) fail(`${p}.id`, `must match ${ID}`)
    const id = q.id
    if (seen.has(id)) fail(`${p}.id`, `duplicate "${id}"`)
    seen.add(id)
    const prompt = text(q.prompt, `${p}.prompt`, 500, fail)
    const opts = list(q.options, `${p}.options`, fail)
    if (opts.length !== 4) fail(`${p}.options`, 'need exactly 4 options')
    const options = opts.map((o, j) => text(o, `${p}.options[${j}]`, 200, fail))
    if (!CHOICES.includes(q.correct)) fail(`${p}.correct`, 'must be A, B, C or D')
    /** @type {Question} */
    const out = {
      id,
      prompt,
      options,
      correct: q.correct,
      explanation: text(q.explanation, `${p}.explanation`, 1000, fail),
    }
    if (q.rule !== undefined) out.rule = text(q.rule, `${p}.rule`, 1000, fail)
    if (q.revealItems !== undefined) {
      const reveal = list(q.revealItems, `${p}.revealItems`, fail)
      if (reveal.length > 32) fail(`${p}.revealItems`, 'at most 32 items')
      if (reveal.length) out.revealItems = reveal.map((r, j) => text(r, `${p}.revealItems[${j}]`, 80, fail))
    }
    return out
  })
  return { version: 1, title, questions }
}

/**
 * SHA-256 of compact JSON in fixed key order with empty optionals omitted.
 * Must equal Banter's quiz.Digest (Go struct order, SetEscapeHTML(false)).
 */
export function quizDigest(quiz) {
  const canonical = {
    version: quiz.version,
    title: quiz.title,
    questions: quiz.questions.map(q => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      ...(q.rule ? { rule: q.rule } : {}),
      ...(q.revealItems?.length ? { revealItems: q.revealItems } : {}),
    })),
  }
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}

/** Parse quiz YAML source; `file` names the source in errors. */
export function parseQuiz(source, file = QUIZ_FILE) {
  /** @type {Fail} */
  const fail = (path, message) => {
    throw new DataError(file, path, message)
  }
  if (Buffer.byteLength(source) > MAX_QUIZ_BYTES) fail('file', `larger than ${MAX_QUIZ_BYTES} bytes`)
  const doc = parseDocument(source, { uniqueKeys: true, strict: true, prettyErrors: true, schema: 'core' })
  if (doc.errors.length) fail('yaml', doc.errors[0].message)
  visit(doc, (_key, node) => {
    if (isAlias(node)) fail('yaml', 'aliases are not allowed')
    if (isNode(node) && node.tag) fail('yaml', `custom tag ${node.tag} is not allowed`)
  })
  return validateQuiz(doc.toJS(), fail)
}

export function readQuiz(editionDir) {
  const file = join(editionDir, QUIZ_FILE)
  return parseQuiz(readFileSync(file, 'utf8'), file)
}

function nonNegInt(v, path, max, fail) {
  if (!Number.isInteger(v) || v < 0 || v > max) fail(path, `must be an integer 0-${max}`)
  return v
}

/** Validate a recording against the current quiz. */
export function validateRecording(raw, quiz, file = RECORDING_FILE) {
  /** @type {Fail} */
  const fail = (path, message) => {
    throw new DataError(file, path, message)
  }
  const root = record(raw, 'recording', ['version', 'quizDigest', 'standings', 'rounds'], fail)
  if (root.version !== 1) fail('version', 'must be 1')
  if (typeof root.quizDigest !== 'string' || !DIGEST.test(root.quizDigest)) fail('quizDigest', 'must be a SHA-256 hex digest')
  if (root.quizDigest !== quizDigest(quiz)) fail('quizDigest', 'does not match quiz.yaml (questions changed since recording)')
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

/** Parse a recording's JSON text against the current quiz. */
export function parseRecording(source, quiz, file = RECORDING_FILE) {
  if (Buffer.byteLength(source) > MAX_RECORDING_BYTES) throw new DataError(file, 'file', `larger than ${MAX_RECORDING_BYTES} bytes`)
  let raw
  try {
    raw = JSON.parse(source)
  }
  catch (e) {
    throw new DataError(file, 'json', e.message)
  }
  return validateRecording(raw, quiz, file)
}

/** Optional recording: only a missing file means `null`; any other problem throws. */
export function readRecording(editionDir, quiz) {
  const file = join(editionDir, RECORDING_FILE)
  let source
  try {
    source = readFileSync(file, 'utf8')
  }
  catch (e) {
    if ((e).code === 'ENOENT') return null
    throw new DataError(file, 'file', e.message)
  }
  return parseRecording(source, quiz, file)
}
