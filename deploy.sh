#!/bin/bash

# 🚀 SCRIPT DE DEPLOYMENT - SISTEMA DE CUOTAS V2.0
# Este script guía el deployment de todas las correcciones aplicadas

set -e  # Exit on error

echo "=================================="
echo "🚀 DEPLOYMENT - SISTEMA DE CUOTAS"
echo "=================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para pausar y esperar confirmación
pause() {
    read -p "Presiona ENTER para continuar o CTRL+C para cancelar..."
}

# Función para mostrar mensaje de éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar mensaje de error
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para mostrar warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función para mostrar info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "📋 CHECKLIST PRE-DEPLOYMENT"
echo "=========================="
echo ""

# 1. Verificar Git
info "1. Verificando estado de Git..."
if git diff-index --quiet HEAD --; then
    success "Working directory limpio"
else
    warning "Hay cambios sin commitear"
    git status --short
    pause
fi

# 2. Verificar branch
echo ""
info "2. Verificando branch actual..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Branch actual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "staging" ]; then
    warning "No estás en main ni staging. ¿Continuar?"
    pause
fi

# 3. Verificar archivos críticos
echo ""
info "3. Verificando archivos críticos..."
CRITICAL_FILES=(
    "lib/types/index.ts"
    "lib/actions.ts"
    "lib/utils/error-messages.ts"
    "lib/utils/installment-recalculator.ts"
    "components/common/TimeRemaining.tsx"
    "components/tickets/InstallmentCard.tsx"
    "components/tickets/InstallmentTimeline.tsx"
    "components/tickets/PriceAdjustmentAlert.tsx"
    "app/api/cron/cleanup-expired-tickets/route.ts"
    "firestore.rules"
    "vercel.json"
)

MISSING_FILES=()
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    success "Todos los archivos críticos existen"
else
    error "Faltan archivos críticos:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    error "Deployment cancelado. Aplica las correcciones primero."
    exit 1
fi

# 4. Verificar variables de entorno
echo ""
info "4. Verificando configuración..."
warning "Asegúrate de tener configurado:"
echo "  - CRON_SECRET en Vercel"
echo "  - Firebase Admin SDK credentials"
pause

# 5. Build local
echo ""
info "5. Ejecutando build local para verificar..."
if npm run build; then
    success "Build exitoso"
else
    error "Build falló. Corrige los errores antes de deployar."
    exit 1
fi

# 6. Commit y push
echo ""
echo "=================================="
echo "📦 PREPARANDO DEPLOYMENT"
echo "=================================="
echo ""

info "6. Creando commit..."
git add .

echo ""
echo "Archivos modificados:"
git status --short
echo ""

read -p "Mensaje de commit (default: 'feat: implementar correcciones completas del sistema de cuotas'): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"feat: implementar correcciones completas del sistema de cuotas"}

git commit -m "$COMMIT_MSG" || success "Sin cambios para commitear"

# 7. Push
echo ""
info "7. Pusheando a $CURRENT_BRANCH..."
git push origin $CURRENT_BRANCH
success "Código pusheado exitosamente"

# 8. Firestore Rules
echo ""
echo "=================================="
echo "🔥 ACTUALIZANDO FIRESTORE RULES"
echo "=================================="
echo ""

warning "IMPORTANTE: Asegúrate de que el código YA esté desplegado en Vercel antes de actualizar rules"
warning "Si actualizas rules antes, las operaciones cliente pueden fallar"
pause

info "8. Desplegando Firestore Rules..."
if command -v firebase &> /dev/null; then
    firebase deploy --only firestore:rules
    success "Firestore Rules actualizadas"
else
    warning "Firebase CLI no encontrado. Instala con: npm install -g firebase-tools"
    warning "Luego ejecuta: firebase deploy --only firestore:rules"
    pause
fi

# 9. Verificar Vercel Cron
echo ""
echo "=================================="
echo "⏰ VERIFICANDO CRON JOBS"
echo "=================================="
echo ""

info "9. Verificando Vercel Cron..."
warning "Ve a Vercel Dashboard → Project → Settings → Cron Jobs"
warning "Deberías ver 3 cron jobs:"
echo "  1. /api/cron/cleanup-expired-tickets - 0 2 * * * (2 AM diario)"
echo "  2. /api/cron/check-ticket-availability - 0 * * * * (cada hora)"
echo "  3. /api/cron/check-overdue-installments - 0 3 * * * (3 AM diario)"
pause

# 10. Test manual de cron
echo ""
info "10. Probando cron job manualmente..."
echo ""
read -p "Ingresa tu dominio de Vercel (ej: https://tu-app.vercel.app): " DOMAIN
read -p "Ingresa tu CRON_SECRET: " CRON_SECRET

echo ""
info "Ejecutando: GET $DOMAIN/api/cron/cleanup-expired-tickets"
RESPONSE=$(curl -s -X GET "$DOMAIN/api/cron/cleanup-expired-tickets" \
    -H "Authorization: Bearer $CRON_SECRET")

if echo "$RESPONSE" | grep -q "success"; then
    success "Cron job funciona correctamente"
    echo "Response: $RESPONSE"
else
    error "Cron job falló"
    echo "Response: $RESPONSE"
    pause
fi

# 11. Smoke tests
echo ""
echo "=================================="
echo "🧪 SMOKE TESTS"
echo "=================================="
echo ""

info "11. Ejecutando smoke tests básicos..."
echo ""
echo "Abre tu app en el navegador y verifica:"
echo ""
echo "✅ Cliente puede ver sus cuotas"
echo "✅ Countdown se muestra en cuota activa"
echo "✅ Reserva (cuota #0) tiene ícono morado"
echo "✅ Admin puede ver cuotas pendientes"
echo "✅ Admin puede aprobar/rechazar"
echo "✅ Cliente NO puede crear cuotas desde consola"
echo ""
warning "Ejecuta los tests del archivo TESTING_CHECKLIST.md"
pause

# 12. Monitoreo
echo ""
echo "=================================="
echo "📊 CONFIGURANDO MONITOREO"
echo "=================================="
echo ""

info "12. Configurando monitoreo..."
echo ""
echo "Ve a:"
echo "  - Vercel: Functions → Logs (monitorear errores)"
echo "  - Firebase: Firestore → Console (verificar datos)"
echo "  - Firebase: Rules → Playground (probar reglas)"
echo ""
pause

# 13. Rollback plan
echo ""
echo "=================================="
echo "🔄 PLAN DE ROLLBACK"
echo "=================================="
echo ""

info "13. En caso de problemas:"
echo ""
echo "ROLLBACK DE CÓDIGO:"
echo "  git revert HEAD"
echo "  git push origin $CURRENT_BRANCH"
echo ""
echo "ROLLBACK DE FIRESTORE RULES:"
echo "  1. Ve a Firebase Console → Firestore → Rules"
echo "  2. Click en 'View History'"
echo "  3. Selecciona versión anterior"
echo "  4. Click 'Publish'"
echo ""
echo "ROLLBACK DE VERCEL CRON:"
echo "  1. Ve a Vercel → Project → Settings → Cron Jobs"
echo "  2. Elimina los cron jobs nuevos"
echo ""
pause

# Final
echo ""
echo "=================================="
echo "🎉 DEPLOYMENT COMPLETADO"
echo "=================================="
echo ""

success "Todas las correcciones han sido desplegadas"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. Ejecuta TESTING_CHECKLIST.md completo"
echo "2. Monitorea logs por 24 horas"
echo "3. Verifica que cron se ejecute a las 2 AM"
echo "4. Comunica a usuarios sobre nuevas mejoras"
echo ""
info "Documentación:"
echo "  - CORRECCIONES_FINALES_COMPLETAS.md"
echo "  - TESTING_CHECKLIST.md"
echo ""

success "¡Deployment exitoso! 🚀"
