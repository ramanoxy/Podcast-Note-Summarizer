/**
 * Inserts formatted timestamp string "[mm:ss]" cleanly at current cursor position in a textarea.
 */
export function insertTimestampAtCursor(
  text: string,
  cursorPos: number,
  formattedTime: string
): { newText: string; newCursor: number } {
  const current = text || ''
  const tag = `[${formattedTime}]`

  if (cursorPos <= 0) {
    const spaceAfter = current.length > 0 && !current.startsWith(' ') ? ' ' : ''
    const newText = `${tag}${spaceAfter}${current}`
    return {
      newText,
      newCursor: tag.length + spaceAfter.length
    }
  }

  if (cursorPos >= current.length) {
    const spaceBefore = current.length > 0 && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : ''
    const newText = `${current}${spaceBefore}${tag} `
    return {
      newText,
      newCursor: newText.length
    }
  }

  const before = current.substring(0, cursorPos)
  const after = current.substring(cursorPos)

  const spaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
  const spaceAfter = after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : ''

  const insert = `${spaceBefore}${tag}${spaceAfter}`
  const newText = `${before}${insert}${after}`
  const newCursor = cursorPos + insert.length

  return {
    newText,
    newCursor
  }
}
