// Only the active slide in the presenter window may drive the quiz.
// Previews, overview, print/export and the audience window are read-only.
import { useNav, useSlideContext } from '@slidev/client'
import { computed } from 'vue'

export function useHostControl() {
  const { isPresenter, isPrintMode, currentSlideNo } = useNav()
  const { $page, $renderContext } = useSlideContext()
  return computed(() =>
    import.meta.env.DEV
    && isPresenter.value
    && !isPrintMode.value
    && $renderContext.value === 'presenter'
    && currentSlideNo.value === $page.value,
  )
}
