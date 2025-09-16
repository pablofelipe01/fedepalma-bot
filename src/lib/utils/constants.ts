// Configuraciones de audio WebRTC
export const AUDIO_CONFIG = {
  constraints: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000, // Optimizado para speech
      channelCount: 1, // Mono para eficiencia
      latency: 0.01, // 10ms target latency
      sampleSize: 16,
    },
  },
  worklet: {
    bufferSize: 4096, // Tamaño de buffer del AudioWorklet
    chunkSize: 1024, // Tamaño de chunks para streaming
  },
} as const;

// Configuración WebRTC
export const WEBRTC_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  bundlePolicy: 'max-bundle' as const,
  rtcpMuxPolicy: 'require' as const,
} as const;

// Configuración Deepgram STT
export const DEEPGRAM_CONFIG = {
  model: 'nova-2-general',
  language: 'es-419', // Español latinoamericano
  punctuate: true,
  interim_results: true,
  endpointing: 300, // 300ms silence detection
  vad_events: true,
  smart_format: true,
  keywords: [
    // Términos específicos del congreso con boost
    'Fedepalma:5',
    'palma de aceite:5',
    'Guaicaramo:5',
    'alto oleico:5',
    'Barranca de Upía:5',
    'HOPO:5',
    'OxG:5',
    'Cenipalma:5',
    'Del Llano:5',
    'Sirius:5',
    'Doña Pepa:5',
  ],
} as const;

// Configuración Eleven Labs TTS
export const ELEVENLABS_CONFIG = {
  model_id: 'eleven_flash_v2_5',
  voice_id: 'cjVigY5qzO86Huf0OWal', // Voz masculina profesional en español
  voice_settings: {
    stability: 0.75,
    similarity_boost: 0.85,
    style: 0.3,
    use_speaker_boost: true,
  },
  output_format: 'pcm_16000',
  stream_chunk_size: 1024,
  optimize_streaming_latency: 4, // Máxima optimización
} as const;

// Configuración OpenAI (solo embeddings)
export const OPENAI_CONFIG = {
  embedding_model: 'text-embedding-3-small',
  embedding_dimensions: 1536,
  max_tokens_per_chunk: 512,
  batch_size: 20, // Para procesamiento de embeddings en lotes
} as const;

// Targets de performance
export const PERFORMANCE_TARGETS = {
  voice_to_voice_latency: 300, // ms
  stt_latency: 100, // ms
  vector_search_latency: 50, // ms
  tts_first_byte: 75, // ms
  concurrent_sessions: 100,
  uptime: 99.9, // %
} as const;

// Configuración de sesiones
export const SESSION_CONFIG = {
  max_duration: 30 * 60 * 1000, // 30 minutos en ms
  cleanup_interval: 5 * 60 * 1000, // 5 minutos
  max_queries_per_session: 50,
  jwt_expiry: 5 * 60, // 5 minutos para QR tokens
} as const;

// Configuración de búsqueda vectorial
export const VECTOR_SEARCH_CONFIG = {
  similarity_threshold: 0.7,
  max_results: 5,
  hnsw_ef_search: 40, // Parámetro de búsqueda HNSW
} as const;

// URLs y endpoints
export const ENDPOINTS = {
  voice_process: '/api/voice/process',
  session_create: '/api/session/create',
  session_validate: '/api/session/validate',
  session_end: '/api/session/end',
  knowledge_search: '/api/knowledge/search',
  qr_generate: '/api/qr/generate',
  qr_validate: '/api/qr/validate',
} as const;

// Tipos de documentos del congreso
export const DOCUMENT_TYPES = {
  AGENDA: 'agenda',
  COMPANY: 'company',
  SPEAKER: 'speaker',
  VENUE: 'venue',
} as const;

// Estados de la aplicación
export const APP_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
} as const;

// Eventos de WebSocket
export const WEBSOCKET_EVENTS = {
  // Cliente → Servidor
  AUDIO_CHUNK: 'audio_chunk',
  PING: 'ping',
  
  // Servidor → Cliente
  TRANSCRIPTION: 'transcription',
  RESPONSE: 'response',
  STATUS: 'status',
  ERROR: 'error',
} as const;

// Configuración PWA
export const PWA_CONFIG = {
  theme_color: '#2D7A2D',
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait-primary',
} as const;

// Configuración del grupo empresarial
export const COMPANY_INFO = {
  name: 'Grupo Empresarial Guaicaramo',
  short_name: 'Guaicaramo',
  year: 2025,
  organization: 'Grupo Empresarial Guaicaramo',
  companies: ['Guaicaramo', 'Fundación Guaicaramo', 'Sirius Regenerative'],
} as const;