import { ipcMain } from 'electron'
import type {
  ArchetypeQuote,
  CreateArchetypeQuoteInput,
  DashboardPreferences,
  ImportArchetypeQuotesInput,
  IntegrationSettings,
  NarrativeProfile,
  QuotePreferences,
  SettingsBundle,
  ThemeSettings,
  UpdateArchetypeQuoteInput,
  UpdateDashboardPreferencesInput,
  UpdateIntegrationSettingsInput,
  UpdateQuotePreferencesInput,
  UpdateNarrativeProfileInput,
  UpdateThemeSettingsInput,
  UpdateUserProfileInput,
  UserProfile
} from '../../preload/types'
import { settingsQueries } from '../db/queries/settings'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get-bundle', async (): Promise<SettingsBundle> => settingsQueries.getBundle())
  ipcMain.handle(
    'settings:update-user-profile',
    async (_event, input: UpdateUserProfileInput): Promise<UserProfile> =>
      settingsQueries.updateUserProfile(input)
  )
  ipcMain.handle(
    'settings:update-narrative-profile',
    async (_event, input: UpdateNarrativeProfileInput): Promise<NarrativeProfile> =>
      settingsQueries.updateNarrativeProfile(input)
  )
  ipcMain.handle(
    'settings:update-dashboard-preferences',
    async (_event, input: UpdateDashboardPreferencesInput): Promise<DashboardPreferences> =>
      settingsQueries.updateDashboardPreferences(input)
  )
  ipcMain.handle(
    'settings:update-integration-settings',
    async (_event, input: UpdateIntegrationSettingsInput): Promise<IntegrationSettings> =>
      settingsQueries.updateIntegrationSettings(input)
  )
  ipcMain.handle(
    'settings:update-theme-settings',
    async (_event, input: UpdateThemeSettingsInput): Promise<ThemeSettings> =>
      settingsQueries.updateThemeSettings(input)
  )
  ipcMain.handle('settings:list-quotes', async (): Promise<ArchetypeQuote[]> => settingsQueries.listQuotes())
  ipcMain.handle(
    'settings:create-quote',
    async (_event, input: CreateArchetypeQuoteInput): Promise<ArchetypeQuote> =>
      settingsQueries.createQuote(input)
  )
  ipcMain.handle(
    'settings:update-quote',
    async (_event, input: UpdateArchetypeQuoteInput): Promise<ArchetypeQuote> =>
      settingsQueries.updateQuote(input)
  )
  ipcMain.handle('settings:delete-quote', async (_event, id: string): Promise<{ ok: boolean }> =>
    settingsQueries.deleteQuote(id)
  )
  ipcMain.handle(
    'settings:import-quotes',
    async (_event, input: ImportArchetypeQuotesInput): Promise<ArchetypeQuote[]> =>
      settingsQueries.importQuotes(input)
  )
  ipcMain.handle(
    'settings:get-quote-preferences',
    async (): Promise<QuotePreferences> => settingsQueries.getQuotePreferences()
  )
  ipcMain.handle(
    'settings:update-quote-preferences',
    async (_event, input: UpdateQuotePreferencesInput): Promise<QuotePreferences> =>
      settingsQueries.updateQuotePreferences(input)
  )
}
