# akivendo — Guía de instalación paso a paso

## ¿Qué es akivendo?
Plataforma que conecta compradores con vendedores locales: zapateros, costureras, tiendas de barrio, vendedores ambulantes y mercados comunitarios. Los pedidos van directo al WhatsApp del vendedor.

---

## PASO 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Nombre: `akivendo` · Región: `South America (São Paulo)`
3. Esperar ~2 minutos

### 1.1 Ejecutar el schema SQL
1. **SQL Editor → New query**
2. Copiar TODO el contenido de `akivendo-schema.sql`
3. Pegar y ejecutar (**Run**)
4. Verificar: "Success. No rows returned"

### 1.2 Configurar Email Auth
1. **Authentication → Providers → Email** → confirmar que esté ON
2. **Authentication → URL Configuration**:
   - Site URL: `https://akivendo.vercel.app` (tu URL real de Vercel)
   - Redirect URLs: `https://akivendo.vercel.app/**`

### 1.3 Obtener credenciales
1. **Settings → API**
2. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## PASO 2 — Instalar localmente

```bash
# Descomprimir akivendo.zip y entrar a la carpeta
cd akivendo
npm install

# Crear archivo de variables de entorno
cp .env.example .env.local
```

Editar `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm run dev
# Abrir http://localhost:3000
```

---

## PASO 3 — Subir a GitHub

```bash
git init
git add .
git commit -m "feat: akivendo v1.0"

# Crear repositorio en github.com → New repository → akivendo
git remote add origin https://github.com/TU-USUARIO/akivendo.git
git branch -M main
git push -u origin main
```

---

## PASO 4 — Deploy en Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → importar `akivendo`
2. Framework: **Next.js** (automático)
3. **Environment Variables** — agregar:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `NEXT_PUBLIC_APP_URL` | `https://akivendo.vercel.app` |

4. **Deploy** → esperar ~3 minutos

---

## PASO 5 — Crear primer usuario Admin

1. Registrarte en la app con tu email
2. Confirmar el email
3. En **Supabase → SQL Editor** ejecutar:

```sql
UPDATE public.usuarios
SET rol = 'admin'
WHERE email = 'tu@email.com';
```

4. Cerrar sesión y volver a entrar → ya sos admin

---

## PASO 6 — Crear categorías de vendedores

Las categorías se crean automáticamente con el schema. Si necesitás agregar más:
1. Ir a `/admin/categorias` como admin
2. Crear con emoji y nombre

---

## Roles de usuario

| Rol | Acceso | Pantallas |
|-----|--------|-----------|
| **Comprador** | `/comprador/*` | Mapa de vendedores, pedidos, puntos, rifas |
| **Vendedor** | `/vendedor/*` | Perfil/tienda, productos, pedidos, historial |
| **Admin** | `/admin/*` | Dashboard, categorías, usuarios, rifas |

---

## Flujo completo

```
1. VENDEDOR crea cuenta → configura su tienda con WhatsApp
2. VENDEDOR activa su tienda (si es ambulante: comparte GPS)
3. COMPRADOR abre el mapa → ve los vendedores activos cerca
4. COMPRADOR elige un vendedor → ve sus productos → arma su pedido
5. Al confirmar → se abre WhatsApp con el mensaje del pedido
6. VENDEDOR recibe el pedido en WhatsApp → lo confirma al comprador
7. Al entregar → VENDEDOR marca "Entregado" en la app
8. COMPRADOR confirma recepción → gana puntos (5 pts por $1)
9. Puntos acumulados → participar en rifas o canjear productos
```

---

## Tecnologías

| Tech | Uso |
|------|-----|
| Next.js 14 | Framework React |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| Montserrat | Tipografía |
| Supabase Auth | Login con email |
| Supabase DB | PostgreSQL + RLS |
| Supabase Realtime | GPS en tiempo real + pedidos live |
| Supabase Storage | Logos de tiendas y fotos de productos |
| Leaflet.js + OSM | Mapas 100% gratuitos |
| Zustand | Estado global |
| WhatsApp API | Envío de pedidos |
| Vercel | Hosting y deploy |

---

## Niveles de lealtad (compradores)

| Nivel | Puntos | Color |
|-------|--------|-------|
| 🛍️ Comprador Frecuente | 0 - 499 | Verde |
| 🥇 Oro | 500 - 1,999 | Dorado |
| 💎 Platinum | 2,000 - 4,999 | Violeta |
| ✨ Diamante | 5,000+ | Cyan |

**5 puntos por cada $1 en compras**

---

## Estructura de carpetas

```
akivendo/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          → Login + registro comprador/vendedor
│   │   ├── (dashboard)/
│   │   │   ├── comprador/
│   │   │   │   ├── mapa/          → Mapa + tabs categorías + tarjetas
│   │   │   │   ├── pedidos/       → Historial de pedidos con estados
│   │   │   │   ├── puntos/        → Puntos, niveles, movimientos
│   │   │   │   └── rifas/         → Sorteos y rifas con tickets
│   │   │   ├── vendedor/
│   │   │   │   ├── perfil/        → Tienda, GPS, WhatsApp, logo
│   │   │   │   ├── productos/     → CRUD de productos con fotos
│   │   │   │   ├── pedidos/       → Pedidos en tiempo real + mapa
│   │   │   │   └── historial/     → Estadísticas de ventas
│   │   │   └── admin/
│   │   │       ├── metricas/      → Dashboard con KPIs
│   │   │       ├── categorias/    → CRUD de categorías de vendedores
│   │   │       ├── vendedores/    → Lista de usuarios
│   │   │       └── rifas/         → Crear y gestionar rifas
│   │   ├── api/                   → REST endpoints
│   │   ├── landing/               → Landing page pública
│   │   └── reset-password/        → Reset de contraseña
│   ├── components/
│   │   ├── ui/                    → NavBar, PageShell, Modal, Badge
│   │   ├── mapa/                  → MapaLeaflet, MiniMapa
│   │   ├── pedidos/               → ModalPedido con WhatsApp
│   │   └── comprador/             → MapaCompradorView
│   ├── lib/
│   │   ├── supabase/              → Client, server, middleware
│   │   ├── hooks/                 → useUbicacion, usePedidos
│   │   ├── types/                 → Tipos TypeScript
│   │   ├── utils/                 → formatPrecio, abrirWhatsApp, etc.
│   │   └── constants/             → Niveles, categorías, config
│   └── store/                     → Zustand (auth, mapa, tienda)
├── akivendo-schema.sql            → Schema completo con RLS y triggers
└── INSTRUCCIONES.md               → Este archivo
```
