require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para insertar documentos en Supabase
async function insertDocuments(documents) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert(documents);
    
    if (error) {
      console.error('Error insertando documentos:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en inserción:', error);
    return false;
  }
}

// Función para verificar/crear tabla si no existe
async function ensureTableExists() {
  try {
    console.log('🔍 Verificando tabla documents...');
    
    // Intentar hacer una consulta simple para verificar si la tabla existe
    const { data, error } = await supabase
      .from('documents')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST116') {
      console.log('📋 Tabla documents no existe. Necesitas crearla en Supabase Dashboard:');
      console.log('');
      console.log('CREATE TABLE documents (');
      console.log('  id TEXT PRIMARY KEY,');
      console.log('  title TEXT NOT NULL,');
      console.log('  content TEXT NOT NULL,');
      console.log('  category TEXT NOT NULL,');
      console.log('  metadata JSONB,');
      console.log('  embedding VECTOR(1536),');
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log(');');
      console.log('');
      console.log('CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);');
      return false;
    }
    
    if (error) {
      console.error('Error verificando tabla:', error);
      return false;
    }
    
    console.log('✅ Tabla documents verificada');
    return true;
  } catch (error) {
    console.error('Error verificando tabla:', error);
    return false;
  }
}

// Función para procesar JSON y convertir a documentos
function processJsonToDocuments(jsonData, filename, category) {
  
  function extractContent(obj, currentPath = '') {
    const content = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const pathStr = currentPath ? `${currentPath}.${key}` : key;
      
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
              content.push(...extractContent(item, `${pathStr}[${index}]`));
            }
          });
        } else {
          content.push(...extractContent(value, pathStr));
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
              id: `${filename}_${mainKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    // Verificar que la tabla existe
    const tableExists = await ensureTableExists();
    if (!tableExists) {
      return false;
    }
    
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
    
    // Limpiar tabla existente antes de insertar
    console.log('🧹 Limpiando datos existentes...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', 'nonexistent'); // Eliminar todos los registros
    
    if (deleteError) {
      console.warn('Advertencia limpiando datos:', deleteError);
    }
    
    // Insertar en Supabase en lotes de 50
    const batchSize = 50;
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize);
      const success = await insertDocuments(batch);
      
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

// Función para verificar que los datos fueron migrados
async function verifyMigration() {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error verificando migración:', error);
      return;
    }
    
    console.log(`📊 Total de documentos en Supabase: ${count}`);
    
    // Verificar distribución por categorías
    const { data: categories } = await supabase
      .from('documents')
      .select('category');
    
    if (categories) {
      const categoryCount = categories.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📋 Distribución por categorías:', categoryCount);
    }
    
    // Mostrar algunos ejemplos
    const { data: examples } = await supabase
      .from('documents')
      .select('title, category, content')
      .limit(3);
    
    if (examples) {
      console.log('\\n📄 Ejemplos de documentos migrados:');
      examples.forEach((doc, i) => {
        console.log(`\\n  ${i + 1}. ${doc.title} (${doc.category})`);
        console.log(`     ${doc.content.substring(0, 100)}...`);
      });
    }
    
  } catch (error) {
    console.error('Error en verificación:', error);
  }
}

// Ejecutar migración
async function run() {
  console.log('🚀 Iniciando migración de datos a Supabase...');
  
  const success = await migrateJsonData();
  
  if (success) {
    console.log('\\n✅ Migración completada. Verificando...');
    await verifyMigration();
  } else {
    console.log('\\n❌ Error en la migración');
    process.exit(1);
  }
}

run();