import { contextBridge, ipcRenderer } from 'electron'
import type { LabBridge } from './types'

const bridge: LabBridge = {
  dashboard: {
    summary: () => ipcRenderer.invoke('dashboard:summary'),
    importStarterTemplate: () => ipcRenderer.invoke('dashboard:import-starter-template')
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
    upsertHabitLog: (input) => ipcRenderer.invoke('os:upsert-habit-log', input),
    listCountdowns: () => ipcRenderer.invoke('os:list-countdowns'),
    createCountdown: (input) => ipcRenderer.invoke('os:create-countdown', input),
    updateCountdown: (input) => ipcRenderer.invoke('os:update-countdown', input),
    deleteCountdown: (id) => ipcRenderer.invoke('os:delete-countdown', id)
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
