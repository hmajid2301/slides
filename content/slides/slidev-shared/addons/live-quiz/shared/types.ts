// Wire, authored and recording types. Field names match Banter Bus's Go JSON tags.
// No Node imports: shared by the Vite plugin and browser components.

export type Choice = 'A' | 'B' | 'C' | 'D'
export const CHOICES: readonly Choice[] = ['A', 'B', 'C', 'D']

export interface Question {
  id: string
  prompt: string
  options: [string, string, string, string]
  correct: Choice
  explanation: string
  rule?: string
  revealItems?: string[]
}

export interface Quiz {
  version: 1
  title: string
  questions: Question[]
}

export interface Standing {
  rank: number
  nickname: string
  score: number
}

export interface RoundCounts {
  questionId: string
  counts: [number, number, number, number]
}

export interface Recording {
  version: 1
  quizDigest: string
  standings: Standing[]
  rounds: RoundCounts[]
}

export type Skin = 'neutral' | 'arcade'

export type HostAction =
  | { type: 'open' | 'reveal' | 'leaderboard'; questionId: string }
  | { type: 'winner' }

export type Phase = 'waiting' | 'open' | 'closed' | 'revealed' | 'leaderboard' | 'winner'

export interface HostView {
  sessionId: string
  joinUrl: string
  phase: Phase
  questionId: string | null
  serverNow: number
  closesAt: number | null
  joined: number
  connected: number
  recentNicknames: string[]
  answeredCount: number
  counts: [number, number, number, number] | null
  standings: Standing[] | null
  roundsDone: string[]
}

/** Status of the private `/__quiz/projector` proxy. */
export type ProjectorStatus =
  | 'ok'
  | 'auth-pending'
  | 'auth-expired'
  | 'unreachable'
  | 'restart-required'
  | 'disabled'

export interface ProjectorResponse {
  status: ProjectorStatus
  view?: HostView
  message?: string
}

/** Contents of `virtual:live-quiz/data`. */
export interface QuizData {
  quiz: Quiz
  recording: Recording | null
  mode: 'live' | 'offline'
}
