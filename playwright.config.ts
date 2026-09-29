import { defineConfig } from '@playwright/test'

// E2E smoke test against real backend + frontend servers. Locally, start
// both yourself (backend: `python manage.py runserver`, frontend:
// `npm run dev`) and run `npm run test:e2e`. In CI, the workflow starts
// them; PLAYWRIGHT_BASE_URL there points at the frontend dev server.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
