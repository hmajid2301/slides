import { existsSync } from 'node:fs'

export default ({ mode }: { mode?: string }) => {
  const env = process.env
  const hosted = mode === 'build' && Boolean(env.QUIZ_HOSTED_SERVER_URL && env.QUIZ_HOSTED_ISSUER && env.QUIZ_HOSTED_CLIENT_ID)
  const dev = mode === 'dev' && (env.QUIZ_ENABLE_SLIDES === '1' || Boolean(env.QUIZ_SERVER_URL && env.QUIZ_OIDC_ISSUER && env.QUIZ_OIDC_CLIENT_ID))
  const recorded = existsSync(new URL('../quiz-results.json', import.meta.url))
  return [
    {
      name: 'live-only-slides',
      async transformSlide(_content: string, frontmatter: Record<string, unknown>) {
        if (frontmatter.liveOnly && !hosted && !dev && (!recorded || frontmatter.quizJoin)) frontmatter.hide = true
        return undefined
      },
    },
  ]
}
