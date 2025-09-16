import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { 
  AudioCaptureState, 
  AudioCaptureConfig, 
  AudioCaptureHook,
  AudioChunk 
} from '@/types/index';

const DEFAULT_CONFIG: AudioCaptureConfig = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  chunkDuration: 64, // 64ms chunks for low latency
  enableVAD: true,
  vadThreshold: 0.01,
  vadSilenceDuration: 1000, // 1 second of silence to stop
  continuousMode: false,
};

export const useAudioCapture = (config: Partial<AudioCaptureConfig> = {}): AudioCaptureHook => {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // State management
  const [state, setState] = useState<AudioCaptureState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isVoiceDetected, setIsVoiceDetected] = useState<boolean>(false);
  
  // Refs for audio processing
  const stateRef = useRef<AudioCaptureState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const vadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onAudioChunkRef = useRef<((chunk: AudioChunk) => void) | null>(null);
  
  // Keep ref in sync with state
  stateRef.current = state;
  
  // Audio level monitoring
  const analyzeAudio = useCallback(() => {
    console.log(`[VAD] analyzeAudio ejecutándose, state actual: ${stateRef.current}`);
    if (!analyserRef.current) {
      console.log('[VAD] No analyser available');
      return;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for audio level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i];
      if (value !== undefined) {
        sum += (value / 255) ** 2;
      }
    }
    const rms = Math.sqrt(sum / dataArray.length);
    setAudioLevel(rms);
    
    // Voice Activity Detection (VAD)
    if (finalConfig.enableVAD) {
      const voiceDetected = rms > finalConfig.vadThreshold;
      const wasVoiceDetected = isVoiceDetected;
      setIsVoiceDetected(voiceDetected);
      
      // Log cada segundo aprox para debugging
      if (Math.random() < 0.1) {
        console.log(`[VAD] RMS=${rms.toFixed(3)}, detected=${voiceDetected}, state=${stateRef.current}`);
      }
      
      // Callbacks de voz
      if (voiceDetected && !wasVoiceDetected) {
        console.log(`[VAD] Voz ON - RMS: ${rms.toFixed(3)}`);
        finalConfig.onVoiceStart?.();
      } else if (!voiceDetected && wasVoiceDetected) {
        console.log(`[VAD] Voz OFF - RMS: ${rms.toFixed(3)}`);
        finalConfig.onVoiceEnd?.();
      }
      
      if (!voiceDetected && stateRef.current === 'recording') {
        // Start silence timer
        if (!vadTimerRef.current) {
          console.log(`[VAD] Timer silencio iniciado`);
          vadTimerRef.current = setTimeout(() => {
            if (vadTimerRef.current) {
              clearTimeout(vadTimerRef.current);
              vadTimerRef.current = null;
            }
            
            console.log(`[VAD] Procesando audio detectado`);
            
            if (finalConfig.continuousMode) {
              // En modo continuo, procesar audio pero seguir grabando
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                const chunks = [...chunksRef.current];
                chunksRef.current = []; // Limpiar chunks para la siguiente frase
                
                // Crear blob del audio actual
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                finalConfig.onSilenceDetected?.(audioBlob);
                
                // NO detener la grabación, seguir escuchando
              }
            } else {
              // Modo original: detener grabación
              setState('processing');
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
            }
          }, finalConfig.vadSilenceDuration);
        }
      } else if (voiceDetected && vadTimerRef.current) {
        // Clear silence timer if voice is detected
        console.log(`[VAD] Timer cancelado`);
        clearTimeout(vadTimerRef.current);
        vadTimerRef.current = null;
      }
    }
    
    if (stateRef.current === 'recording') {
      requestAnimationFrame(analyzeAudio);
    } else {
      console.log(`[VAD] No está grabando, state=${stateRef.current}`);
    }
  }, [finalConfig, isVoiceDetected]);
  
  // Initialize audio context and worklet
  const initializeAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({
        sampleRate: finalConfig.sampleRate,
      });
      
      // Load audio worklet for real-time processing
      try {
        await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
      } catch (workletError) {
        console.warn('Audio worklet not available, using fallback processing:', workletError);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      setError('Audio context initialization failed');
      return false;
    }
  }, [finalConfig.sampleRate]);
  
  // Request microphone permissions and setup stream
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[Audio] Solicitando permisos de micrófono...');
      
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: finalConfig.sampleRate,
          channelCount: finalConfig.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('[Audio] Permisos concedidos, stream obtenido');
      
      // Setup analyzer for audio level monitoring
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        
        console.log('[Audio] Analizador conectado, iniciando monitoreo...');
        
        // Setup audio worklet if available
        try {
          audioWorkletRef.current = new AudioWorkletNode(
            audioContextRef.current,
            'audio-processor',
            {
              processorOptions: {
                sampleRate: finalConfig.sampleRate,
                chunkDuration: finalConfig.chunkDuration,
              },
            }
          );
          
          source.connect(audioWorkletRef.current);
          
          // Handle audio chunks from worklet
          audioWorkletRef.current.port.onmessage = (event) => {
            if (event.data.type === 'audioChunk' && onAudioChunkRef.current) {
              const chunk: AudioChunk = {
                data: event.data.audioData,
                timestamp: Date.now(),
                sampleRate: finalConfig.sampleRate,
                channels: finalConfig.channels,
              };
              onAudioChunkRef.current(chunk);
            }
          };
        } catch (workletError) {
          console.warn('Audio worklet setup failed, using MediaRecorder fallback:', workletError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied or not available:', error);
      setError('Microphone access denied or not available');
      return false;
    }
  }, [finalConfig.sampleRate, finalConfig.channels, finalConfig.chunkDuration]);
  
  // Start recording
  const startRecording = useCallback(async (onAudioChunk?: (chunk: AudioChunk) => void): Promise<boolean> => {
    try {
      setError(null);
      setState('initializing');
      
      // Store callback for audio chunks
      onAudioChunkRef.current = onAudioChunk || null;
      
      // Initialize audio context if not already done
      if (!audioContextRef.current) {
        console.log('[Audio] Inicializando contexto de audio...');
        const initialized = await initializeAudioContext();
        if (!initialized) {
          console.log('[Audio] ❌ Falló inicialización de contexto');
          return false;
        }
        console.log('[Audio] ✅ Contexto de audio inicializado');
      }
      
      // Request microphone permission
      if (!streamRef.current) {
        console.log('[Audio] Stream no existe, solicitando permisos...');
        const permitted = await requestMicrophonePermission();
        if (!permitted) {
          console.log('[Audio] ❌ Permisos denegados');
          return false;
        }
        console.log('[Audio] ✅ Permisos concedidos y stream obtenido');
      }
      
      // Setup MediaRecorder for recording
      if (streamRef.current) {
        console.log('[Audio] Configurando MediaRecorder...');
        const options: MediaRecorderOptions = {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: finalConfig.sampleRate * finalConfig.bitsPerSample * finalConfig.channels,
        };
        
        // Fallback to available MIME types
        if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
          const supportedTypes = [
            'audio/webm',
            'audio/mp4',
            'audio/wav',
          ];
          
          for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
              options.mimeType = type;
              break;
            }
          }
        }
        
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
        chunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setError('Recording error occurred');
          setState('idle');
        };
        
        // Start recording with chunk intervals
        mediaRecorderRef.current.start(finalConfig.chunkDuration);
        console.log('[Audio] ✅ MediaRecorder iniciado, estableciendo estado a recording...');
        console.log(`[Audio] Estado antes del setState: ${stateRef.current}`);
        setState('recording');
        console.log('[Audio] setState(recording) llamado');
        
        // Start audio level monitoring with a small delay to ensure state update
        console.log('[Audio] ✅ Iniciando análisis de audio...');
        setTimeout(() => {
          console.log(`[Audio] Ejecutando analyzeAudio después del delay, state debería ser: recording`);
          analyzeAudio();
        }, 100);
        
        console.log('[Audio] ✅ startRecording completado exitosamente');
        return true;
      }
      
      console.log('[Audio] ❌ No hay stream disponible');
      return false;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording');
      setState('idle');
      return false;
    }
  }, [initializeAudioContext, requestMicrophonePermission, analyzeAudio, finalConfig]);
  
  // Stop recording
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        setState('processing');
        
        // Clear VAD timer
        if (vadTimerRef.current) {
          clearTimeout(vadTimerRef.current);
          vadTimerRef.current = null;
        }
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            chunksRef.current = [];
            setState('idle');
            resolve(blob);
          };
          
          mediaRecorderRef.current.stop();
        } else {
          setState('idle');
          resolve(null);
        }
      } catch (error) {
        console.error('Failed to stop recording:', error);
        setError('Failed to stop recording');
        setState('idle');
        resolve(null);
      }
    });
  }, []);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Clear timers
    if (vadTimerRef.current) {
      clearTimeout(vadTimerRef.current);
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Reset refs
    mediaRecorderRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    audioWorkletRef.current = null;
    vadTimerRef.current = null;
    onAudioChunkRef.current = null;
    
    // Reset state
    setState('idle');
    setError(null);
    setAudioLevel(0);
    setIsVoiceDetected(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  // Check microphone availability
  const checkMicrophoneAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'audioinput');
    } catch {
      return false;
    }
  }, []);
  
  return {
    // State
    state,
    error,
    audioLevel,
    isVoiceDetected,
    
    // Actions
    startRecording,
    stopRecording,
    cleanup,
    checkMicrophoneAvailability,
    
    // Config
    config: finalConfig,
  };
};