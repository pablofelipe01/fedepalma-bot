/**
 * Utilidad para cargar y procesar los archivos JSON de FEDEPALMA
 * Convierte los documentos estructurados en chunks de búsqueda
 */

import fs from 'fs'
import path from 'path'

export interface DocumentChunk {
  id: string
  content: string
  title: string
  source: string
  metadata: {
    section?: string
    page?: number
    category: string
    lastUpdated?: string
    documentType?: string
    keywords?: string[]
  }
  similarity?: number
}

/**
 * Procesar un objeto JSON recursivamente para extraer contenido texto
 */
function extractTextFromObject(
  obj: unknown, 
  path: string = '', 
  chunks: { path: string; content: string }[] = []
): { path: string; content: string }[] {
  
  if (typeof obj === 'string') {
    if (obj.trim().length > 20) { // Solo textos significativos
      chunks.push({ path, content: obj.trim() })
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (typeof item === 'string' && item.trim().length > 10) {
        chunks.push({ path: `${path}[${index}]`, content: item.trim() })
      } else if (typeof item === 'object') {
        extractTextFromObject(item, `${path}[${index}]`, chunks)
      }
    })
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = path ? `${path}.${key}` : key
      extractTextFromObject(value, newPath, chunks)
    })
  }
  
  return chunks
}

/**
 * Convertir chunks de texto en documentos estructurados
 */
function createDocumentChunks(
  fileName: string,
  jsonData: Record<string, unknown>,
  category: string
): DocumentChunk[] {
  const textChunks = extractTextFromObject(jsonData)
  const chunks: DocumentChunk[] = []
  
  // Información principal del documento
  const getName = (data: Record<string, unknown>): string => {
    if (typeof data.name === 'string') return data.name
    if (data.congress_info && typeof data.congress_info === 'object') {
      const congressInfo = data.congress_info as Record<string, unknown>
      if (typeof congressInfo.name === 'string') return congressInfo.name
    }
    if (data.del_llano_alto_oleico && typeof data.del_llano_alto_oleico === 'object') {
      const dao = data.del_llano_alto_oleico as Record<string, unknown>
      if (typeof dao.name === 'string') return dao.name
    }
    return fileName.replace('.json', '').replace(/-/g, ' ')
  }
  
  const mainTitle = getName(jsonData)
  
  // Crear chunks por secciones principales
  const processedSections = new Set<string>()
  
  textChunks.forEach((chunk, index) => {
    const sectionPath = chunk.path?.split('.')[0] || 'root'
    
    // Agrupar chunks relacionados para evitar fragmentación excesiva
    if (!processedSections.has(sectionPath) && chunk.content.length > 50) {
      
      // Recopilar todo el contenido de esta sección
      const sectionChunks = textChunks.filter(c => 
        c.path?.startsWith(sectionPath) && c.content.length > 20
      )
      
      const sectionContent = sectionChunks
        .map(c => c.content)
        .join('. ')
        .slice(0, 1500) // Limitar tamaño para mejor procesamiento
      
      if (sectionContent.length > 100) {
        chunks.push({
          id: `${fileName}_${sectionPath}_${index}`,
          content: sectionContent,
          title: `${mainTitle} - ${sectionPath.replace(/_/g, ' ')}`,
          source: `FEDEPALMA - ${fileName}`,
          metadata: {
            category,
            section: sectionPath,
            documentType: category,
            lastUpdated: '2024-01-01',
            keywords: extractKeywords(sectionContent)
          }
        })
        
        processedSections.add(sectionPath)
      }
    }
  })
  
  return chunks
}

/**
 * Extraer palabras clave del contenido
 */
function extractKeywords(content: string): string[] {
  const palmKeywords = [
    'palma', 'aceite', 'oleico', 'OxG', 'híbrido', 'sostenible', 'RSPO',
    'fedepalma', 'cenipalma', 'palmicultura', 'extracción', 'beneficio',
    'congreso', 'conferencia', 'guaicaramo', 'dao', 'sirius'
  ]
  
  const contentLower = content.toLowerCase()
  return palmKeywords.filter(keyword => 
    contentLower.includes(keyword.toLowerCase())
  ).slice(0, 10) // Máximo 10 keywords por documento
}

/**
 * Cargar todos los archivos JSON y convertirlos en chunks de búsqueda
 */
export async function loadFedepalmaDocuments(): Promise<DocumentChunk[]> {
  const dataDir = path.join(process.cwd(), 'data')
  const allChunks: DocumentChunk[] = []
  
  try {
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'))
    
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const jsonData = JSON.parse(fileContent)
        
        // Determinar categoría basada en el nombre del archivo
        let category = 'general'
        if (file.includes('congreso') || file.includes('agenda')) {
          category = 'eventos'
        } else if (file.includes('dao') || file.includes('sirius')) {
          category = 'empresas'
        } else if (file.includes('guaicaramo')) {
          category = 'investigacion'
        }
        
        const chunks = createDocumentChunks(file, jsonData, category)
        allChunks.push(...chunks)
        
        console.log(`[LoadDocs] Cargado ${file}: ${chunks.length} chunks`)
        
      } catch (error) {
        console.error(`[LoadDocs] Error procesando ${file}:`, error)
      }
    }
    
    console.log(`[LoadDocs] Total documentos cargados: ${allChunks.length} chunks`)
    return allChunks
    
  } catch (error) {
    console.error('[LoadDocs] Error cargando documentos:', error)
    return []
  }
}

/**
 * Búsqueda mejorada por keywords en los documentos cargados
 */
export function searchDocuments(
  documents: DocumentChunk[], 
  query: string, 
  limit: number = 3,
  threshold: number = 0.2
): DocumentChunk[] {
  
  // Extraer palabras importantes, incluyendo términos cortos importantes
  const queryWords = query.toLowerCase()
    .replace(/[¿?¡!.,;]/g, ' ') // Reemplazar puntuación con espacios
    .split(/\s+/)
    .filter(word => word.length > 1) // Incluir palabras de 2+ caracteres
    .filter(word => {
      // Filtrar palabras comunes pero mantener términos técnicos importantes
      const stopWords = ['me', 'te', 'le', 'la', 'el', 'de', 'en', 'un', 'una', 'es', 'se', 'por', 'con', 'para', 'que', 'del', 'las', 'los', 'sus', 'como', 'puedes', 'hablar', 'favor']
      const palmTerms = ['dao', 'oxg', 'rspo', 'hopo'] // Términos técnicos importantes
      
      // Mantener si NO es stop word O si es término técnico palmero
      return !stopWords.includes(word) || palmTerms.includes(word)
    })
  
  console.log(`[Search] Buscando palabras: ${queryWords.join(', ')} en ${documents.length} documentos`)
  
  const scoredResults = documents.map(doc => {
    const content = doc.content.toLowerCase()
    const title = doc.title.toLowerCase()
    const source = doc.source.toLowerCase()
    
    let score = 0
    let matchedWords = 0
    
    queryWords.forEach(word => {
      let wordFound = false
      let wordScore = 0
      
      // Buscar coincidencias exactas como palabra completa (más peso)
      const exactRegex = new RegExp(`\\b${word}\\b`, 'i')
      if (exactRegex.test(title)) {
        wordScore += 10 // Título tiene máximo peso
        wordFound = true
      }
      if (exactRegex.test(content)) {
        wordScore += 5 // Contenido con palabra exacta
        wordFound = true
      }
      if (exactRegex.test(source)) {
        wordScore += 3 // Fuente
        wordFound = true
      }
      
      // Buscar coincidencias parciales (menor peso)
      if (!wordFound) {
        if (title.includes(word)) {
          wordScore += 3
          wordFound = true
        }
        if (content.includes(word)) {
          wordScore += 2
          wordFound = true
        }
        if (source.includes(word)) {
          wordScore += 1
          wordFound = true
        }
      }
      
      // Buscar en keywords si existen
      if (doc.metadata.keywords?.some(k => k.toLowerCase().includes(word))) {
        wordScore += 4
        wordFound = true
      }
      
      // Bonificación por palabras clave del sector palmero
      const palmKeywords = ['palma', 'aceite', 'oleico', 'fedepalma', 'congreso', 'guaicaramo', 'dao', 'oxg', 'híbrido', 'rspo', 'sostenible']
      if (palmKeywords.includes(word)) {
        wordScore += 2
      }
      
      // Bonificación extra para términos cortos importantes (como DAO, OxG)
      if (word.length <= 4 && word.match(/^[A-Z]{2,4}$/i)) {
        wordScore *= 1.5
      }
      
      if (wordFound) {
        matchedWords++
        score += wordScore
      }
    })
    
    // Normalizar score considerando cantidad de palabras encontradas
    const normalizedScore = matchedWords > 0 ? 
      Math.min((score * matchedWords) / (queryWords.length * 5), 1) : 0
    
    if (normalizedScore > 0) {
      console.log(`[Search] "${doc.title}": score=${normalizedScore.toFixed(3)}, matched=${matchedWords}/${queryWords.length}`)
    }
    
    return {
      ...doc,
      similarity: normalizedScore
    }
  })
  
  const results = scoredResults
    .filter(result => result.similarity! >= threshold)
    .sort((a, b) => b.similarity! - a.similarity!)
    .slice(0, limit)
  
  console.log(`[Search] Encontrados ${results.length} resultados con umbral ${threshold}`)
  
  return results
}