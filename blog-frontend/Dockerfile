# blog-frontend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm","run","start"]