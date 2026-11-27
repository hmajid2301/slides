// Browser-side quiz state: one poller per app, offline adapter in builds.
import { useNav, useSlideContext } from '@slidev/client'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import data from 'virtual:live-quiz/data'
import type { HostAction, HostView, ProjectorResponse, ProjectorStatus, QuizDisplay, Recording, Standing } from '../shared/types'
import { useHostControl } from './control'
import { hostedQuiz } from './hostedQuiz'
import { openProjector, projector, unpairProjector } from './projector'

const live = import.meta.env.DEV && data.mode === 'live'
const hosted = data.mode === 'hosted' && data.hosted && typeof location !== 'undefined'
  && location.origin === new URL(data.hosted.redirectUri).origin
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
function stageOf(v: QuizDisplay | null, id: string): number {
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
  return v.roundsDone?.includes(id) ? 3 : 0
}

export function useQuiz() {
  subscribe()
  const nav = useNav()
  const { $renderContext } = useSlideContext()
  const control = useHostControl()
  let mounted = true
  onScopeDispose(() => { mounted = false })
  const guard = () => mounted && control.value
  const presenter = computed(() => hosted && control.value)
  const audience = computed(() => hosted && nav.isPlaying.value && !nav.isPrintMode.value
    && !('print' in nav.currentRoute.value.query) && $renderContext.value === 'slide')
  const display = computed<QuizDisplay | null>(() => live ? view.value
    : presenter.value ? hostedQuiz.view.value : audience.value ? projector.display.value : null)
  const mode = computed(() => live ? 'live' : presenter.value || (audience.value && display.value) ? 'hosted' : 'offline')
  const connected = computed(() => display.value !== null && (!live || status.value === 'ok'))
  const displayStatus = computed(() => presenter.value ? hostedQuiz.status.value : status.value)
  const hostedClock = ref({ offset: 0, receivedAt: 0 })
  if (hosted) watch(display, (value, _old, cleanup) => {
    if (!value) return
    const receivedAt = Date.now()
    const offset = value.serverNow === _old?.serverNow ? hostedClock.value.offset : value.serverNow - receivedAt
    hostedClock.value = { offset, receivedAt }
    // Keep one clock per rendered view, only while there's a visible countdown.
    if (value.closesAt == null) return
    const t = setInterval(() => { hostedClock.value = { ...hostedClock.value, receivedAt: Date.now() } }, 250)
    cleanup(() => clearInterval(t))
  }, { immediate: true })
  const remainingMs = computed(() => {
    const closesAt = display.value?.closesAt
    if (closesAt == null) return null
    return Math.max(0, closesAt - (live ? now.value + clockOffset.value : hostedClock.value.receivedAt + hostedClock.value.offset))
  })
  const pair = () => {
    if (!data.hosted || !guard() || !hostedQuiz.view.value) return
    const url = new URL(data.hosted.redirectUri)
    const path = `/${nav.currentSlideNo.value}`
    if (location.hash.startsWith('#/')) url.hash = path
    else url.pathname = `${url.pathname.slice(0, -1)}${path}`
    openProjector(url, data.hosted.serverUrl, () => hostedQuiz.view.value,
      () => ({ page: Number(nav.currentRoute.value.params.no), clicks: nav.queryClicks.value }),
      () => nav.isPresenter.value && !nav.isPrintMode.value && !('print' in nav.currentRoute.value.query))
  }
  const recording = data.recording as Recording | null
  const topScore = computed<number | null>(() => {
    if (connected.value) return display.value?.standings?.[0]?.score ?? 0
    return recording?.standings[0]?.score ?? null
  })
  return {
    quiz: data.quiz, recording, mode, control, connected, remainingMs, topScore,
    status: displayStatus,
    message: computed(() => presenter.value ? hostedQuiz.message.value : message.value),
    view: display,
    hostError: computed(() => live ? hostError.value : null),
    busy: computed(() => live ? busy.value : presenter.value && hostedQuiz.busy.value),
    hostAction: (action: HostAction) => live ? hostAction(action) : hostedQuiz.action(action, guard),
    stageOf: (id: string) => stageOf(display.value, id),
    hostedBuild: Boolean(hosted),
    hostedPresenter: presenter,
    epoch: hostedQuiz.epoch,
    hasRoom: computed(() => presenter.value && hostedQuiz.room.value !== null),
    canStart: computed(() => presenter.value && (!hostedQuiz.room.value || hostedQuiz.view.value?.phase === 'winner')),
    authenticated: computed(() => presenter.value && hostedQuiz.authenticated.value),
    start: () => hostedQuiz.start(guard),
    reconnect: () => hostedQuiz.reconnect(guard),
    downloadRecording: () => hostedQuiz.downloadRecording(guard),
    recordingError: computed(() => presenter.value ? hostedQuiz.recordingError.value : null),
    pair,
    unpair: () => { if (guard()) unpairProjector() },
    paired: projector.paired,
    pairError: projector.error,
  }
}

export type { HostAction, HostView, Recording, Standing }
