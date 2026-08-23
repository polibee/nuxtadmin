import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@nuxt/eslint'
  ],

  components: [
    { path: '~/admin/ui', pathPrefix: false },
    { path: '~/admin/framework', pathPrefix: false }
  ],

  // Framework DSL auto-imports (builders available everywhere)
  imports: {
    dirs: [
      '~/stores',
      '~/admin/core',
      '~/admin/panel',
      '~/admin/navigation',
      '~/admin/permissions',
      '~/admin/schemas/builders',
      '~/admin/infolists',
      '~/admin/actions',
      '~/admin/widgets',
      '~/admin/modules',
      '~/admin/forms',
      '~/admin/tables',
      '~/admin/framework',
      '~/admin/notifications'
    ]
  },

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { redirect: { to: '/admin', statusCode: 302 } },
    '/api/**': { cors: true }
  },

  compatibilityDate: '2026-06-30',

  vite: {
    plugins: [tailwindcss()]
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
