import { defineConfig, devices } from '@playwright/test'

const FRONT = process.env.E2E_FRONT_URL || 'http://127.0.0.1:5173'
const API = process.env.E2E_API_URL || 'http://127.0.0.1:8000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: FRONT,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
    // Вне CI — системный Google Chrome (без скачивания браузера Playwright)
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  webServer: [
    {
      command: 'python manage.py migrate --noinput && python manage.py runserver 127.0.0.1:8000',
      cwd: '../backend',
      url: `${API}/api/content/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      url: FRONT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
