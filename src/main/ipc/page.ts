import { dialog, ipcMain } from 'electron'
import path from 'node:path'
import { projectQueries } from '../db/queries/projects'
import { renderProjectHtml, writeHtmlExport, writeZipExport } from '../renderer/pageRenderer'

export function registerPageHandlers(): void {
  ipcMain.handle(
    'page:render',
    async (_event, projectId: string): Promise<string> => renderProjectHtml(projectId, 'preview')
  )

  ipcMain.handle(
    'page:export-html',
    async (
      _event,
      projectId: string,
      outputPath?: string
    ): Promise<{ ok: boolean; path?: string }> => {
      const project = projectQueries.get(projectId)
      const finalPath =
        outputPath ??
        (
          await dialog.showSaveDialog({
            title: 'Export HTML',
            defaultPath: path.join(process.cwd(), `${project.slug}.html`),
            filters: [{ name: 'HTML', extensions: ['html'] }]
          })
        ).filePath

      if (!finalPath) {
        return { ok: false }
      }

      return writeHtmlExport(projectId, finalPath)
    }
  )

  ipcMain.handle(
    'page:export-zip',
    async (
      _event,
      projectId: string,
      outputPath?: string
    ): Promise<{ ok: boolean; path?: string }> => {
      const project = projectQueries.get(projectId)
      const finalPath =
        outputPath ??
        (
          await dialog.showSaveDialog({
            title: 'Export ZIP',
            defaultPath: path.join(process.cwd(), `${project.slug}.zip`),
            filters: [{ name: 'ZIP', extensions: ['zip'] }]
          })
        ).filePath

      if (!finalPath) {
        return { ok: false }
      }

      return writeZipExport(projectId, finalPath)
    }
  )
}
