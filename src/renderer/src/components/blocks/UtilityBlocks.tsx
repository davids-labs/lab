import { useEffect, useMemo, useState } from 'react'
import { ulid } from 'ulidx'
import type { Block, EmbedData, LinkData, NoteData, TodoData } from '@preload/types'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import styles from './BlockEditors.module.css'

interface LinkBlockProps {
  block: Block<LinkData>
}

export function LinkBlock({ block }: LinkBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <InputField
        label="URL"
        value={draft.url}
        onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
      />
      <InputField
        label="Label"
        value={draft.label}
        onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
      />
      <TextareaField
        label="Description"
        rows={4}
        value={draft.description ?? ''}
        onChange={(event) =>
          setDraft((current) => ({ ...current, description: event.target.value }))
        }
      />
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

  return (
    <div className={styles.stack}>
      <InputField
        label="Source URL"
        value={draft.url}
        onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
      />
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
          className={styles.smallButton}
        >
          <option value="generic">Generic</option>
          <option value="youtube">YouTube</option>
          <option value="pdf">PDF</option>
          <option value="figma">Figma</option>
        </select>
      </label>
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
      <TextareaField
        label="Note"
        rows={8}
        value={draft.body}
        onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
      />
      <div className={styles.pillSelect}>
        {(['yellow', 'blue', 'red', 'green'] as const).map((colour) => (
          <button
            key={colour}
            className={`${styles.pill} ${draft.colour === colour ? styles.pillActive : ''}`}
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
  const remaining = useMemo(() => draft.items.filter((item) => !item.done).length, [draft.items])

  return (
    <div className={styles.stack}>
      <div className={styles.muted}>{remaining} remaining</div>
      <div className={styles.checkboxList}>
        {draft.items.map((item, index) => (
          <label key={item.id} className={styles.checkboxRow}>
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
            <InputField
              value={item.label}
              onChange={(event) =>
                setDraft((current) => ({
                  items: current.items.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, label: event.target.value } : entry
                  )
                }))
              }
            />
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
          </label>
        ))}
      </div>
      <button
        className={styles.smallButton}
        onClick={() =>
          setDraft((current) => ({
            items: [...current.items, { id: ulid(), done: false, label: '' }]
          }))
        }
        type="button"
      >
        Add Item
      </button>
    </div>
  )
}
