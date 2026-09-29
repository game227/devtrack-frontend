import { expect, test } from '@playwright/test'

// End-to-end smoke test for the golden path: register a brand-new account
// (a personal workspace is auto-created server-side), create a project,
// create an issue in it, then move that issue on the board. Runs in Uzbek
// (the default UI language) against real backend + frontend servers — see
// playwright.config.ts for how those are started in CI.

test('register, create a project, create an issue, and move it on the board', async ({ page }) => {
  const stamp = Date.now()
  const username = `e2e_${stamp}`
  const email = `${username}@example.com`
  // Deliberately shares no substring with the username/email (Django's
  // UserAttributeSimilarityValidator rejects a password too similar to
  // either) — a fixed, unrelated passphrase plus a short random suffix.
  const password = `Correct-Horse-Battery-Staple-${Math.random().toString(36).slice(2, 8)}`

  await page.goto('/register')
  await page.getByLabel('Foydalanuvchi nomi').fill(username)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Parol', { exact: true }).fill(password)
  await page.getByLabel('Parolni tasdiqlang').fill(password)
  await page.getByRole('button', { name: 'Akkaunt yaratish' }).click()

  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/projects')
  await page.getByRole('button', { name: 'Yangi loyiha' }).click()
  const projectName = `E2E Project ${stamp}`
  await page.getByLabel('Nomi').fill(projectName)
  await page.getByRole('button', { name: 'Loyiha yaratish' }).click()

  await page.getByRole('link', { name: new RegExp(projectName) }).click()
  await expect(page).toHaveURL(/\/projects\/\d+/)
  // The project's own "issues" and "board" nav links share label text with
  // the top-level ones ("Vazifalar" exists at both /issues and
  // /projects/:id/issues), so navigate by the captured id instead of
  // clicking a possibly-ambiguous link.
  const projectId = page.url().match(/\/projects\/(\d+)/)?.[1]
  if (!projectId) throw new Error('could not read the project id from the URL')

  await page.goto(`/projects/${projectId}/issues?new=1`)
  const issueTitle = `E2E Issue ${stamp}`
  await page.getByLabel('Sarlavha').fill(issueTitle)
  await page.getByRole('button', { name: 'Vazifa yaratish' }).click()
  await expect(page.getByText(issueTitle)).toBeVisible()

  await page.goto(`/projects/${projectId}/board`)
  await expect(page.getByText(issueTitle)).toBeVisible()

  // Desktop kanban cards move via native HTML5 drag-and-drop, which is
  // brittle to simulate reliably. The board also ships an explicit
  // <select> for touch screens (see ProjectBoardPage.tsx, `md:hidden`)
  // that makes the same server call — switch to a narrow viewport to
  // reveal it and drive that instead.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByLabel("O'tkazish").selectOption('in_progress')
  await expect(page.getByLabel("O'tkazish")).toHaveValue('in_progress')
})
