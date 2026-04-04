# LAB — Coding Standards & Patterns
**DOC-09 · STANDARDS · Revision 0.2**
Rules for Copilot and human contributors. Consistency matters more than personal preference.

---

## 1. TypeScript Rules

- **Strict mode:** `"strict": true` in `tsconfig.json`. No exceptions.
- **No `any`:** Use `unknown` and narrow, or define a proper type.
- **Explicit return types** on all functions in `src/main/`. Renderer components may infer.
- **Type imports:** Use `import type { ... }` when importing only types.
- **Enums:** Don't use TypeScript enums. Use `as const` objects instead:
  ```typescript
  // ✅
  export const BlockType = { BOM: 'bom', BUILD_GUIDE: 'build_guide' } as const;
  export type BlockType = typeof BlockType[keyof typeof BlockType];
  // ❌
  enum BlockType { BOM = 'bom' }
  ```
- **Zod validation:** All data coming from the DB (JSON columns) must be validated with Zod before use:
  ```typescript
  const BomDataSchema = z.object({ items: z.array(BomItemSchema) });
  const parsed = BomDataSchema.parse(JSON.parse(block.data));
  ```

---

## 2. IPC Patterns

### Handler registration (main process)
```typescript
// src/main/ipc/project.ts
import { ipcMain } from 'electron';
import { db } from '../db';

export function registerProjectHandlers(): void {
  ipcMain.handle('project:list', async (): Promise<Project[]> => {
    return db.project.list();
  });

  ipcMain.handle('project:create', async (_, input: CreateProjectInput): Promise<Project> => {
    validateCreateProjectInput(input);   // throw if invalid
    return db.project.create(input);
  });
  // ...
}
```

Call all `register*Handlers()` from `src/main/index.ts` on app ready.

### Preload bridge (preload/index.ts)
```typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { LabBridge } from './types';

const bridge: LabBridge = {
  project: {
    list:   ()           => ipcRenderer.invoke('project:list'),
    get:    (id)         => ipcRenderer.invoke('project:get', id),
    create: (input)      => ipcRenderer.invoke('project:create', input),
    update: (id, update) => ipcRenderer.invoke('project:update', id, update),
    delete: (id)         => ipcRenderer.invoke('project:delete', id),
  },
  // ... block, asset, page, git
};

contextBridge.exposeInMainWorld('lab', bridge);
```

### Using the bridge in renderer
```typescript
// In a Zustand store action:
const projects = await window.lab.project.list();
```

Always `await` IPC calls. Never assume synchronous.

---

## 3. Zustand Store Patterns

```typescript
// src/renderer/stores/projectStore.ts
import { create } from 'zustand';

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  // actions
  load: () => Promise<void>;
  create: (input: CreateProjectInput) => Promise<Project>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await window.lab.project.list();
      set({ projects, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  create: async (input) => {
    const project = await window.lab.project.create(input);
    set(s => ({ projects: [project, ...s.projects] }));
    return project;
  },
}));
```

Rules:
- Always set `isLoading` before async operations, clear after
- Optimistic updates: update local state immediately, roll back on error
- No business logic in components — all in stores or main process
- No store-to-store imports — use Zustand's `subscribe` for cross-store reactions if needed

---

## 4. Component Patterns

### File structure per component
```
BlockWrapper/
  BlockWrapper.tsx
  BlockWrapper.module.css
  index.ts           ← re-export: export { BlockWrapper } from './BlockWrapper';
```

### Component template
```tsx
// src/renderer/components/canvas/BlockWrapper/BlockWrapper.tsx
import styles from './BlockWrapper.module.css';
import type { Block } from '../../../preload/types';

interface BlockWrapperProps {
  block: Block;
  className?: string;
}

export function BlockWrapper({ block, className }: BlockWrapperProps) {
  // hooks at top, no conditionals before hooks
  // ...

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {/* ... */}
    </div>
  );
}
```

Rules:
- Named exports only (no default exports for components — easier to find in refactoring)
- Props interface defined in the same file, above the component
- `className` prop accepted by every presentational component for extensibility
- No inline styles except for dynamic values (e.g., `style={{ transform: CSS.Transform.toString(t) }}`)

---

## 5. Database Query Patterns

```typescript
// src/main/db/queries/projects.ts — all DB queries live here, not in IPC handlers

import { eq } from 'drizzle-orm';
import { db } from '../index';
import { projects } from '../schema';
import type { Project } from '../../preload/types';

export const projectQueries = {
  list(): Project[] {
    const rows = db.select().from(projects).where(eq(projects.status, 'active')).all();
    return rows.map(deserializeProject);
  },

  create(input: CreateProjectInput): Project {
    const id = ulid();
    const now = Date.now();
    db.insert(projects).values({
      id,
      name: input.name,
      slug: slugify(input.name),
      type: input.type,
      page_config: JSON.stringify(defaultPageConfig()),
      status: 'active',
      created_at: now,
      updated_at: now,
    }).run();
    return this.get(id);
  },
};

// Deserialise JSON columns
function deserializeProject(row: typeof projects.$inferSelect): Project {
  return {
    ...row,
    page_config: JSON.parse(row.page_config ?? '{}'),
  };
}
```

Rules:
- All DB calls are synchronous (`better-sqlite3` is sync — embrace it)
- JSON columns are always serialised/deserialised at the query layer, not the IPC layer
- IPC handlers call query functions — they never touch `db` directly
- Validate inputs before DB writes

---

## 6. Error Handling

### In main process IPC handlers:
```typescript
ipcMain.handle('project:create', async (_, input) => {
  try {
    return projectQueries.create(input);
  } catch (error) {
    // Log to main process console
    console.error('[project:create]', error);
    // Re-throw a plain serialisable error (Electron serialises errors across IPC)
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
});
```

### In renderer stores:
```typescript
try {
  const result = await window.lab.project.create(input);
  // success
} catch (e) {
  toastStore.show({ message: `Failed to create project: ${String(e)}`, type: 'error' });
}
```

Never let errors silently disappear. Every `await` that can fail gets a `try/catch`.

---

## 7. File Naming

| What | Convention | Example |
|------|-----------|---------|
| React components | PascalCase `.tsx` | `BlockWrapper.tsx` |
| Hooks | camelCase, `use` prefix | `useBlockReorder.ts` |
| Stores | camelCase, `Store` suffix | `blockStore.ts` |
| Utilities | camelCase | `slugify.ts` |
| IPC handlers | camelCase | `project.ts` |
| DB queries | camelCase | `projects.ts` |
| CSS modules | Same as component | `BlockWrapper.module.css` |
| Types file | `types.ts` | `src/preload/types.ts` |

---

## 8. CSS Module Conventions

```css
/* BlockWrapper.module.css */

/* ✅ semantic, camelCase */
.wrapper { }
.wrapper:hover { }
.wrapper[data-dragging="true"] { }   /* data attributes for JS-driven states */
.toolbar { }
.toolbarVisible { }

/* ✅ always use tokens */
.wrapper {
  background: var(--lab-surface);
  border: 1px solid var(--lab-border);
  border-radius: var(--lab-radius);
}

/* ❌ never hardcode colours */
.wrapper {
  background: #1a1d24;  /* NO */
}

/* ❌ no nesting (CSS modules don't need it) */
.wrapper .toolbar { }   /* avoid — use separate classes */
```

---

## 9. Auto-save Pattern

Every block editor saves on blur (focus leaving the block), not on every keystroke. For the canvas-level `sort_order` updates, save immediately on drag end.

```typescript
// In a block editor component:
const [localData, setLocalData] = useState(block.data);

const handleSave = useCallback(() => {
  blockStore.upsertBlock({ ...block, data: localData });
}, [block, localData]);

// Save on blur
return <div onBlur={handleSave}> ... </div>;
```

The `upsertBlock` Zustand action:
1. Calls `window.lab.block.upsert(block)` (IPC)
2. Updates local store optimistically (before IPC resolves)
3. Sets `uiStore.saveState = 'saving'`
4. On IPC resolve: sets `uiStore.saveState = 'saved'`
5. On IPC error: rolls back local state, shows error toast

---

## 10. Security Checklist

- [ ] `nodeIntegration: false` — verified in all BrowserWindow configs
- [ ] `contextIsolation: true` — verified
- [ ] `sandbox: true` — verified on renderer
- [ ] No `eval()` or `new Function()` in renderer
- [ ] All markdown rendered through `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`
- [ ] File paths for asset import: validated via `path.resolve` + checked to be within app data dir
- [ ] IPC inputs: validated with Zod in all handlers before DB writes
- [ ] No secrets (API keys, PAT) stored in plain text — use `electron.safeStorage`
