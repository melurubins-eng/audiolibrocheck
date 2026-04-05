import type { SpanishVoice, Region } from '@/types'

// ─── Microsoft Edge TTS Voice Catalogue ───────────────────────────────────────
// Voces neurales gratuitas, sin API key.
// Cada país tiene voces con acento REAL (no aproximaciones).
// ──────────────────────────────────────────────────────────────────────────────

export const SPANISH_VOICES: SpanishVoice[] = [
  // ── España (es-ES) ────────────────────────────────────────────────────────
  {
    id: 'es-ES-ElviraNeural',
    edgeVoiceName: 'es-ES-ElviraNeural',
    languageCode: 'es-ES',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'España',
    regionCode: 'ES',
    displayName: 'Elvira',
  },
  {
    id: 'es-ES-AlvaroNeural',
    edgeVoiceName: 'es-ES-AlvaroNeural',
    languageCode: 'es-ES',
    gender: 'MALE',
    quality: 'Neural',
    region: 'España',
    regionCode: 'ES',
    displayName: 'Álvaro',
  },
  {
    id: 'es-ES-XimenaNeural',
    edgeVoiceName: 'es-ES-XimenaNeural',
    languageCode: 'es-ES',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'España',
    regionCode: 'ES',
    displayName: 'Ximena',
  },

  // ── México (es-MX) ────────────────────────────────────────────────────────
  {
    id: 'es-MX-DaliaNeural',
    edgeVoiceName: 'es-MX-DaliaNeural',
    languageCode: 'es-MX',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'México',
    regionCode: 'MX',
    displayName: 'Dalia',
  },
  {
    id: 'es-MX-JorgeNeural',
    edgeVoiceName: 'es-MX-JorgeNeural',
    languageCode: 'es-MX',
    gender: 'MALE',
    quality: 'Neural',
    region: 'México',
    regionCode: 'MX',
    displayName: 'Jorge',
  },
  {
    id: 'es-MX-BeatrizNeural',
    edgeVoiceName: 'es-MX-BeatrizNeural',
    languageCode: 'es-MX',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'México',
    regionCode: 'MX',
    displayName: 'Beatriz',
  },

  // ── Argentina (es-AR) — ACENTO REAL ARGENTINO ─────────────────────────────
  {
    id: 'es-AR-ElenaNeural',
    edgeVoiceName: 'es-AR-ElenaNeural',
    languageCode: 'es-AR',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'Argentina',
    regionCode: 'AR',
    displayName: 'Elena',
  },
  {
    id: 'es-AR-TomasNeural',
    edgeVoiceName: 'es-AR-TomasNeural',
    languageCode: 'es-AR',
    gender: 'MALE',
    quality: 'Neural',
    region: 'Argentina',
    regionCode: 'AR',
    displayName: 'Tomás',
  },

  // ── Colombia (es-CO) — ACENTO REAL COLOMBIANO ─────────────────────────────
  {
    id: 'es-CO-SalomeNeural',
    edgeVoiceName: 'es-CO-SalomeNeural',
    languageCode: 'es-CO',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'Colombia',
    regionCode: 'CO',
    displayName: 'Salomé',
  },
  {
    id: 'es-CO-GonzaloNeural',
    edgeVoiceName: 'es-CO-GonzaloNeural',
    languageCode: 'es-CO',
    gender: 'MALE',
    quality: 'Neural',
    region: 'Colombia',
    regionCode: 'CO',
    displayName: 'Gonzalo',
  },

  // ── Chile (es-CL) ────────────────────────────────────────────────────────
  {
    id: 'es-CL-CatalinaNeural',
    edgeVoiceName: 'es-CL-CatalinaNeural',
    languageCode: 'es-CL',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'Chile',
    regionCode: 'CL',
    displayName: 'Catalina',
  },
  {
    id: 'es-CL-LorenzoNeural',
    edgeVoiceName: 'es-CL-LorenzoNeural',
    languageCode: 'es-CL',
    gender: 'MALE',
    quality: 'Neural',
    region: 'Chile',
    regionCode: 'CL',
    displayName: 'Lorenzo',
  },

  // ── Perú (es-PE) ─────────────────────────────────────────────────────────
  {
    id: 'es-PE-CamilaNeural',
    edgeVoiceName: 'es-PE-CamilaNeural',
    languageCode: 'es-PE',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'Perú',
    regionCode: 'PE',
    displayName: 'Camila',
  },
  {
    id: 'es-PE-AlexNeural',
    edgeVoiceName: 'es-PE-AlexNeural',
    languageCode: 'es-PE',
    gender: 'MALE',
    quality: 'Neural',
    region: 'Perú',
    regionCode: 'PE',
    displayName: 'Alex',
  },

  // ── Venezuela (es-VE) ────────────────────────────────────────────────────
  {
    id: 'es-VE-PaolaNeural',
    edgeVoiceName: 'es-VE-PaolaNeural',
    languageCode: 'es-VE',
    gender: 'FEMALE',
    quality: 'Neural',
    region: 'Venezuela',
    regionCode: 'VE',
    displayName: 'Paola',
  },
  {
    id: 'es-VE-SebastianNeural',
    edgeVoiceName: 'es-VE-SebastianNeural',
    languageCode: 'es-VE',
    gender: 'MALE',
    quality: 'Neural',
    region: 'Venezuela',
    regionCode: 'VE',
    displayName: 'Sebastián',
  },
]

export const REGIONS: Region[] = [
  { code: 'ES', name: 'España',    flag: '🇪🇸' },
  { code: 'MX', name: 'México',    flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia',  flag: '🇨🇴' },
  { code: 'CL', name: 'Chile',     flag: '🇨🇱' },
  { code: 'PE', name: 'Perú',      flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
]

export function getVoicesByRegion(regionCode: string): SpanishVoice[] {
  return SPANISH_VOICES.filter(v => v.regionCode === regionCode)
}

export function findVoice(voiceId: string): SpanishVoice | undefined {
  return SPANISH_VOICES.find(v => v.id === voiceId)
}

export const DEFAULT_VOICE = SPANISH_VOICES.find(v => v.id === 'es-AR-ElenaNeural')!
