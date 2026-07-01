# SolarCS Command Center — single same-origin service (Express serves the built SPA).
# Staging image. Not hardened for production customer data (see DEPLOYMENT.md).

FROM node:22-slim AS build
WORKDIR /app
# Prisma needs OpenSSL present to fetch/run its schema engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Full install (dev deps needed to build the SPA and generate the Prisma client).
RUN npm ci
# Generate the Prisma client (downloads the schema engine from the Prisma CDN).
RUN npx prisma generate
COPY . .
# Build the React SPA into ./dist.
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# Copy the app with its built SPA, generated Prisma client, and dependencies.
COPY --from=build /app ./
EXPOSE 8787
# Migrations are applied by the release command (see render.yaml), not here.
CMD ["npm", "run", "start"]
