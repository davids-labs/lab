import { create } from 'zustand'
import type {
  ProjectConnectionSummary,
  SkillsPipelineEntry,
  WorkflowSnapshot,
  WorkflowView
} from '@preload/types'

interface WorkflowStore {
  snapshots: Partial<Record<WorkflowView, WorkflowSnapshot>>
  projectConnections: Record<string, ProjectConnectionSummary>
  skillsPipeline: SkillsPipelineEntry[]
  isLoading: boolean
  error: string | null
  loadSnapshot: (view: WorkflowView) => Promise<WorkflowSnapshot | null>
  loadProjectConnections: (projectId: string) => Promise<ProjectConnectionSummary | null>
  loadSkillsPipeline: (targetRoleId?: string | null) => Promise<SkillsPipelineEntry[]>
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  snapshots: {},
  projectConnections: {},
  skillsPipeline: [],
  isLoading: false,
  error: null,

  async loadSnapshot(view) {
    set({ isLoading: true, error: null })

    try {
      const snapshot = await window.lab.workflow.getSnapshot(view)
      set((state) => ({
        snapshots: { ...state.snapshots, [view]: snapshot },
        skillsPipeline: view === 'six_months' ? snapshot.skills_pipeline : state.skillsPipeline,
        isLoading: false
      }))
      return snapshot
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load workflow snapshot.',
        isLoading: false
      })
      return null
    }
  },

  async loadProjectConnections(projectId) {
    set({ isLoading: true, error: null })

    try {
      const connections = await window.lab.workflow.getProjectConnections(projectId)
      set((state) => ({
        projectConnections: {
          ...state.projectConnections,
          [projectId]: connections
        },
        isLoading: false
      }))
      return connections
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load project connections.',
        isLoading: false
      })
      return null
    }
  },

  async loadSkillsPipeline(targetRoleId) {
    set({ isLoading: true, error: null })

    try {
      const skillsPipeline = await window.lab.workflow.getSkillsPipeline(targetRoleId ?? undefined)
      set({ skillsPipeline, isLoading: false })
      return skillsPipeline
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load the skills pipeline.',
        isLoading: false
      })
      return []
    }
  }
}))
