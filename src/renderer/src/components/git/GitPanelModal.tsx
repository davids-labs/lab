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
              <strong>{status?.hasToken ? 'Configured' : 'Not configured'}</strong>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.label}>Auto Commit</span>
              <strong>{status?.autoCommitPending ? 'Pending' : 'Idle'}</strong>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div>
            <strong>Remote</strong>
            <div className={styles.helper}>GitHub repository URL for backup and publish flows.</div>
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
              Stored locally for push and publish. Leave blank and save to clear it.
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

        <div className={styles.section}>
          <div>
            <strong>Actions</strong>
            <div className={styles.helper}>
              Manual commit, backup push, and publish all use the project snapshot generated from
              local data.
            </div>
          </div>
          <div className={styles.actions}>
            <Button
              disabled={!status?.enabled || isBusy !== null}
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
              variant="outline"
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
              {isBusy === 'push' ? 'Pushing…' : 'Push'}
            </Button>
            <Button
              disabled={!status?.enabled || isBusy !== null}
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
          ) : null}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <strong>History</strong>
              <div className={styles.helper}>
                Restore the workspace to a previous snapshot commit when you need to roll back.
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
      </div>
    </Modal>
  )
}
