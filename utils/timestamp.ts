/**
 * Parses timestamp string "[mm:ss]" or "[hh:mm:ss]" into total seconds.
 */
export function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0
  const clean = ts.replace(/[\[\]]/g, '').trim()
  const parts = clean.split(':').map(part => parseInt(part, 10))

  if (parts.some(isNaN)) return 0

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  return 0
}

/**
 * Formats seconds into "mm:ss" or "hh:mm:ss" string.
 */
export function formatSecondsToTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0))
  const hrs = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60

  const pad = (num: number) => num.toString().padStart(2, '0')

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}

export interface ExtractedTimestamp {
  raw: string
  seconds: number
  index: number
}

/**
 * Extracts all timestamp patterns [mm:ss] or [hh:mm:ss] from text.
 */
export function extractTimestamps(text: string): ExtractedTimestamp[] {
  if (!text) return []
  const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g
  const results: ExtractedTimestamp[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    results.push({
      raw: match[0],
      seconds: parseTimestampToSeconds(match[1]),
      index: match.index
    })
  }

  return results
}

/**
 * Replaces timestamps with clickable HTML badge spans for previewing.
 */
export function replaceTimestampsWithBadges(markdown: string): string {
  if (!markdown) return ''
  return markdown.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g, (match, timeStr) => {
    const seconds = parseTimestampToSeconds(timeStr)
    return `<button type="button" class="timestamp-badge inline-flex items-center px-1.5 py-0.5 my-0.5 rounded font-mono text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer mr-1" data-timestamp="${seconds}">[${timeStr}]</button>`
  })
}
