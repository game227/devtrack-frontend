import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

// Who may change an issue, end to end through the real backend: its creator may change anything, the
// person it is assigned to only its progress, everyone else nothing — and someone outside the
// workspace cannot even see it. Users and data are set up through the API; the assignee then works
// in the browser. Runs in Uzbek, the default UI language.
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'

interface Account {
  id: number
  username: string
  password: string
  headers: Record<string, string>
}

async function register(request: APIRequestContext, username: string): Promise<Account> {
  // Shares nothing with the username (Django rejects passwords too similar to it).
  const password = `Correct-Horse-Battery-Staple-${Math.random().toString(36).slice(2, 8)}`
  const response = await request.post(`${API}/auth/register/`, {
    data: { username, email: `${username}@example.com`, password, password_confirm: password },
  })
  expect(response.status(), await response.text()).toBe(201)
  const body = await response.json()
  return { id: body.user.id, username, password, headers: { Authorization: `Bearer ${body.access}` } }
}

async function post(request: APIRequestContext, path: string, who: Account, data: object) {
  const response = await request.post(`${API}${path}`, { headers: who.headers, data })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

test('the assignee moves their issue on the board; nobody else can change what is not theirs', async ({ page, request }) => {
  // Three sign-ups (each a real password hash) plus a browser session: more than the default 30 s budget
  // on a busy machine.
  test.setTimeout(60_000)
  const stamp = Date.now()
  const owner = await register(request, `owner_${stamp}`)
  const dev = await register(request, `dev_${stamp}`)
  const stranger = await register(request, `stranger_${stamp}`)

  // The owner's personal workspace is created at registration; the developer is invited and accepts
  // (being added is only an invitation until the invitee says yes).
  const listed = await (await request.get(`${API}/workspaces/`, { headers: owner.headers })).json()
  const workspace = (listed.results ?? listed)[0]
  const invitation = await post(request, `/workspaces/${workspace.id}/members/`, owner, { username: dev.username })
  await post(request, `/workspaces/invitations/${invitation.id}/accept/`, dev, {})
  const project = await post(request, '/projects/', owner, { workspace: workspace.id, name: `Permissions ${stamp}` })
  const assigned = await post(request, '/issues/', owner, { project: project.id, title: `Assigned ${stamp}`, assignee_id: dev.id })
  const others = await post(request, '/issues/', owner, { project: project.id, title: `Not mine ${stamp}` })
  expect([assigned.number, others.number]).toEqual([1, 2]) // numbered within the project

  // Nobody outside the workspace can be handed the work...
  const outsider = await request.patch(`${API}/issues/${assigned.id}/`, { headers: owner.headers, data: { assignee_id: stranger.id } })
  expect(outsider.status()).toBe(400)
  // ...nor read it.
  expect((await request.get(`${API}/issues/${assigned.id}/`, { headers: stranger.headers })).status()).toBe(403)

  // The developer signs in through the UI and opens the owner's workspace.
  await page.goto('/login')
  await page.getByLabel('Foydalanuvchi nomi').fill(dev.username)
  await page.getByLabel('Parol', { exact: true }).fill(dev.password)
  await page.getByRole('button', { name: 'Kirish' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await page.evaluate((id) => localStorage.setItem('devtrack_workspace', String(id)), workspace.id)

  // Narrow viewport: the status picker is always shown on touch-sized screens (see the smoke test).
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/projects/${project.id}/board`)
  const mine = page.locator('[draggable]').filter({ hasText: `Assigned ${stamp}` })
  const theirs = page.locator('[draggable]').filter({ hasText: `Not mine ${stamp}` })
  await expect(mine.getByText('#1', { exact: true })).toBeVisible()
  await expect(mine).toHaveAttribute('draggable', 'true')
  await expect(theirs).toHaveAttribute('draggable', 'false')
  await expect(theirs.getByLabel("O'tkazish")).toHaveCount(0) // no control for what they cannot change

  await mine.getByLabel("O'tkazish").selectOption('in_progress')
  await expect
    .poll(async () => (await (await request.get(`${API}/issues/${assigned.id}/`, { headers: owner.headers })).json()).status)
    .toBe('in_progress')

  // The server enforces the same rule whatever a client sends.
  const rename = await request.patch(`${API}/issues/${assigned.id}/`, { headers: dev.headers, data: { title: 'hijacked' } })
  expect(rename.status()).toBe(403)
  const bystander = await request.patch(`${API}/issues/${others.id}/`, { headers: dev.headers, data: { status: 'done' } })
  expect(bystander.status()).toBe(403)
})
