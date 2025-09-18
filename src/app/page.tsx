'use client'

import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'

// Declare speech recognition types
declare global {
  interface Window {
    SpeechRecognition: unknown
    webkitSpeechRecognition: unknown
  }
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Initialize speech recognition
  const handleMicrophoneClick = () => {
    // Try Web Speech API first (works in Chrome, Edge, Safari Desktop)
    if (recognitionRef.current && speechSupported) {
      if (isListening) {
        recognitionRef.current.stop()
        setIsListening(false)
      } else {
        try {
          setIsListening(true)
          recognitionRef.current.start()
        } catch (error) {
          console.error('Error starting speech recognition:', error)
          setIsListening(false)
          // Fallback to audio recording
          startAudioRecording()
        }
      }
    } else {
      // Fallback to audio recording for browsers without Speech API
      if (isRecording) {
        stopAudioRecording()
      } else {
        startAudioRecording()
      }
    }
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await transcribeAudio(audioBlob)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting audio recording:', error)
      alert('Error al acceder al micrófono. Verifica los permisos.')
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const { transcript } = await response.json()
        if (transcript) {
          setInputText(transcript)
          
          // Auto-enviar mensaje cuando termine de hablar
          setTimeout(() => {
            if (transcript.trim()) {
              handleSendMessage(transcript.trim())
            }
          }, 500)
        }
      } else {
        console.error('Transcription failed')
        alert('Error en la transcripción. Intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert('Error en la transcripción. Intenta de nuevo.')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleResetChat = () => {
    setMessages([])
    setInputText('')
  }

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date()
    }

    // Agregar el mensaje del usuario inmediatamente
    setMessages(prev => [...prev, userMessage])
    
    // Solo limpiar input si no se pasó texto como parámetro
    if (!messageText) {
      setInputText('')
    }
    setIsLoading(true)

    try {
      console.log(`🔍 Enviando consulta: ${userMessage.text}`)
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
        }),
      })

      console.log(`📡 Respuesta del servidor: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Error del servidor: ${errorText}`)
        throw new Error(`Error en la respuesta del servidor: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Respuesta recibida: ${data.response?.length || 0} caracteres`)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'No se pudo generar una respuesta',
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading])

  // Initialize speech recognition
  useEffect(() => {
    const checkSpeechSupport = () => {
      // Check for different browser implementations
      const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window
      const hasSpeechRecognition = 'SpeechRecognition' in window
      
      return hasWebkitSpeechRecognition || hasSpeechRecognition
    }

    if (typeof window !== 'undefined' && checkSpeechSupport()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current = new SpeechRecognition() as any
        
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false
          recognitionRef.current.interimResults = false
          recognitionRef.current.lang = 'es-ES'
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setInputText(transcript)
            setIsListening(false)
            
            // Auto-enviar mensaje cuando termine de hablar
            setTimeout(() => {
              if (transcript.trim()) {
                handleSendMessage(transcript.trim())
              }
            }, 500)
          }
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognitionRef.current.onerror = (error: any) => {
            console.warn('Speech recognition error:', error)
            setIsListening(false)
          }
          
          recognitionRef.current.onend = () => {
            setIsListening(false)
          }
          
          setSpeechSupported(true)
        }
      } catch (error) {
        console.warn('Speech recognition not supported:', error)
        setSpeechSupported(false)
      }
    } else {
      setSpeechSupported(false)
    }
  }, [handleSendMessage])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleButtonClick = () => {
    handleSendMessage()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF5D2] to-white">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
        <div className="grid lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Chat Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl border border-[#C6D870]/30 overflow-hidden">
              {/* Chat Messages */}
              <div className="h-[70vh] sm:h-[500px] lg:h-[600px] overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 bg-gradient-to-b from-white via-[#EFF5D2]/10 to-[#EFF5D2]/30">
                {messages.length === 0 && (
                  <div className="text-center py-6 sm:py-12 lg:py-20">
                    {/* Unified Logos del Grupo Guaicaramo */}
                    <div className="mb-6 sm:mb-8 lg:mb-10">
                      {/* Desktop: row of 4 logos */}
                      <div className="hidden lg:flex justify-center items-center space-x-8 mb-6">
                        <Image 
                          src="/logo-Guaicaramo.png" 
                          alt="Grupo Guaicaramo" 
                          width={100}
                          height={100}
                          className="h-24 w-auto"
                          priority
                        />
                        <Image 
                          src="/Logo-DAO.png" 
                          alt="DAO" 
                          width={100}
                          height={100}
                          className="h-24 w-auto"
                          priority
                        />
                        <Image 
                          src="/Logo-Fundacion.png" 
                          alt="Fundación" 
                          width={100}
                          height={100}
                          className="h-24 w-auto"
                          priority
                        />
                        <Image 
                          src="/Logo-Sirius.png" 
                          alt="Sirius" 
                          width={100}
                          height={100}
                          className="h-24 w-auto"
                          priority
                        />
                      </div>
                      {/* Mobile: 2x2 grid of 4 logos - optimized for mobile */}
                      <div className="lg:hidden grid grid-cols-2 gap-3 sm:gap-4 max-w-[280px] sm:max-w-xs mx-auto mb-4 sm:mb-6">
                        <div className="flex justify-center">
                          <Image 
                            src="/logo-Guaicaramo.png" 
                            alt="Grupo Guaicaramo" 
                            width={70}
                            height={70}
                            className="h-16 sm:h-20 w-auto"
                            priority
                          />
                        </div>
                        <div className="flex justify-center">
                          <Image 
                            src="/Logo-DAO.png" 
                            alt="DAO" 
                            width={60}
                            height={60}
                            className="h-14 sm:h-20 w-auto"
                            priority
                          />
                        </div>
                        <div className="flex justify-center">
                          <Image 
                            src="/Logo-Fundacion.png" 
                            alt="Fundación" 
                            width={60}
                            height={60}
                            className="h-14 sm:h-20 w-auto"
                            priority
                          />
                        </div>
                        <div className="flex justify-center">
                          <Image 
                            src="/Logo-Sirius.png" 
                            alt="Sirius" 
                            width={60}
                            height={60}
                            className="h-14 sm:h-20 w-auto"
                            priority
                          />
                        </div>
                      </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#556B2F] mb-3 sm:mb-4 lg:mb-6 font-display px-2">
                      Asistente Grupo Guaicaramo
                    </h1>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#8FA31E] mb-4 sm:mb-6 lg:mb-8 px-2">
                      ¡Bienvenido a nuestro ecosistema empresarial!
                    </h2>
                    <p className="text-[#8FA31E] text-base sm:text-lg lg:text-xl max-w-lg mx-auto mb-6 sm:mb-8 lg:mb-10 leading-relaxed px-3 sm:px-4">
                      Pregunta sobre nuestras empresas DAO, Fundación, Sirius, tecnologías, sostenibilidad o cualquier tema del sector palmicultor.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 max-w-2xl mx-auto px-3 sm:px-4">
                      <button
                        onClick={() => setInputText('¿Qué es el Grupo Guaicaramo y cuáles son sus empresas?')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        ☘️ ¿Qué es Guaicaramo?
                      </button>
                      <button
                        onClick={() => setInputText('Cuéntame sobre DAO y sus servicios')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        ☘️ Servicios DAO
                      </button>
                      <button
                        onClick={() => setInputText('¿Qué hace la Fundación Guaicaramo?')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        ☘️ Fundación
                      </button>
                      <button
                        onClick={() => setInputText('Explícame sobre Sirius y sus tecnologías')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        ☘️ Sirius Tech
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} px-1`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[90%] lg:max-w-[85%] rounded-lg sm:rounded-xl lg:rounded-2xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 shadow-lg ${
                        message.isUser
                          ? 'bg-gradient-to-r from-[#8FA31E] to-[#556B2F] text-white'
                          : 'bg-white border-2 border-[#C6D870] text-[#556B2F]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base lg:text-lg">{message.text}</p>
                      <div className={`text-xs mt-1.5 sm:mt-2 lg:mt-3 ${
                        message.isUser ? 'text-[#C6D870]' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('es-CO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start px-1">
                    <div className="bg-white border-2 border-[#C6D870] rounded-lg sm:rounded-2xl px-3 sm:px-6 py-2.5 sm:py-4 shadow-lg">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex space-x-1 sm:space-x-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#8FA31E] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#C6D870] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#8FA31E] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        <span className="text-[#556B2F] font-medium text-sm sm:text-base">Escribiendo respuesta...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Mobile Optimized */}
              <div className="border-t-2 border-[#C6D870]/30 bg-gradient-to-r from-[#EFF5D2]/50 to-white p-2 sm:p-4 lg:p-6">
                <div className="flex space-x-1.5 sm:space-x-2 lg:space-x-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregunta sobre Grupo Guaicaramo..."
                    className="flex-1 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border-2 border-[#C6D870] rounded-lg lg:rounded-xl focus:outline-none focus:border-[#8FA31E] focus:ring-2 focus:ring-[#8FA31E]/20 transition-all duration-200 bg-white text-[#556B2F] placeholder-gray-400 text-sm sm:text-base lg:text-lg shadow-inner"
                    disabled={isLoading}
                  />
                  {/* Microphone Button - Universal Voice Input */}
                  <button
                    onClick={handleMicrophoneClick}
                    disabled={isLoading}
                    className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-1 disabled:transform-none text-sm sm:text-base ${
                      (isListening || isRecording)
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white'
                    }`}
                    title={
                      isListening 
                        ? "Escuchando... Click para parar" 
                        : isRecording 
                        ? "Grabando... Click para parar"
                        : "Click para hablar"
                    }
                  >
                    {(isListening || isRecording) ? '🔴' : '🎤'}
                  </button>
                  {messages.length > 0 && (
                    <button
                      onClick={handleResetChat}
                      className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-2 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-xs sm:text-sm lg:text-base"
                      title="Reiniciar chat"
                    >
                      <span className="hidden sm:inline">🔄 Nuevo</span>
                      <span className="sm:hidden">🔄</span>
                    </button>
                  )}
                  <button
                    onClick={handleButtonClick}
                    disabled={!inputText.trim() || isLoading}
                    className="bg-gradient-to-r from-[#8FA31E] to-[#556B2F] hover:from-[#556B2F] hover:to-[#8FA31E] disabled:bg-gray-300 text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-1 disabled:transform-none text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-2 sm:border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Enviar</span>
                        <span className="sm:hidden">📤</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Only visible on desktop */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <div className="bg-gradient-to-br from-[#8FA31E] to-[#556B2F] rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="text-2xl mr-3">📞</span>
                Contacto
              </h3>
              <div className="space-y-2 text-sm text-[#C6D870] break-words">
                <div className="break-all">📧 marketingsirius@siriusregenerative.com</div>
                <div>📱 +57 320 865 3324</div>
                <div>📍 Kl-7 Via Cabuyaro Barranca de Upía</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer removed for minimalist design */}
      </main>
    </div>
  )
}