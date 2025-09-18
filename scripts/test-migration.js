const fs = require('fs');
const path = require('path');

// Mock de la función Supabase para testing local
async function mockInsert(documents) {
  console.log(`  → Insertando ${documents.length} documentos en Supabase...`);
  // Simulamos inserción exitosa
  return true;
}

// Función para procesar JSON y convertir a documentos
function processJsonToDocuments(jsonData, filename, category) {
  
  function extractContent(obj, currentPath = '') {
    const content = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key;
      
      if (typeof value === 'string') {
        if (value.length > 10) { // Solo strings con contenido significativo
          content.push(`${key}: ${value}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'string') {
              content.push(`${key}[${index}]: ${item}`);
            } else if (typeof item === 'object' && item !== null) {
              content.push(...extractContent(item, `${path}[${index}]`));
            }
          });
        } else {
          content.push(...extractContent(value, path));
        }
      }
    }
    
    return content;
  }
  
  // Crear chunks de contenido más grandes y significativos
  function createChunks(data, baseName) {
    const chunks = [];
    
    // Si es el objeto principal, procesar cada sección principal
    for (const [mainKey, mainValue] of Object.entries(data)) {
      if (typeof mainValue === 'object' && mainValue !== null) {
        const sectionContent = extractContent(mainValue);
        
        if (sectionContent.length > 0) {
          const title = `${baseName} - ${mainKey.replace(/_/g, ' ')}`;
          const content = sectionContent.join('. ');
          
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
            });
          }
        }
      }
    }
    
    return chunks;
  }
  
  // Determinar el título base del documento
  const baseTitle = filename.replace(/[-_]/g, ' ').replace('.json', '');
  return createChunks(jsonData, baseTitle);
}

// Función principal para migrar todos los JSONs
async function migrateJsonData() {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    
    console.log(`🔍 Encontrados ${jsonFiles.length} archivos JSON para migrar`);
    
    const allDocuments = [];
    
    for (const filename of jsonFiles) {
      const filePath = path.join(dataDir, filename);
      const jsonContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);
      
      // Determinar categoría basada en el nombre del archivo
      let category = 'general';
      if (filename.includes('agenda') || filename.includes('congreso')) {
        category = 'congress';
      } else if (filename.includes('guaicaramo')) {
        category = 'company';
      } else if (filename.includes('fundacion')) {
        category = 'foundation';
      }
      
      const documents = processJsonToDocuments(jsonData, filename, category);
      allDocuments.push(...documents);
      
      console.log(`📄 Procesado ${filename}: ${documents.length} documentos (categoría: ${category})`);
    }
    
    console.log(`📊 Total de documentos a insertar: ${allDocuments.length}`);
    
    // Mostrar algunos ejemplos de documentos generados
    console.log('\\n📋 Ejemplos de documentos generados:');
    allDocuments.slice(0, 3).forEach((doc, i) => {
      console.log(`\\n  ${i + 1}. ${doc.title}`);
      console.log(`     Categoría: ${doc.category}`);
      console.log(`     Contenido: ${doc.content.substring(0, 100)}...`);
    });
    
    // Insertar en Supabase en lotes de 50 (simulado)
    const batchSize = 50;
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize);
      const success = await mockInsert(batch);
      
      if (!success) {
        console.error(`❌ Error insertando lote ${i / batchSize + 1}`);
        return false;
      }
      
      console.log(`✅ Insertado lote ${i / batchSize + 1}/${Math.ceil(allDocuments.length / batchSize)}`);
    }
    
    console.log('\\n🎉 Migración completada exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return false;
  }
}

// Ejecutar migración
console.log('🚀 Iniciando migración de datos a Supabase...');
migrateJsonData();