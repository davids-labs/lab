import { useEffect, useState } from 'react'
import type { GitCommitRecord, GitStatus, Project } from '@preload/types'
import { Button } from '@renderer/components/ui/Button'
import { InputField } from '@renderer/components/ui/InputField'
import { Modal } from '@renderer/components/ui/Modal'
import { useBlockStore } from '@renderer/stores/blockStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useToastStore } from '@renderer/stores/toastStore'
import { formatRelativeTime } from '@renderer/utils/relativeTime'
import styles from './GitPanelModal.module.css'

interface GitPanelModalProps {
  onClose: () => void
  project: Project
}

export function GitPanelModal({ onClose, project }: GitPanelModalProps): JSX.Element {
  const loadProject = useProjectStore((state) => state.loadProject)
  const loadBlocks = useBlockStore((state) => state.loadBlocks)
  const pushToast = useToastStore((state) => state.push)
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [commits, setCommits] = useState<GitCommitRecord[]>([])
  const [remoteUrl, setRemoteUrl] = useState(project.git_remote ?? '')
  const [tokenDraft, setTokenDraft] = useState('')
  const [isBusy, setIsBusy] = useState<string | null>(null)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'setup' | 'backup' | 'publish' | 'restore'>('setup')
  const pushReady =
    Boolean(status?.enabled) &&
    Boolean(status?.hasRepository) &&
    Boolean(status?.remoteUrl) &&
    Boolean(status?.hasToken)
  const setupSteps = [
    !status?.enabled ? 'Enable Git for this project.' : null,
    !status?.remoteUrl ? 'Save the GitHub repository URL as the remote.' : null,
    !status?.hasToken ? 'Save a GitHub token with Contents read/write access.' : null
  ].filter((step): step is string => Boolean(step))

  useEffect(() => {
    setRemoteUrl(project.git_remote ?? '')
  }, [project.git_remote])

  async function refreshStatus(): Promise<void> {
    setStatus(await window.lab.git.status(project.id))
  }

  async function refreshHistory(): Promise<void> {
    setCommits(await window.lab.git.log(project.id))
  }

  async function refreshProjectContext(): Promise<void> {
    await Promise.all([loadProject(project.id), loadBlocks(project.id), refreshStatus()])
  }

  useEffect(() => {
    void window.lab.git
      .status(project.id)
      .then((nextStatus) => setStatus(nextStatus))
      .catch(() => undefined)
  }, [project.id])

  async function runAction(
    key: string,
    action: () => Promise<void>,
    successMessage: string
  ): Promise<void> {
    setIsBusy(key)

    try {
      await action()
      pushToast({ message: successMessage, type: 'success' })
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Git action failed.',
        type: 'error'
      })
    } finally {
      setIsBusy(null)
    }
  }

  return (
    <Modal onClose={onClose} title="Git & Sync">
      <div className={styles.shell}>
        <div className={styles.tabBar} role="tablist" aria-label="Git sections">
          {([
            ['setup', 'Setup'],
            ['backup', 'Backup'],
            ['publish', 'Publish'],
            ['restore', 'Restore']
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'setup' ? (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <strong>Repository</strong>
                  <div className={styles.helper}>
                    Local history, backup, and GitHub Pages publishing stay opt-in per project.
                  </div>
                </div>
                <Button
                  disabled={status?.enabled || isBusy !== null}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void runAction(
                      'init',
                      async () => {
                        await window.lab.git.init(project.id)
                        await refreshProjectContext()
                        await refreshHistory()
                      },
                      'Git enabled for this project.'
                    )
                  }
                >
                  {status?.enabled ? 'Enabled' : isBusy === 'init' ? 'Enabling…' : 'Enable Git'}
                </Button>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaCard}>
                  <span className={styles.label}>Status</span>
                  <strong>{status?.enabled ? 'Enabled' : 'Disabled'}</strong>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.label}>Repository</span>
                  <strong>{status?.hasRepository ? 'Ready' : 'Not initialised'}</strong>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.label}>Token</span>
                  <strong>
                    {status?.authSource === 'saved-token'
                      ? 'Local token'
                      : status?.authSource === 'gh-cli'
                        ? 'GitHub CLI'
                        : 'Not configured'}
                  </strong>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.label}>Auto Commit</span>
                  <strong>{status?.autoCommitPending ? 'Pending' : 'Idle'}</strong>
                </div>
              </div>

              <div className={styles.setupCard}>
                <strong>Push setup</strong>
                <div className={styles.helper}>
                  You do not need to create the GitHub repository first if it already exists. LAB
                  just needs a local repo, a saved remote URL, and a token before push or publish
                  can work.
                </div>
                {setupSteps.length > 0 ? (
                  <div className={styles.checklist}>
                    {setupSteps.map((step) => (
                      <span key={step} className={styles.checkItem}>
                        {step}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.helper}>
                    Push prerequisites are satisfied for this project.
                  </div>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <div>
                <strong>Remote</strong>
                <div className={styles.helper}>
                  GitHub repository URL for backup and publish flows. Existing repos are fine; LAB
                  does not need to create a new one first.
                </div>
              </div>
              <InputField
                label="Remote URL"
                placeholder="https://github.com/your-org/your-repo.git"
                value={remoteUrl}
                onChange={(event) => setRemoteUrl(event.target.value)}
              />
              <div className={styles.actions}>
                <Button
                  disabled={!status?.enabled || !remoteUrl.trim() || isBusy !== null}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void runAction(
                      'remote',
                      async () => {
                        await window.lab.git.setRemote(project.id, remoteUrl.trim())
                        await refreshProjectContext()
                      },
                      'Remote updated.'
                    )
                  }
                >
                  {isBusy === 'remote' ? 'Saving…' : 'Save Remote'}
                </Button>
              </div>
            </div>

            <div className={styles.section}>
              <div>
                <strong>GitHub Token</strong>
                <div className={styles.helper}>
                  Stored locally for push and publish. Leave blank and save to clear it. If GitHub
                  CLI is already signed in on this machine, LAB can use that as a fallback.
                </div>
              </div>
              <InputField
                label="Personal Access Token"
                placeholder={status?.hasToken ? 'Configured locally' : 'ghp_...'}
                type="password"
                value={tokenDraft}
                onChange={(event) => setTokenDraft(event.target.value)}
              />
              <div className={styles.actions}>
                <Button
                  disabled={isBusy !== null}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void runAction(
                      'token',
                      async () => {
                        await window.lab.git.setToken(tokenDraft.trim() || null)
                        setTokenDraft('')
                        await refreshStatus()
                      },
                      tokenDraft.trim() ? 'Token saved locally.' : 'Token cleared.'
                    )
                  }
                >
                  {isBusy === 'token' ? 'Saving…' : 'Save Token'}
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {activeTab === 'backup' ? (
          <div className={styles.section}>
            <div>
              <strong>Backup</strong>
              <div className={styles.helper}>
                Manual commit and push both operate on the app snapshot, not source code files.
              </div>
            </div>
            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <span className={styles.label}>Remote</span>
                <strong>{status?.remoteUrl ? 'Configured' : 'Missing'}</strong>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.label}>Auth</span>
                <strong>{status?.hasToken ? status?.authSource : 'Missing'}</strong>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.label}>Auto Commit</span>
                <strong>{status?.autoCommitPending ? 'Pending' : 'Idle'}</strong>
              </div>
            </div>
            <div className={styles.actions}>
              <Button
                disabled={!pushReady || isBusy !== null}
                size="sm"
                variant="outline"
                onClick={() =>
                  void runAction(
                    'commit',
                    async () => {
                      await window.lab.git.commit(project.id)
                      await refreshHistory()
                      await refreshStatus()
                    },
                    'Manual commit created.'
                  )
                }
              >
                {isBusy === 'commit' ? 'Committing…' : 'Commit Now'}
              </Button>
              <Button
                disabled={!status?.enabled || isBusy !== null}
                size="sm"
                onClick={() =>
                  void runAction(
                    'push',
                    async () => {
                      await window.lab.git.push(project.id)
                      await refreshStatus()
                    },
                    'Project pushed to remote.'
                  )
                }
              >
                {isBusy === 'push' ? 'Pushing…' : 'Push Backup'}
              </Button>
            </div>
          </div>
        ) : null}

        {activeTab === 'publish' ? (
          <div className={styles.section}>
            <div>
              <strong>Publish</strong>
              <div className={styles.helper}>
                Publish pushes the current snapshot and updates the GitHub Pages URL for this
                project.
              </div>
            </div>
            <div className={styles.actions}>
              <Button
                disabled={!pushReady || isBusy !== null}
                size="sm"
                onClick={() =>
                  void runAction(
                    'publish',
                    async () => {
                      await window.lab.git.publish(project.id)
                      await refreshProjectContext()
                    },
                    'Publish completed.'
                  )
                }
              >
                {isBusy === 'publish' ? 'Publishing…' : 'Publish'}
              </Button>
            </div>
            {status?.pagesUrl ? (
              <a className={styles.link} href={status.pagesUrl} rel="noreferrer" target="_blank">
                {status.pagesUrl}
              </a>
            ) : (
              <div className={styles.helper}>
                No Pages URL yet. Publish after setup is complete to generate one.
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'restore' ? (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <strong>Restore</strong>
                <div className={styles.helper}>
                  Advanced flow. Restore the workspace to a previous snapshot commit when you need
                  to roll back.
                </div>
              </div>
              <Button
                disabled={!status?.enabled || isBusy !== null}
                size="sm"
                variant="outline"
                onClick={() => {
                  if (historyVisible) {
                    setHistoryVisible(false)
                    return
                  }

                  void runAction(
                    'history',
                    async () => {
                      await refreshHistory()
                      setHistoryVisible(true)
                    },
                    'History loaded.'
                  )
                }}
              >
                {historyVisible ? 'Hide History' : 'View History'}
              </Button>
            </div>

            {historyVisible ? (
              commits.length > 0 ? (
                <div className={styles.historyList}>
                  {commits.map((commit) => (
                    <div key={commit.hash} className={styles.historyRow}>
                      <div className={styles.historyTop}>
                        <strong>{commit.message}</strong>
                        <Button
                          disabled={isBusy !== null}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const confirmed = window.confirm(
                              'Restore this commit? This will replace current blocks and page settings with that snapshot.'
                            )
                            if (!confirmed) {
                              return
                            }

                            void runAction(
                              `restore-${commit.hash}`,
                              async () => {
                                await window.lab.git.restore(project.id, commit.hash)
                                await refreshProjectContext()
                                await refreshHistory()
                              },
                              'Project restored from commit.'
                            )
                          }}
                        >
                          Restore
                        </Button>
                      </div>
                      <span className={styles.hash}>{commit.hash.slice(0, 10)}</span>
                      <span className={styles.helper}>{formatRelativeTime(commit.timestamp)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.helper}>No commits yet for this project.</div>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
