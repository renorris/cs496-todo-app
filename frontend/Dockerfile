FROM node:23 AS builder

# Use /build as builder directory
WORKDIR /build

# Install packages
COPY package*.json .
RUN npm install

# Copy project files and build
COPY . .
RUN npm run build

# Nginx file server
FROM nginx:alpine

COPY --from=builder /build/dist /usr/share/nginx/html
