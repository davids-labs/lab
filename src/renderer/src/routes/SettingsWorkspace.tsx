import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { QUOTE_SORT_MODES, WATCH_FOLDER_MODES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import {
  formatQuoteTopicLabel,
  getAllQuoteTopics,
  normalizeQuoteTopics,
  parseQuoteImportJson,
  sortQuotes
} from '@renderer/data/archetypeQuotes'
import { useCalendarStore } from '@renderer/stores/calendarStore'
import { useIntegrationStore } from '@renderer/stores/integrationStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

type SettingsSection = 'profile' | 'narrative' | 'appearance' | 'shell' | 'quotes' | 'integrations'

export function SettingsWorkspace(): JSX.Element {
  const location = useLocation()
  const {
    bundle,
    loadBundle,
    updateDashboardPreferences,
    updateIntegrationSettings,
    updateNarrativeProfile,
    updateThemeSettings,
    updateUserProfile,
    createQuote,
    deleteQuote,
    importQuotes,
    updateQuotePreferences
  } = useSettingsStore()
  const { sources, loadSources, importIcs, deleteSource, syncSource } = useCalendarStore()
  const {
    accounts,
    githubCliStatus,
    watchFolders,
    syncJobs,
    loadAll: loadIntegrations,
    deleteAccount,
    syncGitHubRepos,
    connectGoogleCalendar,
    syncGoogleCalendar,
    disconnectGoogleCalendar,
    createWatchFolder,
    deleteWatchFolder,
    syncWatchFolder
  } = useIntegrationStore()
  const projects = useProjectStore((state) => state.projects)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const pushToast = useToastStore((state) => state.push)
  const [documentDirectory, setDocumentDirectory] = useState('')
  const [monitorOrgsText, setMonitorOrgsText] = useState('')
  const [monitoredReposText, setMonitoredReposText] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [calendarLabel, setCalendarLabel] = useState('')
  const [watchFolderDraft, setWatchFolderDraft] = useState({
    label: '',
    folder_path: '',
    mode: 'library_documents',
    project_id: ''
  })
  const [quoteDraft, setQuoteDraft] = useState({
    text: '',
    author: '',
    work: '',
    topics: '',
    source_url: ''
  })
  const [quoteTopicFilter, setQuoteTopicFilter] = useState<string | null>(null)

  useEffect(() => {
    void loadBundle()
    void loadSources()
    void loadIntegrations()
    void loadProjects()
  }, [loadBundle, loadIntegrations, loadProjects, loadSources])

  useEffect(() => {
    setDocumentDirectory(bundle?.integration_settings.default_document_directory ?? '')
    setMonitorOrgsText((bundle?.integration_settings.github_monitor_orgs ?? []).join(', '))
    setMonitoredReposText((bundle?.integration_settings.github_monitored_repos ?? []).join('\n'))
    setGoogleClientId(bundle?.integration_settings.google_oauth_client_id ?? '')
    setWatchFolderDraft((current) => ({
      ...current,
      label: current.label || 'Lab watch folder',
      folder_path:
        current.folder_path || bundle?.integration_settings.default_watch_folder_path || ''
    }))
  }, [bundle])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const requestedSection = searchParams.get('section')

    if (
      requestedSection === 'profile' ||
      requestedSection === 'narrative' ||
      requestedSection === 'appearance' ||
      requestedSection === 'shell' ||
      requestedSection === 'quotes' ||
      requestedSection === 'integrations'
    ) {
      setActiveSection(requestedSection)
    }
  }, [location.search])

  async function handleImportCalendar(): Promise<void> {
    const files = await window.lab.system.openFiles({
      title: 'Import ICS calendar',
      properties: ['openFile'],
      filters: [{ name: 'iCalendar', extensions: ['ics'] }]
    })

    if (!files[0]) {
      return
    }

    await importIcs({ file_path: files[0], label: calendarLabel.trim() || undefined })
    setCalendarLabel('')
    pushToast({ message: 'Imported ICS calendar.', type: 'success' })
  }

  async function handleChooseWatchFolder(): Promise<void> {
    const result = await window.lab.system.openFiles({
      title: 'Choose watch folder',
      properties: ['openDirectory']
    })

    if (result[0]) {
      setWatchFolderDraft((current) => ({ ...current, folder_path: result[0] }))
    }
  }

  async function handleCreateWatchFolder(): Promise<void> {
    if (!watchFolderDraft.label.trim() || !watchFolderDraft.folder_path.trim()) {
      return
    }

    await createWatchFolder({
      label: watchFolderDraft.label.trim(),
      folder_path: watchFolderDraft.folder_path.trim(),
      mode: watchFolderDraft.mode as (typeof WATCH_FOLDER_MODES)[number],
      project_id:
        watchFolderDraft.mode === 'project_assets' && watchFolderDraft.project_id
          ? watchFolderDraft.project_id
          : null
    })
    setWatchFolderDraft({
      label: '',
      folder_path: '',
      mode: 'library_documents',
      project_id: ''
    })
    pushToast({ message: 'Added watch folder.', type: 'success' })
  }

  async function handleSyncGitHub(): Promise<void> {
    const repoUrls = monitoredReposText
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean)

    await updateIntegrationSettings({ github_monitored_repos: repoUrls })
    await syncGitHubRepos({ repo_urls: repoUrls })
    pushToast({ message: 'GitHub repo sync completed.', type: 'success' })
  }

  async function handleConnectGoogleCalendar(): Promise<void> {
    await updateIntegrationSettings({ google_oauth_client_id: googleClientId.trim() })
    await connectGoogleCalendar(googleClientId.trim())
    void loadSources()
    pushToast({ message: 'Google Calendar connected.', type: 'success' })
  }

  async function handleSyncGoogleCalendar(): Promise<void> {
    const account = accounts.find((entry) => entry.type === 'google_calendar')
    await syncGoogleCalendar(account?.id)
    void loadSources()
    pushToast({ message: 'Google Calendar sync completed.', type: 'success' })
  }

  function parseAccountConfig(value: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }

  const googleAccount = accounts.find((entry) => entry.type === 'google_calendar') ?? null
  const githubAccount = accounts.find((entry) => entry.type === 'github') ?? null
  const googleAccountConfig = googleAccount ? parseAccountConfig(googleAccount.config_json) : {}
  const githubAccountConfig = githubAccount ? parseAccountConfig(githubAccount.config_json) : {}
  const quoteLibrary = useMemo(() => bundle?.quote_library ?? [], [bundle?.quote_library])
  const selectedQuoteTopics = useMemo(
    () => normalizeQuoteTopics(bundle?.quote_preferences.selected_topics ?? []),
    [bundle?.quote_preferences.selected_topics]
  )
  const quoteTopics = useMemo(() => getAllQuoteTopics(quoteLibrary), [quoteLibrary])
  const filteredQuoteLibrary = useMemo(() => {
    const base = quoteTopicFilter
      ? quoteLibrary.filter((quote) => quote.topics.includes(quoteTopicFilter))
      : quoteLibrary

    return sortQuotes(base, bundle?.quote_preferences.sort_mode ?? 'topic')
  }, [bundle?.quote_preferences.sort_mode, quoteLibrary, quoteTopicFilter])

  async function handleImportQuotePack(): Promise<void> {
    try {
      const files = await window.lab.system.openFiles({
        title: 'Import quote pack',
        properties: ['openFile'],
        filters: [{ name: 'Quote pack JSON', extensions: ['json'] }]
      })

      if (!files[0]) {
        return
      }

      const content = await window.lab.system.readTextFile(files[0])
      const importedRecords = parseQuoteImportJson(content).map((entry) => ({
        text: entry.text,
        author: entry.author,
        work: entry.work ?? null,
        topics: normalizeQuoteTopics(entry.topics),
        source_url: entry.source_url ?? null
      }))

      const imported = await importQuotes({ quotes: importedRecords })
      pushToast({
        message: `Imported ${imported.length} quote${imported.length === 1 ? '' : 's'}.`,
        type: 'success'
      })
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to import quotes.',
        type: 'error'
      })
    }
  }

  async function handleCreateQuote(): Promise<void> {
    try {
      if (!quoteDraft.text.trim() || !quoteDraft.author.trim()) {
        return
      }

      await createQuote({
        text: quoteDraft.text.trim(),
        author: quoteDraft.author.trim(),
        work: quoteDraft.work.trim() || null,
        topics: normalizeQuoteTopics(quoteDraft.topics),
        source_url: quoteDraft.source_url.trim() || null
      })
      setQuoteDraft({
        text: '',
        author: '',
        work: '',
        topics: '',
        source_url: ''
      })
      pushToast({ message: 'Added quote to the local library.', type: 'success' })
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to add quote.',
        type: 'error'
      })
    }
  }

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
                ['quotes', 'Quotes'],
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
                    <option value="notes">Notes</option>
                    <option value="execution">Execution</option>
                    <option value="proof">Proof</option>
                    <option value="pipeline">Pipeline</option>
                    <option value="presence">Presence</option>
                    <option value="library">Library</option>
                    <option value="settings">Settings</option>
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

            {activeSection === 'quotes' ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Quote library</h2>
                    <p className={pageStyles.sectionDescription}>
                      Build a local Stoic and philosophy shelf, tag it by topic, and let Home use
                      it intelligently instead of staying fully random.
                    </p>
                  </div>
                  <span className={pageStyles.chip}>{quoteLibrary.length} quotes</span>
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Home behavior</h3>
                      <p className={pageStyles.sectionDescription}>
                        Smart mode leans toward discipline, courage, or clarity depending on what
                        the operating layer is telling you that day.
                      </p>
                    </div>
                  </div>
                  <label className={pageStyles.inlineRow}>
                    <input
                      checked={bundle.quote_preferences.smart_rotation}
                      type="checkbox"
                      onChange={(event) =>
                        void updateQuotePreferences({
                          smart_rotation: event.target.checked
                        })
                      }
                    />
                    <span className={pageStyles.muted}>Use smart topic steering on Home</span>
                  </label>
                  <label className={pageStyles.formGrid}>
                    <span className={pageStyles.eyebrow}>Library sort</span>
                    <select
                      value={bundle.quote_preferences.sort_mode}
                      onChange={(event) =>
                        void updateQuotePreferences({
                          sort_mode: event.target.value as (typeof QUOTE_SORT_MODES)[number]
                        })
                      }
                    >
                      <option value="topic">Topic</option>
                      <option value="author">Author</option>
                      <option value="recent">Recent</option>
                    </select>
                  </label>
                  <div className={pageStyles.document}>
                    <div className={pageStyles.sectionHeader}>
                      <div>
                        <h3 className={pageStyles.sectionTitle}>Topic focus</h3>
                        <p className={pageStyles.sectionDescription}>
                          Leave this empty to let smart mode roam freely, or narrow the library to
                          the topics you care about most.
                        </p>
                      </div>
                    </div>
                    <div className={pageStyles.chipRow}>
                      <button
                        className={`${pageStyles.tab} ${
                          selectedQuoteTopics.length === 0 ? pageStyles.tabActive : ''
                        }`}
                        onClick={() => void updateQuotePreferences({ selected_topics: [] })}
                        type="button"
                      >
                        All topics
                      </button>
                      {quoteTopics.map((topic) => {
                        const isActive = selectedQuoteTopics.includes(topic)
                        const nextTopics = isActive
                          ? selectedQuoteTopics.filter((entry) => entry !== topic)
                          : [...selectedQuoteTopics, topic]

                        return (
                          <button
                            key={topic}
                            className={`${pageStyles.tab} ${isActive ? pageStyles.tabActive : ''}`}
                            onClick={() =>
                              void updateQuotePreferences({ selected_topics: nextTopics })
                            }
                            type="button"
                          >
                            {formatQuoteTopicLabel(topic)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Import or add quotes</h3>
                      <p className={pageStyles.sectionDescription}>
                        Import a JSON quote pack or add one-off lines manually. JSON supports
                        arrays of objects with `text`, `author`, `work`, `topics`, and
                        `source_url`.
                      </p>
                    </div>
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <Button variant="outline" onClick={() => void handleImportQuotePack()}>
                      Import JSON pack
                    </Button>
                  </div>
                  <TextareaField
                    label="Quote text"
                    rows={4}
                    value={quoteDraft.text}
                    onChange={(event) =>
                      setQuoteDraft((current) => ({ ...current, text: event.target.value }))
                    }
                  />
                  <div className={pageStyles.propertyGrid}>
                    <InputField
                      label="Author"
                      value={quoteDraft.author}
                      onChange={(event) =>
                        setQuoteDraft((current) => ({ ...current, author: event.target.value }))
                      }
                    />
                    <InputField
                      label="Work"
                      value={quoteDraft.work}
                      onChange={(event) =>
                        setQuoteDraft((current) => ({ ...current, work: event.target.value }))
                      }
                    />
                  </div>
                  <div className={pageStyles.propertyGrid}>
                    <InputField
                      label="Topics"
                      placeholder="discipline, courage, clarity"
                      value={quoteDraft.topics}
                      onChange={(event) =>
                        setQuoteDraft((current) => ({ ...current, topics: event.target.value }))
                      }
                    />
                    <InputField
                      label="Source URL"
                      value={quoteDraft.source_url}
                      onChange={(event) =>
                        setQuoteDraft((current) => ({
                          ...current,
                          source_url: event.target.value
                        }))
                      }
                    />
                  </div>
                  <Button onClick={() => void handleCreateQuote()}>Add quote</Button>
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Library</h3>
                      <p className={pageStyles.sectionDescription}>
                        Browse by topic, keep the built-ins, and prune imported entries when they
                        stop being useful.
                      </p>
                    </div>
                  </div>
                  <div className={pageStyles.chipRow}>
                    <button
                      className={`${pageStyles.tab} ${
                        quoteTopicFilter === null ? pageStyles.tabActive : ''
                      }`}
                      onClick={() => setQuoteTopicFilter(null)}
                      type="button"
                    >
                      All
                    </button>
                    {quoteTopics.map((topic) => (
                      <button
                        key={topic}
                        className={`${pageStyles.tab} ${
                          quoteTopicFilter === topic ? pageStyles.tabActive : ''
                        }`}
                        onClick={() => setQuoteTopicFilter(topic)}
                        type="button"
                      >
                        {formatQuoteTopicLabel(topic)}
                      </button>
                    ))}
                  </div>
                  <div className={pageStyles.list}>
                    {filteredQuoteLibrary.map((quote) => (
                      <div key={quote.id} className={pageStyles.row}>
                        <span className={pageStyles.rowTitle}>{quote.author}</span>
                        <span className={pageStyles.rowBody}>{quote.text}</span>
                        <span className={pageStyles.rowMeta}>
                          {quote.work ?? 'No work specified'} ·{' '}
                          {quote.source_type === 'builtin' ? 'Built in' : 'Imported'}
                        </span>
                        <div className={pageStyles.chipRow}>
                          {quote.topics.map((topic) => (
                            <span key={`${quote.id}-${topic}`} className={pageStyles.chip}>
                              {formatQuoteTopicLabel(topic)}
                            </span>
                          ))}
                        </div>
                        {quote.source_type === 'custom' ? (
                          <div className={pageStyles.inlineActions}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                void deleteQuote(quote.id).then(() =>
                                  pushToast({
                                    message: 'Removed imported quote.',
                                    type: 'success'
                                  })
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {filteredQuoteLibrary.length === 0 ? (
                      <div className={pageStyles.emptyState}>
                        <strong>No quotes in this slice</strong>
                        <span>Change the topic filter or import a pack to widen the library.</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === 'integrations' ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Integrations</h2>
                    <p className={pageStyles.sectionDescription}>
                      Local paths, watched folders, portable calendar import, and lightweight
                      connected accounts. External systems should enrich the local database, not
                      replace it.
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
                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>GitHub manual sync</h3>
                      <p className={pageStyles.sectionDescription}>
                        Pull repo metadata through the signed-in `gh` CLI and turn it into local
                        proof/capture context.
                      </p>
                    </div>
                    <span className={pageStyles.chip}>
                      {githubCliStatus?.authenticated
                        ? `gh ready${githubCliStatus.login ? ` · ${githubCliStatus.login}` : ''}`
                        : 'gh not signed in'}
                    </span>
                  </div>
                  <TextareaField
                    label="Monitored repo URLs"
                    rows={5}
                    value={monitoredReposText}
                    onChange={(event) => setMonitoredReposText(event.target.value)}
                    onBlur={() =>
                      void updateIntegrationSettings({
                        github_monitored_repos: monitoredReposText
                          .split(/\r?\n|,/)
                          .map((value) => value.trim())
                          .filter(Boolean)
                      })
                    }
                  />
                  <InputField
                    label="GitHub monitor orgs"
                    value={monitorOrgsText}
                    onChange={(event) => setMonitorOrgsText(event.target.value)}
                    onBlur={() =>
                      void updateIntegrationSettings({
                        github_monitor_orgs: monitorOrgsText
                          .split(',')
                          .map((value) => value.trim())
                          .filter(Boolean)
                      })
                    }
                  />
                  <div className={pageStyles.inlineActions}>
                    <Button
                      variant="outline"
                      onClick={() =>
                        void updateIntegrationSettings({
                          github_monitored_repos: monitoredReposText
                            .split(/\r?\n|,/)
                            .map((value) => value.trim())
                            .filter(Boolean)
                        })
                      }
                    >
                      Save repo list
                    </Button>
                    <Button onClick={() => void handleSyncGitHub()}>Sync GitHub now</Button>
                  </div>
                  {githubAccountConfig?.last_synced_at ? (
                    <p className={pageStyles.muted}>
                      Last GitHub sync:{' '}
                      {new Date(Number(githubAccountConfig.last_synced_at)).toLocaleString('en-IE')}
                    </p>
                  ) : null}
                  {githubAccountConfig?.last_error ? (
                    <p className={pageStyles.muted}>{String(githubAccountConfig.last_error)}</p>
                  ) : null}
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Google Calendar</h3>
                      <p className={pageStyles.sectionDescription}>
                        Connect once with OAuth, then manually pull upcoming calendar pressure into
                        Execution whenever you want.
                      </p>
                    </div>
                    <span className={pageStyles.chip}>
                      {googleAccount ? 'connected' : 'not connected'}
                    </span>
                  </div>
                  <div className={pageStyles.propertyGrid}>
                    <InputField
                      label="OAuth client ID"
                      value={googleClientId}
                      onChange={(event) => setGoogleClientId(event.target.value)}
                      onBlur={() =>
                        void updateIntegrationSettings({
                          google_oauth_client_id: googleClientId.trim()
                        })
                      }
                    />
                    <InputField
                      label="Calendar email"
                      defaultValue={bundle.integration_settings.google_calendar_email}
                      onBlur={(event) =>
                        void updateIntegrationSettings({
                          google_calendar_email: event.target.value.trim()
                        })
                      }
                    />
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <Button variant="outline" onClick={() => void handleConnectGoogleCalendar()}>
                      {googleAccount ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
                    </Button>
                    <Button
                      disabled={!googleAccount}
                      onClick={() => void handleSyncGoogleCalendar()}
                    >
                      Sync Google now
                    </Button>
                    {googleAccount ? (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          void disconnectGoogleCalendar(googleAccount.id).then(() => {
                            void loadSources()
                            pushToast({ message: 'Google Calendar disconnected.', type: 'success' })
                          })
                        }
                      >
                        Disconnect
                      </Button>
                    ) : null}
                  </div>
                  {googleAccountConfig?.email ? (
                    <p className={pageStyles.muted}>Connected as {String(googleAccountConfig.email)}</p>
                  ) : null}
                  {googleAccountConfig?.last_synced_at ? (
                    <p className={pageStyles.muted}>
                      Last Google sync:{' '}
                      {new Date(Number(googleAccountConfig.last_synced_at)).toLocaleString('en-IE')}
                    </p>
                  ) : null}
                  {googleAccountConfig?.last_error ? (
                    <p className={pageStyles.muted}>{String(googleAccountConfig.last_error)}</p>
                  ) : null}
                </div>

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
                <InputField
                  label="Default watch folder path"
                  value={watchFolderDraft.folder_path}
                  onChange={(event) =>
                    setWatchFolderDraft((current) => ({
                      ...current,
                      folder_path: event.target.value
                    }))
                  }
                  onBlur={() =>
                    void updateIntegrationSettings({
                      default_watch_folder_path: watchFolderDraft.folder_path.trim()
                    })
                  }
                />
                <div className={pageStyles.inlineActions}>
                  <Button variant="outline" onClick={() => void handleChooseWatchFolder()}>
                    Choose watch folder
                  </Button>
                  <Button
                    onClick={() =>
                      void updateIntegrationSettings({
                        default_watch_folder_path: watchFolderDraft.folder_path.trim()
                      })
                    }
                  >
                    Save watch folder default
                  </Button>
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Calendar sources</h3>
                      <p className={pageStyles.sectionDescription}>
                        Bring time commitments into Execution with portable ICS imports and the
                        connected Google calendar source.
                      </p>
                    </div>
                    <span className={pageStyles.chip}>{sources.length}</span>
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <InputField
                      placeholder="Optional label override"
                      value={calendarLabel}
                      onChange={(event) => setCalendarLabel(event.target.value)}
                    />
                    <Button onClick={() => void handleImportCalendar()}>Import ICS</Button>
                  </div>
                  <div className={pageStyles.list}>
                    {sources.map((source) => (
                      <div key={source.id} className={pageStyles.row}>
                        <span className={pageStyles.rowTitle}>{source.label}</span>
                        <span className={pageStyles.rowMeta}>
                          {source.kind} · {source.sync_status}
                          {source.last_synced_at
                            ? ` · synced ${new Date(source.last_synced_at).toLocaleDateString('en-IE')}`
                            : ''}
                        </span>
                        {source.last_error ? (
                          <span className={pageStyles.rowMeta}>{source.last_error}</span>
                        ) : null}
                        <div className={pageStyles.inlineActions}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void (source.kind === 'google'
                                ? handleSyncGoogleCalendar()
                                : syncSource(source.id)
                              ).then(() =>
                                pushToast({ message: 'Calendar source synced.', type: 'success' })
                              )
                            }
                          >
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void deleteSource(source.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {sources.length === 0 ? (
                      <div className={pageStyles.emptyState}>
                        <strong>No calendar sources yet</strong>
                        <span>Import an `.ics` file so schedule pressure appears in Execution.</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Connected accounts</h3>
                      <p className={pageStyles.sectionDescription}>
                        Integration accounts stay lightweight. Secrets live in secure storage, and
                        the visible account record just tracks labels, sync state, and non-sensitive
                        metadata.
                      </p>
                    </div>
                    <span className={pageStyles.chip}>{accounts.length}</span>
                  </div>
                  <div className={pageStyles.list}>
                    {accounts.map((account) => (
                      <div key={account.id} className={pageStyles.row}>
                        <span className={pageStyles.rowTitle}>{account.label}</span>
                        <span className={pageStyles.rowMeta}>{account.type.replace(/_/g, ' ')}</span>
                        <span className={pageStyles.rowMeta}>
                          {account.type === 'github'
                            ? `Manual repo sync${githubCliStatus?.login ? ` via ${githubCliStatus.login}` : ''}`
                            : account.type === 'google_calendar'
                              ? `Calendar source ${
                                  String(parseAccountConfig(account.config_json).calendar_id ?? 'primary')
                                }`
                              : 'Manual folder ingestion'}
                        </span>
                        <div className={pageStyles.inlineActions}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void deleteAccount(account.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {accounts.length === 0 ? (
                      <div className={pageStyles.emptyState}>
                        <strong>No integration accounts yet</strong>
                        <span>Add them only when you actually want connected enrichment.</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Watch folders</h3>
                      <p className={pageStyles.sectionDescription}>
                        Let davids.lab ingest docs into Library or assets into a specific project
                        from a local folder on demand.
                      </p>
                    </div>
                    <span className={pageStyles.chip}>{watchFolders.length}</span>
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <InputField
                      placeholder="Watch folder label"
                      value={watchFolderDraft.label}
                      onChange={(event) =>
                        setWatchFolderDraft((current) => ({
                          ...current,
                          label: event.target.value
                        }))
                      }
                    />
                    <InputField
                      placeholder="Folder path"
                      value={watchFolderDraft.folder_path}
                      onChange={(event) =>
                        setWatchFolderDraft((current) => ({
                          ...current,
                          folder_path: event.target.value
                        }))
                      }
                    />
                    <Button variant="outline" onClick={() => void handleChooseWatchFolder()}>
                      Choose folder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setWatchFolderDraft((current) => ({
                          ...current,
                          label: current.label || 'Lab watch folder',
                          folder_path:
                            bundle.integration_settings.default_watch_folder_path ||
                            current.folder_path
                        }))
                      }
                    >
                      Use default path
                    </Button>
                  </div>
                  <div className={pageStyles.propertyGrid}>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Mode</span>
                      <select
                        value={watchFolderDraft.mode}
                        onChange={(event) =>
                          setWatchFolderDraft((current) => ({
                            ...current,
                            mode: event.target.value
                          }))
                        }
                      >
                        {WATCH_FOLDER_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Project</span>
                      <select
                        disabled={watchFolderDraft.mode !== 'project_assets'}
                        value={watchFolderDraft.project_id}
                        onChange={(event) =>
                          setWatchFolderDraft((current) => ({
                            ...current,
                            project_id: event.target.value
                          }))
                        }
                      >
                        <option value="">No project selected</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Button onClick={() => void handleCreateWatchFolder()}>Add watch folder</Button>
                  <div className={pageStyles.list}>
                    {watchFolders.map((folder) => (
                      <div key={folder.id} className={pageStyles.row}>
                        <span className={pageStyles.rowTitle}>{folder.label}</span>
                        <span className={pageStyles.rowMeta}>
                          {folder.mode.replace(/_/g, ' ')} · {folder.enabled ? 'enabled' : 'disabled'}
                        </span>
                        <span className={pageStyles.rowMeta}>{folder.folder_path}</span>
                        <div className={pageStyles.inlineActions}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void syncWatchFolder(folder.id).then(() =>
                                pushToast({ message: 'Watch folder sync complete.', type: 'success' })
                              )
                            }
                          >
                            Sync now
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void deleteWatchFolder(folder.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {watchFolders.length === 0 ? (
                      <div className={pageStyles.emptyState}>
                        <strong>No watch folders yet</strong>
                        <span>Use them when you want Library or project assets to ingest from disk.</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Recent sync jobs</h3>
                      <p className={pageStyles.sectionDescription}>
                        Quick visibility into what imported cleanly and what needs attention.
                      </p>
                    </div>
                    <span className={pageStyles.chip}>{syncJobs.length}</span>
                  </div>
                  <div className={pageStyles.list}>
                    {syncJobs.slice(0, 6).map((job) => (
                      <div key={job.id} className={pageStyles.row}>
                        <span className={pageStyles.rowTitle}>{job.label}</span>
                        <span className={pageStyles.rowMeta}>
                          {job.integration_type.replace(/_/g, ' ')} · {job.status}
                        </span>
                        <span className={pageStyles.rowMeta}>{job.summary ?? 'No summary'}</span>
                      </div>
                    ))}
                    {syncJobs.length === 0 ? (
                      <div className={pageStyles.emptyState}>
                        <strong>No sync jobs yet</strong>
                        <span>Once watch folders run, their results will appear here.</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </div>
  )
}
