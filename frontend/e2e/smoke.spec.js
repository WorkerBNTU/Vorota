import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test('главная отдаёт бренд и CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /ВоротаРБ/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Получить консультацию|Заявка/i }).first()).toBeVisible()
  })

  test('заявка с контактов уходит успешно', async ({ page }) => {
    await page.goto('/contacts')
    const form = page.locator('form.lead-form').first()
    await expect(form).toBeVisible()

    await form.getByLabel(/Ваше имя/i).fill('E2E Тест')
    await form.locator('.phone-mask-capture').fill('291112233')
    await form.locator('input.lead-consent-input').check({ force: true })
    await form.getByRole('button', { name: /Отправить заявку/i }).click()

    await expect(page.getByText(/Заявка отправлена/i)).toBeVisible()
  })
})
