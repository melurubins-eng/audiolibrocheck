import { NextRequest, NextResponse } from 'next/server'
import { getAudio } from '@/lib/audio-store'

export const dynamic = 'force-dynamic'

export function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params
  const entry = getAudio(jobId)

  if (!entry) {
    return NextResponse.json(
      { error: 'Audio no encontrado o expirado (30 min de TTL). Por favor, vuelve a convertir.' },
      { status: 404 },
    )
  }

  const isDownload = request.nextUrl.searchParams.get('download') === 'true'

  return new Response(new Uint8Array(entry.buffer), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(entry.buffer.length),
      'Cache-Control': 'private, max-age=1800',
      'Content-Disposition': isDownload
        ? `attachment; filename="${entry.filename}"`
        : `inline; filename="${entry.filename}"`,
    },
  })
}
