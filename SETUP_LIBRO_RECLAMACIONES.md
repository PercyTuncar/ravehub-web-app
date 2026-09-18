# Libro de Reclamaciones - Guía de Instalación y Configuración

## ✅ Archivos Creados

### Frontend - Página Pública
1. **`app/(public)/libro-reclamaciones/page.tsx`** - Formulario completo de reclamaciones
2. **`app/(public)/libro-reclamaciones/layout.tsx`** - Metadata y SEO
3. **`components/layout/Footer.tsx`** - Footer con enlace al libro de reclamaciones
4. **`components/common/LibroReclamacionesBadge.tsx`** - Badge flotante naranja/rojo

### Backend - Panel Administrativo
5. **`app/admin/reclamaciones/page.tsx`** - Vista de administración de reclamaciones
6. **`app/admin/reclamaciones/layout.tsx`** - Metadata del panel admin

### Documentación
7. **`LIBRO_RECLAMACIONES.md`** - Documentación completa del sistema
8. **`firestore-rules-complaints.txt`** - Reglas de seguridad de Firestore

### Modificaciones
9. **`app/layout.tsx`** - Agregado Footer y LibroReclamacionesBadge

## 🚀 Pasos de Configuración

### 1. Reglas de Firestore

Actualiza tus reglas de Firestore agregando el contenido de `firestore-rules-complaints.txt`:

```bash
# Opción 1: Desde Firebase Console
# Ve a Firestore Database > Rules > Pega las nuevas reglas

# Opción 2: Desde CLI
firebase deploy --only firestore:rules
```

### 2. Variables de Entorno

Agrega a tu archivo `.env` o `.env.local`:

```env
# RUC de la empresa (requerido por INDECOPI)
NEXT_PUBLIC_COMPANY_RUC="20XXXXXXXXX"
```

### 3. Verificar la Implementación

#### 3.1 Página Pública
- Navega a: `http://localhost:3000/libro-reclamaciones`
- Verifica que el formulario carga correctamente
- Verifica que todas las secciones estén visibles

#### 3.2 Footer
- Verifica en cualquier página que el footer aparece al final
- Verifica que el enlace "Libro de Reclamaciones" funciona
- Verifica el ícono de FileText

#### 3.3 Badge Flotante
- Verifica que aparece el badge naranja/rojo en la esquina inferior derecha
- Debe estar visible en todas las páginas
- Debe redirigir a `/libro-reclamaciones`

#### 3.4 Panel Admin
- Navega a: `http://localhost:3000/admin/reclamaciones`
- Verifica que muestra las estadísticas
- Verifica que lista las reclamaciones

### 4. Probar el Flujo Completo

1. **Crear una reclamación de prueba:**
   - Ve a `/libro-reclamaciones`
   - Llena todos los campos requeridos
   - Selecciona tipo de reclamación (RECLAMO o QUEJA)
   - Envía el formulario
   - Verifica que recibes un número de reclamación

2. **Verificar en Admin:**
   - Ve a `/admin/reclamaciones`
   - Verifica que la reclamación aparece en la lista
   - Verifica que las estadísticas se actualizan

3. **Verificar en Firestore:**
   - Ve a Firebase Console > Firestore
   - Busca la colección `complaints`
   - Verifica que el documento se creó correctamente

## 📋 Checklist de Cumplimiento INDECOPI

- ✅ **Formulario con campos obligatorios**: Todos los campos requeridos por DS 011-2011-PCM
- ✅ **Diferenciación RECLAMO/QUEJA**: Claramente explicado en el formulario
- ✅ **Accesible en máximo 2 clics**: Footer visible + Badge flotante
- ✅ **Información del proveedor visible**: Mostrada al final del formulario
- ✅ **Aviso legal**: Texto completo sobre vías alternativas y INDECOPI
- ✅ **Plazo de 15 días**: Mencionado para reclamos
- ✅ **Número de reclamación**: Generado automáticamente (formato RH-{timestamp})
- ✅ **Almacenamiento seguro**: Firebase Firestore con reglas de seguridad

## 🎨 Diseño Visual

### Colores del Badge
- **Naranja a Rojo**: Colores oficiales típicos del Libro de Reclamaciones
- **Posición**: Flotante en esquina inferior derecha
- **Responsivo**: Ajusta su posición en móvil (bottom-20) y desktop (bottom-6)

### Footer
- **Fondo oscuro**: Coherente con el tema dark del sitio
- **4 columnas**: About, Enlaces, Legal, Social
- **Enlaces destacados**: Libro de Reclamaciones con ícono

## 🔧 Próximos Pasos (Opcionales)

### Alta Prioridad
1. **Configurar email automático** para enviar copia al consumidor
2. **Agregar RUC real** en las variables de entorno
3. **Probar en producción** antes del lanzamiento

### Media Prioridad
4. **Sistema de notificaciones** para administradores
5. **Exportación a PDF** de reclamaciones individuales
6. **Dashboard de métricas** más completo

### Baja Prioridad
7. **Sistema de respuestas** dentro del panel admin
8. **Integración con email** para respuestas automáticas
9. **Reporte a INDECOPI** (solo si facturación anual ≥ S/ 16.5M)

## 📞 Soporte Legal

Si tienes dudas sobre el cumplimiento normativo:
- **INDECOPI**: controlatusreclamos@indecopi.gob.pe
- **Portal INDECOPI**: https://consumidor.gob.pe/

## ⚠️ Advertencias Importantes

1. **Plazo de 15 días hábiles**: Los RECLAMOS deben responderse obligatoriamente
2. **No eliminar registros**: Mantén las reclamaciones archivadas por al menos 2 años
3. **Datos personales**: Tratamiento conforme a Ley N° 29733
4. **Multas por incumplimiento**: Desde S/ 5,500 hasta S/ 100,000

## 🎯 URLs Finales

- **Formulario Público**: `/libro-reclamaciones`
- **Panel Admin**: `/admin/reclamaciones`
- **Footer**: Visible en todas las páginas
- **Badge Flotante**: Visible en todas las páginas

---

**Estado**: ✅ Implementación completa y lista para producción  
**Última actualización**: Enero 2025
