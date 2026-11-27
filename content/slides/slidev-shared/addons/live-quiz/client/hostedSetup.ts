import { disableBuiltinSync, sharedState } from '@slidev/client'
import type { AppContext } from '@slidev/types'
import data from 'virtual:live-quiz/data'
import { enterHostedPresenter, leaveHostedPresenter, setupHostedQuiz } from './hostedQuiz'
import { clearProjector, receiveProjector, unpairProjector } from './projector'

export default async function setup({ app, router }: AppContext) {
  if (data.mode !== 'hosted' || !data.hosted || location.origin !== new URL(data.hosted.redirectUri).origin) return
  // Native bidirectional sync can turn a viewer navigation into a presenter click.
  // Stop built-in sends now, then close channels that Slidev opens on mounting.
  disableBuiltinSync()
  app.mixin({ mounted() { if (this === this.$root) disableBuiltinSync() } })
  const route = () => router.currentRoute.value
  const printing = () => 'print' in route().query || new URLSearchParams(location.search).has('print')
  const presenter = () => route().name === 'presenter' && !printing()
  const audience = () => route().name === 'play' && !printing()
  // A local cursor/timer update before the first navigation is otherwise misread
  // by Slidev as a remote update for its default slide 1.
  const markLocalNavigation = () => {
    sharedState.lastUpdate = { id: 'live-quiz-local', type: presenter() ? 'presenter' : 'viewer', time: Date.now() }
  }

  // Handle the callback before pairing or mounting any slide component.
  await setupHostedQuiz({
    isPresenter: presenter,
    returnRoute: () => route().path + (typeof route().query.clicks === 'string' ? `?clicks=${route().query.clicks}` : ''),
    restore: async path => { await router.isReady(); await router.replace(path) },
  })
  await router.isReady()
  markLocalNavigation()
  enterHostedPresenter()
  const challenge = route().query.quizPair
  if (audience() && window.opener && typeof challenge === 'string') {
    const query = { ...route().query }
    delete query.quizPair
    await router.replace({ path: route().path, query })
    receiveProjector(challenge, audience, (page, clicks) => {
      if (route().path !== `/${page}` || Number(route().query.clicks ?? 0) !== clicks)
        void router.replace({ path: `/${page}`, query: clicks ? { clicks } : {} })
    })
  }
  router.afterEach((_to, from) => {
    markLocalNavigation()
    if (from.name === 'presenter' && !presenter()) {
      unpairProjector()
      leaveHostedPresenter()
    }
    else if (presenter() && (from.name !== 'presenter' || 'print' in from.query)) enterHostedPresenter()
    if (!audience()) clearProjector()
  })
  window.addEventListener('pagehide', () => {
    unpairProjector()
    clearProjector()
    if (presenter()) leaveHostedPresenter()
  })
  window.addEventListener('pageshow', event => { if (event.persisted) enterHostedPresenter() })
}