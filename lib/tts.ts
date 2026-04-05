import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

export interface SynthesizeOptions {
  text: string
  edgeVoiceName: string
  speakingRate: number   // 0.5 – 2.0
  pitch: number          // -10 – +10
}

/**
 * Synthesizes a single text chunk → returns raw MP3 bytes.
 * Uses Microsoft Edge's free neural TTS service (no API key needed).
 */
export async function synthesizeChunk(opts: SynthesizeOptions): Promise<Buffer> {
  const { text, edgeVoiceName, speakingRate, pitch } = opts

  const tts = new MsEdgeTTS()
  await tts.setMetadata(edgeVoiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)

  // Edge TTS rate: "+0%", "+50%", "-25%" etc.  We map 0.5–2.0 → -50% to +100%
  const ratePct = Math.round((speakingRate - 1) * 100)
  const rateStr = `${ratePct >= 0 ? '+' : ''}${ratePct}%`

  // Edge TTS pitch: "+0Hz", "+50Hz", "-100Hz" etc.  We map -10..+10 → -100Hz to +100Hz
  const pitchHz = Math.round(pitch * 10)
  const pitchStr = `${pitchHz >= 0 ? '+' : ''}${pitchHz}Hz`

  const { audioStream } = tts.toStream(text, { rate: rateStr, pitch: pitchStr })

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk))
    audioStream.on('end', () => resolve(Buffer.concat(chunks)))
    audioStream.on('error', reject)
  })
}

/**
 * Concatenates MP3 buffers.
 * MP3 is frame-based, so Buffer.concat produces valid seamless audio.
 */
export function concatMp3Buffers(buffers: Buffer[]): Buffer {
  return Buffer.concat(buffers)
}
