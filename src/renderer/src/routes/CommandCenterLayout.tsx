import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { SidebarMode } from '@preload/types'
import {
  CommandPalette,
  type CommandPaletteAction
} from '@renderer/components/ui/CommandPalette'
import { Button } from '@renderer/components/ui/Button'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './CommandCenterLayout.module.css'

type ShellLink = {
  to: string
  label: string
  description: string
  symbol: string
  end?: boolean
}

type ShellSection = {
  label: string
  folders: Array<{
    label: string
    description: string
    links: ShellLink[]
  }>
}

const shellSections: ShellSection[] = [
  {
    label: 'Home',
    folders: [
      {
        label: 'Overview',
        description: 'Daily command surface and quick capture.',
        links: [
          { to: '/home', label: 'Home', description: 'Daily command surface and quick capture.', symbol: 'HM', end: true }
        ]
      }
    ]
  },
  {
    label: 'Plan',
    folders: [
      {
        label: 'Daily',
        description: 'Day and week planning.',
        links: [
          { to: '/day', label: 'Day', description: 'Morning directive and live pressure.', symbol: 'DY' },
          { to: '/week', label: 'Week', description: 'Priorities, review prefill, and evidence.', symbol: 'WK' }
        ]
      },
      {
        label: 'Planning',
        description: 'Monthly cadence and calendar inputs.',
        links: [
          { to: '/month', label: 'Month', description: 'Monthly synthesis and cleanup.', symbol: 'MO' },
          { to: '/calendar', label: 'Calendar', description: 'Imported commitments and blocks.', symbol: 'CA' }
        ]
      },
      {
        label: 'Strategy',
        description: 'Long-range direction and arc.',
        links: [
          { to: '/six-months', label: 'Six Months', description: 'Skill, proof, CV, and applications.', symbol: '6M' },
          { to: '/year-arc', label: 'Year Arc', description: 'Long-range arcs and phases.', symbol: 'YA' },
          { to: '/direction', label: 'Direction', description: 'North star and plan structure.', symbol: 'DI' }
        ]
      }
    ]
  },
  {
    label: 'Work',
    folders: [
      {
        label: 'Execution',
        description: 'Rituals and review.',
        links: [
          { to: '/execution', label: 'Execution', description: 'Daily logging, rituals, and review.', symbol: 'EX' }
        ]
      },
      {
        label: 'Proof',
        description: 'Projects and evidence.',
        links: [
          { to: '/proof', label: 'Proof', description: 'Projects, evidence, and portfolio readiness.', symbol: 'PR' },
          { to: '/proof/projects', label: 'Projects', description: 'Finished, active, and portfolio-bound projects.', symbol: 'PJ' },
          { to: '/proof/skills', label: 'Skills', description: 'Evidence-backed readiness across domains and nodes.', symbol: 'SK' }
        ]
      },
      {
        label: 'Pipeline',
        description: 'Targets and public signal.',
        links: [
          { to: '/pipeline', label: 'Pipeline', description: 'Targets, applications, and contacts.', symbol: 'PI' },
          { to: '/presence', label: 'Presence', description: 'Narrative assets and CV structure.', symbol: 'PS' }
        ]
      }
    ]
  },
  {
    label: 'Docs',
    folders: [
      {
        label: 'Documents',
        description: 'Notes and imported sources.',
        links: [
          { to: '/notes', label: 'Notes', description: 'Working documents and captured thinking.', symbol: 'NO' },
          { to: '/library', label: 'Library', description: 'Imported sources and excerpts.', symbol: 'LI' }
        ]
      },
      {
        label: 'System',
        description: 'Identity and defaults.',
        links: [
          { to: '/settings', label: 'Settings', description: 'Identity, shell, integrations, defaults.', symbol: 'SE' }
        ]
      }
    ]
  }
]

const workspaceMeta = [
  {
    matcher: (pathname: string) => pathname === '/' || pathname === '/home',
    label: 'Home',
    title: 'Overview',
    subtitle: 'Quick capture and cross-system pressure.',
    primaryAction: { label: 'Open day', to: '/day' }
  },
  {
    matcher: (pathname: string) => pathname === '/day',
    label: 'Day',
    title: 'Day',
    subtitle: 'Morning synthesis, next moves, habits, and pressure.',
    primaryAction: { label: 'Open execution', to: '/execution' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/week'),
    label: 'Week',
    title: 'Week',
    subtitle: 'Weekly review, priorities, and evidence.',
    primaryAction: { label: 'Open execution', to: '/execution' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/month'),
    label: 'Month',
    title: 'Month',
    subtitle: 'Outward signal, stale work, and source cleanup.',
    primaryAction: { label: 'Open presence', to: '/presence' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/calendar'),
    label: 'Calendar',
    title: 'Calendar',
    subtitle: 'Imported commitments and planning blocks.',
    primaryAction: { label: 'Open integrations', to: '/settings?section=integrations' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/six-months'),
    label: '6 Months',
    title: 'Six Months',
    subtitle: 'Skill, proof, CV, and application chain.',
    primaryAction: { label: 'Open pipeline', to: '/pipeline' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/year-arc'),
    label: 'Year & Arc',
    title: 'Year & Arc',
    subtitle: 'Long-range arcs, phases, and dependency pressure.',
    primaryAction: { label: 'Open direction', to: '/direction' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/direction'),
    label: 'Direction',
    title: 'Direction',
    subtitle: 'Long-range direction, phases, narrative, and dependencies.',
    primaryAction: { label: 'Open year and arc', to: '/year-arc' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/notes'),
    label: 'Notes',
    title: 'Notes',
    subtitle: 'Planning memos, meeting notes, and linked thinking docs.',
    primaryAction: { label: 'Open notes', to: '/notes' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/execution'),
    label: 'Execution',
    title: 'Execution',
    subtitle: 'Daily logging, weekly priorities, rituals, and review.',
    primaryAction: { label: 'Open week', to: '/week' }
  },
  {
    matcher: (pathname: string) => pathname === '/proof',
    label: 'Proof',
    title: 'Proof',
    subtitle: 'Projects, evidence, and public proof.',
    primaryAction: { label: 'Open projects', to: '/proof/projects' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/proof/projects'),
    label: 'Proof',
    title: 'Projects',
    subtitle: 'Finished, active, and portfolio-bound projects.',
    primaryAction: { label: 'Open six months', to: '/six-months' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/proof/skills'),
    label: 'Proof',
    title: 'Skills',
    subtitle: 'Evidence-backed readiness across domains and nodes.',
    primaryAction: { label: 'Open six months', to: '/six-months' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/pipeline'),
    label: 'Pipeline',
    title: 'Pipeline',
    subtitle: 'Targets, applications, contacts, interactions, and next steps.',
    primaryAction: { label: 'Open six months', to: '/six-months' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/presence'),
    label: 'Presence',
    title: 'Presence',
    subtitle: 'Narrative assets, CVs, profile material, and content.',
    primaryAction: { label: 'Open month', to: '/month' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/library'),
    label: 'Library',
    title: 'Library',
    subtitle: 'Imported documents, excerpts, and reviewable suggestions.',
    primaryAction: { label: 'Open month', to: '/month' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/settings'),
    label: 'Settings',
    title: 'Settings',
    subtitle: 'Identity, shell preferences, integrations, and defaults.',
    primaryAction: { label: 'Edit shell', to: '/settings' }
  }
] as const

function cycleSidebarMode(current: SidebarMode): SidebarMode {
  if (current === 'full') {
    return 'compact'
  }

  if (current === 'compact') {
    return 'hidden'
  }

  return 'full'
}

function normalizeLaunchTarget(target: string | undefined): string {
  if (!target || target === 'home') {
    return '/home'
  }

  return target.startsWith('/') ? target : `/${target}`
}

export function CommandCenterLayout(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const summary = useDashboardStore((state) => state.summary)
  const loadSummary = useDashboardStore((state) => state.loadSummary)
  const bundle = useSettingsStore((state) => state.bundle)
  const loadBundle = useSettingsStore((state) => state.loadBundle)
  const updateDashboardPreferences = useSettingsStore((state) => state.updateDashboardPreferences)
  const focusMode = useUiStore((state) => state.commandCenterFocusMode)
  const setFocusMode = useUiStore((state) => state.setCommandCenterFocusMode)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const setReducedChrome = useUiStore((state) => state.setReducedChrome)
  const preferenceSnapshotApplied = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('full')

  const isProjectRoute = location.pathname.startsWith('/project/')
  const meta = workspaceMeta.find((entry) => entry.matcher(location.pathname)) ?? workspaceMeta[0]

  useEffect(() => {
    void loadSummary()
    void loadBundle()
  }, [loadBundle, loadSummary])

  useEffect(() => {
    if (!bundle || location.pathname !== '/') {
      return
    }

    navigate(normalizeLaunchTarget(bundle.dashboard_preferences.start_workspace), {
      replace: true
    })
  }, [bundle, location.pathname, navigate])

  useEffect(() => {
    if (!bundle || preferenceSnapshotApplied.current) {
      return
    }

    preferenceSnapshotApplied.current = true
    const prefs = bundle.dashboard_preferences
    setFocusMode(prefs.focus_mode_default ?? prefs.compact_mode)
    setReducedChrome(prefs.reduced_chrome ?? false)
    setSidebarMode(prefs.sidebar_mode ?? (prefs.sidebar_collapsed ? 'compact' : 'full'))
  }, [bundle, setFocusMode, setReducedChrome])

  useEffect(() => {
    let cancelled = false

    async function syncFullscreen(): Promise<void> {
      try {
        const next = await window.lab.system.isFullscreen()
        if (!cancelled) {
          setIsFullscreen(next)
        }
      } catch {
        if (!cancelled) {
          setIsFullscreen(false)
        }
      }
    }

    void syncFullscreen()
    window.addEventListener('focus', syncFullscreen)

    return () => {
      cancelled = true
      window.removeEventListener('focus', syncFullscreen)
    }
  }, [])

  useEffect(() => {
    const enabled = bundle?.dashboard_preferences.command_palette_enabled ?? true

    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bundle?.dashboard_preferences.command_palette_enabled])

  const activePhase = summary?.active_phase
  const nextCountdown = summary?.countdowns[0]

  const commandActions = useMemo<CommandPaletteAction[]>(
    () => [
      ...shellSections.flatMap((section) =>
        section.folders.flatMap((folder) =>
          folder.links.map((link) => ({
            id: `nav-${link.to}`,
            title: link.label,
            subtitle: link.description,
            group: `${section.label} · ${folder.label}`,
            onSelect: () => navigate(link.to)
          }))
        )
      ),
      {
        id: 'quick-projects',
        title: 'Open projects',
        subtitle: 'Jump to the project ecosystem.',
        group: 'Quick actions',
        onSelect: () => navigate('/proof/projects')
      },
      {
        id: 'quick-week',
        title: 'Open week',
        subtitle: 'Go to weekly priorities, prefill, and evidence prompts.',
        group: 'Quick actions',
        onSelect: () => navigate('/week')
      },
      {
        id: 'quick-six-months',
        title: 'Open six months',
        subtitle: 'Jump to the skills-proof-CV-application chain.',
        group: 'Quick actions',
        onSelect: () => navigate('/six-months')
      },
      {
        id: 'quick-library',
        title: 'Import documents',
        subtitle: 'Go to the source library.',
        group: 'Quick actions',
        onSelect: () => navigate('/library')
      }
    ],
    [navigate]
  )

  const layoutClassName = [
    styles.layout,
    bundle?.theme_settings.shell_density === 'compact' ? styles.densityCompact : '',
    bundle?.theme_settings.font_scale === 'sm'
      ? styles.fontScaleSm
      : bundle?.theme_settings.font_scale === 'lg'
        ? styles.fontScaleLg
        : '',
    focusMode ? styles.focusMode : '',
    reducedChrome ? styles.reducedChrome : '',
    sidebarMode === 'compact' ? styles.sidebarCompact : '',
    sidebarMode === 'hidden' ? styles.sidebarHidden : '',
    isProjectRoute ? styles.projectLayout : ''
  ]
    .filter(Boolean)
    .join(' ')

  const layoutStyle = {
    '--shell-accent': bundle?.theme_settings.accent_color ?? 'var(--lab-accent)'
  } as CSSProperties

  function isLinkCurrent(link: ShellLink): boolean {
    if (link.end) {
      return location.pathname === link.to
    }

    return location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)
  }

  async function persistDashboardPrefs(
    prefs: Parameters<typeof updateDashboardPreferences>[0]
  ): Promise<void> {
    await updateDashboardPreferences(prefs)
  }

  async function handleToggleFocusMode(): Promise<void> {
    const next = !focusMode
    setFocusMode(next)
    await persistDashboardPrefs({ compact_mode: next, focus_mode_default: next })
  }

  async function handleToggleReducedChrome(): Promise<void> {
    const next = !reducedChrome
    setReducedChrome(next)
    await persistDashboardPrefs({ reduced_chrome: next })
  }

  async function handleCycleSidebar(): Promise<void> {
    const next = cycleSidebarMode(sidebarMode)
    setSidebarMode(next)
    await persistDashboardPrefs({
      sidebar_mode: next,
      sidebar_collapsed: next !== 'full'
    })
  }

  async function handleToggleFullscreen(): Promise<void> {
    const next = await window.lab.system.toggleFullscreen()
    setIsFullscreen(next)
  }

  if (isProjectRoute) {
    return (
      <div className={layoutClassName} style={layoutStyle}>
        <div className={styles.projectBody}>
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className={layoutClassName} data-reduced-chrome={reducedChrome} style={layoutStyle}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>DL</div>
          <div className={styles.brandText}>
            <strong>davids.lab</strong>
            <span>Personal operating system</span>
          </div>
        </div>

        <Button
          className={styles.searchButton}
          size="sm"
          variant="outline"
          onClick={() => setPaletteOpen(true)}
        >
          Search
        </Button>

        <div className={styles.sidebarSections}>
          {shellSections.map((section) => (
            <section key={section.label} className={styles.sidebarSection}>
              <span className={styles.sidebarSectionLabel}>{section.label}</span>
              <div className={styles.sidebarFolders}>
                {section.folders.map((folder) => (
                  <details
                    key={folder.label}
                    className={styles.sidebarFolder}
                    open={folder.links.some((link) => isLinkCurrent(link))}
                  >
                    <summary className={styles.sidebarFolderSummary}>
                      <span className={styles.sidebarFolderBody}>
                        <span className={styles.sidebarFolderLabel}>{folder.label}</span>
                        {sidebarMode === 'compact' ? null : (
                          <span className={styles.sidebarFolderDescription}>{folder.description}</span>
                        )}
                      </span>
                      <span className={styles.sidebarFolderCount}>{folder.links.length}</span>
                    </summary>
                    <div className={styles.sidebarLinks}>
                      {folder.links.map((link) => (
                        <NavLink
                          key={link.to}
                          end={link.end}
                          to={link.to}
                          className={({ isActive }) =>
                            `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
                          }
                        >
                          <span className={styles.sidebarSymbol}>{link.symbol}</span>
                          <span className={styles.sidebarLinkBody}>
                            <span className={styles.sidebarLinkLabel}>{link.label}</span>
                            {sidebarMode === 'compact' ? null : (
                              <span className={styles.sidebarLinkDescription}>{link.description}</span>
                            )}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <Button size="sm" variant="ghost" onClick={() => void handleToggleFocusMode()}>
            {focusMode ? 'Exit focus' : 'Focus mode'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void handleToggleReducedChrome()}>
            {reducedChrome ? 'Show chrome' : 'Reduce chrome'}
          </Button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.pageMeta}>
              <span className={styles.pageLabel}>{meta.label}</span>
              <strong>{meta.title}</strong>
              {!reducedChrome ? <span>{meta.subtitle}</span> : null}
            </div>
          </div>

          <div className={styles.topbarRight}>
            {!reducedChrome && activePhase ? (
              <span className={styles.utilityLabel}>Phase · {activePhase.title}</span>
            ) : null}
            {!reducedChrome && nextCountdown ? (
              <span className={styles.utilityLabel}>
                {nextCountdown.title} · {nextCountdown.days_remaining}d
              </span>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setPaletteOpen(true)}>
              Search
            </Button>
            <Button size="sm" onClick={() => navigate(meta.primaryAction.to)}>
              {meta.primaryAction.label}
            </Button>
            <details className={styles.menu}>
              <summary className={styles.menuTrigger}>View</summary>
              <div className={styles.menuPanel}>
                <Button size="sm" variant="ghost" onClick={() => void handleToggleFocusMode()}>
                  {focusMode ? 'Exit focus mode' : 'Enter focus mode'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void handleToggleReducedChrome()}>
                  {reducedChrome ? 'Show chrome' : 'Reduce chrome'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void handleCycleSidebar()}>
                  {sidebarMode === 'full'
                    ? 'Compact sidebar'
                    : sidebarMode === 'compact'
                      ? 'Hide sidebar'
                      : 'Show sidebar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void handleToggleFullscreen()}>
                  {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </Button>
              </div>
            </details>
          </div>
        </header>

        <div className={styles.body}>
          <Outlet />
        </div>
      </main>

      <CommandPalette
        actions={commandActions}
        onClose={() => setPaletteOpen(false)}
        open={paletteOpen}
      />
    </div>
  )
}
