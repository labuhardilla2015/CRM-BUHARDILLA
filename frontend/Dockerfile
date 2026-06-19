# ─── Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# En producción la API es del mismo origen (nginx hace de proxy en /api)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci

COPY packages/shared packages/shared
COPY frontend frontend

RUN npm run build -w @crm/shared && npm run build -w frontend

# ─── Runtime (nginx sirve los estáticos y hace de proxy a la API) ──────
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
