/**
 * API endpoint para transcripción de voz usando Deepgram
 * DESHABILITADO - Sistema simplificado a solo texto
 */

import { NextRequest, NextResponse } from 'next/server'

// Endpoint deshabilitado para simplificar el sistema
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Sistema de voz deshabilitado. Usa el chat de texto.'
  }, { status: 501 })
}

/*
// CÓDIGO ORIGINAL COMENTADO - Sistema de voz completo
import { createClient } from '@deepgram/sdk'

interface TranscriptionRequest {
  audio: string // Base64 encoded audio
  format?: 'wav' | 'webm' | 'mp3'
  sampleRate?: number
  language?: string
  keywords?: string[]
}

interface TranscriptionResponse {
  success: boolean
  transcript?: string
  confidence?: number
  processingTimeMs?: number
  wordCount?: number
  error?: string
  metadata?: {
    model: string
    language: string
    duration: number
    words?: Array<{
      word: string
      start: number
      end: number
      confidence: number
    }>
  }
}

export async function POST_ORIGINAL(request: NextRequest): Promise<NextResponse<TranscriptionResponse>> {
  const startTime = Date.now()

  try {
    // Validar API key
    const apiKey = process.env.DEEPGRAM_API_KEY
    if (!apiKey || apiKey === 'dummy_deepgram_key') {
      return NextResponse.json({
        success: false,
        error: 'API Key de Deepgram no configurada'
      }, { status: 500 })
    }

    // Parse request body
    const body: TranscriptionRequest = await request.json()
    
    if (!body.audio) {
      return NextResponse.json({
        success: false,
        error: 'Audio data requerido'
      }, { status: 400 })
    }

    // Decodificar audio base64
    let audioBuffer: Buffer
    try {
      audioBuffer = Buffer.from(body.audio, 'base64')
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Formato de audio base64 inválido'
      }, { status: 400 })
    }

    // Validar tamaño de audio (máximo 25MB)
    if (audioBuffer.length > 25 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Archivo de audio demasiado grande (máximo 25MB)'
      }, { status: 400 })
    }

    // Crear cliente Deepgram
    const deepgram = createClient(apiKey)

    // Configuración mínima y compatible para Deepgram
    const transcriptionOptions = {
      model: 'nova-2',
      language: 'es',
      smart_format: true,
      punctuate: true
    }

    console.log(`[API] Transcribiendo audio: ${audioBuffer.length} bytes, ${body.format || 'linear16'}`)

    // Realizar transcripción
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      transcriptionOptions
    )

    if (error) {
      console.error('[API] Error Deepgram:', error)
      return NextResponse.json({
        success: false,
        error: `Error de Deepgram: ${error.message}`
      }, { status: 500 })
    }

    // Extraer resultado
    const channel = result?.results?.channels?.[0]
    const alternative = channel?.alternatives?.[0]

    if (!alternative || !alternative.transcript?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo transcribir el audio'
      }, { status: 400 })
    }

    const processingTime = Date.now() - startTime
    const transcript = alternative.transcript.trim()
    const confidence = alternative.confidence || 0
    const wordCount = alternative.words?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duration = (result as any)?.results?.audio?.duration || 0

    // Log para monitoreo
    console.log(`[API] Transcripción exitosa: "${transcript}" (${(confidence * 100).toFixed(1)}% confianza, ${processingTime}ms, ${wordCount} palabras)`)

    // Respuesta exitosa
    const response: TranscriptionResponse = {
      success: true,
      transcript,
      confidence,
      processingTimeMs: processingTime,
      wordCount,
      metadata: {
        model: 'nova-2',
        language: body.language || 'es-419',
        duration,
        words: alternative.words?.map(word => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence
        }))
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[API] Error transcripción:', error)

    return NextResponse.json({
      success: false,
      error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      processingTimeMs: processingTime
    }, { status: 500 })
  }
}
*/
// Método GET para health check
export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  
  return NextResponse.json({
    status: 'ok',
    service: 'deepgram-transcription',
    configured: !!(apiKey && apiKey !== 'dummy_deepgram_key'),
    timestamp: new Date().toISOString()
  })
}