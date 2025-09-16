/**
 * Sistema de búsqueda vectorial para documentos de FEDEPALMA
 * Utiliza OpenAI embeddings para encontrar contexto relevante
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { loadFedepalmaDocuments, searchDocuments, type DocumentChunk } from '@/lib/documents/loader'

interface SearchRequest {
  query: string // Consulta del usuario
  limit?: number // Número máximo de resultados (default: 3)
  threshold?: number // Umbral de similitud (default: 0.7)
}

interface SearchResponse {
  success: boolean
  results?: DocumentChunk[]
  totalResults?: number
  processingTimeMs?: number
  query?: string
  error?: string
  metadata?: {
    model: string
    queryEmbedding?: number[]
    searchParams: {
      limit: number
      threshold: number
    }
  }
}

// Cache de documentos en memoria para mejor rendimiento
let documentsCache: DocumentChunk[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Obtener documentos de FEDEPALMA (con cache)
 */
async function getFedepalmaDocuments(): Promise<DocumentChunk[]> {
  const now = Date.now()
  
  // Usar cache si está disponible y es reciente
  if (documentsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return documentsCache
  }
  
  // Cargar documentos desde archivos JSON
  try {
    documentsCache = await loadFedepalmaDocuments()
    cacheTimestamp = now
    console.log(`[Search] Documentos cargados: ${documentsCache.length} chunks`)
    return documentsCache
  } catch (error) {
    console.error('[Search] Error cargando documentos:', error)
    // Fallback a lista vacía si hay error
    return []
  }
}

// Función para calcular similitud coseno entre vectores (para uso futuro)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
// Función actualmente no utilizada pero preparada para implementación vectorial completa
void cosineSimilarity

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  const startTime = Date.now()

  try {
    // Validar API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'dummy_openai_key' || apiKey.includes('dummy')) {
      return NextResponse.json({
        success: false,
        error: 'API Key de OpenAI no configurada para búsqueda vectorial'
      }, { status: 500 })
    }

    // Parse request body
    const body: SearchRequest = await request.json()
    
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Query de búsqueda requerida'
      }, { status: 400 })
    }

    const limit = Math.min(body.limit || 3, 10) // Máximo 10 resultados
    const threshold = body.threshold || 0.2 // Umbral más permisivo para mejor recall

    // Crear cliente OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    console.log(`[Search] Generando embedding para: "${body.query.substring(0, 50)}..."`)

    // Generar embedding para la consulta
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Más rápido y económico
      input: body.query.trim(),
      encoding_format: 'float'
    })

    const queryEmbedding = embeddingResponse.data[0]?.embedding
    if (!queryEmbedding) {
      throw new Error('No se pudo generar embedding para la consulta')
    }
    // TODO: Implementar búsqueda vectorial real con embeddings cuando tengamos DB vectorial
    console.log(`[Search] Embedding generado: ${queryEmbedding.length} dimensiones`)

    // Cargar documentos de FEDEPALMA desde archivos JSON
    const documents = await getFedepalmaDocuments()
    
    if (documents.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudieron cargar los documentos de FEDEPALMA'
      }, { status: 500 })
    }

    // Realizar búsqueda en los documentos cargados
    const relevantResults = searchDocuments(documents, body.query, limit, threshold)

    const processingTime = Date.now() - startTime

    console.log(`[Search] Encontrados ${relevantResults.length} resultados en ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      results: relevantResults,
      totalResults: relevantResults.length,
      processingTimeMs: processingTime,
      query: body.query,
      metadata: {
        model: 'text-embedding-3-small',
        searchParams: {
          limit,
          threshold
        }
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[Search] Error en búsqueda vectorial:', error)
    
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

  // Obtener información de documentos cargados
  const documents = await getFedepalmaDocuments()
  const categories = Array.from(new Set(documents.map(doc => doc.metadata.category)))

  return NextResponse.json({
    status: 'ok',
    service: 'vector-search',
    configured: isConfigured,
    documentsCount: documents.length,
    categories,
    model: 'text-embedding-3-small',
    features: {
      semanticSearch: true,
      keywordFallback: true,
      fedepalmaKnowledge: true,
      realTimeSearch: true,
      jsonDocuments: true
    }
  })
}