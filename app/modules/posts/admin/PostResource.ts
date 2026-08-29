import type { BadgeStyle, Translator } from '~/admin/core/types'

export default (t: Translator) => {
  const statusBadges = (): Record<string | number, BadgeStyle> => ({
    published: { label: t('status.published'), variant: 'success' },
    draft: { label: t('status.draft'), variant: 'warning' },
    archived: { label: t('status.archived'), variant: 'secondary' }
  })

  return defineResource({
    name: 'posts',
    model: 'Post',
    label: t('res.posts.label'),
    labelPlural: t('res.posts.plural'),
    icon: 'file-text',
    group: t('res.posts.group'),
    sort: 20,
    searchable: ['title', 'slug'],

    table: () => [
      textColumn('title', t('res.posts.col.title'), { sortable: true }),
      badgeColumn('status', t('res.posts.col.status'), statusBadges()),
      numberColumn('views', t('res.posts.col.views')),
      dateColumn('publishedAt', t('res.posts.col.published')),
      actionsColumn([
        defineAction({
          name: 'publish',
          label: t('res.posts.publish'),
          icon: 'badge-check',
          permission: 'posts.edit',
          visible: record => record.status !== 'published',
          confirm: { title: t('res.posts.publishConfirm'), confirmLabel: t('res.posts.publish') },
          handler: async ({ record }) => {
            await $fetch(`/api/admin/posts/${record!.id}`, {
              method: 'PUT',
              body: { status: 'published', publishedAt: new Date().toISOString() }
            })
            notify(t('notify.published'))
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
      section(t('res.posts.section.content'), [
        textInput('title', t('res.posts.field.title'), {
          required: true,
          placeholder: 'Getting started with Nuxt',
          colSpan: 2
        }),
        textInput('slug', t('res.posts.field.slug'), {
          required: true,
          placeholder: 'getting-started-with-nuxt',
          colSpan: 2
        }),
        richTextInput('content', t('res.posts.field.content'), { colSpan: 2 })
      ]),
      section(t('res.posts.section.metadata'), [
        grid(3, [
          selectInput('status', t('res.posts.field.status'), [
            { label: t('status.draft'), value: 'draft' },
            { label: t('status.published'), value: 'published' },
            { label: t('status.archived'), value: 'archived' }
          ], { defaultValue: 'draft' }),
          relationInput('authorId', t('res.posts.field.author'), { resource: 'users', labelKey: 'name' }, { required: true }),
          numberInput('views', t('res.posts.field.views'), { min: 0, defaultValue: 0 })
        ])
      ])
    ],

    infolist: () => [
      textEntry('title', t('res.posts.field.title')),
      badgeEntry('status', t('res.posts.field.status'), statusBadges()),
      textEntry('slug', t('res.posts.field.slug')),
      textEntry('authorId', t('res.posts.field.author') + ' ID'),
      textEntry('views', t('res.posts.field.views')),
      dateEntry('publishedAt', t('res.posts.col.published')),
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
}
