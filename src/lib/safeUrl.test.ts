import { describe, expect, it } from 'vitest'
import { githubUrl } from './safeUrl'

describe('githubUrl', () => {
  it('keeps https links on github.com', () => {
    expect(githubUrl('https://github.com/me/repo/pull/3')).toBe('https://github.com/me/repo/pull/3')
    expect(githubUrl('https://gist.github.com/x')).toBe('https://gist.github.com/x')
  })

  it('drops anything else', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'http://github.com/a', 'https://github.com.evil.example/a', 'https://evilgithub.com/a', '', null, undefined, 'not a url']) {
      expect(githubUrl(bad)).toBeUndefined()
    }
  })
})
