import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface Document {
  id: string
  title: string
  content: string
  category: string
  similarity?: number
}

// Función para generar embeddings usando OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0]?.embedding || []
}

// Función para buscar documentos por similitud vectorial
async function searchDocuments(queryEmbedding: number[], threshold: number = 0.1, limit: number = 8): Promise<Document[]> {
  console.log(`🔍 Llamando search_documents con threshold: ${threshold}, limit: ${limit}`)
  console.log(`📐 Dimensiones del embedding: ${queryEmbedding.length}`)
  
  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    similarity_threshold: threshold,
    match_count: limit
  })

  if (error) {
    console.error('❌ Error en búsqueda vectorial:', error)
    return []
  }

  console.log(`✅ Búsqueda vectorial retornó ${data?.length || 0} documentos`)
  if (data && data.length > 0) {
    console.log(`📊 Primer resultado - similitud: ${data[0].similarity}, título: ${data[0].title?.substring(0, 50)}`)
  }
  
  return data || []
}

// Función para buscar contexto relevante
async function findRelevantContext(query: string): Promise<string> {
  try {
    console.log(`🔍 Buscando contexto para: "${query}"`)
    
    // Enhanced search strategy for comprehensive results
    let keywords = query.split(' ').filter(word => word.length > 2);
    
    // Add specific keywords for dates and events
    if (query.toLowerCase().includes('septiembre') || query.toLowerCase().includes('23') || query.toLowerCase().includes('agenda') || query.toLowerCase().includes('dia') || query.toLowerCase().includes('día')) {
      keywords = ['septiembre', '23', 'martes', 'agenda', 'congreso', 'charlas', 'comerciales', 'plenarias', 'día', ...keywords];
    }
    
    if (query.toLowerCase().includes('guaicaramo')) {
      keywords = ['guaicaramo', 'grupo', 'empresas', 'fundación', 'dao', 'sirius', ...keywords];
    }

    // For comprehensive agenda requests, search all congress documents
    let documents: Document[] = [];
    
    if (query.toLowerCase().includes('todo') || query.toLowerCase().includes('completa') || query.toLowerCase().includes('agenda completa') || query.toLowerCase().includes('día 23') || query.toLowerCase().includes('dia 23')) {
      console.log('🔍 Searching ALL congress documents for comprehensive response...');
      const { data: allCongressDocs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('category', 'congress');
      
      if (error) {
        console.error('❌ Error buscando documentos de congreso:', error);
        return 'Error al buscar información del congreso.';
      }
      
      documents = allCongressDocs || [];
      console.log(`📄 Using ALL congress documents: ${documents.length}`);
    } else {
      // Primero intentar búsqueda vectorial
      try {
        const queryEmbedding = await generateEmbedding(query)
        documents = await searchDocuments(queryEmbedding, 0.3, 8)
        
        if (documents.length > 0) {
          console.log(`📊 Búsqueda vectorial exitosa: ${documents.length} documentos`)
        } else {
          console.warn('⚠️ Búsqueda vectorial no encontró resultados, usando búsqueda por texto')
        }
      } catch (vectorError) {
        console.warn('⚠️ Búsqueda vectorial falló, usando búsqueda por texto:', vectorError)
      }
      
      // Si búsqueda vectorial no dio resultados, usar búsqueda por texto
      if (documents.length === 0) {
        console.log(`🔑 Palabras clave: ${keywords.join(', ')}`)
        
        // Buscar por múltiples palabras clave en título Y contenido
        const searchResult = await supabase
          .from('documents')
          .select('*')
          .or(`title.ilike.%${keywords[0]}%,content.ilike.%${keywords[0]}%`)
          .limit(10);

        documents = searchResult.data || [];

        // Si no encuentra con la primera palabra, prueba con las demás
        if (documents.length === 0) {
          for (let i = 1; i < keywords.length; i++) {
            const { data: moreResults } = await supabase
              .from('documents')
              .select('*')
              .or(`title.ilike.%${keywords[i]}%,content.ilike.%${keywords[i]}%`)
              .limit(5)
            
            if (moreResults && moreResults.length > 0) {
              documents = moreResults
              console.log(`✅ Encontrado con palabra clave: "${keywords[i]}"`)
              break
            }
          }
        }
        
        if (searchResult.error) {
          console.error('❌ Error en búsqueda por texto:', searchResult.error)
          return 'Error al buscar información en la base de datos.'
        }
      }
    }

    if (!documents || documents.length === 0) {
      console.log('📭 No se encontraron documentos relevantes')
      return 'No se encontró información relevante en la base de datos.'
    }

    console.log(`📊 Búsqueda exitosa: ${documents.length} documentos`)
    
    // Crear contexto limitado (máximo 8000 caracteres para respuestas completas)
    const maxContextLength = 8000
    let context = ''
    let currentLength = 0
    
    for (const doc of documents) {
      const docContent = `Documento: ${doc.title}\nContenido: ${doc.content}\n\n`
      if (currentLength + docContent.length <= maxContextLength) {
        context += docContent
        currentLength += docContent.length
      } else {
        // Si hay espacio, agregar una versión truncada
        const remainingSpace = maxContextLength - currentLength
        if (remainingSpace > 100) {
          context += docContent.substring(0, remainingSpace - 3) + '...'
        }
        break
      }
    }
    
    return context
  } catch (error) {
    console.error('❌ Error buscando contexto:', error)
    return 'Error al buscar información en la base de datos.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      )
    }
    
    console.log(`🔍 Consulta recibida: ${message}`)
    
    // Buscar contexto relevante en Supabase
    const context = await findRelevantContext(message)
    console.log(`📄 Contexto encontrado: ${context.length} caracteres`)
    
    // Crear prompt para OpenAI con contexto
    const systemPrompt = `Eres un asistente especializado en el Congreso de Fedepalma 2025 y el GRUPO GUAICARAMO.

CONTEXTO IMPORTANTE SOBRE EL GRUPO GUAICARAMO:
El Grupo Guaicaramo es un conglomerado empresarial colombiano que incluye varias empresas:
1. GUAICARAMO - Empresa agroindustrial fundada en 1977, dedicada al cultivo de palma de aceite (9,400 hectáreas)
2. FUNDACIÓN GUAICARAMO - Entidad sin ánimo de lucro creada en 2012 para educación en Barranca de Upía
3. DAO (Del Llano Alto Oleico) - Empresa pionera en aceite de palma Alto Oleico fundada hace más de 10 años
4. SIRIUS REGENERATIVE - Empresa de agricultura regenerativa y biotecnología fundada en 2020

INSTRUCCIONES IMPORTANTES PARA AGENDA:
- Para preguntas sobre agenda completa o "todo del día", organiza cronológicamente TODA la información disponible
- Separa claramente PLENARIAS de CHARLAS COMERCIALES
- Incluye horarios específicos, nombres de speakers y temas exactos
- NO digas que "no tienes información completa" si hay datos en el contexto
- Presenta la información de manera organizada y completa

INSTRUCCIONES GENERALES:
- Cuando pregunten por "Grupo Guaicaramo", explica que incluye estas 4 entidades relacionadas
- Responde ÚNICAMENTE basándote en la información proporcionada en el contexto
- Si la información no está en el contexto, di claramente "No tengo información específica sobre eso"
- Sé conciso pero completo en tus respuestas
- Si te preguntan sobre horarios, fechas o eventos específicos, cita la información completa
- Mantén un tono profesional y amigable

CONTEXTO DISPONIBLE:
${context}

Responde a la consulta del usuario basándote únicamente en este contexto.`

    // Generar respuesta con OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    })
    
    const response = completion.choices[0]?.message?.content || 'No pude generar una respuesta.'
    
    console.log(`✅ Respuesta generada: ${response.length} caracteres`)
    
    return NextResponse.json({ 
      response,
      sources: context.includes('Documento') ? 'Información del congreso y empresa' : 'Sin fuentes específicas'
    })
    
  } catch (error) {
    console.error('Error en API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}