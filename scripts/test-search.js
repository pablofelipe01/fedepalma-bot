require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
  console.log('🔍 Probando búsqueda vectorial...');
  
  // Generar embedding para la consulta
  const query = "a que hora es el coctel de bienvenida?";
  console.log(`📝 Consulta: ${query}`);
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  
  const queryEmbedding = response.data[0].embedding;
  console.log(`🧮 Embedding generado: ${queryEmbedding.length} dimensiones`);
  
  // Usar la función SQL personalizada
  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: 5,
    filter_category: null
  });
  
  if (error) {
    console.error('❌ Error en búsqueda:', error);
    return;
  }
  
  console.log(`📊 Resultados encontrados: ${data.length}`);
  
  data.forEach((doc, i) => {
    console.log(`\\n${i + 1}. ${doc.title}`);
    console.log(`   Categoría: ${doc.category}`);
    console.log(`   Similitud: ${(doc.similarity * 100).toFixed(1)}%`);
    console.log(`   Contenido: ${doc.content.substring(0, 150)}...`);
  });
}

testSearch().catch(console.error);