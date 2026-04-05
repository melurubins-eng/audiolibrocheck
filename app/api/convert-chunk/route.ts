import { NextRequest, NextResponse } from 'next/server'
import { synthesizeChunk } from '@/lib/tts'
import { findVoice } from '@/lib/voices'

export const dynamic = 'force-dynamic'

interface RequestBody {
  text: string
  voiceId: string
  speakingRate: number
  pitch: number
}

/**
 * Converts a SINGLE text chunk → returns MP3 binary.
 * Designed to complete within Vercel's 10s free-tier timeout.
 * The client orchestrates multiple calls for long PDFs.
 */
export async function POST(request: NextRequest) {
  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const { text, voiceId, speakingRate = 1.0, pitch = 0.0 } = body

  if (!text || !voiceId) {
    return NextResponse.json({ error: 'Faltan text o voiceId.' }, { status: 400 })
  }

  const voice = findVoice(voiceId)
  if (!voice) {
    return NextResponse.json({ error: `Voz desconocida: ${voiceId}` }, { status: 400 })
  }

  try {
    const buffer = await synthesizeChunk({
      text,
      edgeVoiceName: voice.edgeVoiceName,
      speakingRate,
      pitch,
    })

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al sintetizar.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
