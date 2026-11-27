import { fileURLToPath } from 'node:url'
import { liveQuiz } from 'slidev-addon-live-quiz/vite'

const { QUIZ_HOSTED_SERVER_URL, QUIZ_HOSTED_ISSUER, QUIZ_HOSTED_CLIENT_ID, QUIZ_HOSTED_REDIRECT_URI } = process.env

export default {
  plugins: [
    ...liveQuiz({
      editionDir: fileURLToPath(new URL('.', import.meta.url)),
      skin: 'arcade',
      hosted: QUIZ_HOSTED_SERVER_URL && QUIZ_HOSTED_ISSUER && QUIZ_HOSTED_CLIENT_ID ? {
        serverUrl: QUIZ_HOSTED_SERVER_URL,
        issuer: QUIZ_HOSTED_ISSUER,
        clientId: QUIZ_HOSTED_CLIENT_ID,
        redirectUri: QUIZ_HOSTED_REDIRECT_URI ?? 'https://slides.haseebmajid.dev/go-simd/2026-11-17/',
      } : undefined,
    }),
  ],
}
