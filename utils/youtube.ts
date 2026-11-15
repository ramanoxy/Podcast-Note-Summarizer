/**
 * Extracts YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // Check watch URL: ?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]

  // Check youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  // Check /embed/VIDEO_ID or /shorts/VIDEO_ID
  const embedOrShortsMatch = trimmed.match(/youtube\.com\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/)
  if (embedOrShortsMatch) return embedOrShortsMatch[1]

  return null
}

export function isValidYouTubeInput(url: string): boolean {
  return extractYouTubeId(url) !== null
}
