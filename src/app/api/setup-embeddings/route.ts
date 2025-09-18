import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0]?.embedding || []
}

export async function POST() {
  try {
    console.log('🚀 Iniciando setup de embeddings...')
    
    // Obtener documentos sin embeddings (o todos si no existe la columna)
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, title, content')
    
    if (fetchError) {
      console.error('❌ Error obteniendo documentos:', fetchError)
      return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 })
    }
    
    console.log(`📄 Encontrados ${documents?.length || 0} documentos`)
    
    const results = []
    
    // Generar embeddings para documentos que no los tienen
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        try {
          console.log(`🔄 Procesando: ${doc.title?.substring(0, 50)}...`)
          
          // Combinar título y contenido para el embedding
          const textForEmbedding = `${doc.title || ''} ${doc.content || ''}`.substring(0, 8000)
          
          // Generar embedding
          const embedding = await generateEmbedding(textForEmbedding)
          
          // Actualizar documento con embedding
          const { error: updateError } = await supabase
            .from('documents')
            .update({ embedding: `[${embedding.join(',')}]` })
            .eq('id', doc.id)
          
          if (updateError) {
            console.error(`❌ Error actualizando documento ${doc.id}:`, updateError)
            results.push({ id: doc.id, status: 'error', error: updateError.message })
          } else {
            console.log(`✅ Embedding generado para documento ${doc.id}`)
            results.push({ id: doc.id, status: 'success' })
          }
          
        } catch (error) {
          console.error(`❌ Error procesando documento ${doc.id}:`, error)
          results.push({ id: doc.id, status: 'error', error: (error as Error).message })
        }
      }
    }
    
    return NextResponse.json({ 
      message: 'Setup completado',
      processedDocuments: results.length,
      results
    })
    
  } catch (error) {
    console.error('❌ Error en setup:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}