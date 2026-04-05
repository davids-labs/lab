import matter from 'gray-matter'
import type { EmbedData } from '../preload/types'

interface ParsedMarkdownDocument {
  content: string
  frontmatter: Record<string, unknown>
  tags: string[]
  title?: string
}

function normalizeFrontmatter(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {}
  }

  return { ...(data as Record<string, unknown>) }
}

function toTagList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

export function parseMarkdownDocument(raw: string): ParsedMarkdownDocument {
  const parsed = matter(raw)
  const frontmatter = normalizeFrontmatter(parsed.data)
  const title = typeof frontmatter.title === 'string' ? frontmatter.title.trim() : undefined

  return {
    content: parsed.content,
    frontmatter,
    tags: toTagList(frontmatter.tags),
    title: title || undefined
  }
}

export function extractMarkdownContent(raw: string): string {
  return parseMarkdownDocument(raw).content
}

export function inferEmbedType(url: string): EmbedData['type'] {
  const trimmed = url.trim()
  if (!trimmed) {
    return 'generic'
  }

  try {
    const parsed = new URL(ensureUrlProtocol(trimmed))
    const hostname = parsed.hostname.toLowerCase()

    if (hostname.includes('youtu.be') || hostname.includes('youtube.com')) {
      return 'youtube'
    }

    if (hostname.includes('figma.com')) {
      return 'figma'
    }

    if (hostname.endsWith('.pdf') || parsed.pathname.toLowerCase().endsWith('.pdf')) {
      return 'pdf'
    }
  } catch {
    if (trimmed.toLowerCase().endsWith('.pdf')) {
      return 'pdf'
    }
  }

  return 'generic'
}

export function ensureUrlProtocol(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) {
    return ''
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export function getUrlHostname(url: string): string | null {
  try {
    return new URL(ensureUrlProtocol(url)).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function inferLinkLabel(url: string): string {
  const hostname = getUrlHostname(url)
  if (!hostname) {
    return ''
  }

  return hostname
    .split('.')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function toEmbedSrc(type: EmbedData['type'], url: string): string {
  const normalized = ensureUrlProtocol(url)
  if (!normalized) {
    return ''
  }

  if (type === 'youtube') {
    try {
      const parsed = new URL(normalized)
      if (parsed.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`
      }

      if (parsed.hostname.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v')
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`
        }
      }
    } catch {
      return normalized
    }
  }

  if (type === 'figma') {
    return `https://www.figma.com/embed?embed_host=lab&url=${encodeURIComponent(normalized)}`
  }

  return normalized
}
