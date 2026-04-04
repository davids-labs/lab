export function calculateNextSortOrder(values: number[]): number {
  if (values.length === 0) {
    return 1
  }

  return Math.max(...values) + 1
}

export function reorderIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  const lookup = new Map(items.map((item) => [item.id, item]))

  return orderedIds
    .map((id) => lookup.get(id))
    .filter((item): item is T => Boolean(item))
    .concat(items.filter((item) => !orderedIds.includes(item.id)))
}
