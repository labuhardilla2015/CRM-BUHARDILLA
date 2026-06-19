# ─── Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Manifiestos del monorepo (para cachear npm ci)
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci

# Código necesario
COPY packages/shared packages/shared
COPY backend backend

RUN npm run build -w @crm/shared \
 && npm run prisma:generate -w backend \
 && npm run build -w backend

# ─── Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Dependencias + cliente Prisma generado + build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/package.json ./backend/

WORKDIR /app/backend
EXPOSE 3000

# Aplica migraciones, siembra el admin (idempotente) y arranca la API
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
