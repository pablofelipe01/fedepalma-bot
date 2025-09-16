// ===== TIPOS DE AUDIO Y VOICE =====

export interface AudioChunk {
  data: Float32Array | number[];
  timestamp: number;
  sampleRate: number;
  channels: number;
}

export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  chunkDuration: number; // in milliseconds
  enableVAD: boolean; // Voice Activity Detection
  vadThreshold: number;
  vadSilenceDuration: number; // milliseconds of silence before stopping
}

export interface AudioFormat {
  mimeType: string;
  extension: string;
  quality: 'low' | 'medium' | 'high' | 'highest';
  compression: 'none' | 'lossy' | 'lossless';
  browserSupport: string[];
}

export type AudioCaptureState = 'idle' | 'initializing' | 'recording' | 'processing' | 'error';

export interface AudioCaptureHook {
  // State
  state: AudioCaptureState;
  error: string | null;
  audioLevel: number;
  isVoiceDetected: boolean;
  
  // Actions
  startRecording: (onAudioChunk?: (chunk: AudioChunk) => void) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  cleanup: () => void;
  checkMicrophoneAvailability: () => Promise<boolean>;
  
  // Config
  config: AudioCaptureConfig;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error?: string;
}

export interface AudioConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  sampleRate: number;
  channelCount: number;
  latency: number;
  sampleSize: number;
}

// ===== TIPOS DE APIs EXTERNAS =====

// Deepgram STT
export interface DeepgramResponse {
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words?: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
      }>;
    }>;
  };
  is_final: boolean;
  duration?: number;
  start?: number;
}

export interface DeepgramConfig {
  model: string;
  language: string;
  punctuate: boolean;
  interim_results: boolean;
  endpointing: number;
  vad_events: boolean;
  smart_format: boolean;
  keywords: string[];
}

// Eleven Labs TTS
export interface ElevenLabsConfig {
  model_id: string;
  voice_id: string;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  output_format: string;
  stream_chunk_size: number;
  optimize_streaming_latency: number;
}

export interface ElevenLabsResponse {
  audio: ArrayBuffer;
  normalizedAlignment?: {
    chars: string[];
    charStartTimesMs: number[];
    charDurationsMs: number[];
  };
}

// OpenAI Embeddings
export interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// ===== TIPOS DE DATOS DEL CONGRESO =====

export interface CongressDocument {
  id: string;
  type: 'agenda' | 'company' | 'speaker' | 'venue';
  source_file: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CongressEmbedding {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VectorSearchResult {
  document_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

// Tipos específicos para cada JSON del congreso
export interface AgendaItem {
  title: string;
  speaker?: string;
  time?: string;
  description?: string;
  location?: string;
  type?: 'conference' | 'commercial' | 'break';
}

export interface CompanyInfo {
  name: string;
  description?: string;
  products?: string[];
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  booth?: string;
}

export interface SpeakerInfo {
  name: string;
  title?: string;
  organization?: string;
  bio?: string;
  photo?: string;
  topics?: string[];
}

// ===== TIPOS DE SESIONES =====

export interface VoiceSession {
  id: string;
  qr_token: string;
  user_agent?: string;
  started_at: string;
  ended_at?: string;
  conversation_history: ConversationEntry[];
  total_queries: number;
  metadata: Record<string, unknown>;
}

export interface ConversationEntry {
  timestamp: string;
  user_query: string;
  bot_response: string;
  sources_used: VectorSearchResult[];
  latency_breakdown: LatencyBreakdown;
}

export interface LatencyBreakdown {
  stt: number; // Speech to text latency
  embedding: number; // Embedding generation latency
  search: number; // Vector search latency
  formatting: number; // Response formatting latency
  tts: number; // Text to speech latency
  total: number; // Total pipeline latency
}

// ===== TIPOS DE WebSocket =====

export interface WebSocketMessage {
  type: 'audio_chunk' | 'ping' | 'transcription' | 'response' | 'status' | 'error';
  data?: ArrayBuffer | string | Record<string, unknown>;
  timestamp: number;
  sequence?: number;
}

export interface ClientMessage extends WebSocketMessage {
  type: 'audio_chunk' | 'ping';
  data?: ArrayBuffer;
}

export interface ServerMessage extends WebSocketMessage {
  type: 'transcription' | 'response' | 'status' | 'error';
  transcript?: string;
  response?: string;
  audio?: ArrayBuffer;
  sources?: VectorSearchResult[];
  latency?: LatencyBreakdown;
  state?: 'listening' | 'processing' | 'speaking';
  error?: string;
}

// ===== TIPOS DE QR CODES =====

export interface QRToken {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
}

export interface QRGenerateRequest {
  count?: number;
  expires_in?: number; // seconds
  metadata?: Record<string, unknown>;
}

export interface QRValidateRequest {
  token: string;
}

// ===== TIPOS DE API RESPONSES =====

export interface VoiceProcessRequest {
  audio: ArrayBuffer;
  session_id: string;
  sequence: number;
}

export interface VoiceProcessResponse {
  transcript: string;
  response: string;
  audio: ArrayBuffer;
  sources: VectorSearchResult[];
  latency: LatencyBreakdown;
  conversation_entry_id: string;
}

export interface SessionCreateResponse {
  session_id: string;
  expires_at: string;
  websocket_url?: string;
}

export interface KnowledgeSearchRequest {
  query: string;
  max_results?: number;
  similarity_threshold?: number;
}

export interface KnowledgeSearchResponse {
  results: VectorSearchResult[];
  query_embedding?: number[];
  total_found: number;
  search_time_ms: number;
}

// ===== TIPOS DE ANALYTICS =====

export interface SessionAnalytics {
  id: string;
  session_id: string;
  event_type: 'query' | 'response' | 'error' | 'session_start' | 'session_end';
  query?: string;
  response?: string;
  latency_breakdown?: LatencyBreakdown;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PerformanceMetrics {
  avg_voice_to_voice_latency: number;
  avg_stt_latency: number;
  avg_search_latency: number;
  avg_tts_latency: number;
  success_rate: number;
  total_queries: number;
  active_sessions: number;
  error_rate: number;
}

// ===== TIPOS DE ERRORES =====

export interface VoiceBotError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  session_id?: string;
  user_query?: string;
}

export type ErrorCode =
  | 'AUDIO_PERMISSION_DENIED'
  | 'MICROPHONE_NOT_AVAILABLE'
  | 'STT_SERVICE_ERROR'
  | 'TTS_SERVICE_ERROR'
  | 'KNOWLEDGE_SEARCH_ERROR'
  | 'SESSION_EXPIRED'
  | 'INVALID_QR_TOKEN'
  | 'WEBSOCKET_CONNECTION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNKNOWN_ERROR';

// ===== UTILITY TYPES =====

export type AppState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export type DocumentType = 'agenda' | 'company' | 'speaker' | 'venue';

export type WebSocketEventType = 
  | 'audio_chunk' 
  | 'ping' 
  | 'transcription' 
  | 'response' 
  | 'status' 
  | 'error';