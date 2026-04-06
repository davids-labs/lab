import { create } from 'zustand'
import type {
  CreateReviewSessionInput,
  ReviewSession,
  UpdateReviewSessionInput,
  WeeklyReset
} from '@preload/types'

interface ReviewStore {
  sessions: ReviewSession[]
  weeklyReset: WeeklyReset | null
  isLoading: boolean
  error: string | null
  loadSessions: () => Promise<void>
  loadWeeklyReset: (weekKey: string) => Promise<void>
  createSession: (input: CreateReviewSessionInput) => Promise<ReviewSession>
  updateSession: (input: UpdateReviewSessionInput) => Promise<ReviewSession>
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  sessions: [],
  weeklyReset: null,
  isLoading: false,
  error: null,

  async loadSessions() {
    set({ isLoading: true, error: null })
    try {
      const sessions = await window.lab.review.listSessions()
      set({ sessions, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load review sessions.',
        isLoading: false
      })
    }
  },

  async loadWeeklyReset(weekKey) {
    const weeklyReset = await window.lab.review.getWeeklyReset(weekKey)
    set({ weeklyReset })
  },

  async createSession(input) {
    const session = await window.lab.review.createSession(input)
    await get().loadSessions()
    await get().loadWeeklyReset(input.week_key)
    return session
  },

  async updateSession(input) {
    const session = await window.lab.review.updateSession(input)
    await get().loadSessions()
    await get().loadWeeklyReset(session.week_key)
    return session
  }
}))
