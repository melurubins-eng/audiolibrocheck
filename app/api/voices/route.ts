import { NextResponse } from 'next/server'
import { SPANISH_VOICES, REGIONS } from '@/lib/voices'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ voices: SPANISH_VOICES, regions: REGIONS })
}
