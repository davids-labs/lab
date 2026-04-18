import { contextBridge, ipcRenderer } from 'electron'
import type { LabBridge } from './types'

const bridge: LabBridge = {
  dashboard: {
    summary: () => ipcRenderer.invoke('dashboard:summary'),
    importStarterTemplate: () => ipcRenderer.invoke('dashboard:import-starter-template')
  },
  capture: {
    list: (status) => ipcRenderer.invoke('capture:list', status),
    create: (input) => ipcRenderer.invoke('capture:create', input),
    update: (input) => ipcRenderer.invoke('capture:update', input),
    triage: (input) => ipcRenderer.invoke('capture:triage', input),
    delete: (id) => ipcRenderer.invoke('capture:delete', id)
  },
  actions: {
    list: (status) => ipcRenderer.invoke('actions:list', status),
    create: (input) => ipcRenderer.invoke('actions:create', input),
    update: (input) => ipcRenderer.invoke('actions:update', input),
    delete: (id) => ipcRenderer.invoke('actions:delete', id)
  },
  notes: {
    list: () => ipcRenderer.invoke('notes:list'),
    get: (id) => ipcRenderer.invoke('notes:get', id),
    create: (input) => ipcRenderer.invoke('notes:create', input),
    update: (input) => ipcRenderer.invoke('notes:update', input),
    delete: (id) => ipcRenderer.invoke('notes:delete', id),
    listLinks: (noteId) => ipcRenderer.invoke('notes:list-links', noteId),
    createLink: (input) => ipcRenderer.invoke('notes:create-link', input),
    deleteLink: (id) => ipcRenderer.invoke('notes:delete-link', id)
  },
  calendar: {
    listSources: () => ipcRenderer.invoke('calendar:list-sources'),
    createSource: (input) => ipcRenderer.invoke('calendar:create-source', input),
    updateSource: (input) => ipcRenderer.invoke('calendar:update-source', input),
    deleteSource: (id) => ipcRenderer.invoke('calendar:delete-source', id),
    importIcs: (input) => ipcRenderer.invoke('calendar:import-ics', input),
    syncSource: (id) => ipcRenderer.invoke('calendar:sync-source', id),
    listEvents: (sourceId) => ipcRenderer.invoke('calendar:list-events', sourceId)
  },
  review: {
    listSessions: () => ipcRenderer.invoke('review:list-sessions'),
    createSession: (input) => ipcRenderer.invoke('review:create-session', input),
    updateSession: (input) => ipcRenderer.invoke('review:update-session', input),
    getWeeklyReset: (weekKey) => ipcRenderer.invoke('review:get-weekly-reset', weekKey)
  },
  exports: {
    listBundles: () => ipcRenderer.invoke('exports:list-bundles'),
    generateContextPack: (input) => ipcRenderer.invoke('exports:generate-context-pack', input),
    saveContextPack: (input) => ipcRenderer.invoke('exports:save-context-pack', input)
  },
  integrations: {
    listAccounts: () => ipcRenderer.invoke('integrations:list-accounts'),
    createAccount: (input) => ipcRenderer.invoke('integrations:create-account', input),
    updateAccount: (input) => ipcRenderer.invoke('integrations:update-account', input),
    deleteAccount: (id) => ipcRenderer.invoke('integrations:delete-account', id),
    getGitHubCliStatus: () => ipcRenderer.invoke('integrations:get-github-cli-status'),
    syncGitHubRepos: (input) => ipcRenderer.invoke('integrations:sync-github-repos', input),
    connectGoogleCalendar: (clientId) =>
      ipcRenderer.invoke('integrations:connect-google-calendar', clientId),
    syncGoogleCalendar: (accountId) =>
      ipcRenderer.invoke('integrations:sync-google-calendar', accountId),
    disconnectGoogleCalendar: (accountId) =>
      ipcRenderer.invoke('integrations:disconnect-google-calendar', accountId),
    listWatchFolders: () => ipcRenderer.invoke('integrations:list-watch-folders'),
    createWatchFolder: (input) => ipcRenderer.invoke('integrations:create-watch-folder', input),
    updateWatchFolder: (input) => ipcRenderer.invoke('integrations:update-watch-folder', input),
    deleteWatchFolder: (id) => ipcRenderer.invoke('integrations:delete-watch-folder', id),
    listSyncJobs: () => ipcRenderer.invoke('integrations:list-sync-jobs'),
    syncWatchFolder: (id) => ipcRenderer.invoke('integrations:sync-watch-folder', id)
  },
  plan: {
    listNodes: () => ipcRenderer.invoke('plan:list-nodes'),
    getNode: (id) => ipcRenderer.invoke('plan:get-node', id),
    createNode: (input) => ipcRenderer.invoke('plan:create-node', input),
    updateNode: (input) => ipcRenderer.invoke('plan:update-node', input),
    deleteNode: (id) => ipcRenderer.invoke('plan:delete-node', id),
    listLinks: (nodeId) => ipcRenderer.invoke('plan:list-links', nodeId),
    createLink: (input) => ipcRenderer.invoke('plan:create-link', input),
    deleteLink: (id) => ipcRenderer.invoke('plan:delete-link', id)
  },
  workflow: {
    getSnapshot: (view) => ipcRenderer.invoke('workflow:get-snapshot', view),
    getProjectConnections: (projectId) =>
      ipcRenderer.invoke('workflow:get-project-connections', projectId),
    getSkillsPipeline: (targetRoleId) =>
      ipcRenderer.invoke('workflow:get-skills-pipeline', targetRoleId)
  },
  skills: {
    listDomains: () => ipcRenderer.invoke('skills:list-domains'),
    createDomain: (input) => ipcRenderer.invoke('skills:create-domain', input),
    updateDomain: (input) => ipcRenderer.invoke('skills:update-domain', input),
    deleteDomain: (id) => ipcRenderer.invoke('skills:delete-domain', id),
    listNodes: (domainId) => ipcRenderer.invoke('skills:list-nodes', domainId),
    getNode: (id) => ipcRenderer.invoke('skills:get-node', id),
    createNode: (input) => ipcRenderer.invoke('skills:create-node', input),
    updateNode: (input) => ipcRenderer.invoke('skills:update-node', input),
    deleteNode: (id) => ipcRenderer.invoke('skills:delete-node', id),
    addEvidence: (input) => ipcRenderer.invoke('skills:add-evidence', input),
    updateEvidence: (input) => ipcRenderer.invoke('skills:update-evidence', input),
    confirmEvidence: (id) => ipcRenderer.invoke('skills:confirm-evidence', id),
    deleteEvidence: (id) => ipcRenderer.invoke('skills:delete-evidence', id)
  },
  os: {
    listProfiles: () => ipcRenderer.invoke('os:list-profiles'),
    createProfile: (input) => ipcRenderer.invoke('os:create-profile', input),
    updateProfile: (input) => ipcRenderer.invoke('os:update-profile', input),
    deleteProfile: (id) => ipcRenderer.invoke('os:delete-profile', id),
    listTimeBlocks: (profileId) => ipcRenderer.invoke('os:list-time-blocks', profileId),
    upsertTimeBlock: (input) => ipcRenderer.invoke('os:upsert-time-block', input),
    deleteTimeBlock: (id) => ipcRenderer.invoke('os:delete-time-block', id),
    listDailyLogs: () => ipcRenderer.invoke('os:list-daily-logs'),
    getDailyLog: (date) => ipcRenderer.invoke('os:get-daily-log', date),
    upsertDailyLog: (input) => ipcRenderer.invoke('os:upsert-daily-log', input),
    listHabits: () => ipcRenderer.invoke('os:list-habits'),
    createHabit: (input) => ipcRenderer.invoke('os:create-habit', input),
    updateHabit: (input) => ipcRenderer.invoke('os:update-habit', input),
    deleteHabit: (id) => ipcRenderer.invoke('os:delete-habit', id),
    listHabitLogs: () => ipcRenderer.invoke('os:list-habit-logs'),
    upsertHabitLog: (input) => ipcRenderer.invoke('os:upsert-habit-log', input),
    listCountdowns: () => ipcRenderer.invoke('os:list-countdowns'),
    createCountdown: (input) => ipcRenderer.invoke('os:create-countdown', input),
    updateCountdown: (input) => ipcRenderer.invoke('os:update-countdown', input),
    deleteCountdown: (id) => ipcRenderer.invoke('os:delete-countdown', id),
    listWeeklyPriorities: (weekKey) => ipcRenderer.invoke('os:list-weekly-priorities', weekKey),
    createWeeklyPriority: (input) => ipcRenderer.invoke('os:create-weekly-priority', input),
    updateWeeklyPriority: (input) => ipcRenderer.invoke('os:update-weekly-priority', input),
    deleteWeeklyPriority: (id) => ipcRenderer.invoke('os:delete-weekly-priority', id),
    getWeeklyReview: (weekKey) => ipcRenderer.invoke('os:get-weekly-review', weekKey),
    upsertWeeklyReview: (input) => ipcRenderer.invoke('os:upsert-weekly-review', input)
  },
  settings: {
    getBundle: () => ipcRenderer.invoke('settings:get-bundle'),
    updateUserProfile: (input) => ipcRenderer.invoke('settings:update-user-profile', input),
    updateNarrativeProfile: (input) =>
      ipcRenderer.invoke('settings:update-narrative-profile', input),
    updateDashboardPreferences: (input) =>
      ipcRenderer.invoke('settings:update-dashboard-preferences', input),
    updateIntegrationSettings: (input) =>
      ipcRenderer.invoke('settings:update-integration-settings', input),
    updateThemeSettings: (input) => ipcRenderer.invoke('settings:update-theme-settings', input),
    listQuotes: () => ipcRenderer.invoke('settings:list-quotes'),
    createQuote: (input) => ipcRenderer.invoke('settings:create-quote', input),
    updateQuote: (input) => ipcRenderer.invoke('settings:update-quote', input),
    deleteQuote: (id) => ipcRenderer.invoke('settings:delete-quote', id),
    importQuotes: (input) => ipcRenderer.invoke('settings:import-quotes', input),
    getQuotePreferences: () => ipcRenderer.invoke('settings:get-quote-preferences'),
    updateQuotePreferences: (input) =>
      ipcRenderer.invoke('settings:update-quote-preferences', input)
  },
  pipeline: {
    listOrganizations: () => ipcRenderer.invoke('pipeline:list-organizations'),
    createOrganization: (input) => ipcRenderer.invoke('pipeline:create-organization', input),
    updateOrganization: (input) => ipcRenderer.invoke('pipeline:update-organization', input),
    deleteOrganization: (id) => ipcRenderer.invoke('pipeline:delete-organization', id),
    listRoles: () => ipcRenderer.invoke('pipeline:list-roles'),
    createRole: (input) => ipcRenderer.invoke('pipeline:create-role', input),
    updateRole: (input) => ipcRenderer.invoke('pipeline:update-role', input),
    deleteRole: (id) => ipcRenderer.invoke('pipeline:delete-role', id),
    listRoleRequirements: (roleId) => ipcRenderer.invoke('pipeline:list-role-requirements', roleId),
    createRoleRequirement: (input) => ipcRenderer.invoke('pipeline:create-role-requirement', input),
    updateRoleRequirement: (input) => ipcRenderer.invoke('pipeline:update-role-requirement', input),
    deleteRoleRequirement: (id) => ipcRenderer.invoke('pipeline:delete-role-requirement', id),
    listApplications: () => ipcRenderer.invoke('pipeline:list-applications'),
    createApplication: (input) => ipcRenderer.invoke('pipeline:create-application', input),
    updateApplication: (input) => ipcRenderer.invoke('pipeline:update-application', input),
    deleteApplication: (id) => ipcRenderer.invoke('pipeline:delete-application', id),
    listContacts: () => ipcRenderer.invoke('pipeline:list-contacts'),
    createContact: (input) => ipcRenderer.invoke('pipeline:create-contact', input),
    updateContact: (input) => ipcRenderer.invoke('pipeline:update-contact', input),
    deleteContact: (id) => ipcRenderer.invoke('pipeline:delete-contact', id),
    listInteractions: (contactId) => ipcRenderer.invoke('pipeline:list-interactions', contactId),
    createInteraction: (input) => ipcRenderer.invoke('pipeline:create-interaction', input),
    updateInteraction: (input) => ipcRenderer.invoke('pipeline:update-interaction', input),
    deleteInteraction: (id) => ipcRenderer.invoke('pipeline:delete-interaction', id)
  },
  presence: {
    listNarrativeFragments: () => ipcRenderer.invoke('presence:list-narrative-fragments'),
    createNarrativeFragment: (input) =>
      ipcRenderer.invoke('presence:create-narrative-fragment', input),
    updateNarrativeFragment: (input) =>
      ipcRenderer.invoke('presence:update-narrative-fragment', input),
    deleteNarrativeFragment: (id) =>
      ipcRenderer.invoke('presence:delete-narrative-fragment', id),
    listProfileAssets: () => ipcRenderer.invoke('presence:list-profile-assets'),
    createProfileAsset: (input) => ipcRenderer.invoke('presence:create-profile-asset', input),
    updateProfileAsset: (input) => ipcRenderer.invoke('presence:update-profile-asset', input),
    deleteProfileAsset: (id) => ipcRenderer.invoke('presence:delete-profile-asset', id),
    listCvVariants: () => ipcRenderer.invoke('presence:list-cv-variants'),
    createCvVariant: (input) => ipcRenderer.invoke('presence:create-cv-variant', input),
    updateCvVariant: (input) => ipcRenderer.invoke('presence:update-cv-variant', input),
    deleteCvVariant: (id) => ipcRenderer.invoke('presence:delete-cv-variant', id),
    listCvSections: (cvVariantId) => ipcRenderer.invoke('presence:list-cv-sections', cvVariantId),
    createCvSection: (input) => ipcRenderer.invoke('presence:create-cv-section', input),
    updateCvSection: (input) => ipcRenderer.invoke('presence:update-cv-section', input),
    deleteCvSection: (id) => ipcRenderer.invoke('presence:delete-cv-section', id),
    listCvSectionSources: (sectionId) =>
      ipcRenderer.invoke('presence:list-cv-section-sources', sectionId),
    createCvSectionSource: (input) =>
      ipcRenderer.invoke('presence:create-cv-section-source', input),
    updateCvSectionSource: (input) =>
      ipcRenderer.invoke('presence:update-cv-section-source', input),
    deleteCvSectionSource: (id) => ipcRenderer.invoke('presence:delete-cv-section-source', id),
    syncCvVariantContent: (id) => ipcRenderer.invoke('presence:sync-cv-variant-content', id),
    listContentIdeas: () => ipcRenderer.invoke('presence:list-content-ideas'),
    createContentIdea: (input) => ipcRenderer.invoke('presence:create-content-idea', input),
    updateContentIdea: (input) => ipcRenderer.invoke('presence:update-content-idea', input),
    deleteContentIdea: (id) => ipcRenderer.invoke('presence:delete-content-idea', id),
    listContentPosts: () => ipcRenderer.invoke('presence:list-content-posts'),
    createContentPost: (input) => ipcRenderer.invoke('presence:create-content-post', input),
    updateContentPost: (input) => ipcRenderer.invoke('presence:update-content-post', input),
    deleteContentPost: (id) => ipcRenderer.invoke('presence:delete-content-post', id)
  },
  library: {
    listDocuments: () => ipcRenderer.invoke('library:list-documents'),
    importDocuments: (input) => ipcRenderer.invoke('library:import-documents', input),
    deleteDocument: (id) => ipcRenderer.invoke('library:delete-document', id),
    listExcerpts: (documentId) => ipcRenderer.invoke('library:list-excerpts', documentId),
    listSuggestions: (documentId) => ipcRenderer.invoke('library:list-suggestions', documentId),
    listResolutions: (suggestionId) => ipcRenderer.invoke('library:list-resolutions', suggestionId),
    resolveSuggestion: (input) => ipcRenderer.invoke('library:resolve-suggestion', input)
  },
  project: {
    list: () => ipcRenderer.invoke('project:list'),
    get: (id) => ipcRenderer.invoke('project:get', id),
    create: (input) => ipcRenderer.invoke('project:create', input),
    update: (input) => ipcRenderer.invoke('project:update', input),
    delete: (id) => ipcRenderer.invoke('project:delete', id)
  },
  block: {
    list: (projectId) => ipcRenderer.invoke('block:list', projectId),
    upsert: (input) => ipcRenderer.invoke('block:upsert', input),
    delete: (id) => ipcRenderer.invoke('block:delete', id),
    reorder: (input) => ipcRenderer.invoke('block:reorder', input)
  },
  asset: {
    import: (input) => ipcRenderer.invoke('asset:import', input),
    list: (projectId) => ipcRenderer.invoke('asset:list', projectId),
    delete: (id) => ipcRenderer.invoke('asset:delete', id),
    getDataUri: (id) => ipcRenderer.invoke('asset:get-data-uri', id)
  },
  page: {
    render: (projectId) => ipcRenderer.invoke('page:render', projectId),
    exportHtml: (projectId, outputPath) =>
      ipcRenderer.invoke('page:export-html', projectId, outputPath),
    exportZip: (projectId, outputPath) =>
      ipcRenderer.invoke('page:export-zip', projectId, outputPath)
  },
  git: {
    status: (projectId) => ipcRenderer.invoke('git:status', projectId),
    init: (projectId) => ipcRenderer.invoke('git:init', projectId),
    commit: (projectId, message) => ipcRenderer.invoke('git:commit', projectId, message),
    log: (projectId) => ipcRenderer.invoke('git:log', projectId),
    push: (projectId) => ipcRenderer.invoke('git:push', projectId),
    restore: (projectId, hash) => ipcRenderer.invoke('git:restore', projectId, hash),
    setRemote: (projectId, url) => ipcRenderer.invoke('git:set-remote', projectId, url),
    setToken: (token) => ipcRenderer.invoke('git:set-token', token),
    publish: (projectId) => ipcRenderer.invoke('git:publish', projectId)
  },
  system: {
    openFiles: (options) => ipcRenderer.invoke('system:open-files', options),
    saveFile: (options) => ipcRenderer.invoke('system:save-file', options),
    readTextFile: (filePath) => ipcRenderer.invoke('system:read-text-file', filePath),
    toggleFullscreen: () => ipcRenderer.invoke('system:toggle-fullscreen'),
    setFullscreen: (fullscreen) => ipcRenderer.invoke('system:set-fullscreen', fullscreen),
    isFullscreen: () => ipcRenderer.invoke('system:is-fullscreen')
  }
}

contextBridge.exposeInMainWorld('lab', bridge)
