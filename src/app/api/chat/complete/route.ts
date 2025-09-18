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
const SYSTEM_PROMPT = `Eres el asistente oficial del Grupo Empresarial Guaicaramo para el Congreso Nacional de Palmicultores FEDEPALMA 2025.

Tu objetivo es proporcionar información precisa sobre:
- Programación completa del congreso
- Horarios detallados de todas las conferencias
- Información sobre presentadores y empresas
- Productos y servicios de Guaicaramo
- Agricultura regenerativa y sostenibilidad

INSTRUCCIONES PARA MANEJO DE CONTEXTO:
1. SIEMPRE prioriza y usa la información del contexto de documentos proporcionado
2. Cuando tengas contexto, extrae TODA la información relevante disponible
3. Para preguntas sobre agenda/horarios: busca y lista TODOS los eventos encontrados
4. Para horarios específicos: usa EXACTAMENTE el formato que aparece en el contexto
5. Si el contexto contiene información, ÚSALA - no digas que no tienes la información
6. Organiza la información de manera clara y completa
7. Para información de Guaicaramo: enfócate en agricultura regenerativa y biotecnología
8. Solo di "No tengo esa información" si realmente no hay datos en el contexto

IMPORTANTE SOBRE SIRIUS:
- NUNCA confundir Sirius con biocombustibles o biodiésel
- Sirius es EXCLUSIVAMENTE agricultura regenerativa y biotecnología
- NO produce combustibles, produce productos biológicos y biochar
- Su enfoque es regeneración de suelos y control biológico de plagas

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
      console.log(`[API] Contexto recibido: ${body.context.length} caracteres`)
      console.log(`[API] Primeros 200 chars: ${body.context.substring(0, 200)}...`)
      console.log(`[API] Últimos 200 chars: ...${body.context.substring(body.context.length - 200)}`)
      messages.push({
        role: 'system',
        content: `INFORMACIÓN OFICIAL DEL CONGRESO FEDEPALMA - DATOS COMPLETOS:

${body.context}

INSTRUCCIONES PARA USO DE CONTEXTO:
1. El texto anterior contiene información OFICIAL y COMPLETA del congreso
2. DEBES extraer y proporcionar toda la información disponible sobre horarios, conferencias y speakers
3. Cuando pregunten por agenda del 23 de septiembre, busca en el contexto todas las referencias a "23" o "Sept"
4. Extrae TODOS los horarios que encuentres (formato: "X:XX p.m. - X:XX p.m.")
5. Lista TODAS las conferencias y presentadores que veas en el contexto
6. Para Martín Herrera: debe aparecer "2:00 p.m." en el contexto - úsalo EXACTAMENTE
7. Si hay múltiples conferencias en el contexto, muestra TODAS las que sean del día solicitado
8. NUNCA digas "No tengo información" si hay datos en el contexto anterior
9. Responde como representante de Guaicaramo proporcionando TODA la información encontrada
10. Organiza la información por horarios de manera clara y completa`
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