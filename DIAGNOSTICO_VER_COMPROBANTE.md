# 🔍 DIAGNÓSTICO: Botón "Ver Comprobante" No Aparece

## ❓ PREGUNTAS DE DIAGNÓSTICO

### 1. ¿En qué ambiente no aparece?
- [ ] Producción (Vercel)
- [ ] Local (localhost)
- [ ] Ambos

### 2. ¿Para qué tipo de cuotas no aparece?
- [ ] Cuotas pagadas (status: 'paid')
- [ ] Cuotas en revisión (status: 'pending-approval')
- [ ] Todas

### 3. ¿Subiste comprobante recientemente?
- [ ] Sí, después del deploy
- [ ] No, los comprobantes son de antes del deploy
- [ ] Ambos casos

---

## 🔍 PASOS DE DIAGNÓSTICO

### Paso 1: Verificar en Firestore Console

1. Abre Firebase Console: https://console.firebase.google.com
2. Ve a **Firestore Database**
3. Busca la colección `paymentInstallments`
4. Encuentra una cuota que debería mostrar "Ver Comprobante"
5. Verifica si tiene alguno de estos campos:
   ```
   - userUploadedProofUrl: "https://..."
   - paymentProofUrl: "https://..."
   - proofUrl: "https://..." (legacy)
   ```

**¿Tiene alguno de estos campos?**
- [ ] ✅ Sí → Ir a Paso 2
- [ ] ❌ No → **PROBLEMA**: El comprobante no se guardó en la DB

---

### Paso 2: Verificar en Consola del Navegador

1. Abre la página con las cuotas
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**
4. Escribe:
   ```javascript
   // Inspeccionar datos de cuotas
   console.log(window.__INSTALLMENTS_DATA__)
   ```
5. O inspecciona el componente con React DevTools

**¿Los datos tienen `userUploadedProofUrl` o `paymentProofUrl`?**
- [ ] ✅ Sí → Ir a Paso 3
- [ ] ❌ No → **PROBLEMA**: Los datos no llegan al frontend

---

### Paso 3: Verificar Cache del Navegador

1. Abre en modo incógnito / privado
2. O limpia cache:
   - Chrome: `Ctrl + Shift + Delete`
   - Selecciona "Cached images and files"
   - Timerange: "All time"
   - Click "Clear data"

**¿Ahora aparece el botón?**
- [ ] ✅ Sí → **SOLUCIÓN**: Era cache
- [ ] ❌ No → Ir a Paso 4

---

### Paso 4: Verificar Deployment

**¿Desplegaste Firestore Rules?**
```bash
firebase deploy --only firestore:rules
```

- [ ] ✅ Sí, desplegué
- [ ] ❌ No, no desplegué → **PROBLEMA**: Las rules antiguas pueden estar bloqueando

---

## 🔧 SOLUCIONES POR PROBLEMA

### Problema 1: Comprobante no se guarda en DB

**Causa**: Firestore Rules bloquean el update

**Solución**:
```bash
# Desplegar rules actualizadas
firebase deploy --only firestore:rules
```

**Verificar en `firestore.rules` línea 183**:
```javascript
// Cliente PUEDE actualizar solo estos campos
allow update: if 
  request.auth != null 
  && resource.data.transactionId is string
  && onlyUpdating(['userUploadedProofUrl', 'userUploadedAt']);
```

---

### Problema 2: Datos no llegan al frontend

**Causa**: Query no incluye el campo

**Verificar en `lib/actions.ts`** - función `getTicketInstallments()`:
```typescript
// Debe retornar todos los campos
return {
  success: true,
  installments: installments.map(inst => ({
    ...inst,
    userUploadedProofUrl: inst.userUploadedProofUrl, // ← Verificar
    paymentProofUrl: inst.paymentProofUrl,           // ← Verificar
  }))
};
```

---

### Problema 3: Build antiguo en Vercel

**Causa**: Vercel no reconstruyó con los cambios

**Solución**:
```bash
# Forzar rebuild en Vercel
# Opción A: Push vacío
git commit --allow-empty -m "chore: force rebuild"
git push origin main

# Opción B: Manualmente en Vercel Dashboard
# → Deployments → Latest → ... → Redeploy
```

---

### Problema 4: Comprobantes antiguos (antes del deploy)

**Causa**: Los comprobantes antiguos usan campo legacy

**Solución rápida** - Actualizar línea 126 de `InstallmentCard.tsx`:
```typescript
// ANTES
const proofUrl = installment.userUploadedProofUrl || installment.proofUrl || installment.paymentProofUrl;

// DESPUÉS - Agregar más fallbacks
const proofUrl = 
  installment.userUploadedProofUrl || 
  installment.paymentProofUrl || 
  installment.proofUrl ||
  installment.adminUploadedProofUrl || // ← Nuevo
  null;
```

---

## 🧪 TEST RÁPIDO

Ejecuta este script en la consola del navegador en la página de cuotas:

```javascript
// Verificar qué cuotas tienen comprobante
const cards = document.querySelectorAll('[data-installment-id]');
console.log('Total cuotas:', cards.length);

cards.forEach(card => {
  const id = card.getAttribute('data-installment-id');
  const hasButton = card.querySelector('button:has-text("Ver Comprobante")');
  console.log({
    id,
    hasButton: !!hasButton,
    text: card.innerText.slice(0, 100)
  });
});
```

---

## 🆘 SI NADA FUNCIONA

1. **Captura de pantalla** del Firestore Console mostrando la cuota
2. **Captura de pantalla** de la página donde debería aparecer el botón
3. **Logs de consola** del navegador (F12 → Console)
4. **Network tab** - verificar que el API retorna los datos

Comparte estos 4 items y podré diagnosticar el problema exacto.

---

## 📝 CHECKLIST FINAL

Antes de reportar como bug, verifica:

- [ ] Firestore Rules desplegadas
- [ ] La cuota tiene `userUploadedProofUrl` en Firestore
- [ ] El API retorna el campo (Network tab)
- [ ] Cache del navegador limpiado
- [ ] Probado en modo incógnito
- [ ] Build de Vercel es el último (verificar fecha en Dashboard)
- [ ] Component `InstallmentCard.tsx` tiene la línea 126 correcta

---

**Estado actual**: Esperando información de diagnóstico
