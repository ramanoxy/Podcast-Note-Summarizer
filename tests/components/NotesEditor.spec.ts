import { describe, it, expect } from 'vitest'
import { insertTimestampAtCursor } from '~/utils/editor'

describe('insertTimestampAtCursor', () => {
  it('inserts formatted timestamp badge at cursor position', () => {
    const text = 'Halo dunia'
    const res = insertTimestampAtCursor(text, 4, '02:30')
    expect(res.newText).toBe('Halo [02:30] dunia')
    expect(res.newCursor).toBe(12)
  })

  it('inserts timestamp at the beginning if cursor is 0', () => {
    const text = 'Poin pertama'
    const res = insertTimestampAtCursor(text, 0, '00:15')
    expect(res.newText).toBe('[00:15] Poin pertama')
    expect(res.newCursor).toBe(8)
  })

  it('inserts timestamp at end of text if cursor exceeds length', () => {
    const text = 'Akhir kalimat'
    const res = insertTimestampAtCursor(text, 100, '05:00')
    expect(res.newText).toBe('Akhir kalimat [05:00] ')
    expect(res.newCursor).toBe(res.newText.length)
  })
})
