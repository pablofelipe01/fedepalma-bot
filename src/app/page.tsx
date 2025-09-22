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
    console.log(`🎤 Botón micrófono presionado. speechSupported: ${speechSupported}, recognitionRef: ${!!recognitionRef.current}`)
    
    // Try Web Speech API first (solo Chrome/Edge desktop)
    if (recognitionRef.current && speechSupported) {
      console.log('🎤 Usando Web Speech API')
      if (isListening) {
        recognitionRef.current.stop()
        setIsListening(false)
      } else {
        try {
          setIsListening(true)
          recognitionRef.current.start()
        } catch (error) {
          console.error('❌ Error starting speech recognition:', error)
          setIsListening(false)
          // Fallback to audio recording
          console.log('🔄 Fallback a MediaRecorder')
          startAudioRecording()
        }
      }
    } else {
      // Fallback to audio recording for browsers without Speech API
      console.log('🎤 Usando MediaRecorder + Deepgram')
      if (isRecording) {
        console.log('🛑 Deteniendo grabación')
        stopAudioRecording()
      } else {
        console.log('🔴 Iniciando grabación')
        startAudioRecording()
      }
    }
  }

  const startAudioRecording = async () => {
    console.log('🎤 === INICIANDO GRABACIÓN DE AUDIO ===')
    console.log('📱 User Agent:', navigator.userAgent)
    console.log('🌐 Platform:', navigator.platform)
    console.log('📐 Window size:', window.innerWidth, 'x', window.innerHeight)
    console.log('🎥 MediaDevices disponible:', !!navigator.mediaDevices)
    console.log('🎤 getUserMedia disponible:', !!navigator.mediaDevices?.getUserMedia)
    
    try {
      console.log('🎤 Iniciando grabación de audio...')
      
      // Verificar permisos primero en iOS
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          console.log('🔐 Estado de permisos de micrófono:', permission.state)
        } catch (permError) {
          console.log('⚠️ No se pudo verificar permisos:', permError)
        }
      }
      
      // iPhone necesita configuraciones específicas
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Configuraciones específicas para iOS
          sampleRate: 16000,
          channelCount: 1
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('✅ Stream de audio obtenido')
      
      // Verificar si MediaRecorder está disponible
      if (!window.MediaRecorder || !MediaRecorder.isTypeSupported('audio/webm')) {
        console.log('⚠️ MediaRecorder no soporta audio/webm, intentando audio/mp4')
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
          console.log('⚠️ Intentando con audio/wav')
        }
      }
      
      // Usar el mejor formato disponible para iPhone
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav'
      }
      
      console.log(`🎵 Usando formato: ${mimeType}`)
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log(`📊 Datos disponibles: ${event.data.size} bytes`)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('🛑 Grabación detenida, procesando...')
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log(`📄 Blob creado: ${audioBlob.size} bytes, tipo: ${audioBlob.type}`)
        
        await transcribeAudio(audioBlob)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }

      mediaRecorder.onerror = (event) => {
        console.error('❌ Error en MediaRecorder:', event)
        alert('Error durante la grabación. Intenta de nuevo.')
        setIsRecording(false)
      }

      // Empezar grabación
      mediaRecorder.start(1000) // Recopilar datos cada segundo
      setIsRecording(true)
      console.log('🔴 Grabación iniciada')
      
    } catch (error) {
      console.error('❌ Error starting audio recording:', error)
      setIsRecording(false)
      
      // Mensaje más específico para iPhone
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Permisos de micrófono denegados. Ve a Configuración > Safari > Micrófono y permite el acceso.')
        } else if (error.name === 'NotFoundError') {
          alert('No se encontró micrófono. Verifica que tu dispositivo tenga micrófono.')
        } else {
          alert(`Error al acceder al micrófono: ${error.message}`)
        }
      } else {
        alert('Error al acceder al micrófono. Intenta de nuevo.')
      }
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log(`🎵 Enviando audio a transcripción: ${audioBlob.size} bytes, tipo: ${audioBlob.type}`)
      
      // Determinar el nombre del archivo basado en el tipo
      let fileName = 'recording.wav'
      if (audioBlob.type.includes('mp4')) {
        fileName = 'recording.mp4'
      } else if (audioBlob.type.includes('webm')) {
        fileName = 'recording.webm'
      }
      
      const formData = new FormData()
      formData.append('audio', audioBlob, fileName)

      console.log('📤 Enviando a /api/transcribe...')
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      console.log(`📡 Respuesta del servidor: ${response.status}`)
      
      if (response.ok) {
        const { transcript } = await response.json()
        console.log(`✅ Transcripción recibida: "${transcript}"`)
        
        if (transcript && transcript.trim()) {
          setInputText(transcript)
          
          // Auto-enviar mensaje cuando termine de hablar
          setTimeout(() => {
            if (transcript.trim()) {
              handleSendMessage(transcript.trim())
            }
          }, 500)
        } else {
          console.log('⚠️ Transcripción vacía')
          alert('No se pudo transcribir el audio. Intenta hablar más claro.')
        }
      } else {
        const errorText = await response.text()
        console.error(`❌ Error del servidor: ${response.status} - ${errorText}`)
        alert('Error en la transcripción. Intenta de nuevo.')
      }
    } catch (error) {
      console.error('❌ Error transcribing audio:', error)
      alert('Error en la transcripción. Verifica tu conexión a internet.')
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
      // Detectar iPhone/iOS específicamente - MÁS ESTRICTO
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPad en modo desktop
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
      const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent)
      
      // FORZAR MediaRecorder en iOS, Safari mobile, o dispositivos móviles
      if (isIOS || (isSafari && isMobile)) {
        console.log('📱 iOS/Safari mobile detectado - FORZANDO MediaRecorder + Deepgram')
        return false
      }
      
      // Solo permitir Web Speech API en Chrome/Edge desktop
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)
      const isEdge = /Edge/.test(navigator.userAgent)
      const isDesktop = window.innerWidth > 768
      
      if (!isDesktop || (!isChrome && !isEdge)) {
        console.log('📱 No es Chrome/Edge desktop - usando MediaRecorder')
        return false
      }
      
      // Check for different browser implementations
      const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window
      const hasSpeechRecognition = 'SpeechRecognition' in window
      
      const hasSupport = hasWebkitSpeechRecognition || hasSpeechRecognition
      console.log(`🎤 Web Speech API disponible y permitido: ${hasSupport}`)
      return hasSupport
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
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="h-screen max-w-full mx-auto px-0 sm:px-2 lg:px-4 py-0 sm:py-2 lg:py-4">
        <div className="grid lg:grid-cols-4 gap-0 sm:gap-4 lg:gap-8 h-full">
          {/* Chat Section */}
          <div className="lg:col-span-3 h-full">
            <div className="bg-white rounded-none sm:rounded-xl lg:rounded-2xl shadow-none sm:shadow-xl lg:shadow-2xl border-0 sm:border border-gray-200 overflow-hidden h-full">
              {/* Chat Messages */}
              <div className="h-[calc(100vh-160px)] sm:h-[500px] lg:h-[600px] overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 bg-white">
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
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow hover:shadow-lg transform hover:-translate-y-1"
                      >
                        ☘️ Guaicaramo
                      </button>
                      <button
                        onClick={() => setInputText('Cuéntame sobre DAO y sus servicios')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow hover:shadow-lg transform hover:-translate-y-1"
                      >
                        ☘️ DAO
                      </button>
                      <button
                        onClick={() => setInputText('¿Qué hace la Fundación Guaicaramo?')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow hover:shadow-lg transform hover:-translate-y-1"
                      >
                        ☘️ Fundación
                      </button>
                      <button
                        onClick={() => setInputText('Háblame de Sirius y su Filosofía')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow hover:shadow-lg transform hover:-translate-y-1"
                      >
                        ☘️ Sirius
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
              <div className="border-t border-gray-200 bg-white p-2 sm:p-4 lg:p-6 absolute bottom-0 left-0 right-0 sm:relative">
                {/* Primera línea: Input + Micrófono */}
                <div className="flex space-x-2 mb-2 sm:mb-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregunta sobre Grupo Guaicaramo..."
                    className="flex-1 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border border-gray-300 rounded-lg lg:rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white text-gray-800 placeholder-gray-400 text-sm sm:text-base lg:text-lg"
                    disabled={isLoading}
                  />
                  {/* Microphone Button - Universal Voice Input */}
                  <button
                    onClick={handleMicrophoneClick}
                    disabled={isLoading}
                    className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 font-bold shadow hover:shadow-lg disabled:cursor-not-allowed transform hover:-translate-y-1 disabled:transform-none text-sm sm:text-base ${
                      (isListening || isRecording)
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                  {/* Botón enviar - Solo en desktop */}
                  <button
                    onClick={handleButtonClick}
                    disabled={!inputText.trim() || isLoading}
                    className="hidden sm:flex bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 font-bold shadow hover:shadow-lg disabled:cursor-not-allowed transform hover:-translate-y-1 disabled:transform-none text-sm sm:text-base items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-2 sm:border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Enviar</span>
                        <span className="sm:hidden">�</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Segunda línea: Botones - Solo en mobile */}
                <div className="flex space-x-2 sm:hidden">
                  <button
                    onClick={handleButtonClick}
                    disabled={!inputText.trim() || isLoading}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg transition-all duration-300 font-bold shadow hover:shadow-lg disabled:cursor-not-allowed text-sm flex items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>📤 Enviar</>
                    )}
                  </button>
                  {messages.length > 0 && (
                    <button
                      onClick={handleResetChat}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-all duration-300 font-bold shadow hover:shadow-lg text-sm flex items-center justify-center"
                      title="Reiniciar chat"
                    >
                      🔄 Nuevo
                    </button>
                  )}
                </div>

                {/* Desktop: Botón restart en la misma línea que los otros */}
                {messages.length > 0 && (
                  <button
                    onClick={handleResetChat}
                    className="hidden sm:block absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-4 lg:px-6 py-1 sm:py-2.5 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 font-bold shadow hover:shadow-lg text-xs sm:text-sm lg:text-base"
                    title="Reiniciar chat"
                  >
                    <span className="hidden sm:inline">🔄 Nuevo</span>
                    <span className="sm:hidden">🔄</span>
                  </button>
                )}
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