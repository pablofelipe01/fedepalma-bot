/**
 * Audio utilities for the Fedepalma 2025 Voice Bot
 * Functions for audio processing, format conversion, and validation
 */

import type { AudioChunk, AudioFormat } from '@/types/index';

/**
 * Convert audio blob to the specified format
 */
export const convertAudioFormat = async (
  blob: Blob,
  targetFormat: AudioFormat
): Promise<Blob> => {
  try {
    // For now, return the original blob
    // In production, you might want to use Web Audio API for conversion
    // or send to a server endpoint for format conversion
    console.log(`Converting audio from ${blob.type} to ${targetFormat.mimeType}`);
    return blob;
  } catch (error) {
    console.error('Audio format conversion failed:', error);
    throw new Error('Failed to convert audio format');
  }
};

/**
 * Validate audio format support
 */
export const isAudioFormatSupported = (mimeType: string): boolean => {
  if (typeof MediaRecorder !== 'undefined') {
    return MediaRecorder.isTypeSupported(mimeType);
  }
  return false;
};

/**
 * Get supported audio MIME types in order of preference
 */
export const getSupportedAudioTypes = (): string[] => {
  const preferredTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  
  return preferredTypes.filter(isAudioFormatSupported);
};

/**
 * Calculate audio duration from blob
 */
export const getAudioDuration = async (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      });
      
      audio.src = url;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Convert audio blob to base64 string
 */
export const audioBlobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        // Remove the data URL prefix
        const base64 = result.split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to extract base64 data'));
        }
      } else {
        reject(new Error('FileReader result is null'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert Float32Array audio data to WAV blob
 */
export const float32ArrayToWav = (
  audioData: Float32Array,
  sampleRate: number,
  channels: number = 1
): Blob => {
  const length = audioData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const value = audioData[i];
    if (value !== undefined) {
      const sample = Math.max(-1, Math.min(1, value));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

/**
 * Convert audio chunks to a single blob
 */
export const mergeAudioChunks = (chunks: AudioChunk[]): Blob => {
  if (chunks.length === 0) {
    return new Blob([], { type: 'audio/webm' });
  }
  
  // Merge all audio data
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
  const mergedData = new Float32Array(totalLength);
  
  let offset = 0;
  for (const chunk of chunks) {
    mergedData.set(chunk.data, offset);
    offset += chunk.data.length;
  }
  
  // Use the sample rate and channels from the first chunk
  const firstChunk = chunks[0];
  if (!firstChunk) {
    throw new Error('No chunks provided to merge');
  }
  
  return float32ArrayToWav(mergedData, firstChunk.sampleRate, firstChunk.channels);
};

/**
 * Validate microphone permissions
 */
export const checkMicrophonePermission = async (): Promise<PermissionState> => {
  try {
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state;
    }
    
    // Fallback: try to access microphone
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        return 'granted';
      }
      return 'denied';
    } catch {
      return 'denied';
    }
  } catch {
    return 'prompt';
  }
};

/**
 * Get available audio input devices
 */
export const getAudioInputDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Failed to enumerate audio devices:', error);
    return [];
  }
};

/**
 * Calculate RMS (Root Mean Square) for audio level detection
 */
export const calculateRMS = (audioData: Float32Array | number[]): number => {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    const value = audioData[i];
    if (value !== undefined) {
      sum += value * value;
    }
  }
  return Math.sqrt(sum / audioData.length);
};

/**
 * Simple Voice Activity Detection (VAD)
 */
export const detectVoiceActivity = (
  audioData: Float32Array | number[],
  threshold: number = 0.01
): boolean => {
  const rms = calculateRMS(audioData);
  return rms > threshold;
};

/**
 * Apply simple noise gate to audio data
 */
export const applyNoiseGate = (
  audioData: Float32Array,
  threshold: number = 0.01,
  ratio: number = 0.1
): Float32Array => {
  const output = new Float32Array(audioData.length);
  
  for (let i = 0; i < audioData.length; i++) {
    const value = audioData[i];
    if (value !== undefined) {
      const amplitude = Math.abs(value);
      if (amplitude > threshold) {
        output[i] = value;
      } else {
        output[i] = value * ratio;
      }
    }
  }
  
  return output;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${remainingSeconds}s`;
};