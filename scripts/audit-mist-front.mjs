import { chromium } from '@playwright/test'

const baseUrl = process.env.MIST_BASE_URL || 'http://127.0.0.1:5176'
const widths = [390, 768, 1024, 1440]
const failures = []

function check(condition, message) {
  if (!condition) failures.push(message)
}

const browser = await chromium.launch({ headless: true })

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 900 }, deviceScaleFactor: 1 })
    await page.goto(`${baseUrl}/?preview`, { waitUntil: 'networkidle' })
    await page.locator('#home').waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)

    const metrics = await page.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const box = element.getBoundingClientRect()
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height }
      }
      const size = (selector) => {
        const element = document.querySelector(selector)
        return element ? Number.parseFloat(getComputedStyle(element).fontSize) : null
      }
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heroTitle: rect('.mist-hero-title'),
        heroStats: rect('.mist-hero-stats'),
        sectionLefts: ['#about', '#journey', '#achievements', '#experience', '#resume']
          .map((selector) => rect(selector)?.left)
          .filter((value) => Number.isFinite(value)),
        h2Sizes: ['#about h2', '#journey h2', '#achievements h2', '#projects > h2', '#experience h2', '#resume h2']
          .map(size)
          .filter((value) => Number.isFinite(value)),
        bodySize: size('#about .prose-dark p'),
        journeyYearSize: size('.journey-index__year'),
        mobileStatus: getComputedStyle(document.querySelector('.portfolio-mobile-status')).display,
        hiddenContent: [...document.querySelectorAll('#about > div > div, .journey-index__row, .experience-entry, .resume-block')]
          .filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < .99).length,
      }
    })

    check(metrics.overflow <= 1, `${width}px: horizontal overflow ${metrics.overflow}px`)
    check(metrics.heroTitle && metrics.heroStats && metrics.heroTitle.bottom < metrics.heroStats.top, `${width}px: hero title overlaps stats`)
    check(metrics.sectionLefts.every((left) => Math.abs(left - metrics.sectionLefts[0]) <= 1), `${width}px: section rails do not share one start line`)
    check(metrics.h2Sizes.every((size) => size >= (width < 768 ? 38 : 40)), `${width}px: a section title is below the Mist title token`)
    check(metrics.bodySize === null || metrics.bodySize >= 15, `${width}px: body text is below 15px`)
    check(metrics.journeyYearSize === null || metrics.journeyYearSize <= 12.5, `${width}px: journey year is incorrectly promoted above metadata size`)
    check(metrics.mobileStatus === 'none', `${width}px: undocumented mobile status control is visible`)
    check(metrics.hiddenContent === 0, `${width}px: ${metrics.hiddenContent} content blocks remain hidden before scrolling`)

    await page.screenshot({ path: `/tmp/mist-front-${width}.png`, fullPage: true })
    await page.close()
  }

  const detail = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await detail.goto(`${baseUrl}/projects/sample-noma-launch?preview`, { waitUntil: 'networkidle' })
  await detail.locator('.project-detail-close').waitFor({ state: 'visible' })
  const detailState = await detail.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    closeHeight: document.querySelector('.project-detail-close')?.getBoundingClientRect().height,
    footer: Boolean(document.querySelector('.notebook-footer')),
    firstStoryColumns: getComputedStyle(document.querySelector('.project-detail-story section')).gridTemplateColumns.split(' ').length,
    galleryRatio: (() => {
      const element = document.querySelector('.project-detail-gallery__stage, .project-detail-gallery img')
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return rect.height ? rect.width / rect.height : null
    })(),
  }))
  check(detailState.overflow <= 1, `detail mobile: horizontal overflow ${detailState.overflow}px`)
  check(detailState.closeHeight >= 44, 'detail mobile: close target is below 44px')
  check(detailState.footer, 'detail mobile: common footer is missing')
  check(detailState.firstStoryColumns === 1, 'detail mobile: story row did not collapse to one readable column')
  check(detailState.galleryRatio === null || Math.abs(detailState.galleryRatio - 1.5) < .08, 'detail mobile: gallery is not locked to 3:2')
  await detail.screenshot({ path: '/tmp/mist-detail-390.png', fullPage: true })
  await detail.close()

  const gate = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await gate.goto(baseUrl, { waitUntil: 'networkidle' })
  await gate.locator('.t-gate').waitFor({ state: 'visible' })
  const gateState = await gate.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    titleSize: Number.parseFloat(getComputedStyle(document.querySelector('.gate-title')).fontSize),
    inputHeight: document.querySelector('.gate-form input')?.getBoundingClientRect().height,
    buttonHeight: document.querySelector('.gate-form button')?.getBoundingClientRect().height,
  }))
  check(gateState.overflow <= 1, `gate mobile: horizontal overflow ${gateState.overflow}px`)
  check(gateState.titleSize >= 36, 'gate mobile: title hierarchy is too small')
  check(gateState.inputHeight >= 44 && gateState.buttonHeight >= 44, 'gate mobile: a touch target is below 44px')
  await gate.screenshot({ path: '/tmp/mist-gate-390.png', fullPage: true })
  await gate.close()
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(`Mist audit failed (${failures.length})`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Mist audit passed at ${widths.join(', ')}px, plus mobile gate and project detail.`)
