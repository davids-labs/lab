import { useEffect, useState } from 'react'
import type { Block, Project } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import styles from './PublicPagePreview.module.css'

interface PublicPagePreviewProps {
  blocks: Block[]
  onFocusBlock: (id: string) => void
  project: Project
}

export function PublicPagePreview({
  blocks,
  onFocusBlock,
  project
}: PublicPagePreviewProps): JSX.Element {
  const [html, setHtml] = useState('')

  useEffect(() => {
    let cancelled = false

    const timer = window.setTimeout(() => {
      void window.lab.page.render(project.id).then((nextHtml) => {
        if (!cancelled) {
          setHtml(nextHtml)
        }
      })
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [blocks, project.id, project.page_config])

  useEffect(() => {
    const handler = (event: MessageEvent): void => {
      if (event.data?.type === 'LAB_FOCUS_BLOCK' && typeof event.data.blockId === 'string') {
        onFocusBlock(event.data.blockId)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onFocusBlock])

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <strong>Public Page</strong>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void window.lab.page.render(project.id).then(setHtml)}
        >
          Refresh
        </Button>
      </div>
      <iframe
        className={styles.frame}
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
        title="Public page preview"
      />
    </aside>
  )
}
