# ⚠️ IMPORTANTE: Configuración de IndexNow

## 📝 Archivo de Clave Requerido

IndexNow requiere que tu clave API esté disponible públicamente en:
```
https://www.ravehublatam.com/{tu-clave}.txt
```

## ✅ Configuración Actual

La clave se encuentra en: `public/05f9c615c229bfc8a404d5e375d12d36.txt`

Este archivo estático será servido automáticamente por Next.js en:
```
https://www.ravehublatam.com/05f9c615c229bfc8a404d5e375d12d36.txt
```

## 🔧 Si cambias la clave en el futuro

1. **Genera una nueva clave:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

2. **Actualiza la variable de entorno:**
   ```env
   INDEXNOW_API_KEY=tu_nueva_clave_aqui
   ```

3. **Crea el archivo en public:**
   ```bash
   echo "tu_nueva_clave_aqui" > public/tu_nueva_clave_aqui.txt
   ```

4. **Elimina el archivo anterior:**
   ```bash
   rm public/05f9c615c229bfc8a404d5e375d12d36.txt
   ```

## 🚀 Después del Deploy

Verifica que funciona visitando:
```
https://www.ravehublatam.com/05f9c615c229bfc8a404d5e375d12d36.txt
```

Debe mostrar solo: `05f9c615c229bfc8a404d5e375d12d36`

## 📚 Documentación

- Ver [INDEXACION_RAPIDA.md](../INDEXACION_RAPIDA.md) para más detalles
