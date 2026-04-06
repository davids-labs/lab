import { ipcMain } from 'electron'
import type {
  CreateNoteLinkInput,
  CreateNotePageInput,
  NoteLink,
  NotePage,
  UpdateNotePageInput
} from '../../preload/types'
import { noteQueries } from '../db/queries/notes'

export function registerNoteHandlers(): void {
  ipcMain.handle('notes:list', async (): Promise<NotePage[]> => noteQueries.list())
  ipcMain.handle('notes:get', async (_event, id: string): Promise<NotePage> => noteQueries.get(id))
  ipcMain.handle(
    'notes:create',
    async (_event, input: CreateNotePageInput): Promise<NotePage> => noteQueries.create(input)
  )
  ipcMain.handle(
    'notes:update',
    async (_event, input: UpdateNotePageInput): Promise<NotePage> => noteQueries.update(input)
  )
  ipcMain.handle(
    'notes:delete',
    async (_event, id: string): Promise<{ ok: boolean }> => noteQueries.delete(id)
  )
  ipcMain.handle('notes:list-links', async (_event, noteId?: string): Promise<NoteLink[]> =>
    noteQueries.listLinks(noteId)
  )
  ipcMain.handle(
    'notes:create-link',
    async (_event, input: CreateNoteLinkInput): Promise<NoteLink> => noteQueries.createLink(input)
  )
  ipcMain.handle(
    'notes:delete-link',
    async (_event, id: string): Promise<{ ok: boolean }> => noteQueries.deleteLink(id)
  )
}
