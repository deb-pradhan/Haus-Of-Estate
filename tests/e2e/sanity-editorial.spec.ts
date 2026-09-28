import { expect, test } from '@playwright/test'

test('public pages render without exposing preview controls', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#main-content')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Exit preview' })).toHaveCount(0)
})

test('the embedded Studio route remains reachable', async ({ request }) => {
  const response = await request.get('/studio')

  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('id="sanity"')
})

test('draft and revalidation routes fail closed without secrets', async ({
  request,
}) => {
  const draftResponse = await request.get('/api/draft-mode/enable')
  const revalidationResponse = await request.post('/api/revalidate/path', {
    data: {},
  })

  expect(draftResponse.status()).toBe(503)
  expect(revalidationResponse.status()).toBe(503)
})
