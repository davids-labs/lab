import { useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import pageStyles from './CommandCenterPages.module.css'

type SettingsSection = 'profile' | 'narrative' | 'appearance' | 'shell' | 'integrations'

export function SettingsWorkspace(): JSX.Element {
  const {
    bundle,
    loadBundle,
    updateDashboardPreferences,
    updateIntegrationSettings,
    updateNarrativeProfile,
    updateThemeSettings,
    updateUserProfile
  } = useSettingsStore()
  const [documentDirectory, setDocumentDirectory] = useState('')
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

  useEffect(() => {
    void loadBundle()
  }, [loadBundle])

  useEffect(() => {
    setDocumentDirectory(bundle?.integration_settings.default_document_directory ?? '')
  }, [bundle])

  if (!bundle) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.stack}>
          <section className={pageStyles.lead}>
            <span className={pageStyles.eyebrow}>Settings</span>
            <h1 className={pageStyles.title}>Loading settings</h1>
            <p className={pageStyles.description}>Preparing the control layer…</p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Settings</span>
          <h1 className={pageStyles.title}>Identity, shell behavior, and integrations</h1>
          <p className={pageStyles.description}>
            Settings should feel like a proper control surface: one section at a time, with the
            rest of davids.lab inheriting its defaults from here.
          </p>
        </section>

        <section className={pageStyles.collectionLayout}>
          <article className={pageStyles.section}>
            <div className={pageStyles.list}>
              {([
                ['profile', 'Profile'],
                ['narrative', 'Narrative'],
                ['appearance', 'Appearance'],
                ['shell', 'Shell'],
                ['integrations', 'Integrations']
              ] as const).map(([section, label]) => (
                <button
                  key={section}
                  className={`${pageStyles.rowButton} ${activeSection === section ? pageStyles.rowActive : ''}`}
                  onClick={() => setActiveSection(section)}
                  type="button"
                >
                  <span className={pageStyles.rowTitle}>{label}</span>
                </button>
              ))}
            </div>
          </article>

          <article className={pageStyles.section}>
            {activeSection === 'profile' ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Profile</h2>
                    <p className={pageStyles.sectionDescription}>
                      Identity defaults used across Direction, Presence, and export surfaces.
                    </p>
                  </div>
                </div>
                <div className={pageStyles.propertyGrid}>
                  <InputField
                    label="Full name"
                    defaultValue={bundle.user_profile.full_name}
                    onBlur={(event) => void updateUserProfile({ full_name: event.target.value })}
                  />
                  <InputField
                    label="Location"
                    defaultValue={bundle.user_profile.location}
                    onBlur={(event) => void updateUserProfile({ location: event.target.value })}
                  />
                </div>
                <InputField
                  label="Current education"
                  defaultValue={bundle.user_profile.current_education}
                  onBlur={(event) =>
                    void updateUserProfile({ current_education: event.target.value })
                  }
                />
                <InputField
                  label="Degree track"
                  defaultValue={bundle.user_profile.degree_track}
                  onBlur={(event) => void updateUserProfile({ degree_track: event.target.value })}
                />
                <InputField
                  label="North star goal"
                  defaultValue={bundle.user_profile.north_star_goal}
                  onBlur={(event) =>
                    void updateUserProfile({ north_star_goal: event.target.value })
                  }
                />
                <div className={pageStyles.propertyGrid}>
                  <InputField
                    label="GitHub URL"
                    defaultValue={bundle.user_profile.github_url}
                    onBlur={(event) => void updateUserProfile({ github_url: event.target.value })}
                  />
                  <InputField
                    label="LinkedIn URL"
                    defaultValue={bundle.user_profile.linkedin_url}
                    onBlur={(event) =>
                      void updateUserProfile({ linkedin_url: event.target.value })
                    }
                  />
                </div>
                <InputField
                  label="Portfolio URL"
                  defaultValue={bundle.user_profile.portfolio_url}
                  onBlur={(event) => void updateUserProfile({ portfolio_url: event.target.value })}
                />
              </div>
            ) : null}

            {activeSection === 'narrative' ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Narrative defaults</h2>
                    <p className={pageStyles.sectionDescription}>
                      These fields seed Direction and Presence so you do not keep rewriting the same
                      strategic language.
                    </p>
                  </div>
                </div>
                <TextareaField
                  label="Origin story"
                  rows={4}
                  defaultValue={bundle.narrative_profile.origin_story}
                  onBlur={(event) =>
                    void updateNarrativeProfile({ origin_story: event.target.value })
                  }
                />
                <TextareaField
                  label="Strategic narrative"
                  rows={4}
                  defaultValue={bundle.narrative_profile.strategic_narrative}
                  onBlur={(event) =>
                    void updateNarrativeProfile({ strategic_narrative: event.target.value })
                  }
                />
                <TextareaField
                  label="Apple strategy"
                  rows={4}
                  defaultValue={bundle.narrative_profile.apple_strategy}
                  onBlur={(event) =>
                    void updateNarrativeProfile({ apple_strategy: event.target.value })
                  }
                />
                <TextareaField
                  label="Columbia strategy"
                  rows={4}
                  defaultValue={bundle.narrative_profile.columbia_strategy}
                  onBlur={(event) =>
                    void updateNarrativeProfile({ columbia_strategy: event.target.value })
                  }
                />
              </div>
            ) : null}

            {activeSection === 'appearance' ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Appearance</h2>
                    <p className={pageStyles.sectionDescription}>
                      Visual defaults for the shell and document density.
                    </p>
                  </div>
                </div>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Shell density</span>
                  <select
                    defaultValue={bundle.theme_settings.shell_density}
                    onChange={(event) =>
                      void updateThemeSettings({
                        shell_density: event.target.value as 'comfortable' | 'compact'
                      })
                    }
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
                <InputField
                  label="Accent color"
                  defaultValue={bundle.theme_settings.accent_color}
                  onBlur={(event) =>
                    void updateThemeSettings({ accent_color: event.target.value })
                  }
                />
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Font scale</span>
                  <select
                    defaultValue={bundle.theme_settings.font_scale}
                    onChange={(event) =>
                      void updateThemeSettings({
                        font_scale: event.target.value as 'sm' | 'md' | 'lg'
                      })
                    }
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </label>
              </div>
            ) : null}

            {activeSection === 'shell' ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Shell behavior</h2>
                    <p className={pageStyles.sectionDescription}>
                      Navigation, onboarding, focus mode, and layout defaults.
                    </p>
                  </div>
                </div>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Start workspace</span>
                  <select
                    defaultValue={bundle.dashboard_preferences.start_workspace}
                    onChange={(event) =>
                      void updateDashboardPreferences({ start_workspace: event.target.value })
                    }
                  >
                    <option value="home">Home</option>
                    <option value="direction">Direction</option>
                    <option value="execution">Execution</option>
                    <option value="proof">Proof</option>
                    <option value="pipeline">Pipeline</option>
                    <option value="presence">Presence</option>
                    <option value="library">Library</option>
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Sidebar mode</span>
                  <select
                    defaultValue={bundle.dashboard_preferences.sidebar_mode}
                    onChange={(event) =>
                      void updateDashboardPreferences({
                        sidebar_mode: event.target.value as 'full' | 'compact' | 'hidden',
                        sidebar_collapsed: event.target.value !== 'full'
                      })
                    }
                  >
                    <option value="full">Full</option>
                    <option value="compact">Compact</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Home layout</span>
                  <select
                    defaultValue={bundle.dashboard_preferences.preferred_home_layout}
                    onChange={(event) =>
                      void updateDashboardPreferences({
                        preferred_home_layout: event.target.value as 'horizons' | 'focused'
                      })
                    }
                  >
                    <option value="horizons">Three horizons</option>
                    <option value="focused">Focused</option>
                  </select>
                </label>
                <label className={pageStyles.inlineRow}>
                  <input
                    defaultChecked={
                      bundle.dashboard_preferences.focus_mode_default ??
                      bundle.dashboard_preferences.compact_mode
                    }
                    type="checkbox"
                    onChange={(event) =>
                      void updateDashboardPreferences({
                        compact_mode: event.target.checked,
                        focus_mode_default: event.target.checked
                      })
                    }
                  />
                  <span className={pageStyles.muted}>Launch in focus mode</span>
                </label>
                <label className={pageStyles.inlineRow}>
                  <input
                    defaultChecked={bundle.dashboard_preferences.reduced_chrome}
                    type="checkbox"
                    onChange={(event) =>
                      void updateDashboardPreferences({ reduced_chrome: event.target.checked })
                    }
                  />
                  <span className={pageStyles.muted}>Reduce shell chrome by default</span>
                </label>
                <label className={pageStyles.inlineRow}>
                  <input
                    defaultChecked={bundle.dashboard_preferences.command_palette_enabled}
                    type="checkbox"
                    onChange={(event) =>
                      void updateDashboardPreferences({
                        command_palette_enabled: event.target.checked
                      })
                    }
                  />
                  <span className={pageStyles.muted}>Enable command palette shortcut</span>
                </label>
                <label className={pageStyles.inlineRow}>
                  <input
                    defaultChecked={bundle.dashboard_preferences.show_onboarding}
                    type="checkbox"
                    onChange={(event) =>
                      void updateDashboardPreferences({ show_onboarding: event.target.checked })
                    }
                  />
                  <span className={pageStyles.muted}>Show onboarding and guidance callouts</span>
                </label>
              </div>
            ) : null}

            {activeSection === 'integrations' ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Integrations</h2>
                    <p className={pageStyles.sectionDescription}>
                      Local paths and account-level defaults for import and sync.
                    </p>
                  </div>
                </div>
                <InputField
                  label="GitHub repo URL"
                  defaultValue={bundle.integration_settings.github_repo_url}
                  onBlur={(event) =>
                    void updateIntegrationSettings({ github_repo_url: event.target.value })
                  }
                />
                <InputField
                  label="Sync repo URL"
                  defaultValue={bundle.integration_settings.sync_repo_url}
                  onBlur={(event) =>
                    void updateIntegrationSettings({ sync_repo_url: event.target.value })
                  }
                />
                <InputField
                  label="Default document directory"
                  value={documentDirectory}
                  onChange={(event) => setDocumentDirectory(event.target.value)}
                />
                <div className={pageStyles.inlineActions}>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const result = await window.lab.system.openFiles({
                        title: 'Choose document directory',
                        properties: ['openDirectory']
                      })
                      if (result[0]) {
                        setDocumentDirectory(result[0])
                        await updateIntegrationSettings({ default_document_directory: result[0] })
                      }
                    }}
                  >
                    Choose directory
                  </Button>
                  <Button
                    onClick={() =>
                      void updateIntegrationSettings({
                        default_document_directory: documentDirectory
                      })
                    }
                  >
                    Save directory
                  </Button>
                </div>
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </div>
  )
}
