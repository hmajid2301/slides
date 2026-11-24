// Browser-side quiz state: one poller per app, offline adapter in builds.
import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import data from 'virtual:live-quiz/data'
import type { HostAction, HostView, ProjectorResponse, ProjectorStatus, Recording, Standing } from '../shared/types'

const live = import.meta.env.DEV && data.mode === 'live'
const POLL_MS = 1000
const TIMEOUT_MS = 4000

const status = ref<ProjectorStatus | 'loading'>(live ? 'loading' : 'disabled')
const message = ref<string | null>(null)
const view = shallowRef<HostView | null>(null)
const hostError = ref<string | null>(null)
const busy = ref(false)
/** serverNow − Date.now() at last receipt. */
const clockOffset = ref(0)
const now = ref(Date.now())

let subscribers = 0
let timer: ReturnType<typeof setTimeout> | undefined
let ticker: ReturnType<typeof setInterval> | undefined
let inFlight = false

function accept(v: HostView) {
  view.value = v
  clockOffset.value = v.serverNow - Date.now()
}

async function poll() {
  if (inFlight || document.hidden) return
  inFlight = true
  try {
    const res = await fetch('/__quiz/projector', { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
    const body = (await res.json()) as ProjectorResponse
    status.value = body.status
    message.value = body.message ?? null
    if (body.view) accept(body.view)
  }
  catch {
    status.value = 'unreachable'
    message.value = 'Lost contact with the local dev server.'
  }
  finally {
    inFlight = false
  }
}

function schedule() {
  clearTimeout(timer)
  if (subscribers === 0) return
  timer = setTimeout(async () => {
    await poll()
    schedule()
  }, POLL_MS)
}

function onVisible() {
  if (!document.hidden) poll()
}

function subscribe() {
  if (!live) return
  if (subscribers++ === 0) {
    poll()
    schedule()
    ticker = setInterval(() => (now.value = Date.now()), 250)
    document.addEventListener('visibilitychange', onVisible)
  }
  onScopeDispose(() => {
    if (--subscribers === 0) {
      clearTimeout(timer)
      clearInterval(ticker)
      document.removeEventListener('visibilitychange', onVisible)
    }
  })
}

let queue: Promise<unknown> = Promise.resolve()

/** Send one host action. Serialised; resolves to whether it succeeded. */
function hostAction(action: HostAction): Promise<boolean> {
  if (!live) return Promise.resolve(false)
  const run = queue.then(async () => {
    busy.value = true
    try {
      const res = await fetch('/__quiz/host/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Quiz-Client': 'host' },
        body: JSON.stringify(action),
        signal: AbortSignal.timeout(TIMEOUT_MS * 2),
      })
      const body = await res.json().catch(() => null)
      if (body?.view) accept(body.view)
      if (!res.ok) {
        hostError.value = body?.error?.message ?? `Quiz action failed (HTTP ${res.status})`
        return false
      }
      hostError.value = action.type === 'winner' && body?.recording === 'no-players'
        ? 'No players: nothing recorded.'
        : null
      return true
    }
    catch {
      hostError.value = 'Quiz action failed: dev server unreachable.'
      return false
    }
    finally {
      busy.value = false
    }
  })
  queue = run.catch(() => {})
  return run
}

/** Answer phase for a question: 0 not started, 1 open/closed, 2 revealed, 3 leaderboard/done. */
function stageOf(v: HostView | null, id: string): number {
  if (!v) return 0
  if (v.questionId === id) {
    switch (v.phase) {
      case 'open':
      case 'closed':
        return 1
      case 'revealed':
        return 2
      default:
        return 3
    }
  }
  return v.roundsDone.includes(id) ? 3 : 0
}

export function useQuiz() {
  subscribe()
  const connected = computed(() => status.value === 'ok' && view.value !== null)
  const remainingMs = computed(() => {
    const closesAt = view.value?.closesAt
    if (closesAt == null) return null
    return Math.max(0, closesAt - (now.value + clockOffset.value))
  })
  const recording = data.recording as Recording | null
  const topScore = computed<number | null>(() => {
    if (connected.value) return view.value?.standings?.[0]?.score ?? 0
    return recording?.standings[0]?.score ?? null
  })
  return {
    quiz: data.quiz,
    recording,
    mode: live ? ('live' as const) : ('offline' as const),
    status,
    message,
    view,
    connected,
    hostError,
    busy,
    remainingMs,
    topScore,
    hostAction,
    stageOf: (id: string) => stageOf(view.value, id),
  }
}

export type { HostAction, HostView, Recording, Standing }
