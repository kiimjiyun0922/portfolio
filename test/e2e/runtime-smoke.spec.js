import { expect, test } from '@playwright/test'

function watchPageErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('visitor gate loads without a runtime error', async ({ page }) => {
  const errors = watchPageErrors(page)

  await page.goto('/')

  await expect(page.getByPlaceholder('Enter access token')).toBeVisible()
  await expect(page.getByText('화면을 불러오지 못했습니다')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('admin login route loads without a runtime error', async ({ page }) => {
  const errors = watchPageErrors(page)

  await page.goto('/#admin')

  await expect(page.getByRole('heading', { name: 'Admin 로그인' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Google로 로그인' })).toBeVisible()
  await expect(page.getByText('화면을 불러오지 못했습니다')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('local portfolio preview renders lazy sections without a runtime error', async ({ page }) => {
  const errors = watchPageErrors(page)

  await page.goto('/?preview')
  await page.locator('body').evaluate((body) => window.scrollTo(0, body.scrollHeight))

  await expect(page.locator('#projects')).toBeAttached()
  await expect(page.locator('#contact')).toBeAttached()
  await expect(page.getByText('화면을 불러오지 못했습니다')).toHaveCount(0)
  expect(errors).toEqual([])
})
