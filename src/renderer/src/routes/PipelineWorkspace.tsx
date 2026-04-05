import { useEffect, useMemo, useState } from 'react'
import { APPLICATION_STATUSES, ORGANIZATION_PRIORITIES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { usePipelineStore } from '@renderer/stores/pipelineStore'
import pageStyles from './CommandCenterPages.module.css'

type PipelineTab = 'organizations' | 'applications' | 'contacts' | 'interactions' | 'roles'

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
    createRole,
    updateRole,
    deleteRole,
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
  const [activeTab, setActiveTab] = useState<PipelineTab>('organizations')
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null)
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null)
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null)
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [applicationTitle, setApplicationTitle] = useState('')
  const [applicationOrgId, setApplicationOrgId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactOrgId, setContactOrgId] = useState('')
  const [interactionSummary, setInteractionSummary] = useState('')
  const [interactionContactId, setInteractionContactId] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [roleOrgId, setRoleOrgId] = useState('')

  const activeApplications = useMemo(
    () => applications.filter((entry) => entry.status !== 'rejected' && entry.status !== 'paused'),
    [applications]
  )

  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) ?? organizations[0] ?? null
  const activeApplication =
    applications.find((application) => application.id === activeApplicationId) ?? applications[0] ?? null
  const activeContact =
    contacts.find((contact) => contact.id === activeContactId) ?? contacts[0] ?? null
  const activeInteraction =
    interactions.find((interaction) => interaction.id === activeInteractionId) ?? interactions[0] ?? null
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0] ?? null

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    setApplicationOrgId((current) => current || organizations[0]?.id || '')
    setContactOrgId((current) => current || organizations[0]?.id || '')
    setRoleOrgId((current) => current || organizations[0]?.id || '')
    setInteractionContactId((current) => current || contacts[0]?.id || '')
    setActiveOrganizationId((current) => current || organizations[0]?.id || null)
    setActiveApplicationId((current) => current || applications[0]?.id || null)
    setActiveContactId((current) => current || contacts[0]?.id || null)
    setActiveInteractionId((current) => current || interactions[0]?.id || null)
    setActiveRoleId((current) => current || roles[0]?.id || null)
  }, [applications, contacts, interactions, organizations, roles])

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Pipeline</span>
          <h1 className={pageStyles.title}>Organizations, applications, and relationships</h1>
          <p className={pageStyles.description}>
            The pipeline should feel more like a calm CRM than a wall of cards. Work one collection
            at a time, then drill into the selected record.
          </p>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.metricStrip}>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Target organizations</span>
              <div className={pageStyles.metricValue}>{organizations.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Active applications</span>
              <div className={pageStyles.metricValue}>{activeApplications.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Tracked contacts</span>
              <div className={pageStyles.metricValue}>{contacts.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Interactions</span>
              <div className={pageStyles.metricValue}>{interactions.length}</div>
            </div>
          </div>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.tabs}>
            {([
              ['organizations', 'Organizations'],
              ['applications', 'Applications'],
              ['contacts', 'Contacts'],
              ['interactions', 'Interactions'],
              ['roles', 'Roles']
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                className={`${pageStyles.tab} ${activeTab === tab ? pageStyles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'organizations' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
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
                  <button
                    key={organization.id}
                    className={`${pageStyles.rowButton} ${organization.id === activeOrganization?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveOrganizationId(organization.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{organization.name}</span>
                    <span className={pageStyles.rowMeta}>
                      {organization.priority.replace(/_/g, ' ')}
                      {organization.location ? ` · ${organization.location}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeOrganization ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>{activeOrganization.name}</h2>
                      <p className={pageStyles.sectionDescription}>
                        Why this target belongs in the landscape and how important it is.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteOrganization(activeOrganization.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <InputField
                    label="Name"
                    defaultValue={activeOrganization.name}
                    onBlur={(event) =>
                      void updateOrganization({
                        id: activeOrganization.id,
                        name: event.target.value.trim() || activeOrganization.name
                      })
                    }
                  />
                  <div className={pageStyles.propertyGrid}>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Priority</span>
                      <select
                        value={activeOrganization.priority}
                        onChange={(event) =>
                          void updateOrganization({
                            id: activeOrganization.id,
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
                      defaultValue={activeOrganization.location ?? ''}
                      onBlur={(event) =>
                        void updateOrganization({
                          id: activeOrganization.id,
                          location: event.target.value.trim() || null
                        })
                      }
                    />
                  </div>
                  <TextareaField
                    label="Why fit"
                    rows={4}
                    defaultValue={activeOrganization.why_fit ?? ''}
                    onBlur={(event) =>
                      void updateOrganization({
                        id: activeOrganization.id,
                        why_fit: event.target.value.trim() || null
                      })
                    }
                  />
                  <TextareaField
                    label="Notes"
                    rows={4}
                    defaultValue={activeOrganization.notes ?? ''}
                    onBlur={(event) =>
                      void updateOrganization({
                        id: activeOrganization.id,
                        notes: event.target.value.trim() || null
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No organizations yet</strong>
                  <span>Add the landscape first so the pipeline has a destination.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'applications' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
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
                  Add
                </Button>
              </div>
              <div className={pageStyles.list}>
                {applications.map((application) => (
                  <button
                    key={application.id}
                    className={`${pageStyles.rowButton} ${application.id === activeApplication?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveApplicationId(application.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{application.title}</span>
                    <span className={pageStyles.rowMeta}>{application.status.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeApplication ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>{activeApplication.title}</h2>
                      <p className={pageStyles.sectionDescription}>
                        Track status, follow-up, and the notes that keep an application operational.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteApplication(activeApplication.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <InputField
                    label="Title"
                    defaultValue={activeApplication.title}
                    onBlur={(event) =>
                      void updateApplication({
                        id: activeApplication.id,
                        title: event.target.value.trim() || activeApplication.title
                      })
                    }
                  />
                  <div className={pageStyles.propertyGrid}>
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Status</span>
                      <select
                        value={activeApplication.status}
                        onChange={(event) =>
                          void updateApplication({
                            id: activeApplication.id,
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
                      label="Follow-up date"
                      type="date"
                      defaultValue={
                        activeApplication.follow_up_at
                          ? new Date(activeApplication.follow_up_at).toISOString().slice(0, 10)
                          : ''
                      }
                      onBlur={(event) =>
                        void updateApplication({
                          id: activeApplication.id,
                          follow_up_at: event.target.value
                            ? new Date(`${event.target.value}T00:00:00.000Z`).getTime()
                            : null
                        })
                      }
                    />
                  </div>
                  <TextareaField
                    label="Notes"
                    rows={6}
                    defaultValue={activeApplication.notes ?? ''}
                    onBlur={(event) =>
                      void updateApplication({
                        id: activeApplication.id,
                        notes: event.target.value.trim() || null
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No applications yet</strong>
                  <span>Start adding targets once the organization list is in place.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'contacts' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
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
                  Add
                </Button>
              </div>
              <div className={pageStyles.list}>
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    className={`${pageStyles.rowButton} ${contact.id === activeContact?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveContactId(contact.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{contact.full_name}</span>
                    <span className={pageStyles.rowMeta}>
                      {contact.role_title ?? 'Role not set'}
                      {contact.relationship_stage ? ` · ${contact.relationship_stage}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeContact ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>{activeContact.full_name}</h2>
                      <p className={pageStyles.sectionDescription}>
                        Relationship context, title, and links stay together here.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteContact(activeContact.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <InputField
                    label="Name"
                    defaultValue={activeContact.full_name}
                    onBlur={(event) =>
                      void updateContact({
                        id: activeContact.id,
                        full_name: event.target.value.trim() || activeContact.full_name
                      })
                    }
                  />
                  <div className={pageStyles.propertyGrid}>
                    <InputField
                      label="Role"
                      defaultValue={activeContact.role_title ?? ''}
                      onBlur={(event) =>
                        void updateContact({
                          id: activeContact.id,
                          role_title: event.target.value.trim() || null
                        })
                      }
                    />
                    <InputField
                      label="Relationship stage"
                      defaultValue={activeContact.relationship_stage ?? ''}
                      onBlur={(event) =>
                        void updateContact({
                          id: activeContact.id,
                          relationship_stage: event.target.value.trim() || null
                        })
                      }
                    />
                  </div>
                  <div className={pageStyles.propertyGrid}>
                    <InputField
                      label="Platform"
                      defaultValue={activeContact.platform ?? ''}
                      onBlur={(event) =>
                        void updateContact({
                          id: activeContact.id,
                          platform: event.target.value.trim() || null
                        })
                      }
                    />
                    <InputField
                      label="Profile URL"
                      defaultValue={activeContact.profile_url ?? ''}
                      onBlur={(event) =>
                        void updateContact({
                          id: activeContact.id,
                          profile_url: event.target.value.trim() || null
                        })
                      }
                    />
                  </div>
                  <TextareaField
                    label="Notes"
                    rows={6}
                    defaultValue={activeContact.notes ?? ''}
                    onBlur={(event) =>
                      void updateContact({
                        id: activeContact.id,
                        notes: event.target.value.trim() || null
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No contacts yet</strong>
                  <span>Use this space as a lightweight relationship layer, not a spreadsheet dump.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'interactions' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
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
                <InputField
                  placeholder="Capture outreach, replies, calls, or context"
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
                  Log
                </Button>
              </div>
              <div className={pageStyles.list}>
                {interactions.map((interaction) => (
                  <button
                    key={interaction.id}
                    className={`${pageStyles.rowButton} ${interaction.id === activeInteraction?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveInteractionId(interaction.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{interaction.summary}</span>
                    <span className={pageStyles.rowMeta}>
                      {new Date(interaction.happened_at).toLocaleDateString('en-IE')}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeInteraction ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>Interaction detail</h2>
                      <p className={pageStyles.sectionDescription}>
                        Keep the note short and the next move obvious.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteInteraction(activeInteraction.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <TextareaField
                    label="Summary"
                    rows={6}
                    defaultValue={activeInteraction.summary}
                    onBlur={(event) =>
                      void updateInteraction({
                        id: activeInteraction.id,
                        summary: event.target.value.trim() || activeInteraction.summary
                      })
                    }
                  />
                  <InputField
                    label="Next action date"
                    type="date"
                    defaultValue={
                      activeInteraction.next_action_at
                        ? new Date(activeInteraction.next_action_at).toISOString().slice(0, 10)
                        : ''
                    }
                    onBlur={(event) =>
                      void updateInteraction({
                        id: activeInteraction.id,
                        next_action_at: event.target.value
                          ? new Date(`${event.target.value}T00:00:00.000Z`).getTime()
                          : null
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No interactions yet</strong>
                  <span>Capture outreach and responses here so follow-ups stop leaking out of memory.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'roles' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
                <InputField
                  placeholder="Target role title"
                  value={roleTitle}
                  onChange={(event) => setRoleTitle(event.target.value)}
                />
                <label className={pageStyles.formGrid}>
                  <span className={pageStyles.eyebrow}>Organization</span>
                  <select value={roleOrgId} onChange={(event) => setRoleOrgId(event.target.value)}>
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
                    void createRole({ title: roleTitle, organization_id: roleOrgId || null }).then(
                      () => setRoleTitle('')
                    )
                  }
                >
                  Add
                </Button>
              </div>
              <div className={pageStyles.list}>
                {roles.map((role) => (
                  <button
                    key={role.id}
                    className={`${pageStyles.rowButton} ${role.id === activeRole?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveRoleId(role.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{role.title}</span>
                    <span className={pageStyles.rowMeta}>
                      {role.location ?? 'Location not set'}
                      {role.season ? ` · ${role.season}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeRole ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>{activeRole.title}</h2>
                      <p className={pageStyles.sectionDescription}>
                        Capture what shape of role you are actually targeting.
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => void deleteRole(activeRole.id)}>
                      Remove
                    </Button>
                  </div>
                  <InputField
                    label="Title"
                    defaultValue={activeRole.title}
                    onBlur={(event) =>
                      void updateRole({
                        id: activeRole.id,
                        title: event.target.value.trim() || activeRole.title
                      })
                    }
                  />
                  <div className={pageStyles.propertyGrid}>
                    <InputField
                      label="Location"
                      defaultValue={activeRole.location ?? ''}
                      onBlur={(event) =>
                        void updateRole({
                          id: activeRole.id,
                          location: event.target.value.trim() || null
                        })
                      }
                    />
                    <InputField
                      label="Season"
                      defaultValue={activeRole.season ?? ''}
                      onBlur={(event) =>
                        void updateRole({
                          id: activeRole.id,
                          season: event.target.value.trim() || null
                        })
                      }
                    />
                  </div>
                  <InputField
                    label="Role type"
                    defaultValue={activeRole.role_type ?? ''}
                    onBlur={(event) =>
                      void updateRole({
                        id: activeRole.id,
                        role_type: event.target.value.trim() || null
                      })
                    }
                  />
                  <TextareaField
                    label="Notes"
                    rows={6}
                    defaultValue={activeRole.notes ?? ''}
                    onBlur={(event) =>
                      void updateRole({
                        id: activeRole.id,
                        notes: event.target.value.trim() || null
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No roles yet</strong>
                  <span>Formalize the role shapes you want after the landscape starts to settle.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}
      </div>
    </div>
  )
}
