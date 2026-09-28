// Same-origin viewer for owner-authored case-study pages (see
// src/components/CaseStudyEmbed.jsx). The parent sends the saved HTML and the
// uploaded asset URLs; this file only sanitizes, renders and wires the shared
// interactions. Scripts inside the uploaded HTML never run.

const RENDER = 'case-embed:render'
const READY = 'case-embed:ready'
const HEIGHT = 'case-embed:height'
const NAVIGATE = 'case-embed:navigate'
const REMOVED_TAGS = 'script, iframe, object, embed, base, meta[http-equiv], form'
const HEAD_TAGS = 'style, link[rel="stylesheet"], link[rel="preconnect"]'

const post = (message) => window.parent.postMessage(message, window.location.origin)

function isRelative(value) {
  return Boolean(value) && !/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)
}

function sanitize(root) {
  root.querySelectorAll(REMOVED_TAGS).forEach((node) => node.remove())
  root.querySelectorAll('*').forEach((node) => {
    for (const attribute of [...node.attributes]) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      if (name.startsWith('on')) node.removeAttribute(attribute.name)
      else if (['href', 'src', 'poster', 'action', 'formaction', 'xlink:href'].includes(name) && value.startsWith('javascript:')) node.removeAttribute(attribute.name)
    }
  })
}

function rewriteAssets(root, assets) {
  const map = new Map(assets.filter((asset) => asset?.path && asset?.url).map((asset) => [asset.path.replace(/^\.\//, ''), asset.url]))
  root.querySelectorAll('[src], [poster], [href]').forEach((node) => {
    for (const name of ['src', 'poster', 'href']) {
      const value = node.getAttribute(name)
      if (!isRelative(value)) continue
      const url = map.get(value.replace(/^\.\//, ''))
      if (url) node.setAttribute(name, url)
      else if (name !== 'href') node.removeAttribute(name)
    }
  })
  root.querySelectorAll('style').forEach((style) => {
    let text = style.textContent
    for (const [path, url] of map) text = text.split(path).join(url)
    style.textContent = text
  })
}

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

function wireInteractions() {
  // Before/after sliders: a range input drives the --pos custom property.
  document.querySelectorAll('.ba-slider').forEach((slider) => {
    const range = slider.querySelector('input[type="range"]')
    if (!range) return
    const update = () => slider.style.setProperty('--pos', `${range.value}%`)
    range.addEventListener('input', update)
    update()
  })

  // Videos: muted inline loops with a visible pause control.
  document.querySelectorAll('video').forEach((video) => {
    video.muted = true
    video.playsInline = true
    const scope = video.closest('.browser') || video.parentElement
    const toggle = scope?.querySelector('.scroll-toggle')
    const label = () => {
      if (!toggle) return
      toggle.textContent = video.paused ? '재생' : '일시정지'
      toggle.setAttribute('aria-pressed', String(video.paused))
    }
    video.addEventListener('play', label)
    video.addEventListener('pause', label)
    toggle?.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {})
      else video.pause()
    })
    if (prefersReducedMotion()) video.pause()
    else if (video.hasAttribute('autoplay')) video.play().catch(() => {})
    label()
  })

  // Links: portfolio routes navigate the parent; external links open a tab.
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]')
    if (!link) return
    const href = link.getAttribute('href')
    if (href.startsWith('#')) return
    event.preventDefault()
    if (href.startsWith('/')) post({ type: NAVIGATE, path: href })
    else if (/^https?:/i.test(href)) window.open(href, '_blank', 'noopener')
  })
}

function reportHeight() {
  post({ type: HEIGHT, height: Math.ceil(document.documentElement.scrollHeight) })
}

function render({ html, assets }) {
  const parsed = new DOMParser().parseFromString(String(html || ''), 'text/html')
  sanitize(parsed)
  rewriteAssets(parsed, Array.isArray(assets) ? assets : [])
  // Editor-only affordances in the authored page stay hidden in the portfolio.
  parsed.querySelectorAll('.editor-only, .ph, .toolbar').forEach((node) => node.remove())

  document.head.querySelectorAll('[data-case-embed]').forEach((node) => node.remove())
  parsed.head.querySelectorAll(HEAD_TAGS).forEach((node) => {
    const copy = document.importNode(node, true)
    copy.setAttribute('data-case-embed', '')
    document.head.appendChild(copy)
  })
  parsed.body.querySelectorAll(HEAD_TAGS).forEach((node) => {
    const copy = document.importNode(node, true)
    copy.setAttribute('data-case-embed', '')
    document.head.appendChild(copy)
    node.remove()
  })
  document.body.className = parsed.body.className
  document.body.innerHTML = parsed.body.innerHTML
  document.body.classList.add('clean')
  wireInteractions()
  reportHeight()
  document.querySelectorAll('img, video').forEach((media) => {
    media.addEventListener('load', reportHeight)
    media.addEventListener('loadedmetadata', reportHeight)
  })
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent) return
  if (event.data?.type === RENDER) render(event.data)
})

new ResizeObserver(reportHeight).observe(document.documentElement)
post({ type: READY })
