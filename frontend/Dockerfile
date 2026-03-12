# =============================================================
#  FILE LOCATION: Inventry-Management-System/docker/frontend/Dockerfile
#  React + Vite dev server with hot reload
# =============================================================

FROM node:20-alpine

WORKDIR /app

# ── Install dependencies first (better layer caching) ─────────
COPY package*.json ./
RUN npm install

# ── Copy source files ─────────────────────────────────────────
COPY . .

EXPOSE 5173

# ── Start Vite dev server (accessible from Docker host) ───────
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
