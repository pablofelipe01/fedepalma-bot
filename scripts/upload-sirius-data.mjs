import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('❌ Faltan variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Función para generar embeddings
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

// Función para procesar el JSON de Sirius v2
function processSiriusData(jsonData) {
  const documents = [];
  const sirius = jsonData.sirius_regenerative;
  
  // 1. Información general e identidad
  documents.push({
    title: "Sirius Regenerative - Información General",
    content: `${sirius.identity.brand} (${sirius.identity.legal_name}) es una plataforma de regeneración fundada en ${sirius.identity.founded_year} en ${sirius.identity.hq_city}, ${sirius.identity.country}.

    Sitio web: ${sirius.identity.official_website}
    
    Narrativa: ${sirius.narrative.es}
    
    Narrativa en inglés: ${sirius.narrative.en}
    
    Manifiesto: ${sirius.holistic.manifesto.es}
    
    English Manifesto: ${sirius.holistic.manifesto.en}`,
    source: "sirius-regenerative"
  });

  // 2. Filosofía y Toque Sirius
  if (sirius.holistic) {
    let holisticContent = "";
    
    if (sirius.holistic.toque_sirius) {
      holisticContent += `Toque Sirius: ${sirius.holistic.toque_sirius.es}\n\n`;
      holisticContent += `Sirius Touch: ${sirius.holistic.toque_sirius.en}\n\n`;
      
      if (sirius.holistic.toque_sirius.micro_practices) {
        holisticContent += `Micro-prácticas del Toque Sirius:\n`;
        sirius.holistic.toque_sirius.micro_practices.es.forEach(practice => {
          holisticContent += `- ${practice}\n`;
        });
        holisticContent += `\nMicro-practices:\n`;
        sirius.holistic.toque_sirius.micro_practices.en.forEach(practice => {
          holisticContent += `- ${practice}\n`;
        });
      }
    }
    
    if (sirius.holistic.internal_pyrolysis) {
      holisticContent += `\nPirólisis Interna: ${sirius.holistic.internal_pyrolysis.es}\n`;
      holisticContent += `Internal Pyrolysis: ${sirius.holistic.internal_pyrolysis.en}`;
    }
    
    if (sirius.holistic.campaigns) {
      holisticContent += `\nCampañas:\n`;
      sirius.holistic.campaigns.forEach(campaign => {
        holisticContent += `- ${campaign.name_es} / ${campaign.name_en}\n`;
      });
    }
    
    documents.push({
      title: "Sirius Regenerative - Filosofía y Toque Sirius",
      content: holisticContent,
      source: "sirius-regenerative"
    });
  }

  // 3. Productos y Servicios
  if (sirius.products_services) {
    let productsContent = "Productos y servicios de Sirius Regenerative:\n\n";
    
    if (sirius.products_services.biochar_blends) {
      productsContent += "BIOCHAR BLENDS:\n";
      sirius.products_services.biochar_blends.forEach(product => {
        productsContent += `- ${product.name}: ${product.description_es}\n`;
      });
      productsContent += "\n";
    }
    
    if (sirius.products_services.biologicals) {
      productsContent += "PRODUCTOS BIOLÓGICOS:\n";
      sirius.products_services.biologicals.forEach(product => {
        productsContent += `- ${product.name}: ${product.description_es}\n`;
      });
      productsContent += "\n";
    }
    
    if (sirius.products_services.regenerative_plans) {
      productsContent += "PLANES REGENERATIVOS:\n";
      sirius.products_services.regenerative_plans.forEach(plan => {
        productsContent += `- ${plan.name}: ${plan.description_es}\n`;
      });
      productsContent += "\n";
    }
    
    if (sirius.products_services.consultancy) {
      productsContent += "CONSULTORÍA:\n";
      sirius.products_services.consultancy.forEach(service => {
        productsContent += `- ${service.name}: ${service.description_es}\n`;
      });
    }
    
    documents.push({
      title: "Sirius Regenerative - Productos y Servicios",
      content: productsContent,
      source: "sirius-regenerative"
    });
  }

  // 4. Procesos y Tecnología
  if (sirius.process) {
    let processContent = "Procesos y tecnología de Sirius Regenerative:\n\n";
    
    if (sirius.process.reactors_pyrolysis) {
      processContent += `REACTORES DE PIRÓLISIS:\n${sirius.process.reactors_pyrolysis.description_es}\n\n`;
      if (sirius.process.reactors_pyrolysis.features) {
        processContent += "Características:\n";
        sirius.process.reactors_pyrolysis.features.forEach(feature => {
          processContent += `- ${feature}\n`;
        });
        processContent += "\n";
      }
    }
    
    if (sirius.process.ai_pipeline) {
      processContent += `PIPELINE DE IA (AGENTICS):\n${sirius.process.ai_pipeline.description_es}\n\n`;
      if (sirius.process.ai_pipeline.components) {
        processContent += "Componentes:\n";
        sirius.process.ai_pipeline.components.forEach(component => {
          processContent += `- ${component.name}: ${component.description_es}\n`;
        });
        processContent += "\n";
      }
    }
    
    documents.push({
      title: "Sirius Regenerative - Procesos y Tecnología",
      content: processContent,
      source: "sirius-regenerative"
    });
  }

  // 5. Videos y recursos
  if (sirius.videos && sirius.videos.length > 0) {
    const videosContent = sirius.videos.map(video => 
      `${video.title}: ${video.url} (${video.role})`
    ).join('\n');
    
    documents.push({
      title: "Sirius Regenerative - Videos y Recursos",
      content: `Videos oficiales de Sirius Regenerative:

${videosContent}

Estos videos muestran el manifiesto y procesos de Sirius Regenerative, incluyendo la tecnología de pirólisis y la filosofía regenerativa.`,
      source: "sirius-regenerative"
    });
  }

  // 6. Contacto
  if (sirius.contact) {
    let contactContent = "Información de contacto de Sirius Regenerative:\n\n";
    
    if (sirius.contact.website) contactContent += `Sitio web: ${sirius.contact.website}\n`;
    if (sirius.contact.email) contactContent += `Email: ${sirius.contact.email}\n`;
    if (sirius.contact.phone) contactContent += `Teléfono: ${sirius.contact.phone}\n`;
    if (sirius.contact.social_media) {
      contactContent += "\nRedes sociales:\n";
      Object.entries(sirius.contact.social_media).forEach(([platform, handle]) => {
        contactContent += `- ${platform}: ${handle}\n`;
      });
    }
    
    documents.push({
      title: "Sirius Regenerative - Contacto",
      content: contactContent,
      source: "sirius-regenerative"
    });
  }

  // 7. Lead Generation y Marketing
  if (sirius.lead_gen_snippets || sirius.lead_capture_prompts) {
    let marketingContent = "Información de marketing y generación de leads:\n\n";
    
    if (sirius.lead_gen_snippets) {
      Object.entries(sirius.lead_gen_snippets).forEach(([key, snippet]) => {
        marketingContent += `${key.toUpperCase()}:\n`;
        if (snippet.es) marketingContent += `ES: ${snippet.es}\n`;
        if (snippet.en) marketingContent += `EN: ${snippet.en}\n\n`;
      });
    }
    
    if (sirius.lead_capture_prompts) {
      marketingContent += "PROMPTS DE CAPTURA DE LEADS:\n";
      Object.entries(sirius.lead_capture_prompts).forEach(([key, prompt]) => {
        marketingContent += `${key}: ${prompt}\n`;
      });
    }
    
    documents.push({
      title: "Sirius Regenerative - Marketing y Lead Generation",
      content: marketingContent,
      source: "sirius-regenerative"
    });
  }

  // 8. Testimonios (si existen)
  if (sirius.testimonials && sirius.testimonials.length > 0) {
    const testimonialsContent = sirius.testimonials.map(testimonial => 
      `"${testimonial.quote}" - ${testimonial.author}, ${testimonial.title || testimonial.role}`
    ).join('\n\n');
    
    documents.push({
      title: "Sirius Regenerative - Testimonios",
      content: `Testimonios sobre Sirius Regenerative:

${testimonialsContent}`,
      source: "sirius-regenerative"
    });
  }
  
  return documents;
}

// Función principal
async function uploadSiriusData() {
  console.log('🚀 === INICIANDO CARGA DE DATOS DE SIRIUS ===\n');
  
  try {
    // Leer archivo JSON
    console.log('📄 Leyendo archivo sirius-estructurado-v2.json...');
    const jsonPath = path.join(__dirname, '..', 'data', 'sirius-estructurado-v2.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Archivo no encontrado: ${jsonPath}`);
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ Archivo JSON leído correctamente\n');
    
    // Procesar datos
    console.log('🔄 Procesando datos de Sirius...');
    const documents = processSiriusData(jsonData);
    console.log(`📊 Se crearon ${documents.length} documentos\n`);
    
    // Procesar cada documento
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`📝 Procesando ${i + 1}/${documents.length}: ${doc.title}`);
      
      try {
        // Generar embedding
        console.log('   🧠 Generando embedding...');
        const embedding = await generateEmbedding(doc.content);
        console.log(`   ✅ Embedding generado (dimensión: ${embedding.length})`);
        
        // Generar ID único para el documento
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const sanitizedTitle = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const documentId = `sirius_${sanitizedTitle}_${timestamp}_${randomId}`;
        
        // Subir a Supabase
        console.log('   📤 Subiendo a Supabase...');
        const { error } = await supabase
          .from('documents')
          .insert({
            id: documentId,
            title: doc.title,
            content: doc.content,
            category: doc.source,
            embedding: `[${embedding.join(',')}]`
          });
        
        if (error) {
          console.error('   ❌ Error al subir:', error);
        } else {
          console.log('   ✅ Documento subido exitosamente');
        }
        
        // Pausa para evitar rate limits
        if (i < documents.length - 1) {
          console.log('   ⏳ Pausa de 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`   ❌ Error procesando documento ${i + 1}:`, error.message);
      }
      
      console.log(''); // Línea en blanco
    }
    
    console.log('🎉 ¡Proceso completado exitosamente!');
    console.log(`📊 Total de documentos procesados: ${documents.length}`);
    
  } catch (error) {
    console.error('❌ Error en el proceso principal:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
uploadSiriusData().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});