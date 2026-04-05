// Google Cloud TTS limit: 5 000 bytes per request.
// We use 4 500 chars as safe limit (some Unicode chars > 1 byte).
const DEFAULT_MAX_CHARS = 4_500

/**
 * Cleans raw PDF text (removes control chars, normalises whitespace).
 */
export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove form-feeds and other control chars (keep newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces/tabs into a single space
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/**
 * Splits text into chunks of at most `maxChars`, preferring to break at:
 *  1. End of paragraph (\n\n)
 *  2. End of sentence (. ! ?)
 *  3. End of a word (space)
 *  4. Hard cut at maxChars (last resort)
 *
 * This guarantees every chunk fits within Google TTS byte limits.
 */
export function chunkText(text: string, maxChars = DEFAULT_MAX_CHARS): string[] {
  const cleaned = cleanText(text)

  if (cleaned.length <= maxChars) return [cleaned]

  const chunks: string[] = []
  let remaining = cleaned

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining.trim())
      break
    }

    let breakAt = maxChars

    // 1. Prefer paragraph break
    const paraEnd = remaining.lastIndexOf('\n\n', maxChars)
    if (paraEnd > maxChars * 0.4) {
      breakAt = paraEnd + 2
    } else {
      // 2. Prefer sentence end
      const dotEnd  = remaining.lastIndexOf('. ', maxChars)
      const exclEnd = remaining.lastIndexOf('! ', maxChars)
      const questEnd = remaining.lastIndexOf('? ', maxChars)
      const sentEnd = Math.max(dotEnd, exclEnd, questEnd)

      if (sentEnd > maxChars * 0.4) {
        breakAt = sentEnd + 2  // include the period and the space
      } else {
        // 3. Prefer word boundary
        const spaceEnd = remaining.lastIndexOf(' ', maxChars)
        if (spaceEnd > maxChars * 0.4) {
          breakAt = spaceEnd + 1
        }
        // 4. Hard cut (breakAt stays at maxChars)
      }
    }

    const chunk = remaining.slice(0, breakAt).trim()
    if (chunk.length > 0) chunks.push(chunk)
    remaining = remaining.slice(breakAt).trimStart()
  }

  return chunks.filter(c => c.length > 0)
}

/** Statistics helpers */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function estimateMinutes(wordCount: number): number {
  // Average audiobook narration speed: ~150 words/min
  return Math.ceil(wordCount / 150)
}
