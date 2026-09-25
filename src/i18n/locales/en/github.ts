const en: Record<string, string> = {
  'github.sync': 'Sync now',
  'github.syncing': 'Syncing…',
  'github.synced': 'Synced: {pulls} pull requests, {commits} commits, {issues} issues.',
  'github.syncFailed': "Couldn't sync with GitHub.",
  'github.noWebhook':
    'Live updates are off — GitHub cannot reach this server (or the webhook could not be created). Use “Sync now” to pull the latest pull requests and commits.',
  'github.webhookOn': 'Live updates are on.',
  'github.lastEvent': 'Live updates are on · last event {when}',
  'github.webhookQuiet': 'Webhook installed, but GitHub has not sent anything yet.',
  'github.lastSynced': 'Last sync: {when}',
  'github.neverSynced': 'Not synced yet.',
  'github.defaultBranch': 'Default branch: {branch} — a pull request merged into it closes its issues.',
  'github.rules': 'Commit mentioning #id → In progress · Pull request → In review · Merged → Done. Status only ever moves forward.',
  'github.draftPr': 'draft',
  'github.readOnly': 'read-only',

  'github.import.button': 'Import from GitHub',
  'github.import.title': 'Import a repository as a project',
  'github.import.help': 'Creates a project from a GitHub repository, links it and can import its issues.',
  'github.import.select': 'Choose a repository…',
  'github.import.issues': "Import the repository's issues",
  'github.import.submit': 'Import',
  'github.import.submitting': 'Importing…',
  'github.import.needConnect': 'Connect your GitHub account first to import repositories.',
  'github.import.goSettings': 'Connect GitHub',
  'github.import.noRepos': 'No repositories found on your GitHub account.',

  'issue.githubNumber': 'GitHub #{number}',
}

export default en
