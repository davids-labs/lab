import { create } from 'zustand'
import type {
  CountdownItem,
  CreateCountdownInput,
  CreateOsHabitInput,
  CreateOsProfileInput,
  CreateWeeklyPriorityInput,
  OsDailyLog,
  OsHabit,
  OsHabitLog,
  OsProfile,
  OsTimeBlock,
  UpdateWeeklyPriorityInput,
  UpdateCountdownInput,
  UpdateOsHabitInput,
  UpdateOsProfileInput,
  UpsertWeeklyReviewInput,
  WeeklyPriority,
  WeeklyReview,
  UpsertOsDailyLogInput,
  UpsertOsHabitLogInput,
  UpsertOsTimeBlockInput
} from '@preload/types'

interface OsStore {
  profiles: OsProfile[]
  activeProfileId: string | null
  timeBlocks: OsTimeBlock[]
  dailyLogs: OsDailyLog[]
  currentLog: OsDailyLog | null
  habits: OsHabit[]
  countdowns: CountdownItem[]
  weeklyPriorities: WeeklyPriority[]
  weeklyReview: WeeklyReview | null
  isLoading: boolean
  error: string | null
  loadProfiles: () => Promise<void>
  setActiveProfileId: (id: string | null) => Promise<void>
  loadTimeBlocks: (profileId?: string | null) => Promise<void>
  loadDailyLogs: () => Promise<void>
  loadDailyLog: (date: string) => Promise<void>
  loadHabits: () => Promise<void>
  loadCountdowns: () => Promise<void>
  createProfile: (input: CreateOsProfileInput) => Promise<OsProfile>
  updateProfile: (input: UpdateOsProfileInput) => Promise<OsProfile>
  deleteProfile: (id: string) => Promise<void>
  upsertTimeBlock: (input: UpsertOsTimeBlockInput) => Promise<OsTimeBlock>
  deleteTimeBlock: (id: string) => Promise<void>
  upsertDailyLog: (input: UpsertOsDailyLogInput) => Promise<OsDailyLog>
  createHabit: (input: CreateOsHabitInput) => Promise<OsHabit>
  updateHabit: (input: UpdateOsHabitInput) => Promise<OsHabit>
  deleteHabit: (id: string) => Promise<void>
  upsertHabitLog: (input: UpsertOsHabitLogInput) => Promise<OsHabitLog>
  createCountdown: (input: CreateCountdownInput) => Promise<CountdownItem>
  updateCountdown: (input: UpdateCountdownInput) => Promise<CountdownItem>
  deleteCountdown: (id: string) => Promise<void>
  loadWeeklyPriorities: (weekKey?: string) => Promise<void>
  createWeeklyPriority: (input: CreateWeeklyPriorityInput) => Promise<WeeklyPriority>
  updateWeeklyPriority: (input: UpdateWeeklyPriorityInput) => Promise<WeeklyPriority>
  deleteWeeklyPriority: (id: string) => Promise<void>
  loadWeeklyReview: (weekKey: string) => Promise<void>
  upsertWeeklyReview: (input: UpsertWeeklyReviewInput) => Promise<WeeklyReview>
}

export const useOsStore = create<OsStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  timeBlocks: [],
  dailyLogs: [],
  currentLog: null,
  habits: [],
  countdowns: [],
  weeklyPriorities: [],
  weeklyReview: null,
  isLoading: false,
  error: null,

  async loadProfiles() {
    set({ isLoading: true, error: null })

    try {
      const profiles = await window.lab.os.listProfiles()
      const activeProfileId =
        get().activeProfileId && profiles.some((profile) => profile.id === get().activeProfileId)
          ? get().activeProfileId
          : (profiles.find((profile) => profile.is_default)?.id ?? profiles[0]?.id ?? null)

      set({ profiles, activeProfileId, isLoading: false })
      await get().loadTimeBlocks(activeProfileId)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load Personal OS profiles.',
        isLoading: false
      })
    }
  },

  async setActiveProfileId(id) {
    set({ activeProfileId: id })
    await get().loadTimeBlocks(id)
  },

  async loadTimeBlocks(profileId) {
    if (!profileId) {
      set({ timeBlocks: [] })
      return
    }

    const timeBlocks = await window.lab.os.listTimeBlocks(profileId)
    set({ timeBlocks })
  },

  async loadDailyLogs() {
    const dailyLogs = await window.lab.os.listDailyLogs()
    set({ dailyLogs })
  },

  async loadDailyLog(date) {
    const currentLog = await window.lab.os.getDailyLog(date)
    set({ currentLog })
  },

  async loadHabits() {
    const habits = await window.lab.os.listHabits()
    set({ habits })
  },

  async loadCountdowns() {
    const countdowns = await window.lab.os.listCountdowns()
    set({ countdowns })
  },

  async createProfile(input) {
    const profile = await window.lab.os.createProfile(input)
    await get().loadProfiles()
    return profile
  },

  async updateProfile(input) {
    const profile = await window.lab.os.updateProfile(input)
    await get().loadProfiles()
    return profile
  },

  async deleteProfile(id) {
    await window.lab.os.deleteProfile(id)
    await get().loadProfiles()
  },

  async upsertTimeBlock(input) {
    const block = await window.lab.os.upsertTimeBlock(input)
    await get().loadTimeBlocks(block.profile_id)
    return block
  },

  async deleteTimeBlock(id) {
    await window.lab.os.deleteTimeBlock(id)
    await get().loadTimeBlocks(get().activeProfileId)
  },

  async upsertDailyLog(input) {
    const log = await window.lab.os.upsertDailyLog(input)
    await get().loadDailyLogs()
    await get().loadDailyLog(log.date)
    return log
  },

  async createHabit(input) {
    const habit = await window.lab.os.createHabit(input)
    await get().loadHabits()
    return habit
  },

  async updateHabit(input) {
    const habit = await window.lab.os.updateHabit(input)
    await get().loadHabits()
    return habit
  },

  async deleteHabit(id) {
    await window.lab.os.deleteHabit(id)
    await get().loadHabits()
  },

  async upsertHabitLog(input) {
    const log = await window.lab.os.upsertHabitLog(input)
    return log
  },

  async createCountdown(input) {
    const countdown = await window.lab.os.createCountdown(input)
    await get().loadCountdowns()
    return countdown
  },

  async updateCountdown(input) {
    const countdown = await window.lab.os.updateCountdown(input)
    await get().loadCountdowns()
    return countdown
  },

  async deleteCountdown(id) {
    await window.lab.os.deleteCountdown(id)
    await get().loadCountdowns()
  },

  async loadWeeklyPriorities(weekKey) {
    const weeklyPriorities = await window.lab.os.listWeeklyPriorities(weekKey)
    set({ weeklyPriorities })
  },

  async createWeeklyPriority(input) {
    const priority = await window.lab.os.createWeeklyPriority(input)
    await get().loadWeeklyPriorities(input.week_key)
    return priority
  },

  async updateWeeklyPriority(input) {
    const priority = await window.lab.os.updateWeeklyPriority(input)
    await get().loadWeeklyPriorities(priority.week_key)
    return priority
  },

  async deleteWeeklyPriority(id) {
    await window.lab.os.deleteWeeklyPriority(id)
    await get().loadWeeklyPriorities()
  },

  async loadWeeklyReview(weekKey) {
    const weeklyReview = await window.lab.os.getWeeklyReview(weekKey)
    set({ weeklyReview })
  },

  async upsertWeeklyReview(input) {
    const weeklyReview = await window.lab.os.upsertWeeklyReview(input)
    set({ weeklyReview })
    return weeklyReview
  }
}))
