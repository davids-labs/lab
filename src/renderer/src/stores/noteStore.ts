import { create } from 'zustand'
import type {
  CreateNoteLinkInput,
  CreateNotePageInput,
  NoteLink,
  NotePage,
  UpdateNotePageInput
} from '@preload/types'

interface NoteStore {
  notes: NotePage[]
  activeNote: NotePage | null
  links: NoteLink[]
  isLoading: boolean
  error: string | null
  loadNotes: () => Promise<void>
  selectNote: (id: string | null) => Promise<void>
  createNote: (input: CreateNotePageInput) => Promise<NotePage>
  updateNote: (input: UpdateNotePageInput) => Promise<NotePage>
  deleteNote: (id: string) => Promise<void>
  createLink: (input: CreateNoteLinkInput) => Promise<NoteLink>
  deleteLink: (id: string) => Promise<void>
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  activeNote: null,
  links: [],
  isLoading: false,
  error: null,

  async loadNotes() {
    set({ isLoading: true, error: null })
    try {
      const notes = await window.lab.notes.list()
      const activeId =
        get().activeNote && notes.some((note) => note.id === get().activeNote?.id)
          ? (get().activeNote?.id ?? null)
          : notes[0]?.id ?? null
      set({ notes, isLoading: false })
      await get().selectNote(activeId)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load notes.',
        isLoading: false
      })
    }
  },

  async selectNote(id) {
    if (!id) {
      set({ activeNote: null, links: [] })
      return
    }

    const [activeNote, links] = await Promise.all([
      window.lab.notes.get(id),
      window.lab.notes.listLinks(id)
    ])
    set({ activeNote, links })
  },

  async createNote(input) {
    const note = await window.lab.notes.create(input)
    await get().loadNotes()
    await get().selectNote(note.id)
    return note
  },

  async updateNote(input) {
    const note = await window.lab.notes.update(input)
    await get().loadNotes()
    await get().selectNote(note.id)
    return note
  },

  async deleteNote(id) {
    await window.lab.notes.delete(id)
    await get().loadNotes()
  },

  async createLink(input) {
    const link = await window.lab.notes.createLink(input)
    await get().selectNote(input.note_id)
    return link
  },

  async deleteLink(id) {
    await window.lab.notes.deleteLink(id)
    if (get().activeNote) {
      await get().selectNote(get().activeNote!.id)
    }
  }
}))
