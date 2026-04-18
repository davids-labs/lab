import { useEffect, useMemo, useState } from 'react'
import type { DashboardSummary } from '@preload/types'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/Button'
import {
  ARCHETYPE_QUOTES,
  filterQuotesByTopics,
  formatQuoteTopicLabel,
  getDailyQuoteFromPool,
  getQuoteById,
  getRandomQuoteFromPool,
  normalizeQuoteTopics,
  type ArchetypeQuote
} from '@renderer/data/archetypeQuotes'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useUiStore } from '@renderer/stores/uiStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from '@renderer/routes/CommandCenterPages.module.css'
import styles from './ArchetypeQuotePanel.module.css'

type QuoteMode = 'daily' | 'shuffle'

interface StoredQuoteState {
  currentQuoteId: string
  dateKey: string
  mode: QuoteMode
}

interface ArchetypeQuotePanelProps {
  summary: DashboardSummary
}

const STORAGE_KEY = 'davids.lab.home-archetype-quote.v2'

function getDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function readStoredState(): StoredQuoteState | null {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredQuoteState>
    if (
      typeof parsed.currentQuoteId !== 'string' ||
      typeof parsed.dateKey !== 'string' ||
      (parsed.mode !== 'daily' && parsed.mode !== 'shuffle')
    ) {
      return null
    }

    return parsed as StoredQuoteState
  } catch {
    return null
  }
}

function writeStoredState(state: StoredQuoteState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function formatQuoteForCopy(quote: ArchetypeQuote): string {
  return `"${quote.text}"\n— ${quote.author}${quote.work ? `, ${quote.work}` : ''}`
}

function getSmartTopics(summary: DashboardSummary): { topics: string[]; label: string } {
  if (summary.blocking_alerts.length > 0) {
    return {
      topics: ['resilience', 'courage'],
      label: 'Blockers are up, so the picker is leaning toward resilience and courage.'
    }
  }

  if (
    !summary.os.today ||
    summary.os.today.deep_work_minutes < 90 ||
    summary.os.habits.some((habit) => !habit.today_completed)
  ) {
    return {
      topics: ['discipline', 'self-improvement'],
      label: 'Today still needs shape, so the picker is leaning toward discipline.'
    }
  }

  if (summary.countdowns.some((countdown) => countdown.days_remaining <= 14)) {
    return {
      topics: ['courage', 'duty'],
      label: 'Deadlines are closing in, so the picker is leaning toward courage and duty.'
    }
  }

  if (summary.weekly_priorities.length === 0 || !summary.weekly_review?.focus_next) {
    return {
      topics: ['clarity', 'duty'],
      label: 'The week needs steering, so the picker is leaning toward clarity.'
    }
  }

  return {
    topics: ['clarity', 'patience'],
    label: 'The system looks steady, so the picker is leaning toward clarity and patience.'
  }
}

export function ArchetypeQuotePanel({ summary }: ArchetypeQuotePanelProps): JSX.Element {
  const navigate = useNavigate()
  const pushToast = useToastStore((state) => state.push)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const bundle = useSettingsStore((state) => state.bundle)
  const smartSignal = useMemo(() => getSmartTopics(summary), [summary])
  const quoteLibrary = bundle?.quote_library?.length ? bundle.quote_library : ARCHETYPE_QUOTES
  const quotePreferences = bundle?.quote_preferences ?? {
    smart_rotation: true,
    selected_topics: [],
    sort_mode: 'topic' as const
  }

  const effectiveTopics = useMemo(() => {
    const selectedTopics = normalizeQuoteTopics(quotePreferences.selected_topics)

    if (!quotePreferences.smart_rotation) {
      return selectedTopics
    }

    const smartTopics = normalizeQuoteTopics(smartSignal.topics)
    if (selectedTopics.length === 0) {
      return smartTopics
    }

    const overlap = selectedTopics.filter((topic) => smartTopics.includes(topic))
    return overlap.length > 0 ? overlap : selectedTopics
  }, [quotePreferences.selected_topics, quotePreferences.smart_rotation, smartSignal.topics])

  const topicKey = effectiveTopics.join('|') || 'all-topics'
  const quotePool = useMemo(
    () => filterQuotesByTopics(quoteLibrary, effectiveTopics),
    [effectiveTopics, quoteLibrary]
  )
  const [quoteState, setQuoteState] = useState<StoredQuoteState | null>(null)

  useEffect(() => {
    const dateKey = getDateKey()
    const stored = readStoredState()
    const validStoredQuote =
      stored?.dateKey === dateKey
        ? getQuoteById(quotePool, stored.currentQuoteId)
        : null

    if (validStoredQuote) {
      setQuoteState(stored)
      return
    }

    const dailyQuote = getDailyQuoteFromPool(quotePool, dateKey, topicKey)
    setQuoteState({
      currentQuoteId: dailyQuote.id,
      dateKey,
      mode: 'daily'
    })
  }, [quotePool, topicKey])

  useEffect(() => {
    if (!quoteState) {
      return
    }

    writeStoredState(quoteState)
  }, [quoteState])

  const activeQuote =
    getQuoteById(quotePool, quoteState?.currentQuoteId) ??
    getDailyQuoteFromPool(quotePool, getDateKey(), topicKey)

  function handleShuffle(): void {
    const nextQuote = getRandomQuoteFromPool(quotePool, activeQuote.id)
    setQuoteState({
      currentQuoteId: nextQuote.id,
      dateKey: getDateKey(),
      mode: 'shuffle'
    })
  }

  function handleResetToDaily(): void {
    const nextQuote = getDailyQuoteFromPool(quotePool, getDateKey(), topicKey)
    setQuoteState({
      currentQuoteId: nextQuote.id,
      dateKey: getDateKey(),
      mode: 'daily'
    })
  }

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(formatQuoteForCopy(activeQuote))
      pushToast({
        message: 'Copied the Stoic calibration quote.',
        type: 'success'
      })
    } catch {
      pushToast({
        message: 'Could not copy the quote to the clipboard.',
        type: 'error'
      })
    }
  }

  return (
    <section className={styles.panel} data-reduced-chrome={reducedChrome}>
      <div className={styles.header}>
        <div>
          <span className={styles.kicker}>Stoic Calibration</span>
          {!reducedChrome ? (
            <>
              <p className={styles.supporting}>
                Your library can now steer the Home quote by topic. Keep it smart, pin it to the
                themes you care about, or keep reloading until you find the line that hits.
              </p>
              {quotePreferences.smart_rotation ? (
                <p className={styles.supporting}>{smartSignal.label}</p>
              ) : null}
            </>
          ) : null}
        </div>
        <div className={pageStyles.chipRow}>
          <span className={pageStyles.chip}>
            {quoteState?.mode === 'shuffle' ? 'Shuffled' : 'Daily pick'}
          </span>
          <span className={pageStyles.chip}>
            {activeQuote.source_type === 'builtin' ? 'Built in' : 'Imported'}
          </span>
          {effectiveTopics.slice(0, 2).map((topic) => (
            <span key={topic} className={pageStyles.chip}>
              {formatQuoteTopicLabel(topic)}
            </span>
          ))}
        </div>
      </div>

      <blockquote className={styles.quote}>&ldquo;{activeQuote.text}&rdquo;</blockquote>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.author}>{activeQuote.author}</span>
          {!reducedChrome ? (
            <span className={styles.work}>
              {activeQuote.work ?? 'Imported into davids.lab'}
            </span>
          ) : null}
        </div>
        <div className={styles.actions}>
          <Button size="sm" onClick={handleShuffle}>
            Another one
          </Button>
          {quoteState?.mode === 'shuffle' ? (
            <Button size="sm" variant="outline" onClick={handleResetToDaily}>
              Back to daily
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => void handleCopy()}>
            Copy quote
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/settings?section=quotes')}>
            Manage library
          </Button>
        </div>
      </div>
    </section>
  )
}
