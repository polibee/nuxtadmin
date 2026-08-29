import TaxonomyResource from './admin/TaxonomyResource'

export default defineModule({
  name: 'taxonomy',
  resources: [TaxonomyResource],
  navGroups: [{ label: 'Content Structure', sort: 40 }]
})
