import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { useCalendarStore } from '@renderer/stores/calendarStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import pageStyles from './CommandCenterPages.module.css'
import styles from './CalendarHub.module.css'

type CalendarView = 'agenda' | 'week' | 'month'

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date)
  const day = next.getDay()
  const delta = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + delta)
  return next
}

function startOfMonth(date: Date): Date {
  const next = startOfDay(date)
  next.setDate(1)
  return next
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-IE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IE', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-IE', {
    month: 'long',
    year: 'numeric'
  })
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getVisibleMonthCells(anchor: Date): Date[] {
  const first = startOfMonth(anchor)
  const firstWeekStart = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => addDays(firstWeekStart, index))
}

export function CalendarHub(): JSX.Element {
  const navigate = useNavigate()
  const pushToast = useToastStore((state) => state.push)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const { events, loadEvents, loadSources, importIcs, syncSource, sources } = useCalendarStore()
  const [view, setView] = useState<CalendarView>('agenda')
  const [focusDate, setFocusDate] = useState<Date>(() => new Date())
  const [importLabel, setImportLabel] = useState('')

  useEffect(() => {
    void loadSources()
    void loadEvents()
  }, [loadEvents, loadSources])

  const sourcesById = useMemo(
    () => new Map(sources.map((source) => [source.id, source])),
    [sources]
  )

  const upcomingEvents = useMemo(() => {
    const now = Date.now()
    const limit = now + 1000 * 60 * 60 * 24 * 21
    return [...events]
      .filter((event) => event.starts_at >= now && event.starts_at <= limit)
      .sort((left, right) => left.starts_at - right.starts_at)
  }, [events])

  const agendaEvents = useMemo(
    () => [...upcomingEvents].slice(0, 24),
    [upcomingEvents]
  )

  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  )
  const weekEvents = useMemo(
    () =>
      [...events]
        .filter((event) => {
          const date = new Date(event.starts_at)
          const weekEnd = addDays(weekStart, 7)
          return date >= weekStart && date < weekEnd
        })
        .sort((left, right) => left.starts_at - right.starts_at),
    [events, weekStart]
  )

  const monthAnchor = useMemo(() => startOfMonth(focusDate), [focusDate])
  const monthCells = useMemo(() => getVisibleMonthCells(monthAnchor), [monthAnchor])

  async function handleImportIcs(): Promise<void> {
    const files = await window.lab.system.openFiles({
      title: 'Import calendar source',
      properties: ['openFile'],
      filters: [{ name: 'iCalendar', extensions: ['ics'] }]
    })

    if (!files[0]) {
      return
    }

    await importIcs({ file_path: files[0], label: importLabel.trim() || undefined })
    await loadEvents()
    await loadSources()
    setImportLabel('')
    pushToast({ message: 'Imported calendar source.', type: 'success' })
  }

  async function handleSyncSource(sourceId: string): Promise<void> {
    try {
      await syncSource(sourceId)
      pushToast({ message: 'Synced calendar source.', type: 'success' })
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to sync calendar source.',
        type: 'error'
      })
    }
  }

  const currentWeekEventsByDay = useMemo(() => {
    return weekDays.map((day) => ({
      day,
      events: weekEvents.filter((event) => isSameDay(new Date(event.starts_at), day))
    }))
  }, [weekDays, weekEvents])

  const monthEventsByDay = useMemo(() => {
    return new Map(
      monthCells.map((day) => [
        formatDateKey(day),
        events.filter((event) => isSameDay(new Date(event.starts_at), day))
      ])
    )
  }, [events, monthCells])

  const nextWeek = () => setFocusDate((current) => addDays(current, 7))
  const previousWeek = () => setFocusDate((current) => addDays(current, -7))
  const nextMonth = () => setFocusDate((current) => addMonths(current, 1))
  const previousMonth = () => setFocusDate((current) => addMonths(current, -1))

  return (
    <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Calendar</span>
          <h1 className={pageStyles.title}>Imported commitments and local planning blocks</h1>
          <p className={pageStyles.description}>
            Start with the real feed you already have, then grow into time blocking and planning
            actions without losing the separation between imported commitments and local intent.
          </p>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Calendar controls</h2>
              <p className={pageStyles.sectionDescription}>
                Import ICS, sync sources, and move through the calendar surface.
              </p>
            </div>
            <div className={pageStyles.inlineActions}>
              <Button variant="outline" onClick={() => navigate('/settings?section=integrations')}>
                Open settings
              </Button>
              <Button variant="outline" onClick={() => setFocusDate(new Date())}>
                Today
              </Button>
            </div>
          </div>

          <div className={styles.toolbar}>
            <InputField
              label="Import label"
              placeholder="Optional source label"
              value={importLabel}
              onChange={(event) => setImportLabel(event.target.value)}
            />
            <div className={pageStyles.inlineActions}>
              <Button onClick={() => void handleImportIcs()}>Import ICS</Button>
              <Button variant="outline" onClick={() => navigate('/settings?section=integrations')}>
                Manage integrations
              </Button>
            </div>
          </div>

          <div className={pageStyles.metricStrip}>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Sources</span>
              <div className={pageStyles.metricValue}>{sources.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Upcoming</span>
              <div className={pageStyles.metricValue}>{upcomingEvents.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>This week</span>
              <div className={pageStyles.metricValue}>{weekEvents.length}</div>
            </div>
          </div>

          <div className={styles.viewTabs}>
            {(['agenda', 'week', 'month'] as const).map((entry) => (
              <button
                key={entry}
                className={`${styles.viewTab} ${view === entry ? styles.viewTabActive : ''}`}
                onClick={() => setView(entry)}
                type="button"
              >
                {entry}
              </button>
            ))}
          </div>
        </section>

        {view === 'agenda' ? (
          <section className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Agenda</h2>
                <p className={pageStyles.sectionDescription}>
                  A compact chronological feed of the next commitments in the system.
                </p>
              </div>
            </div>
            <div className={styles.agendaList}>
              {agendaEvents.map((event) => {
                const source = sourcesById.get(event.source_id)
                const starts = new Date(event.starts_at)
                const ends = event.ends_at ? new Date(event.ends_at) : null

                return (
                  <article key={event.id} className={styles.eventCard}>
                    <div className={styles.eventCardHeader}>
                      <div>
                        <h3 className={styles.eventTitle}>{event.title}</h3>
                        <p className={styles.eventMeta}>
                          {formatDayLabel(starts)} · {formatTime(starts)}
                          {ends ? ` - ${formatTime(ends)}` : ''}
                        </p>
                      </div>
                      <span className={styles.sourcePill}>{source?.label ?? 'Calendar source'}</span>
                    </div>
                    {event.location ? <p className={styles.eventBody}>{event.location}</p> : null}
                    {event.notes ? <p className={styles.eventBody}>{event.notes}</p> : null}
                  </article>
                )
              })}
              {agendaEvents.length === 0 ? (
                <div className={pageStyles.emptyState}>
                  <strong>No upcoming events</strong>
                  <span>Import an ICS file or connect a calendar source to populate the agenda.</span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {view === 'week' ? (
          <section className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Week</h2>
                <p className={pageStyles.sectionDescription}>
                  A simple scheduling grid for the current week.
                </p>
              </div>
              <div className={pageStyles.inlineActions}>
                <Button size="sm" variant="outline" onClick={previousWeek}>
                  Previous week
                </Button>
                <Button size="sm" variant="outline" onClick={nextWeek}>
                  Next week
                </Button>
              </div>
            </div>
            <div className={styles.weekHeader}>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className={styles.weekHeaderCell}>
                  <span>{day.toLocaleDateString('en-IE', { weekday: 'short' })}</span>
                  <strong>{day.getDate()}</strong>
                </div>
              ))}
            </div>
            <div className={styles.weekGrid}>
              {currentWeekEventsByDay.map(({ day, events: dayEvents }) => (
                <div key={day.toISOString()} className={styles.weekColumn}>
                  <div className={styles.weekColumnDate}>{formatDayLabel(day)}</div>
                  <div className={styles.weekColumnBody}>
                    {dayEvents.map((event) => {
                      const starts = new Date(event.starts_at)
                      const ends = event.ends_at ? new Date(event.ends_at) : null
                      const source = sourcesById.get(event.source_id)

                      return (
                        <div key={event.id} className={styles.weekEvent}>
                          <strong>{event.title}</strong>
                          <span>
                            {formatTime(starts)}
                            {ends ? ` - ${formatTime(ends)}` : ''}
                          </span>
                          <span>{source?.label ?? 'Calendar source'}</span>
                        </div>
                      )
                    })}
                    {dayEvents.length === 0 ? (
                      <div className={styles.weekEmpty}>No events</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {view === 'month' ? (
          <section className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Month</h2>
                <p className={pageStyles.sectionDescription}>{formatMonthLabel(monthAnchor)}</p>
              </div>
              <div className={pageStyles.inlineActions}>
                <Button size="sm" variant="outline" onClick={previousMonth}>
                  Previous month
                </Button>
                <Button size="sm" variant="outline" onClick={nextMonth}>
                  Next month
                </Button>
              </div>
            </div>
            <div className={styles.monthGridHeader}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((entry) => (
                <div key={entry} className={styles.monthGridHeaderCell}>
                  {entry}
                </div>
              ))}
            </div>
            <div className={styles.monthGrid}>
              {monthCells.map((day) => {
                const dayEvents = monthEventsByDay.get(formatDateKey(day)) ?? []
                return (
                  <div
                    key={day.toISOString()}
                    className={`${styles.monthCell} ${isSameMonth(day, monthAnchor) ? '' : styles.monthCellMuted}`}
                  >
                    <div className={styles.monthCellHeader}>
                      <span>{day.getDate()}</span>
                      <span>{dayEvents.length}</span>
                    </div>
                    <div className={styles.monthCellEvents}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className={styles.monthEvent}>
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 ? (
                        <div className={styles.monthMore}>+{dayEvents.length - 3} more</div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>Sources</h2>
              <p className={pageStyles.sectionDescription}>
                Imported calendars are read feeds for now. Sync them here or manage them in Settings.
              </p>
            </div>
          </div>
          <div className={pageStyles.list}>
            {sources.map((source) => (
              <div key={source.id} className={pageStyles.row}>
                <span className={pageStyles.rowTitle}>{source.label}</span>
                <span className={pageStyles.rowMeta}>
                  {source.kind} · {source.sync_status}
                </span>
                <span className={pageStyles.rowMeta}>
                  {source.last_synced_at
                    ? `synced ${new Date(source.last_synced_at).toLocaleString('en-IE')}`
                    : 'not synced yet'}
                </span>
                <div className={pageStyles.inlineActions}>
                  {source.kind === 'ics' ? (
                    <Button size="sm" variant="outline" onClick={() => void handleSyncSource(source.id)}>
                      Sync
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => navigate('/settings?section=integrations')}>
                    Manage
                  </Button>
                </div>
              </div>
            ))}
            {sources.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <strong>No calendar sources yet</strong>
                <span>Import an ICS file or connect a Google Calendar source in Settings.</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}