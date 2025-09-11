import { z } from 'zod';

// Schema de validación para variables de entorno
const envSchema = z.object({
  // Deepgram STT API
  DEEPGRAM_API_KEY: z.string().min(1, 'DEEPGRAM_API_KEY es requerido'),

  // Eleven Labs TTS API
  ELEVEN_LABS_API_KEY: z.string().min(1, 'ELEVEN_LABS_API_KEY es requerido'),

  // OpenAI (solo para embeddings)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY es requerido'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY es requerido'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY es requerido'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET debe tener al menos 32 caracteres'),

  // Deployment
  VERCEL_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL debe ser una URL válida'),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

// Función para validar variables de entorno
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Variables de entorno inválidas en desarrollo:', error);
      // En desarrollo, crear un objeto con valores dummy para continuar
      return createDevelopmentEnv();
    } else {
      console.error('❌ Variables de entorno inválidas en producción:', error);
      throw new Error('Configuración de entorno inválida');
    }
  }
}

// Crear variables dummy para desarrollo
function createDevelopmentEnv() {
  return {
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY || 'dummy_deepgram_key',
    ELEVEN_LABS_API_KEY:
      process.env.ELEVEN_LABS_API_KEY || 'dummy_elevenlabs_key',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'dummy_openai_key',
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://dummy-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key',
    SUPABASE_SERVICE_KEY:
      process.env.SUPABASE_SERVICE_KEY || 'dummy_service_key',
    JWT_SECRET:
      process.env.JWT_SECRET || 'dummy_jwt_secret_development_only_32chars',
    SESSION_SECRET:
      process.env.SESSION_SECRET ||
      'dummy_session_secret_development_only_32chars',
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') ||
      'development',
  };
}

// Tipo inferido de las variables validadas
export type Env = z.infer<typeof envSchema>;

// Exportar variables validadas
export const env = validateEnv();