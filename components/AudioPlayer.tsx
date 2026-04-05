'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Download, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  audioUrl: string
  filename?: string
  downloadUrl: string
  onReset: () => void
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ audioUrl, filename, downloadUrl, onReset }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.pause()
    else audio.play()
  }, [isPlaying])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const t = parseFloat(e.target.value)
    audio.currentTime = t
    setCurrentTime(t)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    setIsMuted(v === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isMuted) {
      audio.volume = volume || 0.8
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [audioUrl])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-3">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Audio listo
        </div>
        {filename && (
          <p className="text-sm text-slate-500 truncate max-w-sm mx-auto">{filename}</p>
        )}
      </div>

      {/* Waveform placeholder + controls */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 shadow-lg">
        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Decorative waveform bars */}
        <div className="flex items-center justify-center gap-0.5 h-12 mb-6 opacity-40">
          {Array.from({ length: 48 }).map((_, i) => {
            const h = [20, 40, 60, 80, 100, 80, 60, 40][(i * 3) % 8]
            const isActive = progress > 0 && (i / 48) * 100 < progress
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={clsx(
                  'w-1.5 rounded-full transition-colors duration-100',
                  isActive ? 'bg-white' : 'bg-white/40',
                )}
              />
            )
          })}
        </div>

        {/* Seek bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={toggleMute}
              className="text-white/70 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolume}
              className="w-20 h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          {/* Play/pause */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform mx-4"
          >
            {isPlaying
              ? <Pause className="w-6 h-6 text-brand-700 fill-brand-700" />
              : <Play  className="w-6 h-6 text-brand-700 fill-brand-700 ml-0.5" />}
          </button>

          {/* Spacer (mirror of volume) */}
          <div className="flex-1" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <a
          href={downloadUrl}
          download={filename ?? 'audiolibro.mp3'}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar MP3
        </a>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Nuevo PDF
        </button>
      </div>
    </div>
  )
}
