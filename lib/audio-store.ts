/**
 * In-memory store for generated audio files.
 *
 * Entries expire after TTL_MS (default 30 min) to avoid memory leaks.
 * In production you would replace this with S3 / GCS / Redis presigned URLs.
 *
 * ⚠️  This works correctly for local dev.  On serverless platforms (Vercel)
 *    each function invocation may use a different instance, so /api/audio/[id]
 *    might not find an entry produced by /api/convert-audio.
 *    Fix for production → write to /tmp or upload to object storage.
 */

const TTL_MS = 30 * 60 * 1000 // 30 minutes

interface AudioEntry {
  buffer: Buffer
  filename: string
  expiresAt: number
}

// Module-level map — persists across requests in the same Node.js process
const store = new Map<string, AudioEntry>()

export function storeAudio(jobId: string, buffer: Buffer, filename: string): void {
  store.set(jobId, {
    buffer,
    filename,
    expiresAt: Date.now() + TTL_MS,
  })

  // Schedule cleanup
  setTimeout(() => store.delete(jobId), TTL_MS)
}

export function getAudio(jobId: string): AudioEntry | undefined {
  const entry = store.get(jobId)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(jobId)
    return undefined
  }
  return entry
}

export function deleteAudio(jobId: string): void {
  store.delete(jobId)
}
