# Configuración de Variables de Entorno en Vercel

## Variables de Entorno Requeridas en Producción

### 1. Firebase Admin (Backend)
```
FIREBASE_ADMIN_PROJECT_ID=tu-proyecto-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
```

### 2. Firebase Client (Frontend)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. MercadoPago (Producción)
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXX-XXXXXX-XXXXXX
```
⚠️ **IMPORTANTE**: Debe empezar con `APP_USR` (producción), NO con `TEST-` (sandbox)

### 4. URLs del Sitio
```
NEXT_PUBLIC_SITE_URL=https://www.ravehublatam.com
MP_WEBHOOK_URL=https://www.ravehublatam.com/api/mercadopago/webhook
```

### 5. Analytics (Opcional)
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789
NEXT_PUBLIC_TIKTOK_PIXEL_ID=XXXXXXXXXX
META_CONVERSION_API_TOKEN=EAAxxxxxxxxxxxx
TIKTOK_ACCESS_TOKEN=xxxxxxxxxxxxxxx
```

### 6. Cloudinary (Imágenes)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=xxxxxxxxxx
```

### 7. Exchange Rates API
```
EXCHANGERATE_API_KEY=tu-api-key
OPENEXCHANGERATES_APP_ID=tu-app-id
```

## Configuración del Webhook de MercadoPago

### En el Dashboard de MercadoPago:

1. Ir a: https://www.mercadopago.com.pe/developers/panel/app
2. Seleccionar tu aplicación
3. Ir a **Webhooks**
4. Agregar nueva URL:
   - **URL**: `https://www.ravehublatam.com/api/mercadopago/webhook`
   - **Eventos**: Seleccionar `Orders`
5. Guardar

### Verificar Webhook:
- MercadoPago enviará un evento de prueba
- Revisar logs en Vercel para confirmar que se recibe correctamente

## Diferencias entre Local y Producción

### Local (Development):
- Usa credenciales de **TEST** de MercadoPago
- Email forzado: `test_user_XXXXXXXX@testuser.com`
- Tarjetas de prueba de MercadoPago

### Producción (Vercel):
- Usa credenciales de **PRODUCCIÓN** de MercadoPago
- Email real del usuario
- Tarjetas reales

## Verificar Configuración

### 1. Verificar que `MERCADOPAGO_ACCESS_TOKEN` es de producción:
```bash
# Debe empezar con APP_USR, NO con TEST-
echo $MERCADOPAGO_ACCESS_TOKEN
# Salida esperada: APP_USR-XXXXXXXXXX-XXXXXX-XXXXXXXX...
```

### 2. Verificar logs en Vercel:
- Ir a: https://vercel.com/tu-proyecto/deployments
- Seleccionar el deployment activo
- Revisar **Logs**

### 3. Probar webhook:
```bash
# Hacer una compra de prueba pequeña (mínimo S/ 3.00)
# Revisar que el webhook se ejecuta correctamente
```

## Errores Comunes

### Error 403: "PA_UNAUTHORIZED_RESULT_FROM_POLICIES"
**Causa**: Tu cuenta de MercadoPago tiene políticas de seguridad bloqueando el pago

**Soluciones**:
1. Verificar que tu cuenta de MercadoPago esté completamente verificada
2. Revisar en MercadoPago Dashboard > Configuración > Políticas de seguridad
3. Contactar soporte de MercadoPago si persiste

### Email `test_user_XXXX@testuser.com` en producción
**Causa**: La variable `MERCADOPAGO_ACCESS_TOKEN` no está correctamente configurada

**Solución**: 
- Verificar que `MERCADOPAGO_ACCESS_TOKEN` empiece con `APP_USR` (no `TEST-`)
- Re-deploy después de actualizar la variable

### Página 404 en `/purchase-pending`
**Causa**: Faltaba crear la página

**Solución**: Ya está corregido en el último commit

### Monto mínimo: "invalid_transaction_amount"
**Causa**: MercadoPago requiere mínimo S/ 3.00 en Perú

**Solución**: Ya está validado en el código (rechaza montos < 3.00)

## Comandos Útiles

### Ver logs de Vercel:
```bash
vercel logs <deployment-url> --follow
```

### Redeploy forzado:
```bash
vercel --prod --force
```

### Ver variables de entorno:
```bash
vercel env ls
```

## Checklist Final

- [ ] Variables de entorno configuradas en Vercel
- [ ] `MERCADOPAGO_ACCESS_TOKEN` es de producción (empieza con `APP_USR`)
- [ ] Webhook configurado en MercadoPago Dashboard
- [ ] Cuenta de MercadoPago verificada y sin restricciones
- [ ] Probado con tarjeta real (mínimo S/ 3.00)
- [ ] Webhook recibe notificaciones correctamente
- [ ] Emails de confirmación se envían
- [ ] Tickets se generan correctamente

## Soporte

Si después de seguir estos pasos sigues teniendo problemas:

1. Revisar logs de Vercel
2. Revisar logs de MercadoPago Dashboard
3. Verificar que el webhook esté recibiendo eventos
4. Contactar soporte de MercadoPago si el error persiste
