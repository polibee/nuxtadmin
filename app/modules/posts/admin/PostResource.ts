const statusBadges = {
  published: { label: 'Published', variant: 'success' },
  draft: { label: 'Draft', variant: 'warning' },
  archived: { label: 'Archived', variant: 'secondary' }
} as const

export default defineResource({
  name: 'posts',
  model: 'Post',
  label: 'Post',
  labelPlural: 'Posts',
  icon: 'file-text',
  group: 'Content',
  sort: 20,
  searchable: ['title', 'slug'],

  table: () => [
    textColumn('title', 'Title', { sortable: true }),
    badgeColumn('status', 'Status', statusBadges),
    numberColumn('views', 'Views'),
    dateColumn('publishedAt', 'Published'),
    actionsColumn([
      defineAction({
        name: 'publish',
        label: 'Publish',
        icon: 'badge-check',
        permission: 'posts.edit',
        visible: record => record.status !== 'published',
        confirm: { title: 'Publish this post?', confirmLabel: 'Publish' },
        handler: async ({ record }) => {
          await $fetch(`/api/admin/posts/${record!.id}`, {
            method: 'PUT',
            body: { status: 'published', publishedAt: new Date().toISOString() }
          })
          notify('Post published')
          emitAdminEvent('posts:refresh')
        }
      }),
      defineAction({
        name: 'preview',
        label: 'Preview',
        icon: 'eye',
        permission: 'posts.edit',
        visible: record => record.status !== 'published',
        handler: async ({ record }) => {
          const res = await $fetch<{ url: string }>('/api/admin/preview', {
            method: 'POST',
            body: { resource: 'posts', id: record!.id }
          })
          if (import.meta.client) window.open(res.url, '_blank', 'noopener')
        }
      })
    ])
  ],

  form: () => [
    section('Content', [
      textInput('title', 'Title', {
        required: true,
        placeholder: 'Getting started with Nuxt',
        colSpan: 2
      }),
      textInput('slug', 'Slug', {
        required: true,
        placeholder: 'getting-started-with-nuxt',
        colSpan: 2
      }),
      richTextInput('content', 'Content', { colSpan: 2 })
    ]),
    section('Metadata', [
      grid(3, [
        selectInput('status', 'Status', [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Archived', value: 'archived' }
        ], { defaultValue: 'draft' }),
        relationInput('authorId', 'Author', { resource: 'users', labelKey: 'name' }, { required: true }),
        numberInput('views', 'Views', { min: 0, defaultValue: 0 })
      ])
    ])
  ],

  infolist: () => [
    textEntry('title', 'Title'),
    badgeEntry('status', 'Status', statusBadges),
    textEntry('slug', 'Slug'),
    textEntry('authorId', 'Author ID'),
    textEntry('views', 'Views'),
    dateEntry('publishedAt', 'Published'),
    dateEntry('createdAt', 'Created')
  ],

  bulkActions: [
    defineAction({
      name: 'bulk-publish',
      label: 'Publish Selected',
      icon: 'badge-check',
      permission: 'posts.edit',
      confirm: { title: 'Publish all selected posts?', confirmLabel: 'Publish' },
      handler: async ({ ids }) => {
        await Promise.all((ids ?? []).map(id =>
          $fetch(`/api/admin/posts/${id}`, {
            method: 'PUT',
            body: { status: 'published', publishedAt: new Date().toISOString() }
          })
        ))
        notify(`${ids!.length} posts published`)
        emitAdminEvent('posts:refresh')
      }
    })
  ]
})
