# 🔒 Guía Completa: HTTPS en Localhost (2025)

## 📋 Índice de Opciones

1. **mkcert** - ⭐ Más Recomendado (Certificados locales confiables)
2. **Next.js Built-in HTTPS** - 🚀 Más Fácil para Next.js
3. **Tunneling Services** - 🌐 Para acceso público temporal
4. **Self-Signed Certificates** - 🔧 Método manual tradicional
5. **Caddy Server** - 🎯 Proxy inverso automático

---

## 1️⃣ mkcert (⭐ MÁS RECOMENDADO)

### ✅ Ventajas:
- Certificados **confiables** por el navegador (sin warnings)
- Funciona en Windows, macOS, Linux
- Instalación sencilla
- Cero configuración después de setup inicial
- Ideal para desarrollo local a largo plazo

### 📦 Instalación

#### Windows (con Chocolatey):
```bash
choco install mkcert
```

#### Windows (con Scoop):
```bash
scoop bucket add extras
scoop install mkcert
```

#### macOS:
```bash
brew install mkcert
brew install nss # para Firefox
```

#### Linux:
```bash
# Debian/Ubuntu
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

### 🔧 Configuración para Next.js

**Paso 1: Instalar la CA local**
```bash
mkcert -install
```

**Paso 2: Generar certificados**
```bash
# Desde la raíz de tu proyecto
mkcert localhost 127.0.0.1 ::1
```

Esto genera:
- `localhost+2.pem` (certificado)
- `localhost+2-key.pem` (llave privada)

**Paso 3: Crear carpeta para certificados**
```bash
mkdir -p certificates
mv localhost+2.pem certificates/localhost.pem
mv localhost+2-key.pem certificates/localhost-key.pem
```

**Paso 4: Crear servidor HTTPS personalizado**

Crea `server.js` en la raíz:

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

**Paso 5: Actualizar package.json**
```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**Paso 6: Ejecutar**
```bash
npm run dev
```

Accede a: **https://localhost:3000** ✅ (sin warnings)

---

## 2️⃣ Next.js Built-in HTTPS (🚀 MÁS FÁCIL - Next.js 13+)

### ✅ Ventajas:
- **Cero configuración** de archivos
- Una sola flag en el comando
- Ideal para pruebas rápidas
- Genera certificados automáticamente

### ⚠️ Desventajas:
- Requiere aceptar certificado manualmente en el navegador
- No es confiable por defecto (warning inicial)
- Solo disponible en Next.js 13+

### 🔧 Uso

```bash
# Opción 1: Directamente
next dev --experimental-https

# Opción 2: Con hostname personalizado
next dev --experimental-https --experimental-https-key ./certificates/localhost-key.pem --experimental-https-cert ./certificates/localhost.pem
```

**Actualizar package.json:**
```json
{
  "scripts": {
    "dev": "next dev --experimental-https",
    "dev:http": "next dev"
  }
}
```

Accede a: **https://localhost:3000**

En la primera visita:
1. Chrome mostrará warning "Your connection is not private"
2. Click en "Advanced"
3. Click en "Proceed to localhost (unsafe)"

---

## 3️⃣ Tunneling Services (🌐 ACCESO PÚBLICO)

Ideal cuando necesitas:
- Probar desde dispositivos móviles
- Compartir con clientes/equipo
- Probar webhooks de terceros (Stripe, PayPal, etc.)
- OAuth callbacks externos

### A) ngrok (⭐ Más Popular)

**Instalación:**
```bash
# Windows (Chocolatey)
choco install ngrok

# macOS
brew install ngrok/ngrok/ngrok

# O descargar desde: https://ngrok.com/download
```

**Uso:**
```bash
# Inicia tu servidor local
npm run dev

# En otra terminal
ngrok http 3000
```

**Resultado:**
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

**✅ Gratis:** 
- 1 túnel simultáneo
- URLs aleatorias
- Sin límite de tiempo

**💰 Paid ($10/mes):**
- URLs personalizadas
- Múltiples túneles
- Sin rate limiting

### B) Cloudflare Tunnel (⭐ Alternativa Gratuita)

**Instalación:**
```bash
# Windows
winget install --id Cloudflare.cloudflared

# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Uso:**
```bash
cloudflared tunnel --url http://localhost:3000
```

**Resultado:**
```
https://random-name.trycloudflare.com
```

**✅ Ventajas:**
- 100% gratuito
- Sin registro necesario
- Rápido y confiable
- Sin límites de tiempo

### C) localhost.run (Más Simple)

**Uso (sin instalación):**
```bash
ssh -R 80:localhost:3000 nokey@localhost.run
```

**Resultado:**
```
https://random-name.loca.lt
```

### D) localtunnel

**Instalación:**
```bash
npm install -g localtunnel
```

**Uso:**
```bash
lt --port 3000 --subdomain ravehub
```

**Resultado:**
```
https://ravehub.loca.lt
```

---

## 4️⃣ Self-Signed Certificates (🔧 Método Manual)

### ⚠️ Solo usar si otras opciones no funcionan

**Generar certificado:**
```bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

**Usar en Next.js:**
```javascript
// server.js
const httpsOptions = {
  key: fs.readFileSync('./localhost.key'),
  cert: fs.readFileSync('./localhost.crt'),
};
```

**⚠️ Problema:** Navegadores mostrarán warnings permanentemente.

---

## 5️⃣ Caddy Server (🎯 Proxy Inverso Automático)

### ✅ Ventajas:
- Certificados HTTPS automáticos
- Proxy inverso fácil
- Renueva certificados automáticamente

**Instalación:**
```bash
# Windows
choco install caddy

# macOS
brew install caddy

# Linux
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**Configuración (Caddyfile):**
```
localhost {
    reverse_proxy 127.0.0.1:3000
    tls internal
}
```

**Uso:**
```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Caddy
caddy run
```

Accede a: **https://localhost**

---

## 📊 Comparación de Opciones

| Método | Dificultad | Confiable | Acceso Público | Costo | Mejor Para |
|--------|-----------|-----------|----------------|-------|------------|
| **mkcert** | ⭐⭐ | ✅ Sí | ❌ No | 🆓 | **Desarrollo diario** |
| **Next.js --experimental-https** | ⭐ | ⚠️ Con warning | ❌ No | 🆓 | **Pruebas rápidas** |
| **ngrok** | ⭐ | ✅ Sí | ✅ Sí | 🆓/💰 | **Demos y webhooks** |
| **Cloudflare Tunnel** | ⭐⭐ | ✅ Sí | ✅ Sí | 🆓 | **Acceso externo** |
| **Self-Signed** | ⭐⭐⭐ | ❌ No | ❌ No | 🆓 | **Último recurso** |
| **Caddy** | ⭐⭐⭐ | ✅ Sí | ❌ No | 🆓 | **Infraestructura local** |

---

## 🎯 Recomendación por Caso de Uso

### 📱 **Desarrollo Diario Local**
→ **mkcert** (sin dudas)
- Instalar una vez
- Usar siempre
- Sin warnings del navegador

### 🚀 **Prueba Rápida (5 minutos)**
→ **Next.js --experimental-https**
```bash
next dev --experimental-https
```

### 🌐 **Probar en Móvil / Compartir con Equipo**
→ **Cloudflare Tunnel** (gratis) o **ngrok** (más features)
```bash
cloudflared tunnel --url http://localhost:3000
```

### 💳 **Probar Webhooks de Pago (Stripe, MercadoPago)**
→ **ngrok** (más estable para webhooks)
```bash
ngrok http 3000
```

### 🔧 **Necesitas Control Total**
→ **Caddy Server** (para setups avanzados)

---

## 🛠️ Implementación Recomendada para tu Proyecto

Dado que estás trabajando con **Next.js + MercadoPago**, te recomiendo:

### Setup Principal: mkcert

```bash
# 1. Instalar mkcert
choco install mkcert  # Windows
# o
brew install mkcert   # macOS

# 2. Instalar CA local
mkcert -install

# 3. Generar certificados en tu proyecto
cd c:/Users/tunca/OneDrive/Desktop/Github/ravehub-web-app
mkdir certificates
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1

# 4. Agregar a .gitignore
echo "certificates/" >> .gitignore
```

### Crear server.js:

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
  });
});
```

### Actualizar package.json:

```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev",
    "dev:tunnel": "npm run dev & cloudflared tunnel --url https://localhost:3000",
    "build": "next build",
    "start": "next start"
  }
}
```

### Para probar MercadoPago webhooks:

```bash
# Terminal 1: servidor local HTTPS
npm run dev

# Terminal 2: túnel público
cloudflared tunnel --url https://localhost:3000
```

Usa la URL de Cloudflare para configurar el webhook en MercadoPago.

---

## 📚 Fuentes Consultadas

- [How to Set Up Local HTTPS Development Environment (2025)](https://dev.to/_d7eb1c1703182e3ce1782/how-to-set-up-a-local-https-development-environment-in-2025-mkcert-guide-1h8c)
- [mkcert GitHub Repository](https://github.com/FiloSottile/mkcert/blob/master/README.md)
- [Next.js HTTPS on Localhost Guide](https://softwareengineeringstandard.com/2025/08/16/next-js-https-localhost/)
- [Setting Up SSL for Next.js 15 (GitHub Gist)](https://gist.github.com/cdnkr/7e56cfb86f255877df99f0d7a2d57d34)
- [Using HTTPS on Next.js Local Development](https://dev.to/nakib/using-https-on-next-js-local-development-server-bcd)
- [Access Next.js Dev Server with HTTPS](https://www.makeswift.com/blog/accessing-your-local-nextjs-dev-server-using-https)
- [How to Enable Local HTTPS for Development](https://blog.openreplay.com/enable-local-https-development/)
- [HTTPS on Localhost with Next.js](https://anchor.dev/blog/https-on-localhost-nextjs)

---

**¿Necesitas ayuda implementando alguna opción?** Puedo crear los archivos necesarios para ti.
