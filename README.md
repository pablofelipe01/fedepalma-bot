# 🎤 Fedepalma 2025 Voice Bot

Sistema de voz interactivo para el **Congreso Nacional de Cultivadores de Palma de Aceite 2025**.

## ✨ Estado Actual

### ✅ PASO 1.5 - Landing Page y Deploy Inicial (COMPLETADO)

**Implementaciones realizadas:**

🎨 **Landing Page Mejorada**
- Diseño responsive con información completa del congreso
- Características del sistema de voz destacadas
- Información técnica del sector palmero (HOPO, OxG, RSPO)
- Cards informativos sobre funcionalidades

🔍 **SEO Completo**
- Meta tags optimizados para Google y redes sociales
- Open Graph y Twitter Cards configurados
- Sitemap.xml dinámico generado
- Robots.txt con directrices de crawling
- Structured data (JSON-LD) implementado
- Keywords específicos del sector palmero

⚡ **Optimización de Performance**
- Preconnect a APIs externas (Deepgram, ElevenLabs, OpenAI)
- DNS prefetch para recursos críticos
- Compresión y optimización de imágenes
- Bundle splitting automático
- Core Web Vitals optimizados

🚀 **Configuración de Deploy**
- Vercel.json configurado para región São Paulo
- Headers de seguridad implementados
- Variables de entorno estructuradas
- Script de auditoría de performance
- Guía completa de despliegue (DEPLOY.md)

📱 **PWA Avanzada**
- Service worker optimizado
- Manifest con metadatos completos
- Iconos temporales (verde Fedepalma)
- Auto-install prompt mejorado
- Caching estratégico configurado

## Stack Tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **PWA**: next-pwa con service workers
- **Audio**: WebRTC + AudioWorklet
- **STT**: Deepgram Nova-2 (español latinoamericano)
- **TTS**: Eleven Labs Flash v2.5
- **Vector DB**: Supabase con pgvector
- **Embeddings**: OpenAI text-embedding-3-small
- **Deployment**: Vercel Edge Functions

## Desarrollo

### Prerrequisitos

- Node.js 20.x LTS
- npm

### Instalación

```bash
npm install
cp .env.example .env.local
# Configurar las variables de entorno reales
npm run dev
```

### Scripts Disponibles

- `npm run dev` - Servidor de desarrollo con Turbopack
- `npm run build` - Build de producción
- `npm run type-check` - Verificar tipos TypeScript
- `npm run process-docs` - Procesar JSONs del congreso
- `npm run generate-embeddings` - Generar embeddings vectoriales
- `npm run seed-db` - Inicializar base de datos

## Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── api/                      # API Routes
│   │   ├── voice/process/        # Pipeline STT→RAG→TTS
│   │   ├── session/              # Manejo de sesiones
│   │   ├── knowledge/search/     # Búsqueda vectorial
│   │   └── qr/                   # Generación/validación QR
│   ├── voice-bot/[sessionId]/    # Interfaz principal
│   └── admin/qr/                 # Admin para QRs
├── components/
│   ├── voice/                    # Componentes de audio
│   └── ui/                       # Componentes UI reutilizables
├── lib/
│   ├── audio/                    # WebRTC y AudioWorklet
│   ├── api/                      # Clientes externos
│   ├── db/                       # Supabase y vectores
│   └── utils/                    # Utilities generales
├── hooks/                        # Custom React hooks
└── types/                        # Definiciones TypeScript
```

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

## Arquitectura

Sistema voice-to-voice directo sin intermediarios:
Audio → Deepgram STT → Vector Search → Text Response → Eleven Labs TTS → Audio

**Target de latencia**: < 300ms voice-to-voice
# fedepalma-bot
