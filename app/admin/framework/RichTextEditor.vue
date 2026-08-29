<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import {
  BoldIcon,
  BracesIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  Undo2Icon
} from 'lucide-vue-next'
import { cn } from '~/admin/utils/cn'

const props = withDefaults(defineProps<{
  modelValue?: string
  disabled?: boolean
}>(), { modelValue: '' })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue || '',
  editable: !props.disabled,
  extensions: [StarterKit],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.isEmpty ? '' : editor.getHTML())
  }
})

watch(() => props.modelValue, (value) => {
  if (!editor.value) return
  if ((editor.value.isEmpty ? '' : editor.value.getHTML()) === value) return
  editor.value.commands.setContent(value || '')
})

watch(() => props.disabled, (disabled) => {
  editor.value?.setEditable(!disabled)
})

function link(): void {
  const editorInstance = editor.value
  if (!editorInstance) return
  if (editorInstance.isActive('link')) {
    editorInstance.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('Link URL')
  if (url === null) return
  if (url === '') {
    editorInstance.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editorInstance.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

interface ToolButton {
  label: string
  icon: typeof BoldIcon
  active?: boolean
  disabled?: boolean
  run: () => void
}

const tools = computed<ToolButton[]>(() => {
  const e = editor.value
  if (!e) return []
  return [
    { label: 'Bold', icon: BoldIcon, active: e.isActive('bold'), run: () => e.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: ItalicIcon, active: e.isActive('italic'), run: () => e.chain().focus().toggleItalic().run() },
    { label: 'Strike', icon: StrikethroughIcon, active: e.isActive('strike'), run: () => e.chain().focus().toggleStrike().run() },
    { label: 'Code', icon: CodeIcon, active: e.isActive('code'), run: () => e.chain().focus().toggleCode().run() },
    { label: 'Heading 2', icon: Heading2Icon, active: e.isActive('heading', { level: 2 }), run: () => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', icon: Heading3Icon, active: e.isActive('heading', { level: 3 }), run: () => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bullet list', icon: ListIcon, active: e.isActive('bulletList'), run: () => e.chain().focus().toggleBulletList().run() },
    { label: 'Ordered list', icon: ListOrderedIcon, active: e.isActive('orderedList'), run: () => e.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', icon: QuoteIcon, active: e.isActive('blockquote'), run: () => e.chain().focus().toggleBlockquote().run() },
    { label: 'Code block', icon: BracesIcon, active: e.isActive('codeBlock'), run: () => e.chain().focus().toggleCodeBlock().run() },
    { label: 'Link', icon: Link2Icon, active: e.isActive('link'), run: link },
    { label: 'Divider', icon: MinusIcon, run: () => e.chain().focus().setHorizontalRule().run() },
    { label: 'Undo', icon: Undo2Icon, disabled: !e.can().undo(), run: () => e.chain().focus().undo().run() },
    { label: 'Redo', icon: Redo2Icon, disabled: !e.can().redo(), run: () => e.chain().focus().redo().run() }
  ]
})
</script>

<template>
  <div class="overflow-hidden rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1"
    >
      <button
        v-for="tool in tools"
        :key="tool.label"
        type="button"
        :title="tool.label"
        :disabled="tool.disabled || props.disabled"
        :class="cn(
          'rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40',
          tool.active && 'bg-primary/10 text-primary'
        )"
        @click="tool.run()"
      >
        <component
          :is="tool.icon"
          class="h-3.5 w-3.5"
        />
      </button>
    </div>
    <EditorContent
      :editor="editor"
      class="prose-sm min-h-40 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_p.is-editor-empty]:before:text-muted-foreground [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_hr]:my-3 [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-3"
    />
  </div>
</template>
