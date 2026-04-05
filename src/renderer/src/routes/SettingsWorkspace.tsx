import { useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import pageStyles from './CommandCenterPages.module.css'

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
          <section className={pageStyles.hero}>
            <span className={pageStyles.eyebrow}>Settings</span>
            <h1 className={pageStyles.title}>Settings</h1>
            <p className={pageStyles.description}>Loading configuration…</p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Settings</span>
          <h1 className={pageStyles.title}>Identity, Defaults, and Integrations</h1>
          <p className={pageStyles.description}>
            This is the control layer for who you are in the system, how the dashboard behaves, and
            where davids.lab looks for external context.
          </p>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Identity</h2>
              <span className={pageStyles.pill}>Profile defaults</span>
            </div>
            <div className={pageStyles.grid2}>
              <InputField
                label="Full Name"
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
              label="Current Education"
              defaultValue={bundle.user_profile.current_education}
              onBlur={(event) => void updateUserProfile({ current_education: event.target.value })}
            />
            <InputField
              label="North Star Goal"
              defaultValue={bundle.user_profile.north_star_goal}
              onBlur={(event) => void updateUserProfile({ north_star_goal: event.target.value })}
            />
            <InputField
              label="Portfolio URL"
              defaultValue={bundle.user_profile.portfolio_url}
              onBlur={(event) => void updateUserProfile({ portfolio_url: event.target.value })}
            />
            <div className={pageStyles.grid2}>
              <InputField
                label="GitHub URL"
                defaultValue={bundle.user_profile.github_url}
                onBlur={(event) => void updateUserProfile({ github_url: event.target.value })}
              />
              <InputField
                label="LinkedIn URL"
                defaultValue={bundle.user_profile.linkedin_url}
                onBlur={(event) => void updateUserProfile({ linkedin_url: event.target.value })}
              />
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Narrative Defaults</h2>
              <span className={pageStyles.pill}>Direction / Presence</span>
            </div>
            <TextareaField
              label="Strategic Narrative"
              rows={4}
              defaultValue={bundle.narrative_profile.strategic_narrative}
              onBlur={(event) =>
                void updateNarrativeProfile({ strategic_narrative: event.target.value })
              }
            />
            <TextareaField
              label="Apple Strategy"
              rows={4}
              defaultValue={bundle.narrative_profile.apple_strategy}
              onBlur={(event) =>
                void updateNarrativeProfile({ apple_strategy: event.target.value })
              }
            />
            <TextareaField
              label="Columbia Strategy"
              rows={4}
              defaultValue={bundle.narrative_profile.columbia_strategy}
              onBlur={(event) =>
                void updateNarrativeProfile({ columbia_strategy: event.target.value })
              }
            />
          </article>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Dashboard & Theme</h2>
              <span className={pageStyles.pill}>Shell behaviour</span>
            </div>
            <label className={pageStyles.formGrid}>
              <span className={pageStyles.eyebrow}>Start Workspace</span>
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
              <span className={pageStyles.eyebrow}>Shell Density</span>
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
              label="Accent Color"
              defaultValue={bundle.theme_settings.accent_color}
              onBlur={(event) => void updateThemeSettings({ accent_color: event.target.value })}
            />
            <label className={pageStyles.formGrid}>
              <span className={pageStyles.eyebrow}>Font Scale</span>
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
            <label className={pageStyles.inlineRow}>
              <input
                defaultChecked={bundle.dashboard_preferences.show_onboarding}
                type="checkbox"
                onChange={(event) =>
                  void updateDashboardPreferences({ show_onboarding: event.target.checked })
                }
              />
              <span className={pageStyles.muted}>Show onboarding and guidance panels</span>
            </label>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Integrations</h2>
              <span className={pageStyles.pill}>Local paths and accounts</span>
            </div>
            <InputField
              label="GitHub Repo URL"
              defaultValue={bundle.integration_settings.github_repo_url}
              onBlur={(event) =>
                void updateIntegrationSettings({ github_repo_url: event.target.value })
              }
            />
            <InputField
              label="Sync Repo URL"
              defaultValue={bundle.integration_settings.sync_repo_url}
              onBlur={(event) =>
                void updateIntegrationSettings({ sync_repo_url: event.target.value })
              }
            />
            <InputField
              label="Default Document Directory"
              value={documentDirectory}
              onChange={(event) => setDocumentDirectory(event.target.value)}
            />
            <div className={pageStyles.inlineRow}>
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
                Choose Directory
              </Button>
              <Button
                onClick={() =>
                  void updateIntegrationSettings({
                    default_document_directory: documentDirectory
                  })
                }
              >
                Save Directory
              </Button>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
