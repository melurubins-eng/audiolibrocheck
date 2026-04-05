// ─── App state machine ────────────────────────────────────────────────────────
export type AppStep =
  | 'upload'      // Initial: waiting for PDF
  | 'extracting'  // Parsing PDF
  | 'preview'     // Show extracted text + stats
  | 'configure'   // Voice and speed settings
  | 'converting'  // TTS in progress (SSE stream)
  | 'done'        // Audio ready
  | 'error'       // Any unrecoverable error

// ─── Voice types ──────────────────────────────────────────────────────────────
export type Gender = 'MALE' | 'FEMALE'

export type VoiceQuality = 'Neural'

export interface SpanishVoice {
  id: string            // Unique key = Edge voice name (e.g. "es-AR-ElenaNeural")
  edgeVoiceName: string // Full Edge TTS voice name
  languageCode: string  // BCP-47 (e.g. "es-AR")
  gender: Gender
  quality: VoiceQuality
  region: string        // Display label (e.g. "Argentina")
  regionCode: string    // ISO country code (e.g. "AR")
  displayName: string   // (e.g. "Elena")
}

export interface Region {
  code: string
  name: string
  flag: string
  note?: string
}

// ─── Conversion config ────────────────────────────────────────────────────────
export interface ConversionConfig {
  voiceId: string       // SpanishVoice.id (= edgeVoiceName)
  speakingRate: number  // 0.5 – 2.0 (default 1.0)
  pitch: number         // -10 – +10 (default 0)
}

// ─── Extracted document ───────────────────────────────────────────────────────
export interface ExtractedDocument {
  text: string
  pageCount: number
  charCount: number
  wordCount: number
  estimatedMinutes: number // ~150 words/min narration speed
}

// ─── SSE events from /api/convert-audio ──────────────────────────────────────
export type SSEEventType = 'start' | 'progress' | 'complete' | 'error'

export interface SSEStartEvent {
  type: 'start'
  totalChunks: number
}

export interface SSEProgressEvent {
  type: 'progress'
  current: number
  total: number
}

export interface SSECompleteEvent {
  type: 'complete'
  jobId: string
}

export interface SSEErrorEvent {
  type: 'error'
  message: string
}

export type SSEEvent =
  | SSEStartEvent
  | SSEProgressEvent
  | SSECompleteEvent
  | SSEErrorEvent
