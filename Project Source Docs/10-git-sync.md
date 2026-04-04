# LAB — Git Sync Specification
**DOC-10 · GIT · Revision 0.2**
Priority: P2 (post-MVP) | Library: isomorphic-git | Auth: GitHub PAT

---

## 1. Overview

Each LAB project can optionally be backed by a Git repository. This provides:
- **Version history** — every auto-save is a commit; browse and restore past states
- **GitHub Pages deploy** — export and publish the public page to a free `github.io` URL
- **Backup** — push to a GitHub remote for off-device safety

Git is entirely optional. Projects work fully without it. Git features are hidden until the user explicitly enables them for a project.

---

## 2. Library Choice: isomorphic-git

`isomorphic-git` is a pure JavaScript Git implementation. It requires no system `git` binary and works in Node.js without any native bindings. This is the right choice for a cross-platform Electron app.

```bash
npm install isomorphic-git
```

It requires a filesystem adapter. In the main process, use Node's built-in `fs`:
```typescript
import git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node';
```

---

## 3. Repository Model

Each project has its own Git repository at:
```
{appDataDir}/projects/{projectId}/.git/
```

The working tree contains a **human-readable export** of the project data — not the binary SQLite database.

### What Gets Committed

```
projects/{projectId}/
├── project.json         ✅ committed — project metadata + page_config
├── blocks.json          ✅ committed — all blocks with their data
├── assets/              ✅ committed — all imported image/file assets
│   └── {assetId}-{filename}
├── public/
│   └── index.html       ✅ committed — last rendered public page (enables GitHub Pages)
└── .gitignore           ✅ committed
```

### .gitignore
```
# Never commit the binary database
portforge.db
lab.db
*.db-shm
*.db-wal
```

### JSON Export Functions

These functions are called before every commit to write the current DB state to disk:

```typescript
// src/main/git/snapshot.ts

export async function writeProjectSnapshot(projectId: string): Promise<void> {
  const dir = getProjectDir(projectId);
  const project = projectQueries.get(projectId);
  const blocks = blockQueries.list(projectId);

  await fs.promises.writeFile(
    path.join(dir, 'project.json'),
    JSON.stringify(project, null, 2)
  );
  await fs.promises.writeFile(
    path.join(dir, 'blocks.json'),
    JSON.stringify(blocks, null, 2)
  );

  // Also write rendered public page
  const html = await renderProject(projectId);
  await fs.promises.mkdir(path.join(dir, 'public'), { recursive: true });
  await fs.promises.writeFile(path.join(dir, 'public', 'index.html'), html);
}
```

---

## 4. Git Operations

All Git operations run in the main process via IPC.

### 4.1 Initialise

```typescript
ipcMain.handle('git:init', async (_, projectId: string) => {
  const dir = getProjectDir(projectId);
  await git.init({ fs, dir });

  // Set up initial commit with author config
  await git.setConfig({ fs, dir, path: 'user.name', value: 'LAB' });
  await git.setConfig({ fs, dir, path: 'user.email', value: 'lab@local' });

  await writeProjectSnapshot(projectId);
  await git.add({ fs, dir, filepath: '.' });
  await git.commit({ fs, dir, message: 'Initial commit', author: LAB_AUTHOR });

  // Update project record: mark git as enabled
  projectQueries.update(projectId, { git_enabled: true });
  return { ok: true };
});
```

### 4.2 Auto-commit

```typescript
// src/main/git/auto-commit.ts
// Debounced — called from block:upsert and block:reorder handlers

const pendingCommits = new Map<string, NodeJS.Timeout>();

export function scheduleCommit(projectId: string): void {
  if (pendingCommits.has(projectId)) {
    clearTimeout(pendingCommits.get(projectId)!);
  }
  pendingCommits.set(projectId, setTimeout(async () => {
    pendingCommits.delete(projectId);
    await performCommit(projectId);
  }, 30_000));   // 30 second debounce
}

async function performCommit(projectId: string): Promise<void> {
  const dir = getProjectDir(projectId);
  await writeProjectSnapshot(projectId);
  await git.add({ fs, dir, filepath: '.' });

  const status = await git.statusMatrix({ fs, dir });
  const hasChanges = status.some(([, head, workdir]) => head !== workdir);
  if (!hasChanges) return;   // nothing to commit

  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  await git.commit({
    fs, dir,
    message: `auto: save ${timestamp}`,
    author: LAB_AUTHOR,
  });
}
```

### 4.3 Manual Commit

```typescript
ipcMain.handle('git:commit', async (_, { projectId, message }: { projectId: string, message?: string }) => {
  const dir = getProjectDir(projectId);
  await writeProjectSnapshot(projectId);
  await git.add({ fs, dir, filepath: '.' });
  const hash = await git.commit({
    fs, dir,
    message: message ?? `manual: save ${new Date().toISOString()}`,
    author: LAB_AUTHOR,
  });
  return { hash };
});
```

### 4.4 Log

```typescript
ipcMain.handle('git:log', async (_, projectId: string) => {
  const dir = getProjectDir(projectId);
  const commits = await git.log({ fs, dir, depth: 50 });
  return commits.map(c => ({
    hash:      c.oid,
    message:   c.commit.message,
    timestamp: c.commit.author.timestamp * 1000,   // convert to ms
  }));
});
```

### 4.5 Restore from Commit

```typescript
ipcMain.handle('git:restore', async (_, { projectId, hash }) => {
  const dir = getProjectDir(projectId);

  // Read blocks.json from the target commit
  const { blob } = await git.readBlob({ fs, dir, oid: hash, filepath: 'blocks.json' });
  const blocksJson = new TextDecoder().decode(blob);
  const blocks: Block[] = JSON.parse(blocksJson);

  // Replace all blocks in DB for this project
  db.transaction(() => {
    blockQueries.deleteAll(projectId);
    for (const block of blocks) {
      blockQueries.insert(block);
    }
  });

  return { ok: true };
});
```

**Note:** Asset files are not restored in v1 (too complex). Only block data is restored. Assets remain as they are.

---

## 5. Remote Push (GitHub)

### Authentication
GitHub Personal Access Token (PAT) stored via `electron.safeStorage`:
```typescript
import { safeStorage } from 'electron';

export function saveGitHubPAT(token: string): void {
  const encrypted = safeStorage.encryptString(token);
  store.set('github.pat', encrypted.toString('base64'));
}

export function getGitHubPAT(): string | null {
  const stored = store.get('github.pat');
  if (!stored) return null;
  return safeStorage.decryptString(Buffer.from(stored as string, 'base64'));
}
```

### Push Handler
```typescript
ipcMain.handle('git:push', async (_, projectId: string) => {
  const dir = getProjectDir(projectId);
  const token = getGitHubPAT();
  if (!token) throw new Error('No GitHub token configured');

  const project = projectQueries.get(projectId);
  if (!project.git_remote) throw new Error('No remote configured for this project');

  await git.push({
    fs, http, dir,
    remote: 'origin',
    remoteRef: 'main',
    onAuth: () => ({ username: 'oauth2', password: token }),
  });

  return { ok: true };
});
```

### Setting Up Remote
```typescript
ipcMain.handle('git:set-remote', async (_, { projectId, url }) => {
  const dir = getProjectDir(projectId);
  try {
    await git.addRemote({ fs, dir, remote: 'origin', url });
  } catch {
    await git.deleteRemote({ fs, dir, remote: 'origin' });
    await git.addRemote({ fs, dir, remote: 'origin', url });
  }
  projectQueries.update(projectId, { git_remote: url });
  return { ok: true };
});
```

---

## 6. GitHub Pages Deploy

If the linked GitHub repo is configured for GitHub Pages (serving from `/docs` or a `gh-pages` branch), the rendered `public/index.html` is automatically available at `https://{username}.github.io/{repo-name}/` after each push.

The in-app flow:
1. User sets up remote in project settings
2. User clicks "Publish" in Page Customiser
3. App: render → write `public/index.html` → commit → push
4. App: show "Published at https://..." banner with copy link button
5. App: saves the live URL to `project.git_pages_url` for future display

---

## 7. UI Surfaces for Git

### Project Settings Panel (drawer in Workspace)
```
── Git & Sync ─────────────────────────────────────────
  Git: [● Enabled] / [○ Disabled]   [Enable Git]

  Remote URL:  https://github.com/david/fdl-8.git
               [Update]

  GitHub Token: [Configured ✓]      [Update Token]

  Auto-commit:  [● On (30s debounce)] / [○ Manual only]
──────────────────────────────────────────────────────
  [↑ Push now]    [⎋ View History]
```

### History Panel (modal)
```
┌ Project History ──────────────────────────────────────────────────────┐
│  auto: save 2026-04-09 14:32     ●  12 minutes ago     [Restore]     │
│  auto: save 2026-04-09 13:50        an hour ago        [Restore]     │
│  manual: finalised BOM              3 hours ago        [Restore]     │
│  Initial commit                     Yesterday                        │
└───────────────────────────────────────────────────────────────────────┘
```

Restore shows a confirmation: "This will replace all current blocks with the state from this commit. Assets are not affected. This cannot be undone."

---

## 8. Schema Additions for Git

Add these columns to the `projects` table (new migration):

```typescript
git_enabled:   integer('git_enabled').default(0),    // boolean
git_remote:    text('git_remote'),                    // remote URL or null
git_pages_url: text('git_pages_url'),                 // live GitHub Pages URL
```
