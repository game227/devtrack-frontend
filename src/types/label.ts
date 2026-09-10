export interface Label {
  id: number
  workspace: number
  project: number | null
  name: string
  color: string
}

export interface CreateLabelPayload {
  workspace: number
  project?: number | null
  name: string
  color: string
}
