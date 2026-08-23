import adminPanel from '~/admin/panels/admin.panel'
import dashboardModule from '~/modules/dashboard/module'
import usersModule from '~/modules/users/module'
import postsModule from '~/modules/posts/module'
import ordersModule from '~/modules/orders/module'

/**
 * Application composition root.
 * Register panels and business modules here - exactly like
 * Laravel registers service providers.
 */
export default defineNuxtPlugin(() => {
  setPanel(adminPanel)

  const modules = [dashboardModule, usersModule, postsModule, ordersModule]
  for (const module of modules) {
    registerModule(module)
  }
})
