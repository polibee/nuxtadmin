export default defineResource({
  name: 'media',
  model: 'Media',
  label: 'Media',
  labelPlural: 'Media',
  icon: 'image',
  group: 'Media Library',
  sort: 40,
  permissionPrefix: 'media',
  searchable: ['filename'],
  // multipart create goes to the dedicated upload endpoint
  endpoints: { create: '/api/admin/media/upload' },

  table: () => [
    imageColumn('url', ''),
    textColumn('filename', 'Filename', { sortable: true }),
    textColumn('mime', 'Type'),
    numberColumn('size', 'Size (bytes)'),
    dateColumn('createdAt', 'Uploaded', { sortable: true }),
    actionsColumn([
      defineAction({
        name: 'preview',
        label: 'Open',
        icon: 'eye',
        permission: 'media.view',
        handler: async ({ record }) => {
          if (import.meta.client) window.open(String(record!.url), '_blank', 'noopener')
        }
      })
    ])
  ],

  form: () => [
    section('Upload', [
      fileInput('file', 'File', { required: true, helpText: 'Max 10MB per file.' })
    ])
  ],

  infolist: () => [
    textEntry('filename', 'Filename'),
    textEntry('mime', 'Type'),
    textEntry('size', 'Size', { suffix: ' bytes' }),
    datetimeEntry('createdAt', 'Uploaded'),
    linkEntry('url', 'URL')
  ]
})
