import { ipcMain } from 'electron'
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
} from '../../preload/types'
import { presenceQueries } from '../db/queries/presence'

export function registerPresenceHandlers(): void {
  ipcMain.handle('presence:list-narrative-fragments', async (): Promise<NarrativeFragment[]> =>
    presenceQueries.listNarrativeFragments()
  )
  ipcMain.handle(
    'presence:create-narrative-fragment',
    async (_event, input: CreateNarrativeFragmentInput): Promise<NarrativeFragment> =>
      presenceQueries.createNarrativeFragment(input)
  )
  ipcMain.handle(
    'presence:update-narrative-fragment',
    async (_event, input: UpdateNarrativeFragmentInput): Promise<NarrativeFragment> =>
      presenceQueries.updateNarrativeFragment(input)
  )
  ipcMain.handle('presence:delete-narrative-fragment', async (_event, id: string): Promise<{ ok: boolean }> =>
    presenceQueries.deleteNarrativeFragment(id)
  )
  ipcMain.handle('presence:list-profile-assets', async (): Promise<ProfileAsset[]> =>
    presenceQueries.listProfileAssets()
  )
  ipcMain.handle(
    'presence:create-profile-asset',
    async (_event, input: CreateProfileAssetInput): Promise<ProfileAsset> =>
      presenceQueries.createProfileAsset(input)
  )
  ipcMain.handle(
    'presence:update-profile-asset',
    async (_event, input: UpdateProfileAssetInput): Promise<ProfileAsset> =>
      presenceQueries.updateProfileAsset(input)
  )
  ipcMain.handle('presence:delete-profile-asset', async (_event, id: string): Promise<{ ok: boolean }> =>
    presenceQueries.deleteProfileAsset(id)
  )
  ipcMain.handle('presence:list-cv-variants', async (): Promise<CvVariant[]> =>
    presenceQueries.listCvVariants()
  )
  ipcMain.handle(
    'presence:create-cv-variant',
    async (_event, input: CreateCvVariantInput): Promise<CvVariant> =>
      presenceQueries.createCvVariant(input)
  )
  ipcMain.handle(
    'presence:update-cv-variant',
    async (_event, input: UpdateCvVariantInput): Promise<CvVariant> =>
      presenceQueries.updateCvVariant(input)
  )
  ipcMain.handle('presence:delete-cv-variant', async (_event, id: string): Promise<{ ok: boolean }> =>
    presenceQueries.deleteCvVariant(id)
  )
  ipcMain.handle(
    'presence:list-cv-sections',
    async (_event, cvVariantId?: string): Promise<CvVariantSection[]> =>
      presenceQueries.listCvSections(cvVariantId)
  )
  ipcMain.handle(
    'presence:create-cv-section',
    async (_event, input: CreateCvVariantSectionInput): Promise<CvVariantSection> =>
      presenceQueries.createCvSection(input)
  )
  ipcMain.handle(
    'presence:update-cv-section',
    async (_event, input: UpdateCvVariantSectionInput): Promise<CvVariantSection> =>
      presenceQueries.updateCvSection(input)
  )
  ipcMain.handle(
    'presence:delete-cv-section',
    async (_event, id: string): Promise<{ ok: boolean }> => presenceQueries.deleteCvSection(id)
  )
  ipcMain.handle(
    'presence:list-cv-section-sources',
    async (_event, sectionId?: string): Promise<CvVariantSectionSource[]> =>
      presenceQueries.listCvSectionSources(sectionId)
  )
  ipcMain.handle(
    'presence:create-cv-section-source',
    async (_event, input: CreateCvVariantSectionSourceInput): Promise<CvVariantSectionSource> =>
      presenceQueries.createCvSectionSource(input)
  )
  ipcMain.handle(
    'presence:update-cv-section-source',
    async (_event, input: UpdateCvVariantSectionSourceInput): Promise<CvVariantSectionSource> =>
      presenceQueries.updateCvSectionSource(input)
  )
  ipcMain.handle(
    'presence:delete-cv-section-source',
    async (_event, id: string): Promise<{ ok: boolean }> =>
      presenceQueries.deleteCvSectionSource(id)
  )
  ipcMain.handle(
    'presence:sync-cv-variant-content',
    async (_event, id: string): Promise<CvVariant> => presenceQueries.syncCvVariantContent(id)
  )
  ipcMain.handle('presence:list-content-ideas', async (): Promise<ContentIdea[]> =>
    presenceQueries.listContentIdeas()
  )
  ipcMain.handle(
    'presence:create-content-idea',
    async (_event, input: CreateContentIdeaInput): Promise<ContentIdea> =>
      presenceQueries.createContentIdea(input)
  )
  ipcMain.handle(
    'presence:update-content-idea',
    async (_event, input: UpdateContentIdeaInput): Promise<ContentIdea> =>
      presenceQueries.updateContentIdea(input)
  )
  ipcMain.handle('presence:delete-content-idea', async (_event, id: string): Promise<{ ok: boolean }> =>
    presenceQueries.deleteContentIdea(id)
  )
  ipcMain.handle('presence:list-content-posts', async (): Promise<ContentPost[]> =>
    presenceQueries.listContentPosts()
  )
  ipcMain.handle(
    'presence:create-content-post',
    async (_event, input: CreateContentPostInput): Promise<ContentPost> =>
      presenceQueries.createContentPost(input)
  )
  ipcMain.handle(
    'presence:update-content-post',
    async (_event, input: UpdateContentPostInput): Promise<ContentPost> =>
      presenceQueries.updateContentPost(input)
  )
  ipcMain.handle('presence:delete-content-post', async (_event, id: string): Promise<{ ok: boolean }> =>
    presenceQueries.deleteContentPost(id)
  )
}
