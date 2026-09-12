# 🎨 GUÍA DE MEJORAS VISUALES: Página de Reventa de Entradas

## 📦 Cambios a Aplicar en `app/(public)/vende-tu-entrada/[slug]/page.tsx`

### 1️⃣ AGREGAR IMPORTS (línea 32, después de useAuth)

```typescript
import { EventColorProvider, useEnhancedColorExtraction } from '@/components/events/EventColorContext';
import { DynamicBackgroundGradients } from '@/components/events/DynamicBackgroundGradients';
```

### 2️⃣ CAMBIAR LA ESTRUCTURA DEL COMPONENTE

**ANTES:**
```typescript
export default function EventResaleDetailPage() {
    // ... todo el código actual
}
```

**DESPUÉS:**
```typescript
function ResaleDetailContent() {
    // ... todo el código actual (mover aquí)
    
    // AGREGAR después de las otras declaraciones useState:
    useEnhancedColorExtraction(event?.mainImageUrl || '');
}

export default function EventResaleDetailPage() {
    return (
        <EventColorProvider>
            <ResaleDetailContent />
        </EventColorProvider>
    );
}
```

### 3️⃣ REEMPLAZAR EL CONTAINER PRINCIPAL

**BUSCAR (línea ~195):**
```typescript
<div className="min-h-screen bg-[#0A0A0A] py-20">
```

**REEMPLAZAR CON:**
```typescript
<div className="min-h-screen relative">
    {/* Dynamic Gradient Background */}
    <DynamicBackgroundGradients />
    
    {/* Content */}
    <div className="relative z-10 py-20">
```

Y al final del componente, **CERRAR** el div extra:
```typescript
    </div>
</div>
```

### 4️⃣ MEJORAR EL BOTÓN "VOLVER"

**BUSCAR (línea ~200):**
```typescript
<Link href="/vende-tu-entrada" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
```

**REEMPLAZAR CON:**
```typescript
<Link 
    href="/vende-tu-entrada" 
    className="inline-flex items-center text-white/70 hover:text-white mb-6 transition-colors backdrop-blur-sm bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"
>
```

### 5️⃣ MEJORAR LA IMAGEN DEL EVENTO

**BUSCAR (línea ~210):**
```typescript
<div className="relative h-64 rounded-xl overflow-hidden mb-6">
    <img
        src={event.mainImageUrl || '/placeholder-event.jpg'}
        alt={event.name}
        className="w-full h-full object-cover"
    />
```

**REEMPLAZAR CON:**
```typescript
<div className="relative h-96 rounded-2xl overflow-hidden mb-6 group">
    <img
        src={event.mainImageUrl || '/placeholder-event.jpg'}
        alt={event.name}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
    />
    
    {/* Glassmorphism overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent" />
    
    {/* Bottom info overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform">
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-2xl">
            {event.name}
        </h1>
    </div>
```

### 6️⃣ MEJORAR LAS CARDS DE DETALLES

**BUSCAR todas las cards con `bg-white/5`**

**AGREGAR `backdrop-blur-xl` a cada una:**

```typescript
// De:
<Card className="bg-white/5 border-white/10">

// A:
<Card className="bg-white/5 border-white/10 backdrop-blur-xl">
```

**Esto aplica para:**
- Cards de fecha y ubicación (líneas ~220-260)
- Card de alerta de depreciación (líneas ~270-290)
- Card del formulario sticky (línea ~300)
- Cards de selección de zonas (líneas ~320-350)
- Cards de métodos de pago (líneas ~360-400)

### 7️⃣ MEJORAR LA CARD DE DEPRECIACIÓN

**BUSCAR (línea ~270):**
```typescript
<Card className={`${colors?.bg} border ${colors?.border}`}>
    <CardContent className="p-6">
        <div className="flex items-start gap-4">
            <TrendingDown className={`w-6 h-6 ${colors?.text} flex-shrink-0 mt-1`} />
```

**REEMPLAZAR CON:**
```typescript
<Card className={`${colors?.bg} border ${colors?.border} backdrop-blur-xl shadow-2xl`}>
    <CardContent className="p-6">
        <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${colors?.bg} flex items-center justify-center flex-shrink-0 border ${colors?.border}`}>
                <TrendingDown className={`w-6 h-6 ${colors?.text}`} />
            </div>
```

### 8️⃣ AGREGAR ESTADÍSTICAS VISUALES EN ALERTA

**DENTRO de la card de depreciación, DESPUÉS del mensaje, AGREGAR:**

```typescript
<div className="flex items-center gap-4 mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
    <div className="text-center">
        <p className="text-2xl font-bold text-white">{resaleCalc.daysUntilEvent}</p>
        <p className="text-xs text-white/60">días restantes</p>
    </div>
    <div className="h-10 w-px bg-white/20" />
    <div className="text-center">
        <p className="text-2xl font-bold text-green-400">{resaleCalc.valuePercentage.toFixed(0)}%</p>
        <p className="text-xs text-white/60">valor actual</p>
    </div>
    <div className="h-10 w-px bg-white/20" />
    <div className="text-center flex-1">
        <p className="text-2xl font-bold text-red-400">{resaleCalc.depreciation.toFixed(0)}%</p>
        <p className="text-xs text-white/60">depreciación</p>
    </div>
</div>
```

### 9️⃣ MEJORAR CARDS DE ZONAS

**BUSCAR (líneas ~320-340):**
```typescript
<div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
```

**REEMPLAZAR CON:**
```typescript
<div className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 group">
```

Y dentro, mejorar el precio:
```typescript
<p className="text-xl font-bold text-green-400 group-hover:scale-110 transition-transform">
    {formatPrice(calc.currentValue, event.currency)}
</p>
```

### 🔟 MEJORAR EL RESUMEN FINAL

**BUSCAR (línea ~440):**
```typescript
<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
```

**REEMPLAZAR CON:**
```typescript
<div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6 backdrop-blur-sm shadow-lg">
```

### 1️⃣1️⃣ MEJORAR BOTÓN FINAL

**BUSCAR (línea ~460):**
```typescript
<Button
    onClick={handleSubmit}
    disabled={submitting || !selectedZone}
    className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
>
```

**REEMPLAZAR CON:**
```typescript
<Button
    onClick={handleSubmit}
    disabled={submitting || !selectedZone}
    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 transition-all duration-300"
>
```

---

## 🎯 RESULTADO ESPERADO

✅ **Fondo dinámico** con gradientes extraídos de la imagen del evento
✅ **Efectos glassmorphism** en todas las cards (backdrop-blur-xl)
✅ **Transiciones suaves** en hover y focus
✅ **Estadísticas visuales** en la alerta de depreciación
✅ **Colores adaptativos** según la imagen del evento
✅ **Sombras y profundidad** para mejor jerarquía visual

---

## 📸 INSPIRACIÓN

La página se verá similar a `/eventos/[slug]` con:
- Gradientes de colores extraídos de la imagen
- Cards semi-transparentes con blur
- Animaciones suaves
- Jerarquía visual clara

---

## ⚡ QUICK APPLY

Si quieres aplicar todos los cambios de una vez, puedo crear un script que haga los reemplazos automáticamente. ¿Prefieres que haga eso o prefieres aplicarlos manualmente uno por uno?
