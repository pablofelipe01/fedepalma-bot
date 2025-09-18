require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
  console.error('❌ Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Función para generar embedding
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generando embedding:', error);
    throw error;
  }
}

// Función para actualizar embeddings de todos los documentos
async function generateAllEmbeddings() {
  try {
    console.log('🚀 Iniciando generación de embeddings...');
    
    // Obtener todos los documentos sin embedding
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, content')
      .is('embedding', null);
    
    if (error) {
      console.error('Error obteniendo documentos:', error);
      return false;
    }
    
    if (!documents || documents.length === 0) {
      console.log('✅ Todos los documentos ya tienen embeddings');
      return true;
    }
    
    console.log(`📄 Encontrados ${documents.length} documentos sin embeddings`);
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`\n🔄 Procesando documento ${i + 1}/${documents.length}: ${doc.title}`);
      
      try {
        // Combinar título y contenido para mejor contexto
        const textToEmbed = `${doc.title}\n\n${doc.content}`;
        console.log(`   📝 Texto a procesar: ${textToEmbed.length} caracteres`);
        
        // Generar embedding
        const embedding = await generateEmbedding(textToEmbed);
        console.log(`   🧮 Embedding generado: ${embedding.length} dimensiones`);
        
        // Actualizar documento con embedding
        const { error: updateError } = await supabase
          .from('documents')
          .update({ embedding })
          .eq('id', doc.id);
        
        if (updateError) {
          console.error(`   ❌ Error actualizando documento ${doc.id}:`, updateError);
        } else {
          console.log(`   ✅ Documento actualizado exitosamente`);
        }
        
        // Pequeña pausa para no sobrecargar la API de OpenAI
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error procesando documento ${doc.id}:`, error);
      }
    }
    
    console.log('\n🎉 Generación de embeddings completada');
    return true;
    
  } catch (error) {
    console.error('❌ Error en generación de embeddings:', error);
    return false;
  }
}

// Función para verificar embeddings
async function verifyEmbeddings() {
  try {
    console.log('\n🔍 Verificando embeddings...');
    
    const { count: totalDocs, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error contando documentos:', countError);
      return;
    }
    
    const { count: embeddedDocs, error: embeddedError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);
    
    if (embeddedError) {
      console.error('Error contando documentos con embeddings:', embeddedError);
      return;
    }
    
    console.log(`📊 Total de documentos: ${totalDocs}`);
    console.log(`🧮 Documentos con embeddings: ${embeddedDocs}`);
    console.log(`📋 Documentos sin embeddings: ${totalDocs - embeddedDocs}`);
    
    if (embeddedDocs === totalDocs) {
      console.log('✅ Todos los documentos tienen embeddings');
    } else {
      console.log('⚠️  Algunos documentos aún no tienen embeddings');
    }
    
  } catch (error) {
    console.error('Error en verificación:', error);
  }
}

// Ejecutar script
async function run() {
  console.log('🧮 Iniciando proceso de embeddings...');
  
  await verifyEmbeddings();
  
  const success = await generateAllEmbeddings();
  
  if (success) {
    console.log('\n✅ Proceso completado. Verificando resultado...');
    await verifyEmbeddings();
  } else {
    console.log('\n❌ Error en el proceso');
    process.exit(1);
  }
}

run();