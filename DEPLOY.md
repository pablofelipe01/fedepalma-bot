# Guía de Despliegue - Fedepalma 2025 Voice Bot

## 🚀 Despliegue a Vercel (Staging)

### Prerequisitos
- Cuenta de Vercel
- Repositorio en GitHub
- Variables de entorno configuradas

### Paso 1: Preparar el repositorio
```bash
# Commitear todos los cambios
git add .
git commit -m "feat: landing page mejorada y configuración de deploy"
git push origin main
```

### Paso 2: Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com) y conecta tu cuenta de GitHub
2. Importa el repositorio `bot-fedepalma2025`
3. Configura las variables de entorno:

```env
# Obligatorias para producción
DEEPGRAM_API_KEY=your_deepgram_key
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_min_32_chars

# Opcionales
NEXT_PUBLIC_APP_URL=https://bot-fedepalma2025.vercel.app
NODE_ENV=production
```

### Paso 3: Configurar dominio
- Vercel asignará automáticamente un dominio como `bot-fedepalma2025.vercel.app`
- Opcionalmente, configurar dominio personalizado

### Paso 4: Verificar despliegue
1. Comprobar que la PWA se instala correctamente
2. Verificar metadatos SEO con herramientas como:
   - [Google PageSpeed Insights](https://pagespeed.web.dev/)
   - [SEO Site Checkup](https://seositecheckup.com/)
   - [PWA Builder](https://www.pwabuilder.com/)

## 📊 Optimización de Performance

### Ejecutar auditoría local
```bash
./scripts/performance.sh
```

### Métricas objetivo
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Total Blocking Time**: < 200ms

### Optimizaciones implementadas
- ✅ Preconnect a APIs externas
- ✅ DNS prefetch para recursos
- ✅ Compresión de imágenes
- ✅ Lazy loading de componentes
- ✅ Tree shaking automático
- ✅ Bundle splitting

## 🔍 SEO y Metadatos

### Verificaciones post-deploy
1. **Robots.txt**: `https://tu-dominio.vercel.app/robots.txt`
2. **Sitemap**: `https://tu-dominio.vercel.app/sitemap.xml`
3. **Manifest**: `https://tu-dominio.vercel.app/manifest.json`
4. **Open Graph**: Usar [Open Graph Preview](https://www.opengraph.xyz/)

### Keywords optimizadas
- Fedepalma, Congreso palma de aceite
- Voice bot, Asistente de voz
- Sector palmero, HOPO, OxG, RSPO
- Innovación agrícola, Colombia

## 🔧 Troubleshooting

### ✅ Errores resueltos
1. **Function Runtimes Error**: ✅ Corregido - Removida configuración incorrecta de `functions.runtime` en vercel.json
2. **Turbopack Deprecation**: ✅ Corregido - Migrado de `experimental.turbo` a `turbopack` en next.config.ts
3. **Build Success**: ✅ Verificado - Build local y producción funcionando correctamente

### Errores comunes restantes
1. **Environment variables**: Verificar en Vercel dashboard que todas las variables estén configuradas
2. **PWA issues**: Verificar manifest.json y service worker en production

### Logs y debugging
```bash
# Logs de Vercel
vercel logs [deployment-url]

# Build local para debugging
npm run build
npm run start
```

## 📱 Pruebas PWA

### En móviles
1. Abrir en Chrome/Safari móvil
2. Verificar prompt de instalación
3. Instalar y probar funcionalidad offline
4. Comprobar iconos y splash screen

### En desktop
1. Chrome → Más herramientas → Crear acceso directo
2. Verificar que abre como app independiente

## ⚡ Monitoreo post-deploy

### Herramientas recomendadas
- **Vercel Analytics**: Métricas de performance
- **Google Search Console**: SEO y indexación
- **Google Analytics**: Tráfico y comportamiento
- **Lighthouse CI**: Auditorías continuas

### Alertas a configurar
- Errores de build
- Caídas de performance
- Problemas de SEO
- Fallos de APIs

---

## 🎯 Next Steps (Fase 2)

Una vez validado el despliegue inicial:
1. Implementar captura de audio (WebRTC)
2. Integrar APIs de STT/TTS
3. Conectar base de conocimientos
4. Añadir analíticas y monitoreo
5. Optimizar para producción

---

**Estado actual**: ✅ Landing page optimizada, PWA configurada, lista para deploy staging