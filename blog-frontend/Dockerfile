# blog-frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances en mode production
RUN npm ci --production=false

# Copier le reste du code
COPY . .

# Build l'application Next.js avec les dépendances complètes
RUN npm run build

# Nettoyer les dépendances de développement si nécessaire
RUN npm prune --production

# Exposer le port 3000 (port interne du conteneur)
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "run", "start"]