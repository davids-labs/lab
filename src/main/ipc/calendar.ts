import { ipcMain } from 'electron'
import type {
  CalendarEvent,
  CalendarSource,
  CreateCalendarSourceInput,
  ImportCalendarSourceInput,
  UpdateCalendarSourceInput
} from '../../preload/types'
import { calendarQueries } from '../db/queries/calendar'

export function registerCalendarHandlers(): void {
  ipcMain.handle('calendar:list-sources', async (): Promise<CalendarSource[]> =>
    calendarQueries.listSources()
  )
  ipcMain.handle(
    'calendar:create-source',
    async (_event, input: CreateCalendarSourceInput): Promise<CalendarSource> =>
      calendarQueries.createSource(input)
  )
  ipcMain.handle(
    'calendar:update-source',
    async (_event, input: UpdateCalendarSourceInput): Promise<CalendarSource> =>
      calendarQueries.updateSource(input)
  )
  ipcMain.handle(
    'calendar:delete-source',
    async (_event, id: string): Promise<{ ok: boolean }> => calendarQueries.deleteSource(id)
  )
  ipcMain.handle(
    'calendar:import-ics',
    async (_event, input: ImportCalendarSourceInput): Promise<CalendarSource> =>
      calendarQueries.importIcs(input)
  )
  ipcMain.handle(
    'calendar:list-events',
    async (_event, sourceId?: string): Promise<CalendarEvent[]> => calendarQueries.listEvents(sourceId)
  )
}
