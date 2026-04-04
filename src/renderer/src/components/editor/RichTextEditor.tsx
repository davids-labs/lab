import { useEffect } from 'react'
import Link from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import clsx from 'clsx'
import styles from './RichTextEditor.module.css'

interface RichTextEditorProps {
  onChange: (value: string) => void
  value: string
}

export function RichTextEditor({ onChange, value }: RichTextEditorProps): JSX.Element | null {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false
      })
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML())
    }
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  const buttonClass = (active: boolean): string => clsx(styles.button, active && styles.active)

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button
          className={buttonClass(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          type="button"
        >
          Bold
        </button>
        <button
          className={buttonClass(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          type="button"
        >
          Italic
        </button>
        <button
          className={buttonClass(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
        >
          Bullets
        </button>
        <button
          className={buttonClass(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          type="button"
        >
          Numbers
        </button>
        <button
          className={buttonClass(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          type="button"
        >
          H2
        </button>
        <button
          className={buttonClass(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          type="button"
        >
          H3
        </button>
        <button
          className={buttonClass(editor.isActive('link'))}
          onClick={() => {
            const url = window.prompt(
              'Enter a URL',
              editor.getAttributes('link').href ?? 'https://'
            )
            if (url === null) {
              return
            }
            if (!url.trim()) {
              editor.chain().focus().unsetLink().run()
              return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
          }}
          type="button"
        >
          Link
        </button>
      </div>
      <div className={styles.surface}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
