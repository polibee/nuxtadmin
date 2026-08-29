import type { ModuleInput } from '../core/types'

/**
 * Identity helper for business modules. Accepts a plain definition or
 * a factory receiving the i18n translator - factories let modules
 * resolve their labels in the active locale at registration time.
 */
export function defineModule(module: ModuleInput): ModuleInput {
  return module
}
