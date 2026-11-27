// Vite integration for slidev-addon-live-quiz.
// Importing this module has no side effects: no state, ports, timers or writes.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { QUIZ_FILE, RECORDING_FILE, quizDigest, readQuiz, readRecording } from './server/data.js'

/** @typedef {import('vite').Plugin} Plugin */
/** @typedef {import('vite').ViteDevServer} ViteDevServer */
/** @typedef {import('./shared/types.ts').QuizData} QuizData */
/** @typedef {import('./shared/types.ts').Skin} Skin */
/** @typedef {import('./server/proxy.js').Owner} Owner */
/**
 * @typedef {object} LiveQuizOptions
 * @property {string} editionDir Absolute edition source directory containing quiz.yaml.
 * @property {Skin} [skin] Banter Bus phone skin. Overridden by QUIZ_SKIN in dev. Default 'neutral'.
 * @property {import('./shared/types.ts').HostedQuizConfig} [hosted] Public build-only settings.
 */

const DATA_ID = 'virtual:live-quiz/data'
const RESOLVED_DATA_ID = `\0${DATA_ID}`
const OWNERS = Symbol.for('slidev-addon-live-quiz')
const SCOPE = 'openid'
const LOOPBACK_HOSTS = new Set([undefined, false, 'localhost', '127.0.0.1', '::1'])

/** @param {LiveQuizOptions} options @returns {Plugin} */
function dataPlugin({ editionDir, hosted, skin = 'neutral' }) {
  const watched = new Set([resolve(editionDir, QUIZ_FILE), resolve(editionDir, RECORDING_FILE)])
  /** @type {QuizData['mode']} */
  let mode = 'offline'
  return {
    name: 'live-quiz:data',
    configResolved(config) {
      const devConfigured = process.env.QUIZ_SERVER_URL && process.env.QUIZ_OIDC_ISSUER && process.env.QUIZ_OIDC_CLIENT_ID
      mode = config.command === 'serve' ? (devConfigured ? 'live' : 'offline') : hosted ? 'hosted' : 'offline'
      if (mode === 'hosted' && hosted) {
        const serverUrl = originEnv('hosted.serverUrl', hosted.serverUrl)
        const issuer = originEnv('hosted.issuer', hosted.issuer)
        const redirect = new URL(originEnv('hosted.redirectUri', hosted.redirectUri))
        if (new URL(serverUrl).pathname !== '/' || !hosted.clientId.trim() ||
          !hosted.redirectUri.endsWith('/') || new URL(hosted.redirectUri).pathname !== config.base)
          throw new Error('live quiz: hosted config requires an API origin, a client ID and the exact deck base callback')
        hosted = { serverUrl, issuer, clientId: hosted.clientId, redirectUri: `${redirect.origin}${config.base}` }
      }
    },
    resolveId(id) {
      return id === DATA_ID ? RESOLVED_DATA_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_DATA_ID) return
      // Missing files would become unresolved imports in dev; the server watcher
      // covers create/delete (see configureServer).
      for (const file of watched) if (existsSync(file)) this.addWatchFile(file)
      const quiz = readQuiz(editionDir)
      /** @type {QuizData} */
      const data = { quiz, recording: readRecording(editionDir, quiz), mode }
      if (mode === 'hosted' && hosted) data.hosted = { ...hosted, skin, digest: quizDigest(quiz) }
      return `export default ${JSON.stringify(data)}`
    },
    configureServer(server) {
      server.watcher.add([...watched])
      const reload = (/** @type {string} */ file) => {
        if (!watched.has(resolve(file))) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_DATA_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('change', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

/** @param {string} name @param {string | undefined} value */
function originEnv(name, value) {
  let url
  try {
    url = new URL(value ?? '')
  }
  catch {
    throw new Error(`live quiz: ${name} must be a URL`)
  }
  const local = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !local) || url.username || url.password || url.search || url.hash)
    throw new Error(`live quiz: ${name} must be an https:// URL (http only for localhost) without credentials, query or fragment`)
  return url.href.replace(/\/$/, '')
}

/** @param {string} editionDir @param {Skin} defaultSkin @returns {Plugin} */
function runtimePlugin(editionDir, defaultSkin) {
  return {
    name: 'live-quiz:runtime',
    apply: 'serve',
    async configureServer(server) {
      const env = process.env
      if (!env.QUIZ_SERVER_URL || !env.QUIZ_OIDC_ISSUER || !env.QUIZ_OIDC_CLIENT_ID) {
        console.log('live quiz: disabled (set QUIZ_SERVER_URL, QUIZ_OIDC_ISSUER, QUIZ_OIDC_CLIENT_ID). Answer-only mode.')
        return
      }
      if (!LOOPBACK_HOSTS.has(/** @type {any} */ (server.config.server.host)))
        throw new Error('live quiz: Vite must listen on loopback only; do not use --remote or --host with the live quiz')
      const serverUrl = originEnv('QUIZ_SERVER_URL', env.QUIZ_SERVER_URL)
      const issuer = originEnv('QUIZ_OIDC_ISSUER', env.QUIZ_OIDC_ISSUER)
      const skin = /** @type {Skin} */ (env.QUIZ_SKIN ?? defaultSkin)
      if (skin !== 'neutral' && skin !== 'arcade') throw new Error('live quiz: QUIZ_SKIN must be neutral or arcade')

      // Load lazily so builds never import Node runtime modules.
      const [{ startDeviceLogin }, { BanterClient }, { createProxy }] = await Promise.all([
        import('./server/oidc.js'),
        import('./server/banter.js'),
        import('./server/proxy.js'),
      ])
      // Slidev's Vite logger drops info; the sign-in prompt must be visible.
      const log = (/** @type {string} */ msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)

      /** @type {Map<string, Owner & { servers: number, key: string }>} */
      const owners = (/** @type {any} */ (globalThis))[OWNERS] ??= new Map()
      const key = `${editionDir}\n${serverUrl}\n${issuer}\n${env.QUIZ_OIDC_CLIENT_ID}`
      let owner = owners.get(editionDir)
      if (owner && owner.key !== key) {
        owner.tokens?.close()
        owners.delete(editionDir)
        owner = undefined
      }
      if (!owner) {
        const quiz = readQuiz(editionDir)
        const tokens = startDeviceLogin({ issuer, clientId: /** @type {string} */ (env.QUIZ_OIDC_CLIENT_ID), scope: SCOPE, log })
        owner = {
          key,
          servers: 0,
          tokens,
          client: new BanterClient(serverUrl, tokens),
          sessionId: null,
          digest: null,
          quiz,
          localDigest: quizDigest(quiz),
          skin,
          restartRequired: false,
          lost: null,
          creating: null,
          cache: null,
          writes: Promise.resolve(),
          lastWritten: null,
        }
        owners.set(editionDir, owner)
      }
      const o = owner
      o.servers++

      // quiz.yaml edits: replace the session's quiz only while nobody has joined.
      const quizFile = resolve(editionDir, QUIZ_FILE)
      server.watcher.on('change', async (file) => {
        if (resolve(file) !== quizFile) return
        let quiz
        try {
          quiz = readQuiz(editionDir)
        }
        catch (e) {
          log(`live quiz: ${/** @type {Error} */ (e).message}`)
          return
        }
        const digest = quizDigest(quiz)
        if (digest === o.localDigest) return
        if (!o.sessionId || !o.client) {
          o.quiz = quiz
          o.localDigest = digest
          return
        }
        try {
          const s = await o.client.replaceQuiz(o.sessionId, quiz)
          o.quiz = quiz
          o.localDigest = digest
          o.digest = s.digest
          o.cache = null
          log('live quiz: quiz updated on Banter.')
        }
        catch (e) {
          if (/** @type {{ status?: number }} */ (e).status === 409) {
            o.restartRequired = true
            o.cache = null
            log('live quiz: quiz.yaml changed after players joined; restart `pnpm dev` for a new game.')
          }
          else log(`live quiz: could not update quiz: ${/** @type {Error} */ (e).message}`)
        }
      })

      const allowedHosts = () => {
        const addr = server.httpServer?.address()
        const port = addr && typeof addr === 'object' ? addr.port : server.config.server.port
        return new Set([`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`])
      }
      server.middlewares.use(createProxy({ owner: o, editionDir, allowedHosts }))

      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address()
        if (addr && typeof addr === 'object' && !['127.0.0.1', '::1'].includes(addr.address)) {
          server.config.logger.error(`live quiz: Vite is listening on ${addr.address}; refusing to run. Use loopback only.`)
          process.exit(1)
        }
      })
      // Config restarts create a new server before closing the old one; keep the
      // owner (token + session) while any server for this edition is alive.
      server.httpServer?.once('close', () => {
        o.servers--
        setTimeout(() => {
          if (o.servers > 0 || owners.get(editionDir) !== o) return
          o.tokens?.close()
          owners.delete(editionDir)
        }, 2000).unref()
      })
    },
  }
}

/** @param {LiveQuizOptions} options @returns {Plugin[]} */
export function liveQuiz(options) {
  const editionDir = resolve(options.editionDir)
  return [dataPlugin({ ...options, editionDir }), runtimePlugin(editionDir, options.skin ?? 'neutral')]
}

export default liveQuiz
