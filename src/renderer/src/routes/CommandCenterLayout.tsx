import { useEffect, useMemo } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useDashboardStore } from '@renderer/stores/dashboardStore'
import styles from './CommandCenterLayout.module.css'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/plan', label: 'Master Plan' },
  { to: '/os', label: 'Personal OS' },
  { to: '/ecosystem', label: 'Project Ecosystem' },
  { to: '/skills', label: 'Skill Matrix' }
]

export function CommandCenterLayout(): JSX.Element {
  const summary = useDashboardStore((state) => state.summary)
  const loadSummary = useDashboardStore((state) => state.loadSummary)

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const primaryCountdown = useMemo(() => summary?.countdowns[0] ?? null, [summary])

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={styles.brand}>
            <span className={styles.brandName}>davids.lab</span>
            <span className={styles.brandSub}>Command Center</span>
          </div>
          {primaryCountdown ? (
            <div className={styles.countdownPill}>
              <span className={styles.countdownLabel}>{primaryCountdown.category}</span>
              <strong>{primaryCountdown.title}</strong>
              <span>{primaryCountdown.days_remaining} days</span>
            </div>
          ) : null}
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
      <main className={styles.body}>
        <Outlet />
      </main>
    </div>
  )
}
