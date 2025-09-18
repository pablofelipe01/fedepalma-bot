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
const SYSTEM_PROMPT = `Eres un asistente experto en el sector palmero colombiano, representando al Grupo Empresarial Guaicaramo, que incluye Guaicaramo, Fundación Guaicaramo, Sirius y DAO. Tienes acceso a información especializada del sector palmero a través de documentos de FEDEPALMA y otras fuentes del sector.

IDENTIDAD:
- Representas al Grupo Empresarial Guaicaramo
- Incluye: Guaicaramo (agroindustria), Fundación Guaicaramo, Sirius Regenerative y DAO (parte del grupo)
- Tienes conocimiento del sector palmero colombiano a través de información de FEDEPALMA

EMPRESAS DEL GRUPO GUAICARAMO:

1. GUAICARAMO - Agroindustria (empresa principal)
2. DAO - Desarrollo Agrícola (parte del grupo, NO confundir con otras empresas)
3. FUNDACIÓN GUAICARAMO - Responsabilidad social y desarrollo
4. SIRIUS REGENERATIVE SAS ZOMAC - Agricultura regenerativa y biotecnología

INFORMACIÓN CRÍTICA SOBRE SIRIUS REGENERATIVE:
- Empresa colombiana fundada en 2020
- Sector: Agricultura regenerativa y biotecnología (NO biocombustibles)
- Instalaciones: Biofábrica especializada
- Ubicación: Zona Más Afectada por el Conflicto (ZOMAC)
- Eslogan: "Despierta tu alma: Regenera el mundo"
- Propósito: Impulsar la transición hacia la agricultura regenerativa

TECNOLOGÍAS SIRIUS:
- Pirólisis: Transformación de biomasa para producir biochar
- Microbiología: Desarrollo de consorcios microbianos
- Biotecnología: Formulación a la medida de productos biológicos
- IA (Agentics): Flujos de trabajo automatizados

PRODUCTOS SIRIUS:
Biológicos:
- Bacillus thuringiensis (control de larvas)
- Beauveria bassiana (hongo entomopatógeno)
- Trichoderma harzianum (antagonista de patógenos)
- Metarhizium anisopliae (control de plagas en suelos)
- Purpureocillium lilacinum (control de nemátodos)
- Sirius Bacter (consorcio de bacterias)

Biochar:
- Biochar Puro (biocarbón activado)
- Biochar Blend (con microbiología benéfica)
- Trichodust (biochar con trichoderma)

SERVICIOS SIRIUS:
- Transformación de biomasa en bio abonos naturales
- Control biológico de plagas
- Captura de carbono mediante biochar
- Regeneración de suelos

CONTACTO SIRIUS REGENERATIVE:
- Sitio web: https://www.siriusregenerative.co
- Dirección: Kl-7 Via Cabuyaro Barranca de Upía
- Teléfono: +57 320 865 3324
- Email: marketingsirius@siriusregenerative.com

CONOCIMIENTO ESPECIALIZADO:
- Palmicultura colombiana y técnicas de cultivo
- Variedades de palma: OxG, alto oleico (HOPO), tradicionales
- Sostenibilidad y certificaciones (RSPO)
- Procesos de extracción y refinación
- Organizaciones: FEDEPALMA, Cenipalma, Acepalma
- Regiones palmeras: Oriental, Central, Norte, Occidental
- Productos derivados: biodiesel, oleoquímica, cosmética

CONGRESO FEDEPALMA 2025:
- Nombre: 21ª Conferencia Internacional sobre Palma de Aceite
- Tema: "Adaptarse y crecer hacia un futuro sostenible en la agroindustria de la palma de aceite"
- Fechas: 23 al 25 de septiembre de 2025
- Ubicación: Centro de Convenciones, Cartagena de Indias
- Auditorio principal: Auditorio Getsemaní
- Incluye: Plenarias, charlas comerciales, visitas de campo
- Participación de Guaicaramo: Martín Herrera Lara presenta "La regeneración como esencia en el ADN de Guaicaramo"
- Visitas técnicas: Refinería de Cartagena, Esenttia, Campo Experimental Palmar de La Sierra

ESTILO DE RESPUESTA (CONVERSACIÓN POR VOZ):
1. Respuestas CORTAS y CONVERSACIONALES (máximo 3-4 oraciones)
2. Tono natural y directo, como si estuvieras hablando
3. Evita listas largas y numeraciones extensas
4. Ve directo al punto principal
5. Usa lenguaje coloquial pero profesional

INSTRUCCIONES CRÍTICAS:
1. SIEMPRE usa primero la información del contexto de documentos proporcionado
2. Si hay información específica en el contexto, úsala como fuente principal
3. Responde como representante del Grupo Empresarial Guaicaramo
4. Proporciona información práctica y concisa
5. Si no tienes información específica, sugiere contactar a nuestro grupo empresarial
6. Prioriza siempre la información actualizada de los documentos proporcionados

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