Below is a **clean documentation of everything you just did** so you can reuse it for future projects or team onboarding. I wrote it like real project documentation. 🚀

---

# Velo Admin Deployment & CI/CD Documentation

## Project

**Velo Admin Dashboard**

Repository:
GitHub → `velocouriersvc/velo-admin`

Server Provider: Contabo VPS
Server OS: Ubuntu 24.04

Server Public IP:

```
38.242.149.20
```

Frontend Runtime:

```
Docker + Nginx
```

CI/CD System:

```
GitHub Actions
```

---

# 1. Initial Server Setup

SSH into the server:

```bash
ssh devkojo@38.242.149.20
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

Navigate to apps directory:

```bash
mkdir -p ~/apps
cd ~/apps
```

Clone the repository:

```bash
git clone git@github.com:velocouriersvc/velo-admin.git
```

Project structure:

```
apps
 └── velo-admin
      └── velo-admin
           ├── src
           ├── package.json
           ├── Dockerfile
           └── nginx.conf
```

---

# 3. Dockerizing the Frontend

The project uses **Vite**, so the production build folder is:

```
dist
```

### Dockerfile

```
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

# 4. Build Docker Image

Inside project folder:

```bash
cd ~/apps/velo-admin/velo-admin
```

Build image:

```bash
docker build -t velo-frontend:latest .
```

---

# 5. Run Docker Container

Run container:

```bash
docker run -d -p 8080:80 \
--name velo-frontend \
--restart=always \
velo-frontend:latest
```

Application URL:

```
http://38.242.149.20:8080
```

---

# 6. Setting up SSH Keys for CI/CD

Generate SSH key:

```bash
ssh-keygen -t ed25519
```

Public key location:

```
~/.ssh/id_ed25519.pub
```

Private key location:

```
~/.ssh/id_ed25519
```

---

## Add Public Key to Server

Add the key to authorized keys:

```bash
nano ~/.ssh/authorized_keys
```

Paste:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIItRh/FoSZoByd2qfHz9QQW31cAvscgl44S4BwSpdKPY devkojo@velo-prod
```

Fix permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

# 7. Test SSH Authentication

From local machine:

```bash
ssh devkojo@38.242.149.20
```

Expected result:

```
Login without password
```

---

# 8. Configure GitHub Secrets

Go to:

Repository → **Settings → Secrets and variables → Actions**

Add new secret:

```
Name: SERVER_SSH_KEY
Value: (contents of ~/.ssh/id_ed25519)
```

---

# 9. CI/CD Pipeline Setup

Create workflow folder:

```
.github/workflows
```

Create file:

```
deploy.yml
```

---

## deploy.yml

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
          host: 38.242.149.20
          username: devkojo
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: 22
          script: |
            cd ~/apps/velo-admin/velo-admin
            git pull origin main
            docker build -t velo-frontend:latest .
            docker rm -f velo-frontend || true
            docker run -d -p 8080:80 --name velo-frontend --restart=always velo-frontend:latest
```

---

# 10. Trigger Deployment

Push code:

```bash
git add .
git commit -m "deploy update"
git push
```

CI/CD pipeline will automatically:

```
1. Trigger GitHub Actions
2. SSH into server
3. Pull latest code
4. Rebuild Docker image
5. Restart container
```

---

# Deployment Flow

```
Developer Push
      │
      ▼
GitHub Repository
      │
      ▼
GitHub Actions
      │
      ▼
SSH to VPS
      │
      ▼
Docker Build
      │
      ▼
Restart Container
      │
      ▼
Live App
```

---

# Access Application

```
http://38.242.149.20:8080
```

---

# Future Improvements

Recommended production upgrades:

### 1 Reverse Proxy

Use
Nginx

To allow:

```
admin.velo.com
```

instead of IP.

---

### 2 HTTPS

Install

Certbot

for SSL certificates.

---

### 3 Docker Compose

Use

Docker Compose

to manage:

```
frontend
backend
database
nginx
```

---

### 4 Faster Deployments

Push images to

Docker Hub

instead of building on the server.

---

# Final Result

You now have:

✅ Dockerized frontend
✅ VPS deployment
✅ CI/CD pipeline
✅ Auto redeploy on push

---

If you want, I can also create a **much more advanced production architecture** for you:

* domain + SSL
* backend API container
* Postgres container
* Redis
* Nginx reverse proxy
* zero-downtime deploys

Basically the **same infrastructure used by SaaS startups**.
