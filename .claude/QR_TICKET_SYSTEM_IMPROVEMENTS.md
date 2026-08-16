# Sistema de Tickets con QR - Mejoras Implementadas

## 🎯 Resumen de Mejoras

### 1. **Selector de Tipo de Archivo en Modal de Admin**

El admin ahora puede elegir entre dos tipos de archivos al subir tickets:

#### Tipos:
- **📷 Código QR**: Imagen cuadrada (1:1) que se mostrará directamente en el ticket
- **📄 Archivo completo**: PDF o imagen del ticket completo para descargar

#### Características:
- Radio buttons con descripciones claras
- Validación de tipo de archivo según selección
- Indicador visual del tipo de cada archivo subido
- Contador muestra "QR" o "Archivo" junto al nombre

```
┌─────────────────────────────────────────┐
│ Tipo de archivo a subir                 │
│ ○ Código QR                             │
│   Imagen cuadrada que se mostrará       │
│ ● Archivo completo                      │
│   PDF o imagen para descargar           │
└─────────────────────────────────────────┘
```

### 2. **Reorganización del Diseño del Ticket**

#### Elementos Eliminados (Duplicados):
- ❌ Fecha (ya se muestra en el header del ticket)
- ❌ Lugar (ya se muestra en el header del ticket)

#### Nueva Estructura:
```
┌────────────────────────────────────────────────┐
│ [Header con Imagen - Fecha y Lugar aquí]      │
│ ○○○○○○○○○○○○○○○○○○○○○○○○ (Perforación)        │
│                                                │
│ ┌─────────────────┐  ┌──────────────────┐    │
│ │ Información     │  │   QR CODE        │    │
│ │                 │  │  [Imagen 1:1]    │    │
│ │ 👤 Titular      │  │                  │    │
│ │ 🎫 Zona         │  │   132x132px      │    │
│ │ #️⃣ Orden       │  │                  │    │
│ └─────────────────┘  └──────────────────┘    │
│                                                │
│ [Botón: Ver Ticket / Descargar Ticket]        │
└────────────────────────────────────────────────┘
```

### 3. **QR Code Dinámico con Estados**

#### Estados del QR:

**A) QR Difuminado (Placeholder)**
- Se muestra cuando:
  - El ticket aún no está disponible (fecha futura)
  - No se ha pagado completamente
  - No se ha subido archivo
- Diseño: Patrón QR simplificado con blur
- Icono de reloj superpuesto

**B) QR Real**
- Se muestra cuando:
  - El admin subió un archivo tipo "QR"
  - El ticket está pagado
  - La fecha de descarga ha llegado
  - El usuario hace click en "Ver Ticket"
- Tamaño: 128x128px (más grande que antes)
- Imagen real del QR subido por el admin

### 4. **Botones Dinámicos según Tipo de Archivo**

#### Para Archivos tipo QR:
```typescript
Estados del botón:
1. "Completa el pago para ver el ticket" (no pagado)
2. "Disponible próximamente" (fecha futura)
3. "Ver Ticket #X" (disponible, QR oculto)
4. "Ocultar Ticket" (QR visible)
```

**Comportamiento:**
- Click alterna entre mostrar/ocultar el QR
- No abre nueva ventana
- QR se muestra en el mismo cuadrado

#### Para Archivos tipo File:
```typescript
Estados del botón:
1. "Completa el pago para descargar" (no pagado)
2. "Disponible próximamente" (fecha futura)
3. "Descargar Ticket #X" (disponible)
```

**Comportamiento:**
- Click abre el archivo en nueva pestaña
- Funciona como descarga tradicional
- QR permanece difuminado (placeholder)

### 5. **Estructura de Datos Actualizada**

#### Transaction Document:
```typescript
{
  ticketsUploadedFiles: [
    {
      fileUrl: "https://storage.../qr-code.png",
      fileName: "qr-code.png",
      uploadedBy: "adminId",
      uploadedAt: "2026-08-15T10:00:00Z",
      mimeType: "image/png",
      fileType: "qr", // 🆕 NUEVO CAMPO
      availableDate: "2026-08-20"
    },
    {
      fileUrl: "https://storage.../ticket.pdf",
      fileName: "ticket-complete.pdf",
      uploadedBy: "adminId",
      uploadedAt: "2026-08-15T10:00:00Z",
      mimeType: "application/pdf",
      fileType: "file", // 🆕 NUEVO CAMPO
      availableDate: "2026-08-20"
    }
  ]
}
```

### 6. **Flujo Completo del Sistema**

#### Flujo para Ticket con QR:
```
1. Admin selecciona "Código QR"
   ↓
2. Admin sube imagen 500x500px (PNG/JPG)
   → Sistema valida que sea imagen
   ↓
3. Se guarda con fileType: "qr"
   ↓
4. Usuario ve ticket con QR difuminado
   → Botón: "Disponible próximamente" (deshabilitado)
   ↓
5. Llega fecha de descarga
   → Botón: "Ver Ticket #1" (habilitado)
   ↓
6. Usuario hace click
   → QR real se muestra en el cuadrado
   → Botón cambia a "Ocultar Ticket"
   ↓
7. Usuario hace click nuevamente
   → QR se oculta
   → Botón vuelve a "Ver Ticket #1"
```

#### Flujo para Ticket con Archivo:
```
1. Admin selecciona "Archivo completo"
   ↓
2. Admin sube PDF o imagen del ticket
   → Sistema valida PDF o imagen
   ↓
3. Se guarda con fileType: "file"
   ↓
4. Usuario ve ticket con QR difuminado
   → Botón: "Disponible próximamente" (deshabilitado)
   ↓
5. Llega fecha de descarga
   → Botón: "Descargar Ticket #1" (habilitado)
   ↓
6. Usuario hace click
   → Abre PDF/imagen en nueva pestaña
   → QR permanece difuminado
```

### 7. **Validaciones Implementadas**

#### En el Modal de Admin:
- ✅ Para tipo "QR": Solo acepta imágenes
- ✅ Para tipo "File": Acepta PDF o imágenes
- ✅ Debe subir exactamente N archivos (N = cantidad de tickets)
- ✅ Cada archivo puede ser de tipo diferente

#### En la Vista del Usuario:
- ✅ QR solo se muestra si es tipo "qr"
- ✅ QR solo se muestra si está pagado
- ✅ QR solo se muestra si la fecha llegó
- ✅ QR solo se muestra si el usuario hizo click
- ✅ Estado independiente para cada ticket

### 8. **Mejoras de UX/UI**

#### Tamaño del QR:
- **Antes**: 80x80px (muy pequeño)
- **Ahora**: 128x128px (más grande y legible)

#### Diseño del Placeholder:
- Patrón QR simplificado en gris claro
- Efecto blur cuando no está disponible
- Icono de reloj superpuesto para indicar estado

#### Información en el Ticket:
- **Eliminado**: Fecha y Lugar duplicados
- **Mantenido**: Titular, Zona, Número de Orden
- **Mejorado**: Más espacio para QR grande

### 9. **Estados de los Componentes**

#### showQRStates:
```typescript
// Estado global para todos los tickets
const [showQRStates, setShowQRStates] = useState<{[key: number]: boolean}>({});

// Ejemplo:
{
  0: true,  // Ticket #1 mostrando QR
  1: false, // Ticket #2 QR oculto
  2: false  // Ticket #3 QR oculto
}
```

### 10. **Archivos Modificados**

1. **components/admin/tickets/TicketFileUploadModal.tsx**
   - ✅ Agregado selector de tipo de archivo (Radio buttons)
   - ✅ Validación según tipo
   - ✅ Indicadores visuales de tipo
   - ✅ Envío de fileType al backend

2. **app/api/tickets/upload-manual/route.ts**
   - ✅ Recibe array de fileTypes
   - ✅ Valida según tipo seleccionado
   - ✅ Guarda fileType en metadata

3. **app/(user)/profile/tickets/[id]/page.tsx**
   - ✅ Eliminado campos duplicados (Fecha/Lugar)
   - ✅ QR grande (128x128px)
   - ✅ QR placeholder difuminado
   - ✅ QR real condicional
   - ✅ Botones dinámicos según tipo
   - ✅ Estado toggle por ticket

### 11. **Casos de Uso**

#### Caso 1: Evento con QR Digital
- **Escenario**: Festival con entrada digital por QR
- **Admin**: Sube QR codes generados
- **Usuario**: Ve su QR en pantalla para escanear en la entrada
- **Ventaja**: No necesita imprimir, muestra en celular

#### Caso 2: Evento con Tickets Diseñados
- **Escenario**: Concierto con tickets diseñados (PDF)
- **Admin**: Sube PDFs personalizados
- **Usuario**: Descarga e imprime su ticket
- **Ventaja**: Tiene diseño completo del organizador

#### Caso 3: Evento Mixto
- **Escenario**: 3 tickets, 2 QR + 1 PDF
- **Admin**: Sube 2 imágenes QR y 1 PDF
- **Usuario**: 
  - Tickets #1 y #2: Ver/Ocultar QR
  - Ticket #3: Descargar PDF
- **Ventaja**: Flexibilidad por ticket

## 📊 Comparativa Antes/Después

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Tipo de archivo** | Solo "archivo" | QR o Archivo |
| **Visualización QR** | No soportado | QR real en ticket |
| **Tamaño QR** | 80px | 128px |
| **Placeholder** | Icono estático | QR difuminado |
| **Botón descarga** | Solo "Descargar" | "Ver/Ocultar" o "Descargar" |
| **Campos duplicados** | Fecha y Lugar x2 | Eliminados |
| **Flexibilidad** | Todos iguales | Cada ticket diferente |

## 🚀 Próximas Mejoras Opcionales

1. **QR Dinámico**: Generar QR único con validación en tiempo real
2. **Animación**: Transición suave al mostrar/ocultar QR
3. **Zoom**: Permitir ampliar QR para mejor escaneo
4. **Compartir**: Botón para compartir solo el QR
5. **Wallet Integration**: Agregar a Apple/Google Wallet

---

**Fecha**: 2026-08-15
**Estado**: ✅ Completado y Funcional
**Archivos Modificados**: 3
**Nuevas Funcionalidades**: 5