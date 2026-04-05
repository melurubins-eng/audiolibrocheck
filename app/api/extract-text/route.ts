import { NextRequest, NextResponse } from 'next/server'
import { countWords, estimateMinutes } from '@/lib/text-chunker'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'El archivo debe ser un PDF.' }, { status: 400 })
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamically import pdf-parse to avoid Next.js static-analysis side effects
    // (the package tries to read a test file when its index.js is loaded at build time)
    const pdfParse = (await import('pdf-parse')).default
    const parsed = await pdfParse(buffer)

    const text = parsed.text
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto del PDF. Puede ser un PDF escaneado (solo imágenes).' },
        { status: 422 },
      )
    }

    const wordCount = countWords(text)

    return NextResponse.json({
      text,
      pageCount: parsed.numpages,
      charCount: text.length,
      wordCount,
      estimatedMinutes: estimateMinutes(wordCount),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al procesar el PDF.'
    console.error('[extract-text]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
