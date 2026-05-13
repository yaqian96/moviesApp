export function horizontalWheelScroll(e) {
  const el = e.currentTarget
  if (!el || typeof el.scrollLeft !== 'number') return
  const max = el.scrollWidth - el.clientWidth
  if (max <= 0) return
  const dy = e.deltaY
  const dx = e.deltaX
  const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy
  if (!delta) return
  const before = el.scrollLeft
  el.scrollLeft += delta
  if (el.scrollLeft === before) return
  e.preventDefault()
}
