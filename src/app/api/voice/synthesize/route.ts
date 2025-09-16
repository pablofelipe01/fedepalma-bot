/**
 * Endpoint para convertir texto a voz usando Eleven Labs
 * Genera audio de alta calidad para las respuestas del bot Guaicaramo
 */

import { NextRequest, NextResponse } from 'next/server'

interface SynthesizeRequest {
  text: string
  voice_id?: string // ID de la voz en Eleven Labs
  voice_settings?: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id = 'pNInz6obpgDQGcFmaJgB', voice_settings } = await request.json() as SynthesizeRequest

    // Validar que tenemos API key de Eleven Labs
    const apiKey = process.env.ELEVEN_LABS_API_KEY
    if (!apiKey || apiKey === 'dummy_elevenlabs_key' || apiKey === 'tu_api_key_real_aqui') {
      return NextResponse.json(
        { 
          error: 'Eleven Labs API key no configurada',
          fallback: 'Usa Web Speech API en el cliente',
          message: 'Configura ELEVEN_LABS_API_KEY en .env.local para usar síntesis premium'
        },
        { status: 503 } // Service Unavailable
      )
    }

    // Validar entrada
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texto requerido para síntesis' },
        { status: 400 }
      )
    }

    // Configuración de voz por defecto optimizada para español
    const defaultSettings = {
      stability: 0.75,
      similarity_boost: 0.85,
      style: 0.2,
      use_speaker_boost: true
    }

    const finalSettings = { ...defaultSettings, ...voice_settings }

    // Llamar a Eleven Labs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_multilingual_v2', // Mejor para español
          voice_settings: finalSettings
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Eleven Labs API error:', response.status, errorText)
      
      // Casos específicos de error que deberían usar fallback
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'API key sin permisos para TTS',
            fallback: 'Usa Web Speech API en el cliente',
            message: 'La API key de Eleven Labs no tiene permisos text_to_speech. Revisa tu configuración en elevenlabs.io'
          },
          { status: 503 } // Service Unavailable - trigger fallback
        )
      }
      
      return NextResponse.json(
        { error: `Error en síntesis de voz: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Obtener el audio como buffer
    const audioBuffer = await response.arrayBuffer()

    // Retornar el audio con headers apropiados
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 año
      },
    })

  } catch (error) {
    console.error('Error en síntesis de voz:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor en síntesis de voz' },
      { status: 500 }
    )
  }
}