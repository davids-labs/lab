import { useEffect, useState } from 'react'
import { CONTENT_STATUSES, PRESENCE_ASSET_STATUSES } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField, TextareaField } from '@renderer/components/ui/InputField'
import { usePresenceStore } from '@renderer/stores/presenceStore'
import pageStyles from './CommandCenterPages.module.css'

export function PresenceWorkspace(): JSX.Element {
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
  const [fragmentTitle, setFragmentTitle] = useState('')
  const [assetTitle, setAssetTitle] = useState('')
  const [cvTitle, setCvTitle] = useState('')
  const [ideaTitle, setIdeaTitle] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.stack}>
        <section className={pageStyles.hero}>
          <span className={pageStyles.eyebrow}>Presence</span>
          <h1 className={pageStyles.title}>Public Signal</h1>
          <p className={pageStyles.description}>
            Turn proof and strategy into recruiter-facing assets: narratives, LinkedIn material, CV
            variants, and publishable content ideas.
          </p>
        </section>

        <section className={pageStyles.grid3}>
          <article className={pageStyles.card}>
            <span className={pageStyles.muted}>Narrative Fragments</span>
            <div className={pageStyles.metricValue}>{narrativeFragments.length}</div>
          </article>
          <article className={pageStyles.card}>
            <span className={pageStyles.muted}>Profile Assets</span>
            <div className={pageStyles.metricValue}>{profileAssets.length}</div>
          </article>
          <article className={pageStyles.card}>
            <span className={pageStyles.muted}>Open Content Ideas</span>
            <div className={pageStyles.metricValue}>
              {contentIdeas.filter((entry) => entry.status !== 'posted').length}
            </div>
          </article>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Narrative Fragments</h2>
              <span className={pageStyles.pill}>{narrativeFragments.length}</span>
            </div>
            <div className={pageStyles.inlineRow}>
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
                <div key={fragment.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={fragment.title}
                    onBlur={(event) =>
                      void updateNarrativeFragment({
                        id: fragment.id,
                        title: event.target.value.trim() || fragment.title
                      })
                    }
                  />
                  <InputField
                    label="Type"
                    defaultValue={fragment.fragment_type}
                    onBlur={(event) =>
                      void updateNarrativeFragment({
                        id: fragment.id,
                        fragment_type: event.target.value.trim() || fragment.fragment_type
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void deleteNarrativeFragment(fragment.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Profile Assets</h2>
              <span className={pageStyles.pill}>{profileAssets.length}</span>
            </div>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="LinkedIn About, Portfolio Summary, Recruiter Bio..."
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
                <div key={asset.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={asset.title}
                    onBlur={(event) =>
                      void updateProfileAsset({
                        id: asset.id,
                        title: event.target.value.trim() || asset.title
                      })
                    }
                  />
                  <div className={pageStyles.grid2}>
                    <InputField
                      label="Platform"
                      defaultValue={asset.platform}
                      onBlur={(event) =>
                        void updateProfileAsset({
                          id: asset.id,
                          platform: event.target.value.trim() || asset.platform
                        })
                      }
                    />
                    <label className={pageStyles.formGrid}>
                      <span className={pageStyles.eyebrow}>Status</span>
                      <select
                        value={asset.status}
                        onChange={(event) =>
                          void updateProfileAsset({
                            id: asset.id,
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void deleteProfileAsset(asset.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={pageStyles.grid2}>
          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>CV Variants</h2>
              <span className={pageStyles.pill}>{cvVariants.length}</span>
            </div>
            <div className={pageStyles.inlineRow}>
              <InputField
                placeholder="Apple PD Intern CV"
                value={cvTitle}
                onChange={(event) => setCvTitle(event.target.value)}
              />
              <Button
                onClick={() =>
                  void createCvVariant({
                    title: cvTitle,
                    content: ''
                  }).then(() => setCvTitle(''))
                }
              >
                Add CV
              </Button>
            </div>
            <div className={pageStyles.list}>
              {cvVariants.map((variant) => (
                <div key={variant.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={variant.title}
                    onBlur={(event) =>
                      void updateCvVariant({
                        id: variant.id,
                        title: event.target.value.trim() || variant.title
                      })
                    }
                  />
                  <InputField
                    label="Target role"
                    defaultValue={variant.target_role ?? ''}
                    onBlur={(event) =>
                      void updateCvVariant({
                        id: variant.id,
                        target_role: event.target.value.trim() || null
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void deleteCvVariant(variant.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </article>

          <article className={pageStyles.card}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.cardTitle}>Content Engine</h2>
              <span className={pageStyles.pill}>{contentIdeas.length} ideas</span>
            </div>
            <div className={pageStyles.formGrid}>
              <InputField
                placeholder="Add content idea"
                value={ideaTitle}
                onChange={(event) => setIdeaTitle(event.target.value)}
              />
              <Button
                onClick={() =>
                  void createContentIdea({
                    title: ideaTitle,
                    status: 'backlog'
                  }).then(() => setIdeaTitle(''))
                }
              >
                Add Idea
              </Button>
              <InputField
                placeholder="Draft post title"
                value={postTitle}
                onChange={(event) => setPostTitle(event.target.value)}
              />
              <TextareaField
                placeholder="Draft LinkedIn or portfolio post body"
                rows={4}
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
                Save Draft Post
              </Button>
            </div>
            <div className={pageStyles.list}>
              {contentIdeas.map((idea) => (
                <div key={idea.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={idea.title}
                    onBlur={(event) =>
                      void updateContentIdea({
                        id: idea.id,
                        title: event.target.value.trim() || idea.title
                      })
                    }
                  />
                  <label className={pageStyles.formGrid}>
                    <span className={pageStyles.eyebrow}>Status</span>
                    <select
                      value={idea.status}
                      onChange={(event) =>
                        void updateContentIdea({
                          id: idea.id,
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
                  <Button size="sm" variant="ghost" onClick={() => void deleteContentIdea(idea.id)}>
                    Remove
                  </Button>
                </div>
              ))}
              {contentPosts.map((post) => (
                <div key={post.id} className={pageStyles.listRow}>
                  <InputField
                    defaultValue={post.title}
                    onBlur={(event) =>
                      void updateContentPost({
                        id: post.id,
                        title: event.target.value.trim() || post.title
                      })
                    }
                  />
                  <InputField
                    label="Channel"
                    defaultValue={post.channel}
                    onBlur={(event) =>
                      void updateContentPost({
                        id: post.id,
                        channel: event.target.value.trim() || post.channel
                      })
                    }
                  />
                  <Button size="sm" variant="ghost" onClick={() => void deleteContentPost(post.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
