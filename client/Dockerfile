# Client Dockerfile (React)
# --- build stage ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# --- production stage ---
FROM node:18-alpine as production
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 5173
CMD ["npm", "run", "preview"]
