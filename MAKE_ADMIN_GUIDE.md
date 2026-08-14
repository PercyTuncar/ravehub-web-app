# Script para Actualizar Rol de Usuario a Admin

## Opción 1: Desde Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Busca la colección `users`
5. Busca tu documento de usuario (busca por tu email: `percy.edgar.tuncar@gmail.com`)
6. Haz clic en el documento
7. Edita el campo `role`:
   - Si no existe, añade un nuevo campo:
     - Nombre: `role`
     - Tipo: `string`
     - Valor: `admin`
   - Si existe con valor `user`, cámbialo a `admin`
8. Guarda los cambios
9. Recarga la aplicación

## Opción 2: Desde la Aplicación (Crear un endpoint temporal)

Crear un archivo: `app/api/make-admin/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // SEGURIDAD: Este endpoint debe estar protegido o eliminarse después de usar
    const { email, secretKey } = await request.json();
    
    // Usa una clave secreta para proteger este endpoint
    if (secretKey !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Buscar usuario por email
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    
    // Actualizar rol a admin
    await adminDb.collection('users').doc(userDoc.id).update({
      role: 'admin',
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} is now an admin`,
      userId: userDoc.id 
    });

  } catch (error: any) {
    console.error('Error making user admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Luego:

1. Añade a tu `.env`:
   ```
   ADMIN_SETUP_SECRET=tu-clave-secreta-aqui
   ```

2. Desde Postman o curl:
   ```bash
   curl -X POST https://www.ravehublatam.com/api/make-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "percy.edgar.tuncar@gmail.com",
       "secretKey": "tu-clave-secreta-aqui"
     }'
   ```

3. **IMPORTANTE**: Después de usarlo, elimina el archivo `app/api/make-admin/route.ts`

## Opción 3: Desde el Backend Local

Si tienes acceso al backend local:

```typescript
// scripts/make-admin.ts
import admin from 'firebase-admin';

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeAdmin(email: string) {
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.log('User not found');
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  await db.collection('users').doc(userDoc.id).update({
    role: 'admin',
    updatedAt: new Date().toISOString()
  });

  console.log(`✅ User ${email} is now an admin`);
}

makeAdmin('percy.edgar.tuncar@gmail.com')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
```

Ejecuta:
```bash
npx ts-node scripts/make-admin.ts
```

## Verificar el Cambio

Después de actualizar el rol:

1. Cierra sesión en la aplicación
2. Vuelve a iniciar sesión
3. Abre la consola del navegador
4. Deberías ver:
   ```
   [AuthContext] User data loaded: percy.edgar.tuncar@gmail.com role: admin
   ```
5. Navega a `/admin` - debería funcionar ahora

## Estructura del Documento de Usuario

Un documento de usuario en Firestore debe tener esta estructura:

```json
{
  "id": "uid-del-usuario",
  "email": "percy.edgar.tuncar@gmail.com",
  "firstName": "Percy",
  "lastName": "Tuncar",
  "role": "admin",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "photoURL": "...",
  "phone": "...",
  "country": "..."
}
```

El campo más importante es: **`role: "admin"`**
