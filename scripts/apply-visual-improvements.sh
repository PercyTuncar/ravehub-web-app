#!/bin/bash

# Script para aplicar mejoras visuales a la página de reventa
# Aplicar efectos glassmorphism y colores dinámicos

FILE="app/(public)/vende-tu-entrada/[slug]/page.tsx"
BACKUP="app/(public)/vende-tu-entrada/[slug]/page.backup.tsx"

echo "🎨 Aplicando mejoras visuales a la página de reventa..."

# Crear backup
cp "$FILE" "$BACKUP"
echo "✅ Backup creado: $BACKUP"

# 1. Agregar imports de color extraction
sed -i "s/import { useAuth } from '@\/lib\/contexts\/AuthContext';/import { useAuth } from '@\/lib\/contexts\/AuthContext';\nimport { EventColorProvider, useEnhancedColorExtraction } from '@\/components\/events\/EventColorContext';\nimport { DynamicBackgroundGradients } from '@\/components\/events\/DynamicBackgroundGradients';/" "$FILE"

# 2. Agregar backdrop-blur-xl a todas las cards
sed -i 's/className="bg-white\/5 border-white\/10"/className="bg-white\/5 border-white\/10 backdrop-blur-xl"/g' "$FILE"

# 3. Mejorar el botón de volver
sed -i 's/className="inline-flex items-center text-gray-400 hover:text-white mb-6"/className="inline-flex items-center text-white\/70 hover:text-white mb-6 transition-colors backdrop-blur-sm bg-white\/5 px-4 py-2 rounded-full border border-white\/10 hover:bg-white\/10"/g' "$FILE"

# 4. Agregar shadow a cards de depreciación
sed -i 's/className={\`\${colors\?\.bg} border \${colors\?\.border}\`}/className={\`\${colors?.bg} border \${colors?.border} backdrop-blur-xl shadow-2xl\`}/g' "$FILE"

# 5. Mejorar botón final
sed -i 's/className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"/className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6 shadow-lg shadow-purple-500\/50 hover:shadow-xl hover:shadow-purple-500\/70 transition-all duration-300"/g' "$FILE"

echo "✅ Cambios aplicados!"
echo ""
echo "📝 CAMBIOS MANUALES PENDIENTES:"
echo "1. Envolver el componente con EventColorProvider"
echo "2. Agregar useEnhancedColorExtraction(event?.mainImageUrl || '')"
echo "3. Agregar <DynamicBackgroundGradients /> en el container principal"
echo "4. Mejorar la estructura de la imagen con overlay glassmorphism"
echo ""
echo "📖 Ver GUIA_MEJORAS_VISUALES_REVENTA.md para detalles completos"
echo ""
echo "🔄 Para revertir: mv $BACKUP $FILE"
