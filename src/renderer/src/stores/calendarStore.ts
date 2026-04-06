import { create } from 'zustand'
import type {
  CalendarEvent,
  CalendarSource,
  CreateCalendarSourceInput,
  ImportCalendarSourceInput,
  UpdateCalendarSourceInput
} from '@preload/types'

interface CalendarStore {
  sources: CalendarSource[]
  events: CalendarEvent[]
  isLoading: boolean
  error: string | null
  loadSources: () => Promise<void>
  loadEvents: (sourceId?: string) => Promise<void>
  createSource: (input: CreateCalendarSourceInput) => Promise<CalendarSource>
  updateSource: (input: UpdateCalendarSourceInput) => Promise<CalendarSource>
  deleteSource: (id: string) => Promise<void>
  importIcs: (input: ImportCalendarSourceInput) => Promise<CalendarSource>
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  sources: [],
  events: [],
  isLoading: false,
  error: null,

  async loadSources() {
    set({ isLoading: true, error: null })
    try {
      const sources = await window.lab.calendar.listSources()
      set({ sources, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load calendar sources.',
        isLoading: false
      })
    }
  },

  async loadEvents(sourceId) {
    const events = await window.lab.calendar.listEvents(sourceId)
    set({ events })
  },

  async createSource(input) {
    const source = await window.lab.calendar.createSource(input)
    await get().loadSources()
    await get().loadEvents(source.id)
    return source
  },

  async updateSource(input) {
    const source = await window.lab.calendar.updateSource(input)
    await get().loadSources()
    await get().loadEvents(source.id)
    return source
  },

  async deleteSource(id) {
    await window.lab.calendar.deleteSource(id)
    await get().loadSources()
    await get().loadEvents()
  },

  async importIcs(input) {
    const source = await window.lab.calendar.importIcs(input)
    await get().loadSources()
    await get().loadEvents(source.id)
    return source
  }
}))
