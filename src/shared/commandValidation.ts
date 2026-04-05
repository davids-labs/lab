import { z } from 'zod'
import type {
  CreateCountdownInput,
  CreateOsHabitInput,
  CreateOsProfileInput,
  CreatePlanLinkInput,
  CreatePlanNodeInput,
  CreateSkillDomainInput,
  CreateSkillEvidenceInput,
  CreateSkillNodeInput,
  UpdateCountdownInput,
  UpdateOsHabitInput,
  UpdateOsProfileInput,
  UpdatePlanNodeInput,
  UpdateSkillDomainInput,
  UpdateSkillEvidenceInput,
  UpdateSkillNodeInput,
  UpsertOsDailyLogInput,
  UpsertOsHabitLogInput,
  UpsertOsTimeBlockInput
} from '../preload/types'
import {
  HABIT_FREQUENCIES,
  PLAN_LINK_TARGET_TYPES,
  PLAN_NODE_KINDS,
  PLAN_NODE_STATUSES,
  PROJECT_EXECUTION_STAGES,
  SKILL_EVIDENCE_SOURCE_TYPES
} from '../preload/types'

const nullableTrimmedString = z.string().trim().nullable()
const isoDateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)

export const createPlanNodeInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  kind: z.enum(PLAN_NODE_KINDS),
  parent_id: z.string().trim().nullable().optional(),
  summary: z.string().trim().max(400).nullable().optional(),
  status: z.enum(PLAN_NODE_STATUSES).optional(),
  start_at: z.number().int().nullable().optional(),
  due_at: z.number().int().nullable().optional(),
  notes: z.string().trim().max(2_000).nullable().optional(),
  sort_order: z.number().optional()
})

export const updatePlanNodeInputSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(160).optional(),
  kind: z.enum(PLAN_NODE_KINDS).optional(),
  parent_id: z.string().trim().nullable().optional(),
  summary: z.string().trim().max(400).nullable().optional(),
  status: z.enum(PLAN_NODE_STATUSES).optional(),
  start_at: z.number().int().nullable().optional(),
  due_at: z.number().int().nullable().optional(),
  notes: z.string().trim().max(2_000).nullable().optional(),
  sort_order: z.number().optional()
})

export const createPlanLinkInputSchema = z.object({
  node_id: z.string().trim().min(1),
  target_type: z.enum(PLAN_LINK_TARGET_TYPES),
  target_id: z.string().trim().min(1),
  required_stage: z.enum(PROJECT_EXECUTION_STAGES).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional()
})

export const createSkillDomainInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).nullable().optional(),
  sort_order: z.number().optional()
})

export const updateSkillDomainInputSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(400).nullable().optional(),
  sort_order: z.number().optional()
})

export const createSkillNodeInputSchema = z.object({
  domain_id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().optional()
})

export const updateSkillNodeInputSchema = z.object({
  id: z.string().trim().min(1),
  domain_id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().optional()
})

export const createSkillEvidenceInputSchema = z.object({
  skill_id: z.string().trim().min(1),
  source_type: z.enum(SKILL_EVIDENCE_SOURCE_TYPES),
  label: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(800).nullable().optional(),
  project_id: z.string().trim().nullable().optional(),
  certification_name: z.string().trim().max(160).nullable().optional(),
  link_url: z.string().trim().url().nullable().optional(),
  required_stage: z.enum(PROJECT_EXECUTION_STAGES).nullable().optional()
})

export const updateSkillEvidenceInputSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(160).optional(),
  notes: z.string().trim().max(800).nullable().optional(),
  project_id: z.string().trim().nullable().optional(),
  certification_name: z.string().trim().max(160).nullable().optional(),
  link_url: z.string().trim().url().nullable().optional(),
  required_stage: z.enum(PROJECT_EXECUTION_STAGES).nullable().optional()
})

export const createOsProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  is_default: z.boolean().optional()
})

export const updateOsProfileInputSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  is_default: z.boolean().optional()
})

export const upsertOsTimeBlockInputSchema = z.object({
  id: z.string().trim().optional(),
  profile_id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(120),
  hours: z.number().min(0).max(24),
  color: z.string().trim().min(4).max(32),
  sort_order: z.number().optional()
})

export const upsertOsDailyLogInputSchema = z.object({
  id: z.string().trim().optional(),
  date: isoDateSchema,
  profile_id: z.string().trim().nullable().optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  calories: z.number().int().min(0).max(20_000).optional(),
  protein_grams: z.number().int().min(0).max(2_000).optional(),
  water_litres: z.number().min(0).max(20).optional(),
  deep_work_minutes: z.number().int().min(0).max(1_440).optional(),
  gym_done: z.boolean().optional(),
  notes: z.string().trim().max(4_000).nullable().optional()
})

export const createOsHabitInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).nullable().optional(),
  frequency: z.enum(HABIT_FREQUENCIES).optional(),
  target_count: z.number().int().min(1).max(100).optional(),
  sort_order: z.number().optional()
})

export const updateOsHabitInputSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  frequency: z.enum(HABIT_FREQUENCIES).optional(),
  target_count: z.number().int().min(1).max(100).optional(),
  sort_order: z.number().optional()
})

export const upsertOsHabitLogInputSchema = z.object({
  id: z.string().trim().optional(),
  habit_id: z.string().trim().min(1),
  date: isoDateSchema,
  completed: z.boolean(),
  notes: z.string().trim().max(1_000).nullable().optional()
})

export const createCountdownInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  target_date: isoDateSchema,
  category: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(400).nullable().optional()
})

export const updateCountdownInputSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(160).optional(),
  target_date: isoDateSchema.optional(),
  category: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(400).nullable().optional()
})

export function validateCreatePlanNodeInput(input: unknown): CreatePlanNodeInput {
  return createPlanNodeInputSchema.parse(input)
}

export function validateUpdatePlanNodeInput(input: unknown): UpdatePlanNodeInput {
  return updatePlanNodeInputSchema.parse(input)
}

export function validateCreatePlanLinkInput(input: unknown): CreatePlanLinkInput {
  return createPlanLinkInputSchema.parse(input)
}

export function validateCreateSkillDomainInput(input: unknown): CreateSkillDomainInput {
  return createSkillDomainInputSchema.parse(input)
}

export function validateUpdateSkillDomainInput(input: unknown): UpdateSkillDomainInput {
  return updateSkillDomainInputSchema.parse(input)
}

export function validateCreateSkillNodeInput(input: unknown): CreateSkillNodeInput {
  return createSkillNodeInputSchema.parse(input)
}

export function validateUpdateSkillNodeInput(input: unknown): UpdateSkillNodeInput {
  return updateSkillNodeInputSchema.parse(input)
}

export function validateCreateSkillEvidenceInput(input: unknown): CreateSkillEvidenceInput {
  return createSkillEvidenceInputSchema.parse(input)
}

export function validateUpdateSkillEvidenceInput(input: unknown): UpdateSkillEvidenceInput {
  return updateSkillEvidenceInputSchema.parse(input)
}

export function validateCreateOsProfileInput(input: unknown): CreateOsProfileInput {
  return createOsProfileInputSchema.parse(input)
}

export function validateUpdateOsProfileInput(input: unknown): UpdateOsProfileInput {
  return updateOsProfileInputSchema.parse(input)
}

export function validateUpsertOsTimeBlockInput(input: unknown): UpsertOsTimeBlockInput {
  return upsertOsTimeBlockInputSchema.parse(input)
}

export function validateUpsertOsDailyLogInput(input: unknown): UpsertOsDailyLogInput {
  return upsertOsDailyLogInputSchema.parse(input)
}

export function validateCreateOsHabitInput(input: unknown): CreateOsHabitInput {
  return createOsHabitInputSchema.parse(input)
}

export function validateUpdateOsHabitInput(input: unknown): UpdateOsHabitInput {
  return updateOsHabitInputSchema.parse(input)
}

export function validateUpsertOsHabitLogInput(input: unknown): UpsertOsHabitLogInput {
  return upsertOsHabitLogInputSchema.parse(input)
}

export function validateCreateCountdownInput(input: unknown): CreateCountdownInput {
  return createCountdownInputSchema.parse(input)
}

export function validateUpdateCountdownInput(input: unknown): UpdateCountdownInput {
  return updateCountdownInputSchema.parse(input)
}

export function toNullableString(value: string | null | undefined): string | null {
  const parsed = nullableTrimmedString.parse(value ?? null)
  return parsed && parsed.length > 0 ? parsed : null
}
