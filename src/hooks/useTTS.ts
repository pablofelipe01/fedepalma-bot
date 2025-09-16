/**
 * Hook para manejar la síntesis de texto a voz
 * Integra Eleven Labs TTS para conversaciones fluidas
 */

import { useState, useCallback, useRef } from 'react'

interface UseTTSOptions {
  voice_id?: string
  autoPlay?: boolean
  onAudioStart?: () => void
  onAudioEnd?: () => void
  onError?: (error: string) => void
}

interface TTSState {
  isLoading: boolean
  isPlaying: boolean
  error: string | null
}

export function useTTS({
  voice_id = 'EXAVITQu4vr4xnSDxMaL', // Bella - Voz femenina latina
  autoPlay = true,
  onAudioStart,
  onAudioEnd,
  onError
}: UseTTSOptions = {}) {
  
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    error: null
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleAudioEnd = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }))
    onAudioEnd?.()
  }, [onAudioEnd])

  const handleAudioError = useCallback(() => {
    const error = 'Error al reproducir audio'
    setState(prev => ({ ...prev, isPlaying: false, error }))
    onError?.(error)
  }, [onError])

  // Limpiar audio anterior
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeEventListener('ended', handleAudioEnd)
      audioRef.current.removeEventListener('error', handleAudioError)
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [handleAudioEnd, handleAudioError])

  // Función principal para sintetizar y reproducir
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return

    cleanup() // Limpiar reproducción anterior

    setState({ isLoading: true, isPlaying: false, error: null })

    try {
      // Crear nuevo AbortController para esta solicitud
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice_id,
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.2,
            use_speaker_boost: true
          }
        }),
        signal: abortControllerRef.current.signal
      })

      if (response.status === 503) {
        // Fallback a Web Speech API
        console.log('[TTS] Eleven Labs no disponible, usando Web Speech API como fallback')
        const responseData = await response.json()
        console.log('[TTS] Motivo del fallback:', responseData.message)
        
        setState({ isLoading: false, isPlaying: false, error: null })
        
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text.trim())
          utterance.lang = 'es-ES'
          utterance.rate = 0.9
          utterance.pitch = 1.0
          utterance.volume = 0.8
          
          utterance.onstart = () => {
            setState(prev => ({ ...prev, isPlaying: true }))
            onAudioStart?.()
          }
          
          utterance.onend = () => {
            setState(prev => ({ ...prev, isPlaying: false }))
            handleAudioEnd()
          }
          
          utterance.onerror = () => {
            setState(prev => ({ ...prev, isPlaying: false, error: 'Error en Web Speech API' }))
            handleAudioError()
          }
          
          window.speechSynthesis.speak(utterance)
          return
        } else {
          throw new Error('Web Speech API no disponible en este navegador')
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error en síntesis de voz')
      }

      // Crear blob de audio (solo si Eleven Labs funciona)
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Crear elemento de audio
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      // Configurar eventos
      audio.addEventListener('ended', handleAudioEnd)
      audio.addEventListener('error', handleAudioError)

      setState({ isLoading: false, isPlaying: false, error: null })

      if (autoPlay) {
        setState(prev => ({ ...prev, isPlaying: true }))
        onAudioStart?.()
        await audio.play()
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Solicitud cancelada, no es un error
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en TTS'
      setState({ isLoading: false, isPlaying: false, error: errorMessage })
      onError?.(errorMessage)
    }
  }, [voice_id, autoPlay, onAudioStart, onError, cleanup, handleAudioEnd, handleAudioError])

  // Pausar/reanudar reproducción
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return

    if (state.isPlaying) {
      audioRef.current.pause()
      setState(prev => ({ ...prev, isPlaying: false }))
    } else {
      audioRef.current.play()
      setState(prev => ({ ...prev, isPlaying: true }))
      onAudioStart?.()
    }
  }, [state.isPlaying, onAudioStart])

  // Detener reproducción
  const stop = useCallback(() => {
    // Detener Web Speech API si está activo
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    
    cleanup()
    setState({ isLoading: false, isPlaying: false, error: null })
  }, [cleanup])

  return {
    speak,
    stop,
    togglePlayback,
    isLoading: state.isLoading,
    isPlaying: state.isPlaying,
    error: state.error,
    canPlay: !!audioRef.current && !state.isLoading
  }
}