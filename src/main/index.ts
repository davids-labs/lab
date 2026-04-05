import { app, shell, BrowserWindow } from 'electron'
import fs from 'node:fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initializeDatabase } from './db'
import { registerAssetHandlers } from './ipc/asset'
import { registerBlockHandlers } from './ipc/block'
import { registerDashboardHandlers } from './ipc/dashboard'
import { registerGitHandlers } from './ipc/git'
import { registerLibraryHandlers } from './ipc/library'
import { registerOsHandlers } from './ipc/os'
import { registerPageHandlers } from './ipc/page'
import { registerPlanHandlers } from './ipc/plan'
import { registerPipelineHandlers } from './ipc/pipeline'
import { registerPresenceHandlers } from './ipc/presence'
import { registerProjectHandlers } from './ipc/project'
import { registerSettingsHandlers } from './ipc/settings'
import { registerSkillHandlers } from './ipc/skills'
import { registerSystemHandlers } from './ipc/system'
import { initializeAppPaths } from './services/appPaths'

function createWindow(): void {
  const preloadPath = fs.existsSync(join(__dirname, '../preload/index.mjs'))
    ? join(__dirname, '../preload/index.mjs')
    : join(__dirname, '../preload/index.js')

  const mainWindow = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#fbfbfd',
    title: 'davids.lab',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.david.davids-lab')
  initializeAppPaths(app.getPath('userData'))
  initializeDatabase()
  registerDashboardHandlers()
  registerPlanHandlers()
  registerSkillHandlers()
  registerOsHandlers()
  registerSettingsHandlers()
  registerPipelineHandlers()
  registerPresenceHandlers()
  registerLibraryHandlers()
  registerProjectHandlers()
  registerBlockHandlers()
  registerAssetHandlers()
  registerPageHandlers()
  registerGitHandlers()
  registerSystemHandlers()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
