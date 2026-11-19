import { execFile } from 'node:child_process'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'

// Dev-only live benchmark for the "Live bench" slide.
// GET /__bench?simd=0|128|256|512 runs one fixed `go test -bench` in ./examples.
// Only the width is accepted; nothing from the request reaches the command line
// except a value checked against WIDTHS. Not present in `slidev build` output.
const WIDTHS = new Set(['0', '128', '256', '512'])
const examples = fileURLToPath(new URL('./examples', import.meta.url))
let busy = false

function bench(simd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'go',
      ['test', '-run', '^$', '-bench', '^BenchmarkAdd$/^(scalar|simd)$/', '-benchtime', '300ms', '-count', '1', '.'],
      {
        cwd: examples,
        timeout: 60_000,
        env: {
          ...process.env,
          GOTOOLCHAIN: process.env.GOSIMD_TOOLCHAIN ?? 'go1.27.0',
          GOEXPERIMENT: 'simd',
          GODEBUG: `simd=${simd}`,
        },
      },
      (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve(stdout)),
    )
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default {
  plugins: [
    {
      name: 'go-simd-live-bench',
      apply: 'serve' as const,
      configureServer(server: { middlewares: { use: (path: string, fn: (req: IncomingMessage, res: ServerResponse) => void) => void } }) {
        server.middlewares.use('/__bench', async (req, res) => {
          const simd = new URL(req.url ?? '', 'http://x').searchParams.get('simd') ?? ''
          if (!WIDTHS.has(simd)) return send(res, 400, { error: 'simd must be 0, 128, 256 or 512' })
          if (busy) return send(res, 429, { error: 'benchmark already running' })
          busy = true
          try {
            const out = await bench(simd)
            const results = [...out.matchAll(/^BenchmarkAdd\/(\w+)\/n=\d+\S*\s+\d+\s+([\d.]+) ns\/op/gm)]
              .map(m => ({ name: m[1], ns: Number(m[2]) }))
            send(res, 200, { simd, results, cpu: /^cpu: (.*)$/m.exec(out)?.[1]?.trim() })
          }
          catch (e) {
            send(res, 500, { error: (e as Error).message.slice(0, 400) })
          }
          finally {
            busy = false
          }
        })
      },
    },
  ],
}
