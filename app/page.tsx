'use client'

import { useState, useCallback, useRef } from 'react'
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import TextPreview from '@/components/TextPreview'
import VoiceConfig from '@/components/VoiceConfig'
import AudioPlayer from '@/components/AudioPlayer'
import { chunkText, cleanText } from '@/lib/text-chunker'
import type { AppStep, ExtractedDocument, ConversionConfig } from '@/types'

interface ConversionState {
  current: number
  total: number
}

export default function Home() {
  const [step, setStep] = useState<AppStep>('upload')
  const [filename, setFilename] = useState('')
  const [doc, setDoc] = useState<ExtractedDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conversion, setConversion] = useState<ConversionState>({ current: 0, total: 0 })
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(async (file: File) => {
    setFilename(file.name)
    setError(null)
    setStep('extracting')

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const res = await fetch('/api/extract-text', { method: 'POST', body: formData })
      const data = await res.json() as ExtractedDocument & { error?: string }

      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al extraer el texto.')

      setDoc(data)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al procesar el PDF.')
      setStep('error')
    }
  }, [])

  const handleConvert = useCallback(async (config: ConversionConfig) => {
    if (!doc) return
    setError(null)
    setStep('converting')

    // Clean + chunk text on the client
    const maxChars = parseInt(process.env.NEXT_PUBLIC_MAX_CHARS ?? '200000', 10)
    const safeText = doc.text.length > maxChars ? doc.text.slice(0, maxChars) : doc.text
    const chunks = chunkText(safeText)

    setConversion({ current: 0, total: chunks.length })

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const audioBlobs: Blob[] = []

      for (let i = 0; i < chunks.length; i++) {
        if (abortController.signal.aborted) break

        setConversion({ current: i + 1, total: chunks.length })

        const res = await fetch('/api/convert-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunks[i],
            voiceId: config.voiceId,
            speakingRate: config.speakingRate,
            pitch: config.pitch,
          }),
          signal: abortController.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `Error ${res.status}` }))
          throw new Error(err.error ?? `Error al procesar fragmento ${i + 1}`)
        }

        const blob = await res.blob()
        audioBlobs.push(blob)
      }

      // Concatenate all audio blobs client-side
      const fullBlob = new Blob(audioBlobs, { type: 'audio/mpeg' })
      const url = URL.createObjectURL(fullBlob)
      setAudioUrl(url)
      setStep('done')
    } catch (err) {
      if (abortController.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Error inesperado al convertir.')
      setStep('error')
    } finally {
      abortRef.current = null
    }
  }, [doc])

  const reset = useCallback(() => {
    // Abort any in-progress conversion
    abortRef.current?.abort()
    // Revoke old audio URL
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setStep('upload')
    setDoc(null)
    setFilename('')
    setError(null)
    setAudioUrl(null)
    setConversion({ current: 0, total: 0 })
  }, [audioUrl])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex flex-col items-center justify-start py-12 px-4">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 bg-brand-600 rounded-2xl shadow-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Audiolibro</h1>
        </div>
        <p className="text-slate-500 max-w-md">
          Sube un PDF y conviértelo en audio con voces en español de España, México, Argentina o Colombia.
        </p>
      </header>

      {/* Step indicator */}
      <StepIndicator step={step} />

      {/* Main card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8 mt-6">

        {step === 'upload' && (
          <FileUpload onFileSelected={handleFileSelected} />
        )}

        {step === 'extracting' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-slate-600 font-medium">Extrayendo texto del PDF…</p>
            <p className="text-sm text-slate-400">{filename}</p>
          </div>
        )}

        {step === 'preview' && doc && (
          <TextPreview
            doc={doc}
            filename={filename}
            onContinue={() => setStep('configure')}
            onReset={reset}
          />
        )}

        {step === 'configure' && (
          <VoiceConfig
            onConvert={handleConvert}
            onBack={() => setStep('preview')}
          />
        )}

        {step === 'converting' && (
          <ConvertingView conversion={conversion} />
        )}

        {step === 'done' && audioUrl && (
          <AudioPlayer
            audioUrl={audioUrl}
            downloadUrl={audioUrl}
            filename={filename.replace('.pdf', '.mp3')}
            onReset={reset}
          />
        )}

        {step === 'error' && (
          <ErrorView message={error ?? 'Ocurrió un error inesperado.'} onReset={reset} />
        )}
      </div>

      <footer className="mt-8 text-xs text-slate-400 text-center">
        Powered by Microsoft Edge Neural TTS · Next.js
      </footer>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: AppStep }) {
  const steps: { key: AppStep[]; label: string }[] = [
    { key: ['upload', 'extracting'], label: '1. Subir PDF' },
    { key: ['preview'],              label: '2. Vista previa' },
    { key: ['configure'],            label: '3. Configurar voz' },
    { key: ['converting'],           label: '4. Convertir' },
    { key: ['done'],                 label: '5. Escuchar' },
  ]

  const activeIndex = steps.findIndex(s => s.key.includes(step))

  return (
    <ol className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
      {steps.map((s, i) => {
        const isDone    = i < activeIndex
        const isActive  = i === activeIndex

        return (
          <li key={i} className="flex items-center gap-1 sm:gap-2">
            <span className={`
              text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap
              ${isDone   ? 'bg-brand-100 text-brand-700' : ''}
              ${isActive ? 'bg-brand-600 text-white shadow-sm' : ''}
              ${!isDone && !isActive ? 'bg-slate-100 text-slate-400' : ''}
            `}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="text-slate-300 text-xs hidden sm:inline">›</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function ConvertingView({ conversion }: { conversion: ConversionState }) {
  const { current, total } = conversion
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="relative">
        <Loader2 className="w-14 h-14 text-brand-500 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-600">
          {pct}%
        </span>
      </div>

      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span className="font-medium">Convirtiendo a audio…</span>
          {total > 0 && (
            <span className="text-slate-400">
              Fragmento {current} de {total}
            </span>
          )}
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs text-slate-400 text-center">
          Cada fragmento se convierte individualmente.
          {total > 5 && ' Esto puede tomar varios minutos para PDFs largos.'}
        </p>
      </div>
    </div>
  )
}

function ErrorView({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="p-4 bg-red-100 rounded-full">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800 text-lg">Algo salió mal</p>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">{message}</p>
      </div>
      <button
        onClick={onReset}
        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
