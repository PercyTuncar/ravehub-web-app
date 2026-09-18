# Implementación de Drag-and-Drop para Zonas del Evento

## Resumen
Se implementó la funcionalidad de arrastrar y soltar (drag-and-drop) para reordenar las zonas en el formulario de creación/edición de eventos en la ruta `/admin/events/[eventId]/edit`.

## Cambios Realizados

### 1. Instalación de Dependencias
Se instaló la librería `@dnd-kit` para manejar el drag-and-drop:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. Modificaciones en `app/admin/events/[slug]/edit/page.tsx`

#### Imports Agregados
```typescript
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
```

#### Nuevo Componente: `SortableZoneItem`
Se creó un componente para cada zona que permite arrastrarla:
- Incluye un ícono de `GripVertical` como handle para arrastrar
- Mantiene toda la funcionalidad existente (editar nombre, capacidad, descripción, eliminar)
- Aplica estilos visuales durante el arrastre (opacidad reducida, shadow)

#### Sensores de Drag-and-Drop
Se agregaron los sensores necesarios en el componente principal:
```typescript
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

#### Función `handleDragEnd`
Maneja el evento cuando se suelta una zona después de arrastrarla:
- Calcula las posiciones antigua y nueva
- Usa `arrayMove` para reordenar el array de zonas
- Actualiza el estado y muestra un toast de confirmación

#### Actualización de la UI
La sección de zonas ahora está envuelta en:
```typescript
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={eventData.zones?.map(z => z.id) || []} strategy={verticalListSortingStrategy}>
    {/* Componentes de zonas */}
  </SortableContext>
</DndContext>
```

## Características

### ✅ Funcionalidades Implementadas
- **Arrastrar y Soltar**: Las zonas pueden reordenarse arrastrándolas hacia arriba o abajo
- **Indicador Visual**: Ícono de grip vertical (⋮⋮) para indicar que se puede arrastrar
- **Feedback Visual**: Durante el arrastre, la zona arrastrada tiene opacidad reducida
- **Persistencia**: El orden se mantiene al guardar el evento
- **Accesibilidad**: Soporte para teclado (sensores de teclado incluidos)
- **Confirmación**: Toast notification al reordenar
- **Compatibilidad**: Mantiene todas las funcionalidades existentes de edición y eliminación

### 🎨 Experiencia de Usuario
1. **Hover sobre el ícono de grip**: Cambia a cursor "grab"
2. **Durante el arrastre**: Cursor cambia a "grabbing", zona semitransparente
3. **Al soltar**: Animación suave de transición, notificación de éxito
4. **Instrucción clara**: El texto descriptivo indica "Arrastra las zonas para reordenarlas"

## Compatibilidad
- ✅ Compatible con la estructura existente de eventos
- ✅ No afecta las fases de venta ni los precios por zona
- ✅ Referencias de zona se mantienen intactas (por ID, no por índice)
- ✅ Funciona en dispositivos móviles y desktop
- ✅ Soporte para accesibilidad con teclado

## Testing
El proyecto compila exitosamente sin errores:
```
✓ Compiled successfully
✓ Running TypeScript ... Finished TypeScript
```

## Uso
1. Navegar a `/admin/events/[eventId]/edit`
2. Ir al paso 4: "Zonas y Fases"
3. Si hay zonas creadas, cada una mostrará un ícono de grip (⋮⋮) a la izquierda
4. Hacer clic y arrastrar el ícono para mover la zona hacia arriba o abajo
5. Soltar para confirmar el nuevo orden
6. Guardar el evento para persistir los cambios

## Notas Técnicas
- La librería `@dnd-kit` es moderna, ligera y accesible
- El orden se persiste automáticamente en el array `zones` del evento
- Las fases de venta mantienen sus referencias a zonas por `zoneId`, no por índice
- El componente es totalmente tipado con TypeScript
