'use client'

import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'
import VoiceRecorder from '@/components/voice/VoiceRecorder'
import { useState } from 'react'

export default function Home() {
  const [transcriptions, setTranscriptions] = useState<Array<{
    text: string
    confidence: number
    timestamp: Date
  }>>([])

  const handleTranscription = (transcript: string, confidence: number) => {
    setTranscriptions(prev => [...prev, {
      text: transcript,
      confidence,
      timestamp: new Date()
    }])
  }

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center">
          <div className="mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-green-700 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg sm:text-xl">G25</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-900 mb-4">
            Bot Inteligente Guaicaramo
          </h1>
          <h2 className="text-xl sm:text-2xl text-green-700 mb-4">
            Asistente de Voz del Sector Palmero
          </h2>
          <p className="text-green-600 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            Sistema de voz inteligente del Grupo Empresarial Guaicaramo.
            Consulta información sobre el sector palmero colombiano, empresas, tecnologías 
            y sostenibilidad en palmicultura.
          </p>
        </header>

        {/* Status Card */}
        <div className="mt-8 sm:mt-12 bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 mb-6">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium">En desarrollo</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Sistema en Construcción
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Estamos preparando el sistema de voz inteligente para el congreso.
              El bot estará disponible próximamente con tecnología de última generación.
            </p>
            
            {/* Características principales */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                <div className="text-4xl mb-3">🎤</div>
                <div className="text-green-700 font-semibold mb-2">Voz Natural</div>
                <p className="text-sm text-gray-600">
                  Conversación fluida en español colombiano con reconocimiento 
                  de términos técnicos del sector palmero
                </p>
              </div>
              <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                <div className="text-4xl mb-3">🧠</div>
                <div className="text-green-700 font-semibold mb-2">IA Avanzada</div>
                <p className="text-sm text-gray-600">
                  Búsqueda inteligente en la base de conocimientos del congreso
                  con respuestas precisas y contextuales
                </p>
              </div>
              <div className="p-6 bg-green-50 rounded-xl border border-green-100 sm:col-span-2 lg:col-span-1">
                <div className="text-4xl mb-3">📱</div>
                <div className="text-green-700 font-semibold mb-2">PWA Instalable</div>
                <p className="text-sm text-gray-600">
                  Instálalo como app nativa en tu dispositivo
                  para acceso rápido y offline
                </p>
              </div>
            </div>

            {/* Voice Bot Testing Section */}
            <div className="border-t border-gray-200 pt-8 mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                🧪 Pruebas del Sistema de Voz
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <p className="text-sm text-blue-700 mb-4">
                  Prueba el sistema de captura de audio y transcripción de voz.
                  Los chunks de audio se procesan en tiempo real con Deepgram STT.
                </p>
                
                <VoiceRecorder
                  onTranscription={handleTranscription}
                  onError={handleVoiceError}
                  className="mb-4"
                />

                {/* Historial de transcripciones */}
                {transcriptions.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-blue-800 mb-3">
                      Historial de Transcripciones:
                    </h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {transcriptions.slice(-5).reverse().map((t, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-gray-800 mb-1">&ldquo;{t.text}&rdquo;</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Confianza: {(t.confidence * 100).toFixed(1)}%</span>
                            <span>{t.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información del congreso */}
            <div className="border-t border-gray-200 pt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                ¿Qué podrás consultar?
              </h4>
              <div className="grid sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Agenda completa de conferencias
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Información de empresas expositoras
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Perfiles de ponentes destacados
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Detalles técnicos del sector
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Ubicaciones y horarios
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Innovaciones en palma de aceite
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tecnología */}
        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Tecnología de Vanguardia
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Speech-to-Text con Deepgram Nova-2</div>
              <div>• Text-to-Speech con ElevenLabs Flash</div>
              <div>• Búsqueda vectorial con OpenAI</div>
              <div>• Latencia objetivo &lt; 300ms</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Sector Palmero 2025
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
        <footer className="mt-12 pt-8 border-t border-green-200 text-center">
          <div className="text-green-600 space-y-2">
            <p className="font-medium">Bot Inteligente del Sector Palmero</p>
            <p className="text-sm">Desarrollado por Grupo Empresarial Guaicaramo</p>
            <p className="text-xs text-gray-500 mt-4">
              Powered by Next.js 15 • Vercel • Supabase
            </p>
          </div>
        </footer>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}