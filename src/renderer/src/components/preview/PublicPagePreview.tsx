import { useEffect, useState } from 'react'
import type { Block, Project } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { useToastStore } from '@renderer/stores/toastStore'
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
  const pushToast = useToastStore((state) => state.push)

  async function refreshPreview(): Promise<void> {
    try {
      setHtml(await window.lab.page.render(project.id))
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to refresh preview.',
        type: 'error'
      })
    }
  }

  useEffect(() => {
    let cancelled = false

    const timer = window.setTimeout(() => {
      void window.lab.page
        .render(project.id)
        .then((nextHtml) => {
          if (!cancelled) {
            setHtml(nextHtml)
          }
        })
        .catch((error) => {
          if (!cancelled) {
            pushToast({
              message: error instanceof Error ? error.message : 'Failed to render preview.',
              type: 'error'
            })
          }
        })
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [blocks, project.id, project.page_config, pushToast])

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
        <Button size="sm" variant="outline" onClick={() => void refreshPreview()}>
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
