import { create } from 'zustand'
import type {
  ContentIdea,
  ContentPost,
  CreateContentIdeaInput,
  CreateContentPostInput,
  CreateCvVariantSectionInput,
  CreateCvVariantSectionSourceInput,
  CreateCvVariantInput,
  CreateNarrativeFragmentInput,
  CreateProfileAssetInput,
  CvVariant,
  CvVariantSection,
  CvVariantSectionSource,
  NarrativeFragment,
  ProfileAsset,
  UpdateContentIdeaInput,
  UpdateContentPostInput,
  UpdateCvVariantSectionInput,
  UpdateCvVariantSectionSourceInput,
  UpdateCvVariantInput,
  UpdateNarrativeFragmentInput,
  UpdateProfileAssetInput
} from '@preload/types'

interface PresenceStore {
  narrativeFragments: NarrativeFragment[]
  profileAssets: ProfileAsset[]
  cvVariants: CvVariant[]
  cvSections: CvVariantSection[]
  cvSectionSources: CvVariantSectionSource[]
  contentIdeas: ContentIdea[]
  contentPosts: ContentPost[]
  isLoading: boolean
  error: string | null
  loadAll: () => Promise<void>
  createNarrativeFragment: (input: CreateNarrativeFragmentInput) => Promise<void>
  updateNarrativeFragment: (input: UpdateNarrativeFragmentInput) => Promise<void>
  deleteNarrativeFragment: (id: string) => Promise<void>
  createProfileAsset: (input: CreateProfileAssetInput) => Promise<void>
  updateProfileAsset: (input: UpdateProfileAssetInput) => Promise<void>
  deleteProfileAsset: (id: string) => Promise<void>
  createCvVariant: (input: CreateCvVariantInput) => Promise<void>
  updateCvVariant: (input: UpdateCvVariantInput) => Promise<void>
  deleteCvVariant: (id: string) => Promise<void>
  createCvSection: (input: CreateCvVariantSectionInput) => Promise<void>
  updateCvSection: (input: UpdateCvVariantSectionInput) => Promise<void>
  deleteCvSection: (id: string) => Promise<void>
  createCvSectionSource: (input: CreateCvVariantSectionSourceInput) => Promise<void>
  updateCvSectionSource: (input: UpdateCvVariantSectionSourceInput) => Promise<void>
  deleteCvSectionSource: (id: string) => Promise<void>
  syncCvVariantContent: (id: string) => Promise<void>
  createContentIdea: (input: CreateContentIdeaInput) => Promise<void>
  updateContentIdea: (input: UpdateContentIdeaInput) => Promise<void>
  deleteContentIdea: (id: string) => Promise<void>
  createContentPost: (input: CreateContentPostInput) => Promise<void>
  updateContentPost: (input: UpdateContentPostInput) => Promise<void>
  deleteContentPost: (id: string) => Promise<void>
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  narrativeFragments: [],
  profileAssets: [],
  cvVariants: [],
  cvSections: [],
  cvSectionSources: [],
  contentIdeas: [],
  contentPosts: [],
  isLoading: false,
  error: null,

  async loadAll() {
    set({ isLoading: true, error: null })

    try {
      const [narrativeFragments, profileAssets, cvVariants, cvSections, cvSectionSources, contentIdeas, contentPosts] =
        await Promise.all([
          window.lab.presence.listNarrativeFragments(),
          window.lab.presence.listProfileAssets(),
          window.lab.presence.listCvVariants(),
          window.lab.presence.listCvSections(),
          window.lab.presence.listCvSectionSources(),
          window.lab.presence.listContentIdeas(),
          window.lab.presence.listContentPosts()
        ])

      set({
        narrativeFragments,
        profileAssets,
        cvVariants,
        cvSections,
        cvSectionSources,
        contentIdeas,
        contentPosts,
        isLoading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load presence workspace.',
        isLoading: false
      })
    }
  },

  async createNarrativeFragment(input) {
    await window.lab.presence.createNarrativeFragment(input)
    await get().loadAll()
  },
  async updateNarrativeFragment(input) {
    await window.lab.presence.updateNarrativeFragment(input)
    await get().loadAll()
  },
  async deleteNarrativeFragment(id) {
    await window.lab.presence.deleteNarrativeFragment(id)
    await get().loadAll()
  },
  async createProfileAsset(input) {
    await window.lab.presence.createProfileAsset(input)
    await get().loadAll()
  },
  async updateProfileAsset(input) {
    await window.lab.presence.updateProfileAsset(input)
    await get().loadAll()
  },
  async deleteProfileAsset(id) {
    await window.lab.presence.deleteProfileAsset(id)
    await get().loadAll()
  },
  async createCvVariant(input) {
    await window.lab.presence.createCvVariant(input)
    await get().loadAll()
  },
  async updateCvVariant(input) {
    await window.lab.presence.updateCvVariant(input)
    await get().loadAll()
  },
  async deleteCvVariant(id) {
    await window.lab.presence.deleteCvVariant(id)
    await get().loadAll()
  },
  async createCvSection(input) {
    await window.lab.presence.createCvSection(input)
    await get().loadAll()
  },
  async updateCvSection(input) {
    await window.lab.presence.updateCvSection(input)
    await get().loadAll()
  },
  async deleteCvSection(id) {
    await window.lab.presence.deleteCvSection(id)
    await get().loadAll()
  },
  async createCvSectionSource(input) {
    await window.lab.presence.createCvSectionSource(input)
    await get().loadAll()
  },
  async updateCvSectionSource(input) {
    await window.lab.presence.updateCvSectionSource(input)
    await get().loadAll()
  },
  async deleteCvSectionSource(id) {
    await window.lab.presence.deleteCvSectionSource(id)
    await get().loadAll()
  },
  async syncCvVariantContent(id) {
    await window.lab.presence.syncCvVariantContent(id)
    await get().loadAll()
  },
  async createContentIdea(input) {
    await window.lab.presence.createContentIdea(input)
    await get().loadAll()
  },
  async updateContentIdea(input) {
    await window.lab.presence.updateContentIdea(input)
    await get().loadAll()
  },
  async deleteContentIdea(id) {
    await window.lab.presence.deleteContentIdea(id)
    await get().loadAll()
  },
  async createContentPost(input) {
    await window.lab.presence.createContentPost(input)
    await get().loadAll()
  },
  async updateContentPost(input) {
    await window.lab.presence.updateContentPost(input)
    await get().loadAll()
  },
  async deleteContentPost(id) {
    await window.lab.presence.deleteContentPost(id)
    await get().loadAll()
  }
}))
