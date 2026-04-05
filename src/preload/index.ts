import { contextBridge, ipcRenderer } from 'electron'
import type { LabBridge } from './types'

const bridge: LabBridge = {
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
    readTextFile: (filePath) => ipcRenderer.invoke('system:read-text-file', filePath)
  }
}

contextBridge.exposeInMainWorld('lab', bridge)
