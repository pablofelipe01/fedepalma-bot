require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectSQL() {
  console.log('🔧 Probando SQL directo...');
  
  // Probar una consulta simple sin función personalizada
  const fakeEmbedding = new Array(1536).fill(0.1);
  
  // Usar sintaxis SQL directa para similarity search
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, content, category')
    .limit(3);
  
  if (error) {
    console.error('❌ Error SQL básico:', error);
    return;
  }
  
  console.log(`✅ SQL básico funciona: ${data.length} documentos`);
  data.forEach(doc => {
    console.log(`  - ${doc.title} (${doc.category})`);
  });
  
  // Ahora probar búsqueda por texto simple
  const { data: textSearch, error: textError } = await supabase
    .from('documents')
    .select('*')
    .textSearch('content', 'cóctel');
  
  if (textError) {
    console.error('❌ Error búsqueda texto:', textError);
  } else {
    console.log(`\\n🔍 Búsqueda por texto 'cóctel': ${textSearch.length} resultados`);
    textSearch.forEach(doc => {
      console.log(`  - ${doc.title}: ${doc.content.substring(0, 100)}...`);
    });
  }
}

testDirectSQL().catch(console.error);