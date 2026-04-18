import { useEffect, useMemo, useRef, useState } from 'react'
import type { Block, Project } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { useToastStore } from '@renderer/stores/toastStore'
import styles from './PublicPagePreview.module.css'

interface PublicPagePreviewProps {
  blocks: Block[]
  onClose?: () => void
  onFocusBlock: (id: string) => void
  project: Project
  showBorder?: boolean
}

export function PublicPagePreview({
  blocks,
  onClose,
  onFocusBlock,
  project,
  showBorder = true
}: PublicPagePreviewProps): JSX.Element {
  const [html, setHtml] = useState('')
  const pushToast = useToastStore((state) => state.push)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const requestIdRef = useRef(0)
  const blockSignature = useMemo(
    () =>
      blocks
        .map((block) => `${block.id}:${block.updated_at}:${block.visible_on_page}:${block.sort_order}`)
        .join('|'),
    [blocks]
  )
  const pageConfigSignature = useMemo(() => JSON.stringify(project.page_config), [project.page_config])

  async function refreshPreview(): Promise<void> {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    try {
      const nextHtml = await window.lab.page.render(project.id)
      if (requestId === requestIdRef.current) {
        setHtml(nextHtml)
      }
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to refresh preview.',
        type: 'error'
      })
    }
  }

  useEffect(() => {
    let cancelled = false
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const timer = window.setTimeout(() => {
      void window.lab.page
        .render(project.id)
        .then((nextHtml) => {
          if (!cancelled && requestId === requestIdRef.current) {
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
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [blockSignature, pageConfigSignature, project.id, pushToast])

  useEffect(() => {
    const handler = (event: MessageEvent): void => {
      if (
        event.source === iframeRef.current?.contentWindow &&
        event.origin === window.location.origin &&
        event.data?.type === 'LAB_FOCUS_BLOCK' &&
        typeof event.data.blockId === 'string'
      ) {
        onFocusBlock(event.data.blockId)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onFocusBlock])

  return (
    <aside className={`${styles.panel} ${showBorder ? styles.bordered : styles.flush}`}>
      <div className={styles.header}>
        <strong>{project.name} public page</strong>
        <div className={styles.actions}>
          <Button size="sm" variant="outline" onClick={() => void refreshPreview()}>
            Refresh
          </Button>
          {onClose ? (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Hide
            </Button>
          ) : null}
        </div>
      </div>
      <div className={styles.body}>
        <iframe
          ref={iframeRef}
          className={styles.frame}
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin"
          title="Public page preview"
        />
      </div>
    </aside>
  )
}
