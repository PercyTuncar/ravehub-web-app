# Análisis del Sistema - Mejoras de Usuarios y Tickets

## Fecha: 25 de Septiembre de 2026

---

## 1. ESTRUCTURA ACTUAL DEL SISTEMA

### 1.1 Base de Datos (Firebase/Firestore)

#### Colección: `users`
**Campos actuales:**
- `id`, `email`, `firstName`, `lastName`, `phone`, `phonePrefix`
- `documentType`, `documentNumber`, `country`, `preferredCurrency`
- `role`, `photoURL`, `authProvider`, `isActive`
- `addresses[]` (direcciones de envío)
- `lastLogin`, `createdAt`, `updatedAt`
- Información de dispositivo: `platform`, `screenSize`, `userAgent`, `language`

#### Colección: `ticketTransactions`
**Campos actuales:**
- `id`, `userId`, `eventId`, `eventName` (desnormalizado)
- `ticketItems[]` (array con zoneId, zoneName, phaseId, phaseName, quantity, pricePerTicket)
- `totalAmount`, `currency`
- `paymentMethod` ('online' | 'offline')
- `paymentType` ('full' | 'installment')
- `paymentStatus` ('pending' | 'approved' | 'rejected' | 'expired')
- `installments` (número de cuotas)
- `reservationAmount` (adelanto inicial)
- `ticketDeliveryMode` ('automatic' | 'manualUpload')
- `ticketDeliveryStatus` ('pending' | 'scheduled' | 'available' | 'delivered')
- `ticketsUploadedFiles[]` (archivos de tickets)
- `ticketsDownloadAvailableDate`
- `paymentProofUrl`, `offlinePaymentMethod`
- `isCourtesy` (cortesía)
- `mercadoPagoOrderId`, `mercadoPagoStatus` (Mercado Pago)
- `paymentDetails` (detalles de pago aprobado)
- `originalCurrency`, `paidCurrency`, `exchangeRate` (conversión de moneda)
- `createdAt`, `updatedAt`

#### Colección: `paymentInstallments`
**Campos actuales:**
- `id`, `transactionId`
- `amount`, `currency`, `installmentNumber`
- `status` ('pending' | 'pending-approval' | 'paid' | 'rejected' | 'overdue')
- `dueDate`, `paidAt`, `actualPaymentDate`
- `paymentProofUrl`, `userUploadedProofUrl`
- `adminApproved`, `approvedBy`, `approvedAt`
- `rejectedBy`, `rejectedAt`, `rejectionReason`
- `priceAdjusted`, `priceAdjustmentReason` (ajustes de precio por fase)
- `originalPhaseId`, `currentPhaseId`, `originalAmount`

#### Colección: `events`
**Campos clave:**
- `id`, `name`, `slug`, `startDate`, `endDate`
- `location` (venue, city, country)
- `zones[]` (zonas con capacidad)
- `salesPhases[]` (fases de venta con precios)
- `sellTicketsOnPlatform`, `allowInstallmentPayments`

---

## 2. ARCHIVOS CLAVE DEL SISTEMA

### 2.1 Frontend - Páginas Admin

**`/app/admin/users/page.tsx`** (641 líneas)
- Búsqueda de usuarios por email (con debounce)
- Paginación (10 usuarios por página)
- Vista de detalles con información personal, actividad, dispositivo
- Edición básica: firstName, lastName, phone, role, isActive
- **BADGES ACTUALES:** Activo/Inactivo, Rol, Proveedor de auth

**`/app/admin/tickets/page.tsx`** (1740 líneas)
- Vista completa de tickets con filtros avanzados
- Búsqueda por email, nombre, DNI, teléfono, ID ticket, evento
- Filtros: estado pago, método pago, estado entrega, evento
- Gestión de cuotas (aprobar/rechazar comprobantes)
- Subir archivos de tickets manualmente
- **BADGES ACTUALES:** 
  - Estado pago (Aprobado/Pendiente/Rechazado)
  - Método pago (Online/Offline/Cortesía)
  - Tipo pago (X Cuotas)
  - Estado cuotas (X/Y cuotas pagadas)
  - Estado entrega (Tickets Disponibles/Sin subir)
  - Cantidad de tickets
  - Fase y zona

### 2.2 Backend - Server Actions

**`/lib/actions.ts`** (1548 líneas)
- `getTicketsForAdmin()`: Carga tickets con filtros server-side
- `getTicketStats()`: Estadísticas en tiempo real
- `getTicketInstallments()`: Cuotas de un ticket
- `updateTicketPaymentStatus()`: Aprobar/rechazar pagos
- `approveInstallmentProof()`: Aprobar cuota
- `rejectInstallmentProof()`: Rechazar cuota

**`/lib/firebase/collections.ts`** (335 líneas)
- `FirestoreCollection<T>`: Clase genérica para operaciones CRUD
- Métodos: `get()`, `getByIds()`, `query()`, `paginate()`, `update()`, `delete()`
- Colecciones exportadas: `usersCollection`, `ticketTransactionsCollection`, `paymentInstallmentsCollection`

**`/lib/types/index.ts`** (1062 líneas)
- Definición completa de tipos TypeScript
- `User`, `TicketTransaction`, `PaymentInstallment`, `Event`

---

## 3. FLUJO ACTUAL

### 3.1 Búsqueda de Usuario en `/admin/users`
1. Usuario escribe en el campo de búsqueda
2. Debounce de 500ms activa búsqueda
3. Query a Firestore con rango de email (prefix match)
4. Se muestra lista paginada (10 por página)
5. Click en "Ver Detalles" abre modal con:
   - Información personal
   - Actividad (fechas de registro, login)
   - Dispositivo y sesión
   - Direcciones (si tiene)

### 3.2 Ver Tickets de Usuario (ACTUAL - NO EXISTE)
**PROBLEMA:** No hay forma de ver los tickets de un usuario desde `/admin/users`

---

## 4. MEJORAS SOLICITADAS

### 4.1 En `/admin/users` - Vista Lista de Usuarios

**BADGES ADICIONALES A AGREGAR:**
1. **Cantidad de tickets totales** del usuario
   - Badge: `<Badge>🎫 {count} tickets</Badge>`
   - Query: `ticketTransactionsCollection.query([{field: 'userId', operator: '==', value: userId}])`

2. **Tickets con pago pendiente**
   - Badge: `<Badge className="warning">⏳ {count} pendientes</Badge>`
   - Filtro: `paymentStatus === 'pending'`

3. **Eventos próximos** (con tickets activos)
   - Badge: `<Badge className="info">📅 {count} próximos</Badge>`
   - Verificar: `event.startDate > now`

4. **Método de pago predominante**
   - Badge: `<Badge>💳 Online/Offline</Badge>`
   - Calcular el más usado

5. **Estado de registro completo**
   - Badge: `<Badge>✅ Completo / ⚠️ Incompleto</Badge>`
   - Validar campos críticos: firstName, lastName, phone, documentNumber

### 4.2 Botón "Ver Tickets" → Nueva Página

**Crear página:** `/app/admin/users/[userId]/tickets/page.tsx`

**Información a mostrar:**
1. **Resumen del usuario** (header)
   - Avatar, nombre completo, email
   - Total gastado, cantidad de tickets
   - Badges de estado

2. **Lista de tickets** (tabla/cards)
   - Evento (nombre, fecha)
   - Zona y fase de compra
   - Cantidad de entradas
   - Precio total y moneda
   - Método de pago (Online/Offline/Cortesía)
   - **Tipo de pago:**
     - Si es completo: "Pago completo ✅"
     - Si es en cuotas: "X/Y cuotas pagadas"
   - Estado del pago (Aprobado/Pendiente/Rechazado)
   - Estado de entrega (Tickets disponibles/Sin subir)
   - Fecha de compra
   - **Acciones:**
     - Ver detalles completos
     - Ver cuotas (si aplica)
     - Descargar comprobante
     - Ver tickets descargables

3. **Tabla de cuotas** (si el ticket tiene cuotas)
   - Número de cuota
   - Monto
   - Fecha de vencimiento
   - Estado (Pagada/Pendiente/Rechazada/Vencida)
   - Comprobante (ver/descargar)
   - Fecha real de pago
   - Acciones admin (aprobar/rechazar)

4. **Información de conversión de moneda** (si aplica)
   - Moneda original del evento
   - Moneda pagada
   - Tasa de cambio usada

5. **Timeline de estados** (historial)
   - Creado el...
   - Pago aprobado el...
   - Tickets entregados el...
   - Cuota X pagada el...

### 4.3 Mejorar Formulario de Edición de Usuario

**Campos actuales editables:**
- firstName, lastName, phone, role, isActive

**CAMPOS ADICIONALES A PERMITIR EDITAR:**
1. **Información personal:**
   - `documentType` (DNI/Pasaporte/RUT)
   - `documentNumber`
   - `country`
   - `preferredCurrency`
   - `phonePrefix`

2. **Autenticación:**
   - `emailVerified` (toggle)
   - `authProvider` (solo visualización, no editable)

3. **Direcciones:**
   - Agregar/editar/eliminar direcciones del array `addresses[]`
   - Campos: fullName, phone, address, city, region, country, postalCode, isDefault

4. **Datos de sesión** (solo visualización, NO editar):
   - lastLogin
   - platform, screenSize, userAgent
   - failedLoginAttempts

**DISEÑO DEL FORMULARIO:**
- Usar Tabs para organizar secciones:
  - Tab 1: "Información Personal"
  - Tab 2: "Contacto y Documento"
  - Tab 3: "Direcciones"
  - Tab 4: "Configuración de Cuenta"

---

## 5. ESTRUCTURA DE DATOS NECESARIA

### 5.1 Queries Adicionales Necesarias

```typescript
// En lib/actions.ts - AGREGAR:

/**
 * Get user tickets count and summary
 */
export async function getUserTicketsSummary(userId: string): Promise<{
  totalTickets: number;
  pendingPayments: number;
  upcomingEvents: number;
  totalSpent: number;
  currency: string;
  preferredPaymentMethod: 'online' | 'offline';
}>;

/**
 * Get all tickets for a specific user
 */
export async function getUserTickets(userId: string): Promise<{
  success: boolean;
  tickets: TicketTransaction[];
  events: Event[];
  installments: PaymentInstallment[];
}>;

/**
 * Update user profile (expanded)
 */
export async function updateUserProfile(
  userId: string, 
  data: Partial<User>
): Promise<{ success: boolean; error?: string }>;

/**
 * Add/update/delete user address
 */
export async function manageUserAddress(
  userId: string,
  action: 'add' | 'update' | 'delete',
  address: Address
): Promise<{ success: boolean; error?: string }>;
```

---

## 6. PLAN DE IMPLEMENTACIÓN

### Fase 1: Mejorar badges en `/admin/users` (página lista)
1. Crear función `getUserTicketsSummary()` en `lib/actions.ts`
2. Cargar resumen de tickets al cargar cada usuario
3. Agregar badges adicionales en la vista de lista
4. Optimizar con carga en paralelo

### Fase 2: Crear página de tickets de usuario
1. Crear `/app/admin/users/[userId]/tickets/page.tsx`
2. Implementar `getUserTickets()` en `lib/actions.ts`
3. Diseñar vista con tabs:
   - Tab "Tickets" (lista completa)
   - Tab "Cuotas" (todas las cuotas pendientes)
   - Tab "Historial" (timeline)
4. Agregar botón "Ver Tickets" en la lista y modal de usuario

### Fase 3: Expandir formulario de edición
1. Crear componente `<UserEditForm>` con tabs
2. Agregar campos adicionales
3. Implementar `updateUserProfile()` expandido
4. Agregar gestión de direcciones
5. Validación de campos

### Fase 4: Testing y optimización
1. Probar búsquedas con usuarios reales
2. Verificar rendimiento de queries
3. Agregar loading states
4. Manejo de errores

---

## 7. CONSIDERACIONES TÉCNICAS

### 7.1 Rendimiento
- Usar `getByIds()` para cargar datos relacionados en batch
- Implementar caching de datos de usuario
- Lazy loading para listas largas de tickets
- Debouncing en búsquedas

### 7.2 Seguridad
- Todas las acciones requieren `requireAdmin()`
- Validar permisos antes de mostrar datos sensibles
- Sanitizar inputs de usuario
- Logs de auditoría para cambios administrativos

### 7.3 UX
- Skeleton loaders durante carga
- Toasts para feedback de acciones
- Confirmaciones para acciones destructivas
- Breadcrumbs para navegación
- Responsive design (mobile-friendly)

---

## 8. ARCHIVOS A CREAR/MODIFICAR

### Crear:
- `/app/admin/users/[userId]/tickets/page.tsx`
- `/components/admin/users/UserTicketsSummary.tsx`
- `/components/admin/users/UserTicketsTable.tsx`
- `/components/admin/users/UserEditFormExpanded.tsx`
- `/components/admin/users/UserAddressManager.tsx`

### Modificar:
- `/app/admin/users/page.tsx` (agregar badges y botón)
- `/lib/actions.ts` (agregar funciones nuevas)
- `/lib/types/index.ts` (si es necesario)

---

## RESUMEN
El sistema actual tiene una base sólida con Firebase/Firestore. Las mejoras solicitadas son:
1. **Más información visible** en la lista de usuarios (badges)
2. **Página dedicada** para ver todos los tickets de un usuario
3. **Formulario expandido** para editar completamente el perfil del usuario

Todo se puede implementar reutilizando la arquitectura existente y siguiendo los patrones ya establecidos en el código.
