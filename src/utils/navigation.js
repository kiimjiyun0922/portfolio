export function navigateTo(path) {
  if (window.location.pathname === path) return
  const previewSearch = new URLSearchParams(window.location.search).has('preview') ? '?preview' : ''
  window.history.pushState({}, '', `${path}${previewSearch}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'instant' })
}

export function handleInternalNavigation(event, path) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigateTo(path)
}
