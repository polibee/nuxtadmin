import RevisionResource from './admin/RevisionResource'

export default defineModule({
  name: 'revisions',
  resources: [RevisionResource],
  navGroups: [{ label: 'System', sort: 90 }]
})
