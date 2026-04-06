import { useEffect, useMemo, useState } from 'react'
import type { NoteLinkTargetType } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useCaptureStore } from '@renderer/stores/captureStore'
import { useLibraryStore } from '@renderer/stores/libraryStore'
import { useNoteStore } from '@renderer/stores/noteStore'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import { usePlanStore } from '@renderer/stores/planStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSkillsStore } from '@renderer/stores/skillsStore'
import pageStyles from './CommandCenterPages.module.css'

export function NotesWorkspace(): JSX.Element {
  const {
    notes,
    activeNote,
    links,
    loadNotes,
    selectNote,
    createNote,
    updateNote,
    deleteNote,
    createLink,
    deleteLink
  } = useNoteStore()
  const nodes = usePlanStore((state) => state.nodes)
  const loadNodes = usePlanStore((state) => state.loadNodes)
  const projects = useProjectStore((state) => state.projects)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const { applications, contacts, loadAll: loadPipeline } = usePipelineStore()
  const skills = useSkillsStore((state) => state.nodes)
  const loadSkills = useSkillsStore((state) => state.loadNodes)
  const { documents, excerpts, loadDocuments, selectDocument } = useLibraryStore()
  const { entries, loadEntries } = useCaptureStore()
  const [noteTitle, setNoteTitle] = useState('')
  const [linkType, setLinkType] = useState<NoteLinkTargetType>('plan_node')
  const [linkTargetId, setLinkTargetId] = useState('')

  useEffect(() => {
    void loadNotes()
    void loadNodes()
    void loadProjects()
    void loadPipeline()
    void loadSkills(null)
    void loadDocuments()
    void loadEntries()
  }, [loadDocuments, loadEntries, loadNodes, loadNotes, loadPipeline, loadProjects, loadSkills])

  useEffect(() => {
    if (documents[0]) {
      void selectDocument(documents[0].id)
    }
  }, [documents, selectDocument])

  const linkTargets = useMemo(() => {
    switch (linkType) {
      case 'plan_node':
        return nodes.map((node) => ({ id: node.id, label: node.title }))
      case 'project':
        return projects.map((project) => ({ id: project.id, label: project.name }))
      case 'application_record':
        return applications.map((application) => ({ id: application.id, label: application.title }))
      case 'skill_node':
        return skills.map((skill) => ({ id: skill.id, label: skill.title }))
      case 'contact_record':
        return contacts.map((contact) => ({ id: contact.id, label: contact.full_name }))
      case 'source_document':
        return documents.map((document) => ({ id: document.id, label: document.title }))
      case 'source_excerpt':
        return excerpts.map((excerpt) => ({
          id: excerpt.id,
          label: excerpt.heading ?? `Excerpt ${excerpt.excerpt_index + 1}`
        }))
      case 'inbox_entry':
        return entries.map((entry) => ({ id: entry.id, label: entry.title }))
      default:
        return []
    }
  }, [applications, contacts, documents, entries, excerpts, linkType, nodes, projects, skills])

  useEffect(() => {
    setLinkTargetId(linkTargets[0]?.id ?? '')
  }, [linkTargets])

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Notes</span>
          <h1 className={pageStyles.title}>Strategy notes, meeting notes, and thinking docs</h1>
          <p className={pageStyles.description}>
            Notes are the lighter document layer in davids.lab. Use them for planning memos,
            meeting capture, decisions, and the connective tissue between projects, opportunities,
            and strategy.
          </p>
        </section>

        <section className={pageStyles.collectionLayout}>
          <article className={pageStyles.section}>
            <div className={pageStyles.inlineActions}>
              <InputField
                placeholder="New note title"
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
              />
              <Button
                onClick={() =>
                  void createNote({ title: noteTitle, type: 'strategy' }).then(() => setNoteTitle(''))
                }
              >
                Add note
              </Button>
            </div>
            <div className={pageStyles.list}>
              {notes.map((note) => (
                <button
                  key={note.id}
                  className={`${pageStyles.rowButton} ${note.id === activeNote?.id ? pageStyles.rowActive : ''}`}
                  onClick={() => void selectNote(note.id)}
                  type="button"
                >
                  <span className={pageStyles.rowTitle}>{note.title}</span>
                  <span className={pageStyles.rowMeta}>
                    {note.type}
                    {note.archived ? ' · archived' : ''}
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className={pageStyles.section}>
            {activeNote ? (
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>{activeNote.title}</h2>
                    <p className={pageStyles.sectionDescription}>
                      Keep notes linkable and reusable instead of burying context in one-off text fields.
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => void deleteNote(activeNote.id)}>
                    Remove
                  </Button>
                </div>
                <InputField
                  label="Title"
                  defaultValue={activeNote.title}
                  onBlur={(event) =>
                    void updateNote({
                      id: activeNote.id,
                      title: event.target.value.trim() || activeNote.title
                    })
                  }
                />
                <div className={pageStyles.propertyGrid}>
                  <InputField
                    label="Type"
                    defaultValue={activeNote.type}
                    onBlur={(event) =>
                      void updateNote({
                        id: activeNote.id,
                        type:
                          (event.target.value.trim() as typeof activeNote.type) || activeNote.type
                      })
                    }
                  />
                  <InputField
                    label="Summary"
                    defaultValue={activeNote.summary ?? ''}
                    onBlur={(event) =>
                      void updateNote({
                        id: activeNote.id,
                        summary: event.target.value.trim() || null
                      })
                    }
                  />
                </div>
                <TextareaField
                  label="Body"
                  rows={18}
                  defaultValue={activeNote.body}
                  onBlur={(event) =>
                    void updateNote({
                      id: activeNote.id,
                      body: event.target.value
                    })
                  }
                />
              </div>
            ) : (
              <div className={pageStyles.emptyState}>
                <strong>No note selected</strong>
                <span>Create or select a note from the left to start writing.</span>
              </div>
            )}
          </article>

          <article className={pageStyles.section}>
            <div className={pageStyles.sectionHeader}>
              <div>
                <h2 className={pageStyles.sectionTitle}>Linked records</h2>
                <p className={pageStyles.sectionDescription}>
                  Notes become much more useful once they point at roadmap items, projects, applications, or source excerpts.
                </p>
              </div>
              <span className={pageStyles.chip}>{links.length}</span>
            </div>

            {activeNote ? (
              <div className={pageStyles.document}>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Target type</span>
                  <select
                    value={linkType}
                    onChange={(event) => setLinkType(event.target.value as NoteLinkTargetType)}
                  >
                    <option value="plan_node">Plan item</option>
                    <option value="project">Project</option>
                    <option value="application_record">Application</option>
                    <option value="skill_node">Skill</option>
                    <option value="contact_record">Contact</option>
                    <option value="source_document">Source document</option>
                    <option value="source_excerpt">Source excerpt</option>
                    <option value="inbox_entry">Capture entry</option>
                  </select>
                </label>
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Target</span>
                  <select
                    value={linkTargetId}
                    onChange={(event) => setLinkTargetId(event.target.value)}
                  >
                    {linkTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  disabled={!linkTargetId}
                  onClick={() =>
                    void createLink({
                      note_id: activeNote.id,
                      target_type: linkType,
                      target_id: linkTargetId
                    })
                  }
                >
                  Add link
                </Button>
                <div className={pageStyles.list}>
                  {links.map((link) => (
                    <div key={link.id} className={pageStyles.row}>
                      <span className={pageStyles.rowTitle}>{link.target_type.replace(/_/g, ' ')}</span>
                      <span className={pageStyles.rowMeta}>{link.target_id}</span>
                      <Button size="sm" variant="ghost" onClick={() => void deleteLink(link.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={pageStyles.emptyState}>
                <strong>Select a note</strong>
                <span>Its links and related records will appear here.</span>
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  )
}
