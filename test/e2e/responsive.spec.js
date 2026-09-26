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

for (const width of [390, 768, 1280]) {
  test(`project archive includes the common footer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/projects?preview')
    const footer = page.locator('.notebook-footer')
    await expect(footer).toBeAttached()
    await expect(footer.getByRole('button', { name: /Back to top/i })).toBeVisible()
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
  })
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

test('project group link moves to its configured work experience', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/?preview')
  const link = page.getByRole('button', { name: 'AI Product 관련 업무 경험으로 이동' })
  await link.scrollIntoViewIfNeeded()
  await link.click()
  const target = page.locator('#exp-0')
  await expect(target).toHaveClass(/experience-entry--linked/)
  await expect(target).toBeInViewport()
})

test('yellow project surface uses one warm semantic rule palette', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/?preview')
  const colors = await page.locator('#projects').evaluate((section) => {
    const sectionStyle = getComputedStyle(section)
    const indexRow = section.querySelector('.design-projects__index-row')
    const heading = section.querySelector('.projects-archive-heading')
    return {
      ink: sectionStyle.getPropertyValue('--project-ink').trim(),
      meta: sectionStyle.getPropertyValue('--project-meta').trim(),
      rule: sectionStyle.getPropertyValue('--project-rule').trim(),
      indexBorder: getComputedStyle(indexRow).borderBottomColor,
      headingBorder: getComputedStyle(heading).borderBottomColor,
    }
  })
  expect(colors.ink).toBe('#2f2d24')
  expect(colors.meta).toBe('#686147')
  expect(colors.rule).toContain('49, 44, 31')
  expect(colors.indexBorder).not.toBe('rgb(207, 204, 195)')
  expect(colors.headingBorder).not.toBe('rgb(207, 204, 195)')
})

for (const width of [390, 1024, 1280]) {
  test(`project detail brief has a distinct responsive layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/projects/sample-noma-launch?preview')
    await expect(page.locator('.project-detail-brief h2')).toBeVisible()
    const positions = await page.evaluate(() => {
      const left = (selector) => document.querySelector(selector).getBoundingClientRect().left
      const brief = document.querySelector('.project-detail-brief')
      return {
        briefTitle: left('.project-detail-brief h2'),
        briefBody: left('.project-detail-brief > div'),
        storyTitle: left('.project-detail-story section h2'),
        storyBody: left('.project-detail-story section > div'),
        briefBackground: getComputedStyle(brief).backgroundColor,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }
    })

    if (width < 768) expect(positions.briefBody).toBeCloseTo(positions.briefTitle, 1)
    else expect(positions.briefBody).toBeGreaterThan(positions.briefTitle + 80)
    if (width < 1180) expect(positions.storyBody).toBeCloseTo(positions.storyTitle, 1)
    else expect(positions.storyBody).toBeGreaterThan(positions.storyTitle)
    // The reviewed Mist contract uses a transparent paper surface and a
    // single 14% rule instead of a separate filled quote card.
    expect(positions.briefBackground).toBe('rgba(0, 0, 0, 0)')
    expect(positions.scrollWidth).toBeLessThanOrEqual(positions.clientWidth)
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

test('gate keeps the request hint attached to the email channel', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const email = page.locator('.gate-contact__channel a')
  const hint = page.locator('.gate-contact__channel p')
  await expect(email).toBeVisible()
  const emailBox = await email.boundingBox()
  const hintBox = await hint.boundingBox()
  expect(hintBox.x).toBeCloseTo(emailBox.x, 1)
  expect(hintBox.y - (emailBox.y + emailBox.height)).toBeLessThanOrEqual(10)
})

for (const width of [390, 768, 1280]) {
  test(`project gallery advances without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem('portfolio_projects', JSON.stringify({
        groups: [{ title: 'PM', projects: [{ title: 'Placeholder' }] }],
        designProjects: [{
          id: 'gallery-test', slug: 'gallery-test', published: true, featured: true,
          category: 'Campaign', year: '2026', title: 'Gallery Test', summary: 'Gallery test project',
          coverImage: '/assets/campaign-pulse.webp', coverAlt: 'Campaign cover', brief: 'Brief', problem: 'Problem',
          gallery: [
            { url: '/assets/campaign-noma.webp', alt: 'First campaign image', caption: 'First' },
            { url: '/assets/campaign-still.webp', alt: 'Second campaign image', caption: 'Second' },
          ],
        }],
      }))
    })
    await page.goto('/projects/gallery-test?preview')
    const stageImage = page.locator('.project-detail-gallery__stage img')
    await expect(stageImage).toHaveAttribute('src', '/assets/campaign-noma.webp')
    await page.getByRole('button', { name: 'Next project image' }).click()
    await expect(stageImage).toHaveAttribute('src', '/assets/campaign-still.webp')
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
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
    if (isMobile) {
      expect(metrics.sectionPadding).toBeCloseTo(48, 1)
    } else if (viewport.width < 1024) {
      expect(metrics.sectionPadding).toBeGreaterThanOrEqual(56)
      expect(metrics.sectionPadding).toBeLessThanOrEqual(68)
    } else {
      expect(metrics.sectionPadding).toBeGreaterThanOrEqual(72)
      expect(metrics.sectionPadding).toBeLessThanOrEqual(112)
    }
    expect(metrics.titleSize).toBeGreaterThanOrEqual(isMobile ? 36 : 40)
    expect(Math.min(...metrics.statButtonWidths)).toBeGreaterThanOrEqual(metrics.statsWidth - 1)
    expect(Math.max(...metrics.valueRights) - Math.min(...metrics.valueRights)).toBeLessThanOrEqual(1)
    expect(metrics.heroTitleSize).toBeGreaterThan(metrics.heroHeadlineSize * 1.6)
    expect(metrics.heroRoleDisplay).toBe('none')
    if (isMobile) expect(metrics.cursorDisplay).toBe('none')
  })
}
