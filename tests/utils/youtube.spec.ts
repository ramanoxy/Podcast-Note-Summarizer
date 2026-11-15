import { describe, it, expect } from 'vitest'
import { extractYouTubeId, isValidYouTubeInput } from '~/utils/youtube'

describe('extractYouTubeId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts ID from short youtu.be URL with timestamp param', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ')
  })
  it('extracts ID from shorts URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts ID from embed URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('returns null for invalid URLs', () => {
    expect(extractYouTubeId('https://google.com')).toBeNull()
    expect(extractYouTubeId('')).toBeNull()
  })
})

describe('isValidYouTubeInput', () => {
  it('validates correct youtube links', () => {
    expect(isValidYouTubeInput('https://youtube.com/watch?v=test1234567')).toBe(true)
    expect(isValidYouTubeInput('https://youtu.be/test1234567')).toBe(true)
    expect(isValidYouTubeInput('https://invalid.com/test')).toBe(false)
  })
})
