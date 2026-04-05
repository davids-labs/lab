import { eq } from 'drizzle-orm'
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
} from '../../../preload/types'
import { getDb } from '../index'
import { appSettingsTable } from '../schema'

const DEFAULT_USER_PROFILE: UserProfile = {
  full_name: 'David',
  age: 21,
  location: 'Dublin, Ireland',
  current_education: "Year 1 — MAI Integrated Master's, Trinity College Dublin",
  degree_track: 'BA + MAI + MSc — targeting Columbia University Year 5 program (2029)',
  current_employment: 'Fast food (customer-facing role)',
  north_star_goal: 'Hardware Product Design Engineer at Apple, based in the United States',
  target_geography: 'United States',
  github_url: '',
  linkedin_url: '',
  portfolio_url: ''
}

const DEFAULT_NARRATIVE_PROFILE: NarrativeProfile = {
  origin_story:
    "I grew up watching the people who reviewed the world's best hardware and decided I wanted to become the person who builds it.",
  strategic_narrative:
    "I'm building toward Apple hardware product design through Trinity engineering, finished proof-of-work projects, and a Columbia pathway that opens a US work window.",
  academic_focus:
    'Foundation Scholarship, first-class trajectory, and project work that proves mechanical, embedded, and systems capability.',
  columbia_strategy:
    'Use the Trinity Year 5 / Columbia pathway as both a technical multiplier and a STEM OPT mechanism for US work.',
  apple_strategy:
    'Target input devices, peripherals, and human-interface hardware teams through portfolio proof, internships, networking, and Columbia access.',
  target_landscape_notes:
    'Primary north star is Apple. Strong adjacency targets include Logitech, Nothing, Teenage Engineering, Sonos, and embedded/hardware companies that build product credibility.',
  decision_log: []
}

const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  visible_sections: [
    'today',
    'this_week',
    'current_phase',
    'blockers',
    'pipeline',
    'proof',
    'presence',
    'library'
  ],
  pinned_actions: ['add_weekly_priority', 'add_application', 'add_countdown', 'import_document'],
  compact_mode: false,
  focus_mode_default: false,
  start_workspace: 'home',
  show_onboarding: true,
  sidebar_collapsed: false,
  sidebar_mode: 'full',
  reduced_chrome: false,
  command_palette_enabled: true,
  preferred_home_layout: 'horizons'
}

const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  github_repo_url: 'https://github.com/davids-labs/lab',
  sync_repo_url: 'https://github.com/davids-labs/labsync',
  linkedin_profile_url: '',
  default_document_directory: 'C:/Users/david/Downloads/files (3)',
  use_gh_cli: true
}

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  shell_density: 'comfortable',
  accent_color: '#1d1d1f',
  font_scale: 'md'
}

function loadSetting<T>(key: string, fallback: T): T {
  const db = getDb()
  const row = db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key)).get()

  if (!row) {
    return fallback
  }

  try {
    return { ...fallback, ...(JSON.parse(row.value_json) as Record<string, unknown>) } as T
  } catch {
    return fallback
  }
}

function saveSetting<T>(key: string, value: T): void {
  const db = getDb()
  const now = Date.now()

  db.insert(appSettingsTable)
    .values({
      key,
      value_json: JSON.stringify(value),
      updated_at: now
    })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: {
        value_json: JSON.stringify(value),
        updated_at: now
      }
    })
    .run()
}

export const settingsQueries = {
  getBundle(): SettingsBundle {
    return {
      user_profile: loadSetting('user_profile', DEFAULT_USER_PROFILE),
      narrative_profile: loadSetting('narrative_profile', DEFAULT_NARRATIVE_PROFILE),
      dashboard_preferences: loadSetting('dashboard_preferences', DEFAULT_DASHBOARD_PREFERENCES),
      integration_settings: loadSetting('integration_settings', DEFAULT_INTEGRATION_SETTINGS),
      theme_settings: loadSetting('theme_settings', DEFAULT_THEME_SETTINGS)
    }
  },

  updateUserProfile(input: UpdateUserProfileInput): UserProfile {
    const next = { ...this.getBundle().user_profile, ...input }
    saveSetting('user_profile', next)
    return next
  },

  updateNarrativeProfile(input: UpdateNarrativeProfileInput): NarrativeProfile {
    const next = { ...this.getBundle().narrative_profile, ...input }
    saveSetting('narrative_profile', next)
    return next
  },

  updateDashboardPreferences(input: UpdateDashboardPreferencesInput): DashboardPreferences {
    const current = this.getBundle().dashboard_preferences
    const next = {
      ...current,
      ...input,
      compact_mode: input.compact_mode ?? input.focus_mode_default ?? current.compact_mode,
      focus_mode_default:
        input.focus_mode_default ?? input.compact_mode ?? current.focus_mode_default,
      sidebar_collapsed:
        input.sidebar_collapsed ??
        (input.sidebar_mode ? input.sidebar_mode !== 'full' : current.sidebar_collapsed)
    }
    saveSetting('dashboard_preferences', next)
    return next
  },

  updateIntegrationSettings(input: UpdateIntegrationSettingsInput): IntegrationSettings {
    const next = { ...this.getBundle().integration_settings, ...input }
    saveSetting('integration_settings', next)
    return next
  },

  updateThemeSettings(input: UpdateThemeSettingsInput): ThemeSettings {
    const next = { ...this.getBundle().theme_settings, ...input }
    saveSetting('theme_settings', next)
    return next
  }
}
