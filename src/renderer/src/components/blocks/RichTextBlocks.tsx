import { useEffect, useState } from 'react'
import type { Block, CaseStudyData, HowItWorksData, TextData } from '@preload/types'
import { RichTextEditor } from '@renderer/components/editor/RichTextEditor'
import { Button } from '@renderer/components/ui/Button'
import styles from './BlockEditors.module.css'
import { usePersistBlock } from '@renderer/hooks/usePersistBlock'

interface TextBlockProps {
  block: Block<TextData>
}

export function TextBlock({ block }: TextBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <RichTextEditor value={draft.html} onChange={(html) => setDraft({ html })} />
    </div>
  )
}

interface HowItWorksBlockProps {
  block: Block<HowItWorksData>
}

export function HowItWorksBlock({ block }: HowItWorksBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <RichTextEditor value={draft.body} onChange={(body) => setDraft({ body })} />
    </div>
  )
}

interface CaseStudyBlockProps {
  block: Block<CaseStudyData>
}

export function CaseStudyBlock({ block }: CaseStudyBlockProps): JSX.Element {
  const [draft, setDraft] = useState(block.data)
  useEffect(() => setDraft(block.data), [block.data, block.id, block.updated_at])
  usePersistBlock(block, draft)

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Button
          size="sm"
          variant={draft.mode === 'structured' ? 'primary' : 'outline'}
          onClick={() => setDraft((current) => ({ ...current, mode: 'structured' }))}
        >
          Structured
        </Button>
        <Button
          size="sm"
          variant={draft.mode === 'free' ? 'primary' : 'outline'}
          onClick={() => setDraft((current) => ({ ...current, mode: 'free' }))}
        >
          Freeform
        </Button>
      </div>
      {draft.mode === 'structured' ? (
        <>
          <div>
            <div className={styles.muted}>Challenge</div>
            <RichTextEditor
              value={draft.challenge ?? '<p></p>'}
              onChange={(challenge) => setDraft((current) => ({ ...current, challenge }))}
            />
          </div>
          <div>
            <div className={styles.muted}>Approach</div>
            <RichTextEditor
              value={draft.approach ?? '<p></p>'}
              onChange={(approach) => setDraft((current) => ({ ...current, approach }))}
            />
          </div>
          <div>
            <div className={styles.muted}>Outcome</div>
            <RichTextEditor
              value={draft.outcome ?? '<p></p>'}
              onChange={(outcome) => setDraft((current) => ({ ...current, outcome }))}
            />
          </div>
        </>
      ) : (
        <div>
          <div className={styles.muted}>Paragraphs</div>
          <RichTextEditor
            value={(draft.paragraphs ?? ['<p></p>']).join('')}
            onChange={(html) => setDraft((current) => ({ ...current, paragraphs: [html] }))}
          />
        </div>
      )}
    </div>
  )
}
