import { create } from 'zustand'
import type {
  ArchetypeQuote,
  CreateArchetypeQuoteInput,
  ImportArchetypeQuotesInput,
  QuotePreferences,
  SettingsBundle,
  UpdateArchetypeQuoteInput,
  UpdateDashboardPreferencesInput,
  UpdateIntegrationSettingsInput,
  UpdateQuotePreferencesInput,
  UpdateNarrativeProfileInput,
  UpdateThemeSettingsInput,
  UpdateUserProfileInput
} from '@preload/types'

interface SettingsStore {
  bundle: SettingsBundle | null
  isLoading: boolean
  error: string | null
  loadBundle: () => Promise<void>
  updateUserProfile: (input: UpdateUserProfileInput) => Promise<void>
  updateNarrativeProfile: (input: UpdateNarrativeProfileInput) => Promise<void>
  updateDashboardPreferences: (input: UpdateDashboardPreferencesInput) => Promise<void>
  updateIntegrationSettings: (input: UpdateIntegrationSettingsInput) => Promise<void>
  updateThemeSettings: (input: UpdateThemeSettingsInput) => Promise<void>
  createQuote: (input: CreateArchetypeQuoteInput) => Promise<ArchetypeQuote>
  updateQuote: (input: UpdateArchetypeQuoteInput) => Promise<ArchetypeQuote>
  deleteQuote: (id: string) => Promise<void>
  importQuotes: (input: ImportArchetypeQuotesInput) => Promise<ArchetypeQuote[]>
  updateQuotePreferences: (input: UpdateQuotePreferencesInput) => Promise<QuotePreferences>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  bundle: null,
  isLoading: false,
  error: null,

  async loadBundle() {
    set({ isLoading: true, error: null })

    try {
      const bundle = await window.lab.settings.getBundle()
      set({ bundle, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load settings.',
        isLoading: false
      })
    }
  },

  async updateUserProfile(input) {
    const current = get().bundle
    const user_profile = await window.lab.settings.updateUserProfile(input)
    if (current) {
      set({ bundle: { ...current, user_profile } })
    }
  },

  async updateNarrativeProfile(input) {
    const current = get().bundle
    const narrative_profile = await window.lab.settings.updateNarrativeProfile(input)
    if (current) {
      set({ bundle: { ...current, narrative_profile } })
    }
  },

  async updateDashboardPreferences(input) {
    const current = get().bundle
    const dashboard_preferences = await window.lab.settings.updateDashboardPreferences(input)
    if (current) {
      set({ bundle: { ...current, dashboard_preferences } })
    }
  },

  async updateIntegrationSettings(input) {
    const current = get().bundle
    const integration_settings = await window.lab.settings.updateIntegrationSettings(input)
    if (current) {
      set({ bundle: { ...current, integration_settings } })
    }
  },

  async updateThemeSettings(input) {
    const current = get().bundle
    const theme_settings = await window.lab.settings.updateThemeSettings(input)
    if (current) {
      set({ bundle: { ...current, theme_settings } })
    }
  },

  async createQuote(input) {
    const current = get().bundle
    const quote = await window.lab.settings.createQuote(input)
    if (current) {
      set({ bundle: { ...current, quote_library: await window.lab.settings.listQuotes() } })
    }
    return quote
  },

  async updateQuote(input) {
    const current = get().bundle
    const quote = await window.lab.settings.updateQuote(input)
    if (current) {
      set({ bundle: { ...current, quote_library: await window.lab.settings.listQuotes() } })
    }
    return quote
  },

  async deleteQuote(id) {
    const current = get().bundle
    await window.lab.settings.deleteQuote(id)
    if (current) {
      set({ bundle: { ...current, quote_library: await window.lab.settings.listQuotes() } })
    }
  },

  async importQuotes(input) {
    const current = get().bundle
    const imported = await window.lab.settings.importQuotes(input)
    if (current) {
      set({ bundle: { ...current, quote_library: await window.lab.settings.listQuotes() } })
    }
    return imported
  },

  async updateQuotePreferences(input) {
    const current = get().bundle
    const quote_preferences = await window.lab.settings.updateQuotePreferences(input)
    if (current) {
      set({ bundle: { ...current, quote_preferences, quote_library: await window.lab.settings.listQuotes() } })
    }
    return quote_preferences
  }
}))
