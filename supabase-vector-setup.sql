-- Enable the vector extension (if not already enabled)-- Enable the vector extension (if not already enabled)-- Script para configurar búsqueda vectorial en Supabase

CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;-- Ejecutar en el editor SQL de Supabase

-- Add embedding column to documents table (if not already exists)

ALTER TABLE documents 

ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add embedding column to documents table (if not already exists)-- 1. Habilitar extensión vector (si no está habilitada)

-- Create index for vector similarity search (if not already exists)

CREATE INDEX IF NOT EXISTS documents_embedding_idx ALTER TABLE documents CREATE EXTENSION IF NOT EXISTS vector;

ON documents USING ivfflat (embedding vector_cosine_ops)

WITH (lists = 100);ADD COLUMN IF NOT EXISTS embedding vector(1536);



-- Create function for vector similarity search-- 2. Verificar que la tabla documents tiene la columna embedding

CREATE OR REPLACE FUNCTION search_documents(

  query_embedding vector(1536),-- Create index for vector similarity search (if not already exists)-- Si no existe, la creamos

  similarity_threshold float DEFAULT 0.1,

  match_count int DEFAULT 8CREATE INDEX IF NOT EXISTS documents_embedding_idx ALTER TABLE documents 

)

RETURNS TABLE (ON documents USING ivfflat (embedding vector_cosine_ops)ADD COLUMN IF NOT EXISTS embedding vector(1536);

  id bigint,

  title text,WITH (lists = 100);

  content text,

  source text,-- 3. Crear índice para búsqueda vectorial eficiente

  similarity float

)-- Create function for vector similarity searchCREATE INDEX IF NOT EXISTS documents_embedding_idx 

LANGUAGE SQL

AS $$CREATE OR REPLACE FUNCTION search_documents(ON documents USING ivfflat (embedding vector_cosine_ops) 

  SELECT 

    d.id,  query_embedding vector(1536),WITH (lists = 100);

    d.title,

    d.content,  similarity_threshold float DEFAULT 0.3,

    d.source,

    (1 - (d.embedding <=> query_embedding)) as similarity  match_count int DEFAULT 8-- 4. Crear la función search_documents

  FROM documents d

  WHERE d.embedding IS NOT NULL)CREATE OR REPLACE FUNCTION search_documents(

  AND (1 - (d.embedding <=> query_embedding)) > similarity_threshold

  ORDER BY d.embedding <=> query_embeddingRETURNS TABLE (  query_embedding vector(1536),

  LIMIT match_count;

$$;  id bigint,  similarity_threshold float DEFAULT 0.3,

  title text,  match_count int DEFAULT 8

  content text,)

  source text,RETURNS TABLE (

  similarity float  id text,

)  title text,

LANGUAGE SQL  content text,

AS $$  category text,

  SELECT   similarity float

    d.id,)

    d.title,LANGUAGE plpgsql

    d.content,AS $$

    d.source,BEGIN

    (1 - (d.embedding <=> query_embedding)) as similarity  RETURN QUERY

  FROM documents d  SELECT 

  WHERE d.embedding IS NOT NULL    documents.id,

  AND (1 - (d.embedding <=> query_embedding)) > similarity_threshold    documents.title,

  ORDER BY d.embedding <=> query_embedding    documents.content,

  LIMIT match_count;    documents.category,

$$;    (1 - (documents.embedding <=> query_embedding)) as similarity
  FROM documents
  WHERE documents.embedding IS NOT NULL
    AND (1 - (documents.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Crear función para generar embeddings (opcional, para debugging)
CREATE OR REPLACE FUNCTION get_embedding_sample()
RETURNS vector(1536)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT embedding FROM documents WHERE embedding IS NOT NULL LIMIT 1);
END;
$$;