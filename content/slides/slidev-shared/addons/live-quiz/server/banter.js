// Typed client for Banter Bus's quiz host API. Bearer token only.

/** @typedef {import('../shared/types.ts').Quiz} Quiz */
/** @typedef {import('../shared/types.ts').HostView} HostView */
/** @typedef {import('../shared/types.ts').HostAction} HostAction */
/** @typedef {import('../shared/types.ts').Skin} Skin */
/** @typedef {import('./oidc.js').TokenSource} TokenSource */

const TIMEOUT_MS = 5000

export class BanterError extends Error {
  /** @param {number} status @param {string} code @param {string} message */
  constructor(status, code, message) {
    super(message)
    this.name = 'BanterError'
    this.status = status
    this.code = code
  }
}

export class BanterClient {
  /** @param {string} baseUrl @param {TokenSource} tokens */
  constructor(baseUrl, tokens) {
    this.base = baseUrl.replace(/\/+$/, '')
    this.tokens = tokens
  }

  /** @param {string} method @param {string} path @param {unknown} [body] */
  async call(method, path, body) {
    let token
    try {
      token = await this.tokens.get()
    }
    catch (e) {
      throw new BanterError(401, /** @type {Error} */ (e).message, 'not signed in')
    }
    /** @type {Record<string, string>} */
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    let res
    try {
      res = await fetch(this.base + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    }
    catch (e) {
      throw new BanterError(0, 'unreachable', `Banter unreachable: ${/** @type {Error} */ (e).message}`)
    }
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const err = json?.error
      throw new BanterError(res.status, err?.code ?? 'http', err?.message ?? `HTTP ${res.status}`)
    }
    return json
  }

  /** @param {Quiz} quiz @param {Skin} skin @returns {Promise<{ id: string, joinUrl: string, digest: string }>} */
  create(quiz, skin) {
    return this.call('POST', '/api/quiz/sessions', { quiz, skin })
  }

  /** @param {string} id @param {Quiz} quiz @returns {Promise<{ id: string, joinUrl: string, digest: string }>} */
  replaceQuiz(id, quiz) {
    return this.call('PUT', `/api/quiz/sessions/${encodeURIComponent(id)}/quiz`, quiz)
  }

  /** @param {string} id @returns {Promise<HostView>} */
  view(id) {
    return this.call('GET', `/api/quiz/sessions/${encodeURIComponent(id)}`)
  }

  /** @param {string} id @param {HostAction} action @returns {Promise<HostView>} */
  action(id, action) {
    return this.call('POST', `/api/quiz/sessions/${encodeURIComponent(id)}/actions`, action)
  }

  /** @param {string} id @returns {Promise<unknown>} */
  recording(id) {
    return this.call('GET', `/api/quiz/sessions/${encodeURIComponent(id)}/recording`)
  }
}
