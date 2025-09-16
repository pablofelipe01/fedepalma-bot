/**
 * Componente VoiceRecorder con integración STT
 * Sistema completo de grabación y transcripción en tiempo real
 */

'use client'

import React, { useState } from 'react'
import { useAudioCapture } from '@/hooks/useAudioCapture'

interface VoiceRecorderProps {
  onTranscription: (transcript: string, confidence: number) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export default function VoiceRecorder({ 
  onTranscription,
  onError,
  className = '',
  disabled = false
}: VoiceRecorderProps) {
  const [lastTranscription, setLastTranscription] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [sttError, setSttError] = useState<string | null>(null)
  const [recordingStats, setRecordingStats] = useState({
    duration: 0,
    chunksProcessed: 0,
    bytesProcessed: 0
  })

  // Estados para chat completion
  const [lastResponse, setLastResponse] = useState('')
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>>([]);

  // Hook de captura de audio
  const {
    state,
    audioLevel,
    isVoiceDetected,
    error: audioError,
    startRecording,
    stopRecording,
    config
  } = useAudioCapture({
    vadThreshold: 0.01,
    enableVAD: true
  })

  // Derivar estados del state
  const isRecording = state === 'recording'
  const recordingDuration = 0 // TODO: Implementar contador de duración

  /**
   * Iniciar grabación y transcripción
   */
  const handleStartRecording = async () => {
    if (disabled) return

    try {
      setSttError(null)
      setLastTranscription('')
      setIsTranscribing(true)
      setRecordingStats({ duration: 0, chunksProcessed: 0, bytesProcessed: 0 })
      
      await startRecording()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setSttError(errorMessage)
      setIsTranscribing(false)
      onError?.(errorMessage)
    }
  }

  /**
   * Detener grabación y procesar transcripción
   */
  const handleStopRecording = async () => {
    try {
      const audioBlob = await stopRecording()
      
      if (audioBlob && isTranscribing) {
        // Enviar audio a la API de transcripción
        await processAudioForTranscription(audioBlob)
      }
      
      setIsTranscribing(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setSttError(errorMessage)
      setIsTranscribing(false)
      onError?.(errorMessage)
    }
  }

  /**
   * Procesar audio para transcripción
   */
  const processAudioForTranscription = async (audioBlob: Blob) => {
    try {
      // Convertir blob a base64
      const reader = new FileReader()
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          // Extraer solo la parte base64 (después de la coma)
          const base64 = result.split(',')[1]
          if (!base64) {
            reject(new Error('Error al convertir audio a base64'))
            return
          }
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(audioBlob)
      })

      // Actualizar estadísticas
      setRecordingStats(prev => ({
        ...prev,
        bytesProcessed: audioBlob.size,
        chunksProcessed: 1
      }))

      console.log(`[VoiceRecorder] Enviando audio a transcripción: ${audioBlob.size} bytes`)

      // Enviar a API
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          format: 'webm',
          language: 'es-419'
        })
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('[VoiceRecorder] Respuesta de transcripción:', result)

      if (result.success && result.transcript) {
        setLastTranscription(result.transcript)
        onTranscription(result.transcript, result.confidence || 0)
        console.log(`[VoiceRecorder] Transcripción exitosa: "${result.transcript}" (${(result.confidence * 100).toFixed(1)}%)`)
        
        // Generar respuesta automáticamente después de transcripción exitosa
        await generateChatResponse(result.transcript)
      } else {
        setSttError(result.error || 'No se pudo transcribir el audio')
      }

    } catch (error) {
      console.error('Error procesando audio para transcripción:', error)
      setSttError(`Error STT: ${error}`)
    }
  }

  /**
   * Generar respuesta usando chat completion
   */
  const generateChatResponse = async (userMessage: string) => {
    if (!userMessage.trim()) return

    try {
      setIsGeneratingResponse(true)
      setChatError(null)
      console.log(`[VoiceRecorder] Generando respuesta para: "${userMessage.substring(0, 50)}..."`)

      // Buscar contexto relevante primero
      const searchResponse = await fetch('/api/search/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          limit: 3,
          threshold: 0.2 // Umbral bajo para mejor recall con documentos reales
        })
      })

      let context = ''
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json()
        if (searchResult.success && searchResult.results?.length > 0) {
          context = searchResult.results
            .map((doc: { title: string; content: string }) => `${doc.title}: ${doc.content}`)
            .join('\n\n')
          console.log(`[VoiceRecorder] Contexto encontrado: ${searchResult.results.length} documentos`)
          console.log(`[VoiceRecorder] Contexto: ${context.substring(0, 200)}...`)
        } else {
          console.log(`[VoiceRecorder] No se encontró contexto relevante`)
        }
      } else {
        console.log(`[VoiceRecorder] Error en búsqueda: ${searchResponse.status}`)
      }

      // Generar respuesta con contexto
      const chatResponse = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: context,
          conversationHistory: conversationHistory
        })
      })

      if (!chatResponse.ok) {
        throw new Error(`HTTP error! status: ${chatResponse.status}`)
      }

      const result = await chatResponse.json()
      
      console.log('[VoiceRecorder] Respuesta de chat:', result)

      if (result.success && result.response) {
        setLastResponse(result.response)
        
        // Actualizar historial de conversación
        const timestamp = Date.now()
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: userMessage, timestamp },
          { role: 'assistant', content: result.response, timestamp: timestamp + 1 }
        ])

        console.log(`[VoiceRecorder] Respuesta generada exitosamente: "${result.response.substring(0, 100)}..."`)
      } else {
        setChatError(result.error || 'No se pudo generar respuesta')
      }

    } catch (error) {
      console.error('Error generando respuesta de chat:', error)
      setChatError(`Error generando respuesta: ${error}`)
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  // Determinar estado del botón
  const getButtonState = () => {
    if (disabled) return 'disabled'
    if (isRecording && isTranscribing) return 'recording'
    if (isTranscribing) return 'processing'
    return 'idle'
  }

  const buttonState = getButtonState()
  const hasError = audioError || sttError || chatError

  return (
    <div className={`voice-recorder ${className}`}>
      {/* Botón principal de grabación */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={disabled}
          className={`
            relative w-20 h-20 rounded-full border-4 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50
            ${buttonState === 'disabled' 
              ? 'bg-gray-300 border-gray-400 cursor-not-allowed' 
              : buttonState === 'recording'
              ? 'bg-red-500 border-red-600 hover:bg-red-600 focus:ring-red-200 animate-pulse'
              : buttonState === 'processing'
              ? 'bg-yellow-500 border-yellow-600 focus:ring-yellow-200'
              : 'bg-blue-500 border-blue-600 hover:bg-blue-600 focus:ring-blue-200'
            }
          `}
        >
          {/* Icono del micrófono */}
          <div className="flex items-center justify-center w-full h-full">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Indicador de nivel de audio */}
          {isRecording && (
            <div 
              className="absolute inset-0 rounded-full border-4 border-white opacity-30 animate-ping"
              style={{
                transform: `scale(${1 + audioLevel * 0.5})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          )}
        </button>

        {/* Estado del botón */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {buttonState === 'disabled' 
              ? 'Deshabilitado'
              : buttonState === 'recording'
              ? 'Grabando...'
              : buttonState === 'processing'
              ? 'Procesando...'
              : 'Presiona para hablar'
            }
          </p>
          
          {isRecording && (
            <p className="text-xs text-gray-500 mt-1">
              {recordingDuration.toFixed(1)}s
            </p>
          )}
        </div>
      </div>

      {/* Visualización de audio */}
      {isRecording && (
        <div className="mt-4 space-y-2">
          {/* Barra de nivel de audio */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 w-12">Audio:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">
              {(audioLevel * 100).toFixed(0)}%
            </span>
          </div>

          {/* Indicador de detección de voz */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 w-12">VAD:</span>
            <div className={`
              w-3 h-3 rounded-full transition-colors duration-200
              ${isVoiceDetected ? 'bg-green-500' : 'bg-gray-300'}
            `} />
            <span className="text-xs text-gray-500">
              {isVoiceDetected ? 'Voz detectada' : 'Silencio'}
            </span>
          </div>
        </div>
      )}

      {/* Estadísticas de grabación */}
      {isTranscribing && recordingStats.chunksProcessed > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas STT</h4>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div>
              <span className="block font-medium">Chunks:</span>
              <span>{recordingStats.chunksProcessed}</span>
            </div>
            <div>
              <span className="block font-medium">Datos:</span>
              <span>{(recordingStats.bytesProcessed / 1024).toFixed(1)}KB</span>
            </div>
            <div>
              <span className="block font-medium">Duración:</span>
              <span>{recordingDuration.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Transcripción actual */}
      {lastTranscription && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-1">Transcripción:</h4>
          <p className="text-sm text-green-700 italic">&ldquo;{lastTranscription}&rdquo;</p>
        </div>
      )}

      {/* Indicador de generación de respuesta */}
      {isGeneratingResponse && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Generando respuesta...</span>
          </div>
        </div>
      )}

      {/* Respuesta del chat */}
      {lastResponse && !isGeneratingResponse && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Respuesta del Grupo Guaicaramo:</h4>
          <p className="text-sm text-blue-700">{lastResponse}</p>
        </div>
      )}

      {/* Configuración de audio */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Configuración</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <div>
            <span className="font-medium">Sample Rate:</span> {config.sampleRate}Hz
          </div>
          <div>
            <span className="font-medium">Channels:</span> {config.channels}
          </div>
          <div>
            <span className="font-medium">Chunk Duration:</span> {config.chunkDuration}ms
          </div>
          <div>
            <span className="font-medium">VAD:</span> {config.vadThreshold}
          </div>
        </div>
      </div>

      {/* Errores */}
      {hasError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-1">Error:</h4>
          <p className="text-sm text-red-700">
            {audioError || sttError || chatError}
          </p>
        </div>
      )}
    </div>
  )
}