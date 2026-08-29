<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  BracesIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  HighlighterIcon,
  ImagePlusIcon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  MinusIcon,
  PaletteIcon,
  QuoteIcon,
  Redo2Icon,
  SquareSlashIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  UnderlineIcon,
  Undo2Icon
} from 'lucide-vue-next'
import { cn } from '~/admin/utils/cn'

const props = withDefaults(defineProps<{
  modelValue?: string
  disabled?: boolean
  placeholder?: string
}>(), { modelValue: '', placeholder: 'Write something…' })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue || '',
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: { openOnClick: false }
    }),
    Image.configure({ inline: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight,
    TextStyle,
    Color,
    Subscript,
    Superscript,
    CharacterCount,
    Placeholder.configure({ placeholder: props.placeholder }),
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.isEmpty ? '' : editor.getHTML())
  }
})

const charCount = computed(() => editor.value?.storage.characterCount.characters() ?? 0)

watch(() => props.modelValue, (value) => {
  if (!editor.value) return
  if ((editor.value.isEmpty ? '' : editor.value.getHTML()) === value) return
  editor.value.commands.setContent(value || '')
})

watch(() => props.disabled, (disabled) => {
  editor.value?.setEditable(!disabled)
})

function promptLink(): void {
  const e = editor.value
  if (!e) return
  if (e.isActive('link')) {
    e.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('Link URL (https://…)')
  if (url === null) return
  if (url === '') {
    e.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function promptImage(): void {
  const e = editor.value
  if (!e) return
  const url = window.prompt('Image URL (https://…)')
  if (!url) return
  e.chain().focus().setImage({ src: url }).run()
}

function promptColor(): void {
  const e = editor.value
  if (!e) return
  const color = window.prompt('Text color (hex, e.g. #d64545)')
  if (!color) return
  e.chain().focus().setColor(color).run()
}

function insertTable(): void {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

interface ToolButton {
  label: string
  icon: typeof BoldIcon
  active?: boolean
  disabled?: boolean
  run: () => void
}

interface ToolGroup {
  buttons: ToolButton[]
}

const groups = computed<ToolGroup[]>(() => {
  const e = editor.value
  if (!e) return []
  const chain = () => e.chain().focus()
  return [
    { buttons: [
      { label: 'Undo', icon: Undo2Icon, disabled: !e.can().undo(), run: () => chain().undo().run() },
      { label: 'Redo', icon: Redo2Icon, disabled: !e.can().redo(), run: () => chain().redo().run() }
    ] },
    { buttons: [
      { label: 'Bold', icon: BoldIcon, active: e.isActive('bold'), run: () => chain().toggleBold().run() },
      { label: 'Italic', icon: ItalicIcon, active: e.isActive('italic'), run: () => chain().toggleItalic().run() },
      { label: 'Underline', icon: UnderlineIcon, active: e.isActive('underline'), run: () => chain().toggleUnderline().run() },
      { label: 'Strike', icon: StrikethroughIcon, active: e.isActive('strike'), run: () => chain().toggleStrike().run() },
      { label: 'Inline code', icon: CodeIcon, active: e.isActive('code'), run: () => chain().toggleCode().run() },
      { label: 'Superscript', icon: SuperscriptIcon, active: e.isActive('superscript'), run: () => chain().toggleSuperscript().run() },
      { label: 'Subscript', icon: SubscriptIcon, active: e.isActive('subscript'), run: () => chain().toggleSubscript().run() }
    ] },
    { buttons: [
      { label: 'Heading 2', icon: Heading2Icon, active: e.isActive('heading', { level: 2 }), run: () => chain().toggleHeading({ level: 2 }).run() },
      { label: 'Heading 3', icon: Heading3Icon, active: e.isActive('heading', { level: 3 }), run: () => chain().toggleHeading({ level: 3 }).run() }
    ] },
    { buttons: [
      { label: 'Bullet list', icon: ListIcon, active: e.isActive('bulletList'), run: () => chain().toggleBulletList().run() },
      { label: 'Ordered list', icon: ListOrderedIcon, active: e.isActive('orderedList'), run: () => chain().toggleOrderedList().run() },
      { label: 'Task list', icon: ListTodoIcon, active: e.isActive('taskList'), run: () => chain().toggleTaskList().run() },
      { label: 'Quote', icon: QuoteIcon, active: e.isActive('blockquote'), run: () => chain().toggleBlockquote().run() },
      { label: 'Code block', icon: BracesIcon, active: e.isActive('codeBlock'), run: () => chain().toggleCodeBlock().run() }
    ] },
    { buttons: [
      { label: 'Align left', icon: AlignLeftIcon, active: e.isActive({ textAlign: 'left' }), run: () => chain().setTextAlign('left').run() },
      { label: 'Align center', icon: AlignCenterIcon, active: e.isActive({ textAlign: 'center' }), run: () => chain().setTextAlign('center').run() },
      { label: 'Align right', icon: AlignRightIcon, active: e.isActive({ textAlign: 'right' }), run: () => chain().setTextAlign('right').run() },
      { label: 'Justify', icon: AlignJustifyIcon, active: e.isActive({ textAlign: 'justify' }), run: () => chain().setTextAlign('justify').run() }
    ] },
    { buttons: [
      { label: 'Highlight', icon: HighlighterIcon, active: e.isActive('highlight'), run: () => chain().toggleHighlight().run() },
      { label: 'Text color', icon: PaletteIcon, run: promptColor }
    ] },
    { buttons: [
      { label: 'Link', icon: Link2Icon, active: e.isActive('link'), run: promptLink },
      { label: 'Image', icon: ImagePlusIcon, run: promptImage },
      { label: 'Divider', icon: MinusIcon, run: () => chain().setHorizontalRule().run() }
    ] },
    { buttons: [
      { label: 'Insert table', icon: TableIcon, active: e.isActive('table'), run: insertTable },
      { label: 'Add row', icon: TableIcon, disabled: !e.isActive('table'), run: () => chain().addRowAfter().run() },
      { label: 'Add column', icon: TableIcon, disabled: !e.isActive('table'), run: () => chain().addColumnAfter().run() },
      { label: 'Delete row', icon: SquareSlashIcon, disabled: !e.isActive('table'), run: () => chain().deleteRow().run() },
      { label: 'Delete column', icon: SquareSlashIcon, disabled: !e.isActive('table'), run: () => chain().deleteColumn().run() },
      { label: 'Delete table', icon: SquareSlashIcon, disabled: !e.isActive('table'), run: () => chain().deleteTable().run() }
    ] }
  ]
})
</script>

<template>
  <div class="overflow-hidden rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
    <div
      v-if="editor"
      class="flex items-center gap-1 overflow-x-auto border-b bg-muted/40 px-1.5 py-1"
    >
      <div
        v-for="(group, gi) in groups"
        :key="gi"
        class="flex shrink-0 items-center gap-0.5"
        :class="gi > 0 && 'ml-1 border-l pl-1.5'"
      >
        <button
          v-for="tool in group.buttons"
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
      <span class="ml-auto shrink-0 pr-1 text-[10px] tabular-nums text-muted-foreground">{{ charCount }} chars</span>
    </div>
    <EditorContent
      :editor="editor"
      class="min-h-40 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_hr]:my-3 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-muted-foreground [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-3 [&_.ProseMirror]:text-sm [&_.ProseMirror_.selectedCell]:bg-primary/10 [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:p-1.5 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:bg-muted/50 [&_.ProseMirror_th]:p-1.5 [&_.ProseMirror_th]:text-left [&_.ProseMirror_ul_[data-type=taskList]]:list-none [&_.ProseMirror_ul_[data-type=taskList]]:pl-1 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5"
    />
  </div>
</template>
