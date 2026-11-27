// Only the active slide in the presenter window may drive the quiz.
// Previews, overview, print/export and the audience window are read-only.
import { useNav, useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import data from 'virtual:live-quiz/data'

export function useHostControl() {
  const { isPresenter, isPrintMode, currentSlideNo, currentRoute } = useNav()
  const { $page, $renderContext } = useSlideContext()
  return computed(() =>
    ((import.meta.env.DEV && data.mode === 'live') || data.mode === 'hosted')
    && isPresenter.value
    && !isPrintMode.value
    && !(data.mode === 'hosted' && 'print' in currentRoute.value.query)
    && $renderContext.value === 'presenter'
    && currentSlideNo.value === $page.value,
  )
}
