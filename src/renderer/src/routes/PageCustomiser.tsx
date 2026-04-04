import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { TitleBar } from '@renderer/components/workspace/TitleBar'
import { PublicPagePreview } from '@renderer/components/preview/PublicPagePreview'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import styles from './PageCustomiser.module.css'

export function PageCustomiser(): JSX.Element {
  const params = useParams()
  const projectId = params.id ?? ''
  const project = useProjectStore((state) => state.activeProject)
  const loadProject = useProjectStore((state) => state.loadProject)
  const updateProject = useProjectStore((state) => state.updateProject)
  const blocks = useBlockStore((state) => state.blocks)
  const loadBlocks = useBlockStore((state) => state.loadBlocks)
  const setActiveBlock = useBlockStore((state) => state.setActiveBlock)
  const pushToast = useToastStore((state) => state.push)
  const [draftConfig, setDraftConfig] = useState(project?.page_config ?? null)

  useEffect(() => {
    if (!projectId) {
      return
    }

    void loadProject(projectId)
    void loadBlocks(projectId)
  }, [loadBlocks, loadProject, projectId])

  useEffect(() => {
    if (project) {
      setDraftConfig(project.page_config)
    }
  }, [project])

  useEffect(() => {
    if (!project || !draftConfig) {
      return
    }

    const current = JSON.stringify(project.page_config)
    const next = JSON.stringify(draftConfig)

    if (current === next) {
      return
    }

    const timer = window.setTimeout(() => {
      void updateProject({ id: project.id, page_config: draftConfig }).then(() => {
        pushToast({ message: 'Updated public page settings', type: 'success' })
      })
    }, 500)

    return () => window.clearTimeout(timer)
  }, [draftConfig, project, pushToast, updateProject])

  const sections = useMemo(() => {
    if (!draftConfig) {
      return []
    }

    return [...draftConfig.sections].sort((left, right) => left.sortOrder - right.sortOrder)
  }, [draftConfig])

  if (!project || !draftConfig) {
    return <div style={{ padding: 32 }}>Loading page customiser…</div>
  }

  return (
    <div className="routeShell">
      <TitleBar project={project} view="customise" />
      <div className={styles.shell}>
        <aside className={styles.panel}>
          <div>
            <div className={styles.muted}>Sections</div>
            <strong>Public page structure</strong>
          </div>
          {sections.map((section, index) => {
            const block = blocks.find((entry) => entry.id === section.blockId)
            if (!block) {
              return null
            }

            return (
              <div key={section.blockId} className={styles.sectionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{block.type}</strong>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      checked={section.visible}
                      onChange={(event) =>
                        setDraftConfig((current) =>
                          current
                            ? {
                                ...current,
                                sections: current.sections.map((entry) =>
                                  entry.blockId === section.blockId
                                    ? { ...entry, visible: event.target.checked }
                                    : entry
                                )
                              }
                            : current
                        )
                      }
                      type="checkbox"
                    />
                    Visible
                  </label>
                </div>
                <InputField
                  label="Custom Heading"
                  value={section.customTitle ?? ''}
                  onChange={(event) =>
                    setDraftConfig((current) =>
                      current
                        ? {
                            ...current,
                            sections: current.sections.map((entry) =>
                              entry.blockId === section.blockId
                                ? { ...entry, customTitle: event.target.value }
                                : entry
                            )
                          }
                        : current
                    )
                  }
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() =>
                      setDraftConfig((current) => {
                        if (!current) {
                          return current
                        }
                        const nextSections = [...current.sections]
                        const currentIndex = nextSections.findIndex(
                          (entry) => entry.blockId === section.blockId
                        )
                        if (currentIndex <= 0) {
                          return current
                        }
                        const swap = nextSections[currentIndex - 1]
                        nextSections[currentIndex - 1] = {
                          ...nextSections[currentIndex],
                          sortOrder: currentIndex - 1
                        }
                        nextSections[currentIndex] = { ...swap, sortOrder: currentIndex }
                        return { ...current, sections: nextSections }
                      })
                    }
                  >
                    Move Up
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={index === sections.length - 1}
                    onClick={() =>
                      setDraftConfig((current) => {
                        if (!current) {
                          return current
                        }
                        const nextSections = [...current.sections]
                        const currentIndex = nextSections.findIndex(
                          (entry) => entry.blockId === section.blockId
                        )
                        if (currentIndex === -1 || currentIndex >= nextSections.length - 1) {
                          return current
                        }
                        const swap = nextSections[currentIndex + 1]
                        nextSections[currentIndex + 1] = {
                          ...nextSections[currentIndex],
                          sortOrder: currentIndex + 1
                        }
                        nextSections[currentIndex] = { ...swap, sortOrder: currentIndex }
                        return { ...current, sections: nextSections }
                      })
                    }
                  >
                    Move Down
                  </Button>
                </div>
              </div>
            )
          })}

          <div>
            <div className={styles.muted}>Theme</div>
            <strong>Look and feel</strong>
          </div>
          <InputField
            label="Accent"
            value={draftConfig.theme.accent}
            onChange={(event) =>
              setDraftConfig((current) =>
                current
                  ? {
                      ...current,
                      theme: { ...current.theme, accent: event.target.value }
                    }
                  : current
              )
            }
          />
          <InputField
            label="Background"
            value={draftConfig.theme.bg}
            onChange={(event) =>
              setDraftConfig((current) =>
                current
                  ? {
                      ...current,
                      theme: { ...current.theme, bg: event.target.value }
                    }
                  : current
              )
            }
          />
          <InputField
            label="Surface"
            value={draftConfig.theme.surface}
            onChange={(event) =>
              setDraftConfig((current) =>
                current
                  ? {
                      ...current,
                      theme: { ...current.theme, surface: event.target.value }
                    }
                  : current
              )
            }
          />
          <label className={styles.sectionCard}>
            <span className={styles.muted}>Layout</span>
            <select
              value={draftConfig.theme.layoutVariant}
              onChange={(event) =>
                setDraftConfig((current) =>
                  current
                    ? {
                        ...current,
                        theme: {
                          ...current.theme,
                          layoutVariant: event.target.value as typeof current.theme.layoutVariant
                        }
                      }
                    : current
                )
              }
            >
              <option value="default">Default</option>
              <option value="minimal">Minimal</option>
              <option value="magazine">Magazine</option>
            </select>
          </label>
        </aside>

        <div className={styles.preview}>
          <PublicPagePreview
            blocks={blocks}
            onFocusBlock={setActiveBlock}
            project={{ ...project, page_config: draftConfig }}
          />
        </div>
      </div>
    </div>
  )
}
