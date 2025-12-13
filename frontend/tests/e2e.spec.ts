import { test, expect } from '@playwright/test'

test('loads home and opens command palette', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('KnowledgeBaseAI')).toBeVisible()
  await page.getByRole('button', { name: '⌘K' }).click()
  await expect(page.getByText('Загрузить предмет')).toBeVisible()
  await page.keyboard.press('Escape')
})

test('switch theme', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Light' }).click()
  await page.getByRole('button', { name: 'Dark' }).click()
})
