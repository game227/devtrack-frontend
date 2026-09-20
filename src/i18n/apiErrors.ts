import { translate } from './core'
import type { Lang, TranslateParams } from './core'

type Rule = [pattern: RegExp, key: string, params?: (match: RegExpMatchArray) => TranslateParams]

// The API answers in English (DRF has no Uzbek catalog). Known messages are mapped to
// translation keys; anything unrecognised is shown as the server sent it.
const RULES: Rule[] = [
  [/^This field is required\.?$/, 'error.required'],
  [/^This field may not be blank\.?$/, 'error.blank'],
  [/^This field may not be null\.?$/, 'error.null'],
  [/^Enter a valid email address\.?$/, 'error.email'],
  [/^Enter a valid URL\.?$/, 'error.url'],
  [/^Date has wrong format/, 'error.dateFormat'],
  [/^"?.*"? is not a valid choice\.?$/, 'error.invalidChoice'],
  [/^Ensure this field has no more than (\d+) characters?\.?$/, 'error.maxLength', (m) => ({ n: m[1] })],
  [/^Ensure this field has at least (\d+) characters?\.?$/, 'error.minLength', (m) => ({ n: m[1] })],
  [/^A user with that username already exists\.?$/, 'error.usernameTaken'],
  [/^(?:A )?user with (?:that|this) email already exists\.?$/i, 'error.emailTaken'],
  [/^The fields .+ must make a unique set\.?$/, 'error.notUnique'],
  [/ with this .+ already exists\.?$/i, 'error.alreadyExists'],
  [/^No active account found with the given credentials$/, 'error.badCredentials'],
  [/^Authentication credentials were not provided\.?$/, 'error.notAuthenticated'],
  [/^(?:Given token not valid for any token type|Token is invalid or expired|Token is invalid)/, 'error.sessionExpired'],
  [/^You do not have permission to perform this action\.?$/, 'error.forbidden'],
  [/^Not found\.?$/, 'error.notFound'],
  [/^Request was throttled\./, 'error.throttled'],
  [/^This password is too short\. It must contain at least (\d+) characters?\.?$/, 'error.passwordShort', (m) => ({ n: m[1] })],
  [/^This password is too common\.?$/, 'error.passwordCommon'],
  [/^This password is entirely numeric\.?$/, 'error.passwordNumeric'],
  [/^The password is too similar to the /, 'error.passwordSimilar'],
  [/^Passwords do not match\.?$/, 'error.passwordMismatch'],
  [/^Old password is incorrect\.?$/, 'error.oldPasswordWrong'],
  [/^Invalid or expired token\.?$/, 'error.resetTokenInvalid'],
  [/^Invalid user\.?$/, 'error.resetTokenInvalid'],
  [/^No user with that username exists\.?$/, 'error.noSuchUser'],
  [/^User is already a member of this project\.?$/, 'error.alreadyMemberProject'],
  [/^User is already a member of this team\.?$/, 'error.alreadyMemberTeam'],
  [/^User is already a member of this workspace\.?$/, 'error.alreadyMemberWorkspace'],
  [/^That user is not a member of this workspace\.?$/, 'error.notWorkspaceMember'],
  [/^You are not a member of this (?:project's )?workspace\.?$/, 'error.youNotMember'],
  [/^Only a workspace admin(?: or owner|\/owner) can /, 'error.adminOnly'],
  [/^Only the (?:comment|note)'s author or a workspace admin\/owner can do that\.?$/, 'error.authorOrAdminOnly'],
  [/^This project has no linked GitHub repository\.?$/, 'error.noLinkedRepo'],
  [/^Connect your GitHub account first\.?$/, 'error.githubConnectFirst'],
  [/^This project is already linked to a GitHub repository\.?$/, 'error.projectAlreadyLinked'],
  [/^This repository is already linked to another project\.?$/, 'error.repoAlreadyLinked'],
  [/^The workspace owner cannot be removed\.?$/, 'error.ownerCannotBeRemoved'],
]

export function localizeApiMessage(lang: Lang, message: string): string {
  for (const [pattern, key, params] of RULES) {
    const match = message.match(pattern)
    if (match) return translate(lang, key, params?.(match))
  }
  return message
}
