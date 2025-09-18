'use client'

import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'
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
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Lo siento, no pude procesar tu consulta.',
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-700 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">G25</span>
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            Bot Inteligente Guaicaramo
          </h1>
          <p className="text-green-600 max-w-2xl mx-auto text-sm leading-relaxed">
            Asistente especializado del sector palmero colombiano. 
            Consulta información sobre empresas, tecnologías y sostenibilidad en palmicultura.
          </p>
        </header>

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg font-medium mb-2">¡Hola! Soy tu asistente del sector palmero</p>
                <p className="text-sm">Pregúntame sobre el Grupo Guaicaramo, tecnologías de palma, sostenibilidad o cualquier tema relacionado</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => setInputText('¿Qué es el Grupo Guaicaramo?')}
                    className="p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-sm text-green-800 transition-colors"
                  >
                    ¿Qué es el Grupo Guaicaramo?
                  </button>
                  <button
                    onClick={() => setInputText('Cuéntame sobre el aceite alto oleico')}
                    className="p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-sm text-green-800 transition-colors"
                  >
                    Cuéntame sobre el aceite alto oleico
                  </button>
                  <button
                    onClick={() => setInputText('¿Qué servicios ofrece DAO?')}
                    className="p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-sm text-green-800 transition-colors"
                  >
                    ¿Qué servicios ofrece DAO?
                  </button>
                  <button
                    onClick={() => setInputText('Explícame sobre sostenibilidad en palma')}
                    className="p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-sm text-green-800 transition-colors"
                  >
                    Explícame sobre sostenibilidad
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.isUser
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-2 ${
                        message.isUser ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">Escribiendo...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta sobre el sector palmero..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Enviar'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🧠 Inteligencia Artificial
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Búsqueda vectorial con OpenAI</div>
              <div>• Base de conocimientos especializada</div>
              <div>• Respuestas contextuales precisas</div>
              <div>• Información actualizada del sector</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🌴 Sector Palmero 2025
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Aceite alto oleico (HOPO)</div>
              <div>• Variedades OxG y Guaicaramo</div>
              <div>• Sostenibilidad y RSPO</div>
              <div>• Innovación tecnológica</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-green-200 text-center">
          <div className="text-green-600 space-y-2">
            <p className="font-medium">Bot Inteligente del Sector Palmero</p>
            <p className="text-sm">Desarrollado por Grupo Empresarial Guaicaramo</p>
          </div>
        </footer>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}