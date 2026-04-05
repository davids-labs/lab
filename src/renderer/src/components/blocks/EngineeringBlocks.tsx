import { useEffect, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { ulid } from 'ulidx'
import type { Block, FailedIterationData, GCodeData, PinoutData } from '@preload/types'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import styles from './BlockEditors.module.css'

function createPin(): PinoutData['pins'][number] {
  return {
    id: ulid(),
    pin: '',
    label: '',
    function: '',
    voltage: '',
    notes: ''
  }
}

interface PinoutBlockProps {
  block: Block<PinoutData>
}

export function PinoutBlock({ block }: PinoutBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const populatedPins = useMemo(
    () =>
      draft.pins.filter((pin) => pin.pin || pin.label || pin.function || pin.voltage || pin.notes)
        .length,
    [draft.pins]
  )

  function addPin(afterIndex?: number): void {
    setDraft((current) => {
      const nextPin = createPin()

      if (afterIndex === undefined || afterIndex < 0 || afterIndex >= current.pins.length) {
        return {
          ...current,
          pins: [...current.pins, nextPin]
        }
      }

      return {
        ...current,
        pins: [
          ...current.pins.slice(0, afterIndex + 1),
          nextPin,
          ...current.pins.slice(afterIndex + 1)
        ]
      }
    })
  }

  function updatePin(index: number, field: keyof PinoutData['pins'][number], value: string): void {
    setDraft((current) => ({
      ...current,
      pins: current.pins.map((pin, pinIndex) =>
        pinIndex === index ? { ...pin, [field]: value } : pin
      )
    }))
  }

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Pinout diagram</strong>
          <div className={styles.helperText}>
            Capture pin names, functions, voltage rails, and wiring notes in a structured table.
          </div>
        </div>
        <div className={styles.inlineActions}>
          <div className={styles.choiceGroup}>
            {(['vertical', 'two_column'] as const).map((layout) => (
              <button
                key={layout}
                className={`${styles.choiceButton} ${draft.layout === layout ? styles.choiceActive : ''}`}
                onClick={() => setDraft((current) => ({ ...current, layout }))}
                type="button"
              >
                {layout === 'vertical' ? 'Single Column' : 'Two Column'}
              </button>
            ))}
          </div>
          <button className={styles.smallButton} onClick={() => addPin()} type="button">
            Add Pin
          </button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pins</span>
          <strong className={styles.statValue}>{draft.pins.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Populated</span>
          <strong className={styles.statValue}>{populatedPins}</strong>
        </div>
      </div>

      {draft.pins.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pin</th>
                <th>Label</th>
                <th>Function</th>
                <th>Voltage</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {draft.pins.map((pin, index) => (
                <tr key={pin.id}>
                  <td>
                    <InputField
                      placeholder="1"
                      value={pin.pin}
                      onChange={(event) => updatePin(index, 'pin', event.target.value)}
                    />
                  </td>
                  <td>
                    <InputField
                      placeholder="VIN"
                      value={pin.label}
                      onChange={(event) => updatePin(index, 'label', event.target.value)}
                    />
                  </td>
                  <td>
                    <InputField
                      placeholder="Power input"
                      value={pin.function}
                      onChange={(event) => updatePin(index, 'function', event.target.value)}
                    />
                  </td>
                  <td>
                    <InputField
                      placeholder="5V"
                      value={pin.voltage ?? ''}
                      onChange={(event) => updatePin(index, 'voltage', event.target.value)}
                    />
                  </td>
                  <td>
                    <InputField
                      placeholder="Shared ground with sensor board"
                      value={pin.notes ?? ''}
                      onChange={(event) => updatePin(index, 'notes', event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && index === draft.pins.length - 1) {
                          event.preventDefault()
                          addPin(index)
                        }
                      }}
                    />
                  </td>
                  <td>
                    <div className={styles.inlineActions}>
                      <button
                        className={`${styles.smallButton} ${styles.iconButton}`}
                        disabled={index === 0}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            pins: arrayMove(current.pins, index, index - 1)
                          }))
                        }
                        type="button"
                      >
                        Up
                      </button>
                      <button
                        className={`${styles.smallButton} ${styles.iconButton}`}
                        disabled={index === draft.pins.length - 1}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            pins: arrayMove(current.pins, index, index + 1)
                          }))
                        }
                        type="button"
                      >
                        Down
                      </button>
                      <button
                        className={styles.smallButton}
                        onClick={() => addPin(index)}
                        type="button"
                      >
                        Add
                      </button>
                      <button
                        className={styles.smallButton}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            pins: current.pins.filter((_, pinIndex) => pinIndex !== index)
                          }))
                        }
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          Add pins for connectors, headers, or board interfaces to document the electrical map.
        </div>
      )}
    </div>
  )
}

interface GCodeBlockProps {
  block: Block<GCodeData>
}

export function GCodeBlock({ block }: GCodeBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  const lineCount = useMemo(
    () => draft.code.split(/\r?\n/).filter((line) => line.trim().length > 0).length,
    [draft.code]
  )

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>G-code snippet</strong>
          <div className={styles.helperText}>
            Store machine-ready commands alongside notes for feeds, fixtures, or test cuts.
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <InputField
          label="Machine / Controller"
          placeholder="ShopBot PRSalpha"
          value={draft.machine ?? ''}
          onChange={(event) => setDraft((current) => ({ ...current, machine: event.target.value }))}
        />
        <InputField
          label="Description"
          placeholder="Facing pass for aluminum stock"
          value={draft.description ?? ''}
          onChange={(event) =>
            setDraft((current) => ({ ...current, description: event.target.value }))
          }
        />
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Lines</span>
          <strong className={styles.statValue}>{lineCount}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Characters</span>
          <strong className={styles.statValue}>{draft.code.length}</strong>
        </div>
      </div>

      <TextareaField
        label="Code"
        mono
        rows={16}
        placeholder={'G21\nG90\nM3 S12000'}
        value={draft.code}
        onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
      />
    </div>
  )
}

interface FailedIterationBlockProps {
  block: Block<FailedIterationData>
}

export function FailedIterationBlock({ block }: FailedIterationBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  function addLesson(afterIndex?: number): void {
    setDraft((current) => {
      const nextLesson = ''

      if (afterIndex === undefined || afterIndex < 0 || afterIndex >= current.lessons.length) {
        return {
          ...current,
          lessons: [...current.lessons, nextLesson]
        }
      }

      return {
        ...current,
        lessons: [
          ...current.lessons.slice(0, afterIndex + 1),
          nextLesson,
          ...current.lessons.slice(afterIndex + 1)
        ]
      }
    })
  }

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Failed iteration</strong>
          <div className={styles.helperText}>
            Keep post-mortems, dead ends, and lessons learned in the workspace without publishing
            them.
          </div>
        </div>
        <button className={styles.smallButton} onClick={() => addLesson()} type="button">
          Add Lesson
        </button>
      </div>

      <InputField
        label="Iteration title"
        placeholder="Rev B buck converter overheated under load"
        value={draft.title}
        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
      />

      <TextareaField
        label="Summary"
        rows={5}
        placeholder="What failed, when it showed up, and why it mattered."
        value={draft.summary}
        onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
      />

      <div className={styles.choiceGroup}>
        {(['discarded', 'parked', 'resolved'] as const).map((status) => (
          <button
            key={status}
            className={`${styles.choiceButton} ${draft.status === status ? styles.choiceActive : ''}`}
            onClick={() => setDraft((current) => ({ ...current, status }))}
            type="button"
          >
            {status}
          </button>
        ))}
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Lessons</span>
          <strong className={styles.statValue}>{draft.lessons.filter(Boolean).length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Status</span>
          <strong className={styles.statValue}>{draft.status}</strong>
        </div>
      </div>

      {draft.lessons.length > 0 ? (
        <div className={styles.checkboxList}>
          {draft.lessons.map((lesson, index) => (
            <div key={`${block.id}-lesson-${index}`} className={styles.card}>
              <InputField
                label={`Lesson ${index + 1}`}
                placeholder="Add the fuse before validating current spikes."
                value={lesson}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    lessons: current.lessons.map((entry, lessonIndex) =>
                      lessonIndex === index ? event.target.value : entry
                    )
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && index === draft.lessons.length - 1) {
                    event.preventDefault()
                    addLesson(index)
                  }
                }}
              />
              <div className={styles.inlineActions}>
                <button
                  className={`${styles.smallButton} ${styles.iconButton}`}
                  disabled={index === 0}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      lessons: arrayMove(current.lessons, index, index - 1)
                    }))
                  }
                  type="button"
                >
                  Up
                </button>
                <button
                  className={`${styles.smallButton} ${styles.iconButton}`}
                  disabled={index === draft.lessons.length - 1}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      lessons: arrayMove(current.lessons, index, index + 1)
                    }))
                  }
                  type="button"
                >
                  Down
                </button>
                <button
                  className={styles.smallButton}
                  onClick={() => addLesson(index)}
                  type="button"
                >
                  Add After
                </button>
                <button
                  className={styles.smallButton}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      lessons: current.lessons.filter((_, lessonIndex) => lessonIndex !== index)
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
        <div className={styles.emptyState}>
          Add lessons learned so bad revs and dead ends stay documented for future versions.
        </div>
      )}
    </div>
  )
}
