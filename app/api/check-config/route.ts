import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  const hasKey = !!process.env.GOOGLE_TTS_API_KEY
  return NextResponse.json({ configured: hasKey })
}
