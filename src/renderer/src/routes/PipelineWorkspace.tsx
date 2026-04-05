import { useEffect, useMemo, useState } from 'react'
import { APPLICATION_STATUSES, ORGANIZATION_PRIORITIES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import pageStyles from './CommandCenterPages.module.css'

export function PipelineWorkspace(): JSX.Element {
  const {
    organizations,
    roles,
    applications,
    contacts,
    interactions,
    loadAll,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    createApplication,
    updateApplication,
    deleteApplication,
    createContact,
    updateContact,
    deleteContact,
    createInteraction,
    updateInteraction,
    deleteInteraction
  } = usePipelineStore()
  const [orgName, setOrgName] = useState('')
  const [applicationTitle, setApplicationTitle] = useState('')
  const [applicationOrgId, setApplicationOrgId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactOrgId, setContactOrgId] = useState('')
  const [interactionSummary, setInteractionSummary] = useState('')
  const [interactionContactId, setInteractionContactId] = useState('')
  const activeApplications = useMemo(
    () => applications.filter((entry) => entry.status !== 'rejected' && entry.status !== 'paused'),
    [applications]
  )

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    setApplicationOrgId((current) => current || organizations[0]?.id || '')
    setContactOrgId((current) => current || organizations[0]?.id || '')
    setInteractionContactId((current) => current || contacts[0]?.id || '')
  }, [contacts, organizations])

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Pipeline</span>
          <h1 className={pageStyles.title}>Career Engine</h1>
          <p className={pageStyles.description}>
            Track target organizations, roles, applications, relationships, and follow-ups in one
            place so opportunities stay operational instead of abstract.
          </p>
        </section>

        <section className={pageStyles.grid3}>
          <article className={pageStyles.card}>
            <span className={pageStyles.muted}>Target Organizations</span>
            <div className={pageStyles.metricValue}>{organizations.length}</div>
          </article>
          <article className={pageStyles.card}>
            <span className={pageStyles.muted}>Active Applications</span>
            <div className={pageStyles.metricValue}>{activeApplications.length}</div>
          </article>
          <article className={pageStyles.card}>
            <span className={pageStyles.muted}>Tracked Contacts</span>
            <div className={pageStyles.metricValue}>{contacts.length}</div>
          </article>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Target Organizations</h2>
              <span className={pageStyles.pill}>{organizations.length}</span>
            </div>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="Add target organization"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
              />
              <Button
                onClick={() =>
                  void createOrganization({
                    name: orgName,
                    priority: organizations.length === 0 ? 'north_star' : 'high'
                  }).then(() => setOrgName(''))
                }
              >
                Add
              </Button>
            </div>
            <div className={pageStyles.list}>
              {organizations.map((organization) => (
                <div key={organization.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={organization.name}
                    onBlur={(event) =>
                      void updateOrganization({
                        id: organization.id,
                        name: event.target.value.trim() || organization.name
                      })
                    }
                  />
                  <div className={pageStyles.grid2}>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Priority</span>
                      <select
                        value={organization.priority}
                        onChange={(event) =>
                          void updateOrganization({
                            id: organization.id,
                            priority: event.target.value as (typeof ORGANIZATION_PRIORITIES)[number]
                          })
                        }
                      >
                        {ORGANIZATION_PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <InputField
                      label="Location"
                      defaultValue={organization.location ?? ''}
                      onBlur={(event) =>
                        void updateOrganization({
                          id: organization.id,
                          location: event.target.value.trim() || null
                        })
                      }
                    />
                  </div>
                  <TextareaField
                    label="Why fit"
                    rows={2}
                    defaultValue={organization.why_fit ?? ''}
                    onBlur={(event) =>
                      void updateOrganization({
                        id: organization.id,
                        why_fit: event.target.value.trim() || null
                      })
                    }
                  />
                  <div className={pageStyles.inlineRow}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteOrganization(organization.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Applications</h2>
              <span className={pageStyles.pill}>{applications.length}</span>
            </div>
            <div className={pageStyles.formGrid}>
              <InputField
                placeholder="Application title"
                value={applicationTitle}
                onChange={(event) => setApplicationTitle(event.target.value)}
              />
              <label className={pageStyles.formGrid}>
                <span className={pageStyles.eyebrow}>Organization</span>
                <select
                  value={applicationOrgId}
                  onChange={(event) => setApplicationOrgId(event.target.value)}
                >
                  <option value="">No organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                onClick={() =>
                  void createApplication({
                    title: applicationTitle,
                    organization_id: applicationOrgId || null,
                    status: 'target'
                  }).then(() => setApplicationTitle(''))
                }
              >
                Add Application
              </Button>
            </div>
            <div className={pageStyles.list}>
              {applications.map((application) => (
                <div key={application.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={application.title}
                    onBlur={(event) =>
                      void updateApplication({
                        id: application.id,
                        title: event.target.value.trim() || application.title
                      })
                    }
                  />
                  <div className={pageStyles.grid2}>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Status</span>
                      <select
                        value={application.status}
                        onChange={(event) =>
                          void updateApplication({
                            id: application.id,
                            status: event.target.value as (typeof APPLICATION_STATUSES)[number]
                          })
                        }
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <InputField
                      label="Follow-up Date"
                      type="date"
                      defaultValue={
                        application.follow_up_at
                          ? new Date(application.follow_up_at).toISOString().slice(0, 10)
                          : ''
                      }
                      onBlur={(event) =>
                        void updateApplication({
                          id: application.id,
                          follow_up_at: event.target.value
                            ? new Date(`${event.target.value}T00:00:00.000Z`).getTime()
                            : null
                        })
                      }
                    />
                  </div>
                  <div className={pageStyles.inlineRow}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteApplication(application.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Relationships</h2>
              <span className={pageStyles.pill}>{contacts.length}</span>
            </div>
            <div className={pageStyles.formGrid}>
              <InputField
                placeholder="Contact name"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
              />
              <label className={pageStyles.formGrid}>
                <span className={pageStyles.eyebrow}>Organization</span>
                <select
                  value={contactOrgId}
                  onChange={(event) => setContactOrgId(event.target.value)}
                >
                  <option value="">No organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                onClick={() =>
                  void createContact({
                    full_name: contactName,
                    organization_id: contactOrgId || null,
                    relationship_stage: 'new'
                  }).then(() => setContactName(''))
                }
              >
                Add Contact
              </Button>
            </div>
            <div className={pageStyles.list}>
              {contacts.map((contact) => (
                <div key={contact.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={contact.full_name}
                    onBlur={(event) =>
                      void updateContact({
                        id: contact.id,
                        full_name: event.target.value.trim() || contact.full_name
                      })
                    }
                  />
                  <div className={pageStyles.grid2}>
                    <InputField
                      label="Role"
                      defaultValue={contact.role_title ?? ''}
                      onBlur={(event) =>
                        void updateContact({
                          id: contact.id,
                          role_title: event.target.value.trim() || null
                        })
                      }
                    />
                    <InputField
                      label="Relationship Stage"
                      defaultValue={contact.relationship_stage ?? ''}
                      onBlur={(event) =>
                        void updateContact({
                          id: contact.id,
                          relationship_stage: event.target.value.trim() || null
                        })
                      }
                    />
                  </div>
                  <div className={pageStyles.inlineRow}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteContact(contact.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Interaction Log</h2>
              <span className={pageStyles.pill}>{interactions.length}</span>
            </div>
            <div className={pageStyles.formGrid}>
              <label className={pageStyles.formGrid}>
                <span className={pageStyles.eyebrow}>Contact</span>
                <select
                  value={interactionContactId}
                  onChange={(event) => setInteractionContactId(event.target.value)}
                >
                  <option value="">No contact selected</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <TextareaField
                placeholder="Capture outreach, replies, calls, or useful context"
                rows={3}
                value={interactionSummary}
                onChange={(event) => setInteractionSummary(event.target.value)}
              />
              <Button
                onClick={() =>
                  void createInteraction({
                    contact_id: interactionContactId,
                    interaction_type: 'note',
                    summary: interactionSummary
                  }).then(() => setInteractionSummary(''))
                }
              >
                Log Interaction
              </Button>
            </div>
            <div className={pageStyles.list}>
              {interactions.slice(0, 8).map((interaction) => (
                <div key={interaction.id} className={pageStyles.listRow}>
                  <TextareaField
                    rows={2}
                    defaultValue={interaction.summary}
                    onBlur={(event) =>
                      void updateInteraction({
                        id: interaction.id,
                        summary: event.target.value.trim() || interaction.summary
                      })
                    }
                  />
                  <span className={pageStyles.muted}>
                    {new Date(interaction.happened_at).toLocaleDateString('en-IE')}
                  </span>
                  <div className={pageStyles.inlineRow}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteInteraction(interaction.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={pageStyles.card}>
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.cardTitle}>Role Intelligence</h2>
            <span className={pageStyles.pill}>{roles.length}</span>
          </div>
          <div className={pageStyles.list}>
            {roles.length > 0 ? (
              roles.map((role) => (
                <div key={role.id} className={pageStyles.listRow}>
                  <strong>{role.title}</strong>
                  <span className={pageStyles.muted}>
                    {role.location ?? 'Location not set'}
                    {role.season ? ` · ${role.season}` : ''}
                  </span>
                </div>
              ))
            ) : (
              <div className={pageStyles.listRow}>
                <strong>No target roles yet</strong>
                <span className={pageStyles.muted}>
                  Add organizations and applications first, then formalize the role shapes you want
                  to target.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
