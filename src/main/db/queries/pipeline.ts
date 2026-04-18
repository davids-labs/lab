import { asc, desc, eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import type {
  ApplicationRecord,
  ContactRecord,
  CreateApplicationRecordInput,
  CreateContactRecordInput,
  CreateInteractionRecordInput,
  CreateTargetRoleSkillRequirementInput,
  CreateTargetOrganizationInput,
  CreateTargetRoleInput,
  InteractionRecord,
  TargetOrganization,
  TargetRole,
  TargetRoleSkillRequirement,
  UpdateApplicationRecordInput,
  UpdateContactRecordInput,
  UpdateInteractionRecordInput,
  UpdateTargetRoleSkillRequirementInput,
  UpdateTargetOrganizationInput,
  UpdateTargetRoleInput
} from '../../../preload/types'
import { getDb } from '../index'
import {
  applicationRecordsTable,
  contactRecordsTable,
  interactionRecordsTable,
  targetRoleSkillRequirementsTable,
  targetOrganizationsTable,
  targetRolesTable,
  type ApplicationRecordRow,
  type ContactRecordRow,
  type InteractionRecordRow,
  type TargetRoleSkillRequirementRow,
  type TargetOrganizationRow,
  type TargetRoleRow
} from '../schema'

function clean(value: string | null | undefined): string | null {
  const next = value?.trim() ?? ''
  return next.length > 0 ? next : null
}

function deserializeOrganization(row: TargetOrganizationRow): TargetOrganization {
  return {
    ...row,
    location: row.location ?? null,
    why_fit: row.why_fit ?? null,
    notes: row.notes ?? null,
    priority: row.priority as TargetOrganization['priority']
  }
}

function deserializeRole(row: TargetRoleRow): TargetRole {
  return {
    ...row,
    organization_id: row.organization_id ?? null,
    location: row.location ?? null,
    role_type: row.role_type ?? null,
    season: row.season ?? null,
    notes: row.notes ?? null
  }
}

function deserializeApplication(row: ApplicationRecordRow): ApplicationRecord {
  return {
    ...row,
    organization_id: row.organization_id ?? null,
    target_role_id: row.target_role_id ?? null,
    cv_variant_id: row.cv_variant_id ?? null,
    deadline_at: row.deadline_at ?? null,
    applied_at: row.applied_at ?? null,
    follow_up_at: row.follow_up_at ?? null,
    notes: row.notes ?? null,
    linked_project_id: row.linked_project_id ?? null,
    linked_skill_id: row.linked_skill_id ?? null,
    status: row.status as ApplicationRecord['status']
  }
}

function deserializeContact(row: ContactRecordRow): ContactRecord {
  return {
    ...row,
    organization_id: row.organization_id ?? null,
    role_title: row.role_title ?? null,
    platform: row.platform ?? null,
    profile_url: row.profile_url ?? null,
    relationship_stage: row.relationship_stage ?? null,
    notes: row.notes ?? null
  }
}

function deserializeInteraction(row: InteractionRecordRow): InteractionRecord {
  return {
    ...row,
    next_action_at: row.next_action_at ?? null
  }
}

function deserializeRoleRequirement(row: TargetRoleSkillRequirementRow): TargetRoleSkillRequirement {
  return {
    ...row,
    minimum_state: row.minimum_state as TargetRoleSkillRequirement['minimum_state'],
    priority: row.priority as TargetRoleSkillRequirement['priority'],
    notes: row.notes ?? null
  }
}

export const pipelineQueries = {
  listOrganizations(): TargetOrganization[] {
    const db = getDb()
    return db
      .select()
      .from(targetOrganizationsTable)
      .orderBy(asc(targetOrganizationsTable.priority), asc(targetOrganizationsTable.name))
      .all()
      .map(deserializeOrganization)
  },

  createOrganization(input: CreateTargetOrganizationInput): TargetOrganization {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(targetOrganizationsTable)
      .values({
        id,
        name: input.name.trim(),
        category: clean(input.category) ?? 'Company',
        location: clean(input.location),
        priority: input.priority ?? 'medium',
        why_fit: clean(input.why_fit),
        notes: clean(input.notes),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeOrganization(
      db.select().from(targetOrganizationsTable).where(eq(targetOrganizationsTable.id, id)).get()!
    )
  },

  updateOrganization(input: UpdateTargetOrganizationInput): TargetOrganization {
    const db = getDb()
    const current = db
      .select()
      .from(targetOrganizationsTable)
      .where(eq(targetOrganizationsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Target organization not found')
    }

    db.update(targetOrganizationsTable)
      .set({
        name: input.name?.trim() || current.name,
        category:
          input.category === undefined ? current.category : (clean(input.category) ?? 'Company'),
        location: input.location === undefined ? current.location : clean(input.location),
        priority: input.priority ?? current.priority,
        why_fit: input.why_fit === undefined ? current.why_fit : clean(input.why_fit),
        notes: input.notes === undefined ? current.notes : clean(input.notes),
        updated_at: Date.now()
      })
      .where(eq(targetOrganizationsTable.id, input.id))
      .run()

    return deserializeOrganization(
      db
        .select()
        .from(targetOrganizationsTable)
        .where(eq(targetOrganizationsTable.id, input.id))
        .get()!
    )
  },

  deleteOrganization(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(targetOrganizationsTable).where(eq(targetOrganizationsTable.id, id)).run()
    return { ok: true }
  },

  listRoles(): TargetRole[] {
    const db = getDb()
    return db
      .select()
      .from(targetRolesTable)
      .orderBy(desc(targetRolesTable.updated_at))
      .all()
      .map(deserializeRole)
  },

  createRole(input: CreateTargetRoleInput): TargetRole {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(targetRolesTable)
      .values({
        id,
        organization_id: input.organization_id ?? null,
        title: input.title.trim(),
        location: clean(input.location),
        role_type: clean(input.role_type),
        season: clean(input.season),
        notes: clean(input.notes),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeRole(
      db.select().from(targetRolesTable).where(eq(targetRolesTable.id, id)).get()!
    )
  },

  updateRole(input: UpdateTargetRoleInput): TargetRole {
    const db = getDb()
    const current = db
      .select()
      .from(targetRolesTable)
      .where(eq(targetRolesTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Target role not found')
    }

    db.update(targetRolesTable)
      .set({
        organization_id:
          input.organization_id === undefined ? current.organization_id : input.organization_id,
        title: input.title?.trim() || current.title,
        location: input.location === undefined ? current.location : clean(input.location),
        role_type: input.role_type === undefined ? current.role_type : clean(input.role_type),
        season: input.season === undefined ? current.season : clean(input.season),
        notes: input.notes === undefined ? current.notes : clean(input.notes),
        updated_at: Date.now()
      })
      .where(eq(targetRolesTable.id, input.id))
      .run()

    return deserializeRole(
      db.select().from(targetRolesTable).where(eq(targetRolesTable.id, input.id)).get()!
    )
  },

  deleteRole(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(targetRolesTable).where(eq(targetRolesTable.id, id)).run()
    return { ok: true }
  },

  listRoleRequirements(roleId?: string): TargetRoleSkillRequirement[] {
    const db = getDb()
    const rows = roleId
      ? db
          .select()
          .from(targetRoleSkillRequirementsTable)
          .where(eq(targetRoleSkillRequirementsTable.role_id, roleId))
          .orderBy(
            asc(targetRoleSkillRequirementsTable.sort_order),
            asc(targetRoleSkillRequirementsTable.created_at)
          )
          .all()
      : db
          .select()
          .from(targetRoleSkillRequirementsTable)
          .orderBy(
            asc(targetRoleSkillRequirementsTable.sort_order),
            asc(targetRoleSkillRequirementsTable.created_at)
          )
          .all()

    return rows.map(deserializeRoleRequirement)
  },

  createRoleRequirement(input: CreateTargetRoleSkillRequirementInput): TargetRoleSkillRequirement {
    const db = getDb()
    const now = Date.now()
    const id = ulid()
    const existing = this.listRoleRequirements(input.role_id)

    db.insert(targetRoleSkillRequirementsTable)
      .values({
        id,
        role_id: input.role_id,
        skill_id: input.skill_id,
        minimum_state: input.minimum_state ?? 'verified',
        priority: input.priority ?? 'high',
        notes: clean(input.notes),
        sort_order:
          input.sort_order ?? (existing.length > 0 ? Math.max(...existing.map((item) => item.sort_order)) + 1 : 0),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeRoleRequirement(
      db
        .select()
        .from(targetRoleSkillRequirementsTable)
        .where(eq(targetRoleSkillRequirementsTable.id, id))
        .get()!
    )
  },

  updateRoleRequirement(
    input: UpdateTargetRoleSkillRequirementInput
  ): TargetRoleSkillRequirement {
    const db = getDb()
    const current = db
      .select()
      .from(targetRoleSkillRequirementsTable)
      .where(eq(targetRoleSkillRequirementsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Role requirement not found')
    }

    db.update(targetRoleSkillRequirementsTable)
      .set({
        skill_id: input.skill_id ?? current.skill_id,
        minimum_state: input.minimum_state ?? current.minimum_state,
        priority: input.priority ?? current.priority,
        notes: input.notes === undefined ? current.notes : clean(input.notes),
        sort_order: input.sort_order ?? current.sort_order,
        updated_at: Date.now()
      })
      .where(eq(targetRoleSkillRequirementsTable.id, input.id))
      .run()

    return deserializeRoleRequirement(
      db
        .select()
        .from(targetRoleSkillRequirementsTable)
        .where(eq(targetRoleSkillRequirementsTable.id, input.id))
        .get()!
    )
  },

  deleteRoleRequirement(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(targetRoleSkillRequirementsTable).where(eq(targetRoleSkillRequirementsTable.id, id)).run()
    return { ok: true }
  },

  listApplications(): ApplicationRecord[] {
    const db = getDb()
    return db
      .select()
      .from(applicationRecordsTable)
      .orderBy(desc(applicationRecordsTable.updated_at))
      .all()
      .map(deserializeApplication)
  },

  createApplication(input: CreateApplicationRecordInput): ApplicationRecord {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(applicationRecordsTable)
      .values({
        id,
        organization_id: input.organization_id ?? null,
        target_role_id: input.target_role_id ?? null,
        cv_variant_id: input.cv_variant_id ?? null,
        title: input.title.trim(),
        status: input.status ?? 'target',
        deadline_at: input.deadline_at ?? null,
        applied_at: input.applied_at ?? null,
        follow_up_at: input.follow_up_at ?? null,
        notes: clean(input.notes),
        linked_project_id: input.linked_project_id ?? null,
        linked_skill_id: input.linked_skill_id ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeApplication(
      db.select().from(applicationRecordsTable).where(eq(applicationRecordsTable.id, id)).get()!
    )
  },

  updateApplication(input: UpdateApplicationRecordInput): ApplicationRecord {
    const db = getDb()
    const current = db
      .select()
      .from(applicationRecordsTable)
      .where(eq(applicationRecordsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Application record not found')
    }

    db.update(applicationRecordsTable)
      .set({
        organization_id:
          input.organization_id === undefined ? current.organization_id : input.organization_id,
        target_role_id:
          input.target_role_id === undefined ? current.target_role_id : input.target_role_id,
        cv_variant_id:
          input.cv_variant_id === undefined ? current.cv_variant_id : input.cv_variant_id,
        title: input.title?.trim() || current.title,
        status: input.status ?? current.status,
        deadline_at: input.deadline_at === undefined ? current.deadline_at : input.deadline_at,
        applied_at: input.applied_at === undefined ? current.applied_at : input.applied_at,
        follow_up_at: input.follow_up_at === undefined ? current.follow_up_at : input.follow_up_at,
        notes: input.notes === undefined ? current.notes : clean(input.notes),
        linked_project_id:
          input.linked_project_id === undefined
            ? current.linked_project_id
            : input.linked_project_id,
        linked_skill_id:
          input.linked_skill_id === undefined ? current.linked_skill_id : input.linked_skill_id,
        updated_at: Date.now()
      })
      .where(eq(applicationRecordsTable.id, input.id))
      .run()

    return deserializeApplication(
      db
        .select()
        .from(applicationRecordsTable)
        .where(eq(applicationRecordsTable.id, input.id))
        .get()!
    )
  },

  deleteApplication(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(applicationRecordsTable).where(eq(applicationRecordsTable.id, id)).run()
    return { ok: true }
  },

  listContacts(): ContactRecord[] {
    const db = getDb()
    return db
      .select()
      .from(contactRecordsTable)
      .orderBy(desc(contactRecordsTable.updated_at))
      .all()
      .map(deserializeContact)
  },

  createContact(input: CreateContactRecordInput): ContactRecord {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(contactRecordsTable)
      .values({
        id,
        organization_id: input.organization_id ?? null,
        full_name: input.full_name.trim(),
        role_title: clean(input.role_title),
        platform: clean(input.platform),
        profile_url: clean(input.profile_url),
        relationship_stage: clean(input.relationship_stage),
        notes: clean(input.notes),
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeContact(
      db.select().from(contactRecordsTable).where(eq(contactRecordsTable.id, id)).get()!
    )
  },

  updateContact(input: UpdateContactRecordInput): ContactRecord {
    const db = getDb()
    const current = db
      .select()
      .from(contactRecordsTable)
      .where(eq(contactRecordsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Contact record not found')
    }

    db.update(contactRecordsTable)
      .set({
        organization_id:
          input.organization_id === undefined ? current.organization_id : input.organization_id,
        full_name: input.full_name?.trim() || current.full_name,
        role_title: input.role_title === undefined ? current.role_title : clean(input.role_title),
        platform: input.platform === undefined ? current.platform : clean(input.platform),
        profile_url:
          input.profile_url === undefined ? current.profile_url : clean(input.profile_url),
        relationship_stage:
          input.relationship_stage === undefined
            ? current.relationship_stage
            : clean(input.relationship_stage),
        notes: input.notes === undefined ? current.notes : clean(input.notes),
        updated_at: Date.now()
      })
      .where(eq(contactRecordsTable.id, input.id))
      .run()

    return deserializeContact(
      db.select().from(contactRecordsTable).where(eq(contactRecordsTable.id, input.id)).get()!
    )
  },

  deleteContact(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(contactRecordsTable).where(eq(contactRecordsTable.id, id)).run()
    return { ok: true }
  },

  listInteractions(contactId?: string): InteractionRecord[] {
    const db = getDb()
    const rows = contactId
      ? db
          .select()
          .from(interactionRecordsTable)
          .where(eq(interactionRecordsTable.contact_id, contactId))
          .orderBy(desc(interactionRecordsTable.happened_at))
          .all()
      : db
          .select()
          .from(interactionRecordsTable)
          .orderBy(desc(interactionRecordsTable.happened_at))
          .all()

    return rows.map(deserializeInteraction)
  },

  createInteraction(input: CreateInteractionRecordInput): InteractionRecord {
    const db = getDb()
    const now = Date.now()
    const id = ulid()

    db.insert(interactionRecordsTable)
      .values({
        id,
        contact_id: input.contact_id,
        interaction_type: input.interaction_type.trim() || 'note',
        happened_at: input.happened_at ?? now,
        summary: input.summary.trim(),
        next_action_at: input.next_action_at ?? null,
        created_at: now,
        updated_at: now
      })
      .run()

    return deserializeInteraction(
      db.select().from(interactionRecordsTable).where(eq(interactionRecordsTable.id, id)).get()!
    )
  },

  updateInteraction(input: UpdateInteractionRecordInput): InteractionRecord {
    const db = getDb()
    const current = db
      .select()
      .from(interactionRecordsTable)
      .where(eq(interactionRecordsTable.id, input.id))
      .get()

    if (!current) {
      throw new Error('Interaction record not found')
    }

    db.update(interactionRecordsTable)
      .set({
        interaction_type: input.interaction_type?.trim() || current.interaction_type,
        happened_at: input.happened_at ?? current.happened_at,
        summary: input.summary?.trim() || current.summary,
        next_action_at:
          input.next_action_at === undefined ? current.next_action_at : input.next_action_at,
        updated_at: Date.now()
      })
      .where(eq(interactionRecordsTable.id, input.id))
      .run()

    return deserializeInteraction(
      db
        .select()
        .from(interactionRecordsTable)
        .where(eq(interactionRecordsTable.id, input.id))
        .get()!
    )
  },

  deleteInteraction(id: string): { ok: boolean } {
    const db = getDb()
    db.delete(interactionRecordsTable).where(eq(interactionRecordsTable.id, id)).run()
    return { ok: true }
  }
}
