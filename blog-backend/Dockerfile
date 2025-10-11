# blog-backend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node","dist/main.js"]