import { getAllPages } from './pagination'
import type { Label } from '../types/label'

interface LabelFilters {
  workspace?: number
  project?: number
}

export async function listLabels(filters: LabelFilters): Promise<Label[]> {
  return getAllPages<Label>('/labels/', { ...filters })
}
