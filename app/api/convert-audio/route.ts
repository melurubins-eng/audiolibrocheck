import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { chunkText } from '@/lib/text-chunker'
import { synthesizeChunk, concatMp3Buffers } from '@/lib/tts'
import { storeAudio } from '@/lib/audio-store'
import { findVoice } from '@/lib/voices'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min for long books

interface RequestBody {
  text: string
  voiceId: string
  speakingRate: number
  pitch: number
}

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return new Response(
      sseEvent({ type: 'error', message: 'Cuerpo de la solicitud inválido.' }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )
  }

  const { text, voiceId, speakingRate = 1.0, pitch = 0.0 } = body

  if (!text || !voiceId) {
    return new Response(
      sseEvent({ type: 'error', message: 'Faltan parámetros: text y voiceId son obligatorios.' }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )
  }

  const voice = findVoice(voiceId)
  if (!voice) {
    return new Response(
      sseEvent({ type: 'error', message: `Voz desconocida: ${voiceId}` }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )
  }

  const maxChars = parseInt(process.env.NEXT_PUBLIC_MAX_CHARS ?? '200000', 10)
  const safeText = text.length > maxChars ? text.slice(0, maxChars) : text
  const chunks = chunkText(safeText)

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: object) => controller.enqueue(enc.encode(sseEvent(data)))

      try {
        send({ type: 'start', totalChunks: chunks.length })

        const audioBuffers: Buffer[] = []

        for (let i = 0; i < chunks.length; i++) {
          send({ type: 'progress', current: i + 1, total: chunks.length })

          const buf = await synthesizeChunk({
            text: chunks[i],
            edgeVoiceName: voice.edgeVoiceName,
            speakingRate,
            pitch,
          })

          audioBuffers.push(buf)
        }

        const combined = concatMp3Buffers(audioBuffers)
        const jobId = uuidv4()
        const safeName = `audiolibro-${new Date().toISOString().slice(0, 10)}`
        storeAudio(jobId, combined, `${safeName}.mp3`)

        send({ type: 'complete', jobId })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al convertir el audio.'
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
