import { create } from 'zustand'
import type { CreateProjectInput, Project, UpdateProjectInput } from '../../../preload/types'

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null
  activeProject: Project | null
  isLoading: boolean
  error: string | null
  filter: Project['type'] | 'all'
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  setActiveProjectId: (id: string | null) => void
  setFilter: (filter: Project['type'] | 'all') => void
  createProject: (input: CreateProjectInput) => Promise<Project>
  updateProject: (input: UpdateProjectInput) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProjectId: null,
  activeProject: null,
  isLoading: false,
  error: null,
  filter: 'all',

  async loadProjects() {
    set({ isLoading: true, error: null })

    try {
      const projects = await window.lab.project.list()
      set({ projects, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  async loadProject(id) {
    set({ isLoading: true, error: null, activeProjectId: id })

    try {
      const project = await window.lab.project.get(id)
      set((state) => ({
        activeProject: project,
        projects: state.projects.some((entry) => entry.id === project.id)
          ? state.projects.map((entry) => (entry.id === project.id ? project : entry))
          : [project, ...state.projects],
        isLoading: false
      }))
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  setActiveProjectId(activeProjectId) {
    set({ activeProjectId })
  },

  setFilter(filter) {
    set({ filter })
  },

  async createProject(input) {
    try {
      const project = await window.lab.project.create(input)
      set((state) => ({
        projects: [project, ...state.projects],
        activeProjectId: project.id,
        activeProject: project,
        error: null
      }))
      return project
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project'
      set({ error: message })
      throw new Error(message)
    }
  },

  async updateProject(input) {
    try {
      const project = await window.lab.project.update(input)
      set((state) => ({
        activeProject: state.activeProject?.id === project.id ? project : state.activeProject,
        projects: state.projects.map((entry) => (entry.id === project.id ? project : entry)),
        error: null
      }))
      return project
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project'
      set({ error: message })
      throw new Error(message)
    }
  },

  async deleteProject(id) {
    try {
      await window.lab.project.delete(id)
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        activeProject: state.activeProject?.id === id ? null : state.activeProject,
        error: null
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project'
      set({ error: message })
      throw new Error(message)
    }
  }
}))
