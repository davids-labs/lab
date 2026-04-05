import type {
  BlockingAlert,
  CountdownItem,
  PlanNode,
  PlanNodeLink,
  Project,
  ProjectExecutionStage,
  SkillNodeSummary
} from '../../preload/types'
import { PROJECT_EXECUTION_STAGES } from '../../preload/types'

function compareProjectStage(
  left: ProjectExecutionStage | null | undefined,
  right: ProjectExecutionStage | null | undefined
): number {
  const leftIndex = PROJECT_EXECUTION_STAGES.indexOf((left ?? 'ideation') as ProjectExecutionStage)
  const rightIndex = PROJECT_EXECUTION_STAGES.indexOf(
    (right ?? 'ideation') as ProjectExecutionStage
  )
  return leftIndex - rightIndex
}

export function meetsProjectStage(
  stage: ProjectExecutionStage | null | undefined,
  requiredStage: ProjectExecutionStage | null | undefined
): boolean {
  return compareProjectStage(stage, requiredStage ?? 'ideation') >= 0
}

export function getBlockingReasonsForNode(
  node: PlanNode,
  links: PlanNodeLink[],
  planNodeById: Map<string, PlanNode>,
  projectsById: Map<string, Project>,
  skillNodesById: Map<string, SkillNodeSummary>,
  countdownsById: Map<string, CountdownItem>
): string[] {
  const reasons: string[] = []
  const now = Date.now()
  const dueSoon = typeof node.due_at === 'number' && node.due_at - now <= 1000 * 60 * 60 * 24 * 21

  for (const link of links) {
    if (link.target_type === 'plan_node') {
      const dependency = planNodeById.get(link.target_id)
      if (dependency && dependency.status !== 'complete') {
        reasons.push(`Depends on "${dependency.title}" reaching complete status.`)
      }
      continue
    }

    if (link.target_type === 'project') {
      const project = projectsById.get(link.target_id)
      if (!project) {
        reasons.push('Linked project is missing.')
        continue
      }

      if (!meetsProjectStage(project.execution_stage, link.required_stage)) {
        reasons.push(
          `"${project.name}" is still in ${project.execution_stage.replace(/_/g, ' ')} and needs ${(
            link.required_stage ?? 'ideation'
          ).replace(/_/g, ' ')}.`
        )
      }
      continue
    }

    if (link.target_type === 'skill_node') {
      const skill = skillNodesById.get(link.target_id)
      if (!skill) {
        reasons.push('Linked skill requirement is missing.')
        continue
      }

      if (skill.state !== 'verified' && dueSoon) {
        reasons.push(`"${skill.title}" is not verified and this milestone is close to its deadline.`)
      }
      continue
    }

    if (link.target_type === 'countdown_item') {
      const countdown = countdownsById.get(link.target_id)
      if (!countdown) {
        reasons.push('Linked deadline is missing.')
      }
    }
  }

  return reasons
}

export function buildBlockingAlert(
  node: PlanNode,
  reason: string,
  severity: BlockingAlert['severity']
): BlockingAlert {
  return {
    id: `${node.id}:${reason}`,
    node_id: node.id,
    node_title: node.title,
    reason,
    severity
  }
}
