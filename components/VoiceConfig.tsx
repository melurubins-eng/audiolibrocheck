'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Info, Mic2, Play, Square, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { REGIONS, getVoicesByRegion, DEFAULT_VOICE } from '@/lib/voices'
import type { ConversionConfig, SpanishVoice } from '@/types'

interface Props {
  onConvert: (config: ConversionConfig) => void
  onBack: () => void
  disabled?: boolean
}

export default function VoiceConfig({ onConvert, onBack, disabled }: Props) {
  const [regionCode, setRegionCode] = useState(DEFAULT_VOICE.regionCode)
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE.id)
  const [speakingRate, setSpeakingRate] = useState(1.0)
  const [pitch, setPitch] = useState(0.0)

  // Preview state
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  const voices = getVoicesByRegion(regionCode)
  const selectedRegion = REGIONS.find(r => r.code === regionCode)!

  const handleRegionChange = (code: string) => {
    setRegionCode(code)
    const firstVoice = getVoicesByRegion(code)[0]
    if (firstVoice) setVoiceId(firstVoice.id)
    stopPreview()
  }

  // ── Server-side Edge TTS preview ──────────────────────────────────────────
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setPreviewingId(null)
    setLoadingPreviewId(null)
  }, [])

  const playPreview = useCallback(async (voice: SpanishVoice) => {
    if (previewingId === voice.id) { stopPreview(); return }
    stopPreview()
    setPreviewError(null)
    setLoadingPreviewId(voice.id)

    try {
      const res = await fetch('/api/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId: voice.id, speakingRate, pitch }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(err.error ?? `Error ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      urlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio
      audio.addEventListener('ended', () => setPreviewingId(null))
      await audio.play()
      setPreviewingId(voice.id)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Error al reproducir')
    } finally {
      setLoadingPreviewId(null)
    }
  }, [previewingId, stopPreview, speakingRate, pitch])

  useEffect(() => () => stopPreview(), [stopPreview])

  const handleSubmit = () => {
    stopPreview()
    onConvert({ voiceId, speakingRate, pitch })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Configurar voz</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Voces neurales de alta calidad — gratis, sin API key
        </p>
      </div>

      {previewError && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {previewError}
        </div>
      )}

      {/* Region selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          País / Acento
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REGIONS.map(region => (
            <button
              key={region.code}
              onClick={() => handleRegionChange(region.code)}
              disabled={disabled}
              className={clsx(
                'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all',
                regionCode === region.code
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <span className="text-2xl">{region.flag}</span>
              <span className="text-center leading-tight">{region.name}</span>
            </button>
          ))}
        </div>
        {selectedRegion.note && (
          <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {selectedRegion.note}
          </div>
        )}
      </div>

      {/* Voice selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Voz <span className="font-normal text-slate-400">— toca ▶ para escuchar</span>
        </label>
        <div className="space-y-2">
          {voices.map(voice => {
            const isLoading = loadingPreviewId === voice.id
            const isPlaying = previewingId === voice.id

            return (
              <div
                key={voice.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                  voiceId === voice.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                  disabled && 'opacity-50',
                )}
              >
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="voice"
                    value={voice.id}
                    checked={voiceId === voice.id}
                    onChange={() => setVoiceId(voice.id)}
                    disabled={disabled}
                    className="accent-brand-600 w-4 h-4"
                  />
                  <Mic2 className={clsx(
                    'w-4 h-4',
                    voiceId === voice.id ? 'text-brand-500' : 'text-slate-400',
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-800">{voice.displayName}</span>
                    <span className={clsx(
                      'ml-2 text-xs px-1.5 py-0.5 rounded font-medium',
                      'bg-brand-100 text-brand-700',
                    )}>
                      Neural
                    </span>
                    <span className={clsx(
                      'ml-1 text-xs px-1.5 py-0.5 rounded font-medium',
                      voice.gender === 'FEMALE' ? 'bg-pink-50 text-pink-600' : 'bg-sky-50 text-sky-600',
                    )}>
                      {voice.gender === 'FEMALE' ? 'F' : 'M'}
                    </span>
                  </div>
                </label>

                {/* Preview button — calls Edge TTS on server (real quality!) */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); playPreview(voice) }}
                  disabled={disabled || (loadingPreviewId !== null && loadingPreviewId !== voice.id)}
                  title={isPlaying ? 'Detener' : 'Escuchar voz'}
                  className={clsx(
                    'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all',
                    isPlaying
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-brand-100 text-brand-600 hover:bg-brand-200',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Voces neurales de Microsoft Edge — misma calidad para la preview y la conversión final.
        </p>
      </div>

      {/* Speed */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-slate-700">Velocidad</label>
          <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg">
            {speakingRate.toFixed(2)}x
          </span>
        </div>
        <input
          type="range"
          min={0.5} max={2.0} step={0.05}
          value={speakingRate}
          onChange={e => setSpeakingRate(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 appearance-none bg-slate-200 rounded-full accent-brand-600 cursor-pointer disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0.5x Lento</span>
          <span>1.0x Normal</span>
          <span>2.0x Rápido</span>
        </div>
      </div>

      {/* Pitch */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-slate-700">Tono (pitch)</label>
          <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg">
            {pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min={-10} max={10} step={0.5}
          value={pitch}
          onChange={e => setPitch(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 appearance-none bg-slate-200 rounded-full accent-brand-600 cursor-pointer disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>-10 Grave</span>
          <span>0 Normal</span>
          <span>+10 Agudo</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={disabled}
          className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          ← Volver
        </button>
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="flex-[2] py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Convertir a audio 🎧
        </button>
      </div>
    </div>
  )
}
