# CRM · La Buhardilla del Marketing

CRM interno de la agencia. Monorepo con **backend (NestJS + Prisma + MySQL)** y **frontend (React + Vite + TypeScript + Tailwind)**.

> Estado actual: **Fase 0 (setup)** y **Fase 1 (auth/roles)** completadas.

---

## Arquitectura

```
crm-buhardilla/
├── backend/          API REST (NestJS + Prisma + MySQL + JWT)
├── frontend/         SPA (React + Vite + Tailwind)
├── packages/shared/  Tipos y enums compartidos (@crm/shared)
├── docker/           docker-compose con MySQL 8
└── docs/             Documentación
```

| Capa        | Tecnología                                            |
|-------------|-------------------------------------------------------|
| Backend     | NestJS 11 · Prisma 6 · MySQL 8 · Passport-JWT         |
| Frontend    | React 19 · Vite 6 · TypeScript · Tailwind · Zustand   |
| Auth        | JWT access (15 min) + refresh rotatorio (cookie httpOnly) |
| Seguridad   | Helmet · CORS restrictivo · bcrypt · validación DTOs  |

---

## Requisitos previos

- **Node.js ≥ 20** (tienes v24 ✅)
- **Docker Desktop** (para MySQL) — [descargar](https://www.docker.com/products/docker-desktop/)
- **Git**

---

## Puesta en marcha (local)

Desde la raíz del repo:

### 1. Instalar dependencias (todo el monorepo)
```bash
npm install
```

### 2. Compilar el paquete compartido
```bash
npm run shared:build
```

### 3. Variables de entorno
Copia los `.env.example` y ajusta lo que necesites:
```bash
cp docker/.env.example docker/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
> ⚠️ Genera secretos reales para `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` y `ENCRYPTION_KEY` en `backend/.env`.
> En Git Bash: `openssl rand -base64 48` y `openssl rand -hex 32`.

### 4. Levantar MySQL con Docker
```bash
npm run db:up      # arranca el contenedor MySQL 8 en segundo plano
```

### 5. Migrar y poblar la base de datos
```bash
cd backend
npm run prisma:generate     # genera el cliente Prisma
npm run prisma:migrate      # crea las tablas (pide nombre de migración: "init")
npm run db:seed             # crea el admin inicial + role_emails
cd ..
```

### 6. Arrancar backend + frontend a la vez
```bash
npm run dev
```
- API:      http://localhost:3000/api  (health: `/api/health`)
- Frontend: http://localhost:5173

> O por separado: `npm run backend:dev` y `npm run frontend:dev`.

---

## Credenciales iniciales (seed)

Definidas en `backend/.env`:

- **Email:** `SEED_ADMIN_EMAIL` (por defecto el tuyo)
- **Contraseña:** `SEED_ADMIN_PASSWORD` (por defecto `ChangeMe123!`)

El rol se asigna **según el email** consultando la tabla `role_emails`:
- Coincidencia por email exacto (`ana@ejemplo.com`)
- o por dominio (`@ejemplo.com`)
- Sin coincidencia → rol **TRABAJADOR**

---

## Cómo probar la Fase 1

1. Abre http://localhost:5173 → te redirige a **/login**.
2. Inicia sesión con el admin del seed → entras al **Dashboard** con tu rol.
3. Cierra sesión y prueba **/register** con otro email (será TRABAJADOR).
4. Recarga la página estando logueado: la sesión se restaura sola (refresh cookie).
5. Healthcheck del backend: `curl http://localhost:3000/api/health`.

---

## Roadmap por fases

| Fase | Módulo                         | Estado        |
|------|--------------------------------|---------------|
| 0    | Setup monorepo + Docker        | ✅ Completada |
| 1    | Auth / Roles                   | ✅ Completada |
| 2    | Reloj (fichaje + cronómetro)   | ⏳ Siguiente  |
| 3    | Clientes / Tableros Trello     | ⏳            |
| 4    | Potenciales / Presupuestos     | ⏳            |
| 5    | Notificaciones (WebSockets)    | ⏳            |
| 6    | Hardening + deploy             | ⏳            |

---

## Scripts útiles (raíz)

| Script               | Acción                                    |
|----------------------|-------------------------------------------|
| `npm run dev`        | Backend + frontend en paralelo            |
| `npm run db:up`      | Levanta MySQL (Docker)                     |
| `npm run db:down`    | Para MySQL                                 |
| `npm run db:logs`    | Logs de MySQL                              |
| `npm run shared:build` | Compila `@crm/shared`                   |
