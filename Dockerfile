# Stage 1: Build React app
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the React code and build
COPY . .

# Build-time config baked into the static bundle (Vite reads VITE_* from env).
# VITE_API_KEY must equal the backend's API_KEY, else every /admin/* call 403s.
ARG VITE_API_KEY
ARG VITE_API_BASE_URL=https://api.velocouriersvc.com/api/v1
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy Vite build output (dist)
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
