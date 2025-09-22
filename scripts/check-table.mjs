import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTableStructure() {
  try {
    // Obtener estructura de la tabla
    console.log('🔍 Verificando estructura de la tabla documents...\n');
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Columnas actuales en la tabla documents:');
      Object.keys(data[0]).forEach(column => {
        console.log(`   - ${column}`);
      });
      
      console.log(`\n📊 Total de documentos en la tabla: ${data.length}`);
    } else {
      console.log('📋 La tabla está vacía. Vamos a verificar con una consulta de metadatos...');
      
      // Intentar insertar un documento de prueba para ver el error exacto
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: 'test',
          content: 'test',
          category: 'test'
        });
      
      if (insertError) {
        console.log('💡 Error de inserción (para ver columnas válidas):');
        console.log(insertError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkTableStructure();