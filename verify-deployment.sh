#!/bin/bash

# Script para verificar el deployment y performance de /eventos

echo "🔍 VERIFICACIÓN DE DEPLOYMENT Y PERFORMANCE"
echo "==========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SITE_URL="https://www.ravehublatam.com/eventos"

echo "📍 URL: $SITE_URL"
echo ""

# 1. Verificar que el sitio responde
echo "1️⃣ Verificando conectividad..."
STATUS=$(curl -o /dev/null -s -w "%{http_code}" -L $SITE_URL)

if [ "$STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Sitio responde correctamente (HTTP $STATUS)${NC}"
else
    echo -e "${RED}❌ Error: Sitio respondió con HTTP $STATUS${NC}"
fi
echo ""

# 2. Verificar headers de cache
echo "2️⃣ Verificando headers de cache..."
curl -sI -L $SITE_URL | grep -i "cache-control"
curl -sI -L $SITE_URL | grep -i "x-vercel"
echo ""

# 3. Medir tiempo de respuesta
echo "3️⃣ Midiendo tiempo de respuesta..."
TIME=$(curl -o /dev/null -s -w "%{time_total}" -L $SITE_URL)
echo "⏱️  Tiempo total: ${TIME}s"

if (( $(echo "$TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ Excelente tiempo de respuesta (<2s)${NC}"
elif (( $(echo "$TIME < 4.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Tiempo aceptable (2-4s)${NC}"
else
    echo -e "${RED}❌ Tiempo lento (>4s)${NC}"
fi
echo ""

# 4. Verificar tamaño de la respuesta
echo "4️⃣ Verificando tamaño de respuesta..."
SIZE=$(curl -sL $SITE_URL | wc -c)
SIZE_KB=$((SIZE / 1024))
echo "📦 Tamaño HTML: ${SIZE_KB}KB"

if [ "$SIZE_KB" -lt 100 ]; then
    echo -e "${GREEN}✅ Tamaño optimizado (<100KB)${NC}"
elif [ "$SIZE_KB" -lt 200 ]; then
    echo -e "${YELLOW}⚠️  Tamaño aceptable (100-200KB)${NC}"
else
    echo -e "${RED}❌ Tamaño grande (>200KB)${NC}"
fi
echo ""

# 5. Instrucciones para Lighthouse
echo "5️⃣ Para análisis completo de performance, ejecuta:"
echo ""
echo -e "${YELLOW}Chrome DevTools Lighthouse:${NC}"
echo "  1. Abre Chrome DevTools (F12)"
echo "  2. Tab 'Lighthouse'"
echo "  3. Selecciona 'Mobile'"
echo "  4. Selecciona 'Performance'"
echo "  5. Click 'Analyze page load'"
echo ""
echo -e "${YELLOW}Métricas objetivo:${NC}"
echo "  ✅ Performance Score: >90"
echo "  ✅ LCP: <2.5s"
echo "  ✅ FID: <100ms"
echo "  ✅ CLS: <0.1"
echo ""

# 6. Verificar Firebase Console
echo "6️⃣ Verificar en Firebase Console:"
echo "  👉 https://console.firebase.google.com/"
echo "  📊 Firestore → Usage"
echo "  🔍 Buscar reducción en reads (debería ver ~12 reads por página vs ~100 antes)"
echo ""

# 7. Test desde móvil
echo "7️⃣ Test en dispositivo móvil real:"
echo "  📱 Abre la página en tu móvil"
echo "  ⏱️  Mide el tiempo desde que haces clic hasta que ves los eventos"
echo "  🎯 Objetivo: <2 segundos"
echo ""

echo "==========================================="
echo -e "${GREEN}✅ Verificación completada${NC}"
echo ""
echo "📝 Siguiente paso: Revisar métricas en producción y ajustar si es necesario"
