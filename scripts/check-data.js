require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Verificando datos en Supabase...');
  
  // Buscar documentos que contengan "cóctel" o "bienvenida"
  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .or('content.ilike.%cóctel%,content.ilike.%bienvenida%,content.ilike.%coctel%');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Encontrados ${docs.length} documentos con información del cóctel:`);
  
  docs.forEach((doc, i) => {
    console.log(`\\n${i + 1}. ${doc.title}`);
    console.log(`   Categoría: ${doc.category}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Contenido: ${doc.content.substring(0, 200)}...`);
    console.log(`   Tiene embedding: ${doc.embedding ? 'Sí' : 'No'}`);
  });
}

checkData();