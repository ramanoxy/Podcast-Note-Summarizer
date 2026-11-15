import { describe, it, expect } from 'vitest'
import { 
  parseTimestampToSeconds, 
  formatSecondsToTimestamp, 
  extractTimestamps,
  replaceTimestampsWithBadges 
} from '~/utils/timestamp'

describe('Timestamp Utils', () => {
  it('converts mm:ss to seconds', () => {
    expect(parseTimestampToSeconds('04:20')).toBe(260)
    expect(parseTimestampToSeconds('00:00')).toBe(0)
  })

  it('converts hh:mm:ss to seconds', () => {
    expect(parseTimestampToSeconds('01:15:30')).toBe(4530)
    expect(parseTimestampToSeconds('02:00:00')).toBe(7200)
  })

  it('formats seconds to mm:ss', () => {
    expect(formatSecondsToTimestamp(260)).toBe('04:20')
    expect(formatSecondsToTimestamp(0)).toBe('00:00')
    expect(formatSecondsToTimestamp(59)).toBe('00:59')
  })

  it('formats >1hr seconds to hh:mm:ss', () => {
    expect(formatSecondsToTimestamp(4530)).toBe('01:15:30')
    expect(formatSecondsToTimestamp(7200)).toBe('02:00:00')
  })

  it('extracts all timestamp patterns from markdown text', () => {
    const text = 'Opening [00:10], key point [04:20], long discussion [01:05:00]'
    const res = extractTimestamps(text)
    expect(res).toHaveLength(3)
    expect(res[0].seconds).toBe(10)
    expect(res[1].seconds).toBe(260)
    expect(res[2].seconds).toBe(3900)
  })

  it('replaces timestamps with interactive badge markup for preview', () => {
    const text = 'Check [04:20] for detail'
    const rendered = replaceTimestampsWithBadges(text)
    expect(rendered).toContain('data-timestamp="260"')
    expect(rendered).toContain('[04:20]')
  })
})
