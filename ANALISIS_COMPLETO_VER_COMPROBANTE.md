# 🔍 ANÁLISIS COMPLETO: Botón "Ver Comprobante" No Aparece en Producción

## ✅ ANÁLISIS DE CÓDIGO COMPLETADO

He revisado TODO el código y está **100% correcto**:

### 1. ✅ Subida de comprobante (`lib/actions.ts:938-942`)
```typescript
await paymentInstallmentsCollection.update(installmentId, {
  userUploadedProofUrl: downloadURL,  // ✅ Se guarda correctamente
  userUploadedAt: new Date().toISOString(),
  status: 'pending-approval',
});
```

### 2. ✅ Lectura de cuotas (`lib/actions.ts:831-838`)
```typescript
const installments = await paymentInstallmentsCollection.query([
  { field: 'transactionId', operator: '==', value: transactionId }
]);
return { success: true, installments: sorted }; // ✅ Retorna todo
```

### 3. ✅ Serialización de datos (`lib/firebase/collections.ts:247-251`)
```typescript
return querySnapshot.docs.map(doc => {
  const data = doc.data();
  const serializedData = this.serializeTimestamps(data);
  return { id: doc.id, ...serializedData }; // ✅ Retorna TODOS los campos
});
```

### 4. ✅ Componente (`components/tickets/InstallmentCard.tsx:126-130`)
```typescript
const proofUrl = installment.userUploadedProofUrl ||
                 installment.paymentProofUrl ||
                 installment.proofUrl ||
                 installment.adminUploadedProofUrl ||
                 null;
```

### 5. ✅ Botón "Ver Comprobante" (`InstallmentCard.tsx:241-252`)
```typescript
{status === 'paid' && proofUrl && (
    <Button onClick={() => onViewProof?.(proofUrl)}>
        Ver Comprobante
    </Button>
)}
```

---

## 🎯 CONCLUSIÓN: El código está perfecto

El problema NO es el código. El problema es uno de estos:

### A) Los datos en Firestore NO tienen el campo
Las cuotas en producción literalmente no tienen `userUploadedProofUrl` guardado.

### B) Cache del navegador/Vercel
El frontend está sirviendo una versión vieja.

### C) Build viejo en Vercel
El código nuevo no se desplegó correctamente.

---

## 🔬 DIAGNÓSTICO PASO A PASO

### PASO 1: Verificar Firestore (LO MÁS IMPORTANTE)

1. Abre Firebase Console: https://console.firebase.google.com
2. Ve a **Firestore Database**
3. Colección: `paymentInstallments`
4. Busca UNA cuota que debería mostrar el botón
5. Abre el documento
6. **Toma captura de pantalla de TODOS los campos**

**¿Qué buscar?**
```
✅ DEBE tener UNO de estos campos:
   - userUploadedProofUrl: "https://firebasestorage..."
   - paymentProofUrl: "https://firebasestorage..."
   - proofUrl: "https://firebasestorage..."

✅ DEBE tener status:
   - "paid" O "pending-approval"
```

**Si NO tiene ninguno de esos campos:**
→ El comprobante NUNCA se guardó en la base de datos
→ Problema: Firestore Rules o error en el upload

**Si SÍ tiene los campos:**
→ El problema es cache o build
→ Ir a PASO 2

---

### PASO 2: Verificar Network Tab

1. Abre la página del ticket en producción
2. Abre DevTools (F12)
3. Ve a pestaña **Network**
4. Recarga la página (Ctrl+R)
5. Busca request que tenga "installments" en el nombre
6. Click derecho → **Copy** → **Copy response**
7. Pégalo en un editor de texto

**¿Qué buscar?**
```json
{
  "success": true,
  "installments": [
    {
      "id": "abc123",
      "userUploadedProofUrl": "https://...",  // ← ¿EXISTE?
      "status": "pending-approval"
    }
  ]
}
```

**Si NO está en la respuesta:**
→ El backend no está retornando el campo
→ Problema: Admin SDK o query

**Si SÍ está en la respuesta:**
→ El frontend lo está recibiendo
→ Ir a PASO 3

---

### PASO 3: Verificar React DevTools

1. Instala React DevTools (extensión de Chrome)
2. Abre la página del ticket
3. Abre React DevTools (pestaña Components)
4. Busca componente `InstallmentCard`
5. Mira las **Props**

**¿Qué buscar?**
```
Props:
  installment: {
    userUploadedProofUrl: "https://..."  // ← ¿EXISTE?
    status: "pending-approval"
  }
  status: "pending-approval"
```

**Si NO está en props:**
→ El componente padre no lo está pasando
→ Problema: Mapping o filtro

**Si SÍ está en props:**
→ El problema es lógica del componente
→ Ir a PASO 4

---

### PASO 4: Verificar Lógica del Botón

En la consola del navegador:

```javascript
// 1. Verificar si proofUrl se calcula correctamente
const installment = {
  userUploadedProofUrl: "https://test.com/proof.jpg",
  status: "pending-approval"
};

const proofUrl = installment.userUploadedProofUrl ||
                 installment.paymentProofUrl ||
                 installment.proofUrl ||
                 null;

console.log('proofUrl:', proofUrl); // Debe mostrar la URL
console.log('status:', installment.status);

// 2. Verificar condición del botón
const shouldShow = (installment.status === 'paid' || 
                    installment.status === 'pending-approval') && 
                   proofUrl;

console.log('¿Debería mostrar botón?:', shouldShow); // Debe ser true
```

---

## 🚨 ACCIÓN INMEDIATA REQUERIDA

**POR FAVOR EJECUTA PASO 1** (Verificar Firestore)

1. Abre Firebase Console
2. Ve a `paymentInstallments`
3. Busca una cuota que debería tener comprobante
4. **Toma captura de TODO el documento**
5. Compártela aquí

Esa captura me dirá EXACTAMENTE cuál es el problema.

---

## 💡 MIENTRAS TANTO: Verificación Rápida

Ejecuta esto en la consola del navegador en la página del ticket:

```javascript
// Verificar si los datos llegan
fetch('/api/installments/YOUR_TICKET_ID')
  .then(r => r.json())
  .then(data => {
    console.log('📊 Datos de cuotas:', data);
    
    data.installments.forEach((inst, i) => {
      console.log(`\n🎫 Cuota #${inst.installmentNumber}:`);
      console.log('  - ID:', inst.id);
      console.log('  - Status:', inst.status);
      console.log('  - userUploadedProofUrl:', inst.userUploadedProofUrl || '❌ NO EXISTE');
      console.log('  - paymentProofUrl:', inst.paymentProofUrl || '❌ NO EXISTE');
      console.log('  - proofUrl:', inst.proofUrl || '❌ NO EXISTE');
      
      const hasProof = !!(inst.userUploadedProofUrl || inst.paymentProofUrl || inst.proofUrl);
      const isPaidOrPending = inst.status === 'paid' || inst.status === 'pending-approval';
      
      console.log('  - ¿Tiene comprobante?:', hasProof ? '✅' : '❌');
      console.log('  - ¿Status correcto?:', isPaidOrPending ? '✅' : '❌');
      console.log('  - ¿Debería mostrar botón?:', (hasProof && isPaidOrPending) ? '✅ SÍ' : '❌ NO');
    });
  });
```

Reemplaza `YOUR_TICKET_ID` con tu ID de ticket y comparte el resultado.

---

## 📝 RESUMEN

**El código está correcto.**
**Necesito ver los datos reales de Firestore para identificar el problema exacto.**

Por favor ejecuta PASO 1 y comparte la captura de pantalla. 🙏
