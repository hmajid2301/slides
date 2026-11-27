import type { HostedQuizConfig } from '../shared/types'

const REDIRECT_TTL = 5 * 60_000
const TIMEOUT = 5_000
const callbackKeys = ['code', 'state', 'iss', 'error', 'error_description', 'error_uri', 'session_state']

const key = (config: HostedQuizConfig) => `live-quiz:oauth:${config.redirectUri}`
const presenterRoute = /^\/presenter\/[1-9]\d*(?:\?clicks=\d+)?$/

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function discovery(config: HostedQuizConfig, signal: AbortSignal) {
  const response = await fetch(`${config.issuer}/.well-known/openid-configuration`, {
    credentials: 'omit', cache: 'no-store', redirect: 'error', signal,
  })
  if (!response.ok) throw new Error('Quiz sign-in provider unavailable.')
  const metadata = await response.json()
  if (metadata.issuer !== config.issuer) throw new Error('Unexpected quiz sign-in issuer.')
  const endpoint = (raw: unknown) => {
    const url = new URL(typeof raw === 'string' ? raw : '')
    if (url.origin !== new URL(config.issuer).origin || url.username || url.password || url.hash)
      throw new Error('Unexpected quiz sign-in endpoint.')
    return url
  }
  return {
    authorize: endpoint(metadata.authorization_endpoint), token: endpoint(metadata.token_endpoint),
    issuerRequired: metadata.authorization_response_iss_parameter_supported === true,
  }
}

export async function beginHostedSignIn(config: HostedQuizConfig, returnTo: string, allowed = () => true): Promise<void> {
  if (!presenterRoute.test(returnTo) || location.origin !== new URL(config.redirectUri).origin)
    throw new Error('Open the hosted presenter to sign in.')
  const { authorize } = await discovery(config, AbortSignal.timeout(TIMEOUT))
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const state = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
  if (!allowed()) return
  sessionStorage.setItem(key(config), JSON.stringify({
    issuer: config.issuer, clientId: config.clientId, state, verifier, returnTo, expiresAt: Date.now() + REDIRECT_TTL,
  }))
  for (const [name, value] of Object.entries({
    response_type: 'code', client_id: config.clientId, redirect_uri: config.redirectUri,
    scope: 'openid', state, code_challenge: challenge, code_challenge_method: 'S256',
  })) authorize.searchParams.set(name, value)
  location.assign(authorize)
}

export async function finishHostedSignIn(config: HostedQuizConfig): Promise<{
  accessToken: string; expiresAt: number; returnTo: string
} | null> {
  const url = new URL(location.href)
  if (!url.searchParams.has('code') && !url.searchParams.has('error')) return null
  const params = new URLSearchParams(url.search)
  // Vue Router's hash history adds an empty `#/` before Slidev calls app setup.
  const isCallback = `${url.origin}${url.pathname}` === config.redirectUri &&
    (!url.hash || url.hash === '#/') && !url.username && !url.password
  for (const name of callbackKeys) url.searchParams.delete(name)
  history.replaceState(history.state, '', url)
  if (!isCallback) return null

  const stored = sessionStorage.getItem(key(config))
  sessionStorage.removeItem(key(config))
  const pending = stored ? JSON.parse(stored) : null
  const code = params.get('code')
  const iss = params.get('iss')
  if (!pending || !code || params.has('error') || params.getAll('code').length !== 1 ||
    params.getAll('state').length !== 1 || !pending.state || params.get('state') !== pending.state ||
    !Number.isFinite(pending.expiresAt) || pending.expiresAt <= Date.now() ||
    pending.issuer !== config.issuer || pending.clientId !== config.clientId ||
    params.getAll('iss').length > 1 || (iss !== null && iss !== config.issuer) ||
    typeof pending.returnTo !== 'string' || !presenterRoute.test(pending.returnTo) ||
    typeof pending.verifier !== 'string' || !/^[\w-]{43}$/.test(pending.verifier))
    throw new Error('Quiz sign-in cancelled or expired. Sign in again from the presenter.')

  const signal = AbortSignal.timeout(TIMEOUT)
  const { token, issuerRequired } = await discovery(config, signal)
  if (issuerRequired && iss !== config.issuer) throw new Error('Missing quiz sign-in issuer.')
  const response = await fetch(token.href, {
    method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', signal,
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: config.clientId,
      redirect_uri: config.redirectUri, code, code_verifier: pending.verifier }),
  })
  if (!response.ok) throw new Error('Quiz sign-in exchange failed.')
  const payload = await response.json()
  if (typeof payload.access_token !== 'string' || !/^[\w.~+/=-]+$/.test(payload.access_token) ||
    typeof payload.token_type !== 'string' || payload.token_type.toLowerCase() !== 'bearer' ||
    typeof payload.expires_in !== 'number' || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0)
    throw new Error('Unexpected quiz sign-in response.')
  return { accessToken: payload.access_token, expiresAt: Date.now() + payload.expires_in * 1000, returnTo: pending.returnTo }
}
