import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false
})

export function renderMarkdownToHtml(raw: string): string {
  return DOMPurify.sanitize(marked.parse(raw) as string)
}
