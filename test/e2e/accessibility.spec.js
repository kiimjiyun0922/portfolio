import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

async function expectNoSeriousViolations(page) {
  await page.waitForTimeout(1000)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const seriousViolations = results.violations.filter(({ impact }) =>
    impact === 'serious' || impact === 'critical')

  const summary = seriousViolations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.flatMap(({ target }) => target),
  }))
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([])
}

test('visitor gate has no serious WCAG violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByPlaceholder('Enter access token')).toBeVisible()
  await expectNoSeriousViolations(page)
})

test('admin login has no serious WCAG violations', async ({ page }) => {
  await page.goto('/#admin')
  await expect(page.getByRole('heading', { name: 'Admin 로그인' })).toBeVisible()
  await expectNoSeriousViolations(page)
})

test('portfolio preview has no serious WCAG violations', async ({ page }) => {
  await page.goto('/?preview')
  await expect(page.locator('#projects')).toBeAttached()
  await expectNoSeriousViolations(page)
})
