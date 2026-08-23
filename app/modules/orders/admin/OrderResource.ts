const statusBadges = {
  pending: { label: 'Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'default' },
  shipped: { label: 'Shipped', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'destructive' }
} as const

export default defineResource({
  name: 'orders',
  model: 'Order',
  label: 'Order',
  labelPlural: 'Orders',
  icon: 'shopping-cart',
  group: 'Sales',
  sort: 30,
  searchable: ['orderNo', 'customerName'],

  table: () => [
    textColumn('orderNo', 'Order #', { sortable: true }),
    textColumn('customerName', 'Customer'),
    moneyColumn('amount', 'Amount'),
    badgeColumn('status', 'Status', statusBadges),
    dateColumn('createdAt', 'Date', { sortable: true }),
    actionsColumn([
      defineAction({
        name: 'mark-shipped',
        label: 'Mark Shipped',
        icon: 'box',
        permission: 'orders.edit',
        visible: record => record.status === 'paid',
        confirm: { title: 'Mark this order as shipped?', confirmLabel: 'Ship It' },
        handler: async ({ record }) => {
          await $fetch(`/api/admin/orders/${record!.id}`, {
            method: 'PUT',
            body: { status: 'shipped' }
          })
          notify(`Order ${record!.orderNo} shipped`)
          emitAdminEvent('orders:refresh')
        }
      })
    ])
  ],

  form: () => [
    section('Order Details', [
      grid(2, [
        textInput('orderNo', 'Order Number', { placeholder: 'Auto-generated if empty', disabled: true, helpText: 'Leave empty to auto-generate on create.' }),
        selectInput('status', 'Status', [
          { label: 'Pending', value: 'pending' },
          { label: 'Paid', value: 'paid' },
          { label: 'Shipped', value: 'shipped' },
          { label: 'Completed', value: 'completed' },
          { label: 'Refunded', value: 'refunded' }
        ], { defaultValue: 'pending' })
      ]),
      grid(2, [
        textInput('customerName', 'Customer Name', { required: true }),
        numberInput('amount', 'Amount', { required: true, min: 0, step: 0.01 })
      ])
    ])
  ],

  infolist: () => [
    textEntry('orderNo', 'Order #'),
    badgeEntry('status', 'Status', statusBadges),
    textEntry('customerName', 'Customer'),
    moneyEntry('amount', 'Amount'),
    dateEntry('createdAt', 'Created')
  ]
})
