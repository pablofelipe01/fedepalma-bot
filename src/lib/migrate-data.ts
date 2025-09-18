import fs from 'fs'
import path from 'path'
import { supabase, Document, insertDocuments } from './supabase'

// Función para procesar JSON y convertir a documentos
function processJsonToDocuments(jsonData: Record<string, unknown>, filename: string, category: string): Document[] {
  
  function extractContent(obj: Record<string, unknown>, currentPath: string = ''): string[] {
    const content: string[] = []
    
    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key
      
      if (typeof value === 'string') {
        if (value.length > 10) { // Solo strings con contenido significativo
          content.push(`${key}: ${value}`)
        }
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'string') {
              content.push(`${key}[${index}]: ${item}`)
            } else if (typeof item === 'object' && item !== null) {
              content.push(...extractContent(item as Record<string, unknown>, `${path}[${index}]`))
            }
          })
        } else {
          content.push(...extractContent(value as Record<string, unknown>, path))
        }
      }
    }
    
    return content
  }
  
  // Crear chunks de contenido más grandes y significativos
  function createChunks(data: Record<string, unknown>, baseName: string): Document[] {
    const chunks: Document[] = []
    
    // Si es el objeto principal, procesar cada sección principal
    for (const [mainKey, mainValue] of Object.entries(data)) {
      if (typeof mainValue === 'object' && mainValue !== null) {
        const sectionContent = extractContent(mainValue as Record<string, unknown>)
        
        if (sectionContent.length > 0) {
          const title = `${baseName} - ${mainKey.replace(/_/g, ' ')}`
          const content = sectionContent.join('. ')
          
          // Solo crear documento si tiene contenido sustancial
          if (content.length > 50) {
            chunks.push({
              id: `${filename}_${mainKey}_${Date.now()}`,
              title,
              content,
              category,
              metadata: {
                source: filename,
                section: mainKey,
                documentType: category
              }
            })
          }
        }
      }
    }
    
    return chunks
  }
  
  // Determinar el título base del documento
  const baseTitle = filename.replace(/[-_]/g, ' ').replace('.json', '')
  return createChunks(jsonData, baseTitle)
}

// Función principal para migrar todos los JSONs
export async function migrateJsonData(): Promise<boolean> {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'))
    
    console.log(`Encontrados ${jsonFiles.length} archivos JSON para migrar`)
    
    const allDocuments: Document[] = []
    
    for (const filename of jsonFiles) {
      const filePath = path.join(dataDir, filename)
      const jsonContent = fs.readFileSync(filePath, 'utf-8')
      const jsonData = JSON.parse(jsonContent)
      
      // Determinar categoría basada en el nombre del archivo
      let category = 'general'
      if (filename.includes('agenda') || filename.includes('congreso')) {
        category = 'congress'
      } else if (filename.includes('guaicaramo')) {
        category = 'company'
      } else if (filename.includes('fundacion')) {
        category = 'foundation'
      }
      
      const documents = processJsonToDocuments(jsonData, filename, category)
      allDocuments.push(...documents)
      
      console.log(`Procesado ${filename}: ${documents.length} documentos`)
    }
    
    console.log(`Total de documentos a insertar: ${allDocuments.length}`)
    
    // Insertar en Supabase en lotes de 50
    const batchSize = 50
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize)
      const success = await insertDocuments(batch)
      
      if (!success) {
        console.error(`Error insertando lote ${i / batchSize + 1}`)
        return false
      }
      
      console.log(`Insertado lote ${i / batchSize + 1}/${Math.ceil(allDocuments.length / batchSize)}`)
    }
    
    console.log('✅ Migración completada exitosamente')
    return true
    
  } catch (error) {
    console.error('Error en migración:', error)
    return false
  }
}

// Función para verificar que los datos fueron migrados
export async function verifyMigration(): Promise<void> {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Error verificando migración:', error)
      return
    }
    
    console.log(`📊 Total de documentos en Supabase: ${count}`)
    
    // Verificar distribución por categorías
    const { data: categories } = await supabase
      .from('documents')
      .select('category')
      .not('category', 'is', null)
    
    if (categories) {
      const categoryCount = categories.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('📋 Distribución por categorías:', categoryCount)
    }
    
  } catch (error) {
    console.error('Error en verificación:', error)
  }
}