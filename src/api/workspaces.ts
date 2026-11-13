import { getAllPages } from './pagination'
import type { Workspace } from '../types/workspace'

export async function listWorkspaces(): Promise<Workspace[]> {
  return getAllPages<Workspace>('/workspaces/')
}
