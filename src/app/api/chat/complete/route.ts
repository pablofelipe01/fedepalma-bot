/**
 * API endpoint para generación de respuestas usando OpenAI GPT-4
 * Especializado en consultas del sector palmero colombiano
 * Representando al Grupo Empresarial Guaicaramo
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface ChatCompletionRequest {
  message: string // Mensaje/transcripción del usuario
  context?: string // Contexto adicional de documentos
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp?: number
  }>
}

interface ChatCompletionResponse {
  success: boolean
  response?: string
  confidence?: number
  processingTimeMs?: number
  tokenUsage?: {
    prompt: number
    completion: number
    total: number
  }
  error?: string
  metadata?: {
    model: string
    conversationId?: string
    sources?: string[]
  }
}

// Configuración del sistema especializado en palmicultura
const SYSTEM_PROMPT = `Eres un asistente experto en el sector palmero colombiano, representando al Grupo Empresarial Guaicaramo, que incluye Guaicaramo, Fundación Guaicaramo y Sirius. Tienes acceso a información especializada del sector palmero a través de documentos de FEDEPALMA y otras fuentes del sector.

IDENTIDAD:
- Representas al Grupo Empresarial Guaicaramo
- Incluye: Guaicaramo, Fundación Guaicaramo y Sirius
- Tienes conocimiento del sector palmero colombiano a través de información de FEDEPALMA

CONOCIMIENTO ESPECIALIZADO:
- Palmicultura colombiana y técnicas de cultivo
- Variedades de palma: OxG, alto oleico (HOPO), tradicionales
- Sostenibilidad y certificaciones (RSPO)
- Procesos de extracción y refinación
- Organizaciones: FEDEPALMA, Cenipalma, Acepalma
- Regiones palmeras: Oriental, Central, Norte, Occidental
- Productos derivados: biodiesel, oleoquímica, cosmética
- Empresas del sector como DAO, Guaicaramo, Sirius

INSTRUCCIONES CRÍTICAS:
1. SIEMPRE usa primero la información del contexto de documentos proporcionado
2. Si hay información específica en el contexto, úsala como fuente principal
3. Responde como representante del Grupo Empresarial Guaicaramo
4. Proporciona información práctica y actionable del sector palmero
5. Usa terminología técnica del sector cuando sea apropiado
6. Si no tienes información específica, sugiere contactar a FEDEPALMA o a nuestro grupo empresarial
7. Mantén un tono profesional pero accesible
8. Prioriza siempre la información actualizada de los documentos proporcionados
9. Incluye datos relevantes de Colombia cuando sea pertinente

LÍMITES:
- Solo información relacionada con palmicultura y el sector agroindustrial
- No proporciones consejos médicos o financieros específicos
- Deriva consultas no relacionadas a contactos apropiados

IMPORTANTE: Cuando tengas contexto de documentos, basar tu respuesta completamente en esa información. Te identificas como parte del Grupo Empresarial Guaicaramo, no como FEDEPALMA.`

export async function POST(request: NextRequest): Promise<NextResponse<ChatCompletionResponse>> {
  const startTime = Date.now()

  try {
    // Validar API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'dummy_openai_key' || apiKey.includes('dummy')) {
      return NextResponse.json({
        success: false,
        error: 'API Key de OpenAI no configurada correctamente'
      }, { status: 500 })
    }

    // Parse request body
    const body: ChatCompletionRequest = await request.json()
    
    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Mensaje requerido'
      }, { status: 400 })
    }

    // Validar longitud del mensaje
    if (body.message.length > 2000) {
      return NextResponse.json({
        success: false,
        error: 'Mensaje demasiado largo (máximo 2000 caracteres)'
      }, { status: 400 })
    }

    // Crear cliente OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Preparar historial de conversación
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ]

    // Agregar contexto si está disponible
    if (body.context && body.context.trim().length > 0) {
      console.log(`[API] Contexto recibido: ${body.context.substring(0, 200)}...`)
      messages.push({
        role: 'system',
        content: `INFORMACIÓN DEL SECTOR PALMERO (USA ESTA INFORMACIÓN COMO FUENTE PRINCIPAL):

${body.context}

INSTRUCCIÓN: Basa tu respuesta principalmente en la información anterior. Responde como representante del Grupo Empresarial Guaicaramo con acceso a esta información del sector palmero.`
      })
    } else {
      console.log(`[API] No se recibió contexto de documentos`)
    }

    // Agregar historial previo si existe
    if (body.conversationHistory && body.conversationHistory.length > 0) {
      // Limitar historial a últimas 5 interacciones para controlar tokens
      const recentHistory = body.conversationHistory.slice(-5)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        })
      }
    }

    // Agregar mensaje actual del usuario
    messages.push({
      role: 'user',
      content: body.message.trim()
    })

    console.log(`[API] Generando respuesta para: "${body.message.substring(0, 50)}..."`)

    // Realizar completion con GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Más rápido y económico para la mayoría de consultas
      messages: messages,
      max_tokens: 500, // Respuestas concisas para voz
      temperature: 0.7, // Balance entre creatividad y precisión
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
      stream: false
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo generar respuesta'
      }, { status: 500 })
    }

    const processingTime = Date.now() - startTime

    console.log(`[API] Respuesta generada exitosamente en ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      response: response.trim(),
      processingTimeMs: processingTime,
      tokenUsage: {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0
      },
      metadata: {
        model: 'gpt-4o-mini',
        conversationId: `conv_${Date.now()}`
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[API] Error en chat completion:', error)
    
    let errorMessage = 'Error interno del servidor'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      processingTimeMs: processingTime
    }, { status: 500 })
  }
}

// Endpoint GET para verificar configuración
export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  const isConfigured = apiKey && !apiKey.includes('dummy')

  return NextResponse.json({
    status: 'ok',
    service: 'openai-chat-completion',
    configured: isConfigured,
    model: 'gpt-4o-mini',
    identity: 'Grupo Empresarial Guaicaramo',
    features: {
      palmSectorExpertise: true,
      conversationHistory: true,
      documentContext: true,
      spanishOptimized: true,
      guaicaramoGroup: true
    }
  })
}