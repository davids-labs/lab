import { useEffect } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { useLibraryStore } from '@renderer/stores/libraryStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import pageStyles from './CommandCenterPages.module.css'

export function LibraryWorkspace(): JSX.Element {
  const {
    activeDocumentId,
    documents,
    excerpts,
    suggestions,
    deleteDocument,
    loadDocuments,
    selectDocument,
    importDocuments,
    resolveSuggestion
  } = useLibraryStore()
  const bundle = useSettingsStore((state) => state.bundle)
  const loadBundle = useSettingsStore((state) => state.loadBundle)

  useEffect(() => {
    void loadDocuments()
    void loadBundle()
  }, [loadBundle, loadDocuments])

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
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Library</span>
          <h1 className={pageStyles.title}>Living Source Library</h1>
          <p className={pageStyles.description}>
            Import strategic source docs, inspect excerpts, and accept or dismiss structured
            suggestions instead of manually retyping your whole system.
          </p>
        </section>

        <section className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.cardTitle}>Import Strategic Docs</h2>
              <p className={pageStyles.description}>
                DOCX, markdown, and text are supported. The current library can bootstrap directly
                from your downloaded career-planning documents.
              </p>
            </div>
            <Button onClick={() => void handleImportDocuments()}>Import Documents</Button>
          </div>
        </section>

        <section className={pageStyles.split}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Documents</h2>
              <span className={pageStyles.pill}>{documents.length}</span>
            </div>
            <div className={pageStyles.list}>
              {documents.map((document) => (
                <div key={document.id} className={pageStyles.listRow}>
                  <button
                    onClick={() => void selectDocument(document.id)}
                    style={{
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: 0
                    }}
                    type="button"
                  >
                    <strong>{document.title}</strong>
                    <span className={pageStyles.muted}>
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
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Excerpts</h2>
              <span className={pageStyles.pill}>{excerpts.length}</span>
            </div>
            <div className={pageStyles.list}>
              {activeDocumentId ? (
                excerpts.map((excerpt) => (
                  <div key={excerpt.id} className={pageStyles.listRow}>
                    <strong>{excerpt.heading ?? `Excerpt ${excerpt.excerpt_index + 1}`}</strong>
                    <span className={pageStyles.muted}>{excerpt.content}</span>
                  </div>
                ))
              ) : (
                <div className={pageStyles.listRow}>
                  <strong>No document selected</strong>
                  <span className={pageStyles.muted}>
                    Select a source document to inspect its extracted sections.
                  </span>
                </div>
              )}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Suggestions</h2>
              <span className={pageStyles.pill}>
                {suggestions.filter((entry) => entry.status === 'pending').length} pending
              </span>
            </div>
            <div className={pageStyles.list}>
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className={pageStyles.listRow}>
                  <strong>{suggestion.title}</strong>
                  <span className={pageStyles.muted}>
                    {suggestion.suggestion_type.replace(/_/g, ' ')} · {suggestion.status}
                  </span>
                  {suggestion.status === 'pending' ? (
                    <div className={pageStyles.inlineRow}>
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
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
