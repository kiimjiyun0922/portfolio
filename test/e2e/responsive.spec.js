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

      return {
        sectionPadding: Number.parseFloat(sectionStyle.paddingTop),
        titleSize: Number.parseFloat(titleStyle.fontSize),
      }
    })

    const isMobile = viewport.width < 768
    expect(metrics.sectionPadding).toBeGreaterThanOrEqual(isMobile ? 40 : 56)
    expect(metrics.sectionPadding).toBeLessThanOrEqual(isMobile ? 40 : 68)
    expect(metrics.titleSize).toBeGreaterThanOrEqual(isMobile ? 36 : 40)
  })
}
