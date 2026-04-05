import { useEffect, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { ulid } from 'ulidx'
import type { Block, BuildGuideData } from '@preload/types'
import { RichTextEditor } from '@renderer/components/editor/RichTextEditor'
import { InputField } from '@renderer/components/ui/InputField'
import { useAssetStore } from '@renderer/stores/assetStore'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'
import styles from './BlockEditors.module.css'

interface BuildGuideBlockProps {
  block: Block<BuildGuideData>
}

export function BuildGuideBlock({ block }: BuildGuideBlockProps): JSX.Element {
  const assets = useAssetStore((state) => state.assets)
  const [draft, setDraft] = useState(block.data)

  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  function addStep(afterIndex?: number): void {
    setDraft((current) => {
      const nextStep = { id: ulid(), title: '', body: '<p></p>' }

      if (afterIndex === undefined || afterIndex < 0 || afterIndex >= current.steps.length) {
        return { steps: [...current.steps, nextStep] }
      }

      return {
        steps: [
          ...current.steps.slice(0, afterIndex + 1),
          nextStep,
          ...current.steps.slice(afterIndex + 1)
        ]
      }
    })
  }

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        <div>
          <strong>Build guide</strong>
          <div className={styles.helperText}>
            Structure the assembly flow with clear titles, rich instructions, and optional images.
          </div>
        </div>
        <button className={styles.smallButton} onClick={() => addStep()} type="button">
          Add Step
        </button>
      </div>

      {draft.steps.length === 0 ? (
        <div className={styles.emptyState}>Add your first step to start the build sequence.</div>
      ) : null}

      {draft.steps.map((step, index) => (
        <div key={step.id} className={styles.card}>
          <div className={styles.sectionTitle}>
            <strong>Step {index + 1}</strong>
            <div className={styles.inlineActions}>
              <button
                className={`${styles.smallButton} ${styles.iconButton}`}
                disabled={index === 0}
                onClick={() =>
                  setDraft((current) => ({
                    steps: arrayMove(current.steps, index, index - 1)
                  }))
                }
                type="button"
              >
                Up
              </button>
              <button
                className={`${styles.smallButton} ${styles.iconButton}`}
                disabled={index === draft.steps.length - 1}
                onClick={() =>
                  setDraft((current) => ({
                    steps: arrayMove(current.steps, index, index + 1)
                  }))
                }
                type="button"
              >
                Down
              </button>
              <button className={styles.smallButton} onClick={() => addStep(index)} type="button">
                Add After
              </button>
              <button
                className={styles.smallButton}
                onClick={() =>
                  setDraft((current) => ({
                    steps: current.steps.filter((_, entryIndex) => entryIndex !== index)
                  }))
                }
                type="button"
              >
                Remove
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <InputField
              label="Title"
              placeholder="Install the controller"
              value={step.title}
              onChange={(event) =>
                setDraft((current) => ({
                  steps: current.steps.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, title: event.target.value } : entry
                  )
                }))
              }
            />

            <label className={styles.stack}>
              <span className={styles.muted}>Image</span>
              <select
                value={step.img_asset_id ?? ''}
                className={styles.select}
                onChange={(event) =>
                  setDraft((current) => ({
                    steps: current.steps.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, img_asset_id: event.target.value || undefined }
                        : entry
                    )
                  }))
                }
              >
                <option value="">No image</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.filename}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <RichTextEditor
            value={step.body}
            onChange={(body) =>
              setDraft((current) => ({
                steps: current.steps.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, body } : entry
                )
              }))
            }
          />
        </div>
      ))}
    </div>
  )
}
