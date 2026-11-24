import { onUnmounted, ref, watch, type CSSProperties } from 'vue'

// Background easter eggs: once `on()` turns true, wait `delay` ms, appear briefly at a random
// spot (absolute-position styles relative to the slide body), then vanish.
export function useCameo(on: () => boolean, spots: CSSProperties[], delay = 2500, hold = 2600) {
  const shown = ref(false)
  const spot = ref(spots[0])
  let timers: ReturnType<typeof setTimeout>[] = []
  const clear = () => { timers.forEach(clearTimeout); timers = [] }
  watch(on, v => {
    clear()
    shown.value = false
    if (!v) return
    timers.push(setTimeout(() => {
      spot.value = spots[Math.floor(Math.random() * spots.length)]
      shown.value = true
      timers.push(setTimeout(() => { shown.value = false }, hold))
    }, delay))
  }, { immediate: true })
  onUnmounted(clear)
  return { shown, spot }
}
