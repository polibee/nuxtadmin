import type { BadgeStyle, Translator } from '~/admin/core/types'

export default (t: Translator) => {
  const statusBadges = (): Record<string | number, BadgeStyle> => ({
    pending: { label: t('status.pending'), variant: 'warning' },
    paid: { label: t('status.paid'), variant: 'default' },
    shipped: { label: t('status.shipped'), variant: 'secondary' },
    completed: { label: t('status.completed'), variant: 'success' },
    refunded: { label: t('status.refunded'), variant: 'destructive' }
  })

  return defineResource({
    name: 'orders',
    model: 'Order',
    label: t('res.orders.label'),
    labelPlural: t('res.orders.plural'),
    icon: 'shopping-cart',
    group: t('res.orders.group'),
    sort: 30,
    searchable: ['orderNo', 'customerName'],

    table: () => [
      textColumn('orderNo', t('res.orders.col.orderNo'), { sortable: true }),
      textColumn('customerName', t('res.orders.col.customer')),
      moneyColumn('amount', t('res.orders.col.amount')),
      badgeColumn('status', t('res.orders.col.status'), statusBadges()),
      dateColumn('createdAt', t('res.orders.col.date'), { sortable: true }),
      actionsColumn([
        defineAction({
          name: 'mark-shipped',
          label: t('res.orders.markShipped'),
          icon: 'box',
          permission: 'orders.edit',
          visible: record => record.status === 'paid',
          confirm: { title: t('res.orders.shipConfirm'), confirmLabel: t('res.orders.shipIt') },
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
      section(t('res.orders.section'), [
        grid(2, [
          textInput('orderNo', 'Order Number', { placeholder: 'Auto-generated if empty', disabled: true, helpText: 'Leave empty to auto-generate on create.' }),
          selectInput('status', t('res.orders.field.status'), [
            { label: t('status.pending'), value: 'pending' },
            { label: t('status.paid'), value: 'paid' },
            { label: t('status.shipped'), value: 'shipped' },
            { label: t('status.completed'), value: 'completed' },
            { label: t('status.refunded'), value: 'refunded' }
          ], { defaultValue: 'pending' })
        ]),
        grid(2, [
          textInput('customerName', t('res.orders.field.customer'), { required: true }),
          numberInput('amount', t('res.orders.field.amount'), { required: true, min: 0, step: 0.01 })
        ])
      ])
    ],

    infolist: () => [
      textEntry('orderNo', t('res.orders.col.orderNo')),
      badgeEntry('status', t('res.orders.col.status'), statusBadges()),
      textEntry('customerName', t('res.orders.col.customer')),
      moneyEntry('amount', t('res.orders.col.amount')),
      dateEntry('createdAt', 'Created')
    ]
  })
}
