'use client'

import { useState, useCallback } from 'react'
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import TextPreview from '@/components/TextPreview'
import VoiceConfig from '@/components/VoiceConfig'
import AudioPlayer from '@/components/AudioPlayer'
import type { AppStep, ExtractedDocument, ConversionConfig, SSEEvent } from '@/types'

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
  const [jobId, setJobId] = useState<string | null>(null)

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
    setConversion({ current: 0, total: 0 })
    setStep('converting')

    try {
      const res = await fetch('/api/convert-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: doc.text,
          voiceId: config.voiceId,
          speakingRate: config.speakingRate,
          pitch: config.pitch,
        }),
      })

      if (!res.body) throw new Error('Sin respuesta del servidor.')

      // Read SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''  // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let event: SSEEvent
          try {
            event = JSON.parse(line.slice(6)) as SSEEvent
          } catch {
            continue
          }

          if (event.type === 'start') {
            setConversion({ current: 0, total: event.totalChunks })
          } else if (event.type === 'progress') {
            setConversion({ current: event.current, total: event.total })
          } else if (event.type === 'complete') {
            setJobId(event.jobId)
            setStep('done')
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al convertir.')
      setStep('error')
    }
  }, [doc])

  const reset = useCallback(() => {
    setStep('upload')
    setDoc(null)
    setFilename('')
    setError(null)
    setJobId(null)
    setConversion({ current: 0, total: 0 })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  const audioUrl     = jobId ? `/api/audio/${jobId}` : ''
  const downloadUrl  = jobId ? `/api/audio/${jobId}?download=true` : ''

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

        {/* UPLOAD */}
        {step === 'upload' && (
          <FileUpload onFileSelected={handleFileSelected} />
        )}

        {/* EXTRACTING */}
        {step === 'extracting' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-slate-600 font-medium">Extrayendo texto del PDF…</p>
            <p className="text-sm text-slate-400">{filename}</p>
          </div>
        )}

        {/* PREVIEW */}
        {step === 'preview' && doc && (
          <TextPreview
            doc={doc}
            filename={filename}
            onContinue={() => setStep('configure')}
            onReset={reset}
          />
        )}

        {/* CONFIGURE */}
        {step === 'configure' && (
          <VoiceConfig
            onConvert={handleConvert}
            onBack={() => setStep('preview')}
          />
        )}

        {/* CONVERTING */}
        {step === 'converting' && (
          <ConvertingView conversion={conversion} />
        )}

        {/* DONE */}
        {step === 'done' && jobId && (
          <AudioPlayer
            audioUrl={audioUrl}
            downloadUrl={downloadUrl}
            filename={filename.replace('.pdf', '.mp3')}
            onReset={reset}
          />
        )}

        {/* ERROR */}
        {step === 'error' && (
          <ErrorView message={error ?? 'Ocurrió un error inesperado.'} onReset={reset} />
        )}
      </div>

      {/* Footer */}
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
          Los PDFs largos se procesan en fragmentos para garantizar calidad de audio.
          Esto puede tomar varios minutos.
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
