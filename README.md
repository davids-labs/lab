# davids.lab

Local-first command center for direction, execution, project proof, pipeline management, public presence, and portfolio publishing.

This README is intentionally written like a mini website: start at the navigation, jump to what you need, and use cross-links throughout.

---

## Quick Navigation

- [0. What's New (April 2026)](#0-whats-new-april-2026)
- [1. What This App Is](#1-what-this-app-is)
- [2. Current Product Scope (April 2026)](#2-current-product-scope-april-2026)
- [3. Feature Tour (Every Workspace)](#3-feature-tour-every-workspace)
- [4. Local Setup (Step by Step)](#4-local-setup-step-by-step)
- [5. Day-1 Walkthrough (End to End)](#5-day-1-walkthrough-end-to-end)
- [6. Command Reference](#6-command-reference)
- [7. Build and Release Guide](#7-build-and-release-guide)
- [8. Architecture Deep Dive](#8-architecture-deep-dive)
- [9. Data Model Deep Dive](#9-data-model-deep-dive)
- [10. Block System and Public Page Engine](#10-block-system-and-public-page-engine)
- [11. Git Sync and Publishing](#11-git-sync-and-publishing)
- [12. Folder and File Structure Guide](#12-folder-and-file-structure-guide)
- [13. Coding Standards Used in This Repo](#13-coding-standards-used-in-this-repo)
- [14. Testing and Validation Checklist](#14-testing-and-validation-checklist)
- [15. Troubleshooting](#15-troubleshooting)
- [16. FAQ](#16-faq)
- [17. Product Roadmap](#17-product-roadmap)

---

## 0. What's New (April 2026)

Recent product and feature additions now reflected in this repo:

- Full command-center shell with dedicated workspaces for Direction, Execution, Proof, Pipeline, Presence, Library, and Settings.
- Expanded project builder with engineering-focused blocks, including `pinout`, `gcode`, and `failed_iteration` in addition to the original structured/public blocks.
- Markdown workflow upgraded: drag-and-drop import, frontmatter parsing, and editable markdown with sanitized preview.
- Public page system expanded with theme controls, layout variants (`default`, `minimal`, `magazine`), click-to-edit preview bridge, and HTML/ZIP export modes.
- Optional Git foundation integrated through the bridge (`git:*` surface) with project-level snapshot/versioning workflow design.
- Local release pipeline improved via `release:local` packaging script and portable build artifacts.

---

## 1. What This App Is

davids.lab is an Electron + React + TypeScript desktop app that combines:

- Personal direction planning
- Daily execution systems
- Project proof and portfolio authoring
- Opportunity pipeline management
- Public presence/content preparation
- Document ingestion into a searchable working memory

Core idea:

1. Keep all source truth local.
2. Convert structured internal work into polished public output.
3. Keep data portable and versionable.

---

## 2. Current Product Scope (April 2026)

The app is actively developed and now operates as a complete local-first product system, not just a standalone project editor.

### Product positioning

LAB separates private creation from public presentation:

- Workspace side: structured planning, execution, and project-building tools for daily use.
- Public side: polished, exportable project pages generated from the same source data.

Core product goals in this build:

- Keep all project and operating-system data local and portable.
- Make structured project capture fast (forms, blocks, markdown import, asset linking).
- Publish portfolio-grade output quickly (live preview + export + optional Git workflows).

### Workspace domains currently wired in the app shell

- Direction (`/direction`)
- Execution (`/execution`)
- Proof (`/proof`, with projects and skills surfaces)
- Pipeline (`/pipeline`)
- Presence (`/presence`)
- Library (`/library`)
- Settings (`/settings`)

### Project-specific pages currently wired

- Workspace canvas (`/project/:id`)
- Public page customiser (`/project/:id/customise`)
- Public page preview route (`/project/:id/preview`)

### Current maturity snapshot

- P1 scope (core local workflow) is largely present across shell, data layer, canvas, block editors, and export.
- P2 scope (deep Git automation + one-click publish UX) is scaffolded and exposed through bridge surfaces, with iterative hardening still expected.

### Backend surfaces currently exposed through preload bridge

- `dashboard`
- `plan`
- `skills`
- `os`
- `settings`
- `pipeline`
- `presence`
- `library`
- `project`
- `block`
- `asset`
- `page`
- `git`
- `system`

This means the app already has a substantial multi-domain architecture, with project publishing as one major subsystem.

---

## 3. Feature Tour (Every Workspace)

This section explains each major area and what it is for.

Cross-workspace product characteristics:

- Local-first persistence with SQLite and typed IPC bridge boundaries.
- Shared command-center navigation and action surfaces.
- Design-token based UI system reused across private workspace and public rendering.

### 3.1 Home Dashboard

Primary command-center landing zone. It is meant to answer: "What matters now?"

Typical responsibilities:

- Top-level summary metrics
- Entry point to all domains
- Starter template import

### 3.2 Direction Workspace

Strategic planning graph for long-horizon work.

Concepts supported by data model and APIs:

- Plan nodes (phase, pillar, dependency, sprint)
- Node statuses (`not_started`, `in_progress`, `blocked`, etc.)
- Links from plan nodes to projects/skills/pipeline targets

### 3.3 Execution Workspace (Personal OS)

Operational daily system.

Backed features include:

- Time-block profiles
- Daily logs (sleep, nutrition, deep work, notes)
- Habit tracking and logs
- Countdown targets
- Weekly priorities
- Weekly review records

### 3.4 Proof Workspace

Project proof, storytelling, and evidence assembly.

Includes:

- Project records
- Block-based project editing canvas
- Public page rendering/export
- Skills matrix and skill evidence links

### 3.5 Pipeline Workspace

Career/opportunity operating system.

Backed entities include:

- Target organizations
- Target roles
- Application records
- Contact records
- Interaction records

### 3.6 Presence Workspace

Narrative and public artifact production.

Entities include:

- Narrative fragments
- Profile assets
- CV variants
- Content ideas
- Content posts

### 3.7 Library Workspace

Source-document ingestion and extraction pipeline.

Document flow:

1. Import docs (`.md`, `.txt`, `.docx`).
2. Parse into excerpts.
3. Generate extraction suggestions.
4. Resolve suggestions into working records.

### 3.8 Project Workspace and Public Page System

This is the "builder" side of the app:

- 2-column drag-and-drop canvas
- Structured and engineering block types (BOM, build guide, case study, pinout, gcode, spec table, markdown, media, etc.)
- Visibility toggles for public inclusion
- Live preview engine with click-to-edit bridge
- Theme/layout controls in customiser route
- Export to HTML (single-file) and ZIP (assets folder)
- Git-backed history and publish flows

---

## 4. Local Setup (Step by Step)

### 4.1 Prerequisites

Install the following first:

1. Node.js 22 LTS or newer
2. npm 10+
3. Git (recommended for development workflow)

Check versions:

```bash
node -v
npm -v
git --version
```

### 4.2 Install dependencies

From repo root:

```bash
npm install
```

What this does:

1. Installs all runtime and dev dependencies.
2. Runs `postinstall` (`electron-builder install-app-deps`) for native dependency compatibility.

### 4.3 Start in development mode

```bash
npm run dev
```

Expected behavior:

1. Electron main process boots.
2. Preload bridge is injected.
3. Renderer starts with Vite HMR.
4. Local DB is initialized in app user-data path.

### 4.4 Optional quality checks

```bash
npm run lint
npm run typecheck
```

### 4.5 Build the app

```bash
npm run build
```

This runs Node + Web TypeScript checks first, then `electron-vite build`.

---

## 5. Day-1 Walkthrough (End to End)

Use this if you want the complete "first useful session" path.

### Step 1: Launch and verify bridge

Run:

```bash
npm run dev
```

If you see "App bridge unavailable", the preload bridge did not load. Restart and check build output.

### Step 2: Seed baseline content

On Home Dashboard, import starter template if needed. This gives you a realistic baseline dataset.

### Step 3: Create or open a project

Go to Proof area and open project workspace route (`/project/:id`).

### Step 4: Add structured blocks

Recommended initial sequence:

1. `how_it_works`
2. `bom`
3. `build_guide`
4. `image_gallery`
5. `markdown`
6. `spec_table`

### Step 5: Arrange canvas and visibility

1. Reorder blocks with drag and drop.
2. Change span (half/full width) where needed.
3. Toggle visibility for public output.

### Step 6: Customize public page

Open `/project/:id/customise` and set:

1. Section order
2. Visibility
3. Theme accents and layout variant
4. Heading overrides

### Step 7: Export

Export options:

- Single-file HTML (base64 assets)
- ZIP (HTML + assets folder)

### Step 8: Enable Git for versioning/publish

1. Initialize project git
2. Set remote URL
3. Set token
4. Commit/push/publish

---

## 6. Command Reference

All npm scripts in this repo and what each one does.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Electron + Vite in development mode |
| `npm run start` | Run electron-vite preview mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier write |
| `npm run typecheck:node` | Type-check node/main/preload config |
| `npm run typecheck:web` | Type-check renderer/web config |
| `npm run typecheck` | Run both type-check commands |
| `npm run build` | Type-check all then build app |
| `npm run build:unpack` | Build and generate unpacked app directory |
| `npm run build:win` | Build and package Windows portable target |
| `npm run build:mac` | Build and package mac target |
| `npm run build:linux` | Build and package Linux targets |
| `npm run release:local` | Build then run custom local portable release script |

---

## 7. Build and Release Guide

### 7.1 Standard build

```bash
npm run build
```

Output goes to `out/` (compiled app artifacts used by packagers).

### 7.2 Windows portable bundle

```bash
npm run build:win
```

Produces Windows packaging artifacts according to `electron-builder.yml`.

### 7.3 Local release packer flow

```bash
npm run release:local
```

What happens:

1. Runs type checks and build.
2. Copies Electron runtime into `release/{name}-win-unpacked`.
3. Renames executable to product name.
4. Copies built app `out/` and runtime `node_modules`.
5. Removes packaging-only modules from runtime copy (`electron`, `electron-builder`, `electron-vite`).
6. Creates portable ZIP in `release/`.

### 7.4 Release environment overrides

Optional env vars used by `scripts/build-local-release.mjs`:

- `LAB_RELEASE_DIR_NAME`
- `LAB_RELEASE_ZIP_NAME`

---

## 8. Architecture Deep Dive

### 8.1 Stack summary

- Shell: Electron + electron-vite
- UI: React 18 + TypeScript
- State: Zustand
- DnD: dnd-kit
- DB: SQLite (`better-sqlite3`) + Drizzle ORM
- Rich text: Tiptap
- Markdown: marked + DOMPurify + CodeMirror
- Charts/data helpers: Chart.js, date-fns, PapaParse
- Git: isomorphic-git

### 8.2 Process model

1. Main process handles privileged work: DB, filesystem, exports, git.
2. Preload exposes a strict typed bridge on `window.lab`.
3. Renderer is sandboxed and talks only through IPC invoke channels.

### 8.3 Security defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- External links opened with shell handler, not in-app unrestricted windows
- Markdown content sanitized before HTML injection

### 8.4 Router structure

Renderer uses hash router with command-center layout shell and many routed workspaces.

---

## 9. Data Model Deep Dive

SQLite schema is broad and domain-oriented.

### 9.1 Core publishing entities

- `projects`
- `blocks`
- `assets`

### 9.2 Direction entities

- `plan_nodes`
- `plan_node_links`

### 9.3 Skills and evidence entities

- `skill_domains`
- `skill_nodes`
- `skill_evidence`

### 9.4 Execution entities

- `os_profiles`
- `os_time_blocks`
- `os_daily_logs`
- `os_habits`
- `os_habit_logs`
- `countdown_items`
- `weekly_priorities`
- `weekly_reviews`

### 9.5 Pipeline entities

- `target_organizations`
- `target_roles`
- `application_records`
- `contact_records`
- `interaction_records`

### 9.6 Presence entities

- `narrative_fragments`
- `profile_assets`
- `cv_variants`
- `content_ideas`
- `content_posts`

### 9.7 Library and extraction entities

- `source_documents`
- `source_excerpts`
- `extraction_suggestions`
- `suggestion_resolutions`

### 9.8 General system entities

- `app_meta`
- `app_settings`
- `inbox_entries`
- `note_pages`

Design choice: most variable structures use JSON text columns with type-safe deserialize/validate patterns in query layers.

---

## 10. Block System and Public Page Engine

### 10.1 Supported block types

- `how_it_works`
- `bom`
- `build_guide`
- `case_study`
- `pinout`
- `gcode`
- `image_gallery`
- `markdown`
- `link`
- `spec_table`
- `embed`
- `text`
- `failed_iteration`
- `note`
- `todo`

Workspace-only blocks:

- `failed_iteration`
- `note`
- `todo`

### 10.2 Canvas behavior

1. Two-column grid by default.
2. Sort and layout controlled by block order + span metadata.
3. Block-level controls support visibility, delete, and sizing.

### 10.3 Markdown import and rendering

1. Markdown can be imported by drag-and-drop, block picker import, or asset-to-canvas flow.
2. Frontmatter keys (for example `title`, `date`, `tags`, `type`, `visible`) are parsed and retained.
3. Renderer uses marked + sanitization for safe HTML output.
4. Public page uses equivalent rendering pipeline for consistency.
5. Imported file is retained as snapshot; editable block markdown becomes live source-of-truth.

### 10.4 Public page render pipeline

1. Fetch project + visible blocks.
2. Resolve section sort from page config.
3. Render block partials.
4. Resolve assets to data URIs (or files for ZIP export).
5. Build full HTML shell.
6. Return for preview (`iframe srcdoc`) or write for export.

### 10.5 Export formats

- HTML: single-file, self-contained.
- ZIP: `index.html` + asset files for lighter payload on large media sets.

### 10.6 Layout variants and theming

- `default`: card-based LAB style
- `minimal`: single-column prose style
- `magazine`: editorial style with stronger hero treatment

Theme controls include accent/background/surface tone and heading/body font choices.

---

## 11. Git Sync and Publishing

Git support is implemented as an opt-in project feature with project-level repos.

### 11.1 Why this exists

- Time-travel project history
- Off-device backup
- Public publish workflows

### 11.2 Typical sequence

1. Initialize git for project
2. Configure remote
3. Configure token
4. Write project snapshot (`project.json`, `blocks.json`, `public/index.html`)
5. Auto or manual commit
6. Push
7. Publish

### 11.3 Snapshot strategy

Commits are based on human-readable project snapshots (project metadata, block data, rendered page, assets), not direct SQLite binary commits.

### 11.4 Restore behavior

Restore flow rehydrates block state from commit snapshots.

Current limitation:

- v1 restore scope focuses on block/content state; asset restoration is intentionally limited and should be validated before relying on it for destructive rollback workflows.

---

## 12. Folder and File Structure Guide

Top-level intent map:

- `src/main`: Electron main process, IPC handlers, DB/query layers, renderer/export services
- `src/preload`: typed bridge contract and API exposure
- `src/renderer/src`: React app, routes, components, stores, styles
- `src/shared`: shared cross-process utilities/types where applicable
- `scripts`: custom build/release automation
- `Project Source Docs`: long-form product/architecture/spec documents
- `release`: local release artifacts
- `build`: packager resources and entitlements

---

## 13. Coding Standards Used in This Repo

Condensed standards (full detail is in project source docs):

1. Strict TypeScript.
2. Avoid `any`; prefer `unknown` with narrowing.
3. Typed preload bridge is the only renderer access path to privileged operations.
4. IPC handlers validate inputs and return serializable errors.
5. DB access goes through query modules, not ad-hoc direct SQL in handlers.
6. CSS Modules + design tokens, avoid hardcoded style values where practical.
7. Store business logic in Zustand stores/services, not deep inside view components.

---

## 14. Testing and Validation Checklist

There is no single one-command full test suite in this README yet, so use this practical checklist.

### 14.1 Static checks

```bash
npm run lint
npm run typecheck
```

### 14.2 Runtime checks

1. `npm run dev`
2. Verify dashboard loads without bridge errors.
3. Verify each major route opens.
4. Create/update/delete a project.
5. Add and reorder blocks in workspace.
6. Render preview and export HTML/ZIP.
7. Exercise git panel with a test remote.

### 14.3 Packaging checks

1. `npm run build`
2. `npm run build:win` (or your platform command)
3. Launch packaged app and verify DB initialization and route navigation.

---

## 15. Troubleshooting

### 15.1 "App bridge unavailable"

Cause: preload script failed to load or mismatch in packaged output.

Fix:

1. Stop app.
2. Re-run `npm install`.
3. Re-run `npm run dev`.
4. If packaged, rebuild via `npm run build` then package again.

### 15.2 Native dependency issues (`better-sqlite3`)

Fix:

1. Remove `node_modules`.
2. Reinstall dependencies.
3. Ensure postinstall completed (`electron-builder install-app-deps`).

### 15.3 Export fails or output too large

Fix:

1. Prefer ZIP export for large asset-heavy projects.
2. Reduce image sizes before import.

### 15.4 Git push fails

Checklist:

1. Remote URL is valid.
2. Token is configured and has required scopes.
3. Network available.
4. Branch/remote settings align with target repo.

---

## 16. FAQ

### Is this cloud-first?

No. It is local-first by design.

### Do I need git to use it?

No. Git is optional.

### Can I use this only for project portfolio pages?

Yes, but the app is broader and can manage your full operating system across direction, execution, and proof.

### Is markdown generation built in?

The workflow assumes markdown is authored externally and imported; rendering/editing inside app is supported.

---

## 17. Product Roadmap

High-level phased plan from source docs:

1. Shell and setup
2. Data layer
3. Canvas + drag-and-drop
4. Deep block editors
5. Public page renderer/export
6. Customiser + polish

Current delivery posture:

- Implemented: broad command-center shell, multi-domain data surfaces, project canvas, core block editing, preview/export pipeline, and local packaging flow.
- In progress: deeper polish around Git publish UX, restore safety, and long-tail quality/performance hardening.
- Next: stronger publish automation, richer preview interactions, and broader test coverage around migration/export edge cases.

---

## Contributing Notes

If you are extending this repository:

1. Keep README sections and command tables updated with real behavior.
2. When adding routes or IPC domains, update the "Current Product Scope" section.
3. If schemas change, update both the Data Model section and migration docs.

This README is designed to be the primary onboarding document for both developers and future contributors.
