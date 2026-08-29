import TaxonomyResource from './admin/TaxonomyResource'

export default defineModule(t => ({
  name: 'taxonomy',
  resources: [TaxonomyResource(t)],
  navGroups: [{ label: t('res.taxonomy.group'), sort: 45 }]
}))
