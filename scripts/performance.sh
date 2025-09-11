#!/bin/bash

# Performance Optimization Script for Fedepalma 2025 Voice Bot
# This script runs performance checks and optimizations

echo "🚀 Iniciando optimización de rendimiento..."

# 1. Bundle Analysis
echo "📊 Analizando tamaño del bundle..."
npm run build

# 2. Type checking
echo "🔍 Verificando tipos TypeScript..."
npm run type-check

# 3. Linting
echo "🧹 Ejecutando linter..."
npm run lint

# 4. Performance audit
echo "⚡ Auditando rendimiento..."
if command -v lighthouse &> /dev/null; then
    lighthouse http://localhost:3000 --output=json --output-path=./performance-report.json --chrome-flags="--headless"
else
    echo "⚠️  Lighthouse no está instalado. Instálalo con: npm install -g @lhci/cli lighthouse"
fi

# 5. Bundle size check
echo "📦 Verificando tamaño de archivos..."
find .next/static -name "*.js" -exec du -h {} + | sort -hr | head -10

echo "✅ Optimización completada!"
echo "📈 Revisa los reportes generados para métricas detalladas."