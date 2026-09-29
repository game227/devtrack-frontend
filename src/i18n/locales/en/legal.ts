export default {
  'legal.backToHome': 'Back to home',
  'legal.footerPrivacy': 'Privacy Policy',
  'legal.footerTerms': 'Terms of Service',
  'legal.updated': 'Last updated {date}',
  'legal.agreementPrefix': 'By creating an account, you agree to the',
  'legal.agreementAnd': 'and',
  'legal.agreementSuffix': '.',

  'legal.privacy.title': 'Privacy Policy',
  'legal.privacy.body': `## What this covers
This policy explains what DevTrack collects when you use the app at this domain, why, and how you can remove it. DevTrack is a project-management tool built for developers; this policy is written for a small, growing product, not a large company's legal department — if anything here is unclear, contact us at the address below.

## Account data
When you register we store your username, email address, and password (as a salted hash, never in plain text). Your profile can optionally include a first name, last name, avatar, bio, and job title. This data is used to run your account, identify you to your teammates inside a workspace, and (for your email) to deliver password-reset links.

## Workspace content
Everything you create inside DevTrack — workspaces, projects, issues, comments, cycles, milestones, notes — is stored so the product can function. This content is visible to other members of the same workspace according to their role; it is never sold or shared outside DevTrack.

## GitHub integration (optional)
If you connect a GitHub account, we store your GitHub username, GitHub user ID, and an OAuth access token, which is encrypted at rest. That token is used only to read the repository data needed for the features you enable (issue/PR/commit sync, webhooks) and is scoped to the permissions you grant during GitHub's own authorization screen. Disconnecting removes the stored token.

## Telegram bot (optional)
If you link a Telegram account, the connection (your Telegram chat ID) is stored by the separate DevTrack Telegram bot service, not in the main app's database. It is used only to deliver notifications, password-reset links, and a daily digest you can turn off, and to let you interact with DevTrack through bot commands.

## Who else sees data
We use a small number of service providers to run DevTrack: a hosting provider (currently Render) for the app and database, an email provider (currently Resend) to deliver password-reset and account emails, and — once enabled — an error-tracking service (Sentry) to help us find and fix bugs. None of these providers use your data for their own purposes; they process it only to provide their service to us.

## How long we keep it
Your data is kept for as long as your account is active. You can delete your account at any time from Settings; this deactivates it, removes your personal information (name, email, bio, avatar), and revokes your active sessions. We keep a minimal, anonymized record where necessary to preserve other people's shared workspace data (for example, an issue you reported stays visible to your former teammates, attributed to a deactivated account).

## Your choices
You can update or correct your profile at any time from Settings, disconnect GitHub or Telegram at any time, and delete your account at any time. If you have a question we haven't answered here, or want a copy of your data, write to us.

## Contact
abdulazizshukurov12@gmail.com`,

  'legal.terms.title': 'Terms of Service',
  'legal.terms.body': `## Agreement
By creating an account or using DevTrack, you agree to these terms. If you're using DevTrack on behalf of an organization, you're agreeing on its behalf and confirming you have the authority to do so.

## The service
DevTrack is a project-management and development-intelligence tool: workspaces, projects, issues, a kanban board, GitHub-aware workflow tracking, and related analytics. It's an evolving product — features may be added, changed, or removed, and this early version may have bugs or occasional downtime.

## Your account
You're responsible for the security of your password and for activity that happens under your account. Tell us if you believe your account has been compromised. You must provide accurate information when you register and keep it up to date.

## Your content
You keep ownership of everything you create in DevTrack — issues, comments, notes, and any other content. You're responsible for what you post and for having the right to connect any external account (such as GitHub) you link. We only use your content to operate and improve DevTrack, as described in the Privacy Policy.

## Acceptable use
Don't use DevTrack to break the law, to attack or overload our infrastructure, to access another workspace you're not a member of, or to abuse the GitHub or Telegram integrations beyond their intended purpose. We may suspend or terminate accounts that do.

## GitHub and Telegram integrations
These integrations are optional and rely on third-party services (GitHub, Telegram) that have their own terms. We aren't responsible for their availability or behavior; if one of them changes in a way that breaks the integration, we'll fix what we can on our side but can't guarantee the third-party service itself.

## Availability and changes
DevTrack is currently offered as-is, without uptime guarantees, while it's actively developed. We'll try to give notice before changes that meaningfully affect how you use the product, but an early-stage product like this one can change quickly.

## Ending your use
You can stop using DevTrack and delete your account at any time from Settings. We may suspend or terminate an account that violates these terms or the acceptable-use section above.

## Liability
DevTrack is provided without warranties of any kind. To the extent permitted by law, we aren't liable for indirect or incidental damages arising from your use of the service.

## Changes to these terms
If these terms change meaningfully, we'll update the date below and, where practical, let you know in the app.

## Contact
abdulazizshukurov12@gmail.com`,
} as const
