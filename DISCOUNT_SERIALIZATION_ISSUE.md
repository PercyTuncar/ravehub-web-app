# 🔍 DIAGNÓSTICO FINAL - CAMPO DISCOUNT SE PIERDE

## PROBLEMA IDENTIFICADO

El campo `discount` **SE PIERDE** en la transferencia de Server Component a Client Component.

### Evidencia:
```
✅ Servidor: Black Eyed Peas con discount: { percentage: 30, ... }
❌ Cliente: EventCard recibe discount: undefined
```

## CAUSA RAÍZ

**Next.js Server Components** no serializa correctamente objetos complejos anidados al pasarlos a Client Components.

El campo `discount` contiene:
- Objetos anidados (`stats`, `codes`)
- Timestamps complejos
- Campos opcionales

Esto causa que Next.js lo omita durante la serialización.

## SOLUCIÓN

Hay 3 opciones:

### Opción 1: Simplificar antes de pasar (RECOMENDADA)
Crear un objeto plano solo con lo necesario antes de pasar al cliente.

### Opción 2: Usar JSON.stringify/parse
Forzar serialización manual.

### Opción 3: Marcar componente como "use server"
Renderizar todo en el servidor.

---

**Voy a implementar la Opción 1 ahora...**
