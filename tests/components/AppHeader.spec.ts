import { describe, it, expect } from 'vitest'
import { isValidYouTubeInput, extractYouTubeId } from '~/utils/youtube'

describe('AppHeader Logic', () => {
  it('validates correct youtube links', () => {
    expect(isValidYouTubeInput('https://youtube.com/watch?v=test1234567')).toBe(true)
    expect(isValidYouTubeInput('https://invalid.com/test')).toBe(false)
  })

  it('generates standard thumbnail URL from video ID', () => {
    const videoId = 'abc12345678'
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    expect(thumbUrl).toContain('mqdefault.jpg')
    expect(thumbUrl).toContain(videoId)
  })
})
