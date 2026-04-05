import { useEffect, useMemo } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './CommandCenterLayout.module.css'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/plan', label: 'Master Plan' },
  { to: '/os', label: 'Personal OS' },
  { to: '/ecosystem', label: 'Project Ecosystem' },
  { to: '/skills', label: 'Skill Matrix' }
]

export function CommandCenterLayout(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const summary = useDashboardStore((state) => state.summary)
  const loadSummary = useDashboardStore((state) => state.loadSummary)
  const focusMode = useUiStore((state) => state.commandCenterFocusMode)
  const toggleFocusMode = useUiStore((state) => state.toggleCommandCenterFocusMode)

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const visibleCountdowns = useMemo(() => summary?.countdowns.slice(0, 3) ?? [], [summary])
  const isProjectRoute = location.pathname.startsWith('/project/')

  return (
    <div className={`${styles.layout} ${focusMode ? styles.focusMode : ''}`}>
      {!isProjectRoute ? (
        <header className={styles.header}>
          <div className={styles.topBar}>
            <div className={styles.brand}>
              <span className={styles.brandName}>davids.lab</span>
              <span className={styles.brandSub}>Command Center</span>
            </div>
            <div className={styles.topBarRight}>
              <div className={styles.countdownRail}>
                {visibleCountdowns.map((countdown) => (
                  <button
                    key={countdown.id}
                    className={styles.countdownPill}
                    onClick={() => navigate('/os')}
                    type="button"
                  >
                    <span className={styles.countdownLabel}>{countdown.category}</span>
                    <strong>{countdown.title}</strong>
                    <span>{countdown.days_remaining} days</span>
                  </button>
                ))}
              </div>
              <div className={styles.chromeActions}>
                <Button variant="ghost" size="sm" onClick={toggleFocusMode}>
                  {focusMode ? 'Exit Focus' : 'Focus'}
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
          </div>
          <nav className={styles.tabs} aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                end={item.end}
                to={item.to}
                className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
      ) : null}
      <main className={styles.body}>
        <Outlet />
      </main>
    </div>
  )
}
