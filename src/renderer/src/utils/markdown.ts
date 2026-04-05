import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { extractMarkdownContent } from '@shared/content'

marked.setOptions({
  gfm: true,
  breaks: false
})

export function renderMarkdownToHtml(raw: string): string {
  return DOMPurify.sanitize(marked.parse(extractMarkdownContent(raw)) as string)
}
