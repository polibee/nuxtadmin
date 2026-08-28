/* =============================================================
 * Lightweight i18n: cookie-persisted locale + flat key dictionaries.
 * Resource labels are author-defined content and intentionally NOT
 * translated here. Swap with @nuxtjs/i18n later without touching
 * call sites (same useI18n().t contract).
 * ============================================================= */

type Locale = 'zh-CN' | 'en'

type Dict = Record<string, string>

const messages: Record<Locale, Dict> = {
  'zh-CN': {
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.saving': '保存中…',
    'common.loading': '加载中…',
    'common.export': '导出',
    'common.back': '返回',
    'common.actions': '操作',
    'common.new': '新建',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.view': '查看',
    'common.manage': '管理',
    'common.saveChanges': '保存修改',
    'common.createLabel': '创建{label}',
    'common.editLabel': '编辑{label}',
    'common.viewLabel': '查看{label}',
    'common.newLabel': '新建{label}',
    'common.backTo': '返回{target}',
    'table.showing': '显示',
    'table.results': '条结果',
    'table.perPage': '条 / 页',
    'table.page': '第 {page} / {totalPages} 页',
    'table.selected': '已选择 {n} 项',
    'table.clear': '清除',
    'table.empty': '暂无{label}',
    'table.search': '搜索{label}…',
    'nav.dashboard': '仪表盘',
    'dashboard.title': '仪表盘',
    'dashboard.welcome': '欢迎来到{brand}',
    'dashboard.noWidgets': '当前角色没有可用的 Widget。',
    'auth.title': '登录后台',
    'auth.subtitle': '登录您的管理面板',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.signIn': '登录',
    'auth.signingIn': '登录中…',
    'auth.invalid': '邮箱或密码错误',
    'auth.demoNote': '演示账号（密码：password）',
    'auth.roleAdmin': '管理员 · 全部权限',
    'auth.roleEditor': '编辑 · 仅内容',
    'auth.roleViewer': '访客 · 只读',
    'auth.signOut': '退出登录',
    'auth.fullAccess': '全部权限',
    'toast.created': '{label} 已创建',
    'toast.updated': '{label} 已更新',
    'toast.deleted': '{label} 已删除',
    'toast.bulkDeleted': '已删除 {n} 个{label}',
    'toast.loadFailed': '加载{label}失败',
    'confirm.deleteTitle': '删除该{label}？',
    'confirm.bulkDeleteTitle': '删除已选的 {n} 个{label}？',
    'confirm.deleteDescription': '此操作不可撤销。',
    'confirm.defaultDescription': '将执行「{label}」。'
  },
  'en': {
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.saving': 'Saving…',
    'common.loading': 'Loading…',
    'common.export': 'Export',
    'common.back': 'Back',
    'common.actions': 'Actions',
    'common.new': 'New',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.manage': 'Manage',
    'common.saveChanges': 'Save Changes',
    'common.createLabel': 'Create {label}',
    'common.editLabel': 'Edit {label}',
    'common.viewLabel': 'View {label}',
    'common.newLabel': 'New {label}',
    'common.backTo': 'Back to {target}',
    'table.showing': 'Showing',
    'table.results': 'results',
    'table.perPage': '/ page',
    'table.page': 'Page {page} / {totalPages}',
    'table.selected': '{n} selected',
    'table.clear': 'Clear',
    'table.empty': 'No {label} found.',
    'table.search': 'Search {label}…',
    'nav.dashboard': 'Dashboard',
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to {brand}',
    'dashboard.noWidgets': 'No widgets available for your role.',
    'auth.title': 'Sign In',
    'auth.subtitle': 'Sign in to your admin panel',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.signingIn': 'Signing in…',
    'auth.invalid': 'Invalid email or password',
    'auth.demoNote': 'Demo accounts (password: password)',
    'auth.roleAdmin': 'Administrator · full access',
    'auth.roleEditor': 'Editor · content only',
    'auth.roleViewer': 'Viewer · read only',
    'auth.signOut': 'Sign out',
    'auth.fullAccess': 'Full access',
    'toast.created': '{label} created',
    'toast.updated': '{label} updated',
    'toast.deleted': '{label} deleted',
    'toast.bulkDeleted': '{n} {label} deleted',
    'toast.loadFailed': 'Failed to load {label}',
    'confirm.deleteTitle': 'Delete this {label}?',
    'confirm.bulkDeleteTitle': 'Delete {n} selected {label}?',
    'confirm.deleteDescription': 'This action cannot be undone.',
    'confirm.defaultDescription': 'This will run "{label}".'
  }
}

export const LOCALES: Array<{ value: Locale, label: string }> = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en', label: 'English' }
]

export function useI18n() {
  const locale = useCookie<Locale>('admin-locale', { default: () => 'zh-CN' })

  function t(key: string, params?: Record<string, string | number>): string {
    let text = messages[locale.value]?.[key] ?? messages.en[key] ?? key
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value))
      }
    }
    return text
  }

  return { locale, t }
}
