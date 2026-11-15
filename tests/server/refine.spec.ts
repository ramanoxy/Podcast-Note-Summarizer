import { describe, it, expect } from 'vitest'
import { buildRefinementPrompt, validateRefineRequest } from '~/server/utils/prompt'

describe('Refine Route Logic', () => {
  it('rejects empty notes payload', () => {
    expect(() => validateRefineRequest({ notes: '   ' })).toThrow('Notes cannot be empty')
    expect(() => validateRefineRequest({} as any)).toThrow('Notes cannot be empty')
  })

  it('accepts valid notes payload', () => {
    const valid = validateRefineRequest({ notes: 'Catatan penting' })
    expect(valid.notes).toBe('Catatan penting')
  })

  it('constructs prompt containing user notes and strict timestamp preservation instruction', () => {
    const prompt = buildRefinementPrompt('Catatan kasar [02:15] poin penting', 'Podcast Episode')
    expect(prompt).toContain('Catatan kasar [02:15] poin penting')
    expect(prompt).toContain('[mm:ss]')
    expect(prompt).toContain('Podcast Episode')
    expect(prompt).toContain('timestamp')
  })
})
