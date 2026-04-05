'use client'

import { FileText, Clock, Hash, AlignLeft } from 'lucide-react'
import type { ExtractedDocument } from '@/types'

interface Props {
  doc: ExtractedDocument
  filename: string
  onContinue: () => void
  onReset: () => void
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
      <div className="p-2 bg-brand-100 rounded-lg text-brand-600">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-base font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function TextPreview({ doc, filename, onContinue, onReset }: Props) {
  const { text, pageCount, charCount, wordCount, estimatedMinutes } = doc

  const preview = text.slice(0, 800).trim()
  const truncated = text.length > 800

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Texto extraído</h2>
          <p className="text-sm text-slate-500 mt-0.5 truncate max-w-sm">{filename}</p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 flex-shrink-0"
        >
          Cambiar PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={<FileText className="w-4 h-4" />} label="Páginas"   value={String(pageCount)} />
        <Stat icon={<AlignLeft className="w-4 h-4" />} label="Palabras"  value={wordCount.toLocaleString('es')} />
        <Stat icon={<Hash className="w-4 h-4" />}      label="Caracteres" value={charCount.toLocaleString('es')} />
        <Stat icon={<Clock className="w-4 h-4" />}     label="~Audio"    value={`${estimatedMinutes} min`} />
      </div>

      {/* Text preview */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Vista previa del texto
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
            {preview}
            {truncated && (
              <span className="text-slate-400 italic">
                {'\n\n'}… ({(text.length - 800).toLocaleString('es')} caracteres más)
              </span>
            )}
          </p>
        </div>
      </div>

      {charCount > 200_000 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>PDF largo detectado.</strong> Se procesarán los primeros 200 000 caracteres
          (~100 páginas). Puedes aumentar este límite con <code>NEXT_PUBLIC_MAX_CHARS</code> en{' '}
          <code>.env.local</code>.
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onContinue}
        className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
      >
        Continuar → Configurar voz
      </button>
    </div>
  )
}
