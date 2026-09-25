import { chromium } from '@playwright/test'

const baseUrl = process.env.MIST_BASE_URL || 'http://127.0.0.1:5176'
const widths = [360, 390, 430, 768, 1024, 1440]
const failures = []

function check(condition, message) {
  if (!condition) failures.push(message)
}

const browser = await chromium.launch({ headless: true })

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 900 }, deviceScaleFactor: 1 })
    await page.goto(`${baseUrl}/?preview`, { waitUntil: 'domcontentloaded' })
    await page.locator('#home').waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1400)

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
        heroTitleSize: size('.mist-hero-title span'),
        heroTitleText: (() => {
          const element = document.querySelector('.mist-hero-title span')
          if (!element) return null
          const box = element.getBoundingClientRect()
          return {
            left: box.left,
            right: box.right,
            opacity: Number.parseFloat(getComputedStyle(element).opacity),
          }
        })(),
        fogContract: (() => {
          const title = document.querySelector('.mist-hero-title')
          const fog = document.querySelector('.mist-fog-layer')
          if (!title || !fog) return null
          const titleStyle = getComputedStyle(title)
          const fogStyle = getComputedStyle(fog)
          return {
            titleZ: Number.parseInt(titleStyle.zIndex, 10) || 0,
            fogZ: Number.parseInt(fogStyle.zIndex, 10) || 0,
            maskLayers: (fogStyle.maskImage.match(/radial-gradient/g) || []).length,
            filter: fogStyle.backdropFilter || fogStyle.webkitBackdropFilter || '',
            edgeFilter: fogStyle.filter,
            background: fogStyle.backgroundColor,
          }
        })(),
        heroStatOverlap: [...document.querySelectorAll('.mist-hero-stats button')].some((button) => {
          const label = button.querySelector('.mist-hero-stat-label')?.getBoundingClientRect()
          const pseudo = getComputedStyle(button, '::before')
          const buttonBox = button.getBoundingClientRect()
          const pseudoWidth = Number.parseFloat(pseudo.width) || 0
          return label ? buttonBox.left + pseudoWidth > label.left + 1 : false
        }),
        ornamentOverlap: (() => {
          const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
          const ornaments = [...document.querySelectorAll('#projects .notebook-mark, #resume .notebook-mark')]
            .filter((element) => getComputedStyle(element).display !== 'none')
            .map((element) => element.getBoundingClientRect())
          const protectedText = [...document.querySelectorAll('#projects > p, #projects > h2, #projects h3, #projects .projects-archive-heading p, #projects .t-card span, #projects .t-card p, #projects .design-projects__header p, #resume > p, #resume > h2, #resume h3, #resume .resume-list p, #resume .resume-list span')]
            .map((element) => element.getBoundingClientRect())
          return ornaments.some((ornament) => protectedText.some((content) => overlaps(ornament, content)))
        })(),
        selectedIndexInset: (() => {
          const row = document.querySelector('.design-projects__index-row[aria-pressed="true"]')
          const index = row?.querySelector('span')
          if (!row || !index) return null
          return index.getBoundingClientRect().left - row.getBoundingClientRect().left
        })(),
        projectColumns: (() => {
          const groupTitle = document.querySelector('#projects .projects-archive-heading h3')?.getBoundingClientRect()
          const groupCopy = document.querySelector('#projects .projects-archive-heading p')?.getBoundingClientRect()
          const cardMeta = document.querySelector('#projects .t-card > div:first-child > span')?.getBoundingClientRect()
          const cardTitle = document.querySelector('#projects .t-card > div:first-child > h3')?.getBoundingClientRect()
          return groupTitle && groupCopy && cardMeta && cardTitle
            ? { groupTitle: groupTitle.left, groupCopy: groupCopy.left, cardMeta: cardMeta.left, cardTitle: cardTitle.left }
            : null
        })(),
        projectHeadingGap: (() => {
          const heading = document.querySelector('#projects > h2')?.getBoundingClientRect()
          const firstGroup = document.querySelector('#projects .projects-archive-group')?.getBoundingClientRect()
          return heading && firstGroup ? firstGroup.top - heading.bottom : null
        })(),
        sampleCoverLoaded: (() => {
          const image = document.querySelector('.design-projects__feature .design-project-visual img')
          return image ? image.complete && image.naturalWidth > 0 : false
        })(),
        resumeBoundary: (() => {
          const blocks = [...document.querySelectorAll('.resume-block')]
          if (blocks.length < 2) return null
          const previousRow = blocks[0].querySelector('.resume-list > :last-child')?.getBoundingClientRect()
          const nextHeading = blocks[1].querySelector('.resume-block__heading')?.getBoundingClientRect()
          return previousRow && nextHeading ? nextHeading.top - previousRow.bottom : null
        })(),
        mobileStatus: getComputedStyle(document.querySelector('.portfolio-mobile-status')).display,
        footer: (() => {
          const footer = document.querySelector('.notebook-footer')
          const message = footer?.querySelector('.notebook-footer__column--center > p')
          if (!footer || !message) return null
          const style = getComputedStyle(message)
          const lineHeight = Number.parseFloat(style.lineHeight)
          return {
            overflow: footer.scrollWidth - footer.clientWidth,
            messageLines: lineHeight ? message.getBoundingClientRect().height / lineHeight : null,
          }
        })(),
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
    check(metrics.heroTitleSize === null || metrics.heroTitleSize <= 120.5, `${width}px: hero title exceeds the 120px cap`)
    check(metrics.heroTitleText && metrics.heroTitleText.left >= -1 && metrics.heroTitleText.right <= width + 1, `${width}px: hero title escapes the viewport`)
    check(metrics.heroTitleText && metrics.heroTitleText.opacity >= .99, `${width}px: hero title is visually suppressed`)
    check(metrics.fogContract && metrics.fogContract.fogZ > metrics.fogContract.titleZ, `${width}px: Mist fog is not layered above the hero title`)
    check(metrics.fogContract && metrics.fogContract.maskLayers >= 3, `${width}px: Mist fog is missing its cloud mask`)
    check(metrics.fogContract && metrics.fogContract.filter.includes('blur('), `${width}px: Mist fog has no backdrop blur`)
    check(metrics.fogContract && metrics.fogContract.edgeFilter.includes('blur('), `${width}px: Mist fog edge is not feathered`)
    check(!metrics.heroStatOverlap, `${width}px: hero stat index overlaps its label`)
    check(!metrics.ornamentOverlap, `${width}px: a decorative mark overlaps protected content`)
    check(metrics.selectedIndexInset === null || metrics.selectedIndexInset >= 19, `${width}px: selected design index content is too close to its state marker`)
    check(metrics.projectColumns === null || Math.abs(metrics.projectColumns.groupTitle - metrics.projectColumns.cardMeta) <= 1, `${width}px: project group and item labels do not share a column`)
    check(metrics.projectColumns === null || Math.abs(metrics.projectColumns.groupCopy - metrics.projectColumns.cardTitle) <= 1, `${width}px: project group copy and item titles do not share a column`)
    check(metrics.projectHeadingGap === null || (metrics.projectHeadingGap >= 16 && metrics.projectHeadingGap <= 36), `${width}px: project title-to-list gap is ${metrics.projectHeadingGap}px`)
    check(metrics.sampleCoverLoaded, `${width}px: selected sample cover is missing`)
    check(metrics.resumeBoundary === null || Math.abs(metrics.resumeBoundary) <= 1, `${width}px: resume blocks have an arbitrary ${metrics.resumeBoundary}px gap`)
    check(metrics.mobileStatus === 'none', `${width}px: undocumented mobile status control is visible`)
    check(metrics.footer && metrics.footer.overflow <= 1, `${width}px: footer overflows by ${metrics.footer?.overflow}px`)
    if (width >= 390 && width < 768) check(metrics.footer?.messageLines <= 1.25, `${width}px: footer message wraps to ${metrics.footer?.messageLines} lines`)
    check(metrics.hiddenContent === 0, `${width}px: ${metrics.hiddenContent} content blocks remain hidden before scrolling`)

    await page.screenshot({ path: `/tmp/mist-hero-${width}.png`, fullPage: false })
    await page.screenshot({ path: `/tmp/mist-front-${width}.png`, fullPage: true })
    await page.close()
  }

  const interactions = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await interactions.goto(`${baseUrl}/?preview`, { waitUntil: 'domcontentloaded' })
  await interactions.locator('#projects').waitFor({ state: 'attached' })
  await interactions.locator('#projects').scrollIntoViewIfNeeded()
  const tab = interactions.locator('#projects .project-story__nav button').first()
  if (await tab.count()) {
    await tab.click()
    const tabFocus = await tab.evaluate((element) => {
      const style = getComputedStyle(element)
      return { outline: style.outlineStyle, shadow: style.boxShadow }
    })
    check(tabFocus.outline === 'none', 'project tab: mouse click leaves a focus outline')
    check(tabFocus.shadow === 'none', 'project tab: active state retains a second selection shadow')
  }
  const backToTop = interactions.locator('.notebook-footer__link')
  if (await backToTop.count()) {
    await backToTop.click()
    const footerFocus = await backToTop.evaluate((element) => getComputedStyle(element).outlineStyle)
    check(footerFocus === 'none', 'footer: mouse click leaves a focus outline')
  }
  const experienceToggle = interactions.locator('.experience-project__toggle').first()
  if (await experienceToggle.count()) {
    await experienceToggle.click()
    await interactions.locator('.experience-project__details').first().waitFor({ state: 'visible' })
    const projectRhythm = await interactions.evaluate(() => {
      const toggle = document.querySelector('.experience-project__toggle')?.getBoundingClientRect()
      const summary = document.querySelector('.experience-project__summary')?.getBoundingClientRect()
      const result = document.querySelector('.experience-project__result')?.getBoundingClientRect()
      const toggleStyle = document.querySelector('.experience-project__toggle') ? getComputedStyle(document.querySelector('.experience-project__toggle')) : null
      return {
        summaryGap: toggle && summary ? summary.top - toggle.bottom : null,
        resultGap: summary && result ? result.top - summary.bottom : null,
        toggleBorder: toggleStyle?.borderBottomWidth,
      }
    })
    check(projectRhythm.toggleBorder === '0px', 'experience project: divider incorrectly separates title from its summary')
    check(projectRhythm.summaryGap !== null && projectRhythm.summaryGap >= 7 && projectRhythm.summaryGap <= 10, `experience project: title-summary gap is ${projectRhythm.summaryGap}px`)
    check(projectRhythm.resultGap !== null && projectRhythm.resultGap >= 15 && projectRhythm.resultGap <= 18, `experience project: summary-result gap is ${projectRhythm.resultGap}px`)
  }
  await interactions.close()

  const detail = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await detail.goto(`${baseUrl}/projects/sample-noma-launch?preview`, { waitUntil: 'domcontentloaded' })
  await detail.locator('.project-detail-close').waitFor({ state: 'visible' })
  const detailState = await detail.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    closeHeight: document.querySelector('.project-detail-close')?.getBoundingClientRect().height,
    footer: Boolean(document.querySelector('.notebook-footer')),
    briefSize: Number.parseFloat(getComputedStyle(document.querySelector('.project-detail-brief > div')).fontSize),
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
  check(detailState.briefSize <= 17, `detail mobile: brief is oversized at ${detailState.briefSize}px`)
  check(detailState.firstStoryColumns === 1, 'detail mobile: story row did not collapse to one readable column')
  check(detailState.galleryRatio === null || Math.abs(detailState.galleryRatio - 1.5) < .08, 'detail mobile: gallery is not locked to 3:2')
  await detail.screenshot({ path: '/tmp/mist-detail-390.png', fullPage: true })
  await detail.close()

  const detailDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await detailDesktop.goto(`${baseUrl}/projects/sample-noma-launch?preview`, { waitUntil: 'domcontentloaded' })
  await detailDesktop.locator('.project-detail-brief').waitFor({ state: 'visible' })
  const detailDesktopState = await detailDesktop.evaluate(() => {
    const brief = document.querySelector('.project-detail-brief > div')
    const story = document.querySelector('.project-detail-story section > div')
    const line = document.querySelector('.project-detail-story section')
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      briefSize: Number.parseFloat(getComputedStyle(brief).fontSize),
      briefWidth: brief.getBoundingClientRect().width,
      storyWidth: story.getBoundingClientRect().width,
      lineWidth: Number.parseFloat(getComputedStyle(line).borderBottomWidth),
    }
  })
  check(detailDesktopState.overflow <= 1, `detail desktop: horizontal overflow ${detailDesktopState.overflow}px`)
  check(detailDesktopState.briefSize <= 17, `detail desktop: brief is oversized at ${detailDesktopState.briefSize}px`)
  check(detailDesktopState.briefWidth <= 760, `detail desktop: brief reading width is ${detailDesktopState.briefWidth}px`)
  check(detailDesktopState.storyWidth <= 760, `detail desktop: story reading width is ${detailDesktopState.storyWidth}px`)
  check(detailDesktopState.lineWidth === 1, `detail desktop: story divider is ${detailDesktopState.lineWidth}px`)
  await detailDesktop.screenshot({ path: '/tmp/mist-detail-1440.png', fullPage: true })
  await detailDesktop.close()

  const archive = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await archive.goto(`${baseUrl}/projects?preview`, { waitUntil: 'domcontentloaded' })
  await archive.locator('.project-archive-page').waitFor({ state: 'visible' })
  await archive.locator('.project-archive-card img').first().waitFor({ state: 'visible' })
  const archiveState = await archive.evaluate(() => ({
    closeHeight: document.querySelector('.project-detail-close')?.getBoundingClientRect().height || 0,
    loadedImages: [...document.querySelectorAll('.project-archive-card img')].every((image) => image.complete && image.naturalWidth > 0),
  }))
  check(archiveState.closeHeight >= 44, 'archive: close target is missing or below 44px')
  check(archiveState.loadedImages, 'archive: one or more sample covers are missing')
  await archive.evaluate(() => window.scrollTo(0, 1000))
  await archive.waitForTimeout(300)
  check(await archive.locator('.notebook-top-button').isVisible(), 'archive: floating Top is missing after scrolling')
  await archive.screenshot({ path: '/tmp/mist-archive-1440.png', fullPage: true })
  await archive.close()

  for (const width of [390, 768, 1440]) {
    const gate = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 900 } })
    await gate.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    await gate.locator('.t-gate').waitFor({ state: 'visible' })
    await gate.waitForTimeout(1000)
    const gateState = await gate.evaluate(() => {
      const intro = document.querySelector('.gate-intro')?.getBoundingClientRect()
      const panel = document.querySelector('.gate-panel')?.getBoundingClientRect()
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        titleSize: Number.parseFloat(getComputedStyle(document.querySelector('.gate-title')).fontSize),
        inputHeight: document.querySelector('.gate-form input')?.getBoundingClientRect().height,
        buttonHeight: document.querySelector('.gate-form button')?.getBoundingClientRect().height,
        introTop: intro?.top,
        introBottom: intro?.bottom,
        panelTop: panel?.top,
      }
    })
    check(gateState.overflow <= 1, `gate ${width}px: horizontal overflow ${gateState.overflow}px`)
    check(gateState.titleSize >= (width < 768 ? 36 : 44), `gate ${width}px: title hierarchy is too small`)
    check(gateState.inputHeight >= 44 && gateState.buttonHeight >= 44, `gate ${width}px: a touch target is below 44px`)
    if (width >= 1024) check(Math.abs(gateState.introTop - gateState.panelTop) <= 2, `gate ${width}px: intro and form do not share a top line`)
    if (width < 1024) check(gateState.panelTop >= gateState.introBottom, `gate ${width}px: stacked form overlaps the intro`)
    await gate.screenshot({ path: `/tmp/mist-gate-${width}.png`, fullPage: true })
    await gate.close()
  }
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(`Mist audit failed (${failures.length})`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Mist audit passed at ${widths.join(', ')}px, plus mobile gate and project detail.`)
