import { ipcMain } from 'electron'
import type {
  DashboardPreferences,
  IntegrationSettings,
  NarrativeProfile,
  SettingsBundle,
  ThemeSettings,
  UpdateDashboardPreferencesInput,
  UpdateIntegrationSettingsInput,
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
}
