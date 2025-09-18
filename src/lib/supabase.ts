import { createClient } from '@supabase/supabase-js'

// Variables de entorno de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para nuestros documentos
export interface Document {
  id: string
  title: string
  content: string
  category: string
  metadata?: Record<string, unknown>
  similarity?: number
}

// Función para buscar documentos con similitud vectorial
export async function searchDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5,
  filterCategory?: string
): Promise<Document[]> {
  try {
    // Usar la función SQL personalizada que creamos
    const { data, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_category: filterCategory || null
    })

    if (error) {
      console.error('Error buscando documentos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error en búsqueda:', error)
    return []
  }
}

// Función para insertar documentos en batch
export async function insertDocuments(documents: Omit<Document, 'created_at'>[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('documents')
      .insert(documents)

    if (error) {
      console.error('Error inserting documents:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Insert error:', error)
    return false
  }
}