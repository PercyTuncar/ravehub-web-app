# 🔍 Script de Diagnóstico - Meta Pixel

Ejecuta este script en la **consola del navegador** (F12 → Console) en la página donde estás viendo el error.

---

## 📋 Script de Diagnóstico Completo

```javascript
console.log('🔍 DIAGNÓSTICO META PIXEL - RAVEHUB');
console.log('=====================================\n');

// 1. Verificar que fbq existe
console.log('1️⃣ Verificar fbq()');
if (typeof window.fbq === 'function') {
  console.log('✅ window.fbq existe y es una función');
  console.log('   fbq version:', window.fbq.version);
  console.log('   fbq queue length:', window.fbq.queue?.length || 0);
} else {
  console.error('❌ window.fbq NO existe - El script no se cargó');
  console.log('   typeof window.fbq:', typeof window.fbq);
}

// 2. Verificar que _fbq existe (indica que init se llamó)
console.log('\n2️⃣ Verificar _fbq (internal)');
if (window._fbq) {
  console.log('✅ window._fbq existe - Pixel inicializado');
} else {
  console.error('❌ window._fbq NO existe - Pixel NO inicializado');
}

// 3. Verificar script de Facebook
console.log('\n3️⃣ Verificar script fbevents.js');
const fbScript = document.querySelector('script[src*="fbevents.js"]');
if (fbScript) {
  console.log('✅ Script fbevents.js encontrado');
  console.log('   src:', fbScript.src);
  console.log('   async:', fbScript.async);
} else {
  console.error('❌ Script fbevents.js NO encontrado en el DOM');
}

// 4. Verificar nuestro script inline
console.log('\n4️⃣ Verificar script inline de Ravehub');
const ourScript = document.querySelector('script#ravehub-meta-pixel');
if (ourScript) {
  console.log('✅ Script #ravehub-meta-pixel encontrado');
  console.log('   Contenido:', ourScript.innerHTML.substring(0, 100) + '...');
} else {
  console.error('❌ Script #ravehub-meta-pixel NO encontrado');
}

// 5. Verificar localStorage (consentimiento)
console.log('\n5️⃣ Verificar consentimiento');
const consent = localStorage.getItem('ravehub_tracking_consent');
console.log('   Consent:', consent || 'null (sin decisión)');
if (consent === 'accepted') {
  console.log('✅ Consentimiento aceptado');
} else {
  console.warn('⚠️ Consentimiento NO aceptado:', consent);
}

// 6. Buscar errores de JavaScript
console.log('\n6️⃣ Verificar errores de JavaScript');
console.log('   Abre la pestaña "Console" y busca errores en rojo');
console.log('   Errores comunes:');
console.log('   - "fbq is not defined"');
console.log('   - "Cannot read property track of undefined"');
console.log('   - Errores de CORS o CSP');

// 7. Verificar Network requests
console.log('\n7️⃣ Verificar requests de red');
console.log('   Abre la pestaña "Network"');
console.log('   Filtra por "facebook" o "fbevents"');
console.log('   Deberías ver:');
console.log('   ✅ fbevents.js (Status 200)');
console.log('   ✅ tr?id=... (Status 200) - Este es el evento PageView');

// 8. Intentar disparar evento manualmente
console.log('\n8️⃣ Intentar disparar PageView manualmente');
if (typeof window.fbq === 'function') {
  try {
    window.fbq('track', 'PageView');
    console.log('✅ fbq("track", "PageView") ejecutado');
    console.log('   Verifica en Pixel Helper si aparece el evento');
  } catch (error) {
    console.error('❌ Error al ejecutar fbq():', error);
  }
} else {
  console.error('❌ No se puede ejecutar - fbq no existe');
}

// 9. Verificar si hay múltiples pixels
console.log('\n9️⃣ Verificar múltiples pixels');
const allScripts = Array.from(document.querySelectorAll('script'));
const fbScripts = allScripts.filter(s => 
  s.innerHTML.includes('fbq') || 
  s.src.includes('facebook') || 
  s.src.includes('fbevents')
);
console.log('   Scripts relacionados con FB:', fbScripts.length);
if (fbScripts.length > 2) {
  console.warn('⚠️ Múltiples scripts de Facebook detectados');
  fbScripts.forEach((s, i) => {
    console.log(`   ${i + 1}.`, s.id || s.src || 'inline');
  });
}

// 10. Verificar variables de entorno
console.log('\n🔟 Verificar configuración');
console.log('   Esta verificación requiere acceso al código');
console.log('   Pixel ID esperado: 1030778403259919');
console.log('   Si ves un ID diferente o "undefined", hay un problema de config');

console.log('\n=====================================');
console.log('📊 RESUMEN');
console.log('=====================================');

let issues = 0;
if (typeof window.fbq !== 'function') {
  console.error('❌ PROBLEMA 1: fbq no es una función');
  issues++;
}
if (!window._fbq) {
  console.error('❌ PROBLEMA 2: Pixel no inicializado');
  issues++;
}
if (!fbScript) {
  console.error('❌ PROBLEMA 3: Script fbevents.js no cargó');
  issues++;
}
if (!ourScript) {
  console.error('❌ PROBLEMA 4: Nuestro script no está en el DOM');
  issues++;
}

if (issues === 0) {
  console.log('✅ NO HAY PROBLEMAS DETECTADOS');
  console.log('   El pixel debería estar funcionando');
  console.log('   Si Pixel Helper sigue mostrando advertencia:');
  console.log('   1. Recarga la página con Ctrl+Shift+R');
  console.log('   2. Espera 5-10 segundos');
  console.log('   3. Verifica en Network tab si hay requests a facebook.com');
} else {
  console.error(`❌ ${issues} PROBLEMA(S) ENCONTRADO(S)`);
  console.log('   Ver detalles arriba ⬆️');
}

console.log('\n=====================================');
```

---

## 🎯 Cómo Usar Este Script

### **Paso 1: Abre la página**
```
https://www.ravehublatam.com/eventos/black-eyed-peas/entradas
```

### **Paso 2: Abre DevTools**
- **Windows/Linux**: `F12` o `Ctrl + Shift + I`
- **Mac**: `Cmd + Option + I`

### **Paso 3: Ve a la pestaña "Console"**

### **Paso 4: Pega el script completo y presiona Enter**

---

## 📊 Interpretación de Resultados

### ✅ **Resultado BUENO (Todo funciona)**:
```
✅ window.fbq existe y es una función
✅ window._fbq existe - Pixel inicializado
✅ Script fbevents.js encontrado
✅ Script #ravehub-meta-pixel encontrado
✅ Consentimiento aceptado
✅ NO HAY PROBLEMAS DETECTADOS
```

### ❌ **Resultado MALO (Hay problemas)**:

#### **Problema 1: "fbq NO existe"**
```
❌ window.fbq NO existe - El script no se cargó
```
**Causa**: El script de Meta Pixel no se cargó
**Solución**:
1. Verifica que las variables de entorno estén en Vercel
2. Verifica que el código esté desplegado
3. Limpia caché del navegador

#### **Problema 2: "Script fbevents.js NO encontrado"**
```
❌ Script fbevents.js NO encontrado en el DOM
```
**Causa**: El script inline no ejecutó o tiene un error
**Solución**:
1. Busca errores de JavaScript en Console
2. Verifica que `metaPixelId` no sea undefined
3. Revisa la pestaña Network por errores de CORS

#### **Problema 3: "Script #ravehub-meta-pixel NO encontrado"**
```
❌ Script #ravehub-meta-pixel NO encontrado
```
**Causa**: El componente MarketingTracking no se renderizó
**Solución**:
1. Verifica que esté dentro de AuthProvider en layout.tsx
2. Busca errores de React en Console
3. Verifica que el componente no tenga errores

---

## 🔧 Script de Verificación Rápida

Si el script anterior es muy largo, usa este corto:

```javascript
// Quick check
console.log({
  'fbq exists': typeof window.fbq,
  'fbq version': window.fbq?.version,
  '_fbq exists': !!window._fbq,
  'fbevents.js': !!document.querySelector('script[src*="fbevents.js"]'),
  'our script': !!document.querySelector('script#ravehub-meta-pixel'),
  'consent': localStorage.getItem('ravehub_tracking_consent')
});

// Try to fire event
if (typeof window.fbq === 'function') {
  window.fbq('track', 'PageView');
  console.log('✅ PageView fired - Check Pixel Helper');
} else {
  console.error('❌ fbq does not exist');
}
```

---

## 🎯 Próximos Pasos Según Resultado

### **Si TODO está ✅**:
- El pixel funciona correctamente
- El problema está en Pixel Helper (falso positivo)
- Solución: Recarga con Ctrl+Shift+R y espera 10 segundos

### **Si fbq NO existe**:
1. Verifica variables de entorno en Vercel
2. Verifica que el código esté desplegado
3. Revisa Console por errores de JS

### **Si script NO está en DOM**:
1. Verifica que MarketingTracking esté en layout.tsx
2. Verifica que esté dentro de AuthProvider
3. Busca errores de React

### **Si fbevents.js NO carga**:
1. Verifica errores de red en Network tab
2. Busca errores de CORS o CSP
3. Verifica que Facebook no esté bloqueado

---

## 📞 Información para Reportar

Después de ejecutar el script, comparte:

1. **Resultado del script** (todo el output)
2. **Errores en Console** (si los hay, en rojo)
3. **Screenshot de Network tab** filtrado por "facebook"
4. **Screenshot de Pixel Helper**

Con esta información podré identificar el problema exacto.

---

*Script de diagnóstico creado: 2026-08-24*
