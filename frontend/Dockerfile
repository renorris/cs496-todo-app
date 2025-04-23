FROM node:23

WORKDIR /app

# Install packages
COPY package*.json .
RUN npm install

# Copy project files and build
COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
