// Quiz slides only make sense live: hide `liveOnly: true` slides outside `slidev dev`.
// Quiz is off for now; set QUIZ = true (and restore <QuizJoin compact /> on slide 2) to bring it back.
const QUIZ = false

export default ({ mode }: { mode?: string }) => [
  {
    name: 'live-only-slides',
    async transformSlide(_content: string, frontmatter: Record<string, unknown>) {
      if (frontmatter.liveOnly && (!QUIZ || mode !== 'dev')) frontmatter.hide = true
      return undefined
    },
  },
]
