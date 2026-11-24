// OAuth 2.0 device authorization grant (RFC 8628) against an OIDC issuer.
// Tokens live in this process only: never logged, written or sent to a browser.

const TIMEOUT_MS = 5000
const REFRESH_EARLY_MS = 60_000
const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

/**
 * @typedef {object} TokenSource
 * @property {() => Promise<string>} get Current access token; rejects while pending or expired.
 * @property {() => 'pending' | 'ok' | 'expired'} state
 * @property {() => void} relogin Start a new device login (after expiry).
 * @property {() => void} close
 */

/** @param {string} url @param {RequestInit} [init] */
async function fetchJSON(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body }
}

/** @param {number} ms @param {AbortSignal} signal */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    t.unref?.()
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(signal.reason)
    }, { once: true })
  })
}

/**
 * @param {{ issuer: string, clientId: string, scope: string, log: (msg: string) => void }} cfg
 * @returns {TokenSource}
 */
export function startDeviceLogin(cfg) {
  const abort = new AbortController()
  /** @type {'pending' | 'ok' | 'expired'} */
  let state = 'pending'
  /** @type {{ access: string, refresh?: string, expiresAt: number } | null} */
  let tokens = null
  /** @type {Promise<Record<string, any>> | null} */
  let discovery = null
  let loginRunning = false

  const meta = () => {
    discovery ??= fetchJSON(new URL('.well-known/openid-configuration', cfg.issuer.replace(/\/?$/, '/')).href).then((r) => {
      if (!r.ok || !r.body.device_authorization_endpoint || !r.body.token_endpoint)
        throw new Error('issuer does not advertise the device authorization grant')
      return r.body
    }).catch((e) => {
      discovery = null
      throw e
    })
    return discovery
  }

  /** @param {Record<string, any>} body */
  const accept = (body) => {
    tokens = {
      access: body.access_token,
      refresh: body.refresh_token ?? tokens?.refresh,
      expiresAt: Date.now() + (Number(body.expires_in) || 300) * 1000,
    }
    state = 'ok'
    scheduleRefresh()
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let refreshTimer
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer)
    if (!tokens) return
    refreshTimer = setTimeout(refresh, Math.max(1000, tokens.expiresAt - Date.now() - REFRESH_EARLY_MS))
    refreshTimer.unref?.()
  }

  const expire = (/** @type {string} */ why) => {
    tokens = null
    state = 'expired'
    cfg.log(`live quiz: sign-in expired (${why}). The quiz runs answer-only until you sign in again.`)
    login()
  }

  async function refresh() {
    if (abort.signal.aborted) return
    if (!tokens?.refresh) return expire('no refresh token')
    try {
      const m = await meta()
      const r = await fetchJSON(m.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh, client_id: cfg.clientId }),
      })
      if (r.ok && r.body.access_token) return accept(r.body)
      if (Date.now() >= tokens.expiresAt) return expire(`refresh failed: ${r.body.error ?? r.status}`)
    }
    catch {
      if (tokens && Date.now() >= tokens.expiresAt) return expire('refresh failed: network')
    }
    // Still valid: retry shortly.
    refreshTimer = setTimeout(refresh, 10_000)
    refreshTimer.unref?.()
  }

  async function login() {
    if (loginRunning || abort.signal.aborted) return
    loginRunning = true
    try {
      for (;;) {
        try {
          const m = await meta()
          const start = await fetchJSON(m.device_authorization_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: cfg.clientId, scope: cfg.scope }),
          })
          if (!start.ok) throw new Error(`device authorization failed: ${start.body.error ?? start.status}`)
          const d = start.body
          cfg.log(d.verification_uri_complete
            ? `live quiz: approve sign-in at ${d.verification_uri_complete}`
            : `live quiz: open ${d.verification_uri} and enter code ${d.user_code}`)
          let interval = (Number(d.interval) || 5) * 1000
          const deadline = Date.now() + (Number(d.expires_in) || 600) * 1000
          while (Date.now() < deadline) {
            await sleep(interval, abort.signal)
            const r = await fetchJSON(m.token_endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ grant_type: DEVICE_GRANT, device_code: d.device_code, client_id: cfg.clientId }),
            }).catch(() => ({ ok: false, status: 0, body: { error: 'authorization_pending' } }))
            if (r.ok && r.body.access_token) {
              accept(r.body)
              cfg.log('live quiz: signed in.')
              return
            }
            if (r.body.error === 'slow_down') interval += 5000
            else if (r.body.error !== 'authorization_pending') throw new Error(`sign-in failed: ${r.body.error ?? r.status}`)
          }
          cfg.log('live quiz: sign-in code expired; requesting a new one.')
        }
        catch (e) {
          if (abort.signal.aborted) return
          cfg.log(`live quiz: ${/** @type {Error} */ (e).message}; retrying in 30 s.`)
          await sleep(30_000, abort.signal)
        }
      }
    }
    catch {
      // aborted
    }
    finally {
      loginRunning = false
    }
  }

  login()

  return {
    async get() {
      if (state === 'ok' && tokens && Date.now() < tokens.expiresAt) return tokens.access
      if (state === 'ok') expire('token expired')
      throw new Error(state === 'pending' ? 'auth-pending' : 'auth-expired')
    },
    state: () => state,
    relogin: login,
    close() {
      abort.abort()
      clearTimeout(refreshTimer)
      tokens = null
    },
  }
}
