import { useEffect, useMemo } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { useLibraryStore } from '@renderer/stores/libraryStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useUiStore } from '@renderer/stores/uiStore'
import pageStyles from './CommandCenterPages.module.css'

export function LibraryWorkspace(): JSX.Element {
  const {
    activeDocumentId,
    documents,
    excerpts,
    suggestions,
    deleteDocument,
    importDocuments,
    loadDocuments,
    resolveSuggestion,
    selectDocument
  } = useLibraryStore()
  const bundle = useSettingsStore((state) => state.bundle)
  const loadBundle = useSettingsStore((state) => state.loadBundle)
  const reducedChrome = useUiStore((state) => state.reducedChrome)

  useEffect(() => {
    void loadDocuments()
    void loadBundle()
  }, [loadBundle, loadDocuments])

  useEffect(() => {
    if (!activeDocumentId && documents[0]) {
      void selectDocument(documents[0].id)
    }
  }, [activeDocumentId, documents, selectDocument])

  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? documents[0] ?? null
  const activeDocumentSuggestions = useMemo(
    () =>
      suggestions.filter((suggestion) =>
        activeDocument ? suggestion.document_id === activeDocument.id : true
      ),
    [activeDocument, suggestions]
  )

  async function handleImportDocuments(): Promise<void> {
    const defaultPath = bundle?.integration_settings.default_document_directory
    const files = await window.lab.system.openFiles({
      title: 'Import source documents',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Source documents',
          extensions: ['docx', 'md', 'txt']
        }
      ]
    })

    const filePaths =
      files.length > 0
        ? files
        : defaultPath
          ? [
              `${defaultPath}\\01_Master_Personal_Profile.docx`,
              `${defaultPath}\\02_Five_Year_Roadmap.docx`,
              `${defaultPath}\\03_Skills_Portfolio_Blueprint.docx`,
              `${defaultPath}\\04_Target_Landscape_Brief.docx`,
              `${defaultPath}\\05_LinkedIn_Career_Strategy.docx`
            ]
          : []

    if (filePaths.length === 0) {
      return
    }

    await importDocuments({ file_paths: filePaths })
  }

  return (
    <div className={pageStyles.page} data-reduced-chrome={reducedChrome}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Library</span>
          <h1 className={pageStyles.title}>Source documents and structured suggestions</h1>
          <p className={pageStyles.description}>
            Keep the raw material visible. The library should feel like a quiet review workspace:
            import source docs, read the extracted sections, and accept only the structured
            suggestions you actually want in the system.
          </p>
        </section>

        <section className={pageStyles.callout}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <strong>Import strategic source material</strong>
              <p className={pageStyles.description}>
                DOCX, markdown, and text are supported. If a default document folder is set in
                Settings, davids.lab can bootstrap from it without manual path entry.
              </p>
            </div>
            <Button onClick={() => void handleImportDocuments()}>Import documents</Button>
          </div>
        </section>

        <section className={pageStyles.collectionDetailLayout}>
          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Documents</h2>
                <p className={pageStyles.sectionDescription}>
                  Select a source to inspect its excerpts and related suggestions.
                </p>
              </div>
              <span className={pageStyles.chip}>{documents.length}</span>
            </div>
            <div className={pageStyles.list}>
              {documents.length > 0 ? (
                documents.map((document) => (
                  <div key={document.id} className={pageStyles.row}>
                    <button
                      className={`${pageStyles.rowButton} ${document.id === activeDocument?.id ? pageStyles.rowActive : ''}`}
                      onClick={() => void selectDocument(document.id)}
                      type="button"
                    >
                      <span className={pageStyles.rowTitle}>{document.title}</span>
                      <span className={pageStyles.rowMeta}>
                        {document.kind} · {document.excerpt_count} excerpts · {document.status}
                      </span>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteDocument(document.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No source documents yet</strong>
                  <span>Import your planning docs to start building a reviewable knowledge base.</span>
                </div>
              )}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>
                  {activeDocument ? activeDocument.title : 'Excerpt reader'}
                </h2>
                <p className={pageStyles.sectionDescription}>
                  Read the extracted chunks before accepting anything into structured data.
                </p>
              </div>
              <span className={pageStyles.chip}>{excerpts.length}</span>
            </div>
            <div className={pageStyles.document}>
              {activeDocument ? (
                excerpts.length > 0 ? (
                  excerpts.map((excerpt) => (
                    <div key={excerpt.id} className={pageStyles.documentSection}>
                      <strong>{excerpt.heading ?? `Excerpt ${excerpt.excerpt_index + 1}`}</strong>
                      <p className={pageStyles.description}>{excerpt.content}</p>
                    </div>
                  ))
                ) : (
                  <div className={pageStyles.emptyState}>
                    <strong>No excerpts yet</strong>
                    <span>This document imported, but no excerpts are available to review yet.</span>
                  </div>
                )
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>Select a document</strong>
                  <span>Choose a source document from the left to inspect its extracted text.</span>
                </div>
              )}
            </div>
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Suggestions</h2>
                <p className={pageStyles.sectionDescription}>
                  Accept or dismiss suggestions explicitly. Nothing should silently rewrite your
                  system.
                </p>
              </div>
              <span className={pageStyles.chip}>
                {
                  activeDocumentSuggestions.filter((suggestion) => suggestion.status === 'pending')
                    .length
                }{' '}
                pending
              </span>
            </div>
            <div className={pageStyles.list}>
              {activeDocumentSuggestions.length > 0 ? (
                activeDocumentSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className={pageStyles.row}>
                    <span className={pageStyles.rowTitle}>{suggestion.title}</span>
                    <span className={pageStyles.rowMeta}>
                      {suggestion.suggestion_type.replace(/_/g, ' ')} · {suggestion.status}
                    </span>
                    {suggestion.status === 'pending' ? (
                      <div className={pageStyles.inlineActions}>
                        <Button
                          size="sm"
                          onClick={() =>
                            void resolveSuggestion({
                              suggestion_id: suggestion.id,
                              action: 'accepted'
                            })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void resolveSuggestion({
                              suggestion_id: suggestion.id,
                              action: 'dismissed'
                            })
                          }
                        >
                          Dismiss
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No suggestions yet</strong>
                  <span>Once the library extracts structure, suggestions will appear here for review.</span>
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
