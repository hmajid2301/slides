// Private loopback middleware between the local deck and Banter Bus.
// GET  /__quiz/projector    -> { status, view?, message? }
// POST /__quiz/host/action  -> { view, recording? } | { error: { code, message } }
import { randomBytes } from 'node:crypto'
import { readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { RECORDING_FILE, validateRecording } from './data.js'

/** @typedef {import('node:http').IncomingMessage} Req */
/** @typedef {import('node:http').ServerResponse} Res */
/** @typedef {import('../shared/types.ts').HostAction} HostAction */
/** @typedef {import('../shared/types.ts').HostView} HostView */
/** @typedef {import('../shared/types.ts').ProjectorResponse} ProjectorResponse */

const CACHE_MS = 1000
const MAX_BODY = 2048
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const ACTIONS = new Set(['open', 'reveal', 'leaderboard', 'winner'])

/**
 * Process-wide state for one edition. Survives HMR and Vite config restarts.
 * @typedef {object} Owner
 * @property {import('./oidc.js').TokenSource | null} tokens
 * @property {import('./banter.js').BanterClient | null} client
 * @property {string | null} sessionId
 * @property {string | null} digest Digest Banter holds for the session.
 * @property {import('../shared/types.ts').Quiz} quiz Current local quiz.
 * @property {string} localDigest
 * @property {import('../shared/types.ts').Skin} skin
 * @property {boolean} restartRequired
 * @property {string | null} lost Reason the session is unusable.
 * @property {Promise<void> | null} creating
 * @property {{ at: number, promise: Promise<ProjectorResponse> } | null} cache
 * @property {Promise<unknown>} writes Serialises recording writes.
 * @property {string | null} lastWritten Bytes of the last recording this process wrote.
 */

/** @param {Res} res @param {number} status @param {unknown} body */
function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(body))
}

/** @param {Res} res @param {number} status @param {string} code @param {string} message */
function fail(res, status, code, message) {
  send(res, status, { error: { code, message } })
}

/** @param {Req} req */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    /** @type {Buffer[]} */
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        // Stop buffering; the 413 reply closes the connection.
        req.removeAllListeners('data')
        req.pause()
        reject(Object.assign(new Error('body too large'), { status: 413 }))
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** @param {unknown} v @returns {HostAction | null} */
function parseAction(v) {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null
  const a = /** @type {Record<string, unknown>} */ (v)
  if (typeof a.type !== 'string' || !ACTIONS.has(a.type)) return null
  if (a.type === 'winner') return Object.keys(a).length === 1 ? { type: 'winner' } : null
  if (typeof a.questionId !== 'string' || Object.keys(a).length !== 2) return null
  return /** @type {HostAction} */ ({ type: a.type, questionId: a.questionId })
}

/** @param {Owner} owner */
async function ensureSession(owner) {
  if (owner.sessionId || !owner.client) return
  owner.creating ??= owner.client.create(owner.quiz, owner.skin).then((s) => {
    owner.sessionId = s.id
    owner.digest = s.digest
    if (s.digest !== owner.localDigest) owner.lost = 'Banter computed a different quiz digest; check both validators'
  }).finally(() => {
    owner.creating = null
  })
  await owner.creating
}

/** @param {unknown} e */
function statusFor(e) {
  const err = /** @type {{ status?: number, code?: string, message?: string }} */ (e)
  if (err.code === 'auth-pending') return /** @type {const} */ ('auth-pending')
  if (err.code === 'auth-expired' || err.status === 401) return /** @type {const} */ ('auth-expired')
  return /** @type {const} */ ('unreachable')
}

/** @param {Owner} owner @returns {Promise<ProjectorResponse>} */
async function projector(owner) {
  if (!owner.client || !owner.tokens) return { status: 'disabled' }
  if (owner.restartRequired)
    return { status: 'restart-required', message: 'quiz.yaml changed after players joined. Restart `pnpm dev` for a new game.' }
  if (owner.lost) return { status: 'unreachable', message: owner.lost }
  const state = owner.tokens.state()
  if (state !== 'ok') return { status: state === 'pending' ? 'auth-pending' : 'auth-expired' }
  try {
    await ensureSession(owner)
    if (!owner.sessionId) return { status: 'unreachable' }
    const view = await owner.client.view(owner.sessionId)
    return { status: 'ok', view }
  }
  catch (e) {
    const err = /** @type {{ status?: number, message?: string }} */ (e)
    if (err.status === 404 && owner.sessionId) {
      owner.lost = 'Banter lost the quiz session (server restarted?). Answer-only until `pnpm dev` restarts.'
      return { status: 'unreachable', message: owner.lost }
    }
    if (err.status === 403) return { status: 'auth-expired', message: 'Signed-in user lacks quiz:host or does not own this session.' }
    return { status: statusFor(e), message: err.message }
  }
}

/** @param {Owner} owner */
function cachedProjector(owner) {
  const now = Date.now()
  if (!owner.cache || now - owner.cache.at >= CACHE_MS) owner.cache = { at: now, promise: projector(owner) }
  return owner.cache.promise
}

/**
 * Write the recording atomically. Never overwrites with an empty room; skips identical bytes.
 * @param {Owner} owner @param {string} editionDir @returns {Promise<'written' | 'unchanged' | 'no-players'>}
 */
async function record(owner, editionDir) {
  if (!owner.client || !owner.sessionId) throw new Error('no session')
  let raw
  try {
    raw = await owner.client.recording(owner.sessionId)
  }
  catch (e) {
    if (/** @type {{ code?: string }} */ (e).code === 'no_players') return 'no-players'
    throw e
  }
  const rec = validateRecording(raw, owner.quiz, 'Banter recording')
  if (rec.standings.length === 0) return 'no-players'
  const text = `${JSON.stringify(rec, null, 2)}\n`
  const file = join(editionDir, RECORDING_FILE)
  let current = null
  try {
    current = readFileSync(file, 'utf8')
  }
  catch {
    // missing
  }
  if (current === text) return 'unchanged'
  const tmp = `${file}.${randomBytes(6).toString('hex')}.tmp`
  owner.lastWritten = text
  try {
    writeFileSync(tmp, text, { flag: 'wx' })
    renameSync(tmp, file)
  }
  catch (e) {
    try {
      unlinkSync(tmp)
    }
    catch {
      // not created
    }
    throw e
  }
  return 'written'
}

/**
 * @param {{ owner: Owner, editionDir: string, allowedHosts: () => Set<string> }} opts
 * @returns {(req: Req, res: Res, next: () => void) => void}
 */
export function createProxy({ owner, editionDir, allowedHosts }) {
  return (req, res, next) => {
    const path = (req.url ?? '').split('?')[0]
    if (path !== '/__quiz/projector' && path !== '/__quiz/host/action') return next()
    // Guards run before any upstream call or write.
    if (!LOOPBACK.has(req.socket.remoteAddress ?? '')) return fail(res, 403, 'forbidden', 'loopback only')
    const host = req.headers.host ?? ''
    if (!allowedHosts().has(host)) return fail(res, 403, 'forbidden', 'unexpected Host')
    const site = req.headers['sec-fetch-site']
    if (site && site !== 'same-origin' && site !== 'none') return fail(res, 403, 'forbidden', 'cross-site request')

    if (path === '/__quiz/projector') {
      if (req.method !== 'GET') return fail(res, 405, 'method', 'GET only')
      cachedProjector(owner).then(body => send(res, 200, body), e => fail(res, 500, 'internal', String(e)))
      return
    }

    if (req.method !== 'POST') return fail(res, 405, 'method', 'POST only')
    if (req.headers.origin !== `http://${host}`) return fail(res, 403, 'forbidden', 'bad Origin')
    if (req.headers['x-quiz-client'] !== 'host') return fail(res, 403, 'forbidden', 'missing X-Quiz-Client')
    if (!/^application\/json(;|$)/.test(req.headers['content-type'] ?? '')) return fail(res, 415, 'invalid', 'JSON only')
    ;(async () => {
      let action
      try {
        action = parseAction(JSON.parse(await readBody(req)))
      }
      catch (e) {
        const status = /** @type {{ status?: number }} */ (e).status ?? 400
        if (status === 413) res.setHeader('Connection', 'close')
        return fail(res, status, status === 413 ? 'too_large' : 'invalid', 'invalid action')
      }
      if (!action) return fail(res, 400, 'invalid', 'invalid action')
      const state = await projector(owner)
      if (state.status !== 'ok' || !owner.client || !owner.sessionId)
        return fail(res, 503, state.status, state.message ?? state.status)
      try {
        const view = await owner.client.action(owner.sessionId, action)
        owner.cache = { at: Date.now(), promise: Promise.resolve({ status: 'ok', view }) }
        if (action.type !== 'winner') return send(res, 200, { view })
        const run = owner.writes.then(() => record(owner, editionDir))
        owner.writes = run.catch(() => {})
        try {
          send(res, 200, { view, recording: await run })
        }
        catch (e) {
          fail(res, 502, 'record_failed', `winner shown, but saving ${RECORDING_FILE} failed: ${/** @type {Error} */ (e).message}`)
        }
      }
      catch (e) {
        const err = /** @type {{ status?: number, code?: string, message?: string }} */ (e)
        fail(res, err.status && err.status >= 400 ? err.status : 502, err.code ?? 'upstream', err.message ?? 'upstream error')
      }
    })()
  }
}
