require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSearch() {
  console.log('🔧 Debug de búsqueda...');
  
  // Primero verificar que los documentos tengan embeddings
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, title, embedding')
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Documentos en base de datos: ${docs.length}`);
  docs.forEach(doc => {
    console.log(`  - ${doc.title}: embedding ${doc.embedding ? 'SÍ' : 'NO'}`);
  });
  
  // Probar la función search_documents con un vector ficticio
  console.log('\\n🧪 Probando función SQL...');
  const fakeEmbedding = new Array(1536).fill(0.1);
  
  const { data: searchResults, error: searchError } = await supabase.rpc('search_documents', {
    query_embedding: fakeEmbedding,
    match_threshold: 0.1,
    match_count: 3,
    filter_category: null
  });
  
  if (searchError) {
    console.error('❌ Error en función SQL:', searchError);
  } else {
    console.log(`✅ Función SQL funciona: ${searchResults.length} resultados`);
  }
}

debugSearch().catch(console.error);