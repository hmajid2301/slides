// Read and validate edition quiz data. Node-only; never imported by browser code.
// Rules mirror Banter Bus internal/quiz.Validate so both compute the same digest.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isAlias, isNode, parseDocument, visit } from 'yaml'
import { list, record, validateRecordingData } from '../shared/recording.js'
/** @typedef {import('../shared/types.ts').Quiz} Quiz */
/** @typedef {import('../shared/types.ts').Question} Question */
/** @typedef {(path: string, message: string) => never} Fail */

const CHOICES = ['A', 'B', 'C', 'D']

export const QUIZ_FILE = 'quiz.yaml'
export const RECORDING_FILE = 'quiz-results.json'

const MAX_QUIZ_BYTES = 64 * 1024
const MAX_RECORDING_BYTES = 256 * 1024
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/
// Go's unicode.IsControl (C0, DEL, C1) except \n, plus U+2028/2029: these encode
// differently in encoding/json and JSON.stringify, so the digest would not match.
// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]/

class DataError extends Error {
  /** @param {string} file @param {string} path @param {string} message */
  constructor(file, path, message) {
    super(`${file}: ${path}: ${message}`)
    this.name = 'LiveQuizDataError'
  }
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

/** Validate a recording against the current quiz. */
export function validateRecording(raw, quiz, file = RECORDING_FILE) {
  return validateRecordingData(raw, quiz, quizDigest(quiz), (path, message) => {
    throw new DataError(file, path, message)
  })
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
