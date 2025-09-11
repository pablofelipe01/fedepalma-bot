import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import { CONGRESS_INFO } from '@/lib/utils/constants';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center">
          <div className="mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-green-700 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg sm:text-xl">F25</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-900 mb-4">
            {CONGRESS_INFO.short_name}
          </h1>
          <h2 className="text-xl sm:text-2xl text-green-700 mb-4">
            Voice Bot Inteligente
          </h2>
          <p className="text-green-600 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            Sistema de voz interactivo para el {CONGRESS_INFO.name}.
            Consulta información sobre charlas, empresas expositoras, ponentes y todo lo relacionado 
            con el sector palmero colombiano.
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
              Sector Palmero {CONGRESS_INFO.year}
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
            <p className="font-medium">{CONGRESS_INFO.name}</p>
            <p className="text-sm">Organizado por {CONGRESS_INFO.organization}</p>
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