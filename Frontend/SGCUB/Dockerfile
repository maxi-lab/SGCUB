# /Frontend/SGCUB/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node
RUN npm ci

# Copiar el resto del código fuente
COPY . .

EXPOSE 5173