import { create } from 'zustand'
import type {
  ImportSourceDocumentsInput,
  SourceDocument,
  SourceExcerpt,
  ExtractionSuggestion,
  SuggestionResolution,
  ResolveSuggestionInput
} from '@preload/types'

interface LibraryStore {
  documents: SourceDocument[]
  activeDocumentId: string | null
  excerpts: SourceExcerpt[]
  suggestions: ExtractionSuggestion[]
  resolutions: SuggestionResolution[]
  isLoading: boolean
  error: string | null
  loadDocuments: () => Promise<void>
  selectDocument: (id: string | null) => Promise<void>
  importDocuments: (input: ImportSourceDocumentsInput) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  resolveSuggestion: (input: ResolveSuggestionInput) => Promise<void>
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  documents: [],
  activeDocumentId: null,
  excerpts: [],
  suggestions: [],
  resolutions: [],
  isLoading: false,
  error: null,

  async loadDocuments() {
    set({ isLoading: true, error: null })

    try {
      const documents = await window.lab.library.listDocuments()
      const activeDocumentId =
        get().activeDocumentId && documents.some((entry) => entry.id === get().activeDocumentId)
          ? get().activeDocumentId
          : (documents[0]?.id ?? null)

      set({ documents, activeDocumentId, isLoading: false })

      if (activeDocumentId) {
        await get().selectDocument(activeDocumentId)
      } else {
        set({ excerpts: [], suggestions: [] })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load library.',
        isLoading: false
      })
    }
  },

  async selectDocument(id) {
    set({ activeDocumentId: id })

    if (!id) {
      set({ excerpts: [], suggestions: [] })
      return
    }

    const [excerpts, suggestions, resolutions] = await Promise.all([
      window.lab.library.listExcerpts(id),
      window.lab.library.listSuggestions(id),
      window.lab.library.listResolutions()
    ])
    set({ excerpts, suggestions, resolutions })
  },

  async importDocuments(input) {
    await window.lab.library.importDocuments(input)
    await get().loadDocuments()
  },

  async deleteDocument(id) {
    await window.lab.library.deleteDocument(id)
    await get().loadDocuments()
  },

  async resolveSuggestion(input) {
    await window.lab.library.resolveSuggestion(input)
    const current = get().activeDocumentId
    if (current) {
      await get().selectDocument(current)
    } else {
      await get().loadDocuments()
    }
  }
}))
