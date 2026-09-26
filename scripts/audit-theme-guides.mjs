import { chromium } from 'playwright'

const baseUrl = process.env.THEME_GUIDE_URL || 'http://127.0.0.1:5174'
const guides = [
  ['mist', 'front-system.html'],
  ['midnight', 'front-system-midnight.html'],
  ['signal', 'front-system-signal.html'],
  ['bold', 'front-system-bold.html'],
  ['blueprint', 'front-system-blueprint.html'],
  ['bento', 'front-system-bento.html'],
  ['mono', 'front-system-mono.html'],
]
const widths = process.argv.includes('--quick') ? [390, 768, 1280] : [320, 360, 390, 430, 768, 1024, 1280, 1440]
const failures = []

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

for (const [theme, file] of guides) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`${baseUrl}/${file}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)

    const result = await page.evaluate(({ width, theme }) => {
      const problems = []
      const rectForText = (node) => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
        const rects = []
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(walker.currentNode)
          for (const rect of range.getClientRects()) rects.push(rect)
        }
        if (!rects.length) return null
        return {
          top: Math.min(...rects.map((rect) => rect.top)),
          bottom: Math.max(...rects.map((rect) => rect.bottom)),
        }
      }
      const rectForFirstLine = (node) => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(walker.currentNode)
          const rect = range.getClientRects()[0]
          if (rect) return { top: rect.top, bottom: rect.bottom }
        }
        return null
      }
      const center = (rect) => (rect.top + rect.bottom) / 2
      const checkCenter = (label, nodes, tolerance = 1) => {
        const rects = nodes.map(rectForFirstLine).filter(Boolean)
        if (rects.length < 2) return
        const values = rects.map(center)
        const delta = Math.max(...values) - Math.min(...values)
        if (delta > tolerance) problems.push(`${label}: glyph-center ${delta.toFixed(2)}px`)
      }
      const checkTop = (label, nodes, tolerance = 2) => {
        const rects = nodes.map(rectForFirstLine).filter(Boolean)
        if (rects.length < 2) return
        const values = rects.map((rect) => rect.top)
        const delta = Math.max(...values) - Math.min(...values)
        if (delta > tolerance) problems.push(`${label}: first-glyph-top ${delta.toFixed(2)}px`)
      }
      const checkPadding = (label, element, tolerance = 1) => {
        const outer = element.getBoundingClientRect()
        const children = [...element.children].map((child) => child.getBoundingClientRect())
        if (!children.length) return
        const top = Math.min(...children.map((rect) => rect.top)) - outer.top
        const bottom = outer.bottom - Math.max(...children.map((rect) => rect.bottom))
        if (Math.abs(top - bottom) > tolerance) problems.push(`${label}: vertical-padding ${top.toFixed(2)}/${bottom.toFixed(2)}px`)
      }

      if (document.documentElement.scrollWidth > width + 1) problems.push(`page overflow ${document.documentElement.scrollWidth - width}px`)

      document.querySelectorAll('.ts-rule-list article').forEach((row, index) => {
        const nodes = [row.querySelector('header span'), row.querySelector('h3')]
        const layout = getComputedStyle(row).getPropertyValue('--rule-layout').trim()
        if (layout !== 'card' && width > 1000) nodes.push(...row.querySelectorAll(':scope > div > b'))
        else if (layout !== 'card' && width > 680) nodes.push(row.querySelector(':scope > div > b'))
        checkCenter(`rule-${index + 1}`, nodes.filter(Boolean))
      })
      document.querySelectorAll('.ts-section__title').forEach((row, index) => checkTop(`section-title-${index + 1}`, [row.querySelector(':scope > span'), row.querySelector('h2')]))
      document.querySelectorAll('.ts-index-row').forEach((row, index) => {
        checkCenter(`index-${index + 1}`, [row.querySelector('small'), row.querySelector('time'), row.querySelector(':scope > div > b')].filter(Boolean))
        checkPadding(`index-${index + 1}`, row)
      })
      document.querySelectorAll('.ts-stat').forEach((row, index) => {
        const mode = getComputedStyle(row).getPropertyValue('--stat-optical-mode').trim()
        if (mode !== 'stack') checkCenter(`stat-${index + 1}`, [row.querySelector('small'), row.querySelector('b'), row.querySelector('strong')])
      })
      document.querySelectorAll('.ts-release li').forEach((row, index) => {
        const body = rectForText(row.querySelector('p'))
        if (body && body.bottom - body.top <= 21) checkCenter(`release-${index + 1}`, [row.querySelector('span'), row.querySelector('p'), row.querySelector('b')])
      })

      document.querySelectorAll('.fds-rules article').forEach((row, index) => {
        const nodes = [row.querySelector('header span'), row.querySelector('h3')]
        if (width > 900) nodes.push(...row.querySelectorAll(':scope > div > b'))
        checkCenter(`mist-rule-${index + 1}`, nodes.filter(Boolean))
      })
      document.querySelectorAll('.fds-alignment-row,.fds-index-sample').forEach((row, index) => {
        checkCenter(`mist-index-${index + 1}`, [row.querySelector('small'), row.querySelector('b'), row.querySelector('strong')].filter(Boolean))
        checkPadding(`mist-index-${index + 1}`, row)
      })
      document.querySelectorAll('.fds-stat').forEach((row, index) => checkCenter(`mist-stat-${index + 1}`, [row.querySelector('small'), row.querySelector('b'), row.querySelector('strong')]))
      document.querySelectorAll('.fds-row--journey').forEach((row, index) => checkCenter(`mist-journey-${index + 1}`, [row.querySelector(':scope > small'), row.querySelector(':scope > b'), row.querySelector(':scope > h4')].filter(Boolean)))
      document.querySelectorAll('.fds-release-gate li').forEach((row, index) => {
        const body = rectForText(row.querySelector('p'))
        if (body && body.bottom - body.top <= 21) {
          const nodes = [row.querySelector('span'), row.querySelector('p')]
          if (width > 600) nodes.push(row.querySelector('b'))
          checkCenter(`mist-release-${index + 1}`, nodes)
        }
      })
      document.querySelectorAll('.fds-release-gate>article').forEach((group, index) => {
        const title = group.querySelector(':scope>header h3')?.getBoundingClientRect()
        const firstBody = group.querySelector('li p')?.getBoundingClientRect()
        if (title && firstBody && Math.abs(title.left - firstBody.left) > 1) problems.push(`mist-release-axis-${index + 1}: ${Math.abs(title.left - firstBody.left).toFixed(2)}px`)
      })
      const sessionStage = document.querySelector('.fds-session-stage')?.getBoundingClientRect()
      const sessionBlocker = document.querySelector('.fds-session-blocker')?.getBoundingClientRect()
      if (sessionStage && sessionBlocker) {
        const miss = Math.max(Math.abs(sessionStage.left - sessionBlocker.left), Math.abs(sessionStage.right - sessionBlocker.right), Math.abs(sessionStage.top - sessionBlocker.top), Math.abs(sessionStage.bottom - sessionBlocker.bottom))
        if (miss > 1) problems.push(`mist-session-blocker misses protected surface by ${miss.toFixed(2)}px`)
      }
      if (width > 900) {
        const footer = document.querySelector('.fds-footer')
        if (footer) checkTop('mist-footer', [...footer.children], 1)
      }
      const footerText = document.querySelector('.fds-footer')?.textContent || ''
      if (theme === 'mist' && (!footerText.includes('ALL RIGHTS RESERVED') || !footerText.includes("LET'S CONNECT") || !footerText.includes('BACK TO TOP'))) problems.push('mist footer specimen does not match the public footer contract')
      document.querySelectorAll('a,button,input,select,textarea').forEach((element) => {
        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        if (rect.width < 44 || rect.height < 44) problems.push(`touch target ${element.tagName.toLowerCase()} "${element.textContent.trim().slice(0, 24)}" ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`)
      })
      document.querySelectorAll('.ts-index-row,.ts-preview-rows,.ts-release,.ts-rule-list').forEach((element) => {
        const style = getComputedStyle(element)
        if (element.matches('.ts-index-row') && (style.borderTopWidth === '0px' || style.borderBottomWidth === '0px')) problems.push('index boundary missing')
      })
      return problems
    }, { width, theme })

    for (const problem of result) failures.push(`${theme}@${width}: ${problem}`)
  }
}

await browser.close()

if (failures.length) {
  console.error(`Theme guide audit failed (${failures.length})`)
  console.error(failures.slice(0, 120).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Theme guide audit passed: ${guides.length} themes × ${widths.length} widths`)
}
