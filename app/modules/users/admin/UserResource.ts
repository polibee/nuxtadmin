const statusBadges = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' }
} as const

const roleOptions = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' }
]

export default defineResource({
  name: 'users',
  model: 'User',
  label: 'User',
  labelPlural: 'Users',
  icon: 'users',
  group: 'User Management',
  sort: 10,
  searchable: ['name', 'email'],

  table: () => [
    textColumn('name', 'Name', { sortable: true }),
    textColumn('email', 'Email'),
    badgeColumn('role', 'Role', {
      admin: { label: 'Admin', variant: 'default' },
      editor: { label: 'Editor', variant: 'warning' },
      viewer: { label: 'Viewer', variant: 'secondary' }
    }),
    badgeColumn('status', 'Status', statusBadges),
    dateColumn('createdAt', 'Joined', { sortable: true })
  ],

  form: () => [
    section('Account', [
      grid(2, [
        textInput('name', 'Name', { required: true, placeholder: 'Jane Doe' }),
        emailInput('email', 'Email', { required: true, placeholder: 'jane@example.com' })
      ]),
      grid(2, [
        selectInput('role', 'Role', roleOptions, { defaultValue: 'viewer' }),
        selectInput('status', 'Status', [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ], { defaultValue: 'active' })
      ])
    ])
  ],

  infolist: () => [
    textEntry('name', 'Name'),
    textEntry('email', 'Email'),
    badgeEntry('role', 'Role', {
      admin: { label: 'Admin', variant: 'default' },
      editor: { label: 'Editor', variant: 'warning' },
      viewer: { label: 'Viewer', variant: 'secondary' }
    }),
    badgeEntry('status', 'Status', statusBadges),
    dateEntry('createdAt', 'Joined')
  ]
})
