import { NextRequest, NextResponse } from 'next/server'
import { synthesizeChunk } from '@/lib/tts'
import { findVoice } from '@/lib/voices'

export const dynamic = 'force-dynamic'

const SAMPLE_TEXT =
  'Hola, así es como suena mi voz. Puedo leer tu libro completo con esta entonación y velocidad.'

export async function POST(request: NextRequest) {
  const { voiceId, speakingRate = 1.0, pitch = 0.0 } = (await request.json()) as {
    voiceId: string
    speakingRate?: number
    pitch?: number
  }

  const voice = findVoice(voiceId)
  if (!voice) {
    return NextResponse.json({ error: `Voz no encontrada: ${voiceId}` }, { status: 400 })
  }

  try {
    const buffer = await synthesizeChunk({
      text: SAMPLE_TEXT,
      edgeVoiceName: voice.edgeVoiceName,
      speakingRate,
      pitch,
    })

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar preview.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
