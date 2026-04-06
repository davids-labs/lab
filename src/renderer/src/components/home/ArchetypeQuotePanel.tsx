import { useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/Button'
import {
  getAnotherArchetypeQuote,
  getDailyArchetypeQuote,
  getQuoteById,
  type ArchetypeQuote
} from '@renderer/data/archetypeQuotes'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from '@renderer/routes/CommandCenterPages.module.css'
import styles from './ArchetypeQuotePanel.module.css'

type QuoteMode = 'daily' | 'shuffle'

interface StoredQuoteState {
  currentQuoteId: string
  dateKey: string
  mode: QuoteMode
}

const STORAGE_KEY = 'davids.lab.home-archetype-quote.v1'

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

function getInitialQuoteState(): { mode: QuoteMode; quote: ArchetypeQuote } {
  const dateKey = getDateKey()
  const stored = readStoredState()

  if (stored?.dateKey === dateKey) {
    const storedQuote = getQuoteById(stored.currentQuoteId)
    if (storedQuote) {
      return {
        mode: stored.mode,
        quote: storedQuote
      }
    }
  }

  return {
    mode: 'daily',
    quote: getDailyArchetypeQuote(dateKey)
  }
}

function formatQuoteForCopy(quote: ArchetypeQuote): string {
  return `"${quote.text}"\n— ${quote.author}, ${quote.work}`
}

export function ArchetypeQuotePanel(): JSX.Element {
  const pushToast = useToastStore((state) => state.push)
  const [quoteState, setQuoteState] = useState(getInitialQuoteState)
  const activeQuote = quoteState.quote
  const mode = quoteState.mode

  useEffect(() => {
    const dateKey = getDateKey()
    writeStoredState({
      currentQuoteId: activeQuote.id,
      dateKey,
      mode
    })
  }, [activeQuote.id, mode])

  function handleShuffle(): void {
    const nextQuote = getAnotherArchetypeQuote(activeQuote.id)
    setQuoteState({
      mode: 'shuffle',
      quote: nextQuote
    })
  }

  function handleResetToDaily(): void {
    setQuoteState({
      mode: 'daily',
      quote: getDailyArchetypeQuote(getDateKey())
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
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span className={styles.kicker}>Stoic Calibration</span>
          <p className={styles.supporting}>
            A rotating line for discipline, patience, clarity, and duty. It defaults to a fresh
            daily quote, but you can reload until you find the one that hits.
          </p>
        </div>
        <div className={pageStyles.chipRow}>
          <span className={pageStyles.chip}>{mode === 'daily' ? 'Daily pick' : 'Shuffled'}</span>
          <span className={pageStyles.chip}>{activeQuote.theme}</span>
        </div>
      </div>

      <blockquote className={styles.quote}>&ldquo;{activeQuote.text}&rdquo;</blockquote>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.author}>{activeQuote.author}</span>
          <span className={styles.work}>{activeQuote.work}</span>
        </div>
        <div className={styles.actions}>
          <Button size="sm" onClick={handleShuffle}>
            Another one
          </Button>
          {mode === 'shuffle' ? (
            <Button size="sm" variant="outline" onClick={handleResetToDaily}>
              Back to daily
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => void handleCopy()}>
            Copy quote
          </Button>
        </div>
      </div>
    </section>
  )
}
