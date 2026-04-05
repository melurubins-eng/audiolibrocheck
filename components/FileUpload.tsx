'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export default function FileUpload({ onFileSelected, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.pdf')) return 'Solo se aceptan archivos PDF.'
    if (file.size > 50 * 1024 * 1024) return 'El archivo supera el límite de 50 MB.'
    return null
  }

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file)
      if (err) { setError(err); return }
      setError(null)
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="w-full">
      <label
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        className={clsx(
          'relative flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none',
          isDragging && !disabled
            ? 'border-brand-500 bg-brand-50 scale-[1.01]'
            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3 px-6 text-center pointer-events-none">
          <div className={clsx(
            'p-4 rounded-full transition-colors',
            isDragging ? 'bg-brand-100' : 'bg-slate-100',
          )}>
            {isDragging
              ? <FileText className="w-8 h-8 text-brand-600" />
              : <Upload className="w-8 h-8 text-slate-400" />}
          </div>

          <div>
            <p className="text-base font-semibold text-slate-700">
              {isDragging ? 'Suelta el PDF aquí' : 'Arrastra tu PDF aquí'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              o{' '}
              <span className="text-brand-600 font-medium underline underline-offset-2">
                haz clic para seleccionar
              </span>
            </p>
          </div>

          <p className="text-xs text-slate-400">PDF · Máximo 50 MB</p>
        </div>
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
