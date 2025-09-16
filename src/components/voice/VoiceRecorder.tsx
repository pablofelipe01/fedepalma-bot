/**
 * Componente VoiceRecorder con integración STT
 * Sistema completo de grabación y transcripción en tiempo real
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useAudioCapture } from '@/hooks/useAudioCapture'
import { useTTS } from '@/hooks/useTTS'

interface VoiceRecorderProps {
  onTranscription: (transcript: string, confidence: number) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  conversationMode?: boolean // Nuevo: modo conversación continua
}

export default function VoiceRecorder({
  onTranscription,
  onError,
  className = '',
  disabled = false,
  conversationMode = false,
}: VoiceRecorderProps) {
  // Estados de transcripción
  const [lastTranscription, setLastTranscription] = useState('')
  const [sttError, setSttError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  
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

  // Estados para conversación continua
  const [isConversationActive, setIsConversationActive] = useState(false)
  const [isWaitingForUser, setIsWaitingForUser] = useState(false)
  const [isButtonLocked, setIsButtonLocked] = useState(false)

  // Referencia mutable para generateChatResponse
  const generateChatResponseRef = useRef<((userMessage: string) => Promise<void>) | null>(null)

  /**
   * Procesar audio para transcripción (versión simplificada)
   */
  const processAudioSimple = useCallback(async (audioBlob: Blob) => {
    console.log(`[VoiceRecorder] Procesando audio: ${audioBlob.size} bytes`);
    
    if (!conversationMode) return;
    
    try {
      // Usar transcripción real de Deepgram via API
      console.log('[VoiceRecorder] Iniciando transcripción con Deepgram...');
      
      // Convertir audioBlob a base64 para la API
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          format: 'webm',
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.transcript) {
        const transcript = result.transcript.trim();
        console.log(`[VoiceRecorder] Transcripción exitosa: "${transcript}"`);
        onTranscription(transcript, result.confidence || 0.9);
        
        // Generar respuesta del bot usando la función que existe
        console.log('[VoiceRecorder] Generando respuesta del bot...');
        if (generateChatResponseRef.current) {
          await generateChatResponseRef.current(transcript);
        } else {
          console.warn('[VoiceRecorder] generateChatResponseRef no está disponible aún');
        }
      } else {
        console.log('[VoiceRecorder] Transcripción vacía o fallida:', result);
      }
    } catch (error) {
      console.error('[VoiceRecorder] Error en processAudioSimple:', error);
    }
  }, [conversationMode, onTranscription])

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
    vadThreshold: 0.01, // Threshold bajo, no importa mucho en modo manual
    enableVAD: false, // Deshabilitamos VAD automático
    vadSilenceDuration: 1000,
    continuousMode: false, // Modo manual
    onSilenceDetected: undefined, // No usar callback automático
    onVoiceStart: undefined,
    onVoiceEnd: undefined
  })

  // Hook de síntesis de voz (TTS)
  const {
    speak,
    stop: stopTTS,
    isLoading: isSynthesizing,
    isPlaying: isSpeaking,
    error: ttsError
  } = useTTS({
    autoPlay: true,
    onAudioStart: () => {
      console.log('[VoiceRecorder] TTS iniciado')
      setIsWaitingForUser(false) // No esperar al usuario mientras habla el bot
    },
    onAudioEnd: () => {
      console.log('[VoiceRecorder] TTS finalizado')
      // En modo conversación, reanudar escucha automáticamente
      if (conversationMode && isConversationActive) {
        setTimeout(() => resumeListening(), 500) // Pequeña pausa antes de reanudar
      }
    },
    onError: (error) => {
      console.error('[VoiceRecorder] Error TTS:', error)
      // Si es un error de permisos, es normal - usamos fallback
      if (!error.includes('Web Speech API')) {
        console.log('[VoiceRecorder] Usando Web Speech API como alternativa')
      }
      // También reanudar escucha si hay error de TTS
      if (conversationMode && isConversationActive) {
        setTimeout(() => resumeListening(), 500)
      }
    }
  })

  // Derivar estados del state
  const isRecording = state === 'recording'
  const recordingDuration = 0 // TODO: Implementar contador de duración

  /**
   * Generar respuesta usando chat completion
   */
  const generateChatResponse = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return

    try {
      setIsGeneratingResponse(true)
      setChatError(null)
      console.log(`[VoiceRecorder] Generando respuesta para: "${userMessage.substring(0, 50)}..."`)

      // Buscar contexto relevante con timeout rápido
      const searchPromise = fetch('/api/search/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          limit: 2, // Reducir de 3 a 2 para mayor velocidad
          threshold: 0.3 // Umbral más alto para resultados más precisos y rápidos
        })
      })

      // Timeout de 3 segundos para búsqueda
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 3000)
      )

      let context = ''
      try {
        const searchResponse = await Promise.race([searchPromise, timeoutPromise]) as Response
        
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
      } catch (searchError) {
        console.log(`[VoiceRecorder] Búsqueda falló o timeout, continuando sin contexto:`, searchError)
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
          conversationHistory: conversationHistory.slice(-4) // Solo últimas 2 interacciones (4 mensajes)
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
        
        // 🎵 Sintetizar respuesta a voz para conversación fluida
        try {
          console.log('[VoiceRecorder] Iniciando síntesis de voz...')
          console.log(`[VoiceRecorder] Texto a sintetizar: "${result.response.substring(0, 100)}..."`)
          await speak(result.response)
          console.log('[VoiceRecorder] ✅ Síntesis de voz completada')
        } catch (ttsError) {
          console.error('[VoiceRecorder] Error en TTS:', ttsError)
          // No bloquear el flujo si falla el TTS
        }
      } else {
        setChatError(result.error || 'No se pudo generar respuesta')
      }

    } catch (error) {
      console.error('Error generando respuesta de chat:', error)
      setChatError(`Error generando respuesta: ${error}`)
    } finally {
      setIsGeneratingResponse(false)
    }
  }, [conversationHistory, speak])

  // Asignar la función a la referencia mutable
  generateChatResponseRef.current = generateChatResponse

  /**
   * Detener grabación y procesar inmediatamente (modo manual rápido)
   */
  const handleStopAndProcess = async () => {
    try {
      console.log('[VoiceRecorder] Deteniendo y procesando audio...')
      const audioBlob = await stopRecording()
      
      if (audioBlob && audioBlob.size > 0) {
        console.log(`[VoiceRecorder] Audio capturado: ${audioBlob.size} bytes`)
        await processAudioSimple(audioBlob)
      } else {
        console.log('[VoiceRecorder] No se capturó audio')
      }
    } catch (error) {
      console.error('[VoiceRecorder] Error en handleStopAndProcess:', error)
      setSttError(`Error procesando audio: ${error}`)
    }
  }

  /**
   * Auto-reanudar escucha después de respuesta
   */
  const resumeListening = async () => {
    if (!isConversationActive) return
    
    try {
      console.log('[VoiceRecorder] Reanudando escucha automática...')
      setIsWaitingForUser(true)
      await startRecording()
    } catch (error) {
      console.error('[VoiceRecorder] Error reanudando escucha:', error)
      setIsConversationActive(false)
    }
  }

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
        // En modo conversación, marcar que no estamos esperando al usuario
        if (conversationMode && isConversationActive) {
          setIsWaitingForUser(false)
        }
        
        // Enviar audio a la API de transcripción
        await processAudioSimple(audioBlob)
      }
      
      setIsTranscribing(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setSttError(errorMessage)
      setIsTranscribing(false)
      onError?.(errorMessage)
    }
  }

  // Determinar estado del botón
  const getButtonState = () => {
    if (disabled || isButtonLocked) return 'disabled'
    if (conversationMode) {
      if (isConversationActive) {
        if (isSpeaking) return 'speaking'
        if (isGeneratingResponse) return 'thinking' 
        if (isWaitingForUser && isRecording) return 'listening'
        if (isWaitingForUser) return 'ready'
        return 'active'
      }
      return 'start-conversation'
    }
    // Modo original
    if (isRecording && isTranscribing) return 'recording'
    if (isTranscribing) return 'processing'
    return 'idle'
  }

  const buttonState = getButtonState()

  // Función de click del botón principal
  const handleMainButtonClick = async () => {
    console.log(`[VoiceRecorder] handleMainButtonClick - conversationMode: ${conversationMode}, isConversationActive: ${isConversationActive}, isButtonLocked: ${isButtonLocked}`);
    
    // Protección contra doble clic
    if (isButtonLocked) {
      console.log(`[VoiceRecorder] Botón bloqueado, ignorando clic`);
      return;
    }
    
    setIsButtonLocked(true);
    
    try {
      if (conversationMode) {
        // Nuevo: Modo manual rápido
        if (isRecording) {
          console.log(`[VoiceRecorder] Deteniendo grabación y procesando...`);
          await handleStopAndProcess()
        } else {
          console.log(`[VoiceRecorder] Iniciando grabación manual...`);
          await handleStartRecording()
        }
      } else {
        // Modo original
        if (isRecording) {
          await handleStopRecording()
        } else {
          await handleStartRecording()
        }
      }
    } finally {
      // Desbloquear después de un breve delay
      setTimeout(() => setIsButtonLocked(false), 500);
    }
  }
  const hasError = audioError || sttError || chatError

  return (
    <div className={`voice-recorder ${className}`}>
      {/* Botón principal de grabación */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleMainButtonClick}
          disabled={disabled}
          className={`
            relative w-20 h-20 rounded-full border-4 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50
            ${buttonState === 'disabled' 
              ? 'bg-gray-300 border-gray-400 cursor-not-allowed' 
              : buttonState === 'listening' || buttonState === 'recording'
              ? 'bg-red-500 border-red-600 hover:bg-red-600 focus:ring-red-200 animate-pulse'
              : buttonState === 'thinking' || buttonState === 'processing'
              ? 'bg-yellow-500 border-yellow-600 focus:ring-yellow-200'
              : buttonState === 'speaking'
              ? 'bg-green-500 border-green-600 focus:ring-green-200 animate-pulse'
              : buttonState === 'start-conversation'
              ? 'bg-purple-500 border-purple-600 hover:bg-purple-600 focus:ring-purple-200'
              : buttonState === 'active' || buttonState === 'ready'
              ? 'bg-blue-500 border-blue-600 hover:bg-blue-600 focus:ring-blue-200'
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
              : buttonState === 'start-conversation'
              ? '🎯 Iniciar conversación continua'
              : buttonState === 'listening'
              ? '🎤 Escuchando... Habla ahora'
              : buttonState === 'thinking'
              ? '🤔 Pensando respuesta...'
              : buttonState === 'speaking'
              ? '🗣️ Respondiendo...'
              : buttonState === 'ready'
              ? '✅ Listo para escuchar'
              : buttonState === 'active'
              ? '💬 Conversación activa'
              : buttonState === 'recording'
              ? 'Grabando...'
              : buttonState === 'processing'
              ? 'Procesando...'
              : 'Presiona para hablar'
            }
          </p>
          
          {conversationMode && isConversationActive && (
            <p className="text-xs text-purple-600 mt-1">
              Modo conversación • Presiona para detener
            </p>
          )}
          
          {(isRecording || (conversationMode && isWaitingForUser)) && (
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
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-blue-800">Respuesta del Grupo Guaicaramo:</h4>
            
            {/* Indicadores TTS */}
            <div className="flex items-center space-x-2">
              {isSynthesizing && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                  <span className="text-xs text-purple-600">Sintetizando...</span>
                </div>
              )}
              
              {isSpeaking && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  <span className="text-xs text-green-600">Reproduciendo</span>
                </div>
              )}
              
              {ttsError && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  <span className="text-xs text-red-600">Error TTS</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-blue-700">{lastResponse}</p>
          
          {/* Controles TTS */}
          <div className="mt-2 flex items-center space-x-2">
            <button
              onClick={stopTTS}
              disabled={!isSpeaking && !isSynthesizing}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔇 Detener
            </button>
            
            <button
              onClick={() => speak(lastResponse)}
              disabled={isSynthesizing || isSpeaking}
              className="px-2 py-1 text-xs bg-purple-200 text-purple-700 rounded hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔊 Repetir
            </button>
          </div>
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