import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './CommandCenterLayout.module.css'

const navItems = [
  {
    to: '/',
    label: 'Home',
    copy: 'Today, this week, and the current phase in one operating view.',
    end: true
  },
  {
    to: '/direction',
    label: 'Direction',
    copy: 'North star, roadmap, dependencies, and strategic narrative.'
  },
  {
    to: '/execution',
    label: 'Execution',
    copy: 'Daily logs, weekly priorities, rituals, and countdowns.'
  },
  {
    to: '/proof',
    label: 'Proof',
    copy: 'Projects, evidence, public case studies, and portfolio output.'
  },
  {
    to: '/pipeline',
    label: 'Pipeline',
    copy: 'Target orgs, applications, contacts, and follow-ups.'
  },
  {
    to: '/presence',
    label: 'Presence',
    copy: 'LinkedIn, CVs, recruiter assets, and content ideas.'
  },
  {
    to: '/library',
    label: 'Library',
    copy: 'Source documents, excerpts, and structured suggestions.'
  },
  {
    to: '/settings',
    label: 'Settings',
    copy: 'Identity defaults, shell behavior, and integrations.'
  }
]

const workspaceMeta = [
  {
    matcher: (pathname: string) => pathname === '/' || pathname === '/home',
    kicker: 'Home',
    title: 'LifeOS Command Surface',
    description:
      'Use this page as the calm operating layer: what matters today, what must move this week, and where the current phase is drifting.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/direction'),
    kicker: 'Direction',
    title: 'North Star and Fractal Plan',
    description:
      'Define the long-range self, keep the roadmap honest, and link phases to the proof, skills, and targets they depend on.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/execution'),
    kicker: 'Execution',
    title: 'Weekly System',
    description:
      'Run the operating week here: daily telemetry, weekly priorities, rituals, reviews, and time-bound runway counters.'
  },
  {
    matcher: (pathname: string) => pathname === '/proof',
    kicker: 'Proof',
    title: 'Capability Engine',
    description:
      'Projects and verified evidence belong here, so your work can graduate into public proof instead of staying as private effort.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/proof/projects'),
    kicker: 'Proof',
    title: 'Project Ecosystem',
    description:
      'Manage project tiers, execution stages, and the path from raw workspace output to portfolio-grade case study.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/proof/skills'),
    kicker: 'Proof',
    title: 'Evidence-Based Skill Matrix',
    description:
      'Track readiness by evidence, not self-scoring, and make skill verification reflect real shipped work.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/pipeline'),
    kicker: 'Pipeline',
    title: 'Opportunity Engine',
    description:
      'Keep organizations, applications, relationships, and next steps close enough that the career pipeline stays operational.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/presence'),
    kicker: 'Presence',
    title: 'Public Signal',
    description:
      'Turn strategy and proof into LinkedIn, CV, and narrative assets that read clearly to recruiters and hiring teams.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/library'),
    kicker: 'Library',
    title: 'Living Source Documents',
    description:
      'Import your planning docs, inspect excerpts, and decide which suggestions should become real records in the system.'
  },
  {
    matcher: (pathname: string) => pathname.startsWith('/settings'),
    kicker: 'Settings',
    title: 'Identity, Defaults, and Integrations',
    description:
      'Shape the shell, defaults, and source paths so the rest of davids.lab matches how you actually operate.'
  }
] as const

export function CommandCenterLayout(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const summary = useDashboardStore((state) => state.summary)
  const loadSummary = useDashboardStore((state) => state.loadSummary)
  const bundle = useSettingsStore((state) => state.bundle)
  const loadBundle = useSettingsStore((state) => state.loadBundle)
  const focusMode = useUiStore((state) => state.commandCenterFocusMode)
  const toggleFocusMode = useUiStore((state) => state.toggleCommandCenterFocusMode)
  const startWorkspaceApplied = useRef(false)

  useEffect(() => {
    void loadSummary()
    void loadBundle()
  }, [loadBundle, loadSummary])

  const visibleCountdowns = useMemo(() => summary?.countdowns.slice(0, 3) ?? [], [summary])
  const isProjectRoute = location.pathname.startsWith('/project/')
  const meta = workspaceMeta.find((entry) => entry.matcher(location.pathname)) ?? workspaceMeta[0]

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

  const layoutClassName = [
    styles.layout,
    bundle?.theme_settings.shell_density === 'compact' ? styles.densityCompact : '',
    bundle?.theme_settings.font_scale === 'sm'
      ? styles.fontScaleSm
      : bundle?.theme_settings.font_scale === 'lg'
        ? styles.fontScaleLg
        : '',
    focusMode ? styles.focusMode : '',
    isProjectRoute ? styles.projectLayout : ''
  ]
    .filter(Boolean)
    .join(' ')

  const layoutStyle = {
    '--shell-accent': bundle?.theme_settings.accent_color ?? 'var(--lab-primary)'
  } as CSSProperties

  const nextAction = summary?.pipeline.next_actions[0] ?? null
  const activePhase = summary?.active_phase ?? null
  const onboardingCount = summary?.onboarding.missing.length ?? 0

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
          <div className={styles.brandRow}>
            <div className={styles.brand}>
              <span className={styles.brandName}>davids.lab</span>
              <span className={styles.brandSub}>LifeOS</span>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleFocusMode}>
              {focusMode ? 'Wide' : 'Focus'}
            </Button>
          </div>
          <p className={styles.brandBlurb}>
            A local-first command center for direction, execution, proof, opportunities, and public
            signal.
          </p>
        </div>

        <nav className={styles.nav} aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navCopy}>{item.copy}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.helpCard}>
            <h2 className={styles.helpTitle}>Weekly rhythm</h2>
            <p className={styles.helpBody}>
              Use Home for orientation, Direction for phase drift, Execution for the week, Proof for
              evidence movement, Pipeline for follow-ups, and Presence for recruiter output.
            </p>
            <div className={styles.quickLinks}>
              <div className={styles.quickLinkRow}>
                <Button size="sm" variant="outline" onClick={() => navigate('/execution')}>
                  Weekly review
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/library')}>
                  Import docs
                </Button>
              </div>
              <div className={styles.quickLinkRow}>
                <Button size="sm" variant="outline" onClick={() => navigate('/proof/projects')}>
                  Open projects
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
                  Settings
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.sidebarFooterText}>
            {onboardingCount > 0
              ? `${onboardingCount} setup items still missing from the system.`
              : 'System foundations are in place. Use the week to turn strategy into evidence.'}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.contextBar}>
          <div className={styles.context}>
            <span className={styles.contextKicker}>{meta.kicker}</span>
            <h1 className={styles.contextTitle}>{meta.title}</h1>
            <p className={styles.contextBody}>{meta.description}</p>
          </div>
          <div className={styles.contextRight}>
            <div className={styles.chipRail}>
              {activePhase ? (
                <button
                  className={`${styles.chip} ${styles.accentChip}`}
                  onClick={() => navigate('/direction')}
                  type="button"
                >
                  <span>Phase</span>
                  <strong>{activePhase.title}</strong>
                </button>
              ) : null}
              {visibleCountdowns[0] ? (
                <button
                  className={styles.chip}
                  onClick={() => navigate('/execution')}
                  type="button"
                >
                  <span>{visibleCountdowns[0].category}</span>
                  <strong>{visibleCountdowns[0].title}</strong>
                  <span>{visibleCountdowns[0].days_remaining} days</span>
                </button>
              ) : null}
              {nextAction ? (
                <button className={styles.chip} onClick={() => navigate('/pipeline')} type="button">
                  <span>Pipeline</span>
                  <strong>{nextAction.title}</strong>
                </button>
              ) : null}
            </div>
            <div className={styles.contextActions}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/execution')}>
                Add weekly move
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/library')}>
                Quick import
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void window.lab.system.toggleFullscreen()}
              >
                Fullscreen
              </Button>
            </div>
          </div>
        </header>

        <div className={styles.body}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
