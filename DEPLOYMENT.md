# Velo Admin Deployment & CI/CD Documentation (Production Ready)

## Project

**Velo Admin Dashboard**

Repository:
GitHub → `velocouriersvc/velo-admin`

Server Provider: Contabo VPS
Server OS: Ubuntu 24.04

Server Public IP:

```
162.35.106.11
```

Frontend Runtime:

```
Docker + Nginx
```

CI/CD System:

```
GitHub Actions
```

Domain:

```
admin.velocouriersvc.com
```

---

# 1. Initial Server Setup

SSH into the server:

```bash
ssh devkojo@162.35.106.11
```

Update packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Docker:

```bash
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
```

Verify:

```bash
docker --version
```

---

# 2. Clone the Project

```bash
mkdir -p ~/apps
cd ~/apps
git clone git@github.com:velocouriersvc/velo-admin.git
```

---

# 3. Dockerizing the Frontend

### Dockerfile

```dockerfile
# Stage 1: Build app
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

# 4. Build & Run Container

```bash
cd ~/apps/velo-admin/velo-admin

docker build -t velo-frontend:latest .

docker run -d -p 8080:80 \
--name velo-frontend \
--restart=always \
velo-frontend:latest
```

App (temporary access):

```
http://162.35.106.11:8080
```

---

# 5. Domain Configuration (DNS)

Configure DNS using your provider (e.g. Cloudflare, Namecheap):

### Add A Record

```
Type: A
Host: admin
Value: 162.35.106.11
TTL: Auto
```

Result:

```
admin.velocouriersvc.com → 162.35.106.11
```

---

# 6. Install Nginx Reverse Proxy

```bash
sudo apt install nginx -y
```

---

## Create Config

```bash
sudo nano /etc/nginx/sites-available/velo-admin
```

If paste fails, use:

```bash
cat << 'EOF' | sudo tee /etc/nginx/sites-available/velo-admin
server {
    listen 80;
    server_name admin.velocouriersvc.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

---

## Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/velo-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

# 7. Firewall Configuration

```bash
sudo ufw allow 80
sudo ufw allow 443
```

---

# 8. Test Domain (HTTP)

Open:

```
http://admin.velocouriersvc.com
```

Expected:
✅ Your app loads (via reverse proxy)

---

# 9. Enable HTTPS (SSL)

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Run:

```bash
sudo certbot --nginx -d admin.velocouriersvc.com
```

This will:

* Issue SSL certificate via Let's Encrypt
* Auto-configure Nginx
* Redirect HTTP → HTTPS
* Enable auto-renewal

---

## Verify HTTPS

```
https://admin.velocouriersvc.com
```

---

## Test Auto Renewal

```bash
sudo certbot renew --dry-run
```

---

# 10. Secure Docker Exposure (Recommended)

Limit container to localhost:

```bash
docker rm -f velo-frontend

docker run -d -p 127.0.0.1:8080:80 \
--name velo-frontend \
--restart=always \
velo-frontend:latest
```

---

# 11. CI/CD Pipeline

### GitHub Actions → `.github/workflows/deploy.yml`

```yaml
name: Deploy Velo Admin

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: 162.35.106.11
          username: devkojo
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: 22
          script: |
            cd ~/apps/velo-admin/velo-admin
            git pull origin main
            docker build -t velo-frontend:latest .
            docker rm -f velo-frontend || true
            docker run -d -p 127.0.0.1:8080:80 --name velo-frontend --restart=always velo-frontend:latest
```

---

# Deployment Flow

```
Developer Push
      │
      ▼
GitHub Actions
      │
      ▼
SSH → VPS
      │
      ▼
Docker Build
      │
      ▼
Restart Container
      │
      ▼
Live App (HTTPS)
```

---

# Final Access

```
https://admin.velocouriersvc.com
```

---

# Final Architecture

```
User
 │
 ▼
Domain (DNS)
 │
 ▼
Nginx (80/443 + SSL)
 │
 ▼
Docker Container (localhost:8080)
```

---

# Future Improvements

* Docker Compose (multi-service)
* Backend API container
* PostgreSQL
* Redis
* Cloudflare CDN & WAF
* Zero-downtime deployments
* Monitoring (Grafana + Prometheus)

---

# Final Result

✅ Domain connected
✅ HTTPS enabled
✅ Reverse proxy configured
✅ Secure container setup
✅ CI/CD automated

```
```
