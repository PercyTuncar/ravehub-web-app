# 🔄 Flujo de Datos - Meta Pixel Ravehub

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           RAVEHUB WEB APP                                │
│                        (Next.js 15 App Router)                           │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            │ User Actions
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Browser    │    │   Browser    │    │   Server     │
│  Pixel Code  │    │   Analytics  │    │     API      │
│   (fbq())    │    │    Client    │    │   (CAPI)     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │ HTTP Request      │ Fetch API         │ HTTPS POST
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│              META FACEBOOK SERVERS                    │
│                                                       │
│  • Recibe eventos del pixel (client-side)           │
│  • Recibe eventos de CAPI (server-side)             │
│  • Deduplica usando eventID                          │
│  • Procesa Advanced Matching                         │
│  • Calcula Event Match Quality                       │
│  • Almacena para retargeting                         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 🌊 Flujo de un Evento Completo

### Ejemplo: Usuario compra entrada

```
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario llega a página de evento                            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Server Component      │
                │ /eventos/[slug]/page  │
                │                       │
                │ <EventTracking        │
                │   event={event}       │
                │   type="view" />      │
                └───────┬───────────────┘
                        │ Renders client component
                        │
                        ▼
                ┌───────────────────────┐
                │ Client Component      │
                │ EventTracking.tsx     │
                │                       │
                │ useEffect(() => {     │
                │   if (consent) {      │
                │     trackEvent()      │
                │   }                   │
                │ }, [event])           │
                └───────┬───────────────┘
                        │
                        ▼
                ┌───────────────────────┐
                │ Analytics Client      │
                │ lib/analytics/client  │
                │                       │
                │ trackMarketingEvent({ │
                │   name: 'view_content'│
                │   eventId: uuid()     │
                │   value: 50000        │
                │   currency: 'PEN'     │
                │   ...                 │
                │ })                    │
                └───────┬───────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │ Meta Pixel   │        │ TikTok Pixel │
    │ fbq('track', │        │ ttq.track()  │
    │  'ViewContent',│      │              │
    │  {...params}, │       └──────────────┘
    │  {eventID})   │
    └───────┬──────┘
            │
            │ HTTP to facebook.com/tr
            │
            ▼
    ┌─────────────────────┐
    │  Meta Servers       │
    │  • Recibe evento    │
    │  • Procesa params   │
    │  • Almacena         │
    └─────────────────────┘
```

---

## 🔐 Flujo de Advanced Matching

```
┌────────────────────────────────────────────────────────────────┐
│ Usuario hace LOGIN                                              │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  AuthContext     │
        │  setUser({       │
        │    id: 'abc123', │
        │    email: '...'  │
        │    phone: '...'  │
        │    ...           │
        │  })              │
        └────────┬─────────┘
                 │
                 │ user state updates
                 │
                 ▼
        ┌──────────────────────────────┐
        │  MarketingTracking Component │
        │                              │
        │  useEffect(() => {           │
        │    if (user && consent) {    │
        │      // Build matching data  │
        │      const matching = {      │
        │        em: user.email,       │
        │        ph: user.phone,       │
        │        fn: user.firstName,   │
        │        ln: user.lastName,    │
        │        country: user.country,│
        │        external_id: user.id  │
        │      };                      │
        │                              │
        │      // Re-init pixel        │
        │      fbq('init', PIXEL_ID,   │
        │           matching);         │
        │    }                         │
        │  }, [user, consent]);        │
        └────────┬─────────────────────┘
                 │
                 │ fbq() call
                 │
                 ▼
        ┌──────────────────────────┐
        │  Meta Pixel Library      │
        │  (fbevents.js)           │
        │                          │
        │  • Hashea datos con      │
        │    SHA-256 automático    │
        │  • Almacena en cookies   │
        │  • Envía en cada evento  │
        └────────┬─────────────────┘
                 │
                 │ HTTPS to facebook.com
                 │
                 ▼
        ┌───────────────────────────┐
        │  Meta Attribution System  │
        │                           │
        │  1. Recibe datos hasheados│
        │  2. Matchea con FB users  │
        │  3. Mejora atribución     │
        │  4. Calcula EMQ Score     │
        │     (3.0 → 6.5+)          │
        └───────────────────────────┘
```

---

## 🔄 Deduplicación Pixel + Conversions API

```
┌────────────────────────────────────────────────────────────┐
│ Usuario completa PURCHASE                                   │
└──────────────────┬─────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│ CLIENT-SIDE   │     │ SERVER-SIDE   │
│ (Browser)     │     │ (Next.js API) │
└───────┬───────┘     └───────┬───────┘
        │                     │
        │ 1. Genera UUID      │ 2. Recibe mismo UUID
        │    eventID =        │    del localStorage
        │    'evt_12345'      │    o query param
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│ fbq('track',  │     │ POST to CAPI  │
│  'Purchase',  │     │ {             │
│  {...},       │     │   event_name: │
│  {eventID:    │     │   'Purchase', │
│   'evt_12345'}│     │   event_id:   │
│ )             │     │   'evt_12345',│
│               │     │   ...         │
└───────┬───────┘     └───────┬───────┘
        │                     │
        │ ~100ms              │ ~200ms
        │                     │
        └─────────┬───────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │   Meta Servers       │
        │                      │
        │ 1. Recibe evento A   │
        │    eventID: evt_12345│
        │    source: browser   │
        │                      │
        │ 2. Recibe evento B   │
        │    eventID: evt_12345│
        │    source: server    │
        │                      │
        │ 3. Compara eventID   │
        │    ✅ SON IGUALES    │
        │                      │
        │ 4. DEDUPLICA         │
        │    Cuenta solo 1     │
        │    Usa mejor data    │
        └──────────────────────┘
```

---

## 📱 Flujo de Tracking por Página

### Homepage → Event Detail → Checkout → Purchase

```
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│  HOME  │───▶│ EVENT  │───▶│TICKETS │───▶│REGISTER│───▶│SUCCESS │
│   /    │    │/eventos│    │/entradas│   │/register│   │/purchase│
│        │    │/[slug] │    │        │    │        │    │-success │
└────┬───┘    └────┬───┘    └────┬───┘    └────┬───┘    └────┬───┘
     │             │             │             │             │
     │ PageView    │ PageView    │ PageView    │ PageView    │ PageView
     ▼             │ ViewContent │ InitCheck   │ CompReg     │ Purchase
┌─────────┐        ▼             ▼             ▼             ▼
│  Meta   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Servers │◀──│  Meta   │◀──│  Meta   │◀──│  Meta   │◀──│  Meta   │
│         │   │ Servers │   │ Servers │   │ Servers │   │ Servers │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     │             │             │             │             │
     │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼
┌────────────────────────────────────────────────────────────────┐
│              META ATTRIBUTION & ANALYTICS                       │
│                                                                 │
│  Construye perfil del usuario:                                 │
│  • Intereses (qué eventos ve)                                  │
│  • Intención (inició checkout)                                 │
│  • Comportamiento (se registró)                                │
│  • Conversión (compró)                                         │
│                                                                 │
│  Usado para:                                                   │
│  ✅ Retargeting                                                │
│  ✅ Lookalike Audiences                                        │
│  ✅ Campaign Optimization                                      │
│  ✅ Attribution Reporting                                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Event Match Quality (EMQ) Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                  META EVENT MATCH QUALITY                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ USUARIO ANÓNIMO (No Advanced Matching)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Datos enviados:                                                │
│  • IP Address                         ✅ Automático             │
│  • User Agent                         ✅ Automático             │
│  • fbp cookie (_fbp)                  ✅ Automático             │
│  • fbc cookie (_fbc) si viene de ad   🟡 Condicional           │
│  • Referrer                           ✅ Automático             │
│                                                                  │
│  EMQ Score: ~3.0-4.0                  ⚠️  BAJO                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ USUARIO LOGUEADO (Con Advanced Matching) ✨                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Datos enviados:                                                │
│  • IP Address                         ✅ Automático             │
│  • User Agent                         ✅ Automático             │
│  • fbp cookie                         ✅ Automático             │
│  • fbc cookie (si aplica)             🟡 Condicional           │
│  • Referrer                           ✅ Automático             │
│  ➕ Email (hasheado)                  ✅ Advanced Matching      │
│  ➕ Phone (hasheado)                  ✅ Advanced Matching      │
│  ➕ First Name (hasheado)             ✅ Advanced Matching      │
│  ➕ Last Name (hasheado)              ✅ Advanced Matching      │
│  ➕ Country (hasheado)                ✅ Advanced Matching      │
│  ➕ External ID (hasheado)            ✅ Advanced Matching      │
│                                                                  │
│  EMQ Score: ~6.5-8.0                  ✅ GOOD/EXCELLENT         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

                            ▼
┌────────────────────────────────────────────────────────────────┐
│                    IMPACTO EN CAMPAÑAS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EMQ Alto (>6.0):                                              │
│  ✅ Mejor atribución de conversiones                           │
│  ✅ CPM más bajo (targeting más preciso)                       │
│  ✅ Conversion rate más alto                                   │
│  ✅ Lookalike audiences más precisas                           │
│  ✅ Menos conversiones "perdidas"                              │
│                                                                 │
│  EMQ Bajo (<4.0):                                              │
│  ⚠️  Atribución menos precisa                                 │
│  ⚠️  CPM más alto                                              │
│  ⚠️  Conversion rate más bajo                                 │
│  ⚠️  Audiencias menos precisas                                │
│  ⚠️  20-40% conversiones no atribuidas                        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Cómo Meta Usa los Eventos

```
┌────────────────────────────────────────────────────────────────┐
│              DATOS QUE META CONSTRUYE DE RAVEHUB               │
└────────────────────────────────────────────────────────────────┘

Evento: ViewContent (ver evento "Resistance Lima 2024")
├─→ Intereses del usuario
│   └─→ Le gusta: techno, eventos Lima, música electrónica
│
├─→ Señal de intención
│   └─→ Está considerando comprar (warm audience)
│
└─→ Precio considerado
    └─→ Rango de precio: PEN 50,000

Evento: InitiateCheckout
├─→ Alta intención de compra
│   └─→ Usuario pasó de "me interesa" a "quiero comprar"
│
├─→ Señal de urgencia
│   └─→ Está en el checkout AHORA (hot audience)
│
└─→ Abandono potencial
    └─→ Si no compra = retarget con urgencia

Evento: CompleteRegistration
├─→ Usuario capturado
│   └─→ Tenemos su email, puede ser remarketing target
│
├─→ Calidad de usuario
│   └─→ Dispuesto a dar datos = mayor probabilidad de compra
│
└─→ Advanced Matching activado
    └─→ De aquí en adelante, EMQ > 6.0

Evento: Purchase
├─→ Conversión confirmada
│   └─→ Usuario de alto valor (comprador real)
│
├─→ Valor del cliente
│   └─→ Gastó PEN 50,000 = potential LTV alto
│
├─→ Optimización de algoritmo
│   └─→ Meta aprende qué tipo de persona compra
│
└─→ Lookalike base
    └─→ Buscar más usuarios como este

┌────────────────────────────────────────────────────────────────┐
│                    META USA ESTO PARA:                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Campaign Optimization                                      │
│     ├─→ Mostrar ads a gente similar a compradores             │
│     ├─→ Ajustar bid automáticamente                           │
│     └─→ Optimizar delivery para conversiones                  │
│                                                                 │
│  2. Audience Building                                          │
│     ├─→ Retargeting de abandonos                              │
│     ├─→ Lookalike de compradores                              │
│     └─→ Exclusión de ya compradores                           │
│                                                                 │
│  3. Attribution                                                │
│     ├─→ Qué ad generó la venta                                │
│     ├─→ Cuánto tiempo tardó en decidir                        │
│     └─→ Cuántos touchpoints fueron necesarios                 │
│                                                                 │
│  4. Reporting                                                  │
│     ├─→ ROAS (Return on Ad Spend)                             │
│     ├─→ Funnel conversion rates                               │
│     └─→ Customer acquisition cost                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Datos que Ahora Puedes Ver en Meta

### ANTES de esta implementación:
```
Meta Events Manager:
├─ PageView: 1,234
└─ [fin]
```

### DESPUÉS de esta implementación:
```
Meta Events Manager:
├─ PageView: 1,234
├─ ViewContent: 456          ← 37% ven evento específico
│   └─ content_ids: [evt_1, evt_2, ...]
│
├─ InitiateCheckout: 89      ← 19% de ViewContent van a checkout
│   └─ content_ids: [evt_1, ...]
│
├─ CompleteRegistration: 34  ← 38% de checkout se registran
│   └─ metadata: {method: 'email'}
│
└─ Purchase: 12              ← 35% de registros compran
    └─ value: 600,000 PEN total
    └─ transaction_ids: [ord_1, ord_2, ...]

FUNNEL COMPLETO VISIBLE ✅
Conversion rate end-to-end: 2.6% (12/456)
```

---

*Diagramas actualizados: 2026-08-24*
