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
      <div className={styles.sectionTitle}>
        <div>
          <strong>Rich text</strong>
          <div className={styles.helperText}>
            Flexible formatted content for general narrative sections on the public page.
          </div>
        </div>
      </div>
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
      <div className={styles.sectionTitle}>
        <div>
          <strong>How it works</strong>
          <div className={styles.helperText}>
            Explain the mechanism, workflow, or process in a reader-friendly narrative block.
          </div>
        </div>
      </div>
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
      <div className={styles.sectionTitle}>
        <div>
          <strong>Case study</strong>
          <div className={styles.helperText}>
            Use structured challenge/approach/outcome sections or switch to a single freeform story.
          </div>
        </div>
      </div>
      <div className={styles.choiceGroup}>
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
          <div className={styles.card}>
            <div className={styles.muted}>Challenge</div>
            <RichTextEditor
              value={draft.challenge ?? '<p></p>'}
              onChange={(challenge) => setDraft((current) => ({ ...current, challenge }))}
            />
          </div>
          <div className={styles.card}>
            <div className={styles.muted}>Approach</div>
            <RichTextEditor
              value={draft.approach ?? '<p></p>'}
              onChange={(approach) => setDraft((current) => ({ ...current, approach }))}
            />
          </div>
          <div className={styles.card}>
            <div className={styles.muted}>Outcome</div>
            <RichTextEditor
              value={draft.outcome ?? '<p></p>'}
              onChange={(outcome) => setDraft((current) => ({ ...current, outcome }))}
            />
          </div>
        </>
      ) : (
        <div className={styles.card}>
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
