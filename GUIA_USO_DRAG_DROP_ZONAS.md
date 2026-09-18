# 🎯 Guía de Uso: Reordenar Zonas con Drag-and-Drop

## 📍 Dónde encontrar la funcionalidad

1. Ingresa al panel de administración: `https://www.ravehublatam.com/admin/events`
2. Selecciona un evento existente o crea uno nuevo
3. Ve a la página de edición: `/admin/events/[eventId]/edit`
4. Navega al **Paso 4: "Zonas y Fases - Capacidad y precios"**

## 🖱️ Cómo usar el drag-and-drop

### Paso 1: Identificar el handle de arrastre
Cada zona tiene un ícono de **6 puntos verticales** (⋮⋮) en el lado izquierdo:

```
┌─────────────────────────────────────────────────────┐
│ ⋮⋮  │ VIP                │ 500      │ Zona premium │
│     │ [Eliminar Zona]                               │
└─────────────────────────────────────────────────────┘
```

### Paso 2: Arrastrar la zona
1. **Haz clic** sobre el ícono de 6 puntos (⋮⋮)
2. **Mantén presionado** el botón del mouse
3. **Arrastra** hacia arriba o hacia abajo
4. La zona se volverá semitransparente mientras la arrastras

### Paso 3: Soltar en la nueva posición
1. **Suelta** el botón del mouse en la posición deseada
2. Verás una **notificación** confirmando: "Orden actualizado ✓"
3. Las zonas se reorganizarán automáticamente

## 💡 Ejemplo de uso

### Antes del reordenamiento:
```
1. ⋮⋮  General    - 1000 personas
2. ⋮⋮  VIP        - 500 personas
3. ⋮⋮  Gold       - 200 personas
4. ⋮⋮  Backstage  - 50 personas
```

### Quieres que VIP aparezca primero:
1. Haz clic en el ícono ⋮⋮ de "VIP"
2. Arrástralo hacia arriba, por encima de "General"
3. Suéltalo

### Después del reordenamiento:
```
1. ⋮⋮  VIP        - 500 personas    ← Ahora está primero
2. ⋮⋮  General    - 1000 personas
3. ⋮⋮  Gold       - 200 personas
4. ⋮⋮  Backstage  - 50 personas
```

## ⌨️ Atajo de teclado (Accesibilidad)

También puedes reordenar usando el teclado:

1. Usa **Tab** para navegar hasta el handle de una zona
2. Presiona **Espacio** para "agarrar" la zona
3. Usa las **flechas ↑↓** para mover la zona
4. Presiona **Espacio** nuevamente para soltar

## 💾 Guardar los cambios

⚠️ **IMPORTANTE**: El orden se actualiza en el estado local, pero debes **guardar el evento** para persistir los cambios:

1. Después de reordenar las zonas como desees
2. Haz clic en el botón **"Guardar Cambios"** en la parte superior o inferior
3. Los cambios se guardarán en la base de datos

## ✅ Verificación

Para verificar que el orden se guardó correctamente:

1. Guarda el evento
2. Sal de la página de edición
3. Vuelve a entrar a editar el mismo evento
4. Ve al Paso 4 y verifica que el orden se mantuvo

## 🎨 Indicadores visuales

| Estado | Apariencia |
|--------|-----------|
| **Normal** | Zona con borde normal, opacidad 100% |
| **Hover sobre handle** | Cursor cambia a "mano abierta" (grab) |
| **Arrastrando** | Zona semitransparente (50%), cursor "mano cerrada" (grabbing) |
| **Soltando** | Animación suave de transición a la nueva posición |

## 🔧 Solución de problemas

### El handle no aparece
- Verifica que tengas al menos una zona creada
- Actualiza la página si acabas de agregar una zona

### No puedo arrastrar
- Asegúrate de hacer clic exactamente sobre el ícono ⋮⋮
- Si estás en móvil, mantén presionado sobre el ícono

### El orden no se guarda
- Debes hacer clic en "Guardar Cambios" después de reordenar
- Verifica que no haya errores en la consola del navegador

## 📱 Compatibilidad

- ✅ **Desktop**: Chrome, Firefox, Safari, Edge
- ✅ **Tablet**: iPad, Android tablets
- ✅ **Mobile**: iPhone, Android phones (touch)
- ✅ **Accesibilidad**: Navegación por teclado completa

## 🎯 Casos de uso comunes

### 1. Mostrar la zona más cara primero
Arrastra las zonas VIP/Premium al inicio de la lista

### 2. Ordenar por capacidad
Reordena de mayor a menor capacidad para mejor visualización

### 3. Agrupar zonas similares
Mantén juntas las zonas del mismo tipo (ej: todas las VIP juntas)

### 4. Orden de importancia
Coloca primero las zonas que quieres destacar en la venta

## ❓ Preguntas frecuentes

**P: ¿El orden afecta los precios o la disponibilidad?**
R: No, solo afecta el orden visual. Los precios y capacidades se mantienen por ID de zona.

**P: ¿Puedo deshacer un reordenamiento?**
R: Sí, simplemente arrastra la zona de vuelta a su posición anterior antes de guardar.

**P: ¿Se pierden las fases de venta al reordenar?**
R: No, las fases de venta mantienen sus referencias a las zonas por ID, no por posición.

**P: ¿Cuántas zonas puedo reordenar?**
R: No hay límite, puedes reordenar tantas zonas como tengas creadas.

---

**Última actualización**: Septiembre 2026  
**Versión**: 1.0.0
