import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'small mobile', width: 320, height: 740 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'portrait tablet', width: 768, height: 1024 },
  { name: 'landscape tablet', width: 1024, height: 768 },
]

const routes = [
  { name: 'portfolio', path: '/?preview' },
  { name: 'project archive', path: '/projects?preview' },
  { name: 'project detail', path: '/projects/sample-noma-launch?preview' },
]

for (const viewport of viewports) {
  for (const route of routes) {
    test(`${route.name} fits ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto(route.path)
      await page.waitForTimeout(500)

      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))

      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
    })
  }
}

test('career journey keeps its text position on hover', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/?preview')
  const firstRow = page.locator('.journey-index__row').first()
  const company = firstRow.locator('.journey-index__company')
  await firstRow.scrollIntoViewIfNeeded()
  const before = await company.boundingBox()
  await firstRow.hover()
  await page.waitForTimeout(250)
  const after = await company.boundingBox()

  expect(after.x).toBeCloseTo(before.x, 1)
  expect(after.y).toBeCloseTo(before.y, 1)
})

for (const width of [390, 1024, 1280]) {
  test(`project detail columns align at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/projects/sample-noma-launch?preview')
    await expect(page.locator('.project-detail-brief h2')).toBeVisible()
    const positions = await page.evaluate(() => {
      const left = (selector) => document.querySelector(selector).getBoundingClientRect().left
      return {
        briefTitle: left('.project-detail-brief h2'),
        briefBody: left('.project-detail-brief > div'),
        storyTitle: left('.project-detail-story section h2'),
        storyBody: left('.project-detail-story section > div'),
      }
    })

    expect(positions.briefTitle).toBeCloseTo(positions.storyTitle, 1)
    expect(positions.briefBody).toBeCloseTo(positions.storyBody, 1)
  })
}

for (const width of [768, 1024, 1280]) {
  test(`project title stays intentional at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/projects/sample-pulse-festival?preview')
    const title = page.locator('.project-detail-hero__copy h1')
    await expect(title).toBeVisible()
    const metrics = await title.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(style.lineHeight),
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }
    })

    expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight * 1.15)
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth)
  })
}

for (const width of [390, 1024]) {
  test(`project detail inherits navigation and footer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/projects/sample-noma-launch?preview')
    const close = page.getByRole('link', { name: 'Close project and return to portfolio' })
    await expect(close).toBeVisible()
    await expect(close).toHaveAttribute('href', '/')
    await expect(page.locator('.notebook-footer')).toBeAttached()
    const box = await close.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
}

for (const viewport of viewports) {
  test(`portfolio spacing follows the responsive contract at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/?preview')
    await expect(page.locator('#projects')).toBeAttached()

    const metrics = await page.evaluate(() => {
      const section = document.querySelector('.section-wrap')
      const title = document.querySelector('#projects > h2')
      const sectionStyle = getComputedStyle(section)
      const titleStyle = getComputedStyle(title)
      const stats = document.querySelector('.mist-hero-stats')
      const statButtons = [...stats.querySelectorAll('button')]
      const valueRights = statButtons.map((button) => button.querySelector('.mist-hero-stat-value').getBoundingClientRect().right)
      const heroTitle = document.querySelector('.mist-hero-title span')
      const heroHeadline = document.querySelector('.mist-hero-intro h1')
      const heroRole = document.querySelector('.mist-hero-role')

      return {
        sectionPadding: Number.parseFloat(sectionStyle.paddingTop),
        titleSize: Number.parseFloat(titleStyle.fontSize),
        statsWidth: stats.getBoundingClientRect().width,
        statButtonWidths: statButtons.map((button) => button.getBoundingClientRect().width),
        valueRights,
        cursorDisplay: getComputedStyle(document.querySelector('.notebook-cursor')).display,
        heroTitleSize: Number.parseFloat(getComputedStyle(heroTitle).fontSize),
        heroHeadlineSize: Number.parseFloat(getComputedStyle(heroHeadline).fontSize),
        heroRoleDisplay: getComputedStyle(heroRole).display,
      }
    })

    const isMobile = viewport.width < 768
    expect(metrics.sectionPadding).toBeGreaterThanOrEqual(isMobile ? 40 : 56)
    expect(metrics.sectionPadding).toBeLessThanOrEqual(isMobile ? 40 : 68)
    expect(metrics.titleSize).toBeGreaterThanOrEqual(isMobile ? 36 : 40)
    expect(Math.min(...metrics.statButtonWidths)).toBeGreaterThanOrEqual(metrics.statsWidth - 1)
    expect(Math.max(...metrics.valueRights) - Math.min(...metrics.valueRights)).toBeLessThanOrEqual(1)
    expect(metrics.heroTitleSize).toBeGreaterThan(metrics.heroHeadlineSize * 1.6)
    expect(metrics.heroRoleDisplay).toBe('none')
    if (isMobile) expect(metrics.cursorDisplay).toBe('none')
  })
}
