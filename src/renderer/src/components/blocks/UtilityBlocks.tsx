import { useEffect, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { ulid } from 'ulidx'
import type { Block, EmbedData, LinkData, NoteData, TodoData } from '@preload/types'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import {
  ensureUrlProtocol,
  getUrlHostname,
  inferEmbedType,
  inferLinkLabel,
  toEmbedSrc
} from '@shared/content'
import styles from './BlockEditors.module.css'

interface LinkBlockProps {
  block: Block<LinkData>
}

export function LinkBlock({ block }: LinkBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const hostname = useMemo(() => getUrlHostname(draft.url), [draft.url])
  const displayLabel = draft.label || inferLinkLabel(draft.url) || 'Untitled link'

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Link card</strong>
          <div className={styles.helperText}>
            Capture a clean destination, label, and description for the public page.
          </div>
        </div>
        <button
          className={styles.smallButton}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              url: ensureUrlProtocol(current.url),
              label: current.label || inferLinkLabel(current.url)
            }))
          }
          type="button"
        >
          Normalize
        </button>
      </div>

      <InputField
        label="URL"
        placeholder="example.com/docs"
        value={draft.url}
        onBlur={() =>
          setDraft((current) => ({
            ...current,
            url: ensureUrlProtocol(current.url)
          }))
        }
        onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
      />
      <InputField
        label="Label"
        placeholder="Documentation"
        value={draft.label}
        onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
      />
      <TextareaField
        label="Description"
        placeholder="Why this link matters"
        rows={4}
        value={draft.description ?? ''}
        onChange={(event) =>
          setDraft((current) => ({ ...current, description: event.target.value }))
        }
      />

      <div className={styles.card}>
        <span className={styles.statLabel}>Preview</span>
        <strong>{displayLabel}</strong>
        <span className={styles.helperText}>{hostname || 'No valid host yet'}</span>
        {draft.description ? <span>{draft.description}</span> : null}
      </div>
    </div>
  )
}

interface EmbedBlockProps {
  block: Block<EmbedData>
}

export function EmbedBlock({ block }: EmbedBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const inferredType = useMemo(() => inferEmbedType(draft.url), [draft.url])
  const embedSrc = useMemo(
    () => toEmbedSrc(draft.type === 'generic' ? inferredType : draft.type, draft.url),
    [draft.type, draft.url, inferredType]
  )

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Embed</strong>
          <div className={styles.helperText}>
            Supports YouTube, Figma, PDFs, or generic embeddable URLs.
          </div>
        </div>
        <button
          className={styles.smallButton}
          onClick={() => setDraft((current) => ({ ...current, type: inferEmbedType(current.url) }))}
          type="button"
        >
          Auto Detect
        </button>
      </div>

      <InputField
        label="Source URL"
        placeholder="https://..."
        value={draft.url}
        onBlur={() =>
          setDraft((current) => ({
            ...current,
            url: ensureUrlProtocol(current.url)
          }))
        }
        onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
      />

      <div className={styles.row}>
        <label className={styles.stack}>
          <span className={styles.muted}>Embed Type</span>
          <select
            value={draft.type}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                type: event.target.value as EmbedData['type']
              }))
            }
            className={styles.select}
          >
            <option value="generic">Generic</option>
            <option value="youtube">YouTube</option>
            <option value="pdf">PDF</option>
            <option value="figma">Figma</option>
          </select>
        </label>

        <div className={styles.card}>
          <span className={styles.statLabel}>Detected Type</span>
          <strong>{inferredType}</strong>
          <span className={styles.helperText}>
            {embedSrc || 'Enter a URL to preview the embed.'}
          </span>
        </div>
      </div>

      {embedSrc ? (
        <iframe className={styles.previewSurface} src={embedSrc} title="Embed preview" />
      ) : (
        <div className={styles.emptyState}>Add a URL to preview the embed output.</div>
      )}
    </div>
  )
}

interface NoteBlockProps {
  block: Block<NoteData>
}

export function NoteBlock({ block }: NoteBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Workspace note</strong>
          <div className={styles.helperText}>
            Private notes stay in the editor workspace and are hidden from the public page.
          </div>
        </div>
      </div>
      <TextareaField
        label="Note"
        rows={8}
        placeholder="Capture reminders, decisions, or scratch notes here."
        value={draft.body}
        onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
      />
      <div className={styles.choiceGroup}>
        {(['yellow', 'blue', 'red', 'green'] as const).map((colour) => (
          <button
            key={colour}
            className={`${styles.choiceButton} ${draft.colour === colour ? styles.choiceActive : ''}`}
            onClick={() => setDraft((current) => ({ ...current, colour }))}
            type="button"
          >
            {colour}
          </button>
        ))}
      </div>
    </div>
  )
}

interface TodoBlockProps {
  block: Block<TodoData>
}

export function TodoBlock({ block }: TodoBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const completed = useMemo(() => draft.items.filter((item) => item.done).length, [draft.items])
  const remaining = draft.items.length - completed

  function addItem(afterIndex?: number): void {
    setDraft((current) => {
      const nextItem = { id: ulid(), done: false, label: '' }

      if (afterIndex === undefined || afterIndex < 0 || afterIndex >= current.items.length) {
        return {
          items: [...current.items, nextItem]
        }
      }

      return {
        items: [
          ...current.items.slice(0, afterIndex + 1),
          nextItem,
          ...current.items.slice(afterIndex + 1)
        ]
      }
    })
  }

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Todo list</strong>
          <div className={styles.helperText}>
            Track workspace-only tasks without publishing them to the public page.
          </div>
        </div>
        <button className={styles.smallButton} onClick={() => addItem()} type="button">
          Add Item
        </button>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Remaining</span>
          <strong className={styles.statValue}>{remaining}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Completed</span>
          <strong className={styles.statValue}>{completed}</strong>
        </div>
      </div>

      {draft.items.length > 0 ? (
        <div className={styles.checkboxList}>
          {draft.items.map((item, index) => (
            <div key={item.id} className={styles.card}>
              <label className={styles.checkboxRow}>
                <input
                  checked={item.done}
                  onChange={(event) =>
                    setDraft((current) => ({
                      items: current.items.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, done: event.target.checked } : entry
                      )
                    }))
                  }
                  type="checkbox"
                />
                <span>{item.done ? 'Done' : 'Open'}</span>
              </label>
              <InputField
                placeholder="Ship updated BOM editor"
                value={item.label}
                onChange={(event) =>
                  setDraft((current) => ({
                    items: current.items.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, label: event.target.value } : entry
                    )
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && index === draft.items.length - 1) {
                    event.preventDefault()
                    addItem(index)
                  }
                }}
              />
              <div className={styles.inlineActions}>
                <button
                  className={`${styles.smallButton} ${styles.iconButton}`}
                  disabled={index === 0}
                  onClick={() =>
                    setDraft((current) => ({
                      items: arrayMove(current.items, index, index - 1)
                    }))
                  }
                  type="button"
                >
                  Up
                </button>
                <button
                  className={`${styles.smallButton} ${styles.iconButton}`}
                  disabled={index === draft.items.length - 1}
                  onClick={() =>
                    setDraft((current) => ({
                      items: arrayMove(current.items, index, index + 1)
                    }))
                  }
                  type="button"
                >
                  Down
                </button>
                <button className={styles.smallButton} onClick={() => addItem(index)} type="button">
                  Add After
                </button>
                <button
                  className={styles.smallButton}
                  onClick={() =>
                    setDraft((current) => ({
                      items: current.items.filter((_, entryIndex) => entryIndex !== index)
                    }))
                  }
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>Add a workspace task to start tracking progress.</div>
      )}
    </div>
  )
}
