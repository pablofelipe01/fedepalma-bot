/**
 * Audio configuration for the Fedepalma 2025 Voice Bot
 * Optimized for Spanish (Latin American) voice processing with Deepgram
 */

import type { AudioCaptureConfig, AudioFormat } from '@/types/index';

// Optimal configuration for Deepgram Nova-2 Spanish
export const DEEPGRAM_AUDIO_CONFIG: AudioCaptureConfig = {
  sampleRate: 16000, // Deepgram recommended sample rate
  channels: 1, // Mono audio for better STT performance
  bitsPerSample: 16, // 16-bit PCM
  chunkDuration: 64, // 64ms chunks for low latency (<300ms target)
  enableVAD: true, // Voice Activity Detection
  vadThreshold: 0.02, // Adjusted for Spanish phonetics
  vadSilenceDuration: 1500, // 1.5s silence to stop (Spanish speaking patterns)
};

// High-quality configuration for better accuracy
export const HIGH_QUALITY_CONFIG: AudioCaptureConfig = {
  sampleRate: 48000, // High quality
  channels: 1,
  bitsPerSample: 24,
  chunkDuration: 100,
  enableVAD: true,
  vadThreshold: 0.015,
  vadSilenceDuration: 2000,
};

// Low-latency configuration for real-time interaction
export const LOW_LATENCY_CONFIG: AudioCaptureConfig = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  chunkDuration: 32, // 32ms for ultra-low latency
  enableVAD: true,
  vadThreshold: 0.025,
  vadSilenceDuration: 1000,
};

// Supported audio formats for different scenarios
export const AUDIO_FORMATS: Record<string, AudioFormat> = {
  // Deepgram preferred formats
  WEBM_OPUS: {
    mimeType: 'audio/webm;codecs=opus',
    extension: 'webm',
    quality: 'high',
    compression: 'lossy',
    browserSupport: ['chrome', 'firefox', 'edge'],
  },
  
  WEBM: {
    mimeType: 'audio/webm',
    extension: 'webm',
    quality: 'high',
    compression: 'lossy',
    browserSupport: ['chrome', 'firefox', 'edge'],
  },
  
  // Fallback formats
  MP4: {
    mimeType: 'audio/mp4',
    extension: 'mp4',
    quality: 'high',
    compression: 'lossy',
    browserSupport: ['chrome', 'safari', 'edge'],
  },
  
  WAV: {
    mimeType: 'audio/wav',
    extension: 'wav',
    quality: 'highest',
    compression: 'none',
    browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
  },
  
  OGG: {
    mimeType: 'audio/ogg;codecs=opus',
    extension: 'ogg',
    quality: 'high',
    compression: 'lossy',
    browserSupport: ['firefox', 'chrome'],
  },
};

// Deepgram-specific configuration
export const DEEPGRAM_CONFIG = {
  // Language and model configuration
  language: 'es-419', // Latin American Spanish
  model: 'nova-2', // Latest Deepgram model
  version: 'latest',
  
  // Audio processing features
  features: {
    punctuate: true, // Add punctuation
    profanity_filter: false, // Keep original content
    redact: false, // Don't redact PII
    diarize: false, // Single speaker expected
    ner: true, // Named Entity Recognition for palm industry terms
    sentiment: false, // Not needed for informational queries
    summarize: false, // Not needed for short queries
    detect_language: false, // We know it's Spanish
    paragraphs: false, // Short queries
    utterances: true, // Get confidence scores
    utt_split: 0.8, // Utterance split threshold
    dictation: false, // Conversational format
    measurements: false, // Not needed
  },
  
  // Keywords for the palm oil industry (boost recognition)
  keywords: [
    // General palm industry terms
    'fedepalma',
    'palma de aceite',
    'palmicultura',
    'palmero',
    'cultivadores',
    'congreso',
    
    // Technical terms
    'HOPO', // High Oleic Palm Oil
    'alto oleico',
    'variedades',
    'OxG', // Elaeis oleifera x guineensis
    'guaicaramo',
    'coari',
    'yanana',
    
    // Sustainability and certification
    'RSPO', // Roundtable on Sustainable Palm Oil
    'sostenibilidad',
    'certificación',
    'sostenible',
    'ambiental',
    
    // Industry organizations and companies
    'cenipalma',
    'corpoica',
    'agrosavia',
    'acepalma',
    'indupalma',
    'hacienda la cabaña',
    
    // Technical processes
    'extracción',
    'refinación',
    'beneficio',
    'plantación',
    'vivero',
    'siembra',
    'cosecha',
    
    // Products and applications
    'biodiesel',
    'oleoquímica',
    'margarina',
    'cosmética',
    'jabones',
    
    // Regions and locations
    'zona oriental',
    'zona central',
    'zona norte',
    'zona occidental',
    'magdalena medio',
    'cesar',
    'santander',
    'meta',
    'nariño',
  ],
  
  // Model configuration
  tier: 'nova-2',
  encoding: 'linear16',
  sample_rate: 16000,
  channels: 1,
  
  // Streaming configuration
  interim_results: true, // Get intermediate results
  endpointing: 300, // End utterance after 300ms silence
  vad_events: true, // Voice activity detection events
  
  // Response format
  smart_format: true, // Apply smart formatting
  search: [], // No search terms
  replace: [], // No word replacements
  
  // Confidence and alternatives
  alternatives: 1, // Only return top result
  confidence: true, // Include confidence scores
  
  // Timeout settings
  timeout: 30000, // 30 second timeout
};

// Audio constraints for different browser support levels
export const AUDIO_CONSTRAINTS = {
  // Optimal constraints for modern browsers
  OPTIMAL: {
    audio: {
      sampleRate: DEEPGRAM_AUDIO_CONFIG.sampleRate,
      channelCount: DEEPGRAM_AUDIO_CONFIG.channels,
      sampleSize: DEEPGRAM_AUDIO_CONFIG.bitsPerSample,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true,
      googTypingNoiseDetection: true,
    },
  },
  
  // Fallback constraints for older browsers
  BASIC: {
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
  
  // Minimal constraints for very old browsers
  MINIMAL: {
    audio: true,
  },
};

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Latency targets (in milliseconds)
  TARGET_LATENCY: 300, // Total voice-to-voice latency
  AUDIO_CAPTURE_LATENCY: 50, // Audio capture to processing
  STT_LATENCY: 150, // Speech-to-text processing
  RESPONSE_LATENCY: 100, // Response generation and TTS
  
  // Audio quality metrics
  MIN_SAMPLE_RATE: 8000, // Minimum acceptable sample rate
  MAX_SAMPLE_RATE: 48000, // Maximum sample rate
  MIN_AUDIO_LEVEL: 0.001, // Minimum audio level to consider
  MAX_AUDIO_LEVEL: 1.0, // Maximum audio level (before clipping)
  
  // Voice activity detection
  VAD_MIN_DURATION: 100, // Minimum voice duration (ms)
  VAD_MAX_SILENCE: 3000, // Maximum silence before stopping (ms)
  
  // Buffer management
  MAX_BUFFER_SIZE: 1024 * 1024, // 1MB max buffer size
  CHUNK_OVERLAP: 0.1, // 10% overlap between chunks
};

// Error handling configuration
export const ERROR_CONFIG = {
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2,
  
  // Timeout configuration
  PERMISSION_TIMEOUT: 10000, // 10 seconds to grant permissions
  INITIALIZATION_TIMEOUT: 5000, // 5 seconds to initialize
  CONNECTION_TIMEOUT: 15000, // 15 seconds to connect to services
  
  // Fallback behavior
  ENABLE_FALLBACK: true,
  FALLBACK_SAMPLE_RATE: 16000,
  FALLBACK_FORMAT: 'audio/wav',
};