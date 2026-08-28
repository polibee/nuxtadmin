import type { Paginated } from '#shared/types/api'
import type { ContentTypeLike } from '~/modules/content-types/dynamic'
import { buildContentModule } from '~/modules/content-types/dynamic'
import adminPanel from '~/admin/panels/admin.panel'
import dashboardModule from '~/modules/dashboard/module'
import usersModule from '~/modules/users/module'
import postsModule from '~/modules/posts/module'
import ordersModule from '~/modules/orders/module'
import mediaModule from '~/modules/media/module'
import rolesModule from '~/modules/roles/module'
import contentTypesModule from '~/modules/content-types/module'

/**
 * Application composition root.
 * Registers the panel, static business modules and every runtime
 * content type created through the Content Type builder.
 */
export default defineNuxtPlugin(async () => {
  setPanel(adminPanel)

  const modules = [
    dashboardModule, usersModule, postsModule, ordersModule,
    mediaModule, rolesModule, contentTypesModule
  ]
  for (const module of modules) {
    registerModule(module)
  }

  // dynamic content types (public to boot; reads need auth but the
  // fetch simply yields nothing for guests before login redirect)
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const res = await $fetch<Paginated<ContentTypeLike & { id: number }>>('/api/admin/content-types', {
      query: { perPage: 200 },
      headers
    })
    for (const ct of res.items) {
      registerModule(buildContentModule(ct))
    }
  } catch {
    // guest session: dynamic types appear after sign-in
  }
})
