import { fileURLToPath } from 'node:url'
import { liveQuiz } from 'slidev-addon-live-quiz/vite'

export default {
  plugins: [
    ...liveQuiz({ editionDir: fileURLToPath(new URL('.', import.meta.url)), skin: 'arcade' }),
  ],
}
