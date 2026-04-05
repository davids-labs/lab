import { ipcMain } from 'electron'
import type {
  ExtractionSuggestion,
  ImportSourceDocumentsInput,
  ResolveSuggestionInput,
  SourceDocument,
  SourceExcerpt,
  SuggestionResolution
} from '../../preload/types'
import { libraryQueries } from '../db/queries/library'

export function registerLibraryHandlers(): void {
  ipcMain.handle(
    'library:list-documents',
    async (): Promise<SourceDocument[]> => libraryQueries.listDocuments()
  )
  ipcMain.handle(
    'library:import-documents',
    async (_event, input: ImportSourceDocumentsInput): Promise<SourceDocument[]> =>
      libraryQueries.importDocuments(input)
  )
  ipcMain.handle(
    'library:delete-document',
    async (_event, id: string): Promise<{ ok: boolean }> => libraryQueries.deleteDocument(id)
  )
  ipcMain.handle(
    'library:list-excerpts',
    async (_event, documentId: string): Promise<SourceExcerpt[]> =>
      libraryQueries.listExcerpts(documentId)
  )
  ipcMain.handle(
    'library:list-suggestions',
    async (_event, documentId?: string): Promise<ExtractionSuggestion[]> =>
      libraryQueries.listSuggestions(documentId)
  )
  ipcMain.handle(
    'library:list-resolutions',
    async (_event, suggestionId?: string): Promise<SuggestionResolution[]> =>
      libraryQueries.listResolutions(suggestionId)
  )
  ipcMain.handle(
    'library:resolve-suggestion',
    async (_event, input: ResolveSuggestionInput): Promise<SuggestionResolution> =>
      libraryQueries.resolveSuggestion(input)
  )
}
