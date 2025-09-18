'use client'

import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          history: messages.slice(-4).map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }))
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'No se pudo generar una respuesta',
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
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
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF5D2] to-white">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-4 lg:py-8">
        <div className="grid lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Chat Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl border border-[#C6D870]/30 overflow-hidden">
              {/* Chat Messages */}
              <div className="h-[500px] lg:h-[600px] overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 bg-gradient-to-b from-white via-[#EFF5D2]/10 to-[#EFF5D2]/30">
                {messages.length === 0 && (
                  <div className="text-center py-12 lg:py-20">
                    {/* Unified Logos del Grupo Guaicaramo */}
                    <div className="mb-8 lg:mb-10">
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
                      {/* Mobile: 2x2 grid of 4 logos */}
                      <div className="lg:hidden grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
                        <div className="flex justify-center">
                          <Image 
                            src="/logo-Guaicaramo.png" 
                            alt="Grupo Guaicaramo" 
                            width={80}
                            height={80}
                            className="h-20 w-auto"
                            priority
                          />
                        </div>
                        <div className="flex justify-center">
                          <Image 
                            src="/Logo-DAO.png" 
                            alt="DAO" 
                            width={80}
                            height={80}
                            className="h-20 w-auto"
                            priority
                          />
                        </div>
                        <div className="flex justify-center">
                          <Image 
                            src="/Logo-Fundacion.png" 
                            alt="Fundación" 
                            width={80}
                            height={80}
                            className="h-20 w-auto"
                            priority
                          />
                        </div>
                        <div className="flex justify-center">
                          <Image 
                            src="/Logo-Sirius.png" 
                            alt="Sirius" 
                            width={80}
                            height={80}
                            className="h-20 w-auto"
                            priority
                          />
                        </div>
                      </div>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-[#556B2F] mb-4 lg:mb-6 font-display">
                      Asistente Grupo Guaicaramo
                    </h1>
                    <h2 className="text-xl lg:text-2xl font-semibold text-[#8FA31E] mb-6 lg:mb-8">
                      ¡Bienvenido a nuestro ecosistema empresarial!
                    </h2>
                    <p className="text-[#8FA31E] text-lg lg:text-xl max-w-lg mx-auto mb-8 lg:mb-10 leading-relaxed px-4">
                      Pregunta sobre nuestras empresas DAO, Fundación, Sirius, tecnologías, sostenibilidad o cualquier tema del sector palmicultor.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 max-w-2xl mx-auto px-4">
                      <button
                        onClick={() => setInputText('¿Qué es el Grupo Guaicaramo y cuáles son sus empresas?')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-4 lg:px-6 py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        🏢 ¿Qué es Guaicaramo?
                      </button>
                      <button
                        onClick={() => setInputText('Cuéntame sobre DAO y sus servicios')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-4 lg:px-6 py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        🔧 Servicios DAO
                      </button>
                      <button
                        onClick={() => setInputText('¿Qué hace la Fundación Guaicaramo?')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-4 lg:px-6 py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        🌱 Fundación
                      </button>
                      <button
                        onClick={() => setInputText('Explícame sobre Sirius y sus tecnologías')}
                        className="bg-gradient-to-r from-[#C6D870] to-[#8FA31E] hover:from-[#8FA31E] hover:to-[#556B2F] text-[#556B2F] hover:text-white px-4 lg:px-6 py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        🚀 Sirius Tech
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] lg:max-w-[85%] rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-lg ${
                        message.isUser
                          ? 'bg-gradient-to-r from-[#8FA31E] to-[#556B2F] text-white'
                          : 'bg-white border-2 border-[#C6D870] text-[#556B2F]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-base lg:text-lg">{message.text}</p>
                      <div className={`text-xs lg:text-sm mt-2 lg:mt-3 ${
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
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-[#C6D870] rounded-2xl px-6 py-4 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-[#8FA31E] rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-[#C6D870] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-3 h-3 bg-[#8FA31E] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        <span className="text-[#556B2F] font-medium">Escribiendo respuesta...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t-2 border-[#C6D870]/30 bg-gradient-to-r from-[#EFF5D2]/50 to-white p-4 lg:p-6">
                <div className="flex space-x-2 lg:space-x-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregunta sobre Grupo Guaicaramo, DAO, Fundación, Sirius..."
                    className="flex-1 px-4 lg:px-6 py-3 lg:py-4 border-2 border-[#C6D870] rounded-lg lg:rounded-xl focus:outline-none focus:border-[#8FA31E] focus:ring-4 focus:ring-[#8FA31E]/20 transition-all duration-200 bg-white text-[#556B2F] placeholder-gray-400 text-base lg:text-lg shadow-inner"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="bg-gradient-to-r from-[#8FA31E] to-[#556B2F] hover:from-[#556B2F] hover:to-[#8FA31E] disabled:bg-gray-300 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-lg lg:rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-1 disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="w-5 lg:w-6 h-5 lg:h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Enviar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#C6D870]/30 p-6">
              <h3 className="text-xl font-bold text-[#556B2F] mb-4 flex items-center">
                <span className="text-2xl mr-3">🧠</span>
                IA Especializada
              </h3>
              <div className="space-y-3 text-sm text-[#8FA31E]">
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span>Conocimiento de Grupo Guaicaramo</span>
                </div>
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span>Base de datos actualizada</span>
                </div>
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span>Respuestas contextuales precisas</span>
                </div>
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span>Información técnica especializada</span>
                </div>
              </div>
            </div>

            {/* Empresas Info Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#C6D870]/30 p-6">
              <h3 className="text-xl font-bold text-[#556B2F] mb-4 flex items-center">
                <span className="text-2xl mr-3">�</span>
                Nuestras Empresas
              </h3>
              <div className="space-y-3 text-sm text-[#8FA31E]">
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span><b>Guaicaramo</b> - Agroindustria</span>
                </div>
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span>DAO - Desarrollo Agrícola</span>
                </div>
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span>Fundación Guaicaramo</span>
                </div>
                <div className="flex items-start">
                  <span className="text-[#C6D870] mr-2">•</span>
                  <span>Sirius - Tecnología</span>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-gradient-to-br from-[#8FA31E] to-[#556B2F] rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="text-2xl mr-3">📞</span>
                Contacto
              </h3>
              <div className="space-y-2 text-sm text-[#C6D870]">
                <div>📧 info@fedepalma.org</div>
                <div>🌐 www.fedepalma.org</div>
                <div>📱 +57 (1) 313-8600</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Info Cards */}
        <div className="lg:hidden mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-[#C6D870]/30 p-4">
            <h3 className="text-lg font-bold text-[#556B2F] mb-3 flex items-center">
              <span className="text-xl mr-2">🧠</span>
              IA Especializada
            </h3>
            <div className="space-y-2 text-sm text-[#8FA31E]">
              <div>• Conocimiento de Grupo Guaicaramo</div>
              <div>• Respuestas contextuales precisas</div>
              <div>• Información técnica especializada</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-[#C6D870]/30 p-4">
            <h3 className="text-lg font-bold text-[#556B2F] mb-3 flex items-center">
              <span className="text-xl mr-2">�</span>
              Nuestras Empresas
            </h3>
            <div className="space-y-2 text-sm text-[#8FA31E]">
              <div>• <b>Guaicaramo</b> - Agroindustria</div>
              <div>• DAO - Desarrollo Agrícola</div>
              <div>• Fundación Guaicaramo</div>
              <div>• Sirius - Tecnología</div>
            </div>
          </div>
        </div>

        {/* Footer removed for minimalist design */}
      </main>

      <PWAInstallPrompt />
    </div>
  )
}