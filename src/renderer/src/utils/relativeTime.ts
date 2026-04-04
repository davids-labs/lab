export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return 'just now'
  }

  if (diff < hour) {
    const value = Math.max(1, Math.round(diff / minute))
    return `${value}m ago`
  }

  if (diff < day) {
    const value = Math.max(1, Math.round(diff / hour))
    return `${value}h ago`
  }

  return `${Math.max(1, Math.round(diff / day))}d ago`
}
