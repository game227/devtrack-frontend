import { defineConfig } from '@playwright/test'

// End-to-end tests against a real backend and the built frontend. Locally, start
// the backend (`python manage.py runserver`) and serve a build of the frontend
// (`npm run build && npm run preview -- --port 5173`), then `npm run test:e2e`.
// A dev server works too, but its first page loads compile on demand and can
// outlast a navigation's timeout. In CI the workflow starts both servers.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Each sign-in hashes a real password on the server, so give navigations that wait on it more than
  // the default 5 s before calling it a failure.
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
