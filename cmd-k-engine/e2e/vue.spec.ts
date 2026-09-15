import { expect, test } from '@playwright/test'

test('opens and navigates the command palette', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Cmd+K Command Palette')

  await page.getByRole('button', { name: 'Open Command Palette' }).click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await expect(page.getByPlaceholder('Search commands...')).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Dashboard')).toBeVisible()
})
