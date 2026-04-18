import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useParams } from 'react-router-dom'
import type { PublicPageSection } from '@preload/types'
import { BLOCK_LABELS } from '@shared/defaults'
import { TitleBar } from '@renderer/components/workspace/TitleBar'
import { PublicPagePreview } from '@renderer/components/preview/PublicPagePreview'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { ResizeHandle } from '@renderer/components/ui/ResizeHandle'
import { useResizableWidth } from '@renderer/hooks/useResizableWidth'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { useUiStore } from '@renderer/stores/uiStore'
import styles from './PageCustomiser.module.css'

type CustomiserTab = 'structure' | 'theme' | 'typography' | 'footer'

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
  const pageCustomiserSidebarWidth = useUiStore((state) => state.pageCustomiserSidebarWidth)
  const setPageCustomiserSidebarWidth = useUiStore((state) => state.setPageCustomiserSidebarWidth)
  const setSaveState = useUiStore((state) => state.setSaveState)
  const reducedChrome = useUiStore((state) => state.reducedChrome)
  const [draftConfig, setDraftConfig] = useState(project?.page_config ?? null)
  const [activeTab, setActiveTab] = useState<CustomiserTab>('structure')
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const { isResizing, onPointerDown } = useResizableWidth({
    value: pageCustomiserSidebarWidth,
    min: 320,
    max: 560,
    onChange: setPageCustomiserSidebarWidth
  })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

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
    if (!draftConfig) {
      setActiveSectionId(null)
      return
    }

    setActiveSectionId((current) => current || draftConfig.sections[0]?.blockId || null)
  }, [draftConfig])

  useEffect(() => {
    if (!project || !draftConfig) {
      return
    }

    const current = JSON.stringify(project.page_config)
    const next = JSON.stringify(draftConfig)

    if (current === next) {
      return
    }

    setSaveState('saving')

    const timer = window.setTimeout(() => {
      void updateProject({ id: project.id, page_config: draftConfig })
        .then(() => {
          setSaveState('saved')
        })
        .catch((error) => {
          setSaveState('error')
          pushToast({
            message:
              error instanceof Error ? error.message : 'Failed to update public page settings.',
            type: 'error'
          })
        })
    }, 500)

    return () => window.clearTimeout(timer)
  }, [draftConfig, project, pushToast, setSaveState, updateProject])

  const sections = useMemo(() => {
    if (!draftConfig) {
      return []
    }

    return [...draftConfig.sections].sort((left, right) => left.sortOrder - right.sortOrder)
  }, [draftConfig])

  const activeSection =
    sections.find((section) => section.blockId === activeSectionId) ?? sections[0] ?? null
  const activeBlock =
    blocks.find((block) => block.id === activeSection?.blockId) ??
    blocks.find((block) => block.id === activeSectionId) ??
    null

  function updateSection(blockId: string, changes: Partial<PublicPageSection>): void {
    setDraftConfig((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.blockId === blockId ? { ...section, ...changes } : section
            )
          }
        : current
    )
  }

  function setAllSectionsVisible(visible: boolean): void {
    setDraftConfig((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) => ({ ...section, visible }))
          }
        : current
    )
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!draftConfig || !over || active.id === over.id) {
      return
    }

    const oldIndex = sections.findIndex((section) => section.blockId === active.id)
    const newIndex = sections.findIndex((section) => section.blockId === over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const reordered = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
      ...section,
      sortOrder: index
    }))

    setDraftConfig({
      ...draftConfig,
      sections: reordered
    })
  }

  function addFooterLink(): void {
    setDraftConfig((current) =>
      current
        ? {
            ...current,
            footer: {
              links: [...current.footer.links, { label: '', url: '' }]
            }
          }
        : current
    )
  }

  function updateFooterLink(index: number, key: 'label' | 'url', value: string): void {
    setDraftConfig((current) =>
      current
        ? {
            ...current,
            footer: {
              links: current.footer.links.map((link, linkIndex) =>
                linkIndex === index ? { ...link, [key]: value } : link
              )
            }
          }
        : current
    )
  }

  function removeFooterLink(index: number): void {
    setDraftConfig((current) =>
      current
        ? {
            ...current,
            footer: {
              links: current.footer.links.filter((_, linkIndex) => linkIndex !== index)
            }
          }
        : current
    )
  }

  if (!project || !draftConfig) {
    return <div style={{ padding: 32 }}>Loading page customiser…</div>
  }

  return (
    <div className="routeShell" data-reduced-chrome={reducedChrome}>
      <TitleBar project={project} view="customise" />
      <div
        className={styles.shell}
        style={
          {
            '--page-customiser-sidebar-width': `${pageCustomiserSidebarWidth}px`
          } as CSSProperties
        }
      >
        <aside className={styles.panel}>
          <div className={styles.header}>
            <div>
              <div className={styles.eyebrow}>Public page</div>
              <h2 className={styles.title}>Customize structure and theme</h2>
              <p className={styles.description}>
                Treat the public page like a clean publish surface: organize sections first, then
                adjust theme, typography, and footer details only when needed.
              </p>
            </div>
          </div>

          <div className={styles.tabBar}>
            {([
              ['structure', 'Structure'],
              ['theme', 'Theme'],
              ['typography', 'Typography'],
              ['footer', 'Footer']
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'structure' ? (
            <div className={styles.stack}>
              <div className={styles.inlineActions}>
                <Button size="sm" variant="outline" onClick={() => setAllSectionsVisible(true)}>
                  Show all
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAllSectionsVisible(false)}>
                  Hide all
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((section) => section.blockId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={styles.sectionList}>
                    {sections.map((section) => {
                      const block = blocks.find((entry) => entry.id === section.blockId)
                      if (!block) {
                        return null
                      }

                      return (
                        <SortableSectionRow
                          key={section.blockId}
                          active={section.blockId === activeSection?.blockId}
                          label={BLOCK_LABELS[block.type]}
                          section={section}
                          onFocus={() => {
                            setActiveSectionId(section.blockId)
                            setActiveBlock(section.blockId)
                          }}
                          onUpdate={(changes) => updateSection(section.blockId, changes)}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              {activeSection && activeBlock ? (
                <div className={styles.detailCard}>
                  <div className={styles.detailHeader}>
                    <div>
                      <div className={styles.eyebrow}>Selected section</div>
                      <strong>{BLOCK_LABELS[activeBlock.type]}</strong>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActiveBlock(activeBlock.id)
                      }}
                    >
                      Focus in editor
                    </Button>
                  </div>
                  <InputField
                    label="Custom heading"
                    value={activeSection.customTitle ?? ''}
                    onChange={(event) =>
                      updateSection(activeSection.blockId, { customTitle: event.target.value })
                    }
                  />
                  <label className={styles.checkboxRow}>
                    <input
                      checked={activeSection.visible}
                      type="checkbox"
                      onChange={(event) =>
                        updateSection(activeSection.blockId, { visible: event.target.checked })
                      }
                    />
                    <span>Visible on public page</span>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'theme' ? (
            <div className={styles.stack}>
              <InputField
                label="Accent color"
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
                label="Background color"
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
                label="Surface color"
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
              <label className={styles.field}>
                <span className={styles.eyebrow}>Layout</span>
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
            </div>
          ) : null}

          {activeTab === 'typography' ? (
            <div className={styles.stack}>
              <InputField
                label="Heading font"
                value={draftConfig.theme.fontHeading}
                onChange={(event) =>
                  setDraftConfig((current) =>
                    current
                      ? {
                          ...current,
                          theme: { ...current.theme, fontHeading: event.target.value }
                        }
                      : current
                  )
                }
              />
              <InputField
                label="Body font"
                value={draftConfig.theme.fontBody}
                onChange={(event) =>
                  setDraftConfig((current) =>
                    current
                      ? {
                          ...current,
                          theme: { ...current.theme, fontBody: event.target.value }
                        }
                      : current
                  )
                }
              />
              <div className={styles.note}>
                Use CSS-safe font stacks or imported family names. The public page renderer will
                apply these directly to the generated site.
              </div>
            </div>
          ) : null}

          {activeTab === 'footer' ? (
            <div className={styles.stack}>
              <label className={styles.checkboxRow}>
                <input
                  checked={draftConfig.hero.showCoverImage}
                  type="checkbox"
                  onChange={(event) =>
                    setDraftConfig((current) =>
                      current
                        ? {
                            ...current,
                            hero: {
                              ...current.hero,
                              showCoverImage: event.target.checked
                            }
                          }
                        : current
                    )
                  }
                />
                <span>Show cover image in hero</span>
              </label>
              <InputField
                label="Hero tagline"
                value={draftConfig.hero.tagline ?? ''}
                onChange={(event) =>
                  setDraftConfig((current) =>
                    current
                      ? {
                          ...current,
                          hero: {
                            ...current.hero,
                            tagline: event.target.value
                          }
                        }
                      : current
                  )
                }
              />

              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <div>
                    <div className={styles.eyebrow}>Footer links</div>
                    <strong>{draftConfig.footer.links.length} configured</strong>
                  </div>
                  <Button size="sm" variant="outline" onClick={addFooterLink}>
                    Add link
                  </Button>
                </div>

                <div className={styles.stack}>
                  {draftConfig.footer.links.length > 0 ? (
                    draftConfig.footer.links.map((link, index) => (
                      <div key={`${index}-${link.label}-${link.url}`} className={styles.linkRow}>
                        <InputField
                          label="Label"
                          value={link.label}
                          onChange={(event) =>
                            updateFooterLink(index, 'label', event.target.value)
                          }
                        />
                        <InputField
                          label="URL"
                          value={link.url}
                          onChange={(event) =>
                            updateFooterLink(index, 'url', event.target.value)
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFooterLink(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.note}>
                      Add portfolio, GitHub, LinkedIn, or contact links you want to show beneath
                      the public page.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        <ResizeHandle
          active={isResizing}
          ariaLabel="Resize customiser sidebar"
          onPointerDown={onPointerDown}
        />

        <div className={styles.preview}>
          <PublicPagePreview
            blocks={blocks}
            onFocusBlock={(blockId) => {
              setActiveSectionId(blockId)
              setActiveBlock(blockId)
            }}
            project={{ ...project, page_config: draftConfig }}
          />
        </div>
      </div>
    </div>
  )
}

interface SortableSectionRowProps {
  active: boolean
  label: string
  section: PublicPageSection
  onFocus: () => void
  onUpdate: (changes: Partial<PublicPageSection>) => void
}

function SortableSectionRow({
  active,
  label,
  section,
  onFocus,
  onUpdate
}: SortableSectionRowProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.blockId
  })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.sectionRow} ${active ? styles.sectionRowActive : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.58 : 1
      }}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label}`}
        className={styles.dragHandle}
        type="button"
      >
        ::
      </button>

      <button className={styles.sectionMeta} onClick={onFocus} type="button">
        <strong>{label}</strong>
        <span>{section.visible ? 'Visible' : 'Hidden'}</span>
      </button>

      <label className={styles.visibilityToggle}>
        <input
          checked={section.visible}
          type="checkbox"
          onChange={(event) => onUpdate({ visible: event.target.checked })}
        />
        <span>Public</span>
      </label>
    </div>
  )
}
