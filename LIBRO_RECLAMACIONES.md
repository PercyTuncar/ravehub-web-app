# Libro de Reclamaciones - Implementación

## Descripción General

Implementación del **Libro de Reclamaciones Virtual** requerido por INDECOPI para cumplir con el Código de Protección y Defensa del Consumidor (Ley N° 29571) y su Reglamento (D.S. N° 011-2011-PCM).

## Marco Legal

### Normativa Aplicable
- **Ley N° 29571**: Código de Protección y Defensa del Consumidor
- **D.S. N° 011-2011-PCM**: Reglamento del Libro de Reclamaciones
- **D.S. N° 101-2022-PCM**: Modificaciones al reglamento
- **Ley N° 31435**: Plazo de respuesta de 15 días hábiles improrrogables

### Obligaciones del Proveedor
1. **Contar con Libro de Reclamaciones** (físico o virtual)
2. **Exhibir el aviso** en lugar visible
3. **Acceso en máximo 2 clics** desde la página principal
4. **Responder reclamos en 15 días hábiles** (improrrogable)
5. **Reportar a INDECOPI** (empresas con ingresos ≥ S/ 16,500,000)

## Implementación Técnica

### Estructura de Archivos

```
app/
├── (public)/
│   └── libro-reclamaciones/
│       ├── layout.tsx          # Metadata SEO
│       └── page.tsx            # Formulario completo
└── admin/
    └── reclamaciones/
        ├── layout.tsx          # Metadata admin
        └── page.tsx            # Panel administrativo

components/
└── layout/
    └── Footer.tsx              # Footer con enlace visible
```

### Campos del Formulario (Conforme a Anexo I DS 011-2011-PCM)

#### I. Identificación del Consumidor
- Nombre completo *
- Tipo de documento (DNI, CE, Pasaporte) *
- Número de documento *
- Dirección *
- Teléfono *
- Email *

#### II. Identificación del Bien o Servicio
- Tipo (Producto/Servicio) *
- Monto reclamado (S/) *
- Descripción del bien/servicio *

#### III. Detalle de la Reclamación
- Tipo de reclamación:
  - **RECLAMO**: Disconformidad con producto/servicio (requiere respuesta)
  - **QUEJA**: Disconformidad con atención al cliente (no requiere respuesta)
- Detalle completo de la reclamación *

#### IV. Pedido del Consumidor
- Solución solicitada *

### Almacenamiento

Los datos se guardan en Firebase Firestore en la colección `complaints`:

```typescript
{
  claimNumber: string,          // Formato: RH-{timestamp}
  fullName: string,
  email: string,
  phone: string,
  documentType: 'DNI' | 'CE' | 'Pasaporte',
  documentNumber: string,
  address: string,
  goodType: 'product' | 'service',
  amount: string,
  description: string,
  claimType: 'reclamo' | 'queja',
  detail: string,
  request: string,
  status: 'pending' | 'in_progress' | 'resolved',
  createdAt: Timestamp,
  provider: {
    businessName: 'Ravehub',
    ruc: string,
    address: string
  }
}
```

## Características Principales

### 1. Cumplimiento Normativo ✅
- ✅ Formulario con todos los campos obligatorios según DS 011-2011-PCM
- ✅ Diferenciación clara entre RECLAMO y QUEJA
- ✅ Información del proveedor visible
- ✅ Aviso legal sobre no impedimento de otras vías
- ✅ Plazo de 15 días hábiles mencionado

### 2. Accesibilidad ✅
- ✅ Enlace visible en el footer (máximo 2 clics desde cualquier página)
- ✅ Icono distintivo (FileText) para fácil identificación
- ✅ Diseño responsive (móvil y desktop)

### 3. Experiencia de Usuario
- ✅ Formulario guiado con secciones claras
- ✅ Validación en tiempo real (Zod + React Hook Form)
- ✅ Mensajes de ayuda contextuales
- ✅ Confirmación con número de reclamación
- ✅ Notificación de plazos de respuesta

### 4. Panel Administrativo
- ✅ Vista de todas las reclamaciones
- ✅ Filtrado por estado (Pendiente, En Proceso, Resuelto)
- ✅ Estadísticas en tiempo real
- ✅ Alerta de reclamos que requieren respuesta

## URLs de Acceso

### Público
- **Formulario**: `/libro-reclamaciones`
- **Footer**: Visible en todas las páginas con enlace directo

### Administrativo
- **Panel de Gestión**: `/admin/reclamaciones`

## Flujo de Uso

### Para Consumidores
1. Acceder desde el footer o directamente a `/libro-reclamaciones`
2. Completar el formulario con todos los datos requeridos
3. Seleccionar tipo de reclamación (RECLAMO o QUEJA)
4. Enviar y recibir número de reclamación
5. Esperar respuesta (15 días hábiles para RECLAMOS)

### Para Administradores
1. Acceder a `/admin/reclamaciones`
2. Ver listado completo de reclamaciones
3. Identificar reclamos que requieren respuesta urgente
4. Gestionar estados (Pendiente → En Proceso → Resuelto)
5. Responder por correo electrónico dentro del plazo legal

## Consideraciones Importantes

### Plazos Legales
- **RECLAMOS**: Requieren respuesta en **15 días hábiles improrrogables**
- **QUEJAS**: No requieren respuesta obligatoria

### Datos Sensibles
- Los datos personales se tratan conforme a la Ley N° 29733 (Protección de Datos Personales)
- El usuario acepta explícitamente el tratamiento de sus datos

### Sanciones por Incumplimiento
- No contar con Libro de Reclamaciones: Multa de hasta 55 UIT
- No exhibir el aviso: Multa administrativa
- No responder en plazo: Multa de hasta 100 UIT

## Variables de Entorno Requeridas

```env
# En .env o variables de entorno
NEXT_PUBLIC_COMPANY_RUC="20XXXXXXXXX"  # RUC de la empresa
```

## Mejoras Futuras Recomendadas

1. **Email Automático**
   - Enviar copia del reclamo al consumidor
   - Notificar a administradores de nuevos reclamos
   - Recordatorios de plazos próximos a vencer

2. **Exportación**
   - Exportar a PDF individual (para el consumidor)
   - Exportar registro completo para reportes a INDECOPI
   - Generación de estadísticas mensuales

3. **Sistema de Respuestas**
   - Editor para redactar respuestas desde el panel admin
   - Envío automático de respuestas por email
   - Historial de comunicaciones

4. **Integración INDECOPI**
   - Reporte automático para empresas con ingresos ≥ S/ 16.5M
   - Conexión con API de INDECOPI (si disponible)

## Referencias

- [INDECOPI - Libro de Reclamaciones](https://consumidor.gob.pe/libro-de-reclamaciones/)
- [Ley N° 29571 - Código de Protección al Consumidor](https://www.gob.pe/institucion/indecopi/normas-legales/3462732-decreto-supremo-n-011-2011-pcm)
- [Guía de Libro de Reclamaciones](https://lpderecho.pe/lo-que-debes-saber-del-libro-de-reclamaciones-y-la-intervencion-de-indecopi/)

## Soporte

Para dudas sobre el cumplimiento normativo:
- **INDECOPI**: controlatusreclamos@indecopi.gob.pe
- **Consultas Consumidor**: https://consumidor.gob.pe/

---

**Fecha de Implementación**: Enero 2025  
**Versión**: 1.0  
**Estado**: ✅ Funcional y Conforme a Normativa
