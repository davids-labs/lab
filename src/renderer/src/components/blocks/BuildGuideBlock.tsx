import { useEffect, useState } from 'react'
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

  return (
    <div className={styles.stack}>
      {draft.steps.map((step, index) => (
        <div key={step.id} className={styles.card}>
          <div className={styles.row}>
            <InputField
              label={`Step ${index + 1}`}
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
                className={styles.smallButton}
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
      <button
        className={styles.smallButton}
        onClick={() =>
          setDraft((current) => ({
            steps: [...current.steps, { id: ulid(), title: '', body: '<p></p>' }]
          }))
        }
        type="button"
      >
        Add Step
      </button>
    </div>
  )
}
