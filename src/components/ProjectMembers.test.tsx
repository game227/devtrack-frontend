import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ProjectMembers } from './ProjectMembers'

const listProjectMembers = vi.fn()
const addProjectMember = vi.fn()
const updateProjectMemberSpecialty = vi.fn()
vi.mock('../api/projects', () => ({
  listProjectMembers: (...a: unknown[]) => listProjectMembers(...a),
  addProjectMember: (...a: unknown[]) => addProjectMember(...a),
  removeProjectMember: vi.fn(),
  updateProjectMemberSpecialty: (...a: unknown[]) => updateProjectMemberSpecialty(...a),
}))

const member = (id: number, username: string, specialty: string, role = 'member') => ({
  id,
  user: { id, username, avatar: null },
  role,
  specialty,
  added_at: '2026-09-01T00:00:00Z',
})

describe('ProjectMembers specialties', () => {
  beforeEach(() => {
    listProjectMembers.mockReset()
    addProjectMember.mockReset()
    updateProjectMemberSpecialty.mockReset()
  })

  it('offers the four specialties in Uzbek and shows each member\'s current one', async () => {
    listProjectMembers.mockResolvedValue([member(1, 'alex.k', 'backend'), member(2, 'dilnoza.r', 'designer', '')])
    renderWithProviders(<ProjectMembers projectId={4} />)

    const alex = await screen.findByRole('combobox', { name: 'Mutaxassislik: alex.k' })
    expect(alex).toHaveValue('backend')
    expect(screen.getByRole('combobox', { name: 'Mutaxassislik: dilnoza.r' })).toHaveValue('designer')
    for (const label of ['Frontend dasturchi', 'Backend dasturchi', 'Debugger', 'Dizayner']) {
      expect(within(alex).getByRole('option', { name: label })).toBeInTheDocument()
    }
    expect(screen.queryByText('role.')).not.toBeInTheDocument() // members without a role show no broken key
  })

  it('changes a member\'s specialty', async () => {
    listProjectMembers.mockResolvedValue([member(1, 'alex.k', 'backend')])
    updateProjectMemberSpecialty.mockResolvedValue(member(1, 'alex.k', 'debugger'))
    renderWithProviders(<ProjectMembers projectId={4} />, { lang: 'en' })
    const user = userEvent.setup()

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Specialty: alex.k' }), 'debugger')

    await waitFor(() => expect(updateProjectMemberSpecialty).toHaveBeenCalledWith(4, 1, 'debugger'))
  })

  it('sends the chosen specialty when adding a member', async () => {
    listProjectMembers.mockResolvedValue([])
    addProjectMember.mockResolvedValue(member(9, 'sam.m', 'frontend'))
    renderWithProviders(<ProjectMembers projectId={4} />, { lang: 'en' })
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Username'), 'sam.m')
    await user.selectOptions(screen.getByLabelText('Specialty'), 'frontend')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() =>
      expect(addProjectMember).toHaveBeenCalledWith(4, { username: 'sam.m', role: 'member', specialty: 'frontend' }),
    )
  })
})
