import RevisionResource from './admin/RevisionResource'

export default defineModule(t => ({
  name: 'revisions',
  resources: [RevisionResource(t)],
  navGroups: [{ label: t('res.revisions.group'), sort: 96 }]
}))
