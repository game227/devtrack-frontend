import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// The work tools added on top of the basic flow, end to end against the real backend: saved views and
// the CSV export, a Markdown description, a checklist, a link between issues, an attachment, and the
// Russian interface. Data is set up through the API; the browser session reuses the account's refresh
// token so only one password is hashed. Runs in Uzbek unless switched.
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

interface Account {
  id: number
  refresh: string
  headers: Record<string, string>
}

async function register(request: APIRequestContext, username: string): Promise<Account> {
  const password = `Correct-Horse-Battery-Staple-${Math.random().toString(36).slice(2, 8)}`
  const response = await request.post(`${API}/auth/register/`, {
    data: { username, email: `${username}@example.com`, password, password_confirm: password },
  })
  expect(response.status(), await response.text()).toBe(201)
  const body = await response.json()
  return { id: body.user.id, refresh: body.refresh, headers: { Authorization: `Bearer ${body.access}` } }
}

async function post(request: APIRequestContext, path: string, who: Account, data: object) {
  const response = await request.post(`${API}${path}`, { headers: who.headers, data })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

async function signIn(page: Page, who: Account, lang = 'uz') {
  await page.goto('/')
  await page.evaluate(
    ([refresh, language]) => {
      localStorage.setItem('devtrack_refresh_token', refresh)
      localStorage.setItem('devtrack_lang', language)
    },
    [who.refresh, lang],
  )
}

test('saved views, CSV export and the issue tools', async ({ page, request }) => {
  test.setTimeout(90_000)
  const stamp = Date.now()
  const me = await register(request, `tools_${stamp}`)
  const listed = await (await request.get(`${API}/workspaces/`, { headers: me.headers })).json()
  const workspace = (listed.results ?? listed)[0]
  const project = await post(request, '/projects/', me, { workspace: workspace.id, name: `Tools ${stamp}` })
  const bug = await post(request, '/issues/', me, { project: project.id, title: `Crash on save ${stamp}`, type: 'bug', assignee_id: me.id })
  await post(request, '/issues/', me, { project: project.id, title: `Docs ${stamp}`, type: 'chore' })
  const other = await post(request, '/issues/', me, { project: project.id, title: `Blocker ${stamp}`, type: 'task' })

  await signIn(page, me)

  // Filters live in the URL; save them as a view and export what is shown.
  await page.goto(`/projects/${project.id}/issues`)
  await page.getByLabel("Tur bo'yicha filtr").selectOption('bug')
  await expect(page).toHaveURL(/type=bug/)
  await expect(page.getByText(`Docs ${stamp}`)).toBeHidden()
  await page.getByRole('button', { name: "Ko'rinishni saqlash" }).click()
  await page.getByLabel("Ko'rinish nomi").fill('Xatolar')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Xatolar', pressed: true })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV yuklab olish' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^tools-\d+-issues-\d{4}-\d{2}-\d{2}\.csv$/)
  const csv = (await (await download.createReadStream()).toArray()).join('')
  expect(csv).toContain('Sarlavha')
  expect(csv).toContain(`Crash on save ${stamp}`)
  expect(csv).not.toContain(`Docs ${stamp}`)

  // The issue page: Markdown description, checklist, a link, a file.
  await page.goto(`/issues/${bug.id}`)
  await page.getByRole('button', { name: "Tavsif qo'shish uchun bosing…" }).click()
  await page.getByRole('textbox', { name: 'Tavsif' }).fill('**Steps**\n\n- open the form')
  await page.getByRole('button', { name: "Ko'rinishi" }).click()
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.locator('section[aria-labelledby="issue-description"] strong')).toHaveText('Steps')

  await page.getByRole('textbox', { name: "Bosqich qo'shish" }).fill('Reproduce it')
  await page.getByRole('button', { name: "Bosqich qo'shish" }).click()
  // The field clears once the step is saved and the list reloaded.
  await expect(page.getByRole('textbox', { name: "Bosqich qo'shish" })).toHaveValue('')
  const step = page.getByRole('checkbox', { name: 'Reproduce it' })
  // A click and a waiting assertion: check() reads the box at the very moment React re-renders it.
  await step.click()
  await expect(step).toBeChecked()
  await expect(page.getByText('1 tadan 1 tasi bajarildi')).toBeVisible()

  await page.getByRole('button', { name: "Vazifani bog'lash" }).click()
  await page.getByLabel("Bog'lanish turi").selectOption('blocks')
  await page.getByLabel("Vazifani nomi yoki raqami bo'yicha toping").fill(`Blocker ${stamp}`)
  await page.getByRole('button', { name: new RegExp(`Blocker ${stamp}`) }).click()
  await expect(page.getByRole('link', { name: new RegExp(`#${other.number} Blocker`) })).toBeVisible()

  await page.locator('input[type=file]').setInputFiles({ name: 'screen.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText('screen.png')).toBeVisible()
  await expect(page.locator('section[aria-labelledby="issue-attachments"] img')).toBeVisible()
})

test('the interface in Russian', async ({ page, request }) => {
  const me = await register(request, `ru_${Date.now()}`)
  await signIn(page, me, 'ru')
  await page.goto('/issues')
  await expect(page.getByRole('heading', { level: 1, name: 'Задачи' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Экспорт в CSV' })).toBeVisible()
  await page.goto('/settings')
  await page.getByRole('button', { name: /^UZ/ }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sozlamalar' })).toBeVisible()
})
