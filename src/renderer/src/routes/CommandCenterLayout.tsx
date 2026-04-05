import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
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

const navSections = [
  {
    label: 'Operate',
    items: [
      { to: '/', label: 'Home', symbol: 'HO', end: true },
      { to: '/direction', label: 'Direction', symbol: 'DI' },
      { to: '/execution', label: 'Execution', symbol: 'EX' }
    ]
  },
  {
    label: 'Build',
    items: [
      { to: '/proof', label: 'Proof', symbol: 'PR' },
      { to: '/pipeline', label: 'Pipeline', symbol: 'PI' },
      { to: '/presence', label: 'Presence', symbol: 'PS' }
    ]
  },
  {
    label: 'Source',
    items: [
      { to: '/library', label: 'Library', symbol: 'LI' },
      { to: '/settings', label: 'Settings', symbol: 'SE' }
    ]
  }
] as const

const workspaceMeta = [
  {
    matcher: (pathname: string) => pathname === '/' || pathname === '/home',
    label: 'Home',
    title: 'LifeOS',
    subtitle: 'Today, this week, current phase, and pressure points in one operating note.',
    primaryAction: { label: 'Plan the week', to: '/execution' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/direction'),
    label: 'Direction',
    title: 'North Star and Fractal Plan',
    subtitle: 'Long-range direction, phases, narrative, and linked dependencies.',
    primaryAction: { label: 'Open roadmap', to: '/direction' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/execution'),
    label: 'Execution',
    title: 'Execution System',
    subtitle: 'Daily logging, weekly priorities, rituals, schedule profiles, and review.',
    primaryAction: { label: 'Add weekly move', to: '/execution' }
  },
  {
    matcher: (pathname: string) => pathname === '/proof',
    label: 'Proof',
    title: 'Capability Engine',
    subtitle: 'Projects, evidence, and public proof.',
    primaryAction: { label: 'Open projects', to: '/proof/projects' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/proof/projects'),
    label: 'Proof',
    title: 'Project Ecosystem',
    subtitle: 'A database of finished, active, and portfolio-bound projects.',
    primaryAction: { label: 'New project', to: '/proof/projects' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/proof/skills'),
    label: 'Proof',
    title: 'Skill Matrix',
    subtitle: 'Evidence-backed readiness across domains and nodes.',
    primaryAction: { label: 'Open skills', to: '/proof/skills' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/pipeline'),
    label: 'Pipeline',
    title: 'Career Pipeline',
    subtitle: 'Targets, applications, contacts, interactions, and next steps.',
    primaryAction: { label: 'Review pipeline', to: '/pipeline' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/presence'),
    label: 'Presence',
    title: 'Public Signal',
    subtitle: 'Narrative assets, CVs, profile material, and content.',
    primaryAction: { label: 'Open assets', to: '/presence' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/library'),
    label: 'Library',
    title: 'Source Library',
    subtitle: 'Imported documents, excerpts, and reviewable suggestions.',
    primaryAction: { label: 'Import docs', to: '/library' }
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/settings'),
    label: 'Settings',
    title: 'Settings',
    subtitle: 'Identity, shell preferences, integrations, and defaults.',
    primaryAction: { label: 'Edit settings', to: '/settings' }
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
  const startWorkspaceApplied = useRef(false)
  const preferenceSnapshotApplied = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('full')
  const [reducedChrome, setReducedChrome] = useState(false)

  const isProjectRoute = location.pathname.startsWith('/project/')
  const meta = workspaceMeta.find((entry) => entry.matcher(location.pathname)) ?? workspaceMeta[0]

  useEffect(() => {
    void loadSummary()
    void loadBundle()
  }, [loadBundle, loadSummary])

  useEffect(() => {
    if (startWorkspaceApplied.current || !bundle) {
      return
    }

    startWorkspaceApplied.current = true

    const startWorkspace = bundle.dashboard_preferences.start_workspace
    if (location.pathname !== '/' || startWorkspace === 'home') {
      return
    }

    navigate(`/${startWorkspace}`, { replace: true })
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
  }, [bundle, setFocusMode])

  useEffect(() => {
    let cancelled = false

    const syncFullscreen = async (): Promise<void> => {
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
      ...navSections.flatMap((section) =>
        section.items.map((item) => ({
          id: `nav-${item.to}`,
          title: item.label,
          subtitle: `Open ${item.label}`,
          group: 'Navigate',
          onSelect: () => startTransition(() => navigate(item.to))
        }))
      ),
      {
        id: 'quick-projects',
        title: 'Open projects',
        subtitle: 'Jump to the project ecosystem.',
        group: 'Quick actions',
        onSelect: () => navigate('/proof/projects')
      },
      {
        id: 'quick-execution',
        title: 'Plan the week',
        subtitle: 'Go to weekly priorities and review.',
        group: 'Quick actions',
        onSelect: () => navigate('/execution')
      },
      {
        id: 'quick-library',
        title: 'Import documents',
        subtitle: 'Go to the source library.',
        group: 'Quick actions',
        onSelect: () => navigate('/library')
      },
      {
        id: 'quick-settings',
        title: 'Open settings',
        subtitle: 'Adjust appearance, shell, and integrations.',
        group: 'Quick actions',
        onSelect: () => navigate('/settings')
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
    <div className={layoutClassName} style={layoutStyle}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>DL</div>
          <div className={styles.brandText}>
            <strong>davids.lab</strong>
            <span>LifeOS</span>
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

        <nav className={styles.nav} aria-label="Primary navigation">
          {navSections.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <span className={styles.navSectionLabel}>{section.label}</span>
              <div className={styles.navSectionBody}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    end={item.end}
                    to={item.to}
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                    }
                  >
                    <span className={styles.navSymbol}>{item.symbol}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Button size="sm" variant="ghost" onClick={() => void handleToggleFocusMode()}>
            {focusMode ? 'Exit focus' : 'Focus mode'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/settings')}>
            Settings
          </Button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.iconButton} onClick={() => void handleCycleSidebar()} type="button">
              {sidebarMode === 'full' ? 'Sidebar' : sidebarMode === 'compact' ? 'Icons' : 'Show'}
            </button>
            <div className={styles.breadcrumbs}>
              <span>davids.lab</span>
              <span>/</span>
              <strong>{meta.label}</strong>
            </div>
            <div className={styles.pageMeta}>
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
              <summary className={styles.menuTrigger}>More</summary>
              <div className={styles.menuPanel}>
                <Button size="sm" variant="ghost" onClick={() => void handleToggleFocusMode()}>
                  {focusMode ? 'Exit focus mode' : 'Enter focus mode'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void handleToggleReducedChrome()}>
                  {reducedChrome ? 'Show more chrome' : 'Reduce chrome'}
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
