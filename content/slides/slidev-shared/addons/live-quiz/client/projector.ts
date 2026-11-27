import { readonly, ref, shallowReadonly, shallowRef, watch } from 'vue'
import type { HostView, ProjectorSnapshot, QuizDisplay } from '../shared/types'

const HELLO = 'live-quiz:hello'
const PAIR = 'live-quiz:pair'
const HEARTBEAT = 1000
const LEASE = 4000
const PHASES = new Set(['waiting', 'open', 'closed', 'revealed', 'leaderboard', 'winner'])
const counter = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const offline: ProjectorSnapshot = { live: false }
type Position = { page: number; clicks: number }
type Frame = { snapshot: ProjectorSnapshot; position?: Position }
const display = shallowRef<QuizDisplay | null>(null)
const paired = ref(false)
const pairError = ref<string | null>(null)
let stopPublisher: (() => void) | undefined
let stopReceiver: (() => void) | undefined

export const projector = { display: shallowReadonly(display), paired: readonly(paired), error: readonly(pairError) }

function snapshot(v: HostView | null, serverUrl: string): ProjectorSnapshot {
  if (!v) return offline
  let url: URL
  try { url = new URL(v.joinUrl) }
  catch { return offline }
  if (url.origin !== serverUrl || url.username || url.password || url.search || url.hash || !/^\/join\/[\w-]+$/.test(url.pathname)) return offline
  if (!PHASES.has(v.phase) || (v.questionId !== null && (typeof v.questionId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(v.questionId))) ||
    !counter(v.serverNow) || (v.closesAt !== null && !counter(v.closesAt)) ||
    !counter(v.joined) || !counter(v.connected) || !counter(v.answeredCount)) return offline
  const counts = Array.isArray(v.counts) && v.counts.length === 4 && v.counts.every(counter) ? v.counts : null
  const standings = Array.isArray(v.standings) ? v.standings.slice(0, 200)
    .filter(s => s && counter(s.rank) && counter(s.score) && typeof s.nickname === 'string' && [...s.nickname].length <= 24)
    .map(({ rank, nickname, score }) => ({ rank, nickname, score })) : null
  return { live: true, display: {
    joinUrl: url.href, phase: v.phase, questionId: v.questionId, serverNow: v.serverNow,
    closesAt: v.closesAt, joined: v.joined, connected: v.connected, answeredCount: v.answeredCount,
    counts: counts ? [...counts] : null, standings,
  } }
}

export function openProjector(url: URL, serverUrl: string, view: () => HostView | null, position: () => Position, allowed: () => boolean) {
  if (!allowed() || url.origin !== location.origin) return
  stopPublisher?.()
  pairError.value = null
  const challenge = crypto.randomUUID()
  if (url.hash.startsWith('#/')) {
    const route = new URL(url.hash.slice(1), url.origin)
    route.searchParams.set('quizPair', challenge)
    url.hash = route.pathname + route.search
  }
  else url.searchParams.set('quizPair', challenge)
  let target: Window | null = null
  let port: MessagePort | null = null
  let beat: ReturnType<typeof setInterval> | undefined
  let stopWatching: (() => void) | undefined
  const stop = () => {
    window.removeEventListener('message', hello)
    clearInterval(beat)
    clearTimeout(handshake)
    stopWatching?.()
    port?.postMessage({ snapshot: offline } satisfies Frame)
    port?.close()
    paired.value = false
    stopPublisher = undefined
  }
  const send = () => {
    if (target?.closed || !allowed()) { stop(); return }
    port?.postMessage({ snapshot: snapshot(view(), serverUrl), position: position() } satisfies Frame)
  }
  function hello(event: MessageEvent) {
    if (!target || event.origin !== location.origin || event.source !== target ||
      event.data?.type !== HELLO || event.data.challenge !== challenge || !allowed()) return
    window.removeEventListener('message', hello)
    clearTimeout(handshake)
    const channel = new MessageChannel()
    port = channel.port1
    // Publisher intentionally has no port message handler or action RPC.
    target.postMessage({ type: PAIR, challenge }, location.origin, [channel.port2])
    paired.value = true
    send()
    beat = setInterval(send, HEARTBEAT)
    stopWatching = watch([view, position], send)
  }
  const handshake = setTimeout(() => {
    stop()
    pairError.value = 'Projector pairing timed out. Open it again from the presenter.'
  }, LEASE * 2)
  window.addEventListener('message', hello)
  target = window.open(url.href, '_blank')
  if (!target) {
    stop()
    pairError.value = 'Allow pop-ups to open the projector.'
    return
  }
  stopPublisher = stop
}

export function receiveProjector(challenge: string, allowed: () => boolean, follow: (page: number, clicks: number) => void) {
  const opener = window.opener as Window | null
  if (!opener || !allowed() || !/^[a-f0-9-]{36}$/.test(challenge)) return
  stopReceiver?.()
  let lease: ReturnType<typeof setTimeout> | undefined
  let port: MessagePort | undefined
  const stop = () => {
    clearTimeout(lease)
    clearInterval(retry)
    window.removeEventListener('message', pair)
    port?.close()
    display.value = null
    stopReceiver = undefined
  }
  function pair(event: MessageEvent) {
    if (event.origin !== location.origin || event.source !== opener || !allowed() ||
      event.data?.type !== PAIR || event.data.challenge !== challenge || event.ports.length !== 1) return
    window.removeEventListener('message', pair)
    clearInterval(retry)
    port = event.ports[0]
    port.onmessage = ({ data }: MessageEvent<Frame>) => {
      if (!allowed() || opener!.closed) { stop(); return }
      clearTimeout(lease)
      lease = setTimeout(stop, LEASE)
      const value = data?.snapshot
      display.value = value?.live === true ? { ...value.display, recentNicknames: [], roundsDone: [] } : null
      const pos = data?.position
      if (pos && Number.isSafeInteger(pos.page) && pos.page > 0 && Number.isSafeInteger(pos.clicks) && pos.clicks >= 0)
        follow(pos.page, pos.clicks)
    }
    port.onmessageerror = stop
  }
  const hello = () => opener.postMessage({ type: HELLO, challenge }, location.origin)
  stopReceiver = stop
  window.addEventListener('message', pair)
  lease = setTimeout(stop, LEASE * 2)
  const retry = setInterval(hello, 300)
  hello()
}

export function unpairProjector() { stopPublisher?.() }
export function clearProjector() { stopReceiver?.() }