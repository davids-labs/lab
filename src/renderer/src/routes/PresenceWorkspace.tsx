import { useEffect, useMemo, useState } from 'react'
import { CONTENT_STATUSES, PRESENCE_ASSET_STATUSES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { useExportStore } from '@renderer/stores/exportStore'
import { usePresenceStore } from '@renderer/stores/presenceStore'
import { useToastStore } from '@renderer/stores/toastStore'
import pageStyles from './CommandCenterPages.module.css'

type PresenceTab = 'fragments' | 'assets' | 'cvs' | 'content'

export function PresenceWorkspace(): JSX.Element {
  const { generatePack } = useExportStore()
  const pushToast = useToastStore((state) => state.push)
  const {
    narrativeFragments,
    profileAssets,
    cvVariants,
    contentIdeas,
    contentPosts,
    loadAll,
    createNarrativeFragment,
    updateNarrativeFragment,
    deleteNarrativeFragment,
    createProfileAsset,
    updateProfileAsset,
    deleteProfileAsset,
    createCvVariant,
    updateCvVariant,
    deleteCvVariant,
    createContentIdea,
    updateContentIdea,
    deleteContentIdea,
    createContentPost,
    updateContentPost,
    deleteContentPost
  } = usePresenceStore()
  const [activeTab, setActiveTab] = useState<PresenceTab>('fragments')
  const [activeFragmentId, setActiveFragmentId] = useState<string | null>(null)
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
  const [activeCvId, setActiveCvId] = useState<string | null>(null)
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null)
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [fragmentTitle, setFragmentTitle] = useState('')
  const [assetTitle, setAssetTitle] = useState('')
  const [cvTitle, setCvTitle] = useState('')
  const [ideaTitle, setIdeaTitle] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    setActiveFragmentId((current) => current || narrativeFragments[0]?.id || null)
    setActiveAssetId((current) => current || profileAssets[0]?.id || null)
    setActiveCvId((current) => current || cvVariants[0]?.id || null)
    setActiveIdeaId((current) => current || contentIdeas[0]?.id || null)
    setActivePostId((current) => current || contentPosts[0]?.id || null)
  }, [contentIdeas, contentPosts, cvVariants, narrativeFragments, profileAssets])

  const activeFragment =
    narrativeFragments.find((fragment) => fragment.id === activeFragmentId) ??
    narrativeFragments[0] ??
    null
  const activeAsset =
    profileAssets.find((asset) => asset.id === activeAssetId) ?? profileAssets[0] ?? null
  const activeCv = cvVariants.find((variant) => variant.id === activeCvId) ?? cvVariants[0] ?? null
  const activeIdea =
    contentIdeas.find((idea) => idea.id === activeIdeaId) ?? contentIdeas[0] ?? null
  const activePost =
    contentPosts.find((post) => post.id === activePostId) ?? contentPosts[0] ?? null
  const openIdeaCount = useMemo(
    () => contentIdeas.filter((entry) => entry.status !== 'posted').length,
    [contentIdeas]
  )

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.lead}>
          <span className={pageStyles.eyebrow}>Presence</span>
          <h1 className={pageStyles.title}>Public signal studio</h1>
          <p className={pageStyles.description}>
            Presence should feel editorial, not form-heavy: one collection at a time, one selected
            asset at a time, with strategy and proof feeding the material underneath.
          </p>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.metricStrip}>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Narrative fragments</span>
              <div className={pageStyles.metricValue}>{narrativeFragments.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Profile assets</span>
              <div className={pageStyles.metricValue}>{profileAssets.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>CV variants</span>
              <div className={pageStyles.metricValue}>{cvVariants.length}</div>
            </div>
            <div className={pageStyles.metric}>
              <span className={pageStyles.muted}>Open ideas</span>
              <div className={pageStyles.metricValue}>{openIdeaCount}</div>
            </div>
          </div>
          <div className={pageStyles.inlineActions}>
            <Button
              variant="outline"
              onClick={() =>
                void generatePack({ target: 'narrative_signal', format: 'markdown' }).then(() =>
                  pushToast({ message: 'Generated narrative signal pack.', type: 'success' })
                )
              }
            >
              Export narrative packet
            </Button>
          </div>
        </section>

        <section className={pageStyles.section}>
          <div className={pageStyles.tabs}>
            {([
              ['fragments', 'Narrative'],
              ['assets', 'Profile assets'],
              ['cvs', 'CVs'],
              ['content', 'Content']
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

        {activeTab === 'fragments' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
                <InputField
                  placeholder="Add headline, about, story, or proof fragment"
                  value={fragmentTitle}
                  onChange={(event) => setFragmentTitle(event.target.value)}
                />
                <Button
                  onClick={() =>
                    void createNarrativeFragment({
                      title: fragmentTitle,
                      fragment_type: 'story',
                      body: ''
                    }).then(() => setFragmentTitle(''))
                  }
                >
                  Add
                </Button>
              </div>
              <div className={pageStyles.list}>
                {narrativeFragments.map((fragment) => (
                  <button
                    key={fragment.id}
                    className={`${pageStyles.rowButton} ${fragment.id === activeFragment?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveFragmentId(fragment.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{fragment.title}</span>
                    <span className={pageStyles.rowMeta}>{fragment.fragment_type}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeFragment ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>{activeFragment.title}</h2>
                      <p className={pageStyles.sectionDescription}>
                        Use short narrative fragments as reusable building blocks for LinkedIn,
                        portfolio copy, and recruiter-facing language.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteNarrativeFragment(activeFragment.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <InputField
                    label="Title"
                    defaultValue={activeFragment.title}
                    onBlur={(event) =>
                      void updateNarrativeFragment({
                        id: activeFragment.id,
                        title: event.target.value.trim() || activeFragment.title
                      })
                    }
                  />
                  <InputField
                    label="Type"
                    defaultValue={activeFragment.fragment_type}
                    onBlur={(event) =>
                      void updateNarrativeFragment({
                        id: activeFragment.id,
                        fragment_type: event.target.value.trim() || activeFragment.fragment_type
                      })
                    }
                  />
                  <TextareaField
                    label="Body"
                    rows={8}
                    defaultValue={activeFragment.body}
                    onBlur={(event) =>
                      void updateNarrativeFragment({
                        id: activeFragment.id,
                        body: event.target.value
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No fragments yet</strong>
                  <span>Start by collecting the small pieces of narrative you want to reuse everywhere.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'assets' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
                <InputField
                  placeholder="LinkedIn About, recruiter bio, portfolio summary..."
                  value={assetTitle}
                  onChange={(event) => setAssetTitle(event.target.value)}
                />
                <Button
                  onClick={() =>
                    void createProfileAsset({
                      title: assetTitle,
                      platform: 'linkedin',
                      content: ''
                    }).then(() => setAssetTitle(''))
                  }
                >
                  Add
                </Button>
              </div>
              <div className={pageStyles.list}>
                {profileAssets.map((asset) => (
                  <button
                    key={asset.id}
                    className={`${pageStyles.rowButton} ${asset.id === activeAsset?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveAssetId(asset.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{asset.title}</span>
                    <span className={pageStyles.rowMeta}>
                      {asset.platform} · {asset.status}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeAsset ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>{activeAsset.title}</h2>
                      <p className={pageStyles.sectionDescription}>
                        Treat each asset like a publishable document with a platform and readiness state.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteProfileAsset(activeAsset.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <InputField
                    label="Title"
                    defaultValue={activeAsset.title}
                    onBlur={(event) =>
                      void updateProfileAsset({
                        id: activeAsset.id,
                        title: event.target.value.trim() || activeAsset.title
                      })
                    }
                  />
                  <div className={pageStyles.propertyGrid}>
                    <InputField
                      label="Platform"
                      defaultValue={activeAsset.platform}
                      onBlur={(event) =>
                        void updateProfileAsset({
                          id: activeAsset.id,
                          platform: event.target.value.trim() || activeAsset.platform
                        })
                      }
                    />
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Status</span>
                      <select
                        value={activeAsset.status}
                        onChange={(event) =>
                          void updateProfileAsset({
                            id: activeAsset.id,
                            status: event.target.value as (typeof PRESENCE_ASSET_STATUSES)[number]
                          })
                        }
                      >
                        {PRESENCE_ASSET_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <TextareaField
                    label="Content"
                    rows={8}
                    defaultValue={activeAsset.content}
                    onBlur={(event) =>
                      void updateProfileAsset({
                        id: activeAsset.id,
                        content: event.target.value
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No profile assets yet</strong>
                  <span>Create the recruiter-facing assets you want ready on demand.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'cvs' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
                <InputField
                  placeholder="Apple PD Intern CV"
                  value={cvTitle}
                  onChange={(event) => setCvTitle(event.target.value)}
                />
                <Button
                  onClick={() =>
                    void createCvVariant({ title: cvTitle, content: '' }).then(() => setCvTitle(''))
                  }
                >
                  Add
                </Button>
              </div>
              <div className={pageStyles.list}>
                {cvVariants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`${pageStyles.rowButton} ${variant.id === activeCv?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveCvId(variant.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{variant.title}</span>
                    <span className={pageStyles.rowMeta}>{variant.target_role ?? 'No target role yet'}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              {activeCv ? (
                <div className={pageStyles.document}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h2 className={pageStyles.sectionTitle}>{activeCv.title}</h2>
                      <p className={pageStyles.sectionDescription}>
                        Keep each CV variant tied to a role shape and supporting summary.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteCvVariant(activeCv.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <InputField
                    label="Title"
                    defaultValue={activeCv.title}
                    onBlur={(event) =>
                      void updateCvVariant({
                        id: activeCv.id,
                        title: event.target.value.trim() || activeCv.title
                      })
                    }
                  />
                  <InputField
                    label="Target role"
                    defaultValue={activeCv.target_role ?? ''}
                    onBlur={(event) =>
                      void updateCvVariant({
                        id: activeCv.id,
                        target_role: event.target.value.trim() || null
                      })
                    }
                  />
                  <TextareaField
                    label="Summary"
                    rows={3}
                    defaultValue={activeCv.summary ?? ''}
                    onBlur={(event) =>
                      void updateCvVariant({
                        id: activeCv.id,
                        summary: event.target.value.trim() || null
                      })
                    }
                  />
                  <TextareaField
                    label="Content"
                    rows={10}
                    defaultValue={activeCv.content}
                    onBlur={(event) =>
                      void updateCvVariant({
                        id: activeCv.id,
                        content: event.target.value
                      })
                    }
                  />
                </div>
              ) : (
                <div className={pageStyles.emptyState}>
                  <strong>No CV variants yet</strong>
                  <span>Build targeted versions instead of forcing one resume to do every job.</span>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'content' ? (
          <section className={pageStyles.collectionLayout}>
            <article className={pageStyles.section}>
              <div className={pageStyles.inlineActions}>
                <InputField
                  placeholder="Add content idea"
                  value={ideaTitle}
                  onChange={(event) => setIdeaTitle(event.target.value)}
                />
                <Button
                  onClick={() =>
                    void createContentIdea({ title: ideaTitle, status: 'backlog' }).then(() =>
                      setIdeaTitle('')
                    )
                  }
                >
                  Add idea
                </Button>
              </div>
              <div className={pageStyles.list}>
                {contentIdeas.map((idea) => (
                  <button
                    key={idea.id}
                    className={`${pageStyles.rowButton} ${idea.id === activeIdea?.id ? pageStyles.rowActive : ''}`}
                    onClick={() => setActiveIdeaId(idea.id)}
                    type="button"
                  >
                    <span className={pageStyles.rowTitle}>{idea.title}</span>
                    <span className={pageStyles.rowMeta}>{idea.status}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className={pageStyles.section}>
              <div className={pageStyles.document}>
                <div className={pageStyles.sectionHeader}>
                  <div>
                    <h2 className={pageStyles.sectionTitle}>Content engine</h2>
                    <p className={pageStyles.sectionDescription}>
                      Use ideas as the backlog and draft posts as the concrete output layer.
                    </p>
                  </div>
                </div>
                {activeIdea ? (
                  <>
                    <InputField
                      label="Idea title"
                      defaultValue={activeIdea.title}
                      onBlur={(event) =>
                        void updateContentIdea({
                          id: activeIdea.id,
                          title: event.target.value.trim() || activeIdea.title
                        })
                      }
                    />
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Status</span>
                      <select
                        value={activeIdea.status}
                        onChange={(event) =>
                          void updateContentIdea({
                            id: activeIdea.id,
                            status: event.target.value as (typeof CONTENT_STATUSES)[number]
                          })
                        }
                      >
                        {CONTENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <InputField
                      label="Angle"
                      defaultValue={activeIdea.angle ?? ''}
                      onBlur={(event) =>
                        void updateContentIdea({
                          id: activeIdea.id,
                          angle: event.target.value.trim() || null
                        })
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteContentIdea(activeIdea.id)}
                    >
                      Remove idea
                    </Button>
                  </>
                ) : (
                  <div className={pageStyles.emptyState}>
                    <strong>No ideas yet</strong>
                    <span>Add ideas here, then turn the strongest ones into actual posts below.</span>
                  </div>
                )}
                <div className={pageStyles.documentSection}>
                  <div className={pageStyles.sectionHeader}>
                    <div>
                      <h3 className={pageStyles.sectionTitle}>Draft posts</h3>
                      <p className={pageStyles.sectionDescription}>
                        Keep the content backlog and actual publish drafts separate.
                      </p>
                    </div>
                  </div>
                  <InputField
                    placeholder="Draft post title"
                    value={postTitle}
                    onChange={(event) => setPostTitle(event.target.value)}
                  />
                  <TextareaField
                    placeholder="Draft LinkedIn or portfolio post body"
                    rows={6}
                    value={postBody}
                    onChange={(event) => setPostBody(event.target.value)}
                  />
                  <Button
                    onClick={() =>
                      void createContentPost({
                        title: postTitle,
                        channel: 'linkedin',
                        body: postBody,
                        status: 'draft'
                      }).then(() => {
                        setPostTitle('')
                        setPostBody('')
                      })
                    }
                  >
                    Save draft post
                  </Button>
                  <div className={pageStyles.list}>
                    {contentPosts.map((post) => (
                      <button
                        key={post.id}
                        className={`${pageStyles.rowButton} ${post.id === activePost?.id ? pageStyles.rowActive : ''}`}
                        onClick={() => setActivePostId(post.id)}
                        type="button"
                      >
                        <span className={pageStyles.rowTitle}>{post.title}</span>
                        <span className={pageStyles.rowMeta}>{post.channel} · {post.status}</span>
                      </button>
                    ))}
                  </div>
                  {activePost ? (
                    <div className={pageStyles.documentSection}>
                      <InputField
                        label="Selected draft title"
                        defaultValue={activePost.title}
                        onBlur={(event) =>
                          void updateContentPost({
                            id: activePost.id,
                            title: event.target.value.trim() || activePost.title
                          })
                        }
                      />
                      <InputField
                        label="Channel"
                        defaultValue={activePost.channel}
                        onBlur={(event) =>
                          void updateContentPost({
                            id: activePost.id,
                            channel: event.target.value.trim() || activePost.channel
                          })
                        }
                      />
                      <TextareaField
                        label="Body"
                        rows={8}
                        defaultValue={activePost.body}
                        onBlur={(event) =>
                          void updateContentPost({
                            id: activePost.id,
                            body: event.target.value
                          })
                        }
                      />
                      <div className={pageStyles.inlineActions}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteContentPost(activePost.id)}
                        >
                          Remove draft
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          </section>
        ) : null}
      </div>
    </div>
  )
}
