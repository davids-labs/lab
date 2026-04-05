import starterTemplate from '../templates/davids-lab-starter.json'
import type {
  HabitFrequency,
  PlanNodeKind,
  PlanNodeStatus,
  ProjectExecutionStage
} from '../../preload/types'
import { osQueries } from '../db/queries/os'
import { planQueries } from '../db/queries/plan'
import { projectQueries } from '../db/queries/projects'
import { skillQueries } from '../db/queries/skills'

type StarterTemplate = typeof starterTemplate

type TemplatePlanNode = StarterTemplate['plan'][number] & {
  children?: TemplatePlanNode[]
  links?: Array<{
    target_type: 'skill_node' | 'countdown_item' | 'project' | 'plan_node'
    target_key?: string
    project_slug?: string
    required_stage?: string
  }>
}

function hasExistingCommandCenterData(): boolean {
  return (
    planQueries.listNodes().length > 0 ||
    skillQueries.listDomains().length > 0 ||
    osQueries.listProfiles().length > 0 ||
    osQueries.listCountdowns().length > 0
  )
}

export function importStarterTemplate(): { ok: boolean } {
  if (hasExistingCommandCenterData()) {
    return { ok: true }
  }

  const countdownByTitle = new Map<string, string>()
  const skillNodeByKey = new Map<string, string>()
  const planNodeByKey = new Map<string, string>()
  const pendingLinks: Array<{
    nodeId: string
    target_type: 'skill_node' | 'countdown_item' | 'project' | 'plan_node'
    target_key?: string
    project_slug?: string
    required_stage?: string
  }> = []

  for (const countdown of starterTemplate.countdowns) {
    const created = osQueries.createCountdown(countdown)
    countdownByTitle.set(countdown.title, created.id)
  }

  for (const profile of starterTemplate.os.profiles) {
    const createdProfile = osQueries.createProfile({
      name: profile.name,
      is_default: profile.is_default ?? false
    })

    for (const [index, block] of profile.time_blocks.entries()) {
      osQueries.upsertTimeBlock({
        profile_id: createdProfile.id,
        label: block.label,
        hours: block.hours,
        color: block.color,
        sort_order: index
      })
    }
  }

  for (const habit of starterTemplate.os.habits) {
    osQueries.createHabit({
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency as HabitFrequency,
      target_count: habit.target_count
    })
  }

  for (const domain of starterTemplate.skills) {
    const createdDomain = skillQueries.createDomain({
      title: domain.title,
      description: domain.description
    })

    for (const [index, node] of domain.nodes.entries()) {
      const createdNode = skillQueries.createNode({
        domain_id: createdDomain.id,
        title: node.title,
        description: node.description,
        sort_order: index
      })
      skillNodeByKey.set(node.key, createdNode.id)
    }
  }

  function importPlanNode(node: TemplatePlanNode, parentId: string | null): void {
    const createdNode = planQueries.createNode({
      title: node.title,
      kind: node.kind as PlanNodeKind,
      status: node.status as PlanNodeStatus,
      summary: node.summary,
      parent_id: parentId,
      notes: null
    })

    planNodeByKey.set(node.key, createdNode.id)

    for (const link of node.links ?? []) {
      pendingLinks.push({
        nodeId: createdNode.id,
        target_type: link.target_type,
        target_key: link.target_key,
        project_slug: link.project_slug,
        required_stage: link.required_stage
      })
    }

    for (const child of node.children ?? []) {
      importPlanNode(child, createdNode.id)
    }
  }

  for (const phase of starterTemplate.plan as TemplatePlanNode[]) {
    importPlanNode(phase, null)
  }

  const projectsBySlug = new Map(projectQueries.list().map((project) => [project.slug, project.id]))

  for (const link of pendingLinks) {
    let targetId: string | undefined

    if (link.target_type === 'skill_node' && link.target_key) {
      targetId = skillNodeByKey.get(link.target_key)
    } else if (link.target_type === 'countdown_item' && link.target_key) {
      targetId = countdownByTitle.get(link.target_key)
    } else if (link.target_type === 'project' && link.project_slug) {
      targetId = projectsBySlug.get(link.project_slug)
    } else if (link.target_type === 'plan_node' && link.target_key) {
      targetId = planNodeByKey.get(link.target_key)
    }

    if (!targetId) {
      continue
    }

    planQueries.createLink({
      node_id: link.nodeId,
      target_type: link.target_type,
      target_id: targetId,
      required_stage: (link.required_stage as ProjectExecutionStage | undefined) ?? null
    })
  }

  return { ok: true }
}
