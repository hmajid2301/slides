import { readonly, ref, shallowRef } from 'vue'
import data from 'virtual:live-quiz/data'
import type { HostAction, HostView } from '../shared/types'
import { validateRecordingData } from '../shared/recording.js'
import { beginHostedSignIn, finishHostedSignIn } from './hostedAuth'

type Guard = () => boolean
type Auth = NonNullable<Awaited<ReturnType<typeof finishHostedSignIn>>>
type HostedStatus = 'disabled' | 'auth-expired' | 'unreachable' | 'ok'
const config = data.mode === 'hosted' ? data.hosted : undefined
const status = ref<HostedStatus>('disabled')
const message = ref<string | null>(null)
const view = shallowRef<HostView | null>(null)
const busy = ref(false)
const recordingError = ref<string | null>(null)
const room = ref<string | null>(null)
const authenticated = ref(false)
const epoch = ref(0)
const storageKey = `live-quiz:room:${config?.redirectUri}`
let auth: Auth | null = null
let expiry: ReturnType<typeof setTimeout> | undefined
let pollTimer: ReturnType<typeof setTimeout> | undefined
let polling: AbortController | null = null
let working: AbortController | null = null
let presenter: Guard = () => false
let returnRoute = () => ''

class APIError extends Error {
  constructor(readonly status: number, readonly code: string) { super('Quiz request failed.') }
}

const isRoomID = (id: unknown): id is string => typeof id === 'string' && /^[\w-]{1,100}$/.test(id)

function remember(id: string | null) {
  room.value = id
  try {
    if (id) sessionStorage.setItem(storageKey, JSON.stringify({ id, digest: config?.digest, server: config?.serverUrl }))
    else sessionStorage.removeItem(storageKey)
  }
  catch { /* Keeping the ID in memory is enough until a reload. */ }
}

function setAuth(value: Auth | null) {
  clearTimeout(expiry)
  auth = value
  authenticated.value = value !== null
  if (value) expiry = setTimeout(() => {
    setAuth(null)
    disconnect('auth-expired', 'Sign-in expired. Reconnect to resume.')
  }, Math.min(2_147_483_647, Math.max(0, value.expiresAt - Date.now())))
}

function disconnect(next: HostedStatus, reason: string) {
  epoch.value++
  clearTimeout(pollTimer)
  polling?.abort()
  working?.abort()
  polling = working = null
  busy.value = false
  view.value = null
  recordingError.value = null
  status.value = next
  message.value = reason
}

function fail(error: unknown, creating = false) {
  if (error instanceof APIError && error.status === 401) {
    setAuth(null)
    disconnect('auth-expired', 'Sign-in expired or rejected. Reconnect to sign in.')
  }
  else if (error instanceof APIError && !creating && error.status === 404) {
    remember(null)
    disconnect('unreachable', 'Room no longer exists. Start a new room explicitly.')
  }
  else if (error instanceof APIError && error.code === 'digest') {
    disconnect('unreachable', 'Server quiz differs from this deck. Use answer-only mode.')
  }
  else {
    disconnect('unreachable', creating && !room.value
      ? 'Room creation was not confirmed. It will not be retried automatically.'
      : 'Lost contact or the server rejected the request. Reconnect to read the room state.')
  }
}

async function request(path: string, controller: AbortController, method = 'GET', body?: unknown) {
  if (!presenter() || !config || !auth || auth.expiresAt <= Date.now()) throw new APIError(401, '')
  const response = await fetch(`${config.serverUrl}/api/quiz/sessions${path}`, {
    method, credentials: 'omit', cache: 'no-store', redirect: 'error',
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
    headers: { Authorization: `Bearer ${auth.accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (response.status === 401) throw new APIError(401, '')
  if (!response.ok) {
    const value = response.headers.get('content-type')?.startsWith('application/json')
      ? await response.json().catch(error => { if (!(error instanceof SyntaxError)) throw error; return null })
      : null
    throw new APIError(response.status, value?.error?.code ?? '')
  }
  return response.json()
}

function accept(value: HostView & { quizDigest?: string }, id: string) {
  if (value?.quizDigest !== config?.digest) throw new APIError(409, 'digest')
  if (value.sessionId !== id) throw new Error('Unexpected quiz room.')
  view.value = value
  status.value = 'ok'
  message.value = null
}

function schedule() {
  clearTimeout(pollTimer)
  if (status.value !== 'ok' || !room.value || !presenter()) return
  pollTimer = setTimeout(async () => {
    if (working || !room.value || !presenter()) { schedule(); return }
    const id = room.value
    const controller = polling = new AbortController()
    try {
      const value = await request(`/${id}`, controller)
      if (polling === controller && presenter()) accept(value, id)
    }
    catch (error) { if (polling === controller) fail(error) }
    finally {
      if (polling === controller) {
        polling = null
        schedule()
      }
    }
  }, 1000)
}

async function run(guard: Guard, task: (controller: AbortController) => Promise<boolean>, creating = false) {
  if (!config || !presenter() || !guard() || working) return false
  const controller = working = new AbortController()
  polling?.abort()
  polling = null
  busy.value = true
  try { return await task(controller) }
  catch (error) {
    if (working === controller) fail(error, creating)
    return false
  }
  finally {
    if (working === controller) {
      working = null
      busy.value = false
      schedule()
    }
  }
}

async function ensureAuth(guard: Guard, controller: AbortController) {
  if (!config) return false
  if (auth && auth.expiresAt > Date.now()) return true
  setAuth(null)
  const allowed = () => presenter() && guard() && !controller.signal.aborted
  try { await beginHostedSignIn(config, returnRoute(), allowed) }
  catch { if (allowed()) disconnect('auth-expired', 'Could not start sign-in. Retry from the presenter.') }
  return false
}

async function start(guard: Guard): Promise<void> {
  await run(guard, async controller => {
    if ((room.value && view.value?.phase !== 'winner') || !config || !await ensureAuth(guard, controller) || controller.signal.aborted || !guard()) return false
    recordingError.value = null
    const created = await request('', controller, 'POST', { quiz: data.quiz, skin: config.skin })
    if (controller.signal.aborted) return false
    if (created.digest !== config.digest) throw new APIError(409, 'digest')
    if (!isRoomID(created.id)) throw new Error('Missing room ID.')
    remember(created.id)
    // Do not dispatch another request if the presenter left the initiating slide.
    if (!guard()) {
      disconnect('unreachable', 'Room created. Reconnect to read its state.')
      return false
    }
    const value = await request(`/${created.id}`, controller)
    if (controller.signal.aborted) return false
    epoch.value++
    accept(value, created.id)
    return true
  }, true)
}

async function reconnect(guard: Guard): Promise<void> {
  await run(guard, async controller => {
    const id = room.value
    if (!id || !await ensureAuth(guard, controller) || controller.signal.aborted || !guard()) return false
    epoch.value++
    view.value = null
    const value = await request(`/${id}`, controller)
    if (controller.signal.aborted) return false
    accept(value, id)
    return true
  })
}

function action(input: HostAction, guard: Guard): Promise<boolean> {
  if (status.value !== 'ok' || !room.value) return Promise.resolve(false)
  const id = room.value
  // No queue: while a write is in flight, clicks are never saved for later.
  return run(guard, async controller => {
    const value = await request(`/${id}/actions`, controller, 'POST', input)
    if (controller.signal.aborted) return false
    accept(value, id)
    return true
  })
}

async function downloadRecording(guard: Guard): Promise<void> {
  const id = room.value
  if (!id || !config || view.value?.phase !== 'winner' || !view.value.standings?.length) return
  const digest = config.digest
  await run(guard, async controller => {
    recordingError.value = null
    let raw
    try { raw = await request(`/${id}/recording`, controller) }
    catch (error) {
      if (controller.signal.aborted) return false
      if (error instanceof APIError && (error.code === 'no_players' || error.status === 409)) {
        recordingError.value = 'No finished, non-empty recording is available.'
        return false
      }
      throw error
    }
    if (controller.signal.aborted || !guard()) return false
    try {
      const result = validateRecordingData(raw, data.quiz, digest)
      if (!result.standings.length) throw new Error('Empty recording')
      const url = URL.createObjectURL(new Blob([`${JSON.stringify(result, null, 2)}\n`], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'quiz-results.json'
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return true
    }
    catch {
      recordingError.value = 'Recording invalid or empty. Nothing downloaded.'
      return false
    }
  })
}

export async function setupHostedQuiz(opts: {
  isPresenter: Guard; returnRoute: () => string; restore: (route: string) => Promise<void>
}) {
  if (!config) return
  presenter = opts.isPresenter
  returnRoute = opts.returnRoute
  try {
    const result = await finishHostedSignIn(config)
    if (result) {
      await opts.restore(result.returnTo)
      if (presenter()) setAuth(result)
    }
  }
  catch { disconnect('auth-expired', 'Quiz sign-in failed or expired. Retry from the presenter.') }
}

export function enterHostedPresenter() {
  if (!config || !presenter()) return
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
    if (saved?.server === config.serverUrl && saved.digest === config.digest && isRoomID(saved.id)) room.value = saved.id
  }
  catch { /* Private/blocked storage must not break the deck. */ }
}

export function leaveHostedPresenter() {
  if (!config) return
  setAuth(null)
  room.value = null
  disconnect('disabled', 'Live quiz off: answer-only mode.')
}

export const hostedQuiz = {
  status: readonly(status), message: readonly(message), view, busy: readonly(busy), room: readonly(room),
  authenticated: readonly(authenticated), epoch: readonly(epoch), start, reconnect, action,
  downloadRecording, recordingError: readonly(recordingError),
}
